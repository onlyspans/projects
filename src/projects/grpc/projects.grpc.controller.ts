import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProjectsService } from '../services/projects.service';
import {
  GetProjectRequest,
  ListProjectsRequest,
  ListProjectsResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  DeleteProjectRequest,
  ProjectExistsRequest,
  ProjectExistsResponse,
  HealthCheckRequest,
  HealthCheckResponse,
  ProjectStatus as GrpcProjectStatus,
  LifecycleStage as GrpcLifecycleStage,
} from '../interfaces/grpc.interface';
import { Project, ProjectStatus, LifecycleStage } from '../entities/project.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { QueryProjectsDto } from '../dto/query-projects.dto';

@Controller()
export class ProjectsGrpcController {
  constructor(private readonly projectsService: ProjectsService) {}

  @GrpcMethod('ProjectsService', 'HealthCheck')
  healthCheck(data: HealthCheckRequest): HealthCheckResponse {
    return {
      status: 'OK',
      message: `Projects microservice is healthy. Service: ${data.service || 'unknown'}`,
    };
  }

  @GrpcMethod('ProjectsService', 'GetProject')
  async getProject(data: GetProjectRequest): Promise<Project> {
    return this.projectsService.findOne(data.id);
  }

  @GrpcMethod('ProjectsService', 'ListProjects')
  async listProjects(data: ListProjectsRequest): Promise<ListProjectsResponse> {
    const query: QueryProjectsDto = {
      page: data.page,
      pageSize: data.pageSize,
      ownerId: data.ownerId,
      status: data.status !== undefined ? this.mapGrpcProjectStatus(data.status) : undefined,
      search: data.search,
      tagIds: data.tagIds,
    };

    const result = await this.projectsService.findAll(query);

    return {
      items: result.items.map((item) => this.mapProjectToGrpc(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  @GrpcMethod('ProjectsService', 'CreateProject')
  async createProject(data: CreateProjectRequest): Promise<Project> {
    const dto: CreateProjectDto = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.status !== undefined ? this.mapGrpcProjectStatus(data.status) : undefined,
      ownerId: data.ownerId,
      lifecycleStages: data.lifecycleStages?.map((stage) => this.mapGrpcLifecycleStage(stage)),
      tagIds: data.tagIds,
      metadata: data.metadata,
    };

    return this.projectsService.create(dto);
  }

  @GrpcMethod('ProjectsService', 'UpdateProject')
  async updateProject(data: UpdateProjectRequest): Promise<Project> {
    const dto: UpdateProjectDto = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.status !== undefined ? this.mapGrpcProjectStatus(data.status) : undefined,
      ownerId: data.ownerId,
      lifecycleStages: data.lifecycleStages?.map((stage) => this.mapGrpcLifecycleStage(stage)),
      tagIds: data.tagIds,
      metadata: data.metadata,
    };

    return this.projectsService.update(data.id, dto);
  }

  @GrpcMethod('ProjectsService', 'DeleteProject')
  async deleteProject(data: DeleteProjectRequest): Promise<void> {
    await this.projectsService.remove(data.id);
  }

  @GrpcMethod('ProjectsService', 'ProjectExists')
  async projectExists(data: ProjectExistsRequest): Promise<ProjectExistsResponse> {
    const exists = await this.projectsService.exists(data.id);
    return { exists };
  }

  // Helper methods for mapping between gRPC and internal types
  private mapGrpcProjectStatus(status: GrpcProjectStatus): ProjectStatus {
    switch (status) {
      case GrpcProjectStatus.PROJECT_STATUS_ACTIVE:
        return ProjectStatus.ACTIVE;
      case GrpcProjectStatus.PROJECT_STATUS_ARCHIVED:
        return ProjectStatus.ARCHIVED;
      case GrpcProjectStatus.PROJECT_STATUS_SUSPENDED:
        return ProjectStatus.SUSPENDED;
      default:
        return ProjectStatus.ACTIVE;
    }
  }

  private mapGrpcLifecycleStage(stage: GrpcLifecycleStage): LifecycleStage {
    switch (stage) {
      case GrpcLifecycleStage.LIFECYCLE_STAGE_DEVELOPMENT:
        return LifecycleStage.DEVELOPMENT;
      case GrpcLifecycleStage.LIFECYCLE_STAGE_TESTING:
        return LifecycleStage.TESTING;
      case GrpcLifecycleStage.LIFECYCLE_STAGE_STAGING:
        return LifecycleStage.STAGING;
      case GrpcLifecycleStage.LIFECYCLE_STAGE_PRODUCTION:
        return LifecycleStage.PRODUCTION;
      default:
        return LifecycleStage.DEVELOPMENT;
    }
  }

  private mapProjectToGrpc(project: Project): any {
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description || '',
      status: this.mapProjectStatusToGrpc(project.status),
      ownerId: project.ownerId || '',
      lifecycleStages: project.lifecycleStages.map((stage) => this.mapLifecycleStageToGrpc(stage)),
      tagIds: project.tags?.map((tag) => tag.id) || [],
      metadata: project.metadata || {},
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private mapProjectStatusToGrpc(status: ProjectStatus): GrpcProjectStatus {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return GrpcProjectStatus.PROJECT_STATUS_ACTIVE;
      case ProjectStatus.ARCHIVED:
        return GrpcProjectStatus.PROJECT_STATUS_ARCHIVED;
      case ProjectStatus.SUSPENDED:
        return GrpcProjectStatus.PROJECT_STATUS_SUSPENDED;
      default:
        return GrpcProjectStatus.PROJECT_STATUS_UNSPECIFIED;
    }
  }

  private mapLifecycleStageToGrpc(stage: LifecycleStage): GrpcLifecycleStage {
    switch (stage) {
      case LifecycleStage.DEVELOPMENT:
        return GrpcLifecycleStage.LIFECYCLE_STAGE_DEVELOPMENT;
      case LifecycleStage.TESTING:
        return GrpcLifecycleStage.LIFECYCLE_STAGE_TESTING;
      case LifecycleStage.STAGING:
        return GrpcLifecycleStage.LIFECYCLE_STAGE_STAGING;
      case LifecycleStage.PRODUCTION:
        return GrpcLifecycleStage.LIFECYCLE_STAGE_PRODUCTION;
      default:
        return GrpcLifecycleStage.LIFECYCLE_STAGE_UNSPECIFIED;
    }
  }
}
