import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
      }
      next(error);
    }
  };
}

export const schemas = {
  register: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    role: z.string().optional(),
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  project: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.string().optional(),
    location: z.string().optional(),
    budget: z.number().optional(),
    style: z.string().optional(),
  }),
  sync: z.object({
    action: z.enum(['create', 'update', 'delete']),
    model: z.string(),
    id: z.string(),
    data: z.any().optional(),
    timestamp: z.string(),
  }),
};
