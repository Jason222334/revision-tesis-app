import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any, studentId: string) {
    return this.prisma.thesisProject.create({
      data: {
        title: data.title,
        programId: data.programId,
        studentId: studentId,
      },
    });
  }

  async findAll() {
    return this.prisma.thesisProject.findMany({
      include: {
        program: true,
        submissions: {
          orderBy: { version: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.thesisProject.findUnique({
      where: { id },
      include: {
        program: { include: { templates: { where: { isActive: true } } } },
        submissions: { include: { evaluation: true } },
      },
    });
  }
}
