import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExpenseModel } from '../models/Expense';

const prisma = new PrismaClient();

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the current month's start and end dates
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(startOfMonth.getMonth() + 1);
    endOfMonth.setDate(0); // Last day of the month
    endOfMonth.setHours(23, 59, 59, 999);

    // Calculate MTD Income (sum of paid milestones for the current month)
    const mtdIncome = await prisma.milestone.aggregate({
      where: {
        status: 'paid',
        paidAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate payment status counts
    const now = new Date();
    const paymentStatus = {
      paid: await prisma.milestone.count({
        where: {
          status: 'paid',
        },
      }),
      dueSoon: await prisma.milestone.count({
        where: {
          status: 'pending',
          dueDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          },
        },
      }),
      overdue: await prisma.milestone.count({
        where: {
          status: 'pending',
          dueDate: {
            lt: now,
          },
        },
      }),
    };

    // Calculate MTD Expenses (sum of expenses for the current month)
    const mtdExpenses = await prisma.expense.aggregate({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate tax saved (simplified as 30% of MTD expenses)
    const taxSaved = (mtdExpenses._sum.amount || 0) * 0.3;

    res.status(200).json({
      mtdIncome: mtdIncome._sum.amount || 0,
      paymentStatus,
      mtdExpenses: mtdExpenses._sum.amount || 0,
      taxSaved,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};