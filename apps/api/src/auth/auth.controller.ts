// apps/api/src/auth/auth.controller.ts
import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";

interface RegisterDto { email: string; password: string; name: string; organizationName: string; }
interface LoginDto { email: string; password: string; }

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name, dto.organizationName);
  }

  @Public()
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}
