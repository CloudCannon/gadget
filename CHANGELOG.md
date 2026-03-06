# Changelog

<!-- 
    Add changes to the Unreleased section during development.
    Do not change this header — the GitHub action that releases
    this project will edit this file and add the version header for you.
    The Unreleased block will also be used for the GitHub release notes.
-->

## Unreleased

* Added CLI with interactive and non-interactive modes (`npx @cloudcannon/gadget`)
* Added subcommands: `detect-ssg`, `detect-source`, `collections`, `build`, `init-settings`, `generate`
* Added `generate --auto` for fully automated configuration generation
* Added `generate --init-settings` to generate `.cloudcannon/initial-site-settings.json`
* Added `generate --json` for raw JSON output for programmatic use
* Added `generateInitialSiteSettings()` and `buildInitialSiteSettings()` to library API
* Added `detectSsg()` with confidence scores to library API
* Added `flattenCollectionTree()` utility for converting collection trees to flat config
* Added `serializeConfig()` utility for YAML/JSON serialization with schema references
* Exported `guessSsg()` from library API
* Generated files include CloudCannon JSON Schema references for IDE autocomplete
* Added comprehensive README with CLI and library documentation
* Added AI skill file guide for automated CloudCannon setup workflows
* Added toolproof CLI integration tests

## 0.0.26

* 🔍 Go go Gadget config! After years as Inspector CloudCannon's internal companion, Gadget finally extends its arms beyond the app and into the wild — ready to inspect your files and automate CloudCannon configuration locally. Point Gadget at your project and let it go to work.
