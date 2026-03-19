import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { JMLBadge } from "@/components/JMLBadge";
import { getEmployee, getAccessReviews, getAuditLogs, getAiInsights, revokePermission } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Shield, Calendar, Mail, Building, UserCircle, Bot, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isHR = authUser?.platform_role === "HR";
  const isCISO = authUser?.platform_role === "CISO";

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [empData, reviewData, logData, insightData] = await Promise.all([
          getEmployee(id!),
          getAccessReviews("all"),
          getAuditLogs(),
          !isHR ? getAiInsights(id) : Promise.resolve([]),
        ]);
        setEmployee(empData);
        setReviews(reviewData?.filter((r: any) => r.employee_id === id) ?? []);
        setLogs(logData?.filter((l: any) => l.employee_id === id) ?? []);
        setInsights(insightData ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleRevoke = async (permId: string, systemName: string) => {
    if (!confirm(`Revoke access to ${systemName}?`)) return;
    try {
      await revokePermission(permId);
      setEmployee((prev: any) => ({
        ...prev,
        permissions: prev.permissions.map((p: any) =>
          p.id === permId ? { ...p, is_active: false } : p
        ),
      }));
      toast.success(`Access to ${systemName} revoked.`);
    } catch {
      toast.error("Failed to revoke permission.");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </AppLayout>
    );
  }

  if (!employee) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Employee not found.</p>
          <Link to="/users" className="mt-4 text-primary hover:underline text-sm">← Back to users</Link>
        </div>
      </AppLayout>
    );
  }

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employee.name)}&backgroundColor=0d9488`;
  const riskColor =
    employee.risk_level === "critical" ? "bg-destructive" :
    employee.risk_level === "high" ? "bg-warning" :
    employee.risk_level === "medium" ? "bg-info" : "bg-success";

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link to="/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to employees
        </Link>

        {/* Profile Header */}
        <div className="flex flex-wrap items-start gap-6 rounded-lg border border-border bg-card p-6">
          <img src={avatarUrl} alt={employee.name} className="h-16 w-16 rounded-full" />
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-card-foreground">{employee.name}</h1>
              <JMLBadge stage={employee.jml_stage} />
              {!isHR && <RiskBadge level={employee.risk_level} />}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{employee.email}</div>
              <div className="flex items-center gap-1.5"><UserCircle className="h-3.5 w-3.5" />{employee.job_title}</div>
              <div className="flex items-center gap-1.5"><Building className="h-3.5 w-3.5" />{employee.departments?.name}</div>
              <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Joined {employee.join_date}</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground font-mono">ID: {employee.employee_id}</div>
          </div>
          {/* Risk Score — hidden from HR */}
          {!isHR && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Risk Score</p>
              <p className="text-4xl font-bold font-mono text-card-foreground">{employee.risk_score}</p>
              <div className="mt-2 h-1.5 w-24 rounded-full bg-muted">
                <div className={`h-full rounded-full ${riskColor}`} style={{ width: `${Math.min(employee.risk_score, 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Credentials for HR */}
        {isHR && employee.temp_password && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
            <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Login Credentials
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Employee ID</p>
                <p className="font-mono text-sm text-card-foreground">{employee.employee_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temporary Password</p>
                <p className="font-mono text-sm text-card-foreground">{employee.temp_password}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Credential Issued</p>
                <p className="text-sm text-card-foreground">
                  {employee.credential_issued_at
                    ? new Date(employee.credential_issued_at).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Permissions — IT and CISO only */}
        {!isHR && (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Permissions ({employee.permissions?.length ?? 0})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["System", "Access Level", "Granted", "Last Used", "Risk", "Type", isCISO ? "Action" : ""].map((h) => h && (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employee.permissions?.map((p: any) => (
                    <tr key={p.id} className={`border-b border-border last:border-0 ${!p.is_active ? "opacity-40" : ""}`}>
                      <td className="px-3 py-2.5 text-sm font-medium text-card-foreground">
                        {p.systems?.name}
                        {p.systems?.is_critical && (
                          <span className="ml-1.5 text-[10px] bg-destructive/10 text-destructive border border-destructive/20 rounded px-1">CRITICAL</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-mono text-secondary-foreground">{p.access_level}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.granted_date}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {p.last_used
                          ? new Date(p.last_used).toLocaleDateString()
                          : <span className="text-warning">Never</span>}
                      </td>
                      <td className="px-3 py-2.5"><RiskBadge level={p.risk_level} /></td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.is_default ? "Role Template" : "Manual"}</td>
                      {isCISO && (
                        <td className="px-3 py-2.5">
                          {p.is_active && (
                            <button
                              onClick={() => handleRevoke(p.id, p.systems?.name)}
                              className="text-xs text-destructive hover:underline flex items-center gap-1"
                            >
                              <XCircle className="h-3 w-3" /> Revoke
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Insights — CISO only */}
        {isCISO && insights.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" /> AI Insights
            </h2>
            <div className="space-y-3">
              {insights.map((insight: any) => (
                <div key={insight.id} className="rounded-md border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-card-foreground">{insight.title}</p>
                    <RiskBadge level={insight.severity === "info" ? "low" : insight.severity} />
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                  {insight.action_recommended && (
                    <p className="mt-2 text-xs text-primary border-l-2 border-primary/30 pl-2">
                      → {insight.action_recommended}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews & Audit side by side — IT and CISO */}
        {!isHR && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-card-foreground mb-4">Access Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews for this user.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="rounded-md border border-border bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-card-foreground">
                            {r.systems?.name} · {r.access_level}
                          </p>
                          <p className="text-xs text-muted-foreground">Due: {r.due_date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <RiskBadge level={r.risk_level} />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            r.decision === "pending" ? "bg-warning/15 text-warning" :
                            r.decision === "approve" ? "bg-success/15 text-success" :
                            r.decision === "revoke" ? "bg-destructive/15 text-destructive" : "bg-info/15 text-info"
                          }`}>
                            {r.decision.charAt(0).toUpperCase() + r.decision.slice(1)}
                          </span>
                        </div>
                      </div>
                      {r.ai_recommendation && (
                        <p className="mt-2 text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 flex items-start gap-1">
                          <Bot className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                          {r.ai_recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-card-foreground mb-4">Audit History</h2>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audit logs for this user.</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log: any) => (
                    <div key={log.id} className="border-l-2 border-border pl-3 py-1">
                      <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                      <p className="text-sm text-card-foreground mt-0.5">{log.details}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">By: {log.performed_by_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
