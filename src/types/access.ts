export type RiskLevel = "critical" | "high" | "medium" | "low";
export type JMLStage = "joiner" | "mover" | "leaver" | "active";
export type ReviewDecision = "approve" | "reduce" | "revoke" | "pending";
export type AuditAction = "access_granted" | "access_revoked" | "role_changed" | "review_completed" | "user_created" | "user_disabled";

export interface Permission {
  id: string;
  system: string;
  accessLevel: string;
  grantedDate: string;
  lastUsed: string | null;
  riskLevel: RiskLevel;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  manager: string;
  jmlStage: JMLStage;
  joinDate: string;
  riskScore: number;
  riskLevel: RiskLevel;
  permissions: Permission[];
  avatar: string;
  status: "active" | "disabled";
}

export interface AccessReview {
  id: string;
  userId: string;
  userName: string;
  permission: string;
  system: string;
  riskLevel: RiskLevel;
  reviewer: string;
  decision: ReviewDecision;
  dueDate: string;
  completedDate?: string;
  aiRecommendation?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditAction;
  userId: string;
  userName: string;
  details: string;
  performedBy: string;
  system?: string;
}

export interface RoleTemplate {
  role: string;
  department: string;
  defaultPermissions: Omit<Permission, "id" | "grantedDate" | "lastUsed">[];
}
