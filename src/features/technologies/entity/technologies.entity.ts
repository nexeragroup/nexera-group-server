import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TechnologyCategory } from '../enum/technology.enum';
import { ProjectsEntity } from '../../projects/entity/projects.entity';

@Entity('technologies')
export class TechnologiesEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * URL-safe unique identifier.
   *
   * Examples:
   * angular
   * nestjs
   * postgresql
   * github-actions
   */
  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 150,
  })
  slug!: string;

  /**
   * Technology display name.
   *
   * Examples:
   * Angular
   * NestJS
   * PostgreSQL
   */
  @Column({
    type: 'varchar',
    length: 150,
  })
  name!: string;

  /**
   * Classification used for grouping/filtering technologies.
   */
  @Column({
    type: 'enum',
    enum: TechnologyCategory,
  })
  category!: TechnologyCategory;

  /**
   * Optional short description.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  /**
   * Optional official website.
   */
  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  websiteUrl!: string | null;

  /**
   * Optional logo/icon URL.
   *
   * This can later point to S3, MinIO, Cloudinary, etc.
   */
  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  logoUrl!: string | null;

  /**
   * Determines whether this technology can be assigned
   * and displayed publicly.
   */
  @Column({
    type: 'boolean',
    default: true,
  })
  active!: boolean;

  /**
   * Projects using this technology.
   */
  @ManyToMany(() => ProjectsEntity, (project) => project.technologies)
  projects!: ProjectsEntity[];

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt!: Date | null;
}
