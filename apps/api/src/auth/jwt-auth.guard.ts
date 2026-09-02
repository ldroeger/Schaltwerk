// apps/api/src/auth/jwt-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { IS_PUBLIC_KEY } from "./public.decorator";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Kein Authentifizierungs-Token übermittelt.");
    }

    const token = authHeader.slice("Bearer ".length);
    try {
      const payload = this.jwt.verify(token);
      const user: AuthenticatedUser = {
        userId: payload.sub,
        email: payload.email,
        organizationId: payload.organizationId,
        role: payload.role,
      };
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException("Token ungültig oder abgelaufen.");
    }
  }
}
