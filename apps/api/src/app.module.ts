import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { ProgramsModule } from './programs/programs.module';
import { TemplatesModule } from './templates/templates.module';
import { ProjectsModule } from './projects/projects.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { AIModule } from './ai/ai.module';
import { ReportsModule } from './reports/reports.module';
import { GeneratedThesisModule } from './generated-thesis/generated-thesis.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          return {
            connection: {
              url: redisUrl,
            },
          };
        }
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: configService.get<number>('REDIS_PORT') || 6379,
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    StorageModule,
    UsersModule,
    ProgramsModule,
    TemplatesModule,
    ProjectsModule,
    SubmissionsModule,
    AIModule,
    ReportsModule,
    GeneratedThesisModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
