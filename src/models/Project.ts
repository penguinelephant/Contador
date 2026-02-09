import { PrismaClient, Project as PrismaProject } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectModel {
  static async create(data: {
    userId: string;
    clientName: string;
    title: string;
    totalAmount: number;
    paymentTerms: string;
  }): Promise<PrismaProject> {
    return await prisma.project.create({
      data,
    });
  }

  static async findById(id: string): Promise<PrismaProject | null> {
    return await prisma.project.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: string): Promise<PrismaProject[]> {
    return await prisma.project.findMany({
      where: { userId },
    });
  }

  static async update(id: string, data: Partial<{
    clientName: string;
    title: string;
    totalAmount: number;
    paymentTerms: string;
  }>): Promise<PrismaProject> {
    return await prisma.project.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<PrismaProject> {
    return await prisma.project.delete({
      where: { id },
    });
  }
}