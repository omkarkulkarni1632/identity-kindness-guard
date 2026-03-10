import { AppLayout } from "@/components/layout/AppLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { mockReviews } from "@/data/mock";
import { Bot, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { useState } from "react";
import { AccessReview, ReviewDecision } from "@/types/access";
import { toast } from "sonner";

const AccessReviewsPage = () => {
  const [reviews, setReviews] = useState<AccessReview[]>(mockReviews);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return r.decision === "pending";
    if (filter === "completed") return r.decision !== "pending";
    return true;
  });

  const handleDecision = (reviewId: string, decision: ReviewDecision) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, decision, completedDate: new Date().toISOString().split("T")[0] } : r
      )
    );
    toast.success(`Access ${decision === "approve" ? "approved" : decision === "revoke" ? "revoked" : "reduced"} successfully.`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Access Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and manage user access permissions</p>
        </div>

        <div className="flex gap-1">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && ` (${reviews.filter(r => r.decision === "pending").length})`}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.id} className="rounded-lg border border-border bg-card p-5 animate-slide-in">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-card-foreground">{review.userName}</h3>
                    <RiskBadge level={review.riskLevel} />
                    {review.decision !== "pending" && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        review.decision === "approve" ? "bg-success/15 text-success" :
                        review.decision === "revoke" ? "bg-destructive/15 text-destructive" :
                        "bg-info/15 text-info"
                      }`}>
                        {review.decision.charAt(0).toUpperCase() + review.decision.slice(1)}d
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-mono">{review.system}</span> · {review.permission}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reviewer: {review.reviewer} · Due: {review.dueDate}
                    {review.completedDate && ` · Completed: ${review.completedDate}`}
                  </p>
                </div>

                {review.decision === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision(review.id, "approve")}
                      className="flex items-center gap-1 rounded-md bg-success/15 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/25 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleDecision(review.id, "reduce")}
                      className="flex items-center gap-1 rounded-md bg-info/15 px-3 py-1.5 text-xs font-medium text-info hover:bg-info/25 transition-colors"
                    >
                      <MinusCircle className="h-3.5 w-3.5" /> Reduce
                    </button>
                    <button
                      onClick={() => handleDecision(review.id, "revoke")}
                      className="flex items-center gap-1 rounded-md bg-destructive/15 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/25 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Revoke
                    </button>
                  </div>
                )}
              </div>

              {review.aiRecommendation && (
                <div className="mt-4 rounded-md bg-muted/40 border border-border p-3 flex items-start gap-2">
                  <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-primary mb-1">AI Analysis</p>
                    <p className="text-xs text-muted-foreground">{review.aiRecommendation}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No reviews found.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AccessReviewsPage;
