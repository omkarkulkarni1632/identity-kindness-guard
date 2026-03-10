import { AppLayout } from "@/components/layout/AppLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { JMLBadge } from "@/components/JMLBadge";
import { mockUsers } from "@/data/mock";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");

  const filtered = mockUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase()) || u.department.toLowerCase().includes(search.toLowerCase());
    const matchesStage = filterStage === "all" || u.jmlStage === filterStage;
    return matchesSearch && matchesStage;
  });

  const stages = ["all", "active", "joiner", "mover", "leaver"] as const;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage user access across the organization</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users, roles, departments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex gap-1">
            {stages.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStage(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterStage === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/users/${user.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                      <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-foreground">{user.role}</td>
                  <td className="px-4 py-3 text-sm text-secondary-foreground">{user.department}</td>
                  <td className="px-4 py-3"><JMLBadge stage={user.jmlStage} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-card-foreground">{user.riskScore}</span>
                      <RiskBadge level={user.riskLevel} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{user.permissions.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No users found.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default UsersPage;
