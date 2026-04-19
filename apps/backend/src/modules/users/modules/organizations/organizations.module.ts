import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationEntity, UserEntity } from '../../entities';
import { UsersModule } from '../../users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationEntity, UserEntity]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        
        if (!jwtSecret) {
          throw new Error('JWT_SECRET is not defined');
        }

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: 3600,
          },
        };
      },
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
