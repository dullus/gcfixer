# GCFIXER

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
  git clone https://bitbucket.org/dullus/gcfixer
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
