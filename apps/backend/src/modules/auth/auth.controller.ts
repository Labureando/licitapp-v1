/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
  ApiHeader,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './dto';
import { CompleteSignupDto } from './dto/complete-signup.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { BruteForceCooldown, RateLimitStrict } from '../../common/decorators';

@ApiTags('Authentication')
@ApiExtraModels(LoginDto, SignupDto, CompleteSignupDto, RefreshTokenDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login - Autentica usuario con email y contraseña
   * Rate Limit: 5 requests por 15 minutos
   * Brute Force: Bloqueo de IP después de 5 intentos fallidos
   */
  @Post('login')
  @RateLimitStrict()
  @BruteForceCooldown()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login de usuario',
    description: `
      Autentica un usuario existente con email y contraseña.
      
      **Seguridad:**
      - Rate Limit: 5 intentos por 15 minutos
      - Brute Force: IP bloqueada tras 5 fallos
      - Tokens JWT de corta duración (1h access, 7d refresh)
      
      **Respuesta exitosa:**
      - access_token: JWT válido por 1 hora
      - refresh_token: JWT válido por 7 días
      - user: Datos del usuario autenticado
    `,
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PUBLIC_USER',
          isActive: true,
          createdAt: '2026-04-17T02:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta desactivada',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos de login (Rate Limit)',
  })
  @ApiHeader({
    name: 'X-RateLimit-Limit',
    required: false,
    description: 'Límite de requests permitidos',
  })
  @ApiHeader({
    name: 'X-RateLimit-Remaining',
    required: false,
    description: 'Requests restantes',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Request() request: any,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    const clientIp = this.getClientIp(request);
    return this.authService.login(loginDto, clientIp);
  }

  /**
   * Refresh Token - Genera nuevo access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar access token',
    description: `
      Genera un nuevo access token usando un refresh token válido.
      
      El refresh token se rota automáticamente en cada uso.
      Útil cuando el access token expira (después de 1 hora).
    `,
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token renovado exitosamente',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * Logout - Cierra sesión e invalida tokens
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access_token')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: `
      Invalida el refresh token e cierra la sesión del usuario.
      
      Después del logout, los tokens ya no pueden usarse.
      Es necesario hacer login nuevamente para obtener nuevos tokens.
    `,
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Logout exitoso',
    schema: {
      example: {
        message: 'Sesión cerrada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
  })
  async logout(@Body() body: RefreshTokenDto): Promise<{ message: string }> {
    return this.authService.logout(body.refresh_token);
  }

  /**
   * Me - Obtener datos del usuario autenticado
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access_token')
  @ApiOperation({
    summary: 'Obtener perfil del usuario',
    description: `
      Obtiene los datos del usuario autenticado actualmente.
      
      Requiere: JWT access token válido en Authorization header
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Datos del usuario',
    schema: {
      example: {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+34912345678',
        role: 'PUBLIC_USER',
        userPlan: 'FREE',
        isActive: true,
        createdAt: '2026-04-17T02:00:00Z',
        updatedAt: '2026-04-17T02:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o expirado',
  })
  async me(@Request() request: any): Promise<any> {
    return this.authService.getCurrentUser(request.user.id);
  }

  /**
   * Signup (Step 1) - Registra nuevo usuario
   * Rate Limit: 5 requests por 15 minutos
   * Brute Force: Bloqueo de IP después de 5 intentos fallidos
   */
  @Post('signup')
  @RateLimitStrict()
  @BruteForceCooldown()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar registro (Step 1)',
    description: `
      Inicia el proceso de registro de 2 pasos.
      
      1️⃣ **Este endpoint** crea un usuario INACTIVO y envía email de verificación
      2️⃣ El usuario debe completar el registro en POST /complete-signup/:token
      
      **Qué sucede:**
      - Se valida que el email sea único
      - Se crea usuario sin contraseña
      - Se genera token de verificación (24h de validez)
      - Se envía email con link de verificación
      
      **Seguridad:**
      - Rate Limit: 5 signups por 15 minutos por IP
      - Brute Force: IP bloqueada tras 5 fallos
      - Email de verificación requerido
    `,
  })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado, email de verificación enviado',
    schema: {
      example: {
        message: 'Se ha enviado un email a user@example.com con las instrucciones para completar tu registro. El enlace es válido por 24 horas.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Email ya registrado o datos inválidos',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit excedido',
  })
  async signup(
    @Body() signupDto: SignupDto,
    @Request() request: any,
  ): Promise<{ message: string }> {
    const clientIp = this.getClientIp(request);
    return this.authService.signup(signupDto, clientIp);
  }

  /**
   * Complete Signup (Step 2) - Completa el registro con contraseña
   * Rate Limit: 5 requests por 15 minutos
   * Brute Force: Bloqueo de IP después de 5 intentos fallidos
   */
  @Post('complete-signup/:token')
  @RateLimitStrict()
  @BruteForceCooldown()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Completar registro (Step 2)',
    description: `
      Completa el registro de 2 pasos.
      
      2️⃣ **Este endpoint** valida el token y establece la contraseña
      
      **Qué sucede:**
      - Valida que el token sea válido y no esté expirado (24h)
      - Valida que las contraseñas coincidan
      - Activa la cuenta del usuario
      - Login automático (retorna tokens JWT)
      
      **Seguridad:**
      - Contraseña se hashea con bcrypt
      - Token se elimina tras usar
      - Login automático después de registro
    `,
  })
  @ApiParam({
    name: 'token',
    description: 'Token de verificación enviado por email (válido 24 horas)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  @ApiBody({ type: CompleteSignupDto })
  @ApiResponse({
    status: 200,
    description: 'Registro completado y usuario autenticado',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'PUBLIC_USER',
          isActive: true,
          createdAt: '2026-04-17T02:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido/expirado o contraseñas no coinciden',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit excedido',
  })
  async completeSignup(
    @Param('token') token: string,
    @Body() completeSignupDto: CompleteSignupDto,
    @Request() request: any,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    const clientIp = this.getClientIp(request);
    return this.authService.completeSignup(token, completeSignupDto, clientIp);
  }

  /**
   * Google OAuth - Inicia el flujo de autenticación con Google
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Iniciar autenticación con Google',
    description: `
      Inicia el flujo OAuth 2.0 con Google.
      
      **Qué sucede:**
      - Redirige a pantalla de login de Google
      - Usuario autoriza la aplicación
      - Google redirige a /auth/google/callback
      - Se crea usuario o se loguea si ya existe
      
      **Nota:** Este endpoint hace redirect, no retorna JSON
    `,
  })
  @ApiResponse({
    status: 302,
    description: 'Redirige a Google OAuth',
  })
  googleAuth(): void {
    // Passport maneja la redirección a Google
  }

  /**
   * Google OAuth Callback - Maneja el callback de Google
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Callback de autenticación con Google',
    description: `
      Procesa el callback de Google OAuth.
      
      **Qué sucede:**
      - Google redirige aquí después de la autorización
      - Valida el perfil de Google
      - Crea usuario si no existe
      - Loguea al usuario
      - Redirige al frontend con tokens en URL
      
      **Nota:** Este endpoint hace redirect, no retorna JSON
    `,
  })
  @ApiResponse({
    status: 302,
    description: 'Redirige al frontend con tokens en URL',
  })
  @ApiResponse({
    status: 400,
    description: 'Email ya registrado sin Google o error de autenticación',
  })
  async googleAuthCallback(@Request() req: any, @Res() res: Response): Promise<void> {
    try {
      const googleProfile = req.user;
      const result = await this.authService.validateGoogleUser(googleProfile);
      const frontendRedirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?access_token=${result.access_token}&refresh_token=${result.refresh_token}`;
      res.redirect(frontendRedirectUrl);
    } catch (error) {
      const frontendErrorUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=${encodeURIComponent((error as Error).message)}`;
      res.redirect(frontendErrorUrl);
    }
  }

  private getClientIp(request: any): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const forwardedIps = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(',')[0];
      return forwardedIps.trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }
}
