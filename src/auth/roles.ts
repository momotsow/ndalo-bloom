/**
 * Customer/admin roles (FR-4).
 *
 * These are defined at the auth boundary and consumed by the Application layer
 * for server-side authorization decisions. RBAC enforcement itself lives in the
 * Application layer; this module only defines the role vocabulary.
 */
export const ROLES = ["CUSTOMER", "ADMIN", "SUPER_ADMIN"] as const;

export type Role = (typeof ROLES)[number];

export function isAdminRole(role: Role): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
