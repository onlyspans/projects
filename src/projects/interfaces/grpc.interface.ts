/**
 * TypeScript interfaces for Projects gRPC service
 * These interfaces match the Protocol Buffers definitions in projects.proto
 */

export enum ProjectStatus {
  PROJECT_STATUS_UNSPECIFIED = 0,
  PROJECT_STATUS_ACTIVE = 1,
  PROJECT_STATUS_ARCHIVED = 2,
  PROJECT_STATUS_SUSPENDED = 3,
}

export enum LifecycleStage {
  LIFECYCLE_STAGE_UNSPECIFIED = 0,
  LIFECYCLE_STAGE_DEVELOPMENT = 1,
  LIFECYCLE_STAGE_TESTING = 2,
  LIFECYCLE_STAGE_STAGING = 3,
  LIFECYCLE_STAGE_PRODUCTION = 4,
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: ProjectStatus;
  ownerId?: string;
  lifecycleStages: LifecycleStage[];
  tagIds: string[];
  metadata: Record<string, string>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface GetProjectRequest {
  id: string;
}

export interface ListProjectsRequest {
  ownerId?: string;
  status?: ProjectStatus;
  page?: number;
  pageSize?: number;
  search?: string;
  tagIds?: string[];
}

export interface ListProjectsResponse {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateProjectRequest {
  name: string;
  slug: string;
  description?: string;
  status?: ProjectStatus;
  ownerId?: string;
  lifecycleStages?: LifecycleStage[];
  tagIds?: string[];
  metadata?: Record<string, string>;
}

export interface UpdateProjectRequest {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  status?: ProjectStatus;
  ownerId?: string;
  lifecycleStages?: LifecycleStage[];
  tagIds?: string[];
  metadata?: Record<string, string>;
}

export interface DeleteProjectRequest {
  id: string;
}

export interface ProjectExistsRequest {
  id: string;
}

export interface ProjectExistsResponse {
  exists: boolean;
}

export interface HealthCheckRequest {
  service?: string;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
}
