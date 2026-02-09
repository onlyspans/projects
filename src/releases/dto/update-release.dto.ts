import { IsString, IsOptional, IsEnum, IsUUID, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReleaseStatus } from '../entities/release.entity';
import { ReleaseStructure } from '../interfaces/release-structure.interface';

export class UpdateReleaseDto {
  @ApiPropertyOptional({ enum: ReleaseStatus, description: 'Release status' })
  @IsOptional()
  @IsEnum(ReleaseStatus)
  status?: ReleaseStatus;

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
