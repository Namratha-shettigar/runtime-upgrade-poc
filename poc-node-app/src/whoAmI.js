// ---------------------------------------------------------------------------
// whoAmI — asks AWS "which account and role is this function running as?"
//
// THE PROBLEM PLANTED HERE:
//   "aws-sdk" (version 2) is the old AWS library. AWS ended its support in
//   Sept 2025 and it is not included in Node 18+ Lambda runtimes, so we
//   must ship it ourselves (it is in package.json). The modern replacement
//   is AWS SDK v3: the package "@aws-sdk/client-sts".
//   This one does not crash on the new runtime; it is "technical debt" the
//   upgrade PR should also clean up.
// ---------------------------------------------------------------------------

// Load the old AWS SDK v2.
const AWS = require('aws-sdk');

// The Lambda entry point.
module.exports.handler = async () => {
  // STS (Security Token Service) is the AWS service that answers "who am I?".
  const sts = new AWS.STS();
  // getCallerIdentity() asks the question; .promise() lets us "await" the answer.
  const me = await sts.getCallerIdentity().promise();
  // Return the account number and the role this function is running as.
  return { account: me.Account, arn: me.Arn };
};
