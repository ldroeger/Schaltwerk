// apps/api/src/auth/roles.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, Role } from "./roles.decorator";

/**
 * Muss NACH JwtAuthGuard laufen (request.user.role muss bereits gesetzt sein).
 * Ohne @Roles(...)-Decorator auf dem Handler/Controller: kein Rollen-Check,
 * jeder authentifizierte Nutzer der Organisation darf zugreifen.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userRole: Role | undefined = request.user?.role;

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Diese Aktion erfordert eine der Rollen: ${requiredRoles.join(", ")}.`
      );
    }
    return true;
  }
}
