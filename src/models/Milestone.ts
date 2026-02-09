import { PrismaClient, Milestone as PrismaMilestone } from '@prisma/client';

const prisma = new PrismaClient();

export class MilestoneModel {
  static async create(data: {
    projectId: string;
    description: string;
    amount: number;
    dueDate: Date;
    status?: 'pending' | 'paid' | 'overdue';
  }): Promise<PrismaMilestone> {
    return await prisma.milestone.create({
      data: {
        ...data,
        status: data.status || 'pending',
      },
    });
  }

  static async findById(id: string): Promise<PrismaMilestone | null> {
    return await prisma.milestone.findUnique({
      where: { id },
    });
  }

  static async findByProjectId(projectId: string): Promise<PrismaMilestone[]> {
    return await prisma.milestone.findMany({
      where: { projectId },
    });
  }

  static async update(id: string, data: Partial<{
    description: string;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'paid' | 'overdue';
    paidAt: Date | null;
  }>): Promise<PrismaMilestone> {
    return await prisma.milestone.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<PrismaMilestone> {
    return await prisma.milestone.delete({
      where: { id },
    });
  }
}