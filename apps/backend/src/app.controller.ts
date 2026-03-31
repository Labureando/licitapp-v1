import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  @Get('health')
  @ApiTags('Health')
  @ApiOperation({ summary: 'Estado del servidor' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'licitaapp-backend',
      version: '0.1.0',
      uptime: process.uptime(),
    };
  }
}