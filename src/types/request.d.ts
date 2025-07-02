import { Request } from "express";

declare module "express" {
  interface Request {
    user_id?: { id: string };
    user?: User;
    role?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      role?: string;
    }
  }
}
