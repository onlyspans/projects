import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { join } from 'path';
import {
  STORAGE_DIR,
  PROJECT_ICONS_DIR,
  UPLOADS_PREFIX,
  PROJECT_ICON_MIME_TYPES,
  PROJECT_ICON_MAX_SIZE_BYTES,
} from './storage.constants';

export interface SaveProjectIconResult {
  /** Relative URL to use as project.imageUrl (e.g. /api/uploads/project-icons/xxx.png). */
  publicUrl: string;
  /** Full filesystem path of the saved file. */
  filePath: string;
}

/**
 * Handles file storage for uploads.
 * Currently saves files locally in project root / storage.
 *
 * TODO: Replace local filesystem with S3 (or compatible) object storage:
 * - Add S3 client (e.g. @aws-sdk/client-s3), config (bucket, region, credentials).
 * - Implement saveProjectIcon to upload to S3 and return public URL (or signed URL).
 * - Optionally keep local storage as fallback for development via config.
 * - Remove or refactor ensureDir and local writeFileSync when S3 is in place.
 */
@Injectable()
export class StorageService {
  private readonly projectIconsPath = join(STORAGE_DIR, PROJECT_ICONS_DIR);

  /**
   * Saves a project icon file to local storage and returns the public URL.
   * Validates MIME type and file size before saving.
   */
  async saveProjectIcon(buffer: Buffer, mimeType: string, originalFilename?: string): Promise<SaveProjectIconResult> {
    if (!PROJECT_ICON_MIME_TYPES.includes(mimeType as (typeof PROJECT_ICON_MIME_TYPES)[number])) {
      throw new Error(`Invalid file type. Allowed: ${PROJECT_ICON_MIME_TYPES.join(', ')}`);
    }
    if (buffer.length > PROJECT_ICON_MAX_SIZE_BYTES) {
      throw new Error(`File too large. Max size: ${PROJECT_ICON_MAX_SIZE_BYTES / 1024 / 1024} MB`);
    }

    const ext = this.getExtensionFromMime(mimeType);
    const filename = `${randomUUID()}${ext}`;
    this.ensureDir(this.projectIconsPath);
    const filePath = join(this.projectIconsPath, filename);
    writeFileSync(filePath, buffer);
    const publicUrl = `${UPLOADS_PREFIX}/${PROJECT_ICONS_DIR}/${filename}`;
    return { publicUrl, filePath };
  }

  private ensureDir(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private getExtensionFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    return map[mime] ?? '.bin';
  }
}
