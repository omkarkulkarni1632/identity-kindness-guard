import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAccessRequests, updateAccessRequest, createAuditLog } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, UserMinus, ShieldOff, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const statusColors: Record<string, string> = {
  pending:   "bg-warning/15 text-warning border-warning/30",
  approved:  "bg-success/15 text-success border-success/30",
  rejected:  "bg-destructive/15 text-destructive border-destructive/30",
  modified:  "bg-info/15 text-info border-info/30",
  escalated: "bg-destructive/15 text-destructive border-destructive/30",
};

const typeLabels: Record<string, string> = {
  onboarding:    "Onboarding",
  role_change:   "Role Change",
  access_grant:  "Access Grant",
  access_revoke: "Access Revoke",
  offboarding:   "Offboarding",
};

const priorityColors: Record<string, string> = {
  critical: "text-destructive",
  high:     "text-warning",
  normal:   "text-muted-foreground",
  low:      "text-muted-foreground",
};

const offboardingStages: Record<string, { label: string; color: string }> = {
  hr_submitted:   { label: "Step 1/3 · Awaiting IT",          color: "text-warning bg-warning/10 border-warning/30" },
  it_deactivated: { label: "Step 2/3 · Awaiting CISO Revoke",  color: "text-info bg-info/10 border-info/30" },
  ciso_revoked:   { label: "Step 3/3 · Completed",             color: "text-success bg-success/10 border-success/30" },
};

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("pending");
  const [acting, setActing]         = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const isIT   = user?.platform_role === "IT";
  const isCISO = user?.platform_role === "CISO";
  const isHR   = user?.platform_role === "HR";
  const canAct = isIT || isCISO;

  async function load() {
    setLoading(true);
    try {
      const data = await getAccessRequests(filter !== "all" ? { status: filter } : {});
      setRequests(data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filter]);

  /* ── Standard approve / reject ── */
  const handleAction = async (reqId: string, status: "approved" | "rejected", req: any) => {
    setActing(reqId);
    try {
      await updateAccessRequest(reqId, { status, reviewer_notes: reviewNotes[reqId] || undefined });
      await createAuditLog({
        action: status === "approved" ? "request_approved" : "request_rejected",
        performed_by_name: user?.name ?? "Unknown",
        target_user_name:  req.employees?.name,
        details: `Request ${req.request_number} ${status} by ${user?.name}.`,
        system_name: "AccessGuard",
      });
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status } : r));
      toast.success(`Request ${status} successfully.`);
    } catch { toast.error("Failed to update request."); }
    finally { setActing(null); }
  };

  /* ── IT: Deactivate account (offboarding step 2) ── */
  const handleITDeactivate = async (req: any) => {
    setActing(req.id);
    try {
      await supabase.from("employees").update({ status: "disabled" }).eq("id", req.employee_id);
      await supabase.from("permissions").update({ is_active: false }).eq("employee_id", req.employee_id);
      await supabase.from("access_requests").update({
        offboarding_stage: "it_deactivated",
        it_action_at:      new Date().toISOString(),
        it_action_by:      user?.name,
        reviewer_notes:    reviewNotes[req.id] || null,
        reviewed_at:       new Date().toISOString(),
      }).eq("id", req.id);
      await createAuditLog({
        action: "account_deactivated",
        performed_by_name: user?.name ?? "IT",
        target_user_name:  req.employees?.name,
        details: `Account deactivated by IT (${user?.name}). All permissions disabled. Offboarding ${req.request_number} awaiting CISO.`,
        system_name: "AccessGuard",
      });
      toast.success(`Account deactivated for ${req.employees?.name}. CISO can now revoke access.`);
      load();
    } catch (e: any) { toast.error("Failed: " + e.message); }
    finally { setActing(null); }
  };

  /* ── CISO: Revoke all access (offboarding step 3) ── */
  const handleCISORevoke = async (req: any) => {
    setActing(req.id);
    try {
      await supabase.from("permissions").update({ is_active: false }).eq("employee_id", req.employee_id);
      await supabase.from("employees").update({ status: "offboarded", jml_stage: "leaver" }).eq("id", req.employee_id);
      await supabase.from("access_requests").update({
        offboarding_stage: "ciso_revoked",
        status:            "approved",
        ciso_action_at:    new Date().toISOString(),
        ciso_action_by:    user?.name,
        reviewed_at:       new Date().toISOString(),
        reviewer_notes:    reviewNotes[req.id] || "All access revoked by CISO",
      }).eq("id", req.id);
      await createAuditLog({
        action: "access_revoked",
        performed_by_name: user?.name ?? "CISO",
        target_user_name:  req.employees?.name,
        details: `All access permanently revoked by CISO (${user?.name}). Employee fully offboarded. Request ${req.request_number} complete.`,
        system_name: "Multiple Systems",
      });
      toast.success(`Offboarding complete for ${req.employees?.name}. All access revoked ✓`);
      load();
    } catch (e: any) { toast.error("Failed: " + e.message); }
    finally { setActing(null); }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  const getOffboardingAction = (req: any) => {
    if (req.request_type !== "offboarding") return null;
    if (isIT   && req.offboarding_stage === "hr_submitted")   return "deactivate";
    if (isCISO && req.offboarding_stage === "it_deactivated") return "revoke";
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isHR ? "My Requests" : "Access Request Queue"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isHR ? "Track the status of your submitted requests" : "Review and action pending access requests"}
            </p>
          </div>
          <div className="flex gap-2">
            {isHR && (
              <Link to="/offboarding" className="flex items-center gap-2 rounded-md bg-destructive/15 text-destructive px-3 py-2 text-xs font-semibold hover:bg-destructive/25 transition-colors">
                <UserMinus className="h-3.5 w-3.5" /> Offboard Employee
              </Link>
            )}
            <button onClick={load} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 flex-wrap">
          {["pending", "approved", "rejected", "all"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-warning/20 text-warning px-1.5 py-0.5 text-[10px] font-bold">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No {filter === "all" ? "" : filter} requests found.</div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const offboardingAction = getOffboardingAction(req);
              const isOffboarding = req.request_type === "offboarding";
              const stageInfo = isOffboarding && req.offboarding_stage
                ? offboardingStages[req.offboarding_stage] : null;

              return (
                <div key={req.id} className={`rounded-lg border bg-card overflow-hidden ${isOffboarding ? "border-destructive/30" : "border-border"}`}>

                  {/* Card Header */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground shrink-0">{req.request_number}</span>
                      <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${statusColors[req.status] ?? "bg-muted text-muted-foreground"}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                      <span className={`text-xs rounded px-1.5 py-0.5 font-medium ${isOffboarding ? "bg-destructive/15 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
                        {isOffboarding && <UserMinus className="inline h-3 w-3 mr-1" />}
                        {typeLabels[req.request_type] ?? req.request_type}
                      </span>
                      {stageInfo && (
                        <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${stageInfo.color}`}>
                          {stageInfo.label}
                        </span>
                      )}
                      {req.priority !== "normal" && (
                        <span className={`text-xs font-semibold ${priorityColors[req.priority] ?? ""}`}>
                          ⚡ {req.priority.charAt(0).toUpperCase() + req.priority.slice(1)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {/* Offboarding-specific actions */}
                      {offboardingAction === "deactivate" && (
                        <button onClick={() => handleITDeactivate(req)} disabled={!!acting}
                          className="flex items-center gap-1.5 rounded-md bg-warning/15 px-3 py-1.5 text-xs font-semibold text-warning hover:bg-warning/25 disabled:opacity-50 transition-colors">
                          <PowerOff className="h-3.5 w-3.5" />
                          {acting === req.id ? "Processing…" : "Deactivate Account"}
                        </button>
                      )}
                      {offboardingAction === "revoke" && (
                        <button onClick={() => handleCISORevoke(req)} disabled={!!acting}
                          className="flex items-center gap-1.5 rounded-md bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/25 disabled:opacity-50 transition-colors">
                          <ShieldOff className="h-3.5 w-3.5" />
                          {acting === req.id ? "Revoking…" : "Revoke All Access"}
                        </button>
                      )}

                      {/* Standard actions for non-offboarding */}
                      {canAct && req.status === "pending" && !isOffboarding && (
                        <>
                          <button onClick={() => handleAction(req.id, "approved", req)} disabled={!!acting}
                            className="flex items-center gap-1 rounded-md bg-success/15 px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success/25 disabled:opacity-50 transition-colors">
                            <CheckCircle className="h-3 w-3" />{acting === req.id ? "…" : "Approve"}
                          </button>
                          <button onClick={() => handleAction(req.id, "rejected", req)} disabled={!!acting}
                            className="flex items-center gap-1 rounded-md bg-destructive/15 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/25 disabled:opacity-50 transition-colors">
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </>
                      )}

                      <button onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                        {expanded === req.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Summary Line */}
                  <div className="px-5 pb-3 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                    <span>Employee: <Link to={`/users/${req.employee_id}`} className="text-primary hover:underline">{req.employees?.name ?? "—"}</Link></span>
                    <span>Created: {new Date(req.created_at).toLocaleDateString()}</span>
                    {req.exit_date && <span className="text-destructive font-medium">Exit: {new Date(req.exit_date).toLocaleDateString()}</span>}
                    {req.it_action_by   && <span className="text-success">IT: {req.it_action_by} ✓</span>}
                    {req.ciso_action_by && <span className="text-success">CISO: {req.ciso_action_by} ✓</span>}
                  </div>

                  {/* Offboarding Progress Bar */}
                  {isOffboarding && (
                    <div className="px-5 pb-4">
                      <div className="flex gap-1">
                        {["hr_submitted", "it_deactivated", "ciso_revoked"].map((s, i) => {
                          const idx = ["hr_submitted", "it_deactivated", "ciso_revoked"].indexOf(req.offboarding_stage ?? "");
                          return <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-destructive" : "bg-muted"}`} />;
                        })}
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                        <span>HR Initiated</span><span>IT Deactivated</span><span>CISO Revoked</span>
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expanded === req.id && (
                    <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-4">
                      {req.description && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p>
                          <p className="text-sm text-card-foreground">{req.description}</p>
                        </div>
                      )}
                      {req.requested_permissions?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Requested Permissions</p>
                          <div className="space-y-1">
                            {req.requested_permissions.map((p: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span className="text-card-foreground font-medium">{p.system_name}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="font-mono text-secondary-foreground">{p.access_level}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {req.reviewer_notes && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p>
                          <p className="text-sm text-card-foreground">{req.reviewer_notes}</p>
                        </div>
                      )}
                      {canAct && (req.status === "pending" || offboardingAction) && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Add Notes</p>
                          <textarea
                            value={reviewNotes[req.id] || ""}
                            onChange={e => setReviewNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                            placeholder="Optional notes…"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
