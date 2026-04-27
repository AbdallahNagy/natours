import { IUser } from '../../models/userModel';
import { Request } from 'express';

export interface AuthRequest extends Request {
  user: IUser;
}
