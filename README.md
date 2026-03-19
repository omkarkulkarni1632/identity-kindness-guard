# AccessGuard — AI-Powered Identity Governance & Access Management

A full-stack IGA platform with Joiner-Mover-Leaver lifecycle automation, risk scoring, and AI-powered access reviews.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Charts**: Recharts
- **Routing**: React Router v6

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| CISO | ciso@acme.com | demo123 |
| IT Admin | it@acme.com | demo123 |
| HR | hr@acme.com | demo123 |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080)

## Features by Role

### HR
- Create new employees (Joiner workflow)
- View employee credentials (ID + temp password)
- Track onboarding request status

### IT Admin
- Approve / reject access requests
- View all user permissions
- Manage access reviews (approve / reduce / revoke)
- Full audit log access

### CISO
- Full dashboard with risk analytics
- AI-generated insights and anomaly detection
- Complete access to all users, permissions, reviews
- Audit trail with compliance reporting

## Project Structure

```
src/
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── auth.tsx          # Auth context & demo login
│   └── utils.ts          # Utility functions
├── services/
│   └── api.ts            # All Supabase queries
├── components/
│   ├── layout/           # Sidebar, AppLayout, ProtectedRoute
│   ├── ui/               # Reusable UI primitives
│   ├── RiskBadge.tsx
│   ├── JMLBadge.tsx
│   └── StatsCard.tsx
└── pages/
    ├── LoginPage.tsx
    ├── Dashboard.tsx
    ├── UsersPage.tsx
    ├── UserDetailPage.tsx
    ├── RequestsPage.tsx
    ├── AccessReviewsPage.tsx
    ├── OnboardingPage.tsx
    ├── InsightsPage.tsx
    └── AuditLogsPage.tsx
```

## Supabase Schema

- `employees` — JML lifecycle, risk scores
- `permissions` — per-user system access
- `access_requests` — onboarding/offboarding workflows
- `access_reviews` — certification campaigns
- `audit_logs` — immutable event trail
- `ai_insights` — anomaly detection results
- `behavior_analytics` — peer comparison data
