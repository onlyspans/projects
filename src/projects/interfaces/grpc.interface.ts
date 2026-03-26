/**
 * TypeScript interfaces for Projects gRPC service
 * These interfaces match the Protocol Buffers definitions in projects.proto
 */

/** gRPC / Protocol Buffers enum (numeric), not the Prisma domain enum. */
export enum GrpcProjectStatus {
  PROJECT_STATUS_UNSPECIFIED = 0,
  PROJECT_STATUS_ACTIVE = 1,
  PROJECT_STATUS_ARCHIVED = 2,
  PROJECT_STATUS_SUSPENDED = 3,
}

export interface Environment {
  id: string;
  name: string;
  description?: string;
  position: number;
  color?: string;
}

/** Serialized Project message for gRPC responses. */
export interface GrpcProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: GrpcProjectStatus;
  ownerId: string;
  environments: Environment[];
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
  status?: GrpcProjectStatus;
  page?: number;
  pageSize?: number;
  search?: string;
  tagIds?: string[];
}

export interface ListProjectsResponse {
  items: GrpcProject[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateProjectRequest {
  name: string;
  slug: string;
  description?: string;
  status?: GrpcProjectStatus;
  ownerId?: string;
  environmentIds?: string[];
  tagIds?: string[];
  metadata?: Record<string, string>;
}

export interface UpdateProjectRequest {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  status?: GrpcProjectStatus;
  ownerId?: string;
  environmentIds?: string[];
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
