import { IsEmail, IsUUID } from 'class-validator';

export class CreateInvitationDto {
  @IsUUID()
  organizationId: string;

  @IsEmail()
  email: string;
}
