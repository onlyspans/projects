import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReleaseStructure } from '../interfaces/release-structure.interface';

export class UpdateReleaseDto {
  @ApiPropertyOptional({ description: 'Snapshot ID' })
  @IsOptional()
  @IsUUID()
  snapshotId?: string;

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
