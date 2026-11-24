// ---------------------------------------------------------------------------
// checkInput — tells you whether the input is a list (array) or a date.
//
// THE PROBLEM PLANTED HERE:
//   util.isArray() and util.isDate() are old helper functions. Node marked
//   them "deprecated" years ago, and Node 23 REMOVED them. On nodejs24.x this
//   code crashes with "TypeError: util.isArray is not a function".
//   The correct modern code: Array.isArray(x) and (x instanceof Date).
// ---------------------------------------------------------------------------

// Load Node's built-in "util" module (no install needed).
const util = require('util');

// Our check, kept separate from the Lambda handler so tests can call it directly.
function describe(value) {
  // util.isArray returns true if value is a list like [1, 2, 3].
  if (util.isArray(value)) return 'array';
  // util.isDate returns true if value is a Date object.
  if (util.isDate(value)) return 'date';
  // Anything else.
  return 'other';
}

// The "handler" is what Lambda calls. "event" is the input sent to the function.
// "async" means it can wait for things; Lambda waits for it to finish.
module.exports.handler = async (event) => {
  // If the input has a "value" field, check it; otherwise check the whole input.
  const value = event && event.value !== undefined ? event.value : event;
  // Return the answer. Lambda sends this back to whoever called the function.
  return { input: value, type: describe(value) };
};

// Also export describe() so the tests in test/ can use it.
module.exports.describe = describe;
