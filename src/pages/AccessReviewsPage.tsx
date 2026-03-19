import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { getAccessReviews, updateReviewDecision, createAuditLog } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { Bot, CheckCircle, XCircle, MinusCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Filter = "all" | "pending" | "completed";

export default function AccessReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getAccessReviews(filter);
      setReviews(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  const handleDecision = async (reviewId: string, decision: string, empName: string, systemName: string) => {
    setActing(reviewId);
    try {
      await updateReviewDecision(reviewId, decision);
      await createAuditLog({
        action: "review_completed",
        performed_by_name: user?.name ?? "Unknown",
        target_user_name: empName,
        details: `Access review decision: ${decision} for ${systemName} access.`,
        system_name: systemName,
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, decision, completed_date: new Date().toISOString().split("T")[0] }
            : r
        )
      );
      toast.success(`Access ${decision === "approve" ? "approved" : decision === "revoke" ? "revoked" : "reduced"} successfully.`);
    } catch {
      toast.error("Failed to update review.");
    } finally {
      setActing(null);
    }
  };

  const pendingCount = reviews.filter((r) => r.decision === "pending").length;

  const decisionBadge = (d: string) => {
    const map: Record<string, string> = {
      pending: "bg-warning/15 text-warning",
      approve: "bg-success/15 text-success",
      revoke: "bg-destructive/15 text-destructive",
      reduce: "bg-info/15 text-info",
    };
    return map[d] || "bg-muted text-muted-foreground";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Access Reviews</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and certify user access permissions
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1">
          {(["all", "pending", "completed"] as Filter[]).map((f) => (
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

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No {filter === "all" ? "" : filter} reviews found.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg border border-border bg-card p-5 animate-slide-in">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-card-foreground">
                        {review.employees?.name}
                      </h3>
                      <RiskBadge level={review.risk_level} />
                      {review.decision !== "pending" && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${decisionBadge(review.decision)}`}>
                          {review.decision.charAt(0).toUpperCase() + review.decision.slice(1)}d
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-mono">{review.systems?.name}</span>
                      {review.access_level && ` · ${review.access_level}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {review.due_date}
                      {review.completed_date && ` · Completed: ${review.completed_date}`}
                    </p>
                  </div>

                  {review.decision === "pending" && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleDecision(review.id, "approve", review.employees?.name, review.systems?.name)}
                        disabled={!!acting}
                        className="flex items-center gap-1.5 rounded-md bg-success/15 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/25 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        {acting === review.id ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => handleDecision(review.id, "reduce", review.employees?.name, review.systems?.name)}
                        disabled={!!acting}
                        className="flex items-center gap-1.5 rounded-md bg-info/15 px-3 py-1.5 text-xs font-medium text-info hover:bg-info/25 transition-colors disabled:opacity-50"
                      >
                        <MinusCircle className="h-3.5 w-3.5" /> Reduce
                      </button>
                      <button
                        onClick={() => handleDecision(review.id, "revoke", review.employees?.name, review.systems?.name)}
                        disabled={!!acting}
                        className="flex items-center gap-1.5 rounded-md bg-destructive/15 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/25 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Revoke
                      </button>
                    </div>
                  )}
                </div>

                {review.ai_recommendation && (
                  <div className="mt-4 rounded-md bg-muted/40 border border-border p-3 flex items-start gap-2">
                    <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-primary mb-1">AI Analysis</p>
                      <p className="text-xs text-muted-foreground">{review.ai_recommendation}</p>
                    </div>
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
