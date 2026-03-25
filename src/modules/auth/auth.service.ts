import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
    Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcryptjs';
import { DATABASE_CONNECTION } from '../database/database.provider';
import * as schema from '../../database/schema/index';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class AuthService {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async login(dto: LoginDto) {
        const [user] = await this.db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, dto.email))
            .limit(1);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.isLocked) {
            throw new ForbiddenException(
                'Account is locked. Please contact the administrator.',
            );
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            const newAttempts = user.failedLoginAttempts + 1;
            const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

            await this.db
                .update(schema.users)
                .set({
                    failedLoginAttempts: newAttempts,
                    isLocked: shouldLock,
                    lockedAt: shouldLock ? new Date() : null,
                    updatedAt: new Date(),
                })
                .where(eq(schema.users.id, user.id));

            if (shouldLock) {
                throw new ForbiddenException(
                    `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts.`,
                );
            }

            throw new UnauthorizedException(
                `Invalid credentials. ${MAX_FAILED_ATTEMPTS - newAttempts} attempt(s) remaining.`,
            );
        }

        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as StringValue,
        });

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

        await this.db
            .update(schema.users)
            .set({
                failedLoginAttempts: 0,
                isLocked: false,
                lockedAt: null,
                refreshToken: hashedRefreshToken,
                updatedAt: new Date(),
            })
            .where(eq(schema.users.id, user.id));

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                status: user.status,
            },
        };
    }

    async refresh(userId: string, incomingRefreshToken: string) {
        const [user] = await this.db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, userId))
            .limit(1);

        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Access denied');
        }

        const isValid = await bcrypt.compare(incomingRefreshToken, user.refreshToken);
        if (!isValid) {
            throw new UnauthorizedException('Refresh token is invalid or expired');
        }

        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload);

        return { accessToken };
    }

    async refreshWithToken(refreshToken: string) {
        let payload: JwtPayload;
        try {
            payload = this.jwtService.verify<JwtPayload>(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Refresh token is invalid or expired');
        }
        return this.refresh(payload.sub, refreshToken);
    }

    async logout(userId: string) {
        await this.db
            .update(schema.users)
            .set({ refreshToken: null, updatedAt: new Date() })
            .where(eq(schema.users.id, userId));

        return { message: 'Logged out successfully' };
    }
}
