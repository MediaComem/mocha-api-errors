/* istanbul ignore file */
const { expect } = require('chai');
const EventEmitter = require('events');
const _ = require('lodash');
const { stub } = require('sinon');

const Reporter = require('../');
const extend = Reporter.extend;

describe('mocha-api-errors', () => {
  it('should be a constructor which creates a mocha reporter', () => {
    const runner = mockRunner();
    const reporter = new Reporter(runner);
    expect(runner.on.called).to.equal(true);
  });

  it('should not do anything if no HTTP response is available', () => {

    const runner = mockRunner();
    const reporter = new Reporter(runner);

    const test = {};
    const err = new Error('bug');
    const stack = err.stack;

    silently(() => runner.emit('fail', test, err));

    expect(err.stack).to.eql(stack);
  });

  it('should add the HTTP response to error stack traces when available', () => {

    const runner = mockRunner();
    const reporter = new Reporter(runner);

    const test = {
      body: 'foobar',
      res: mockHttpResponse({
        headers: {
          foo: 'bar',
          bar: 'baz'
        },
        status: 200
      })
    };

    const err = new Error('bug');
    const stack = err.stack = 'bug\n    at foo:1\n    at bar:2';

    silently(() => runner.emit('fail', test, err));

    expect(err.stack).to.eql('bug\n    HTTP/1.1 200 OK\n    foo: bar\n    bar: baz\n\n    at foo:1\n    at bar:2');
  });
});

function mockRunner() {

  const emitter = new EventEmitter();

  emitter.failures = [];
  emitter.on('fail', (test, err) => {
    emitter.failures.push({
      err: err
    });
  });

  stub(emitter, 'on').callThrough();

  return emitter;
}

function mockHttpResponse(options) {

  const mock = _.defaults({}, options, {
    headers: {},
    httpVersion: '1.1'
  });

  mock.get = name => mock.headers[name.toLowerCase()];

  return mock;
}

function silently(callback) {
  const log = console.log;
  console.log = _.noop;
  callback();
  console.log = log;
}
