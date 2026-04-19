/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, BadRequestException, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Plan } from '../users/enums';
import { EmailTemplatesService } from '../../common/email-templates';
import { EmailService } from '../../infrastructure/email';
import { BruteForceService } from '../../common/services/brute-force.service';

/**
 * Servicio de Autenticación
 * Maneja login, refresh token, logout y obtener usuario actual
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 días en segundos
  private readonly ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hora en segundos

  // Almacenar refresh tokens invalidados (en producción usar Redis)
  private readonly invalidatedTokens = new Set<string>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly emailService: EmailService,
    private readonly bruteForceService: BruteForceService,
  ) {}

  /**
   * Login - Autentica usuario y retorna tokens
   * @param loginDto - Email y password
   * @param clientIp - IP del cliente para brute force tracking
   * @returns Access token, refresh token y datos del usuario
   */
  async login(
    loginDto: LoginDto,
    clientIp: string = 'unknown',
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    try {
      const { email, password } = loginDto;
      const sanitizedEmail = email.toLowerCase().trim();

      // 1. Buscar usuario por email (con password)
      const user = await this.usersService.findByEmailWithPassword(sanitizedEmail);

      if (!user) {
        // Registrar intento fallido
        await this.bruteForceService.recordFailedAttempt(clientIp);
        throw new UnauthorizedException('Email o contraseña incorrectos');
      }

      // 2. Validar que el usuario esté activo
      if (!user.isActive) {
        await this.bruteForceService.recordFailedAttempt(clientIp);
        throw new UnauthorizedException('La cuenta ha sido desactivada');
      }

      // 3. Validar contraseña
      const isPasswordValid = await this.usersService.validatePassword(password, user.password);

      if (!isPasswordValid) {
        await this.bruteForceService.recordFailedAttempt(clientIp);
        this.logger.warn(`Intento de login fallido para: ${sanitizedEmail} desde IP: ${clientIp}`);
        throw new UnauthorizedException('Email o contraseña incorrectos');
      }

      // 4. Login exitoso: resetear intentos
      await this.bruteForceService.resetAttempts(clientIp);

      // 5. Generar tokens
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };

      const access_token = this.jwtService.sign(payload, {
        expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s`,
      });

      const refresh_token = this.jwtService.sign(payload, {
        expiresIn: `${this.REFRESH_TOKEN_EXPIRY}s`,
      });

      // 6. Retornar usuario sin contraseña
      const { password: pwd, ...userWithoutPassword } = user;

      this.logger.log(`✅ Login exitoso para: ${user.email} desde IP: ${clientIp}`);

      return {
        access_token,
        refresh_token,
        user: userWithoutPassword,
      };
    } catch (error) {
      this.logger.error(`Error en login: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Refresh Token - Genera nuevo access token
   * @param refreshTokenDto - Token de refresco
   * @returns Nuevo access token y refresh token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    try {
      const { refresh_token } = refreshTokenDto;

      // 1. Validar que el token no esté invalidado
      if (this.invalidatedTokens.has(refresh_token)) {
        throw new UnauthorizedException('Refresh token ha sido invalidado');
      }

      // 2. Verificar y decodificar el refresh token
      let payload;
      try {
        payload = this.jwtService.verify(refresh_token);
      } catch (error) {
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }

      // 3. Generar nuevo access token
      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        isActive: payload.isActive,
      };

      const access_token = this.jwtService.sign(newPayload, {
        expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s`,
      });

      // 4. Generar nuevo refresh token (rotar)
      const new_refresh_token = this.jwtService.sign(newPayload, {
        expiresIn: `${this.REFRESH_TOKEN_EXPIRY}s`,
      });

      this.logger.log(`Token refrescado para usuario: ${payload.email}`);

      return {
        access_token,
        refresh_token: new_refresh_token,
      };
    } catch (error) {
      this.logger.error(`Error al refrescar token: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Logout - Invalida el refresh token
   * @param refresh_token - Token a invalidar
   * @returns Mensaje de éxito
   */
  async logout(refresh_token: string): Promise<{ message: string }> {
    try {
      // Agregar token a lista de invalidados
      this.invalidatedTokens.add(refresh_token);

      // En producción, guardar en Redis con expiración automática
      this.logger.log('Usuario deslogueado exitosamente');

      return { message: 'Sesión cerrada exitosamente' };
    } catch (error) {
      this.logger.error(`Error al hacer logout: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get Current User - Obtiene datos del usuario logueado
   * @param userId - ID del usuario extraído del JWT
   * @returns Datos del usuario
   */
  async getCurrentUser(userId: string): Promise<any> {
    try {
      const user = await this.usersService.findOne(userId);

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('La cuenta ha sido desactivada');
      }

      return user;
    } catch (error) {
      this.logger.error(`Error al obtener usuario actual: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Signup - Registra nuevo usuario (2-step: primero email, luego contraseña)
   * @param signupDto - Email, firstName, lastName, phone?, timezone?
   * @param clientIp - IP del cliente para brute force tracking
   * @returns Mensaje confirmando que se envió el email de verificación
   */
  async signup(
    signupDto: any,
    clientIp: string = 'unknown',
  ): Promise<{ message: string }> {
    try {
      const { email, firstName, lastName, phone, timezone } = signupDto;

      // 1. Crear usuario incompleto (sin contraseña, inactivo)
      const newUser = await this.usersService.createIncompleteUser({
        email,
        firstName,
        lastName,
        phone,
        timezone,
      });

      // 2. Generar link de verificación
      const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/complete-signup/${newUser.signupToken}`;

      // 3. Enviar email de verificación
      try {
        const emailHtml = this.emailTemplatesService.getSignupVerificationTemplate(
          newUser.firstName,
          verificationLink,
          newUser.signupTokenExpiresAt!,
        );

        await this.emailService.sendEmail({
          to: newUser.email,
          subject: 'Completa tu Registro - LicitApp',
          html: emailHtml,
        });

        this.logger.log(`Email de verificación enviado a: ${newUser.email}`);
      } catch (emailError) {
        this.logger.warn(
          `Error al enviar email de verificación a ${newUser.email}: ${(emailError as Error).message}`,
        );
        // No lanzar error, el usuario fue creado, solo falló el email
      }

      return {
        message: `Se ha enviado un email a ${email} con las instrucciones para completar tu registro. El enlace es válido por 24 horas.`,
      };
    } catch (error) {
      // Registrar intento fallido en signup
      await this.bruteForceService.recordFailedAttempt(clientIp);
      this.logger.error(`Error en signup desde IP ${clientIp}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Complete Signup - Completa el 2-step signup con contraseña
   * @param token - Token enviado por email
   * @param completeSignupDto - password y passwordConfirm
   * @param clientIp - IP del cliente para brute force tracking
   * @returns Access token, refresh token y datos del usuario
   */
  async completeSignup(
    token: string,
    completeSignupDto: { password: string; passwordConfirm: string },
    clientIp: string = 'unknown',
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    try {
      const { password, passwordConfirm } = completeSignupDto;

      // 1. Completar signup con UsersService
      const user = await this.usersService.completeSignupWithPassword(
        token,
        password,
        passwordConfirm,
      );

      // 2. Signup exitoso: resetear intentos
      await this.bruteForceService.resetAttempts(clientIp);

      // 3. Generar tokens (login automático)
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      };

      const access_token = this.jwtService.sign(payload, {
        expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s`,
      });

      const refresh_token = this.jwtService.sign(payload, {
        expiresIn: `${this.REFRESH_TOKEN_EXPIRY}s`,
      });

      // 4. Retornar usuario sin contraseña
      const { password: pwd, ...userWithoutPassword } = user;

      this.logger.log(`✅ Signup completado y usuario logueado: ${user.email} desde IP: ${clientIp}`);

      return {
        access_token,
        refresh_token,
        user: userWithoutPassword,
      };
    } catch (error) {
      // Registrar intento fallido
      await this.bruteForceService.recordFailedAttempt(clientIp);
      this.logger.error(`Error al completar signup desde IP ${clientIp}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Validate Google OAuth User - Valida y autentica usuario de Google
   * Si no existe → Crea nuevo usuario con google_id
   * Si existe con google_id → Login automático
   * Si existe con email pero sin google_id → Error (solo una cuenta por persona)
   * @param googleOAuthDto - Datos de Google (id, email, firstName, lastName)
   * @returns Access token, refresh token y datos del usuario
   */
  async validateGoogleUser(googleOAuthDto: any): Promise<{
    access_token: string;
    refresh_token: string;
    user: any;
  }> {
    try {
      const { google_id, email, firstName, lastName } = googleOAuthDto;
      const sanitizedEmail = email.toLowerCase().trim();

      // 1. Buscar usuario por google_id
      let user = await this.usersService.findByGoogleId(google_id);

      if (user) {
        this.logger.log(`Login Google exitoso para: ${user.email}`);
        return this.generateTokensResponse(user);
      }

      // 2. Si no existe por google_id, buscar por email
      const existingUserByEmail = await this.usersService.findByEmail(sanitizedEmail);

      if (existingUserByEmail && !existingUserByEmail.google_id) {
        // Email existe pero sin google_id → Error (solo una cuenta por persona)
        throw new BadRequestException(
          'Esta cuenta ya existe. Por favor, inicia sesión con tu email y contraseña. No puedes vincular múltiples métodos de autenticación a la misma cuenta.',
        );
      }

      // 3. Si no existe → Crear nuevo usuario con google_id
      const newUser = await this.usersService.createUserWithGoogle({
        google_id,
        email: sanitizedEmail,
        firstName,
        lastName,
        role: undefined, // Será PUBLIC_USER por defecto
        userPlan: Plan.FREE, // Plan gratuito por defecto
      });

      this.logger.log(`Nuevo usuario creado vía Google: ${newUser.email}`);

      return this.generateTokensResponse(newUser);
    } catch (error) {
      this.logger.error(`Error en Google OAuth: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Helper - Genera tokens JWT y retorna respuesta
   * @param user - Usuario autenticado
   * @returns Access token, refresh token y datos del usuario
   */
  private generateTokensResponse(user: any): {
    access_token: string;
    refresh_token: string;
    user: any;
  } {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: `${this.ACCESS_TOKEN_EXPIRY}s`,
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: `${this.REFRESH_TOKEN_EXPIRY}s`,
    });

    // Retornar usuario sin contraseña
    const { password: pwd, ...userWithoutPassword } = user;

    return {
      access_token,
      refresh_token,
      user: userWithoutPassword,
    };
  }
}
