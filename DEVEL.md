## Build
Project is not using ts-node hence TS files need to be compiled to JS before use:

```sh
yarn build
```

## Lint

Source codes should comply with configured TSLint rules, to run:

```sh
yarn lint
```

## Unit testing

Crucial code is covered by the unit tests which are handled by Jest test runner:

```sh
yarn test
```

## Code coverage

To check code covered by unit test run:

```sh
yarn test:coverage
```
You can check also html output in `test/coverage/index.html` .

## Debugging tests

Steps how to debug test.

 1. add `debugger;` at in code where you want to stop and examine unit test
 2. in Chrome go to URL `chrome://inspect/`
 3. launch desired test with those modifiers:
 ```sh
 node --inspect-brk node_modules/.bin/jest --runInBand src/utils.test.ts
 ```
 4. In Chrome under **Remote Target** section link to your test will appear, click `inspect`.
 5. DevTools will launch in paused mode. Click `]>` and after few seconds your test will halt at breakpoint.