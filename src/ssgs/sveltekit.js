import Ssg from './ssg.js';

export default class Sveltekit extends Ssg {
	constructor() {
		super('sveltekit');
	}

	async parseConfig() {
		/** Unfortunately we can't read the JavaScript config files */
		return null;
	}

	configPaths() {
		return super.configPaths().concat(['svelte.config.js']);
	}

	templateExtensions() {
		return super.templateExtensions().concat(['.svelte']);
	}

	contentExtensions() {
		return super.contentExtensions().concat(['.svx']);
	}

	ignoredFolders() {
		return super.ignoredFolders().concat([
			'build/', // build output
			'.svelte-kit/', // cache
			'static/', // static assets
		]);
	}
}
