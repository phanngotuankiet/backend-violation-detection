import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: number;
    sub?: number; // Add optional sub property
    email: string;
    role: string;
  };
}
