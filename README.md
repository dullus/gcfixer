# GCFIXER

[![NPM Stats](https://nodei.co/npm/gcfixer.png)](https://npmjs.org/package/gcfixer/)

![](https://img.shields.io/badge/version-0.9.2-red)
![](https://img.shields.io/badge/languages-TypeScript-blue)
![](https://img.shields.io/badge/node-%3E%3D10.0.0-brightgreen)
![](https://img.shields.io/badge/npm-%3E%3D6.0.0-brightgreen)

__GCFixer__ is command line tool for normalistaion of geocaching pocket queries (PQ) in GPX format to use with Garmin devices.
GPX parser in Garmin devices is not perfect and can have problems with not well formed or compilcated HTML descriptions. 
Also PQ can contain rich text formatted logs and this can sometimes render them unreadable.

What tool does:
 - Simplify HTML code in cache description and fix potential errors (or optionally remove HTML formating)
 - Replace internationalised diacritic to simple ASCII
 - Replace emojis with ASCII emoticons if possible


## Installation

You can choose to use published version from npmjs.com or directly clone project from GitHub

### Install from NPMJS
```sh
npm install -g gcfixer
```

### Installation from Git
 - You need [NodeJS](https://nodejs.org/) to be installed on your computer.
 - Clone repository or download zip:
  ```sh
  git clone https://github.com/dullus/gcfixer.git
  ```
 - Install it
  ```sh
  cd gcfixer
  npm install -g .
  ```
 - Run it
  ```sh
  gcfixer --help
  ```
  will output:
  ```txt
  Usage: -i <infile> [-o <outfile>]

  Options:
    --help        Show help                            [boolean]
    --version     Show version number                  [boolean]
    -i, --input   Input file                 [string] [required]
    -o, --output  Output file                           [string]
    -h, --html    strip html                           [boolean]
    -s, --stdout  pipe result to stdout                [boolean]
  ```

## Sample usage

```sh
# Process file GC12345.gpx and save output to GC12345.out.gpx:
gcfixer -i GC12345.gpx

# Process file GC12345.gpx, strip html from description to plaintext and save output to output.gpx:
gcfixer -i GC12345.gpx -o output.gpx -h

# Process file GC12345.gpx and output to stdout:
gcfixer -i GC12345.gpx -s
```

## Uninstall
```sh
npm uninstall -g gcfixer
```

## API

You can use GCFixer directly as library without CLI interface in your project.

```ssh
npm install --save gcfixer
```

Then include in your project (TypeScript example):

```ts
import { Process } from 'gcfixer/src/Process';
// configure options
const params = {
  stdout: true, // matches -s switch
  stripHtml: false // matches -h switch
};
// create instance
const process = new Process('input.gpx', params);
// add some code to capture STDOUT, or use temporary file
...
// run conversion
process.run().then(
  (caches: number) => { /* .. promise resolved handler */ },
  () => { /* .. promise rejected handler */ }
);
```


