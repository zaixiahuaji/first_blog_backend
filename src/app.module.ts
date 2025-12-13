import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { ensureDatabaseExists } from './db/ensure-database';
import { ensurePgVectorExtension } from './db/ensure-extensions';
import { AuthModule } from './auth/auth.module';
import { DbIndexesService } from './db/db-indexes.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const host = config.get<string>('DB_HOST', 'localhost');
        const port = parseInt(config.get<string>('DB_PORT', '5432'), 10);
        const username = config.get<string>('DB_USER', 'postgres');
        const password = config.get<string>('DB_PASS', '');
        const database = config.get<string>('DB_NAME', 'appdb');

        await ensureDatabaseExists({
          host,
          port,
          user: username,
          password,
          databaseName: database,
        });

        await ensurePgVectorExtension({
          host,
          port,
          user: username,
          password,
          database,
        });

        return {
          type: 'postgres' as const,
          host,
          port,
          username,
          password,
          database,
          autoLoadEntities: true,
          synchronize: true, // 开发环境自动同步实体
        };
      },
    }),
    PostsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, DbIndexesService],
})
export class AppModule {}
