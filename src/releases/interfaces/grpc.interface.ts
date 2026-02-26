/**
 * TypeScript interfaces for Releases gRPC service
 * These interfaces match the Protocol Buffers definitions in projects.proto
 */

import { ReleaseStructure } from './release-structure.interface';

export interface Release {
  id: string;
  projectId: string;
  version: string;
  snapshotId?: string;
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

export interface DeleteReleaseRequest {
  id: string;
}

export interface GetReleaseStructureRequest {
  id: string;
}
