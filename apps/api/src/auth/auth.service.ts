// apps/api/src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  /**
   * Registriert einen neuen Nutzer und legt gleichzeitig eine neue
   * Organisation an, in der er OWNER ist. Der Beitritt zu einer bestehenden
   * Organisation läuft separat über eine Einladung (nicht Teil des MVP).
   */
  async register(email: string, password: string, name: string, organizationName: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("E-Mail-Adresse bereits registriert.");

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        memberships: {
          create: {
            role: "OWNER",
            organization: { create: { name: organizationName } },
          },
        },
      },
      include: { memberships: { include: { organization: true } } },
    });

    return this.issueToken(user.id, user.email, user.memberships[0].organizationId, user.memberships[0].role);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { memberships: true },
    });
    if (!user) throw new UnauthorizedException("E-Mail oder Passwort falsch.");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("E-Mail oder Passwort falsch.");

    // MVP: Nutzer ist genau einer Organisation zugeordnet -> erste Membership verwenden.
    // Ausbaustufe: Organisationsauswahl beim Login, falls mehrere Memberships bestehen.
    const membership = user.memberships[0];
    if (!membership) throw new UnauthorizedException("Nutzer ist keiner Organisation zugeordnet.");

    return this.issueToken(user.id, user.email, membership.organizationId, membership.role);
  }

  private issueToken(userId: string, email: string, organizationId: string, role?: string) {
    const payload = { sub: userId, email, organizationId, role };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: userId, email, organizationId, role },
    };
  }
}
