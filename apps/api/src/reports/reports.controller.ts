import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from '../storage/storage.service';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly storageService: StorageService,
    private readonly reportsService: ReportsService,
  ) {}

  @Get('url')
  async getFileUrl(@Query('fileName') fileName: string) {
    const url = await this.storageService.getFileUrl(fileName);
    return { url };
  }

  @Get(':submissionId/download')
  async downloadReport(
    @Param('submissionId') submissionId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer =
      await this.reportsService.generateReviewReport(submissionId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-revision-${submissionId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
