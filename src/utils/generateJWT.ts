 
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { BadRequestError } from "../errors/badRequest.error";
import { User } from "../models/user";

dotenv.config();

interface Payload {
  userId: number;
  role: string;
  permissions: string[];
}

export function generateJWT(payload: Payload | any, secret: string, expiresIn: string) {
  if (typeof payload !== "object") {
    payload = { data: payload }; // wrap string/primitive as object
  }

  const token = jwt.sign(payload, secret, { expiresIn });
  return token;
}

export function generateJWTPair(payload: Payload | any) {
  const token = generateJWT(payload, process.env.JWT_ACCESS_SECRET, process.env.JWT_ACCESS_EXPIRY);
  const refreshToken = generateJWT(payload, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRY);
  return { token, refreshToken };
}

export function verifyRefreshJWT(token: string) {
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET) as Payload;

  if (!payload) throw new BadRequestError("Invalid token");

  return payload;
}
