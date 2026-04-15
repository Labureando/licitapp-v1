import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { LimitsService } from './limits/limits.service';

@Module({
  providers: [PlansService, LimitsService],
  exports: [PlansService, LimitsService],
})
export class PlansModule {}
