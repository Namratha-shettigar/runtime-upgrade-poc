#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# check.sh — READ-ONLY checks after deploying Step 2. Changes nothing in AWS.
# Run it after logging in to your POC account:
#     bash scripts/check.sh ap-south-1
# ---------------------------------------------------------------------------

# Stop on missing variables (-u) and failed pipes. Not "-e": we want every
# check to run even if one fails, so you see the full picture.
set -uo pipefail

# The region to check: the first word after the command, or Mumbai by default.
REGION="${1:-ap-south-1}"
# Go to the runtime-governance folder so file paths below work.
cd "$(dirname "$0")/.."

# A small helper that prints a heading, so the output is easy to read.
step() { echo; echo "=================== $1 ==================="; }

step "0. Who am I? (account the checks run against)"
aws sts get-caller-identity --query Account --output text

step "1. Is AWS Config recording? (expect: recording = true)"
aws configservice describe-configuration-recorder-status --region "$REGION" \
  --query 'ConfigurationRecordersStatus[].{name:name,recording:recording,lastStatus:lastStatus}' --output table

step "2. Inventory: every Lambda function and its runtime (from AWS Config)"
# Same question as the saved query "lambda-runtime-inventory".
aws configservice select-resource-config --region "$REGION" \
  --expression "SELECT resourceName, configuration.runtime WHERE resourceType = 'AWS::Lambda::Function'" \
  --query 'Results' --output text

step "3. Functions on an OLD runtime (Config rule: lambda-supported-runtimes)"
# Lists functions the rule marked NON_COMPLIANT. Expect your 6 POC functions.
# Right after deploying it can take a few minutes for the first evaluation.
aws configservice get-compliance-details-by-config-rule --region "$REGION" \
  --config-rule-name lambda-supported-runtimes --compliance-types NON_COMPLIANT \
  --query 'EvaluationResults[].EvaluationResultIdentifier.EvaluationResultQualifier.ResourceId' --output text

step "4. Lambda LAYERS and the runtimes they support (Config can't record layers)"
aws lambda list-layers --region "$REGION" \
  --query 'Layers[].{layer:LayerName,version:LatestMatchingVersion.Version,runtimes:join(`,`,LatestMatchingVersion.CompatibleRuntimes || `[]`)}' --output table

step "5. Does the Health alert rule match a sample deprecation event? (expect: true)"
# AWS doesn't allow sending fake aws.health events, so we ask EventBridge:
# "would this sample event match the rule?" — a dry run.
PATTERN=$(aws events describe-rule --region "$REGION" --name lambda-runtime-deprecation-alert --query EventPattern --output text)
aws events test-event-pattern --region "$REGION" --event-pattern "$PATTERN" \
  --event file://test-events/lambda-deprecation-event.json --query Result --output text

step "6. Email subscription confirmed? (expect: an ARN, NOT 'PendingConfirmation')"
TOPIC_ARN="arn:aws:sns:${REGION}:$(aws sts get-caller-identity --query Account --output text):lambda-runtime-alerts"
aws sns list-subscriptions-by-topic --region "$REGION" --topic-arn "$TOPIC_ARN" \
  --query 'Subscriptions[].{email:Endpoint,status:SubscriptionArn}' --output table

step "7. Security Hub control Lambda.2 results (only if you deployed file 04)"
aws securityhub get-findings --region "$REGION" \
  --filters '{"ComplianceSecurityControlId":[{"Value":"Lambda.2","Comparison":"EQUALS"}],"RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}' \
  --query 'Findings[].{function:Resources[0].Id,status:Compliance.Status}' --output table 2>/dev/null \
  || echo "Security Hub not enabled (file 04 not deployed) - that's OK."

echo
echo "Done. Nothing was changed."
