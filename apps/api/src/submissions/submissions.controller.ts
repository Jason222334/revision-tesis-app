import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Patch,
  Delete,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubmissionsService } from './submissions.service';

@Controller('submissions')
export class SubmissionsController {
  private readonly logger = new Logger(SubmissionsController.name);

  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSubmission(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string,
  ) {
    this.logger.log(`Uploading submission for project ${projectId}`);
    return this.submissionsService.uploadAndProcess(file, projectId);
  }

  @Get()
  async findAll() {
    return this.submissionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.submissionsService.updateStatus(id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    this.logger.log(`Deleting submission with ID ${id}`);
    return this.submissionsService.delete(id);
  }
}
