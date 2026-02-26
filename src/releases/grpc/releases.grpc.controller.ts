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
  DeleteReleaseRequest,
  GetReleaseStructureRequest,
} from '../interfaces/grpc.interface';
import { Release } from '../entities/release.entity';
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

  @GrpcMethod('ReleasesService', 'DeleteRelease')
  async deleteRelease(data: DeleteReleaseRequest): Promise<void> {
    await this.releasesService.remove(data.id);
  }

  @GrpcMethod('ReleasesService', 'GetReleaseStructure')
  async getReleaseStructure(data: GetReleaseStructureRequest): Promise<ReleaseStructure> {
    return this.releasesService.getStructure(data.id);
  }

  private mapReleaseToGrpc(release: Release): any {
    return {
      id: release.id,
      projectId: release.projectId,
      version: release.version,
      snapshotId: release.snapshotId || '',
      changelog: release.changelog || '',
      notes: release.notes || '',
      structure: release.structure || {},
      metadata: release.metadata || {},
      createdAt: release.createdAt,
      updatedAt: release.updatedAt,
    };
  }
}
