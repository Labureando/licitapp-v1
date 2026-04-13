import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RunPlaceDto {
  @ApiProperty({
    description: 'Número máximo de páginas a scrappear (1-10)',
    example: 3,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  maxPages?: number = 3;
}
