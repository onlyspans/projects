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
  Environment as GrpcEnvironment,
  type GrpcProject,
} from '../interfaces/grpc.interface';
import { ProjectStatus } from '../constants/project-status';
import type { Project } from '../types/project.types';
import type { Environment } from '@database/generated/client';
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
  async getProject(data: GetProjectRequest): Promise<GrpcProject> {
    const project = await this.projectsService.findOne(data.id);
    return this.mapProjectToGrpc(project);
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
  async createProject(data: CreateProjectRequest): Promise<GrpcProject> {
    const dto: CreateProjectDto = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.status !== undefined ? this.mapGrpcProjectStatus(data.status) : undefined,
      ownerId: data.ownerId,
      environmentIds: data.environmentIds,
      tagIds: data.tagIds,
      metadata: data.metadata,
    };

    const project = await this.projectsService.create(dto);
    return this.mapProjectToGrpc(project);
  }

  @GrpcMethod('ProjectsService', 'UpdateProject')
  async updateProject(data: UpdateProjectRequest): Promise<GrpcProject> {
    const dto: UpdateProjectDto = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.status !== undefined ? this.mapGrpcProjectStatus(data.status) : undefined,
      ownerId: data.ownerId,
      environmentIds: data.environmentIds,
      tagIds: data.tagIds,
      metadata: data.metadata,
    };

    const project = await this.projectsService.update(data.id, dto);
    return this.mapProjectToGrpc(project);
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

  private mapProjectToGrpc(project: Project): GrpcProject {
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description || '',
      status: this.mapProjectStatusToGrpc(project.status),
      ownerId: project.ownerId || '',
      environments: (project.environments ?? []).map((e) => this.mapEnvironmentToGrpc(e)),
      tagIds: project.tags?.map((tag) => tag.id) || [],
      metadata: (project.metadata || {}) as Record<string, string>,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private mapEnvironmentToGrpc(env: Environment): GrpcEnvironment {
    return {
      id: env.id,
      name: env.name,
      description: env.description ?? '',
      position: env.position,
    };
  }

  private mapProjectStatusToGrpc(status: string): GrpcProjectStatus {
    switch (status) {
      case 'active':
        return GrpcProjectStatus.PROJECT_STATUS_ACTIVE;
      case 'archived':
        return GrpcProjectStatus.PROJECT_STATUS_ARCHIVED;
      case 'suspended':
        return GrpcProjectStatus.PROJECT_STATUS_SUSPENDED;
      default:
        return GrpcProjectStatus.PROJECT_STATUS_UNSPECIFIED;
    }
  }
}
