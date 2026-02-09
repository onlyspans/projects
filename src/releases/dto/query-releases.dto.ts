import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReleaseStatus } from '../entities/release.entity';

export class QueryReleasesDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({ enum: ReleaseStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ReleaseStatus)
  status?: ReleaseStatus;

  @ApiPropertyOptional({ description: 'Search by version' })
  @IsOptional()
  @IsString()
  version?: string;
}
