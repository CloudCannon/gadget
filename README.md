# Gadget

Reads files to create configuration for the [CloudCannon](https://cloudcannon.com/) CMS.

Gadget inspects your project's file structure to detect your static site generator (SSG), suggest collections, and generate a `cloudcannon.config.yml` and `.cloudcannon/initial-site-settings.json` for you. Use it as a CLI or as a library in your own tools.

[<img src="https://img.shields.io/npm/v/@cloudcannon%2Fgadget?logo=npm" alt="version badge">](https://www.npmjs.com/package/@cloudcannon%2Fgadget)

## Quick Start

Run the interactive setup in your project directory:

```bash
npx @cloudcannon/gadget
```

Or generate everything automatically:

```bash
npx @cloudcannon/gadget generate --auto --init-settings
```

This creates:
- `cloudcannon.config.yml` — your CloudCannon configuration file
- `.cloudcannon/initial-site-settings.json` — build settings so your site builds on first upload

## CLI Reference

### Commands

| Command | Description |
|---------|-------------|
| `generate` | Generate CloudCannon configuration (default) |
| `detect-ssg` | Detect the static site generator |
| `detect-source` | Detect the source folder |
| `collections` | List detected collections as JSON |
| `build` | Show build command suggestions |
| `init-settings` | Generate `.cloudcannon/initial-site-settings.json` |

### Global Options

| Flag | Description |
|------|-------------|
| `--ssg <key>` | Override SSG detection |
| `--source <path>` | Override source folder |
| `-h, --help` | Show help message |
| `-v, --version` | Show version |

### `generate` Options

| Flag | Description |
|------|-------------|
| `--auto` | Non-interactive, accept all suggestions |
| `--format yaml\|json` | Output format (default: yaml) |
| `--output <path>` | Output file path |
| `--init-settings` | Also generate `initial-site-settings.json` |
| `--json` | Output raw JSON to stdout instead of writing files |
| `--mode hosted\|headless` | Mode for initial-site-settings (default: hosted) |

### `init-settings` Options

| Flag | Description |
|------|-------------|
| `--install-command <cmd>` | Override install command |
| `--build-command <cmd>` | Override build command |
| `--output-path <path>` | Override build output path |
| `--mode hosted\|headless` | Mode (default: hosted) |

### Examples

```bash
# Interactive setup
npx @cloudcannon/gadget

# Auto-generate config for an Astro site
npx @cloudcannon/gadget generate --auto --ssg astro

# Detect SSG and get JSON output
npx @cloudcannon/gadget detect-ssg

# List collections for a Hugo site
npx @cloudcannon/gadget collections --ssg hugo

# Get build suggestions
npx @cloudcannon/gadget build

# Generate initial-site-settings.json only
npx @cloudcannon/gadget init-settings

# Generate config and initial settings together
npx @cloudcannon/gadget generate --auto --init-settings

# Get raw JSON output for programmatic use
npx @cloudcannon/gadget generate --auto --json
```

### Subcommand Output

All subcommands except `generate` output JSON to stdout, making them composable:

**`detect-ssg`** returns the detected SSG and scores:
```json
{
  "ssg": "astro",
  "scores": { "astro": 50, "hugo": 0, "jekyll": 0, ... }
}
```

**`detect-source`** returns the detected source folder:
```json
{ "source": "src", "ssg": "astro" }
```

**`build`** returns all build suggestions with attributions:
```json
{
  "install": [{ "value": "npm i", "attribution": "because of your package.json file" }],
  "build": [{ "value": "npx astro build", "attribution": "most common for Astro sites" }],
  "output": [{ "value": "dist", "attribution": "most common for Astro sites" }],
  "environment": {},
  "preserved": [{ "value": "node_modules/", "attribution": "..." }]
}
```

## Supported SSGs

| SSG | Key | Detection |
|-----|-----|-----------|
| Hugo | `hugo` | `hugo.toml`, `hugo.yaml`, `hugo.json`, `config.toml` |
| Jekyll | `jekyll` | `_config.yml`, `_config.yaml`, `_config.toml` |
| Eleventy | `eleventy` | `.eleventy.js`, `eleventy.config.*` |
| Astro | `astro` | `astro.config.*` |
| Next.js | `nextjs` | `next.config.*` |
| SvelteKit | `sveltekit` | `svelte.config.js` |
| Bridgetown | `bridgetown` | `bridgetown.config.yml` |
| Lume | `lume` | `_config.ts`, `_config.js` |
| MkDocs | `mkdocs` | `mkdocs.yml` |
| Docusaurus | `docusaurus` | `docusaurus.config.*` |
| Gatsby | `gatsby` | `gatsby-config.*` |
| Nuxt.js | `nuxtjs` | `nuxt.config.*` |
| Static | `static` | No SSG config detected, has HTML files |

## Output Files

### cloudcannon.config.yml

The CloudCannon configuration file. Generated files include a [JSON Schema](https://cloudcannon.com/documentation/developer-reference/schemas/) reference for IDE autocomplete and validation:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/CloudCannon/configuration-types/main/cloudcannon-config.schema.json
paths:
  static: public
  uploads: public/uploads
timezone: Pacific/Auckland
markdown:
  engine: commonmark
  options:
    gfm: true
collections_config:
  pages:
    path: src/pages
    icon: wysiwyg
  blog:
    path: src/content/blog
    icon: event_available
```

### .cloudcannon/initial-site-settings.json

Pre-configures build settings so your site builds correctly on first upload to CloudCannon:

```json
{
  "$schema": "https://raw.githubusercontent.com/CloudCannon/configuration-types/main/dist/cloudcannon-initial-site-settings.schema.json",
  "ssg": "astro",
  "mode": "hosted",
  "build": {
    "install_command": "npm i",
    "build_command": "npx astro build",
    "output_path": "dist"
  }
}
```

## Library API

Install as a dependency:

```bash
npm install @cloudcannon/gadget
```

### `generateConfiguration(filePaths, options?)`

Generates a CloudCannon configuration from file paths.

```typescript
import { generateConfiguration } from '@cloudcannon/gadget';
import { readFile } from 'fs/promises';

const result = await generateConfiguration(filePaths, {
  config: { source: 'src' },
  buildConfig: { ssg: 'astro' },
  readFile: (path) => readFile(path, 'utf-8'),
});

// result.ssg — detected SSG key
// result.config — Configuration object
// result.collections — CollectionConfigTree[]
```

### `generateBuildCommands(filePaths, options?)`

Returns build command suggestions.

```typescript
import { generateBuildCommands } from '@cloudcannon/gadget';

const commands = await generateBuildCommands(filePaths, {
  buildConfig: { ssg: 'astro' },
  readFile: (path) => readFile(path, 'utf-8'),
});

// commands.install — BuildCommandSuggestion[]
// commands.build — BuildCommandSuggestion[]
// commands.output — BuildCommandSuggestion[]
```

### `generateInitialSiteSettings(filePaths, options?)`

Generates initial site settings from file paths.

```typescript
import { generateInitialSiteSettings } from '@cloudcannon/gadget';

const settings = await generateInitialSiteSettings(filePaths, {
  buildConfig: { ssg: 'astro' },
  readFile: (path) => readFile(path, 'utf-8'),
  mode: 'hosted',
});
```

### `detectSsg(filePaths)`

Detects the SSG from file paths with confidence scores.

```typescript
import { detectSsg } from '@cloudcannon/gadget';

const { ssg, scores } = detectSsg(filePaths);
```

### `flattenCollectionTree(trees, options?)`

Flattens a `CollectionConfigTree[]` into a flat `Record<string, CollectionConfig>`.

```typescript
import { flattenCollectionTree } from '@cloudcannon/gadget';

// Only include suggested collections
const collections = flattenCollectionTree(result.collections, { onlySuggested: true });

// Include all collections
const allCollections = flattenCollectionTree(result.collections, { onlySuggested: false });
```

### `serializeConfig(config, format, options?)`

Serializes a configuration object to YAML or JSON with optional schema reference.

```typescript
import { serializeConfig } from '@cloudcannon/gadget';

const yamlStr = serializeConfig(config, 'yaml', {
  schemaUrl: 'https://raw.githubusercontent.com/CloudCannon/configuration-types/main/cloudcannon-config.schema.json',
});
```

### Other Exports

- `ssgs` — Record of all SSG adapters keyed by SSG name
- `guessSsg(filePaths)` — Returns the best-matching SSG instance
- `buildInitialSiteSettings(ssg, buildCommands, options?)` — Converts `BuildCommands` to `InitialSiteSettings`

## JSON Schemas

Generated files include schema references for IDE support. Schemas are from the [@cloudcannon/configuration-types](https://github.com/CloudCannon/configuration-types) package and registered with [SchemaStore](https://www.schemastore.org/):

- **Configuration file**: `cloudcannon-config.schema.json`
- **Initial site settings**: `cloudcannon-initial-site-settings.schema.json`

See the [CloudCannon JSON Schemas documentation](https://cloudcannon.com/documentation/developer-reference/schemas/) for IDE setup instructions.

## Links

- [CloudCannon Documentation](https://cloudcannon.com/documentation/)
- [Create your CloudCannon Configuration File](https://cloudcannon.com/documentation/guides/getting-started-with-cloudcannon/create-your-cloudcannon-configuration-file/)
- [Group files into Collections](https://cloudcannon.com/documentation/guides/getting-started-with-cloudcannon/group-files-into-collections/)
- [Configure your initial Site settings](https://cloudcannon.com/documentation/articles/configure-your-initial-site-settings/)
- [JSON Schemas](https://cloudcannon.com/documentation/developer-reference/schemas/)
