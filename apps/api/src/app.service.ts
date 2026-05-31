import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SubmissionStatus } from '@revision-tesis/database';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getStats() {
    const [totalSubmissions, avgEvaluation, pendingSubmissions] =
      await Promise.all([
        this.prisma.submission.count(),
        this.prisma.evaluation.aggregate({
          _avg: {
            overallScore: true,
          },
        }),
        this.prisma.submission.count({
          where: {
            status: {
              in: [
                SubmissionStatus.PENDING,
                SubmissionStatus.ANALYZING,
                SubmissionStatus.REVIEWING,
              ],
            },
          },
        }),
      ]);

    // Get recent pending reviews for the dashboard list
    const recentPending = await this.prisma.submission.findMany({
      where: {
        status: SubmissionStatus.REVIEWING,
      },
      include: {
        project: {
          include: {
            student: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 5,
    });

    return {
      totalSubmissions,
      averageCompliance: avgEvaluation._avg.overallScore || 0,
      pendingCount: pendingSubmissions,
      recentPending,
    };
  }
}
