import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get('healthz')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  healthz(): { status: string } {
    return { status: 'OK' };
  }

  @Get('readyz')
  @ApiOperation({ summary: 'Readiness probe - checks database connection' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readyz(): Promise<{ status: string; database: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'OK',
        database: 'connected',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'NOT_READY',
          database: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
