// apps/api/src/auth/public.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
/** Markiert einen Endpunkt als von der globalen JwtAuthGuard ausgenommen (z.B. Login/Register). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
