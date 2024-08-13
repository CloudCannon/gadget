import Ssg from './ssg.js';

export default class Bridgetown extends Ssg {
	constructor() {
		super('bridgetown');
	}

	configPaths() {
		return super.configPaths().concat(['bridgetown.config.yml', 'bridgetown.config.yaml']);
	}

	templateExtensions() {
		return super.templateExtensions().concat(['.liquid']);
	}
}
