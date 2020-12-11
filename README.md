Custom ESLint rules
===================

ESLint rules with modified behavior or additional options that won't be merged into upstream
for "as designed" or "stylistic features frozen" etc. reasons.

* [Installation](#installation)
* [Usage](#usage)
* [Rules](#rules)
  * [`no-invalid-this`](#no-invalid-this)
  * [`no-magic-numbers`](#no-magic-numbers)
  * [`no-underscore-dangle`](#no-underscore-dangle)

Installation
------------

Just clone the repo or download it as tarball and unpack

Usage
-----

Improved rules could be used as replacements to stock ones (just move them to `%{eslint}/lib/rules` folder)
but it's easier and more correct to add them as custom rule set.

- Via command line: run ESLint with parameter

  ```
  --rulesdir <path to ESLint-custom-rules>
  ```

- With VSCode and ESLint plugin by Dirk Baeumer - add following lines to `settings.json` (note `rulePaths` property not `rulesdir`!)

  ```json
  "eslint.options": {
    "rulePaths": ["<path to ESLint-custom-rules>"]
  },
  ```

Rules
-----

### no-invalid-this

**Modification**: detects Node-specific event listener assignments and doesn't alert in these cases.

Issues: https://github.com/eslint/eslint/issues/11349 ("Node-specific"), https://github.com/mysticatea/eslint-plugin-node/issues/4 (no reaction)

Before:

```js
process.on('exit', function() { console.log(this.argv); });
// Message "Unexpected 'this'"
```

After:

```js
process.on('exit', function() { console.log(this.argv); });
// OK
```

### no-magic-numbers

**Modification**: add `ignoreConstDeclaration: boolean` option which, if enabled, allows numbers in declaration of constants.

Issue: https://github.com/eslint/eslint/issues/13239 ("As intended" + "freeze stylistic rules")

```js
// no-magic-numbers: "error"
const MSEC_PER_MIN = 60 * 1000;
const DEF_OPTS = { timeout: 10 * MSEC_PER_MIN };
// Messages "No magic number: " for 60, 1000 and 10
```

```js
// no-magic-numbers: ["error", { "ignoreConstDeclaration": true }]
const MSEC_PER_MIN = 60 * 1000;
const DEF_OPTS = { timeout: 10 * MSEC_PER_MIN };
// OK
let interv = 20 * MSEC_PER_MIN;
console.log( 1 * 2 * 3);
// Will still produce messages
```

### no-underscore-dangle

**Modification**: add `allowAfter: string[]` option which defines list of identifiers after which dangling underscores are allowed.

PR: https://github.com/eslint/eslint/pull/13590 ("Freeze stylistic rules")

```js
// no-underscore-dangle: "error"
const self = this;
some.on('event', function() {
  self._private();
});
// Message "Unexpected dangling '_' in '_private'"
```

```js
// no-underscore-dangle: ["error", { "allowAfter": [ "self" ] }]
const self = this;
some.on('event', function() {
  self._private();
});
// OK
```