import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Release } from '../../releases/entities/release.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended',
}

export enum LifecycleStage {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

@Entity('projects')
@Index(['companyId', 'deletedAt'])
@Index(['slug', 'deletedAt'])
@Index(['targetId', 'deletedAt'])
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

  @Column({
    type: 'jsonb',
    default: [],
    name: 'lifecycle_stages',
  })
  lifecycleStages: LifecycleStage[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Release, (release) => release.project)
  releases: Release[];
}
