import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		include: ['**/*.test.ts', '**/*.spec.ts'],
		typecheck: {
			tsconfig: './tsconfig.json',
		},
	},
});
