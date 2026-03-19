import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAuditLogs } from "@/services/api";
import { Shield, UserMinus, ArrowRightLeft, ClipboardCheck, UserPlus, UserX, Key, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const actionConfig: Record<string, { label: string; icon: any; colorClass: string }> = {
  access_granted: { label: "Access Granted", icon: Shield, colorClass: "text-success" },
  access_revoked: { label: "Access Revoked", icon: UserMinus, colorClass: "text-destructive" },
  role_changed: { label: "Role Changed", icon: ArrowRightLeft, colorClass: "text-warning" },
  review_completed: { label: "Review Completed", icon: ClipboardCheck, colorClass: "text-primary" },
  user_created: { label: "User Created", icon: UserPlus, colorClass: "text-success" },
  user_disabled: { label: "User Disabled", icon: UserX, colorClass: "text-destructive" },
  request_created: { label: "Request Created", icon: Shield, colorClass: "text-info" },
  request_approved: { label: "Request Approved", icon: ClipboardCheck, colorClass: "text-success" },
  request_rejected: { label: "Request Rejected", icon: UserX, colorClass: "text-destructive" },
  risk_score_updated: { label: "Risk Updated", icon: Shield, colorClass: "text-warning" },
  permission_modified: { label: "Permission Modified", icon: Key, colorClass: "text-warning" },
  employee_offboarded: { label: "Offboarded", icon: UserMinus, colorClass: "text-destructive" },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(q?: string) {
    setLoading(true);
    try {
      const data = await getAuditLogs(q);
      setLogs(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (val.length === 0 || val.length >= 2) load(val || undefined);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Immutable audit trail of all access management actions
            </p>
          </div>
          <button onClick={() => load(search || undefined)}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <span className="text-xs text-muted-foreground">{logs.length} entries</span>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Performed By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-6 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (
                logs.map((log) => {
                  const ac = actionConfig[log.action] ?? {
                    label: log.action,
                    icon: Shield,
                    colorClass: "text-muted-foreground",
                  };
                  const Icon = ac.icon;
                  return (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${ac.colorClass}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {ac.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-card-foreground">
                        {log.target_user_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-md truncate">
                        {log.details}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {log.performed_by_name}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {!loading && logs.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No logs found.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
