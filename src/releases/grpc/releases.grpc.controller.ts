import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ReleasesService } from '../services/releases.service';
import {
  GetReleaseRequest,
  ListReleasesRequest,
  ListReleasesResponse,
  CreateReleaseRequest,
  UpdateReleaseRequest,
  UpdateReleaseStructureRequest,
  UpdateReleaseStatusRequest,
  DeleteReleaseRequest,
  GetReleaseStructureRequest,
  ReleaseStatus as GrpcReleaseStatus,
} from '../interfaces/grpc.interface';
import { Release, ReleaseStatus } from '../entities/release.entity';
import { CreateReleaseDto } from '../dto/create-release.dto';
import { UpdateReleaseDto } from '../dto/update-release.dto';
import { QueryReleasesDto } from '../dto/query-releases.dto';
import { ReleaseStructure } from '../interfaces/release-structure.interface';

@Controller()
export class ReleasesGrpcController {
  constructor(private readonly releasesService: ReleasesService) {}

  @GrpcMethod('ReleasesService', 'GetRelease')
  async getRelease(data: GetReleaseRequest): Promise<Release> {
    return this.releasesService.findOne(data.id);
  }

  @GrpcMethod('ReleasesService', 'ListReleases')
  async listReleases(data: ListReleasesRequest): Promise<ListReleasesResponse> {
    const query: QueryReleasesDto = {
      page: data.page,
      pageSize: data.pageSize,
      status: data.status !== undefined ? this.mapGrpcReleaseStatus(data.status) : undefined,
      version: data.version,
    };

    const result = await this.releasesService.findAll(data.projectId, query);

    return {
      items: result.items.map((item) => this.mapReleaseToGrpc(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  @GrpcMethod('ReleasesService', 'CreateRelease')
  async createRelease(data: CreateReleaseRequest): Promise<Release> {
    const dto: CreateReleaseDto = {
      version: data.version,
      changelog: data.changelog,
      notes: data.notes,
      structure: data.structure as any,
      metadata: data.metadata,
    };

    return this.releasesService.create(data.projectId, dto);
  }

  @GrpcMethod('ReleasesService', 'UpdateRelease')
  async updateRelease(data: UpdateReleaseRequest): Promise<Release> {
    const dto: UpdateReleaseDto = {
      status: data.status !== undefined ? this.mapGrpcReleaseStatus(data.status) : undefined,
      snapshotId: data.snapshotId,
      changelog: data.changelog,
      notes: data.notes,
      structure: data.structure as any,
      metadata: data.metadata,
    };

    return this.releasesService.update(data.id, dto);
  }

  @GrpcMethod('ReleasesService', 'UpdateReleaseStructure')
  async updateReleaseStructure(data: UpdateReleaseStructureRequest): Promise<Release> {
    return this.releasesService.updateStructure(data.id, data.snapshotId, data.structure as ReleaseStructure);
  }

  @GrpcMethod('ReleasesService', 'UpdateReleaseStatus')
  async updateReleaseStatus(data: UpdateReleaseStatusRequest): Promise<Release> {
    return this.releasesService.updateStatus(data.id, this.mapGrpcReleaseStatus(data.status));
  }

  @GrpcMethod('ReleasesService', 'DeleteRelease')
  async deleteRelease(data: DeleteReleaseRequest): Promise<void> {
    await this.releasesService.remove(data.id);
  }

  @GrpcMethod('ReleasesService', 'GetReleaseStructure')
  async getReleaseStructure(data: GetReleaseStructureRequest): Promise<ReleaseStructure> {
    return this.releasesService.getStructure(data.id);
  }

  // Helper methods for mapping between gRPC and internal types
  private mapGrpcReleaseStatus(status: GrpcReleaseStatus): ReleaseStatus {
    switch (status) {
      case GrpcReleaseStatus.RELEASE_STATUS_DRAFT:
        return ReleaseStatus.DRAFT;
      case GrpcReleaseStatus.RELEASE_STATUS_CREATED:
        return ReleaseStatus.CREATED;
      case GrpcReleaseStatus.RELEASE_STATUS_SCHEDULED:
        return ReleaseStatus.SCHEDULED;
      case GrpcReleaseStatus.RELEASE_STATUS_DELIVERING:
        return ReleaseStatus.DELIVERING;
      case GrpcReleaseStatus.RELEASE_STATUS_DELIVERED:
        return ReleaseStatus.DELIVERED;
      case GrpcReleaseStatus.RELEASE_STATUS_DEPLOYED:
        return ReleaseStatus.DEPLOYED;
      case GrpcReleaseStatus.RELEASE_STATUS_FAILED:
        return ReleaseStatus.FAILED;
      case GrpcReleaseStatus.RELEASE_STATUS_ROLLED_BACK:
        return ReleaseStatus.ROLLED_BACK;
      case GrpcReleaseStatus.RELEASE_STATUS_CANCELLED:
        return ReleaseStatus.CANCELLED;
      default:
        return ReleaseStatus.DRAFT;
    }
  }

  private mapReleaseToGrpc(release: Release): any {
    return {
      id: release.id,
      projectId: release.projectId,
      version: release.version,
      snapshotId: release.snapshotId || '',
      status: this.mapReleaseStatusToGrpc(release.status),
      changelog: release.changelog || '',
      notes: release.notes || '',
      structure: release.structure || {},
      metadata: release.metadata || {},
      createdAt: release.createdAt,
      updatedAt: release.updatedAt,
    };
  }

  private mapReleaseStatusToGrpc(status: ReleaseStatus): GrpcReleaseStatus {
    switch (status) {
      case ReleaseStatus.DRAFT:
        return GrpcReleaseStatus.RELEASE_STATUS_DRAFT;
      case ReleaseStatus.CREATED:
        return GrpcReleaseStatus.RELEASE_STATUS_CREATED;
      case ReleaseStatus.SCHEDULED:
        return GrpcReleaseStatus.RELEASE_STATUS_SCHEDULED;
      case ReleaseStatus.DELIVERING:
        return GrpcReleaseStatus.RELEASE_STATUS_DELIVERING;
      case ReleaseStatus.DELIVERED:
        return GrpcReleaseStatus.RELEASE_STATUS_DELIVERED;
      case ReleaseStatus.DEPLOYED:
        return GrpcReleaseStatus.RELEASE_STATUS_DEPLOYED;
      case ReleaseStatus.FAILED:
        return GrpcReleaseStatus.RELEASE_STATUS_FAILED;
      case ReleaseStatus.ROLLED_BACK:
        return GrpcReleaseStatus.RELEASE_STATUS_ROLLED_BACK;
      case ReleaseStatus.CANCELLED:
        return GrpcReleaseStatus.RELEASE_STATUS_CANCELLED;
      default:
        return GrpcReleaseStatus.RELEASE_STATUS_UNSPECIFIED;
    }
  }
}
