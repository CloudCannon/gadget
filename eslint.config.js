export default {
	files: ['*.js'],
	extends: ['eslint:recommended'],
	rules: {
		indent: ['warn', 'tab'],
		'no-else-return': ['warn'],
		'guard-for-in': ['warn'],
		eqeqeq: ['warn'],
		'no-self-compare': ['warn'],
		'no-duplicate-imports': ['warn'],
		'no-lonely-if': ['warn'],
		quotes: ['warn', 'single'],
		semi: ['warn', 'always'],
	},
	env: {
		es6: true,
		node: true,
		browser: true,
	},
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 'latest',
	},
};
