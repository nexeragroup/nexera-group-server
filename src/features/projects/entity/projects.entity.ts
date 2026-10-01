import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TechnologiesEntity } from '../../technologies/entity/technologies.entity';

@Entity('projects')
export class ProjectsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * URL-friendly identifier.
   *
   * Example:
   * kubaka
   * daily-infrastructure-digest
   * ai-mina
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150 })
  slug!: string;

  /**
   * Short project code used in the UI.
   *
   * Example:
   * KB
   * DIDS
   * AI
   */
  @Column({ type: 'varchar', length: 20 })
  code!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  /**
   * Keep category dynamic instead of an enum so new categories
   * can be added without changing application code.
   */
  @Column({ type: 'varchar', length: 100 })
  category!: string;

  @Column({ type: 'varchar', length: 500 })
  headline!: string;

  @Column({ type: 'text' })
  description!: string;

  /**
   * PostgreSQL JSONB works well because technologies are
   * a simple ordered array of strings.
   */
  @ManyToMany(() => TechnologiesEntity, (technology) => technology.projects)
  @JoinTable({
    name: 'project_technologies',

    joinColumn: {
      name: 'project_id',
      referencedColumnName: 'id',
    },

    inverseJoinColumn: {
      name: 'technology_id',
      referencedColumnName: 'id',
    },
  })
  technologies!: TechnologiesEntity[];

  /**
   * Optional external URL to the live project.
   */
  @Column({ type: 'varchar', length: 1000, nullable: true })
  link!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  linkLabel!: string | null;

  /**
   * Optional project image/cover.
   *
   * This can later point to S3, MinIO, Cloudinary,
   * or another storage provider.
   */
  @Column({ type: 'varchar', length: 1000, nullable: true })
  imageUrl!: string | null;

  /**
   * Highlight the project in special sections of the website.
   */
  @Column({ type: 'boolean', default: false })
  featured!: boolean;

  /**
   * Determines whether the project is publicly visible.
   */
  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Soft delete allows deleted portfolio projects to be restored
   * later without losing their historical record.
   */
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
