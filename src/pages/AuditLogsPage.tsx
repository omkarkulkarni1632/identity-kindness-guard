import { AppLayout } from "@/components/layout/AppLayout";
import { mockAuditLogs } from "@/data/mock";
import { AuditAction } from "@/types/access";
import { UserPlus, UserMinus, Shield, ClipboardCheck, ArrowRightLeft, UserX } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const actionConfig: Record<AuditAction, { label: string; icon: typeof Shield; colorClass: string }> = {
  access_granted: { label: "Access Granted", icon: Shield, colorClass: "text-success" },
  access_revoked: { label: "Access Revoked", icon: UserMinus, colorClass: "text-destructive" },
  role_changed: { label: "Role Changed", icon: ArrowRightLeft, colorClass: "text-warning" },
  review_completed: { label: "Review Completed", icon: ClipboardCheck, colorClass: "text-primary" },
  user_created: { label: "User Created", icon: UserPlus, colorClass: "text-success" },
  user_disabled: { label: "User Disabled", icon: UserX, colorClass: "text-destructive" },
};

const AuditLogsPage = () => {
  const [search, setSearch] = useState("");

  const filtered = mockAuditLogs.filter(
    (l) =>
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.performedBy.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete audit trail of all access management actions</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
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
              {filtered.map((log) => {
                const ac = actionConfig[log.action];
                const Icon = ac.icon;
                return (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${ac.colorClass}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {ac.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-card-foreground">{log.userName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-md">{log.details}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{log.performedBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No logs found.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AuditLogsPage;
