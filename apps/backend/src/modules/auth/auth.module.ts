import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../../common/common.module';

/**
 * Módulo de Autenticación
 * Maneja autenticación con JWT, login, logout, refresh token, Google OAuth y 2-step signup
 *
 * Features:
 * - Login con email/password
 * - 2-Step Signup: primero email, luego contraseña
 * - Refresh token para renovar sesiones
 * - JWT Strategy para validar tokens
 * - Google OAuth Strategy
 * - Logout con invalidación de tokens
 * - Obtener usuario autenticado
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        
        if (!jwtSecret) {
          throw new Error('JWT_SECRET is not defined');
        }

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: 3600, // 1 hora en segundos
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
