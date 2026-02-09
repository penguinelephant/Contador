import { Request, Response } from 'express';
import { ProjectModel } from '../models/Project';
import { MilestoneModel } from '../models/Milestone';
import { createProjectSchema, createMilestoneSchema } from '../types';

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = createProjectSchema.parse(req.body);

    // Create new project
    const newProject = await ProjectModel.create(validatedData);

    // Handle optional milestones creation
    if (req.body.milestones && Array.isArray(req.body.milestones)) {
      for (const milestone of req.body.milestones) {
        // Validate each milestone
        const validatedMilestone = createMilestoneSchema.parse({
          ...milestone,
          projectId: newProject.id
        });

        // Create milestone
        await MilestoneModel.create({
          projectId: newProject.id,
          description: validatedMilestone.description,
          amount: validatedMilestone.amount,
          dueDate: new Date(validatedMilestone.dueDate),
          status: validatedMilestone.status,
        });
      }
    }

    // Fetch the project with its milestones
    const projectWithMilestones = await ProjectModel.findById(newProject.id);

    res.status(201).json({
      message: 'Project created successfully',
      project: projectWithMilestones,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};