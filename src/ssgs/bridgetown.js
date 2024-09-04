import { joinPaths } from '../utility.js';
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

	/**
	 * Generates a list of build suggestions.
	 *
	 * @param filePaths {string[]} List of input file paths.
	 * @param options {{ config?: Record<string, any>; source?: string; readFile?: (path: string) => Promise<string | undefined>; }}
	 * @returns {Promise<import('../types').BuildCommands>}
	 */
	async generateBuildCommands(filePaths, options) {
		const commands = await super.generateBuildCommands(filePaths, options);

		if (filePaths.includes(joinPaths([options.source, 'Gemfile']))) {
			commands.install.unshift({
				value: 'bundle install',
				attribution: 'because of your Gemfile',
			});

			if (options.source) {
				commands.environment['BUNDLE_GEMFILE'] = {
					value: joinPaths([options.source, 'Gemfile']),
					attribution: 'because of your Gemfile',
				};
			}
		}

		commands.build.unshift({
			value: 'bin/bridgetown deploy',
			attribution: 'most common for Bridgetown sites'
		})
		
		commands.output.unshift({
			value: 'output',
			attribution: 'most common for Bridgetown sites'
		})

		return commands;
	}
}
