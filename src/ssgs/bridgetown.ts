import Ssg, { type GenerateBuildCommandsOptions, type BuildCommands } from './ssg';

export default class Bridgetown extends Ssg {
	constructor() {
		super('bridgetown');
	}

	configPaths(): string[] {
		return super.configPaths().concat(['bridgetown.config.yml', 'bridgetown.config.yaml']);
	}

	templateExtensions(): string[] {
		return super.templateExtensions().concat(['.liquid']);
	}

	/**
	 * Generates a list of build suggestions.
	 */
	async generateBuildCommands(
		filePaths: string[],
		options: GenerateBuildCommandsOptions
	): Promise<BuildCommands> {
		const commands = await super.generateBuildCommands(filePaths, options);

		const gemfilePath = filePaths.find((path) => path === 'Gemfile' || path.endsWith('/Gemfile'));
		if (gemfilePath) {
			commands.install.unshift({
				value: 'bundle install',
				attribution: 'because of your Gemfile',
			});
			commands.preserved.push({
				value: '.bundle_cache/',
				attribution: 'recommended for speeding up bundler installs',
			});
			commands.environment.GEM_HOME = {
				value: '/usr/local/__site/src/.bundle_cache/',
				attribution: 'recommended for speeding up bundler installs',
			};

			if (options.source) {
				commands.environment.BUNDLE_GEMFILE = {
					value: gemfilePath,
					attribution: 'because of your Gemfile',
				};
			}
		}

		if (filePaths.includes('bin/bridgetown')) {
			commands.build.unshift({
				value: 'bin/bridgetown deploy',
				attribution: 'most common for Bridgetown sites',
			});
		}

		commands.output.unshift({
			value: 'output',
			attribution: 'most common for Bridgetown sites',
		});

		return commands;
	}
}
