import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires as any,
    algorithm: 'HS512',
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires as any,
    algorithm: 'HS512',
  });
};

export const verifyAccessToken = (token: string): DecodedToken | null => {
  try {
    return jwt.verify(token, config.jwt.accessSecret, {
      algorithms: ['HS512'],
    }) as DecodedToken;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): DecodedToken | null => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, {
      algorithms: ['HS512'],
    }) as DecodedToken;
  } catch {
    return null;
  }
};

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const accessExpSeconds = parseExpiresIn(config.jwt.accessExpires);
  const refreshExpSeconds = parseExpiresIn(config.jwt.refreshExpires);

  return {
    accessToken,
    refreshToken,
    expiresIn: refreshExpSeconds,
  };
};

export const parseExpiresIn = (expiresIn: string): number => {
  const match = expiresIn.match(/^(\d+)d$/);
  if (match) {
    return parseInt(match[1], 10) * 24 * 60 * 60;
  }
  const hourMatch = expiresIn.match(/^(\d+)h$/);
  if (hourMatch) {
    return parseInt(hourMatch[1], 10) * 60 * 60;
  }
  const minMatch = expiresIn.match(/^(\d+)m$/);
  if (minMatch) {
    return parseInt(minMatch[1], 10) * 60;
  }
  return 365 * 24 * 60 * 60;
};
