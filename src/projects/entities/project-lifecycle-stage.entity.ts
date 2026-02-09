import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Project } from './project.entity';
import { ProjectLifecycleStage } from './project.entity';

@Entity('project_lifecycle_stages')
@Unique(['projectId', 'stage'])
@Index(['projectId'])
@Index(['stage'])
export class ProjectLifecycleStageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  @Index()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.lifecycleStages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({
    type: 'varchar',
    length: 20,
  })
  @Index()
  stage: ProjectLifecycleStage;

  @Column({ type: 'timestamptz', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
