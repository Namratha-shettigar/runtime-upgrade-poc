// ---------------------------------------------------------------------------
// renderCss — converts SCSS (a nicer way to write CSS) into plain CSS.
//
// THE PROBLEM PLANTED HERE:
//   node-sass is a NATIVE package: it contains machine code compiled for one
//   exact Node version (Node 18 = "ABI 108"). It lives in the Lambda layer.
//   On any newer Node it fails with
//   "Node Sass does not yet support your current environment".
//   node-sass is also deprecated; the real fix is to switch to the pure
//   JavaScript package "sass", which works on every Node version.
// ---------------------------------------------------------------------------

// Load node-sass. In Lambda it comes from the layer (/opt/nodejs/node_modules);
// locally, the tests point to layers/sass/nodejs/node_modules.
const sass = require('node-sass');

// Turn an SCSS string into a CSS string.
function compile(scss) {
  // renderSync = do the conversion right now and return the result.
  // "data" is the SCSS text; "outputStyle: compressed" removes extra spaces.
  const result = sass.renderSync({ data: scss, outputStyle: 'compressed' });
  // result.css is raw bytes; toString() turns it into readable text.
  return result.css.toString().trim();
}

// The Lambda entry point.
module.exports.handler = async (event) => {
  // Use the SCSS sent in the event, or a small example if none was sent.
  const scss = (event && event.scss) || '$brand: #6c47ff; .btn { color: $brand; }';
  // Send back both the input and the converted CSS.
  return { scss, css: compile(scss) };
};

// Exported for the tests.
module.exports.compile = compile;
