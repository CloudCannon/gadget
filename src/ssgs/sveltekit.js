import Ssg from './ssg.js';

export default class Sveltekit extends Ssg {
	constructor() {
		super('sveltekit');
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
