import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { getAiInsights, resolveInsight } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { Bot, CheckCircle, AlertTriangle, TrendingUp, Users, RefreshCw, Lightbulb } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const insightTypeConfig: Record<string, { icon: typeof Bot; label: string; color: string }> = {
  anomaly: { icon: AlertTriangle, label: "Anomaly", color: "text-destructive" },
  peer_comparison: { icon: Users, label: "Peer Comparison", color: "text-warning" },
  recommendation: { icon: Lightbulb, label: "Recommendation", color: "text-info" },
};

export default function InsightsPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">("unresolved");
  const [resolving, setResolving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getAiInsights();
      setInsights(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = insights.filter((i) => {
    if (filter === "unresolved") return !i.is_resolved;
    if (filter === "resolved") return i.is_resolved;
    return true;
  });

  const handleResolve = async (id: string, title: string) => {
    setResolving(id);
    try {
      await resolveInsight(id);
      setInsights((prev) => prev.map((i) => i.id === id ? { ...i, is_resolved: true, resolved_at: new Date().toISOString() } : i));
      toast.success(`Insight resolved.`);
    } catch {
      toast.error("Failed to resolve insight.");
    } finally {
      setResolving(null);
    }
  };

  const severityCounts = {
    critical: insights.filter((i) => i.severity === "critical" && !i.is_resolved).length,
    high: insights.filter((i) => i.severity === "high" && !i.is_resolved).length,
    medium: insights.filter((i) => i.severity === "medium" && !i.is_resolved).length,
    low: insights.filter((i) => i.severity === "low" && !i.is_resolved).length,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" /> AI Insights
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Anomaly detection, behavioral analytics, and access recommendations
            </p>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {/* Summary cards */}
        {!loading && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {[
              { label: "Critical", count: severityCounts.critical, color: "border-destructive/30 bg-destructive/5 text-destructive" },
              { label: "High", count: severityCounts.high, color: "border-warning/30 bg-warning/5 text-warning" },
              { label: "Medium", count: severityCounts.medium, color: "border-info/30 bg-info/5 text-info" },
              { label: "Low / Info", count: severityCounts.low, color: "border-success/30 bg-success/5 text-success" },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg border p-4 ${s.color}`}>
                <p className="text-2xl font-bold font-mono">{s.count}</p>
                <p className="text-xs font-semibold mt-1 opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1">
          {(["unresolved", "all", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Insights List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-success mx-auto" />
            <p className="text-sm text-muted-foreground">
              {filter === "unresolved" ? "All insights resolved. Nice work!" : "No insights found."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((insight) => {
              const typeConfig = insightTypeConfig[insight.insight_type] ?? insightTypeConfig.recommendation;
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={insight.id}
                  className={`rounded-lg border border-border bg-card p-5 ${insight.is_resolved ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${typeConfig.color}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-card-foreground">{insight.title}</h3>
                          <RiskBadge level={insight.severity === "info" ? "low" : insight.severity} />
                          <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
                            {typeConfig.label}
                          </span>
                          {insight.is_resolved && (
                            <span className="text-xs bg-success/15 text-success rounded-full px-2 py-0.5">Resolved</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Employee:{" "}
                          <Link to={`/users/${insight.employee_id}`} className="text-primary hover:underline">
                            {insight.employees?.name}
                          </Link>
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">{insight.description}</p>
                        {insight.action_recommended && (
                          <div className="mt-3 flex items-start gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
                            <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-primary">{insight.action_recommended}</p>
                          </div>
                        )}
                        {insight.resolved_at && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Resolved: {new Date(insight.resolved_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {!insight.is_resolved && (
                      <button
                        onClick={() => handleResolve(insight.id, insight.title)}
                        disabled={!!resolving}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-success hover:border-success/30 hover:bg-success/10 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        {resolving === insight.id ? "…" : "Resolve"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
