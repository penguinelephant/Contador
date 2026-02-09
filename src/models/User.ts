import { PrismaClient, User as PrismaUser } from '@prisma/client';

const prisma = new PrismaClient();

export class UserModel {
  static async create(data: {
    email: string;
    name: string;
    abn?: string;
    gstRegistered?: boolean;
  }): Promise<PrismaUser> {
    return await prisma.user.create({
      data: {
        ...data,
        gstRegistered: data.gstRegistered ?? false,
      },
    });
  }

  static async findById(id: string): Promise<PrismaUser | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  static async findByEmail(email: string): Promise<PrismaUser | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  static async update(id: string, data: Partial<{
    email: string;
    name: string;
    abn?: string;
    gstRegistered: boolean;
  }>): Promise<PrismaUser> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<PrismaUser> {
    return await prisma.user.delete({
      where: { id },
    });
  }
}