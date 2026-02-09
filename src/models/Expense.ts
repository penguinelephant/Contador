import { PrismaClient, Expense as PrismaExpense } from '@prisma/client';

const prisma = new PrismaClient();

export class ExpenseModel {
  static async create(data: {
    userId: string;
    projectId?: string | null;
    vendor: string;
    amount: number;
    date: Date;
    category: string;
    receiptUrl?: string;
  }): Promise<PrismaExpense> {
    return await prisma.expense.create({
      data: {
        ...data,
        projectId: data.projectId || null,
      },
    });
  }

  static async findById(id: string): Promise<PrismaExpense | null> {
    return await prisma.expense.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: string): Promise<PrismaExpense[]> {
    return await prisma.expense.findMany({
      where: { userId },
    });
  }

  static async findByProjectId(projectId: string): Promise<PrismaExpense[]> {
    return await prisma.expense.findMany({
      where: { projectId },
    });
  }

  static async update(id: string, data: Partial<{
    projectId?: string | null;
    vendor: string;
    amount: number;
    date: Date;
    category: string;
    receiptUrl?: string;
  }>): Promise<PrismaExpense> {
    return await prisma.expense.update({
      where: { id },
      data: {
        ...data,
        projectId: data.projectId !== undefined ? data.projectId : undefined,
      },
    });
  }

  static async delete(id: string): Promise<PrismaExpense> {
    return await prisma.expense.delete({
      where: { id },
    });
  }
}