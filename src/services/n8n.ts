// ─────────────────────────────────────────────────────────────────────────────
// n8n Automation Service
// Sends access requests to n8n for auto-processing based on severity
// ─────────────────────────────────────────────────────────────────────────────
//
// SETUP: Replace this URL with your n8n webhook URL
// In n8n: Create workflow → Add "Webhook" trigger node → copy the URL
//
const N8N_WEBHOOK_URL = "https://omkar5453.app.n8n.cloud/webhook/accessguard-requests";
// ─────────────────────────────────────────────────────────────────────────────

export interface N8nRequestPayload {
  requestId:      string;
  requestNumber:  string;
  employeeId:     string;
  employeeName:   string;
  employeeEmail:  string;
  requestType:    string;
  priority:       string;          // "critical" | "high" | "normal" | "low"
  description:    string;
  accessDetails:  { system: string; level: string }[];
  submittedAt:    string;
  appUrl:         string;
}

export interface N8nAutoDecision {
  action:   "approved" | "rejected" | "escalate";
  reason:   string;
  ticketId?: string;
}

// ── Send request to n8n for automated processing ─────────────────────────────
export async function triggerN8nAutomation(payload: N8nRequestPayload): Promise<N8nAutoDecision | null> {
  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn("n8n webhook responded with", res.status);
      return null;
    }

    // n8n can return a decision immediately (synchronous webhook)
    const text = await res.text();
    if (text) {
      try { return JSON.parse(text) as N8nAutoDecision; }
      catch { /* n8n returned non-JSON — that's fine */ }
    }
    return null;
  } catch (err) {
    console.warn("n8n automation unavailable:", err);
    return null;
  }
}

// ── Local auto-decision logic (fallback / pre-check before n8n) ──────────────
// This runs instantly in the browser while n8n processes async.
// Rules match what you configure in your n8n workflow.
export function getLocalAutoDecision(priority: string, requestType: string): {
  canAutoApprove: boolean;
  canAutoReject:  boolean;
  reason:         string;
} {
  // LOW severity → auto-approve immediately
  if (priority === "low" && requestType !== "offboarding") {
    return {
      canAutoApprove: true,
      canAutoReject:  false,
      reason: "Low severity request — auto-approved by policy.",
    };
  }

  // NORMAL severity onboarding → auto-approve
  if (priority === "normal" && requestType === "onboarding") {
    return {
      canAutoApprove: true,
      canAutoReject:  false,
      reason: "Standard onboarding request — auto-approved by policy.",
    };
  }

  // CRITICAL severity → never auto-approve, escalate to CISO
  if (priority === "critical") {
    return {
      canAutoApprove: false,
      canAutoReject:  false,
      reason: "Critical severity — requires manual CISO review.",
    };
  }

  // HIGH severity → never auto-approve, needs IT review
  if (priority === "high") {
    return {
      canAutoApprove: false,
      canAutoReject:  false,
      reason: "High severity — requires IT team review.",
    };
  }

  // Everything else → needs review
  return {
    canAutoApprove: false,
    canAutoReject:  false,
    reason: "Requires manual review.",
  };
}

// ── Priority label helper ─────────────────────────────────────────────────────
export function getPriorityLabel(priority: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    critical: { label: "Critical",  color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
    high:     { label: "High",      color: "text-warning",     bg: "bg-warning/10 border-warning/30" },
    normal:   { label: "Normal",    color: "text-info",        bg: "bg-info/10 border-info/30" },
    low:      { label: "Low",       color: "text-success",     bg: "bg-success/10 border-success/30" },
  };
  return map[priority] ?? map["normal"];
}
