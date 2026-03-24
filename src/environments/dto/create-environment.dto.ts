import { IsString, IsOptional, IsInt, Min, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnvironmentDto {
  @ApiProperty({ description: 'Display name', example: 'staging' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Global order in the catalog (pipeline order); must be unique among active environments',
    example: 1,
  })
  @IsInt()
  @Min(0)
  position: number;
}
