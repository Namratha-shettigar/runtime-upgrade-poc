# runtime-upgrade-poc

This is a proof of concept for the Q3 OKR **"Turn runtime upgrades from manual work into review-and-approve"**.

It shows the full flow in one AWS account:
1. Lambda apps run on **old runtimes**: Node 18 and Python 3.8.
2. **Built-in AWS features** find the old runtimes and send an alert when AWS announces a retirement.
3. **Renovate** opens upgrade PRs to the **latest Lambda runtimes** (Node 26 and Python 3.15).
4. **Tests run on the old and new runtime**, and a developer reviews and approves.

## Folders

| Folder | What it is | Status |
|---|---|---|
| [`poc-node-app/`](poc-node-app/) | Serverless app on `nodejs18.x` with code and packages that break on newer Node | Deployed |
| [`poc-python-app/`](poc-python-app/) | Serverless app on `python3.8` with code and packages that break on newer Python | Deployed |
| [`runtime-governance/`](runtime-governance/) | CloudFormation for AWS Config, the runtime rule, and Health → email alerts | Deployed |

Each folder has its own README with explanations and deploy steps.

## Step 3: Renovate and tests on GitHub

| File | What it does |
|---|---|
| [`renovate.json5`](renovate.json5) | Renovate's rules: what to update, grouping, 3-day wait, never automerge, reviewer checklist. |
| [`.github/workflows/renovate.yml`](.github/workflows/renovate.yml) | Runs Renovate: **weekly** for packages, and **on demand** for the runtime (a button, or triggered by AWS). |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Tests every PR on the **old and new runtime** inside AWS's Lambda images. |
| [`.github/pull_request_template.md`](.github/pull_request_template.md) | The checklist for PRs that people open. |
| [`runtime-governance/05-github-trigger.yml`](runtime-governance/05-github-trigger.yml) | AWS retirement notice → starts the runtime upgrade on GitHub. |

### Setup (one time)

#### Token 1: `RENOVATE_TOKEN` (lets Renovate create branches and PRs)
GitHub's built-in token can't be used. PRs created with it don't start the test workflow, so the tests would never run on Renovate's PRs.

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token** (https://github.com/settings/personal-access-tokens/new).
2. **Name:** `renovate-runtime-upgrade-poc`. **Expiration:** 90 days.
3. **Repository access:** *Only select repositories* → `runtime-upgrade-poc`.
4. **Permissions → Repository permissions**, set each of these to **Read and write**:
   - **Contents:** create branches with the changes
   - **Pull requests:** open and update PRs
   - **Issues:** add labels
   - **Workflows:** lets Renovate update files in `.github/workflows`
   - **Commit statuses:** read the test results on its PRs

   *Metadata: Read* is added automatically.
5. Click **Generate token** and copy it. GitHub shows it only once.
6. In the repo, go to **Settings → Secrets and variables → Actions → New repository secret**:
   - **Name:** `RENOVATE_TOKEN`
   - **Secret:** paste the token, then click **Add secret**.

#### Token 2: for AWS (lets AWS start the runtime upgrade)
1. Create another fine-grained token the same way: name `aws-eventbridge-runtime-trigger`, the same repository, and **only one permission: Contents → Read and write**. That's what GitHub requires to start a workflow by API call.
2. Deploy file 05. It asks for the token **without showing it on screen and without saving it in your terminal history**:
   ```bash
   cd runtime-governance
   read -rsp "Paste GitHub token 2 and press Enter: " GH_TOKEN; echo
   aws cloudformation deploy --region ap-south-1 \
     --stack-name runtime-gov-github-trigger \
     --template-file 05-github-trigger.yml \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides GitHubToken="$GH_TOKEN"
   unset GH_TOKEN
   ```

### Try it
1. **Weekly package updates:** go to **Actions → Renovate → Run workflow** and choose mode **packages**. Package PRs appear in the **Pull requests** tab.
2. **Runtime upgrade:** run the workflow again with mode **runtime**. You should get two PRs, one moving Node 18 → 26 and one moving Python 3.8 → 3.15.
3. **Tests:** on each runtime PR, the **Tests (old and new runtime)** checks run. The old version passes and the new one fails, showing what needs fixing.
4. **AWS trigger (needs token 2):** send a test notice. A new Renovate run appears with the event *repository_dispatch*:
   ```bash
   aws events put-events --region ap-south-1 \
     --entries file://runtime-governance/test-events/github-trigger-test.json
   ```

> On a free GitHub account, a private repo **can't force** "tests must pass before merging" (that needs GitHub Pro). Reviewers have to check the test results themselves.

## Where the runtime version lives
Each app stores its runtime version in **one file**:
- `poc-node-app/.nvmrc` holds `18`;
- `poc-python-app/.python-version` holds `3.8`.

Serverless, the layer builds and the tests all read from that file. An upgrade therefore changes one line.
