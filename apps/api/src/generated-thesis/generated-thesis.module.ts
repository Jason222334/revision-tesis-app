import { Module } from '@nestjs/common';
import { GeneratedThesisService } from './generated-thesis.service';
import { GeneratedThesisController } from './generated-thesis.controller';
import { PrismaModule } from '../prisma.module';
import { AIModule } from '../ai/ai.module';
import { TemplatesModule } from '../templates/templates.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, AIModule, TemplatesModule, StorageModule],
  controllers: [GeneratedThesisController],
  providers: [GeneratedThesisService],
})
export class GeneratedThesisModule {}
