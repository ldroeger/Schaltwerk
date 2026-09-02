// apps/api/src/auth/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser } from "./jwt-auth.guard";

/** Injiziert den aus dem JWT geparsten Nutzer (siehe JwtAuthGuard) in Controller-Methoden. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
