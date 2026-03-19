import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAccessRequests, updateAccessRequest, createAuditLog } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  modified: "bg-info/15 text-info border-info/30",
  escalated: "bg-destructive/15 text-destructive border-destructive/30",
};

const typeLabels: Record<string, string> = {
  onboarding: "Onboarding",
  role_change: "Role Change",
  access_grant: "Access Grant",
  access_revoke: "Access Revoke",
  offboarding: "Offboarding",
};

const priorityColors: Record<string, string> = {
  critical: "text-destructive",
  high: "text-warning",
  normal: "text-muted-foreground",
  low: "text-muted-foreground",
};

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [acting, setActing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const isIT = user?.platform_role === "IT";
  const isCISO = user?.platform_role === "CISO";
  const isHR = user?.platform_role === "HR";
  const canAct = isIT || isCISO;

  async function load() {
    setLoading(true);
    try {
      const data = await getAccessRequests(filter !== "all" ? { status: filter } : {});
      setRequests(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (reqId: string, status: "approved" | "rejected", req: any) => {
    setActing(reqId);
    try {
      await updateAccessRequest(reqId, {
        status,
        reviewer_id: user?.platform_user_id,
        reviewer_notes: reviewNotes[reqId] || undefined,
      });
      await createAuditLog({
        action: status === "approved" ? "request_approved" : "request_rejected",
        performed_by_name: user?.name ?? "Unknown",
        target_user_name: req.employees?.name,
        details: `Request ${req.request_number} ${status} by ${user?.name}. Type: ${typeLabels[req.request_type]}.`,
        system_name: "AccessGuard",
      });
      setRequests((prev) =>
        prev.map((r) => r.id === reqId ? { ...r, status, reviewed_at: new Date().toISOString() } : r)
      );
      toast.success(`Request ${status} successfully.`);
    } catch {
      toast.error("Failed to update request.");
    } finally {
      setActing(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isHR ? "My Requests" : "Access Request Queue"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isHR
                ? "Track the status of your access requests"
                : "Review and action pending access requests"}
            </p>
          </div>
          <div className="flex gap-2">
            {isHR && (
              <Link
                to="/onboarding"
                className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                + New Request
              </Link>
            )}
            <button
              onClick={load}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 flex-wrap">
          {["pending", "approved", "rejected", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-warning/20 text-warning px-1.5 py-0.5 text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No {filter === "all" ? "" : filter} requests found.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="rounded-lg border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground shrink-0">{req.request_number}</span>
                    <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${statusColors[req.status] ?? "bg-muted text-muted-foreground"}`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                    <span className="text-xs bg-secondary text-secondary-foreground rounded px-1.5 py-0.5">
                      {typeLabels[req.request_type] ?? req.request_type}
                    </span>
                    <span className={`text-xs font-semibold ${priorityColors[req.priority] ?? ""}`}>
                      {req.priority !== "normal" && `⚡ ${req.priority.charAt(0).toUpperCase() + req.priority.slice(1)} priority`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {canAct && req.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAction(req.id, "approved", req)}
                          disabled={!!acting}
                          className="flex items-center gap-1 rounded-md bg-success/15 px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success/25 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3" />
                          {acting === req.id ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "rejected", req)}
                          disabled={!!acting}
                          className="flex items-center gap-1 rounded-md bg-destructive/15 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/25 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {expanded === req.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Summary line */}
                <div className="px-5 pb-4 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                  <span>
                    Employee:{" "}
                    <Link to={`/users/${req.employee_id}`} className="text-primary hover:underline">
                      {req.employees?.name ?? "—"}
                    </Link>
                  </span>
                  <span>Created: {new Date(req.created_at).toLocaleDateString()}</span>
                  {req.reviewed_at && <span>Reviewed: {new Date(req.reviewed_at).toLocaleDateString()}</span>}
                </div>

                {/* Expanded Details */}
                {expanded === req.id && (
                  <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-4">
                    {req.description && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p>
                        <p className="text-sm text-card-foreground">{req.description}</p>
                      </div>
                    )}

                    {req.requested_permissions && req.requested_permissions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Requested Permissions</p>
                        <div className="space-y-1">
                          {req.requested_permissions.map((p: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="text-card-foreground font-medium">{p.system_name}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="font-mono text-secondary-foreground">{p.access_level}</span>
                              {p.risk_level && (
                                <span className={`text-[10px] font-semibold ${
                                  p.risk_level === "critical" ? "text-destructive" :
                                  p.risk_level === "high" ? "text-warning" :
                                  p.risk_level === "medium" ? "text-info" : "text-success"
                                }`}>
                                  {p.risk_level.toUpperCase()}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {req.reviewer_notes && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reviewer Notes</p>
                        <p className="text-sm text-card-foreground">{req.reviewer_notes}</p>
                      </div>
                    )}

                    {canAct && req.status === "pending" && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Add Review Notes</p>
                        <textarea
                          value={reviewNotes[req.id] || ""}
                          onChange={(e) => setReviewNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          placeholder="Optional notes for this decision…"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
