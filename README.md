# Gadget

Reads file to create configuration for the [CloudCannon](https://cloudcannon.com/) CMS.

This is used as a library within the CMS itself, but you can use it to generate a configuration
file locally.

[<img src="https://img.shields.io/npm/v/@cloudcannon%2Fgadget?logo=npm" alt="version badge">](https://www.npmjs.com/package/@cloudcannon%2Fgadget)

---

- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [License](#license)

---

## Installation

```bash
npm i -g @cloudcannon/gadget
```

This gives you access to the `cloudcannon-gadget` binary.

## Usage

For usage details:

```sh
cloudcannon-gadget --help
```

Which outputs:

```
Inpects a list of files to create configuration for the CloudCannon CMS.

Usage
  cloudcannon-gadget <input> [options]

Options
  --version     Print the current version

Examples
  cloudcannon-gadget .
  cloudcannon-gadget sites/my-jekyll-site
```

---

## Development

Install dependencies:

```sh
npm i
```

Run tests:

```sh
npm test
npm run test:watch
npm run test:coverage
```

Lint code:

```sh
npm run lint
```

## License

MIT
