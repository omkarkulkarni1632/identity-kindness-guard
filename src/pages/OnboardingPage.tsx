import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getDepartments, getRoleTemplates, createEmployee, createAccessRequest, createAuditLog } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { UserPlus, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const steps = ["Employee Info", "Role & Department", "Review & Submit"];

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    job_title: "",
    department_id: "",
    role_template_id: "",
    join_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    Promise.all([getDepartments(), getRoleTemplates()]).then(([depts, roles]) => {
      setDepartments(depts ?? []);
      setRoleTemplates(roles ?? []);
    });
  }, []);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const filteredRoles = form.department_id
    ? roleTemplates.filter((r) => r.department_id === form.department_id)
    : roleTemplates;

  const selectedDept = departments.find((d) => d.id === form.department_id);
  const selectedRole = roleTemplates.find((r) => r.id === form.role_template_id);

  const canNext = () => {
    if (step === 0) return form.name && form.email && form.join_date;
    if (step === 1) return form.department_id && form.role_template_id && form.job_title;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create employee
      const employee = await createEmployee({
        name: form.name,
        email: form.email,
        department_id: form.department_id,
        role_template_id: form.role_template_id,
        job_title: form.job_title,
        join_date: form.join_date,
      });

      // Build permission list from role template defaults
      const requestedPerms = selectedRole?.default_permissions?.map((p: any) => ({
        system_name: p.system_name,
        access_level: p.access_level,
        risk_level: p.risk_level,
        is_default: true,
      })) ?? [];

      // Create access request
      const request = await createAccessRequest({
        employee_id: employee.id,
        request_type: "onboarding",
        description: form.description || `Onboarding ${form.name} as ${form.job_title} in ${selectedDept?.name}.`,
        requested_permissions: requestedPerms,
        priority: "normal",
      });

      // Log it
      await createAuditLog({
        action: "user_created",
        employee_id: employee.id,
        performed_by_name: user?.name ?? "HR",
        target_user_name: form.name,
        details: `New hire onboarded. Department: ${selectedDept?.name}, Role: ${selectedRole?.name}. Request ${request.request_number} created for IT review.`,
        system_name: "AccessGuard",
      });

      setDone({ employee, request });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create employee.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto py-16 text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-card-foreground">Employee Created</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {done.employee.name} has been onboarded and a request has been sent to IT for access provisioning.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Employee ID</span>
              <span className="font-mono font-semibold">{done.employee.employee_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Request Number</span>
              <span className="font-mono font-semibold">{done.request.request_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-warning font-semibold">Pending IT Review</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/users")}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              View Employees
            </button>
            <button
              onClick={() => { setDone(null); setStep(0); setForm({ name: "", email: "", job_title: "", department_id: "", role_template_id: "", join_date: new Date().toISOString().split("T")[0], description: "" }); }}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Add Another Employee
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Employee Onboarding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new employee record and initiate access provisioning
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < step ? "bg-success text-success-foreground" :
                i === step ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          {/* Step 0: Employee Info */}
          {step === 0 && (
            <>
              <h2 className="text-base font-semibold">Employee Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name *</label>
                  <input value={form.name} onChange={(e) => update("name", e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Jane Smith" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Work Email *</label>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="jane.smith@acme.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Start Date *</label>
                  <input type="date" value={form.join_date} onChange={(e) => update("join_date", e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </>
          )}

          {/* Step 1: Role & Department */}
          {step === 1 && (
            <>
              <h2 className="text-base font-semibold">Role & Department</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Department *</label>
                  <select
                    value={form.department_id}
                    onChange={(e) => { update("department_id", e.target.value); update("role_template_id", ""); }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select department…</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Role Template *</label>
                  <select
                    value={form.role_template_id}
                    onChange={(e) => {
                      update("role_template_id", e.target.value);
                      const role = roleTemplates.find((r) => r.id === e.target.value);
                      if (role) update("job_title", role.name);
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={!form.department_id}
                  >
                    <option value="">Select role…</option>
                    {filteredRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Job Title *</label>
                  <input value={form.job_title} onChange={(e) => update("job_title", e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. Senior Backend Engineer" />
                </div>
              </div>

              {/* Show default permissions that will be requested */}
              {selectedRole?.default_permissions?.length > 0 && (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold text-primary mb-2">
                    Default permissions to be requested for this role:
                  </p>
                  <div className="space-y-1">
                    {selectedRole.default_permissions.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-card-foreground">{p.system_name}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-mono text-secondary-foreground">{p.access_level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <>
              <h2 className="text-base font-semibold">Review & Submit</h2>
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2 text-sm">
                    <div><span className="text-muted-foreground">Name: </span><span className="font-semibold">{form.name}</span></div>
                    <div><span className="text-muted-foreground">Email: </span><span>{form.email}</span></div>
                    <div><span className="text-muted-foreground">Start Date: </span><span>{form.join_date}</span></div>
                    <div><span className="text-muted-foreground">Department: </span><span>{selectedDept?.name}</span></div>
                    <div><span className="text-muted-foreground">Role: </span><span>{selectedRole?.name}</span></div>
                    <div><span className="text-muted-foreground">Title: </span><span>{form.job_title}</span></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Additional Notes (optional)</label>
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Any special instructions or context for the IT team…" />
                </div>
                <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/20 p-3 text-xs text-warning">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  This will create a new employee record and send an access request to the IT team for review and provisioning.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-30"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
