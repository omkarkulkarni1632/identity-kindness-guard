import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/StatsCard";
import { RiskBadge } from "@/components/RiskBadge";
import { JMLBadge } from "@/components/JMLBadge";
import { useAuth } from "@/lib/auth";
import { getDashboardStats, getEmployees, getAccessReviews, getAiInsights } from "@/services/api";
import { Users, ShieldAlert, Clock, ClipboardCheck, UserPlus, ArrowRightLeft, UserMinus, Bot, Inbox } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";

const RISK_COLORS = {
  critical: "hsl(0, 72%, 55%)",
  high: "hsl(38, 90%, 55%)",
  medium: "hsl(210, 80%, 55%)",
  low: "hsl(145, 60%, 45%)",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [highRiskUsers, setHighRiskUsers] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, empData, reviewData, insightData] = await Promise.all([
          getDashboardStats(),
          getEmployees(),
          getAccessReviews("pending"),
          user?.platform_role !== "HR" ? getAiInsights() : Promise.resolve([]),
        ]);
        setStats(statsData);
        setHighRiskUsers(
          empData
            ?.filter((e: any) => e.risk_level === "critical" || e.risk_level === "high")
            .slice(0, 5) ?? []
        );
        setPendingReviews(reviewData?.slice(0, 4) ?? []);
        setInsights(insightData?.filter((i: any) => !i.is_resolved).slice(0, 3) ?? []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-lg" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  const riskDistData = stats ? [
    { level: "Critical", count: stats.riskDistribution?.critical ?? 0, fill: RISK_COLORS.critical },
    { level: "High", count: stats.riskDistribution?.high ?? 0, fill: RISK_COLORS.high },
    { level: "Medium", count: stats.riskDistribution?.medium ?? 0, fill: RISK_COLORS.medium },
    { level: "Low", count: stats.riskDistribution?.low ?? 0, fill: RISK_COLORS.low },
  ] : [];

  const jmlData = stats ? [
    { name: "Active", value: (stats.totalUsers - stats.joiners - stats.movers - stats.leavers), fill: "hsl(175, 70%, 50%)" },
    { name: "Joiners", value: stats.joiners, fill: RISK_COLORS.low },
    { name: "Movers", value: stats.movers, fill: RISK_COLORS.high },
    { name: "Leavers", value: stats.leavers, fill: RISK_COLORS.critical },
  ] : [];

  const tooltipStyle = {
    backgroundColor: "hsl(220, 18%, 12%)",
    border: "1px solid hsl(220, 14%, 18%)",
    borderRadius: 8,
    color: "hsl(210, 20%, 92%)",
    fontSize: 12,
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {user?.platform_role === "HR"
              ? "HR Dashboard"
              : user?.platform_role === "IT"
              ? "IT Operations Dashboard"
              : "Security Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {" · "}Logged in as <span className="text-foreground font-medium">{user?.name}</span>
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Employees" value={stats?.totalUsers ?? 0} icon={Users}
            trend={`${stats?.activeUsers ?? 0} active`} />
          {user?.platform_role !== "HR" ? (
            <StatsCard title="High Risk Users" value={stats?.highRiskUsers ?? 0} icon={ShieldAlert}
              variant="danger" trend="Requires attention" />
          ) : (
            <StatsCard title="Pending Onboarding" value={stats?.joiners ?? 0} icon={UserPlus}
              variant="success" trend="Awaiting setup" />
          )}
          <StatsCard title="Pending Reviews" value={stats?.pendingReviews ?? 0} icon={ClipboardCheck}
            variant="default" trend="Due this cycle" />
          <StatsCard title="Pending Requests" value={stats?.pendingRequests ?? 0} icon={Inbox}
            variant="warning" trend="Awaiting approval" />
        </div>

        {/* JML Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard title="Joiners" value={stats?.joiners ?? 0} icon={UserPlus} variant="success" trend="New this month" />
          <StatsCard title="Movers" value={stats?.movers ?? 0} icon={ArrowRightLeft} variant="warning" trend="Role transitions" />
          <StatsCard title="Leavers" value={stats?.leavers ?? 0} icon={UserMinus} variant="danger" trend="Offboarding" />
        </div>

        {/* Charts — only for IT and CISO */}
        {user?.platform_role !== "HR" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={riskDistData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="level" width={65} tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {riskDistData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">JML Lifecycle Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={jmlData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                    {jmlData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-1">
                {jmlData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Row */}
        <div className={`grid gap-6 ${user?.platform_role === "CISO" ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {/* High Risk Users */}
          {user?.platform_role !== "HR" && (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-card-foreground">High Risk Users</h3>
                <Link to="/users" className="text-xs text-primary hover:underline">View all</Link>
              </div>
              {highRiskUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No high risk users</p>
              ) : (
                <div className="space-y-2">
                  {highRiskUsers.map((emp: any) => (
                    <Link key={emp.id} to={`/users/${emp.id}`}
                      className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2.5 hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}&backgroundColor=0d9488`}
                          alt={emp.name} className="h-7 w-7 rounded-full" />
                        <div>
                          <p className="text-xs font-medium text-card-foreground">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.job_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-semibold">{emp.risk_score}</span>
                        <RiskBadge level={emp.risk_level} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Reviews */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-card-foreground">
                {user?.platform_role === "HR" ? "My Recent Requests" : "Pending Access Reviews"}
              </h3>
              <Link to={user?.platform_role === "HR" ? "/requests" : "/reviews"} className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {pendingReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending reviews</p>
            ) : (
              <div className="space-y-2">
                {pendingReviews.map((review: any) => (
                  <div key={review.id} className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-card-foreground">
                          {review.employees?.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {review.systems?.name} · {review.access_level}
                        </p>
                      </div>
                      <RiskBadge level={review.risk_level} />
                    </div>
                    {review.ai_recommendation && (
                      <p className="mt-1.5 text-[10px] text-muted-foreground italic border-l-2 border-primary/30 pl-2 line-clamp-2">
                        🤖 {review.ai_recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Insights — CISO only */}
          {user?.platform_role === "CISO" && (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" /> AI Insights
                </h3>
                <Link to="/insights" className="text-xs text-primary hover:underline">View all</Link>
              </div>
              {insights.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No active insights</p>
              ) : (
                <div className="space-y-2">
                  {insights.map((insight: any) => (
                    <div key={insight.id} className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-card-foreground line-clamp-1">{insight.title}</p>
                        <RiskBadge level={insight.severity === "info" ? "low" : insight.severity} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {insight.employees?.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
