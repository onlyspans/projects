import { BadRequestException, Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ReleasesService } from '../services/releases.service';
import {
  GetReleaseRequest,
  GetReleaseByProjectAndVersionRequest,
  EnsureReleaseByProjectAndVersionRequest,
  ListReleasesRequest,
  ListReleasesResponse,
  CreateReleaseRequest,
  UpdateReleaseRequest,
  UpdateReleaseStructureRequest,
  DeleteReleaseRequest,
  GetReleaseStructureRequest,
  Release as GrpcRelease,
} from '../interfaces/grpc.interface';
import type { Release } from '../types/release.types';
import { CreateReleaseDto } from '../dto/create-release.dto';
import { UpdateReleaseDto } from '../dto/update-release.dto';
import { QueryReleasesDto } from '../dto/query-releases.dto';
import { ReleaseStructure } from '../interfaces/release-structure.interface';

function grpcMetadataFromJson(value: unknown): Record<string, string> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v);
    }
    return out;
  }
  return {};
}

/** @grpc/grpc-js may pass proto snake_case or camelCase; DTOs use camelCase. */
function wireProjectId(data: { projectId?: string; project_id?: string }): string {
  const id = data.projectId ?? data.project_id ?? '';
  if (!id) {
    throw new BadRequestException('project_id / projectId is required');
  }
  return id;
}

function wirePageSize(data: { pageSize?: number; page_size?: number }): number | undefined {
  return data.pageSize ?? data.page_size;
}

function wireSnapshotId(data: { snapshotId?: string; snapshot_id?: string }): string | undefined {
  return data.snapshotId ?? data.snapshot_id;
}

@Controller()
export class ReleasesGrpcController {
  constructor(private readonly releasesService: ReleasesService) {}

  @GrpcMethod('ReleasesService', 'GetRelease')
  async getRelease(data: GetReleaseRequest): Promise<GrpcRelease> {
    const release = await this.releasesService.findOne(data.id);
    return this.mapReleaseToGrpc(release);
  }

  @GrpcMethod('ReleasesService', 'GetReleaseByProjectAndVersion')
  async getReleaseByProjectAndVersion(data: GetReleaseByProjectAndVersionRequest): Promise<GrpcRelease> {
    const release = await this.releasesService.findActiveByProjectAndVersion(
      wireProjectId(data),
      data.version,
    );
    return this.mapReleaseToGrpc(release);
  }

  @GrpcMethod('ReleasesService', 'EnsureReleaseByProjectAndVersion')
  async ensureReleaseByProjectAndVersion(data: EnsureReleaseByProjectAndVersionRequest): Promise<GrpcRelease> {
    const release = await this.releasesService.ensureActiveByProjectAndVersion(
      wireProjectId(data),
      data.version,
      data.metadata,
    );
    return this.mapReleaseToGrpc(release);
  }

  @GrpcMethod('ReleasesService', 'ListReleases')
  async listReleases(data: ListReleasesRequest): Promise<ListReleasesResponse> {
    const query: QueryReleasesDto = {
      page: data.page,
      pageSize: wirePageSize(data),
      version: data.version,
    };

    const result = await this.releasesService.findAll(wireProjectId(data), query);

    return {
      items: result.items.map((item) => this.mapReleaseToGrpc(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  @GrpcMethod('ReleasesService', 'CreateRelease')
  async createRelease(data: CreateReleaseRequest): Promise<GrpcRelease> {
    const dto: CreateReleaseDto = {
      version: data.version,
      changelog: data.changelog,
      notes: data.notes,
      structure: data.structure,
      metadata: data.metadata,
    };

    const release = await this.releasesService.create(wireProjectId(data), dto);
    return this.mapReleaseToGrpc(release);
  }

  @GrpcMethod('ReleasesService', 'UpdateRelease')
  async updateRelease(data: UpdateReleaseRequest): Promise<GrpcRelease> {
    const dto: UpdateReleaseDto = {
      snapshotId: wireSnapshotId(data),
      changelog: data.changelog,
      notes: data.notes,
      structure: data.structure,
      metadata: data.metadata,
    };

    const release = await this.releasesService.update(data.id, dto);
    return this.mapReleaseToGrpc(release);
  }

  @GrpcMethod('ReleasesService', 'UpdateReleaseStructure')
  async updateReleaseStructure(data: UpdateReleaseStructureRequest): Promise<GrpcRelease> {
    const snapshotId = wireSnapshotId(data);
    if (!snapshotId) {
      throw new BadRequestException('snapshot_id is required');
    }
    const release = await this.releasesService.updateStructure(data.id, snapshotId, data.structure);
    return this.mapReleaseToGrpc(release);
  }

  @GrpcMethod('ReleasesService', 'DeleteRelease')
  async deleteRelease(data: DeleteReleaseRequest): Promise<void> {
    await this.releasesService.remove(data.id);
  }

  @GrpcMethod('ReleasesService', 'GetReleaseStructure')
  async getReleaseStructure(data: GetReleaseStructureRequest): Promise<ReleaseStructure> {
    return this.releasesService.getStructure(data.id);
  }

  private mapReleaseToGrpc(release: Release): GrpcRelease {
    const structure =
      release.structure !== null && typeof release.structure === 'object'
        ? (release.structure as unknown as ReleaseStructure)
        : undefined;

    return {
      id: release.id,
      projectId: release.projectId,
      version: release.version,
      snapshotId: release.snapshotId || '',
      changelog: release.changelog || '',
      notes: release.notes || '',
      structure,
      metadata: grpcMetadataFromJson(release.metadata),
      createdAt: release.createdAt,
      updatedAt: release.updatedAt,
    };
  }
}
