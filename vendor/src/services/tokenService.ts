const ACCESS_TOKEN_KEY = "vendor_token";
const REFRESH_TOKEN_KEY = "vendor_refresh_token";

interface TokenPayload {
  exp?: number;
}

interface TokensInput {
  accessToken: string;
  refreshToken?: string;
}

const parseJwtPayload = (token: string): TokenPayload | null => {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) {
      return null;
    }

    const decoded = atob(payloadSegment.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
};

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getVendorToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = ({ accessToken, refreshToken }: TokensInput): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const setVendorToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const removeVendorToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const isTokenExpired = (token?: string | null): boolean => {
  if (!token) {
    return true;
  }

  const payload = parseJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }

  const currentEpochSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= currentEpochSeconds;
};

export const hasValidAccessToken = (): boolean => {
  const token = getAccessToken();
  return !!token && !isTokenExpired(token);
};
