import { IsString, IsOptional, IsEnum, IsArray, IsUUID, IsObject, IsUrl, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus, LifecycleStage } from '../entities/project.entity';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name', example: 'My Awesome Project' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'URL-friendly identifier', example: 'my-awesome-project' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Project image URL', example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Project emoji (alternative to image)', example: '🚀' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  emoji?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Owner ID (UUID)' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: LifecycleStage, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(LifecycleStage, { each: true })
  lifecycleStages?: LifecycleStage[];

  @ApiPropertyOptional({ description: 'Tag IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
