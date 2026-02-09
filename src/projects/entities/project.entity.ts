import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Release } from '../../releases/entities/release.entity';
import { ProjectGroup } from './project-group.entity';
import { ProjectLifecycleStageEntity } from './project-lifecycle-stage.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended',
}

export enum ProjectLifecycleStage {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production',
  MAINTENANCE = 'maintenance',
  DEPRECATED = 'deprecated',
}

@Entity('projects')
@Index(['companyId', 'deletedAt'])
@Index(['slug', 'deletedAt'])
@Index(['targetId', 'deletedAt'])
@Index(['groupId', 'deletedAt'])
@Index(['status', 'deletedAt'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'uuid', name: 'target_id', nullable: true })
  targetId: string | null;

  @Column({ type: 'uuid', name: 'group_id', nullable: true })
  @Index()
  groupId: string | null;

  @ManyToOne(() => ProjectGroup, (group) => group.projects, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: ProjectGroup | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: ProjectStatus.ACTIVE,
  })
  @Index()
  status: ProjectStatus;

  @Column({ type: 'uuid', name: 'owner_id', nullable: true })
  @Index()
  ownerId: string | null;

  @Column({ type: 'text', nullable: true })
  tags: string | null; // JSON array of tags, e.g., ["frontend", "api", "critical"]

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Release, (release) => release.project)
  releases: Release[];

  @OneToMany(() => ProjectLifecycleStageEntity, (lifecycleStage) => lifecycleStage.project)
  lifecycleStages: ProjectLifecycleStageEntity[];
}
