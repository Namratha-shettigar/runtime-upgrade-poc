// ---------------------------------------------------------------------------
// runtime.js — turns the version in .nvmrc into the Lambda runtime name.
//
// WHY THIS FILE EXISTS (the "shared runtime config pattern" from the OKR):
//   The Node version is written in ONE place only: the .nvmrc file.
//   Serverless, the layer build and the CI tests all read it from there.
//   When Renovate upgrades Node, it changes that one line ("18" -> "24")
//   and everything else follows automatically.
// ---------------------------------------------------------------------------

// "fs" is Node's built-in tool for reading files from disk.
const fs = require('fs');
// "path" is Node's built-in tool for building file paths safely.
const path = require('path');

// Read the .nvmrc file that sits next to this file, e.g. the text "18\n".
// .trim() removes the invisible newline at the end, leaving just "18".
const nodeVersion = fs.readFileSync(path.join(__dirname, '.nvmrc'), 'utf8').trim();

// Lambda names its Node runtimes like "nodejs18.x", so we build that name.
// Serverless reads this value when serverless.yml says ${file(./runtime.js):runtime}.
module.exports.runtime = () => `nodejs${nodeVersion}.x`;
