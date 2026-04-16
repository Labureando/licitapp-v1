import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { InvitationEntity } from './entities/invitation.entity';
import { OrganizationEntity } from '../users/entities/organization.entity';
import { UserEntity } from '../users/entities/user.entity';
import { EmailModule } from '../../infrastructure/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvitationEntity,
      OrganizationEntity,
      UserEntity,
    ]),
    EmailModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
