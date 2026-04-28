import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import crypto from 'crypto';
import { IUser } from '../models/userModel';

export const jwtCookieOptions = {
    expires: new Date(Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
}

export const signToken = (id: Types.ObjectId): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']
    });
};

export const hashResetToken = (token: string): string => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    return hashedToken;
};

export const createAndSendToken = (user: IUser, statusCode: number, res: any): void => {
    const token = signToken(user._id);

    res.cookie('jwt', token, jwtCookieOptions);

    user.password = undefined as any;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};