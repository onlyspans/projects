import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Release } from '@releases/entities/release.entity';
import { Tag } from '@tags/entities/tag.entity';
import type { Environment } from '@environments/entities/environment.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended',
}

@Entity('projects')
@Index(['slug'], { where: 'deleted_at IS NULL' })
@Index(['ownerId'], { where: 'deleted_at IS NULL' })
@Index(['status'], { where: 'deleted_at IS NULL' })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 2048, name: 'image_url', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emoji: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @Column({ type: 'uuid', name: 'owner_id', nullable: true })
  ownerId: string | null;

  @ManyToMany(() => Tag, (tag) => tag.projects)
  @JoinTable({
    name: 'project_tags',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @Column({
    type: 'simple-array',
    default: '',
    name: 'environment_ids',
  })
  environmentIds: string[];

  environments?: Environment[];

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
