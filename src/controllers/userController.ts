import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { createUserSchema } from '../types';

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createUserSchema.parse(req.body);

    // Check if user with email already exists
    const existingUser = await UserModel.findByEmail(validatedData.email);
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Create new user
    const newUser = await UserModel.create(validatedData);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        abn: newUser.abn,
        gstRegistered: newUser.gstRegistered,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};