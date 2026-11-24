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

## Where the runtime version lives
Each app stores its runtime version in **one file**:
- `poc-node-app/.nvmrc` holds `18`;
- `poc-python-app/.python-version` holds `3.8`.

Serverless, the layer builds and the tests all read from that file. An upgrade therefore changes one line.
