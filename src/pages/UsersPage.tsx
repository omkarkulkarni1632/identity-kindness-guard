import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { JMLBadge } from "@/components/JMLBadge";
import { getEmployees } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import { Search, Filter, Shield, Key, Mail, Building } from "lucide-react";
import { Input } from "@/components/ui/input";

const stages = ["all", "active", "joiner", "mover", "leaver"] as const;

export default function UsersPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const isHR = user?.platform_role === "HR";

  useEffect(() => {
    getEmployees()
      .then(setEmployees)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.job_title?.toLowerCase().includes(search.toLowerCase()) ||
      e.departments?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStage = filterStage === "all" || e.jml_stage === filterStage;
    return matchSearch && matchStage;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isHR ? "Employees" : "User Access Management"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isHR
              ? "View employee credentials and onboarding status"
              : "Manage user access across the organization"}
          </p>
        </div>

        {/* Role-based visibility notice for HR */}
        {isHR && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
            <Shield className="h-4 w-4 shrink-0" />
            <span>
              <strong>HR View:</strong> You can see employee credentials and basic info.
              Permission details and risk scores are restricted to IT and CISO.
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employees…"
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
                  filterStage === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} of {employees.length}
          </span>
        </div>

        {/* HR view — credential cards */}
        {isHR ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
                ))
              : filtered.map((emp) => (
                  <div key={emp.id} className="rounded-lg border border-border bg-card p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=0d9488`}
                        alt={emp.name} className="h-10 w-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-card-foreground truncate">{emp.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{emp.job_title}</p>
                      </div>
                      <JMLBadge stage={emp.jml_stage} />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> <span className="truncate">{emp.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="h-3 w-3" /> <span>{emp.departments?.name ?? "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-[10px] font-semibold uppercase">ID</span>
                        <span className="font-mono">{emp.employee_id}</span>
                      </div>
                    </div>

                    {/* Credentials — HR only sees this */}
                    {emp.temp_password && (
                      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                          <Key className="h-3 w-3" /> Credentials
                        </div>
                        <div className="font-mono text-xs text-card-foreground">{emp.temp_password}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Issued: {emp.credential_issued_at
                            ? new Date(emp.credential_issued_at).toLocaleDateString()
                            : "—"}
                        </div>
                      </div>
                    )}

                    <div className={`text-xs px-2 py-1 rounded-full text-center font-medium ${
                      emp.status === "active"
                        ? "bg-success/15 text-success"
                        : emp.status === "pending"
                        ? "bg-warning/15 text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                    </div>
                  </div>
                ))}
          </div>
        ) : (
          /* IT / CISO table view */
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role / Dept</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="h-8 bg-muted rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : filtered.map((emp) => (
                      <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/users/${emp.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                            <img
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=0d9488`}
                              alt={emp.name} className="h-8 w-8 rounded-full"
                            />
                            <div>
                              <p className="text-sm font-medium text-card-foreground">{emp.name}</p>
                              <p className="text-xs text-muted-foreground">{emp.email}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-secondary-foreground">{emp.job_title}</p>
                          <p className="text-xs text-muted-foreground">{emp.departments?.name}</p>
                        </td>
                        <td className="px-4 py-3"><JMLBadge stage={emp.jml_stage} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-semibold text-card-foreground">{emp.risk_score}</span>
                            <RiskBadge level={emp.risk_level} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            emp.status === "active"
                              ? "bg-success/15 text-success"
                              : emp.status === "disabled"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-warning/15 text-warning"
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{emp.join_date}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">No employees found.</div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
