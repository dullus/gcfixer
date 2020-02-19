# GCFIXER

![](https://img.shields.io/badge/version-0.7.0-red)
![](https://img.shields.io/badge/languages-JavaScript-blue)
![](https://img.shields.io/npm/types/typescript)
![](https://img.shields.io/badge/node-%3E%3D10.0.0-brightgreen)
![](https://img.shields.io/badge/npm-%3E%3D6.0.0-brightgreen)

Gcfixer is tool for normalistaion of pocket queries in GPX format in use with Garmin devices.
Recently Groundspeak introduced rich text formating in logs and this can sometimes cause trouble
when using in Garmin.

This tool can optimize:
 - Removing HTML formating in cache descriptions
 - Replacing internationalised diacritic to simple ASCII
 - Replacing emojis with ASCII emoticons

## Installation
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

## Example

Process file GC12345.gpx and save output to GC12345.out.gpx:
```sh
gcfixer -i GC12345.gpx
```

## Uninstall
```sh
npm uninstall -g gcfixer
```
