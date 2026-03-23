import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Send, Bot, User, Loader2, Minimize2, Maximize2, Zap, Shield } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// SETUP: Replace with your Anthropic API key
// Get one free at: https://console.anthropic.com/settings/keys
// ─────────────────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = "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";
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
}

async function buildSystemContext(): Promise<string> {
  try {
    const [
      { data: employees },
      { data: permissions },
      { data: requests },
      { data: systems },
      { data: reviews },
    ] = await Promise.all([
      supabase.from("employees").select(`id, name, email, employee_id, job_title, jml_stage, status, risk_level, risk_score, departments(name), role_templates(name)`).limit(100),
      supabase.from("permissions").select(`employee_id, access_level, is_active, granted_date, employees(name, employee_id), systems(name, is_critical)`).eq("is_active", true).limit(300),
      supabase.from("access_requests").select(`request_number, request_type, status, priority, created_at, jira_ticket_key, employees(name)`).order("created_at", { ascending: false }).limit(30),
      supabase.from("systems").select("name, description, is_critical").limit(50),
      supabase.from("access_reviews").select(`decision, due_date, reviewer_name, employees(name), systems(name)`).eq("decision", "pending").limit(20),
    ]);

    const empList = (employees ?? []).map((e: any) =>
      `- ${e.name} (${e.employee_id}) | ${e.role_templates?.name ?? e.job_title} | ${e.departments?.name} | Risk: ${e.risk_level} score:${e.risk_score} | Stage: ${e.jml_stage} | Status: ${e.status}`
    ).join("\n");

    const permMap: Record<string, string[]> = {};
    (permissions ?? []).forEach((p: any) => {
      const name = p.employees?.name ?? "Unknown";
      if (!permMap[name]) permMap[name] = [];
      permMap[name].push(`${p.systems?.name}[${p.access_level}]${p.systems?.is_critical ? "⚠CRITICAL" : ""}`);
    });
    const permList = Object.entries(permMap).map(([n, p]) => `- ${n}: ${p.join(", ")}`).join("\n");
    const reqList = (requests ?? []).map((r: any) =>
      `- ${r.request_number} | ${r.request_type} | ${r.status} | priority:${r.priority} | by:${r.employees?.name}${r.jira_ticket_key ? ` | jira:${r.jira_ticket_key}` : ""}`
    ).join("\n");
    const sysList = (systems ?? []).map((s: any) => `- ${s.name}${s.is_critical ? "(CRITICAL)" : ""}`).join("\n");
    const reviewList = (reviews ?? []).map((r: any) =>
      `- ${r.employees?.name} | ${r.systems?.name} | due:${r.due_date} | reviewer:${r.reviewer_name}`
    ).join("\n");

    return `You are the AccessGuard AI — expert identity governance assistant with LIVE access to real company data.
Answer questions about employee access, permissions, risk, and requests. Be concise, use bullet points.
TODAY: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

═══ EMPLOYEES ═══
${empList || "No data"}

═══ ACTIVE PERMISSIONS (who has access to what) ═══
${permList || "No data"}

═══ RECENT ACCESS REQUESTS ═══
${reqList || "No data"}

═══ PENDING ACCESS REVIEWS ═══
${reviewList || "None"}

═══ SYSTEMS ═══
${sysList || "No data"}

RULES:
- Only use data above — never fabricate permissions
- "what access does X have?" → list all systems and levels
- "who has access to Y?" → list all employees with that access
- Flag ⚠CRITICAL system access clearly
- Mention Jira ticket key if request has one
- If data missing, say so`.trim();
  } catch {
    return "You are the AccessGuard AI assistant. Live data is temporarily unavailable.";
  }
}

async function askClaude(messages: { role: string; content: string }[], systemPrompt: string): Promise<string> {
  if (ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_API_KEY_HERE") {
    return "⚙️ Setup needed: Add your Anthropic API key in src/components/AIChatWidget.tsx\n\nGet one free at https://console.anthropic.com/settings/keys";
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) {
      if (res.status === 401) return "❌ Invalid API key. Check ANTHROPIC_API_KEY in AIChatWidget.tsx.";
      if (res.status === 429) return "⏳ Rate limit hit. Wait a moment and try again.";
      const err = await res.text();
      throw new Error(`${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text ?? "No response generated.";
  } catch (err: any) {
    return `❌ Error: ${err.message}`;
  }
}

const SUGGESTIONS = [
  "What access does Omkar have?",
  "Who has AWS Admin access?",
  "Show me all critical system users",
  "Who are the high risk employees?",
  "List all pending access reviews",
  "Which employees are being offboarded?",
];

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "👋 Hi! I'm your AccessGuard AI.\n\nI have live access to your employee and permissions data. Ask me anything:\n• \"What access does [name] have?\"\n• \"Who has admin on AWS?\"\n• \"Show me high-risk employees\"\n• \"List pending reviews\"",
    time: now(),
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState("");
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      if (!context) buildSystemContext().then(setContext);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: q, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    const ctx = context || await buildSystemContext();
    if (!context) setContext(ctx);
    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    const reply = await askClaude(history, ctx);
    setMessages(prev => [...prev, { role: "assistant", content: reply, time: now() }]);
    setLoading(false);
    if (!open) setUnread(n => n + 1);
  }

  const isConfigured = ANTHROPIC_API_KEY !== "YOUR_ANTHROPIC_API_KEY_HERE";

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-all hover:scale-110"
          title="AccessGuard AI">
          <Bot className="h-6 w-6 text-primary-foreground" />
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 pointer-events-none" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">{unread}</span>
          )}
        </button>
      )}

      {open && (
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-border bg-card shadow-2xl transition-all duration-200 ${minimized ? "h-14 w-80" : "h-[600px] w-[400px]"}`}>
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-primary px-4 py-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                <Bot className="h-4 w-4 text-primary-foreground" />
                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-primary ${isConfigured ? "bg-green-400" : "bg-yellow-400"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">AccessGuard AI</p>
                <p className="text-[10px] text-primary-foreground/70 flex items-center gap-1">
                  {loading ? <><Loader2 className="h-2.5 w-2.5 animate-spin" /> Thinking…</>
                    : isConfigured ? <><Shield className="h-2.5 w-2.5" /> Live data · Claude</>
                    : <><Zap className="h-2.5 w-2.5" /> Add API key to activate</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(m => !m)} className="rounded-md p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors">
                {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full ${msg.role === "assistant" ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                      {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                    <div className={`max-w-[82%] rounded-xl px-3 py-2 ${msg.role === "assistant" ? "bg-muted text-card-foreground rounded-tl-none" : "bg-primary text-primary-foreground rounded-tr-none"}`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={`mt-1 text-[10px] ${msg.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/60"}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2.5">
                    <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-xl rounded-tl-none bg-muted px-4 py-3">
                      <div className="flex gap-1 items-center">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.length === 1 && !loading && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">Try asking:</p>
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => send(s)}
                        className="w-full text-left rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-card-foreground hover:bg-muted hover:border-primary/30 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-border p-3 shrink-0">
                <div className="flex gap-2 items-center">
                  <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Ask about any employee's access…" disabled={loading}
                    className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                  <button onClick={() => send()} disabled={!input.trim() || loading}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-center text-[10px] text-muted-foreground">Powered by Claude · Live Supabase data</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function now() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
