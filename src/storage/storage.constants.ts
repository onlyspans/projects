import { join } from 'path';

/** Shape of an uploaded project icon file (memory storage). Used to avoid unsafe ESLint access on Express.Multer.File. */
export interface ProjectIconUpload {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

/** Base directory for uploaded files (project root / storage). */
export const STORAGE_DIR = join(process.cwd(), 'storage');

/** Subpath for project icons inside storage. */
export const PROJECT_ICONS_DIR = 'project-icons';

/** Public URL prefix for uploaded files (relative). */
export const UPLOADS_PREFIX = '/api/uploads';

/** Allowed MIME types for project icon uploads. */
export const PROJECT_ICON_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;

/** Max file size for project icon (2 MB). */
export const PROJECT_ICON_MAX_SIZE_BYTES = 2 * 1024 * 1024;
