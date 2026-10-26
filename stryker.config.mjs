import { defineConfig } from '@stryker-mutator/core';

export default defineConfig({
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
  },
  mutate: ['lib/contract.ts', 'lib/sanitize.ts'],
  reporters: ['clear-text', 'progress', 'html'],
  coverageAnalysis: 'perTest',
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  tempDirName: '.stryker-tmp',
});
