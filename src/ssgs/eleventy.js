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


	async parseConfig() {
		/** Unfortunately we can't read the JavaScript config files */
		return null;
	}

	templateExtensions() {
		return super
			.templateExtensions()
			.concat(['.njk', '.liquid', '.hbs', '.ejs', '.webc', '.mustache', '.haml', '.pug']);
	}

	contentExtensions() {
		return super.contentExtensions().concat(['.html']);
	}

	/**
	 * @param _config {Record<string, any>}
	 * @returns {import('@cloudcannon/configuration-types').MarkdownSettings}
	 */
	generateMarkdownConfig(_config) {
		return {
            engine: 'commonmark',
            options: {
                html: true
            }
        }
	}
}
