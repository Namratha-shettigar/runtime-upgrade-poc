# runtime-governance (Step 2: detect old runtimes with built-in AWS features)

This folder switches on **AWS's own tools** so they find and report Lambda functions on old runtimes. It contains **no custom code**, only settings files (CloudFormation templates).

## What each file does

| File | Built-in AWS feature | What you get |
|---|---|---|
| `01-config-recorder.yml` | **AWS Config** | AWS keeps a record of every Lambda function and its runtime. **Skip it if Config is already on.** |
| `02-runtime-rules.yml` | **Config managed rule** + **saved queries** | Old-runtime functions show as **NON_COMPLIANT** (red), and you get an inventory list. |
| `03-health-alerts.yml` | **AWS Health → EventBridge → SNS** | An **email** when AWS announces that a Lambda runtime is retiring. |
| `04-security-hub.yml` *(optional)* | **Security Hub, control Lambda.2** | A ready-made dashboard. AWS keeps its runtime list up to date. Costs money after a 30-day free trial. |
| `scripts/check.sh` | (read-only AWS CLI) | Checks that everything works. **Changes nothing.** |
| `test-events/lambda-deprecation-event.json` | | A *sample* AWS Health event used for a dry-run test. |

**Not a file but also built in: Trusted Advisor.** In the AWS console, open Trusted Advisor → Security → "AWS Lambda Functions Using Deprecated Runtimes". Its weekly email can be switched on under Trusted Advisor → Preferences. Whether this check is available depends on your account's support plan.

**Lambda layers:** AWS Config can't record layers, so `check.sh` lists them with `aws lambda list-layers`.

## Words you'll see
- **Stack:** one deployed template. You can delete a stack later, which removes everything it created.
- **COMPLIANT / NON_COMPLIANT:** passes or fails the rule (green or red).
- **SNS topic:** a "notice board" that forwards messages to subscribers, such as an email address.
- **EventBridge rule:** "IF this event happens, THEN send it there".

## Deploy (manual, in the same region as your apps)

Log in to your AWS POC account in the terminal first. Then, from this folder:

```bash
# 0. Is AWS Config already on? If this prints a recorder, SKIP step 1.
aws configservice describe-configuration-recorders --region ap-south-1

# 1. Turn on AWS Config (records Lambda functions only)
#    --capabilities CAPABILITY_IAM = "yes, this template may create an IAM role"
aws cloudformation deploy --region ap-south-1 \
  --stack-name runtime-gov-config \
  --template-file 01-config-recorder.yml \
  --capabilities CAPABILITY_IAM

# 2. The runtime rule + inventory queries
aws cloudformation deploy --region ap-south-1 \
  --stack-name runtime-gov-rules \
  --template-file 02-runtime-rules.yml

# 3. Email alerts (put YOUR email address). Then open your inbox and click
#    "Confirm subscription" in the email from AWS Notifications.
aws cloudformation deploy --region ap-south-1 \
  --stack-name runtime-gov-health-alerts \
  --template-file 03-health-alerts.yml \
  --parameter-overrides AlertEmail=namratha.shettigar@7edge.com

# 4. (Optional) Security Hub. Skip if `aws securityhub describe-hub` shows it's already on.
aws cloudformation deploy --region ap-south-1 \
  --stack-name runtime-gov-security-hub \
  --template-file 04-security-hub.yml
```

## Check it worked
```bash
bash scripts/check.sh ap-south-1
```
See "What you should see" in the main conversation, or the comments inside `check.sh`.

## Changing the allowed runtimes later
When AWS announces a retirement, remove that runtime from the list and redeploy step 2:
```bash
aws cloudformation deploy --region ap-south-1 --stack-name runtime-gov-rules \
  --template-file 02-runtime-rules.yml \
  --parameter-overrides AllowedRuntimes=nodejs26.x,nodejs24.x,python3.15,python3.14,python3.13,python3.12
```

## Remove everything afterwards (to stop costs)
```bash
aws cloudformation delete-stack --region ap-south-1 --stack-name runtime-gov-security-hub
aws cloudformation delete-stack --region ap-south-1 --stack-name runtime-gov-health-alerts
aws cloudformation delete-stack --region ap-south-1 --stack-name runtime-gov-rules
aws cloudformation delete-stack --region ap-south-1 --stack-name runtime-gov-config
# The Config S3 bucket is kept on purpose (it holds history). Empty and delete it by hand if you want.
```
