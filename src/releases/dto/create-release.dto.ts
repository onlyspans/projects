import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReleaseStructure } from '../interfaces/release-structure.interface';
import { IsSemver } from '../validators/is-semver.validator';

export class CreateReleaseDto {
  @ApiProperty({ description: 'Release version (semver format)', example: '1.0.0' })
  @IsString()
  @IsSemver()
  version: string;

  @ApiPropertyOptional({ description: 'Changelog' })
  @IsOptional()
  @IsString()
  changelog?: string;

  @ApiPropertyOptional({ description: 'Release notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Release structure', type: Object })
  @IsOptional()
  @IsObject()
  structure?: ReleaseStructure | Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
