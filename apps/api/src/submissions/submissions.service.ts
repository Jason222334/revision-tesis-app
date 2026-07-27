import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SubmissionStatus } from '@revision-tesis/database';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    @InjectQueue('analysis') private analysisQueue: Queue,
  ) {}

  async uploadAndProcess(file: Express.Multer.File, projectId: string) {
    const project = await this.prisma.thesisProject.findUnique({
      where: { id: projectId },
      include: { submissions: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const fileName = await this.storageService.uploadFile(
      file,
      `submissions/${projectId}`,
    );

    const version = project.submissions.length + 1;
    const submission = await this.prisma.submission.create({
      data: {
        projectId,
        fileUrl: fileName,
        version,
        status: SubmissionStatus.PENDING,
      },
    });

    await this.analysisQueue.add('analyze', {
      submissionId: submission.id,
    });

    return submission;
  }

  async findAll() {
    return this.prisma.submission.findMany({
      include: {
        project: true,
        evaluation: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            program: true,
            student: true,
          },
        },
        evaluation: {
          include: {
            findings: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    return submission;
  }

  async updateStatus(id: string, status: SubmissionStatus) {
    return this.prisma.submission.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    // 1. Delete findings associated with this submission's evaluation
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { submissionId: id },
    });

    if (evaluation) {
      await this.prisma.finding.deleteMany({
        where: { evaluationId: evaluation.id },
      });
      await this.prisma.evaluation.delete({
        where: { id: evaluation.id },
      });
    }

    // 2. Delete document chunks associated with this submission
    await this.prisma.documentChunk.deleteMany({
      where: { submissionId: id },
    });

    // 3. Delete the file from MinIO storage
    if (submission.fileUrl) {
      await this.storageService.deleteFile(submission.fileUrl);
    }

    // 4. Delete the submission record from the database
    return this.prisma.submission.delete({
      where: { id },
    });
  }
}
