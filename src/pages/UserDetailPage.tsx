import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { JMLBadge } from "@/components/JMLBadge";
import { mockUsers, mockReviews, mockAuditLogs } from "@/data/mock";
import { ArrowLeft, Shield, Calendar, Mail, Building, UserCircle, Bot } from "lucide-react";

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">User not found.</p>
          <Link to="/users" className="mt-4 text-primary hover:underline text-sm">← Back to users</Link>
        </div>
      </AppLayout>
    );
  }

  const userReviews = mockReviews.filter((r) => r.userId === user.id);
  const userLogs = mockAuditLogs.filter((l) => l.userId === user.id);

  const riskBarWidth = `${Math.min(user.riskScore, 100)}%`;
  const riskColor =
    user.riskLevel === "critical" ? "bg-destructive" :
    user.riskLevel === "high" ? "bg-warning" :
    user.riskLevel === "medium" ? "bg-info" : "bg-success";

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link to="/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>

        {/* Profile Header */}
        <div className="flex flex-wrap items-start gap-6 rounded-lg border border-border bg-card p-6">
          <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full" />
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-card-foreground">{user.name}</h1>
              <JMLBadge stage={user.jmlStage} />
              <RiskBadge level={user.riskLevel} />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{user.email}</div>
              <div className="flex items-center gap-1.5"><UserCircle className="h-3.5 w-3.5" />{user.role}</div>
              <div className="flex items-center gap-1.5"><Building className="h-3.5 w-3.5" />{user.department}</div>
              <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Joined {user.joinDate}</div>
            </div>
          </div>
          {/* Risk Score */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Risk Score</p>
            <p className="text-4xl font-bold font-mono text-card-foreground">{user.riskScore}</p>
            <div className="mt-2 h-1.5 w-24 rounded-full bg-muted">
              <div className={`h-full rounded-full ${riskColor} transition-all`} style={{ width: riskBarWidth }} />
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Permissions ({user.permissions.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">System</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Access Level</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Granted</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Last Used</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Risk</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Source</th>
                </tr>
              </thead>
              <tbody>
                {user.permissions.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2.5 text-sm font-medium text-card-foreground">{p.system}</td>
                    <td className="px-3 py-2.5 text-sm font-mono text-secondary-foreground">{p.accessLevel}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.grantedDate}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.lastUsed ?? <span className="text-warning">Never</span>}</td>
                    <td className="px-3 py-2.5"><RiskBadge level={p.riskLevel} /></td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.isDefault ? "Role Template" : "Manual"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reviews & Audit side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Access Reviews */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-card-foreground mb-4">Access Reviews</h2>
            {userReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews for this user.</p>
            ) : (
              <div className="space-y-3">
                {userReviews.map((r) => (
                  <div key={r.id} className="rounded-md border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{r.system} · {r.permission}</p>
                        <p className="text-xs text-muted-foreground">Reviewer: {r.reviewer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <RiskBadge level={r.riskLevel} />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          r.decision === "pending" ? "bg-warning/15 text-warning" :
                          r.decision === "approve" ? "bg-success/15 text-success" :
                          r.decision === "revoke" ? "bg-destructive/15 text-destructive" :
                          "bg-info/15 text-info"
                        }`}>
                          {r.decision.charAt(0).toUpperCase() + r.decision.slice(1)}
                        </span>
                      </div>
                    </div>
                    {r.aiRecommendation && (
                      <p className="mt-2 text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 flex items-start gap-1">
                        <Bot className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                        {r.aiRecommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit History */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-card-foreground mb-4">Audit History</h2>
            {userLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit logs for this user.</p>
            ) : (
              <div className="space-y-3">
                {userLogs.map((log) => (
                  <div key={log.id} className="border-l-2 border-border pl-3 py-1">
                    <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                    <p className="text-sm text-card-foreground mt-0.5">{log.details}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">By: {log.performedBy}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserDetailPage;
