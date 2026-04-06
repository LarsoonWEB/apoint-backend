import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { UserType } from '@prisma/client';
import {
  RegisterDto,
  LoginDto,
  OAuthDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ── Register ──────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_EXISTS',
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash,
        authProvider: 'email',
        userType: dto.userType === 'provider' ? UserType.PROVIDER : UserType.USER,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.userType);

    // Emit event for welcome email + verification
    this.eventEmitter.emit('user.registered', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isVerified: user.isVerified,
      },
      ...tokens,
    };
  }

  // ── Login ─────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.userType);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isVerified: user.isVerified,
      },
      ...tokens,
    };
  }

  // ── OAuth (Google / Apple) ────────────────────────────────

  async oauthLogin(provider: 'google' | 'apple', dto: OAuthDto) {
    // In production, verify the ID token with the provider's public keys
    // For MVP, we trust the token and extract claims
    // This is a placeholder — actual implementation requires google-auth-library or apple-signin-auth
    const decoded = this.decodeOAuthToken(dto.idToken);

    if (!decoded || !decoded.email) {
      throw new BadRequestException({
        code: 'INVALID_TOKEN',
        message: 'Invalid OAuth token',
      });
    }

    let user = await this.prisma.user.findUnique({
      where: { email: decoded.email.toLowerCase() },
    });

    if (!user) {
      // Create new user from OAuth
      user = await this.prisma.user.create({
        data: {
          email: decoded.email.toLowerCase(),
          firstName: decoded.firstName || decoded.email.split('@')[0],
          lastName: decoded.lastName || '',
          avatarUrl: decoded.picture,
          authProvider: provider,
          isVerified: true, // OAuth emails are pre-verified
          userType: UserType.USER,
        },
      });

      this.eventEmitter.emit('user.registered', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.userType);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isVerified: user.isVerified,
      },
      ...tokens,
    };
  }

  // ── Refresh Token ─────────────────────────────────────────

  async refreshToken(dto: RefreshTokenDto) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }

    if (new Date() > storedToken.expiresAt) {
      // Revoke expired token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired',
      });
    }

    // Rotate: revoke old token, issue new pair
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.userType,
    );

    return tokens;
  }

  // ── Logout ────────────────────────────────────────────────

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }

  // ── Forgot Password ──────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) return { message: 'If the email exists, a reset link has been sent' };

    const resetToken = uuidv4();

    // Store reset token (reuse refresh token table with special prefix)
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: `reset_${resetToken}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    this.eventEmitter.emit('auth.passwordResetRequested', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      resetToken,
    });

    return { message: 'If the email exists, a reset link has been sent' };
  }

  // ── Reset Password ───────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: `reset_${dto.token}` },
    });

    if (!storedToken || storedToken.isRevoked || new Date() > storedToken.expiresAt) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'Invalid or expired reset token',
      });
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: storedToken.userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      }),
      // Revoke all existing refresh tokens for this user
      this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    return { message: 'Password has been reset successfully' };
  }

  // ── Verify Email ──────────────────────────────────────────

  async verifyEmail(token: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: `verify_${token}` },
    });

    if (!storedToken || storedToken.isRevoked || new Date() > storedToken.expiresAt) {
      throw new BadRequestException({
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'Invalid or expired verification token',
      });
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: storedToken.userId },
        data: { isVerified: true },
      }),
      this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  // ── Private Helpers ───────────────────────────────────────

  private async generateTokens(userId: string, email: string, userType: UserType) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      userType,
    };

    const accessToken = this.jwtService.sign(payload as any, {
      expiresIn: (this.configService.get<string>('jwt.accessExpiry') || '15m') as any,
    });

    const refreshTokenValue = uuidv4();
    const refreshExpiryDays = 30;

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenValue,
        expiresAt: new Date(
          Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private decodeOAuthToken(idToken: string): any {
    // Placeholder: In production, verify with Google/Apple public keys
    // For now, decode the JWT payload without verification
    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString(),
      );
      return {
        email: payload.email,
        firstName: payload.given_name || payload.name?.split(' ')[0],
        lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' '),
        picture: payload.picture,
      };
    } catch {
      return null;
    }
  }
}
