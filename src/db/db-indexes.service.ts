import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CREATE_POSTS_EMBEDDING_HNSW_INDEX_SQL } from './ensure-hnsw-index';

@Injectable()
export class DbIndexesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DbIndexesService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.dataSource.query(CREATE_POSTS_EMBEDDING_HNSW_INDEX_SQL);
    this.logger.log('Ensured HNSW index: posts_embedding_hnsw_idx');
  }
}

