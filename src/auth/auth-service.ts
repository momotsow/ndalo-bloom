import type { Role } from "./roles";

/**
 * AuthService abstraction (FR-4).
 *
 * The dependency direction is:
 *
 *   app / UI  ->  Application  ->  AuthService (this interface)  ->  Better Auth
 *
 * Better Auth is an implementation detail. Only the auth layer may import it.
 * Application features depend on this interface, never on Better Auth directly.
 *
 * SCOPE (Foundation): this is the CONTRACT only. No authentication screens, flows,
 * verification/reset UX, or account functionality are implemented here — those
 * belong to a later Authentication/Accounts Spec.
 */

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly role: Role;
}

export interface AuthSession {
  readonly user: AuthenticatedUser;
  readonly expiresAt: Date;
}

export interface AuthService {
  /** Returns the current session for a request context, or null if unauthenticated. */
  getSession(request: Request): Promise<AuthSession | null>;

  /** Convenience: the current user, or null. Guest access is always permitted. */
  getCurrentUser(request: Request): Promise<AuthenticatedUser | null>;
}
