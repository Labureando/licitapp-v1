import { Injectable } from '@nestjs/common';

@Injectable()
export class UserSanitizeHelper {
  /**
   * Sanitizar email (convertir a minúsculas)
   */
  sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Sanitizar nombres (trim)
   */
  sanitizeName(name: string): string {
    return name.trim();
  }
}
