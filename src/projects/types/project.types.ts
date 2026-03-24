import type { Environment, Project as PrismaProject, Tag } from '@database/generated/client';

/** Prisma `Project` row with tags loaded; `environments` is filled by `EnvironmentsRepository.attachToProjects`. */
export type Project = PrismaProject & { tags: Tag[]; environments?: Environment[] };
