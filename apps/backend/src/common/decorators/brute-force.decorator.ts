import { UseGuards } from '@nestjs/common';
import { BruteForceGuard } from '../guards/rate-limiting/brute-force.guard';

/**
 * Decorador para aplicar Brute Force Protection a un endpoint
 *
 * Uso:
 * @Post('login')
 * @BruteForceCooldown()
 * login(@Body() dto: LoginDto) { ... }
 */
export function BruteForceCooldown() {
  return UseGuards(BruteForceGuard);
}
