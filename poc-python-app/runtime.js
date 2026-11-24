// ---------------------------------------------------------------------------
// runtime.js — turns the version in .python-version into the Lambda runtime name.
//
// Why a JavaScript file in a Python project? Serverless Framework itself is
// written in JavaScript, and it can only run JS files to compute a value.
// This file is used only at deploy time and is NOT uploaded to Lambda.
//
// The shared runtime config pattern: the Python version is written in ONE
// place only, .python-version. Renovate upgrades that one line ("3.8" ->
// "3.13") and serverless.yml, the layer build and the CI tests all follow.
// ---------------------------------------------------------------------------

// Node's built-in tools for reading files and building file paths.
const fs = require('fs');
const path = require('path');

// Read .python-version (e.g. "3.8\n") and remove the newline at the end -> "3.8".
const pythonVersion = fs.readFileSync(path.join(__dirname, '.python-version'), 'utf8').trim();

// Lambda names Python runtimes like "python3.8", so we add "python" in front.
// serverless.yml reads this through ${file(./runtime.js):runtime}.
module.exports.runtime = () => `python${pythonVersion}`;
