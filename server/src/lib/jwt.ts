import * as jwt from "jsonwebtoken";


export const tokenSecret = process.env.JWT_SECRET;

export const signToken = (
    payload: object,
    expiresIn: jwt.SignOptions["expiresIn"] = "1h"
): string => {
    if (!tokenSecret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.sign(payload, tokenSecret, { expiresIn });
};

export const verifyToken = (token: string): object | string => {
    if (!tokenSecret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.verify(token, tokenSecret);
};  