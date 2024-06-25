import Ssg from './ssg.js';

export default class Eleventy extends Ssg {
	constructor() {
		super('eleventy');
	}

	configPaths() {
		return super
			.configPaths()
			.concat([
				'eleventy.config.js',
				'eleventy.config.mjs',
				'eleventy.config.cjs',
				'.eleventy.mjs',
				'.eleventy.cjs',
				'.eleventy.js',
			]);
	}

	templateExtensions() {
		return super
			.templateExtensions()
			.concat(['.njk', '.liquid', '.hbs', '.ejs', '.webc', '.mustache', '.haml', '.pug']);
	}

	contentExtensions() {
		return super.contentExtensions().concat(['.html']);
	}
}
