/**
 * Transpila com SWC em vez de ts-jest: os testes rodam sem depender do
 * `prisma generate` (que exige baixar o engine nativo). A checagem de tipos
 * fica no script `npm run typecheck`, separada da execução dos testes.
 */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
          target: 'es2021',
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.module.ts',
    '!src/**/dto/**',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 15000,
};
