import { existsSync } from 'node:fs';
import { readFile as fsReadFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import * as p from '@clack/prompts';
import type { CollectionConfig, SsgKey } from '@cloudcannon/configuration-types';
import { fdir } from 'fdir';
import {
	CONFIG_SCHEMA_URL,
	detectSsg,
	flattenCollectionTree,
	INITIAL_SETTINGS_SCHEMA_URL,
	serializeConfig,
} from './helpers.ts';
import { generateBuildCommands, generateConfiguration, ssgs } from './index.ts';
import { buildInitialSiteSettings } from './initial-site-settings.ts';
import type { CollectionConfigTree } from './ssgs/ssg.ts';

const SUBCOMMANDS = [
	'detect-ssg',
	'detect-source',
	'collections',
	'build',
	'init-settings',
	'generate',
] as const;
type Subcommand = (typeof SUBCOMMANDS)[number];

interface CliOptions {
	ssg?: string;
	source?: string;
	format?: string;
	output?: string;
	auto?: boolean;
	'init-settings'?: boolean;
	json?: boolean;
	mode?: string;
	help?: boolean;
	version?: boolean;
	'install-command'?: string;
	'build-command'?: string;
	'output-path'?: string;
}

function isSubcommand(value: string): value is Subcommand {
	return SUBCOMMANDS.includes(value as Subcommand);
}

async function crawlFiles(targetPath: string): Promise<string[]> {
	const crawler = new fdir().withRelativePaths();
	const filePaths = await crawler.crawl(targetPath).withPromise();
	filePaths.sort();
	return filePaths;
}

function readFileFactory(targetPath: string): (path: string) => Promise<string | undefined> {
	return async (path: string): Promise<string | undefined> => {
		try {
			return await fsReadFile(resolve(targetPath, path), 'utf-8');
		} catch {
			return undefined;
		}
	};
}

function printJson(data: unknown): void {
	console.log(JSON.stringify(data, null, 2));
}

function getSsgKeys(): string[] {
	return Object.keys(ssgs);
}

function isCancel(value: unknown): boolean {
	return p.isCancel(value);
}

function exitOnCancel(value: unknown): void {
	if (isCancel(value)) {
		p.cancel('Operation cancelled.');
		process.exit(0);
	}
}

function printHelp(): void {
	console.log(`Usage: gadget [command] [path] [options]

Commands:
  generate        Generate CloudCannon configuration (default)
  detect-ssg      Detect the static site generator
  detect-source   Detect the source folder
  collections     List detected collections
  build           Show build command suggestions
  init-settings   Generate .cloudcannon/initial-site-settings.json

Options:
  --ssg <key>              Override SSG detection
  --source <path>          Override source folder
  --format <yaml|json>     Output format (default: yaml)
  --output <path>          Output file path
  --auto                   Non-interactive mode, accept all suggestions
  --init-settings          Also generate initial-site-settings.json
  --json                   Output raw JSON to stdout
  --mode <hosted|headless> Mode for initial-site-settings (default: hosted)
  --install-command <cmd>  Override install command (init-settings)
  --build-command <cmd>    Override build command (init-settings)
  --output-path <path>     Override output path (init-settings)
  -h, --help               Show this help message
  -v, --version            Show version

Examples:
  gadget                           Interactive setup
  gadget generate --auto           Auto-generate configuration
  gadget detect-ssg                Detect SSG as JSON
  gadget collections --ssg astro   List collections for Astro site
  gadget generate --auto --init-settings  Generate config and initial settings`);
}

// --- Subcommand handlers ---

async function cmdDetectSsg(targetPath: string, _options: CliOptions): Promise<void> {
	const filePaths = await crawlFiles(targetPath);
	const result = detectSsg(filePaths);
	printJson(result);
}

async function cmdDetectSource(targetPath: string, options: CliOptions): Promise<void> {
	const filePaths = await crawlFiles(targetPath);
	const ssgKey = options.ssg as SsgKey | undefined;
	const ssg = ssgKey && ssgs[ssgKey] ? ssgs[ssgKey] : ssgs[detectSsg(filePaths).ssg];
	const source = ssg.getSource(filePaths);

	printJson({ source: source ?? null, ssg: ssg.key });
}

async function cmdCollections(targetPath: string, options: CliOptions): Promise<void> {
	const filePaths = await crawlFiles(targetPath);
	const readFile = readFileFactory(targetPath);
	const ssgKey = options.ssg as SsgKey | undefined;

	const result = await generateConfiguration(filePaths, {
		config: options.source ? { source: options.source } : undefined,
		buildConfig: ssgKey ? { ssg: ssgKey } : undefined,
		readFile,
	});

	printJson({
		collections: result.collections,
		ssg: result.ssg,
		source: result.config.source ?? null,
	});
}

async function cmdBuild(targetPath: string, options: CliOptions): Promise<void> {
	const filePaths = await crawlFiles(targetPath);
	const readFile = readFileFactory(targetPath);
	const ssgKey = options.ssg as SsgKey | undefined;

	const buildCommands = await generateBuildCommands(filePaths, {
		config: options.source ? { source: options.source } : undefined,
		buildConfig: ssgKey ? { ssg: ssgKey } : undefined,
		readFile,
	});

	printJson(buildCommands);
}

async function cmdInitSettings(targetPath: string, options: CliOptions): Promise<void> {
	const filePaths = await crawlFiles(targetPath);
	const readFile = readFileFactory(targetPath);
	const ssgKey = options.ssg as SsgKey | undefined;
	const mode = (options.mode as 'hosted' | 'headless') ?? 'hosted';

	const buildCommands = await generateBuildCommands(filePaths, {
		config: options.source ? { source: options.source } : undefined,
		buildConfig: ssgKey ? { ssg: ssgKey } : undefined,
		readFile,
	});

	const detectedSsg = ssgKey ?? detectSsg(filePaths).ssg;
	const settings = buildInitialSiteSettings(detectedSsg, buildCommands, { mode });

	if (options['install-command']) {
		settings.build.install_command = options['install-command'];
	}
	if (options['build-command']) {
		settings.build.build_command = options['build-command'];
	}
	if (options['output-path']) {
		settings.build.output_path = options['output-path'];
	}

	const settingsPath = resolve(targetPath, '.cloudcannon', 'initial-site-settings.json');
	const dir = dirname(settingsPath);
	if (!existsSync(dir)) {
		await mkdir(dir, { recursive: true });
	}

	const content = serializeConfig(settings, 'json', {
		schemaUrl: INITIAL_SETTINGS_SCHEMA_URL,
	});
	await writeFile(settingsPath, content);
	console.log(`Wrote ${settingsPath}`);
}

// --- Interactive generate ---

function collectionsToOptions(
	trees: CollectionConfigTree[],
	depth: number = 0
): Array<{ value: string; label: string; hint?: string }> {
	const options: Array<{ value: string; label: string; hint?: string }> = [];
	for (const tree of trees) {
		const indent = '  '.repeat(depth);
		options.push({
			value: tree.key,
			label: `${indent}${tree.key}`,
			hint: tree.config.path ?? '',
		});
		options.push(...collectionsToOptions(tree.collections, depth + 1));
	}
	return options;
}

function getSuggestedKeys(trees: CollectionConfigTree[]): string[] {
	const keys: string[] = [];
	for (const tree of trees) {
		if (tree.suggested) {
			keys.push(tree.key);
		}
		keys.push(...getSuggestedKeys(tree.collections));
	}
	return keys;
}

function pickCollections(
	trees: CollectionConfigTree[],
	selectedKeys: Set<string>
): Record<string, CollectionConfig> {
	const result: Record<string, CollectionConfig> = {};

	function walk(nodes: CollectionConfigTree[]): void {
		for (const node of nodes) {
			if (selectedKeys.has(node.key)) {
				result[node.key] = node.config;
			}
			walk(node.collections);
		}
	}

	walk(trees);
	return result;
}

async function cmdGenerateInteractive(targetPath: string, options: CliOptions): Promise<void> {
	p.intro('CloudCannon Gadget');

	const spinner = p.spinner();
	spinner.start('Scanning files...');
	const filePaths = await crawlFiles(targetPath);
	const readFile = readFileFactory(targetPath);
	spinner.stop(`Found ${filePaths.length} files`);

	// Step 1: SSG detection
	const detection = detectSsg(filePaths);
	const ssgOptions = getSsgKeys()
		.filter((key) => key !== 'legacy' && key !== 'other')
		.map((key) => ({ value: key, label: key, hint: key === detection.ssg ? 'detected' : '' }));
	ssgOptions.push({ value: 'other', label: 'other', hint: '' });

	const ssgChoice = await p.select({
		message: 'Which static site generator does this site use?',
		options: ssgOptions,
		initialValue: detection.ssg,
	});
	exitOnCancel(ssgChoice);
	const ssgKey = ssgChoice as SsgKey;

	// Step 2: Source folder
	const ssg = ssgs[ssgKey];
	const detectedSource = ssg.getSource(filePaths);

	let source: string | undefined;
	if (detectedSource) {
		const confirmSource = await p.confirm({
			message: `Detected source folder: ${detectedSource}. Is this correct?`,
			initialValue: true,
		});
		exitOnCancel(confirmSource);
		if (confirmSource) {
			source = detectedSource;
		} else {
			const customSource = await p.text({
				message: 'Enter the source folder path:',
				placeholder: 'src',
			});
			exitOnCancel(customSource);
			source = (customSource as string) || undefined;
		}
	} else {
		const wantSource = await p.confirm({
			message: 'No source folder detected. Do you want to set one?',
			initialValue: false,
		});
		exitOnCancel(wantSource);
		if (wantSource) {
			const customSource = await p.text({
				message: 'Enter the source folder path:',
				placeholder: 'src',
			});
			exitOnCancel(customSource);
			source = (customSource as string) || undefined;
		}
	}

	// Step 3: Generate configuration
	spinner.start('Generating configuration...');
	const result = await generateConfiguration(filePaths, {
		config: source ? { source } : undefined,
		buildConfig: { ssg: ssgKey },
		readFile,
	});
	spinner.stop('Configuration generated');

	// Step 4: Collections
	const collectionOptions = collectionsToOptions(result.collections);
	const suggestedKeys = getSuggestedKeys(result.collections);

	let selectedCollectionKeys: string[];
	if (collectionOptions.length > 0) {
		const collectionChoice = await p.multiselect({
			message: 'Select collections to include:',
			options: collectionOptions,
			initialValues: suggestedKeys,
			required: false,
		});
		exitOnCancel(collectionChoice);
		selectedCollectionKeys = collectionChoice as string[];
	} else {
		p.note('No collections detected.', 'Collections');
		selectedCollectionKeys = [];
	}

	// Step 5: Build commands
	const buildCommands = await generateBuildCommands(filePaths, {
		config: source ? { source } : undefined,
		buildConfig: { ssg: ssgKey },
		readFile,
	});

	let installCommand: string | undefined;
	if (buildCommands.install.length > 0) {
		const installOptions = [
			...buildCommands.install.map((s) => ({
				value: s.value,
				label: s.value,
				hint: s.attribution,
			})),
			{ value: '__none__', label: 'None', hint: '' },
		];
		const choice = await p.select({
			message: 'Install command:',
			options: installOptions,
			initialValue: buildCommands.install[0]?.value,
		});
		exitOnCancel(choice);
		installCommand = choice === '__none__' ? undefined : (choice as string);
	}

	let buildCommand: string | undefined;
	if (buildCommands.build.length > 0) {
		const buildOptions = [
			...buildCommands.build.map((s) => ({
				value: s.value,
				label: s.value,
				hint: s.attribution,
			})),
			{ value: '__none__', label: 'None', hint: '' },
		];
		const choice = await p.select({
			message: 'Build command:',
			options: buildOptions,
			initialValue: buildCommands.build[0]?.value,
		});
		exitOnCancel(choice);
		buildCommand = choice === '__none__' ? undefined : (choice as string);
	}

	let outputPath: string | undefined;
	if (buildCommands.output.length > 0) {
		const outputOptions = [
			...buildCommands.output.map((s) => ({
				value: s.value,
				label: s.value,
				hint: s.attribution,
			})),
			{ value: '__none__', label: 'None', hint: '' },
		];
		const choice = await p.select({
			message: 'Output path:',
			options: outputOptions,
			initialValue: buildCommands.output[0]?.value,
		});
		exitOnCancel(choice);
		outputPath = choice === '__none__' ? undefined : (choice as string);
	}

	// Step 6: Assemble config
	const config = { ...result.config };
	if (selectedCollectionKeys.length > 0) {
		const selectedSet = new Set(selectedCollectionKeys);
		config.collections_config = ssg.sortCollectionsConfig(
			pickCollections(result.collections, selectedSet)
		);
	}

	const format = (options.format as 'yaml' | 'json') ?? 'yaml';
	const ext = format === 'json' ? 'json' : 'yml';
	const configOutputPath = options.output ?? resolve(targetPath, `cloudcannon.config.${ext}`);
	const configContent = serializeConfig(config, format, { schemaUrl: CONFIG_SCHEMA_URL });

	// Step 7: Preview
	p.note(configContent, `cloudcannon.config.${ext}`);

	const shouldWrite = await p.confirm({
		message: 'Write this configuration?',
		initialValue: true,
	});
	exitOnCancel(shouldWrite);

	if (shouldWrite) {
		await writeFile(configOutputPath, configContent);
		p.log.success(`Wrote ${configOutputPath}`);
	}

	// Step 8: Initial site settings
	const wantInitSettings = await p.confirm({
		message: 'Generate .cloudcannon/initial-site-settings.json?',
		initialValue: true,
	});
	exitOnCancel(wantInitSettings);

	if (wantInitSettings) {
		const modifiedBuildCommands = { ...buildCommands };
		if (installCommand) {
			modifiedBuildCommands.install = [
				{ value: installCommand, attribution: 'user selection' },
				...buildCommands.install.filter((s) => s.value !== installCommand),
			];
		}
		if (buildCommand) {
			modifiedBuildCommands.build = [
				{ value: buildCommand, attribution: 'user selection' },
				...buildCommands.build.filter((s) => s.value !== buildCommand),
			];
		}
		if (outputPath) {
			modifiedBuildCommands.output = [
				{ value: outputPath, attribution: 'user selection' },
				...buildCommands.output.filter((s) => s.value !== outputPath),
			];
		}

		const settings = buildInitialSiteSettings(ssgKey, modifiedBuildCommands);
		const settingsPath = resolve(targetPath, '.cloudcannon', 'initial-site-settings.json');
		const dir = dirname(settingsPath);
		if (!existsSync(dir)) {
			await mkdir(dir, { recursive: true });
		}

		const settingsContent = serializeConfig(settings, 'json', {
			schemaUrl: INITIAL_SETTINGS_SCHEMA_URL,
		});
		await writeFile(settingsPath, settingsContent);
		p.log.success(`Wrote ${settingsPath}`);
	}

	p.outro('Done!');
}

// --- Non-interactive generate ---

async function cmdGenerateAuto(targetPath: string, options: CliOptions): Promise<void> {
	const filePaths = await crawlFiles(targetPath);
	const readFile = readFileFactory(targetPath);
	const ssgKey = options.ssg as SsgKey | undefined;

	const result = await generateConfiguration(filePaths, {
		config: options.source ? { source: options.source } : undefined,
		buildConfig: ssgKey ? { ssg: ssgKey } : undefined,
		readFile,
	});

	const config = { ...result.config };
	const suggested = flattenCollectionTree(result.collections, { onlySuggested: true });
	if (Object.keys(suggested).length > 0) {
		const ssg = ssgs[result.ssg ?? ('other' as SsgKey)];
		config.collections_config = ssg.sortCollectionsConfig(suggested);
	}

	if (options.json) {
		printJson({
			ssg: result.ssg,
			config,
			collections: result.collections,
		});
		return;
	}

	const format = (options.format as 'yaml' | 'json') ?? 'yaml';
	const ext = format === 'json' ? 'json' : 'yml';
	const configOutputPath = options.output ?? resolve(targetPath, `cloudcannon.config.${ext}`);
	const configContent = serializeConfig(config, format, { schemaUrl: CONFIG_SCHEMA_URL });

	await writeFile(configOutputPath, configContent);
	console.log(`Wrote ${configOutputPath}`);

	if (options['init-settings']) {
		const buildCommands = await generateBuildCommands(filePaths, {
			config: options.source ? { source: options.source } : undefined,
			buildConfig: ssgKey ? { ssg: ssgKey } : undefined,
			readFile,
		});

		const detectedSsg = result.ssg ?? ('other' as SsgKey);
		const mode = (options.mode as 'hosted' | 'headless') ?? 'hosted';
		const settings = buildInitialSiteSettings(detectedSsg, buildCommands, { mode });

		const settingsPath = resolve(targetPath, '.cloudcannon', 'initial-site-settings.json');
		const dir = dirname(settingsPath);
		if (!existsSync(dir)) {
			await mkdir(dir, { recursive: true });
		}

		const settingsContent = serializeConfig(settings, 'json', {
			schemaUrl: INITIAL_SETTINGS_SCHEMA_URL,
		});
		await writeFile(settingsPath, settingsContent);
		console.log(`Wrote ${settingsPath}`);
	}
}

// --- Main ---

async function main(): Promise<void> {
	const { values, positionals } = parseArgs({
		args: process.argv.slice(2),
		options: {
			ssg: { type: 'string' },
			source: { type: 'string' },
			format: { type: 'string' },
			output: { type: 'string' },
			auto: { type: 'boolean', default: false },
			'init-settings': { type: 'boolean', default: false },
			json: { type: 'boolean', default: false },
			mode: { type: 'string' },
			help: { type: 'boolean', short: 'h', default: false },
			version: { type: 'boolean', short: 'v', default: false },
			'install-command': { type: 'string' },
			'build-command': { type: 'string' },
			'output-path': { type: 'string' },
		},
		allowPositionals: true,
		strict: false,
	});

	const options = values as CliOptions;

	if (options.help) {
		printHelp();
		return;
	}

	if (options.version) {
		console.log('gadget 0.0.0');
		return;
	}

	let subcommand: Subcommand = 'generate';
	let targetPath = '.';

	if (positionals.length > 0 && isSubcommand(positionals[0])) {
		subcommand = positionals[0];
		targetPath = positionals[1] ? resolve(positionals[1]) : '.';
	} else if (positionals.length > 0) {
		targetPath = resolve(positionals[0]);
	}

	targetPath = resolve(targetPath);

	if (!existsSync(targetPath)) {
		console.error(`Error: path "${targetPath}" does not exist`);
		process.exit(1);
	}

	switch (subcommand) {
		case 'detect-ssg':
			await cmdDetectSsg(targetPath, options);
			break;
		case 'detect-source':
			await cmdDetectSource(targetPath, options);
			break;
		case 'collections':
			await cmdCollections(targetPath, options);
			break;
		case 'build':
			await cmdBuild(targetPath, options);
			break;
		case 'init-settings':
			await cmdInitSettings(targetPath, options);
			break;
		case 'generate':
			if (options.auto || options.json) {
				await cmdGenerateAuto(targetPath, options);
			} else {
				await cmdGenerateInteractive(targetPath, options);
			}
			break;
	}
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
