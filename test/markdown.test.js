import test from 'ava';
import { getMarkdownConfig } from '../src/markdown.js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

const readFilePromise = async (filePath) => readFile(filePath, { encoding: 'utf8'});
const configFiles = (filePaths) => filePaths.map((path) => {
    return { filePath: resolve(path)}
})

test('Defaults to CommonMark', (t) => {
    return getMarkdownConfig().then((config) => {
        t.deepEqual(config, {
            engine: 'commonmark',
            options: {}
        });
    })
});

test('Use defaults if no config is found.', (t) => {
    return getMarkdownConfig(
        configFiles(['./not-a-real-file.yml']),
        'jekyll',
        readFilePromise
    ).then((config) => {
        t.deepEqual(config, {
            engine: 'commonmark',
            options: {}
        });
    })
});

test('Respects Jekyll Kramdown options enabled', (t) => {
    return getMarkdownConfig(
        configFiles(['./test-files/jekyll/everything-enabled.yml']),
        'jekyll',
        readFilePromise
    ).then((config) => {
        t.deepEqual(config, {
            engine: 'kramdown',
            options: {
                breaks: true,
                gfm: true,
                heading_ids: true,
                typographer: true,
                quotes: '‘’“”',
            }
        })
    });
});

test('Respects Jekyll Kramdown options disabled', (t) => {
    return getMarkdownConfig(
        configFiles(['./test-files/jekyll/everything-disabled.yml']),
        'jekyll',
        readFilePromise
    ).then((config) => {
        t.deepEqual(config, {
            engine: 'kramdown',
            options: {
                breaks: false,
                gfm: false,
                heading_ids: false,
                typographer: false,
            }
        })
    });
});

test('Respects Jekyll CommonMark options', (t) => {
    return getMarkdownConfig(
        configFiles(['./test-files/jekyll/commonmark.yaml']),
        'jekyll',
        readFilePromise
    ).then((config) => {
        t.deepEqual(config, {
            engine: 'commonmark',
            options: {
                breaks: true,
                gfm: true,
                strikethrough: true,
                superscript: true,
                linkify: true,
                heading_ids: true,
                table: true
            }
        })
    });
});

test('Respects Hugo options', (t) => {
    return getMarkdownConfig(
        configFiles(['./test-files/hugo/goldmark.toml']),
        'hugo',
        readFilePromise
    ).then((config) => {
        t.deepEqual(config, {
            engine: 'commonmark',
            options: {
                attributes: true,
                linkify: true,
                strikethrough: true,
                table: true,
                typographer: true,
                quotes: '‘’“”',
                breaks: true,
                gfm: true,
                subscript: true,
                superscript: true,
                heading_ids: true,
                breaks: true,
                xhtml: true,
            }
        })
    });
});

test('Has good 11ty defaults', (t) => {
    return getMarkdownConfig(
        configFiles([]),
        'eleventy',
        readFilePromise
    ).then((config) => {
        t.deepEqual(config, {
            engine: 'commonmark',
            options: {
                html: true
            }
        })
    });
});