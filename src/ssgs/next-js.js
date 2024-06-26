import Ssg from './ssg.js';

export default class NextJs extends Ssg {
	constructor() {
		super('nextjs');
	}

	configPaths() {
		return super.configPaths().concat(['next.config.js', 'next.config.mjs']);
	}

	templateExtensions() {
		return super.templateExtensions().concat(['.tsx']);
	}

	ignoredFolders() {
		return super.ignoredFolders().concat([
			'out/', // build output
			'.next/', // cache
			'public/', // static assets
		]);
	}
}
