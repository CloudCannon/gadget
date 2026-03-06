import type { SsgKey } from '@cloudcannon/configuration-types';
import { detectSsg } from './helpers.ts';
import type { GenerateOptions } from './index.ts';
import { generateBuildCommands } from './index.ts';
import type { BuildCommands } from './ssgs/ssg.ts';

export interface InitialSiteSettings {
	ssg: SsgKey;
	mode: 'hosted' | 'headless';
	build: {
		install_command?: string;
		build_command?: string;
		output_path?: string;
		environment_variables?: Array<{ key: string; value: string }>;
		preserved_paths?: string[];
	};
}

/**
 * Converts BuildCommands suggestions into an InitialSiteSettings object,
 * picking the first (best) suggestion from each category.
 */
export function buildInitialSiteSettings(
	ssg: SsgKey,
	buildCommands: BuildCommands,
	options?: { mode?: 'hosted' | 'headless' }
): InitialSiteSettings {
	const envVars = Object.entries(buildCommands.environment).map(([key, suggestion]) => ({
		key,
		value: suggestion.value,
	}));

	return {
		ssg,
		mode: options?.mode ?? 'hosted',
		build: {
			install_command: buildCommands.install[0]?.value,
			build_command: buildCommands.build[0]?.value,
			output_path: buildCommands.output[0]?.value,
			environment_variables: envVars.length > 0 ? envVars : undefined,
			preserved_paths:
				buildCommands.preserved.length > 0
					? buildCommands.preserved.map((s) => s.value)
					: undefined,
		},
	};
}

/**
 * Generates initial site settings by detecting the SSG and build commands.
 */
export async function generateInitialSiteSettings(
	filePaths: string[],
	options?: GenerateOptions & { mode?: 'hosted' | 'headless' }
): Promise<InitialSiteSettings> {
	const buildCommands = await generateBuildCommands(filePaths, options);
	const ssgKey = options?.buildConfig?.ssg ?? detectSsg(filePaths).ssg;

	return buildInitialSiteSettings(ssgKey, buildCommands, { mode: options?.mode });
}
