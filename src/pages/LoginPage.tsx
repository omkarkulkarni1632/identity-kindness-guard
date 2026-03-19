import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, AlertCircle, ChevronRight, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

const DEMO_ACCOUNTS = [
  {
    role: "CISO",
    email: "ciso@acme.com",
    name: "Rachel Foster",
    description: "Full access — all dashboards, risk engine, AI insights, audit logs",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
  },
  {
    role: "IT",
    email: "it@acme.com",
    name: "James Wilson",
    description: "Approve/reject requests, manage access, provisioning",
    badge: "bg-primary/15 text-primary border-primary/30",
  },
  {
    role: "HR",
    email: "hr@acme.com",
    name: "Lisa Park",
    description: "Create employees, view credentials, track onboarding",
    badge: "bg-success/15 text-success border-success/30",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("ciso@acme.com");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
  };

  const quickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo123");
    setLoading(true);
    setError("");
    const { error } = await signIn(demoEmail, "demo123");
    setLoading(false);
    if (error) setError(error.message);
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AccessGuard</h1>
              <p className="text-sm text-muted-foreground">Identity Governance & Access Management</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick access — demo accounts</p>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                onClick={() => quickLogin(acc.email)}
                className="w-full text-left rounded-lg border border-border bg-card p-4 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-card-foreground">{acc.name}</span>
                        <span className={`text-xs border rounded-full px-2 py-0.5 font-semibold ${acc.badge}`}>{acc.role}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{acc.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Zero Trust Architecture</p>
            <p>Each role sees only what they need. HR sees credentials, not permissions. IT manages access, not risk analytics. CISO has full visibility.</p>
          </div>
        </div>

        {/* Right - Login Form */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AccessGuard</h1>
              <p className="text-xs text-muted-foreground">IGA Platform</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-card-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">Access your security dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Demo credentials</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => quickLogin(acc.email)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 ${acc.badge}`}
                >
                  {acc.role}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Password: <code className="bg-muted px-1 rounded">demo123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
