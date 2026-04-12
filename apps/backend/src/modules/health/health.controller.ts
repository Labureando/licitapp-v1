import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Health check controller
 * Proporciona endpoints para verificar el estado de la aplicación
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check application health' })
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check application readiness' })
  readiness() {
    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Check application liveness' })
  liveness() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }
}
