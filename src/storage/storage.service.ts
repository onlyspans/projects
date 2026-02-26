import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@config/config.service';
import { PROJECT_ICONS_DIR, PROJECT_ICON_MIME_TYPES, PROJECT_ICON_MAX_SIZE_BYTES } from './storage.constants';

export interface SaveProjectIconResult {
  /** Absolute URL to use as project.imageUrl. */
  publicUrl: string;
  /** S3 object key. */
  filePath: string;
}

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const storage = this.configService.storage;
    this.s3Client = new S3Client({
      region: storage.region,
      endpoint: storage.endpoint,
      credentials: {
        accessKeyId: storage.accessKeyId,
        secretAccessKey: storage.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async saveProjectIcon(buffer: Buffer, mimeType: string, _originalFilename?: string): Promise<SaveProjectIconResult> {
    if (!PROJECT_ICON_MIME_TYPES.includes(mimeType as (typeof PROJECT_ICON_MIME_TYPES)[number])) {
      throw new Error(`Invalid file type. Allowed: ${PROJECT_ICON_MIME_TYPES.join(', ')}`);
    }
    if (buffer.length > PROJECT_ICON_MAX_SIZE_BYTES) {
      throw new Error(`File too large. Max size: ${PROJECT_ICON_MAX_SIZE_BYTES / 1024 / 1024} MB`);
    }

    const ext = this.getExtensionFromMime(mimeType);
    const filename = `${randomUUID()}${ext}`;
    const key = `${PROJECT_ICONS_DIR}/${filename}`;
    const storage = this.configService.storage;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: storage.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    const publicUrl = `${storage.publicUrlBase.replace(/\/$/, '')}/${key}`;
    return { publicUrl, filePath: key };
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
