import { z } from 'zod';

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  abn?: string;
  gstRegistered: boolean;
  createdAt: Date;
}

// Project types
export interface Project {
  id: string;
  userId: string;
  clientName: string;
  title: string;
  totalAmount: number;
  paymentTerms: string;
  createdAt: Date;
}

// Milestone types
export interface Milestone {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue';
  paidAt: Date | null;
}

// Expense types
export interface Expense {
  id: string;
  userId: string;
  projectId: string | null;
  vendor: string;
  amount: number;
  date: Date;
  category: string;
  receiptUrl?: string;
  createdAt: Date;
}

// Zod schemas for validation
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  abn: z.string().optional(),
  gstRegistered: z.boolean().default(false),
});

export const createProjectSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  clientName: z.string().min(1, 'Client name is required'),
  title: z.string().min(1, 'Title is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
});

export const createMilestoneSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD'),
  status: z.enum(['pending', 'paid', 'overdue']).default('pending'),
});

export const createExpenseSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  projectId: z.string().uuid().optional().nullable(),
  vendor: z.string().min(1, 'Vendor is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, expected YYYY-MM-DD'),
  category: z.string().min(1, 'Category is required'),
  receiptUrl: z.string().url('Invalid URL').optional(),
});