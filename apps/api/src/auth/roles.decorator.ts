// apps/api/src/auth/roles.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export type Role = "OWNER" | "PLANNER" | "VIEWER";

/**
 * Beschränkt einen Endpunkt auf die angegebenen Mitgliedschafts-Rollen.
 * Ohne dieses Decorator lässt die RolesGuard jeden authentifizierten Nutzer
 * durch (z.B. für reine Lesezugriffe, die auch VIEWER erlaubt sein sollen).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
