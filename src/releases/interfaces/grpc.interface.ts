/**
 * TypeScript interfaces for Releases gRPC service
 * These interfaces match the Protocol Buffers definitions in projects.proto
 */

import { ReleaseStructure } from './release-structure.interface';

export enum ReleaseStatus {
  RELEASE_STATUS_UNSPECIFIED = 0,
  RELEASE_STATUS_DRAFT = 1,
  RELEASE_STATUS_CREATED = 2,
  RELEASE_STATUS_SCHEDULED = 3,
  RELEASE_STATUS_DELIVERING = 4,
  RELEASE_STATUS_DELIVERED = 5,
  RELEASE_STATUS_DEPLOYED = 6,
  RELEASE_STATUS_FAILED = 7,
  RELEASE_STATUS_ROLLED_BACK = 8,
  RELEASE_STATUS_CANCELLED = 9,
}

export interface Release {
  id: string;
  projectId: string;
  version: string;
  snapshotId?: string;
  status: ReleaseStatus;
  changelog?: string;
  notes?: string;
  structure?: ReleaseStructure;
  metadata: Record<string, string>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface GetReleaseRequest {
  id: string;
}

export interface ListReleasesRequest {
  projectId: string;
  page?: number;
  pageSize?: number;
  status?: ReleaseStatus;
  version?: string;
}

export interface ListReleasesResponse {
  items: Release[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateReleaseRequest {
  projectId: string;
  version: string;
  changelog?: string;
  notes?: string;
  structure?: ReleaseStructure;
  metadata?: Record<string, string>;
}

export interface UpdateReleaseRequest {
  id: string;
  status?: ReleaseStatus;
  snapshotId?: string;
  changelog?: string;
  notes?: string;
  structure?: ReleaseStructure;
  metadata?: Record<string, string>;
}

export interface UpdateReleaseStructureRequest {
  id: string;
  snapshotId: string;
  structure: ReleaseStructure;
}

export interface UpdateReleaseStatusRequest {
  id: string;
  status: ReleaseStatus;
}

export interface DeleteReleaseRequest {
  id: string;
}

export interface GetReleaseStructureRequest {
  id: string;
}
