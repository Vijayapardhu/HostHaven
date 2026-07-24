/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  moduleNameMapper: {
    // Prisma is reached through a single module, which tests replace wholesale
    // rather than standing up a database. Matches the relative import at any
    // depth (services/ uses ../, modules/*/ uses ../../).
    '^(\\.\\./)+config/database$': '<rootDir>/src/test/prismaMock.ts',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // The app targets Node16 module resolution; tests compile to CommonJS
        // so Jest can load them without the hybrid-module warning.
        tsconfig: {
          esModuleInterop: true,
          module: 'CommonJS',
          moduleResolution: 'Node',
        },
      },
    ],
  },
};
