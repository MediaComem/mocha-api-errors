# mocha-api-errors

Print full API responses in your [Mocha](https://mochajs.org) tests when you get an unexpected response.

[![npm version](https://badge.fury.io/js/mocha-api-errors.svg)](https://badge.fury.io/js/mocha-api-errors)
[![Build Status](https://travis-ci.org/MediaComem/mocha-api-errors.svg?branch=master)](https://travis-ci.org/MediaComem/mocha-api-errors)
[![Coverage Status](https://coveralls.io/repos/github/MediaComem/mocha-api-errors/badge.svg?branch=master)](https://coveralls.io/github/MediaComem/mocha-api-errors?branch=master)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.txt)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
- [Usage](#usage)
- [Creating a custom reporter](#creating-a-custom-reporter)
- [Configuration](#configuration)
- [Using a custom reporter programmatically](#using-a-custom-reporter-programmatically)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Developed at the [Media Engineering Institute](http://mei.heig-vd.ch) ([HEIG-VD](https://heig-vd.ch)).



## Installation

```bash
$> npm install mocha-api-errors
```



## Usage

It can be quite annoying to write assertions on HTTP responses in tests,
because you get so little information from the assertion error:

```js
expect(res.status, 'res.status').to.equal(200);

// AssertionError: expected 400 to equal 200
//
// res.status
// + expected - actual
//
// -400
// +200
//
// at Context.it (spec/index.spec.js:12:20)
```

Okay, the server responded with the HTTP 400 Bad Request status code, but you
have no idea why. It would be great to know what was the response from the
server. Should you add code to your tests to print it if an error occurs?
Should you write a complex custom Mocha matcher for HTTP responses?

Run Mocha with the **mocha-api-errors** reporter, and it will include the HTTP
response in the error's stack trace so that you will see it if any assertion
fails:

```bash
$> mocha --reporter mocha-api-errors spec/**/*.js
```

You also need to attach the offending HTTP response to the test's `res`
property. Here's an example with
[supertest](https://github.com/visionmedia/supertest):

```js
const supertest = require('supertest');

const app = require('./my-express-app');

it('should work', async function() {
  const res = this.test.res = await supertest(app).get('/test');
  expect(res.status, 'res.status').to.equal(200);
});
```

Here's the output you might get with this configuration.  Note the HTTP
response shown before the stack trace:

```js
// AssertionError: expected 400 to equal 200
//
// res.status
// + expected - actual
//
// -400
// +200
//
// HTTP/1.1 400 Bad Request
// x-powered-by: Express
// content-type: application/json; charset=utf-8
// content-length: 13
// etag: W/"d-pedE0BZFQNM7HX6mFsKPL6l+dUo"
// date: Tue, 28 Nov 2017 08:58:02 GMT
// connection: close
//
// {
//   "why": "because"
// }
// at Context.it (spec/index.spec.js:12:20)
```

Now you know exactly what the problem is (provided that your server is kind
enough to give you that information).



## Creating a custom reporter

The **mocha-api-errors** reporter extends Mocha's spec reporter, but you can extend any other reporter by using its `extend` function:

```js
const mocha = require('mocha');
const MochaApiErrorsReporter = require('mocha-api-errors');

// Extend any existing reporter with API error enrichment:
const CustomReporter = MochaApiErrorsReporter.extend(mocha.reporters.Dot);
```

This assumes that you extend Mocha's base reporter, which adds test failures to
the `this.failures` array in the reporter.



## Configuration

The following options can be passed as the second argument to `extend`:

```js
const CustomReporter = MochaApiErrorsReporter.extend(mocha.reporters.Dot, { /* options... */ });
```

* `responseProperty` - The name of the test property where the HTTP response is expected. Defaults to `res`.
* `getResponse(test, err)` - A function that should return the HTTP response of a test when an error occurs.
  It will be called with the reporter as context (`this`), and with the test and error as arguments (the same
  arguments as Mocha's `fail` runner event). It defaults to simply returning the test property defined by the
  `responseProperty` option.
* `getError` - A function that should return the error to enrich when an error occurs in a test.
  It will be called with the reporter as context (`this`), and with the test and error as arguments (the same
  arguments as Mocha's `fail` runner event). It defaults to returning the `err` property of the last failure
  (taken from the `this.failures` array of the base reporter).



## Using a custom reporter programmatically

To use your custom reporter without publishing it as a package,
you might need to [run Mocha programmatically](https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically):

```js
const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');

// Instantiate a Mocha instance with your custom reporter.
const mocha = new Mocha({
  reporter: require('./custom-reporter')
});

const testDir = 'some/dir/test'

// Add each .js file to the mocha instance.
fs.readdirSync(testDir).filter(function(file){
  // Only keep the .js files.
  return file.substr(-3) === '.js';
}).forEach(function(file){
  mocha.addFile(
    path.join(testDir, file)
  );
});

// Run the tests.
mocha.run(function(failures){
  process.on('exit', function () {
    // Exit with non-zero status if there were failures.
    process.exit(failures);
  });
});
```
