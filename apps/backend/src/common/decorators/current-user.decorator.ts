import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para obtener el ID del usuario autenticado desde el contexto del request
 * 
 * Uso:
 * @Get()
 * getProfile(@CurrentUser() userId: string) {
 *   return this.userService.findById(userId);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new Error('User ID not found in request context');
    }

    return userId;
  },
);
