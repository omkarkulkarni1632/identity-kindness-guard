import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { UserMinus, Search, AlertTriangle, Calendar, ChevronRight } from "lucide-react";

export default function OffboardingPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [exitDate, setExitDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    loadEmployees();
    loadMyRequests();
  }, []);

  async function loadEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("*, departments(name)")
      .in("status", ["active", "pending"])
      .neq("jml_stage", "leaver")
      .order("name");
    setEmployees(data || []);
  }

  async function loadMyRequests() {
    const { data } = await supabase
      .from("access_requests")
      .select("*, employees(name, email, job_title)")
      .eq("request_type", "offboarding")
      .order("created_at", { ascending: false })
      .limit(10);
    setMyRequests(data || []);
  }

  const filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit() {
    if (!selected || !exitDate) {
      toast.error("Please select an employee and exit date.");
      return;
    }
    setSubmitting(true);
    try {
      // Create offboarding request
      const { error: reqError } = await supabase
        .from("access_requests")
        .insert({
          request_number: "",
          employee_id: selected.id,
          request_type: "offboarding",
          status: "pending",
          priority: "high",
          description: reason || `Offboarding request for ${selected.name}`,
          offboarding_stage: "hr_submitted",
          exit_date: exitDate,
        });

      if (reqError) throw reqError;

      // Update employee jml_stage to leaver
      const { error: empError } = await supabase
        .from("employees")
        .update({ jml_stage: "leaver", exit_date: exitDate })
        .eq("id", selected.id);

      if (empError) throw empError;

      // Audit log
      await supabase.from("audit_logs").insert({
        action: "offboarding_initiated",
        performed_by_name: user?.name || "HR",
        target_user_name: selected.name,
        details: `Offboarding initiated for ${selected.name} (${selected.employee_id}). Exit date: ${exitDate}. Reason: ${reason || "Not specified"}`,
        system_name: "AccessGuard",
      });

      toast.success(`Offboarding request created for ${selected.name}. IT team notified.`);
      setSelected(null);
      setExitDate("");
      setReason("");
      setSearch("");
      loadMyRequests();
      loadEmployees();
    } catch (e: any) {
      toast.error("Failed to create offboarding request: " + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const stageLabel: Record<string, { label: string; color: string }> = {
    hr_submitted:  { label: "Pending IT Action",   color: "text-warning border-warning/30 bg-warning/10" },
    it_deactivated:{ label: "Pending CISO Revoke", color: "text-info border-info/30 bg-info/10" },
    ciso_revoked:  { label: "Completed",            color: "text-success border-success/30 bg-success/10" },
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <UserMinus className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Offboarding</h1>
            <p className="text-sm text-muted-foreground">Initiate employee exit and access revocation workflow</p>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">Offboarding Workflow</p>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { step: "1", role: "HR", action: "Initiate Request", color: "bg-primary" },
              { step: "2", role: "IT", action: "Deactivate Account", color: "bg-warning" },
              { step: "3", role: "CISO", action: "Revoke All Access", color: "bg-destructive" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${s.color}`}>{s.step}</div>
                  <div>
                    <p className="text-xs font-semibold text-card-foreground">{s.role}</p>
                    <p className="text-xs text-muted-foreground">{s.action}</p>
                  </div>
                </div>
                {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-5">
            <h2 className="text-sm font-semibold text-card-foreground">Initiate Offboarding Request</h2>

            {/* Employee Search */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select Employee</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Search by name, email or ID..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSelected(null); }}
                />
              </div>

              {/* Dropdown */}
              {search && !selected && (
                <div className="rounded-md border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">No active employees found</p>
                  ) : filtered.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => { setSelected(emp); setSearch(emp.name); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {emp.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.employee_id} · {emp.job_title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Employee Card */}
              {selected && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{selected.name}</p>
                      <p className="text-xs text-muted-foreground">{selected.employee_id} · {selected.job_title} · {selected.departments?.name}</p>
                      <p className="text-xs text-muted-foreground">{selected.email}</p>
                    </div>
                    <button onClick={() => { setSelected(null); setSearch(""); }} className="text-xs text-muted-foreground hover:text-destructive">✕ Clear</button>
                  </div>
                </div>
              )}
            </div>

            {/* Exit Date */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Working Day</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={exitDate}
                  onChange={e => setExitDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason for Leaving (Optional)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Resignation, contract end, termination..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                This will mark the employee as a <strong className="text-warning">Leaver</strong> and notify the IT team to deactivate their account, followed by CISO to revoke all access.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selected || !exitDate || submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <UserMinus className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Offboarding Request"}
            </button>
          </div>

          {/* Recent Offboarding Requests */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-card-foreground">Recent Offboarding Requests</h2>
            {myRequests.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No offboarding requests yet</div>
            ) : (
              <div className="space-y-3">
                {myRequests.map(req => {
                  const stage = stageLabel[req.offboarding_stage] || { label: "Pending", color: "text-warning border-warning/30 bg-warning/10" };
                  return (
                    <div key={req.id} className="rounded-md border border-border bg-muted/30 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{req.employees?.name}</p>
                          <p className="text-xs text-muted-foreground">{req.request_number} · {req.employees?.job_title}</p>
                          {req.exit_date && <p className="text-xs text-muted-foreground mt-0.5">Exit: {new Date(req.exit_date).toLocaleDateString()}</p>}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${stage.color}`}>
                          {stage.label}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-3 flex gap-1">
                        {["hr_submitted", "it_deactivated", "ciso_revoked"].map((s, i) => {
                          const stages = ["hr_submitted", "it_deactivated", "ciso_revoked"];
                          const currentIdx = stages.indexOf(req.offboarding_stage);
                          const done = i <= currentIdx;
                          return (
                            <div key={s} className={`h-1.5 flex-1 rounded-full ${done ? "bg-primary" : "bg-muted"}`} />
                          );
                        })}
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-xs text-muted-foreground">HR</span>
                        <span className="text-xs text-muted-foreground">IT</span>
                        <span className="text-xs text-muted-foreground">CISO</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
