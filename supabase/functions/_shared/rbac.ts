export type OrgRole = "owner" | "admin" | "manager" | "viewer";

export type OrgPermission = 
  | "org:read"
  | "org:update"
  | "org:delete"
  | "org:manage_members"
  | "team:read"
  | "team:invite"
  | "team:remove"
  | "team:update_role"
  | "payments:read"
  | "payments:create"
  | "payments:approve"
  | "payments:cancel"
  | "stores:read"
  | "stores:create"
  | "stores:update"
  | "stores:delete"
  | "links:read"
  | "links:create"
  | "links:update"
  | "links:delete"
  | "templates:read"
  | "templates:create"
  | "templates:update"
  | "templates:delete"
  | "contractors:read"
  | "contractors:create"
  | "contractors:update"
  | "contractors:delete"
  | "approvals:read"
  | "approvals:approve"
  | "approvals:reject"
  | "settings:read"
  | "settings:update";

const ROLE_PERMISSIONS: Record<OrgRole, OrgPermission[]> = {
  owner: [
    "org:read", "org:update", "org:delete", "org:manage_members",
    "team:read", "team:invite", "team:remove", "team:update_role",
    "payments:read", "payments:create", "payments:approve", "payments:cancel",
    "stores:read", "stores:create", "stores:update", "stores:delete",
    "links:read", "links:create", "links:update", "links:delete",
    "templates:read", "templates:create", "templates:update", "templates:delete",
    "contractors:read", "contractors:create", "contractors:update", "contractors:delete",
    "approvals:read", "approvals:approve", "approvals:reject",
    "settings:read", "settings:update",
  ],
  admin: [
    "org:read", "org:manage_members",
    "team:read", "team:invite", "team:remove", "team:update_role",
    "payments:read", "payments:create", "payments:approve", "payments:cancel",
    "stores:read", "stores:create", "stores:update", "stores:delete",
    "links:read", "links:create", "links:update", "links:delete",
    "templates:read", "templates:create", "templates:update", "templates:delete",
    "contractors:read", "contractors:create", "contractors:update", "contractors:delete",
    "approvals:read", "approvals:approve", "approvals:reject",
    "settings:read", "settings:update",
  ],
  manager: [
    "org:read",
    "team:read",
    "payments:read", "payments:create",
    "stores:read", "stores:create",
    "links:read", "links:create",
    "templates:read", "templates:create",
    "contractors:read", "contractors:create",
    "approvals:read",
  ],
  viewer: [
    "org:read",
    "team:read",
    "payments:read",
    "stores:read",
    "links:read",
    "templates:read",
    "contractors:read",
    "approvals:read",
  ],
};

export function hasPermission(role: OrgRole, permission: OrgPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: OrgRole, permissions: OrgPermission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: OrgRole, permissions: OrgPermission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export interface OrgMember {
  user_id: string;
  role: OrgRole;
  status: string;
}

export function canManageMember(managerRole: OrgRole, targetRole: OrgRole): boolean {
  if (managerRole === "owner") return true;
  if (managerRole === "admin") return targetRole !== "owner";
  if (managerRole === "manager") return targetRole === "viewer";
  return false;
}

export function canManageRole(managerRole: OrgRole, targetRole: OrgRole): boolean {
  const roleHierarchy: Record<OrgRole, number> = {
    owner: 4,
    admin: 3,
    manager: 2,
    viewer: 1,
  };
  
  return roleHierarchy[managerRole] > roleHierarchy[targetRole];
}
