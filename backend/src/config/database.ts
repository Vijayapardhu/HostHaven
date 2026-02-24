import { PrismaClient } from '@prisma/client';
import { config, isDevelopment } from '../config';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: isDevelopment
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (isDevelopment) {
  globalThis.prisma = prisma;
}

export default prisma;
