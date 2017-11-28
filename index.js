const enrichApiError = require('enrich-api-error');
const mocha = require('mocha');
const { inherits } = require('util');

module.exports = extendReporter(mocha.reporters.Spec);
module.exports.extend = extendReporter;

function extendReporter(superReporter, options) {
  options = options || {};

  const getError = function(test, err) {
    return this.failures[this.failures.length - 1].err
  };

  const responseProperty = options.responseProperty || 'res';
  const getResponse = test => test[responseProperty];

  const Reporter = function(runner) {
    superReporter.call(this, runner);

    runner.on('fail', (test, err) => {
      const response = getResponse.call(this, test, err);
      if (response) {
        enrichApiError(getError.call(this, test, err), response);
      }
    });
  }

  inherits(Reporter, superReporter)

  return Reporter;
}
