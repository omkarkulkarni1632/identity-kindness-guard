import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/StatsCard";
import { RiskBadge } from "@/components/RiskBadge";
import { JMLBadge } from "@/components/JMLBadge";
import { dashboardStats, riskDistribution, jmlData, mockUsers, mockReviews } from "@/data/mock";
import { Users, ShieldAlert, Clock, ClipboardCheck, UserPlus, ArrowRightLeft, UserMinus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const highRiskUsers = mockUsers.filter(u => u.riskLevel === "critical" || u.riskLevel === "high");
  const pendingReviews = mockReviews.filter(r => r.decision === "pending");

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Access governance overview — {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Users" value={dashboardStats.totalUsers} icon={Users} trend={`${dashboardStats.activeUsers} active`} />
          <StatsCard title="High Risk Users" value={dashboardStats.highRiskUsers} icon={ShieldAlert} variant="danger" trend="Requires attention" />
          <StatsCard title="Dormant Permissions" value={dashboardStats.dormantPermissions} icon={Clock} variant="warning" trend="Unused 90+ days" />
          <StatsCard title="Pending Reviews" value={dashboardStats.pendingReviews} icon={ClipboardCheck} variant="default" trend="Due this week" />
        </div>

        {/* JML Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard title="Joiners" value={dashboardStats.joiners} icon={UserPlus} variant="success" trend="New this month" />
          <StatsCard title="Movers" value={dashboardStats.movers} icon={ArrowRightLeft} variant="warning" trend="Role transitions" />
          <StatsCard title="Leavers" value={dashboardStats.leavers} icon={UserMinus} variant="danger" trend="Offboarding" />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Risk Distribution */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskDistribution} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="level" width={70} tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 92%)" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* JML Lifecycle */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">JML Lifecycle Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={jmlData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                  {jmlData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: 8, color: "hsl(210, 20%, 92%)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {jmlData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* High Risk Users */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-card-foreground">High Risk Users</h3>
              <Link to="/users" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {highRiskUsers.map((user) => (
                <Link key={user.id} to={`/users/${user.id}`} className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3 hover:bg-muted/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.role} · {user.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-card-foreground">{user.riskScore}</span>
                    <RiskBadge level={user.riskLevel} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Pending Reviews */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-card-foreground">Pending Access Reviews</h3>
              <Link to="/reviews" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {pendingReviews.map((review) => (
                <div key={review.id} className="rounded-md border border-border bg-muted/30 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">{review.system} · {review.permission}</p>
                    </div>
                    <RiskBadge level={review.riskLevel} />
                  </div>
                  {review.aiRecommendation && (
                    <p className="mt-2 text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                      🤖 {review.aiRecommendation.slice(0, 120)}…
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
