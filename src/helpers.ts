import type { CollectionConfig, SsgKey } from '@cloudcannon/configuration-types';
import yaml from 'js-yaml';
import type { CollectionConfigTree } from './ssgs/ssg.ts';
import { ssgs } from './ssgs/ssgs.ts';

export const CONFIG_SCHEMA_URL =
	'https://raw.githubusercontent.com/CloudCannon/configuration-types/main/cloudcannon-config.schema.json';

export const INITIAL_SETTINGS_SCHEMA_URL =
	'https://raw.githubusercontent.com/CloudCannon/configuration-types/main/dist/cloudcannon-initial-site-settings.schema.json';

export interface SsgDetectionResult {
	ssg: SsgKey;
	scores: Record<string, number>;
}

/**
 * Detects the SSG from file paths and returns both the best match and all scores.
 */
export function detectSsg(filePaths: string[]): SsgDetectionResult {
	const scores: Record<string, number> = {};

	for (const [key, ssg] of Object.entries(ssgs)) {
		scores[key] = 0;
		for (let i = 0; i < filePaths.length; i++) {
			scores[key] += ssg.getPathScore(filePaths[i]);
		}
	}

	const best = Object.entries(scores).reduce((a, b) => (a[1] >= b[1] ? a : b), ['other', 0] as [
		string,
		number,
	]);

	return { ssg: best[0] as SsgKey, scores };
}

/**
 * Walks a CollectionConfigTree and returns a flat Record of collection configs.
 */
export function flattenCollectionTree(
	trees: CollectionConfigTree[],
	options?: { onlySuggested?: boolean }
): Record<string, CollectionConfig> {
	const result: Record<string, CollectionConfig> = {};
	const onlySuggested = options?.onlySuggested ?? true;

	function walk(nodes: CollectionConfigTree[]): void {
		for (const node of nodes) {
			if (!onlySuggested || node.suggested) {
				result[node.key] = node.config;
			}
			walk(node.collections);
		}
	}

	walk(trees);
	return result;
}

/**
 * Serializes a config object to YAML or JSON, including the appropriate schema reference.
 */
export function serializeConfig(
	config: Record<string, any>,
	format: 'yaml' | 'json',
	options?: { schemaUrl?: string }
): string {
	if (format === 'json') {
		const output = options?.schemaUrl ? { $schema: options.schemaUrl, ...config } : config;
		return `${JSON.stringify(output, null, 2)}\n`;
	}

	const yamlStr = yaml.dump(config, {
		lineWidth: -1,
		quotingType: "'",
		forceQuotes: false,
		noRefs: true,
	});

	if (options?.schemaUrl) {
		return `# yaml-language-server: $schema=${options.schemaUrl}\n${yamlStr}`;
	}

	return yamlStr;
}
