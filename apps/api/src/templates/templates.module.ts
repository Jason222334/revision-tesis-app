import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { StorageModule } from '../storage/storage.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [StorageModule, AIModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
