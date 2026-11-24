# poc-node-app

This is a small demo project on **Node 18 (`nodejs18.x`)**. Parts of it are built to break when the Lambda runtime is upgraded, so the upgrade process has real problems to find and fix.

## What's inside

| File / folder | What it is |
|---|---|
| `.nvmrc` | **The only place the Node version is written** (`18`). Renovate changes this line when it upgrades. |
| `runtime.js` | Reads `.nvmrc` and turns `18` into `nodejs18.x` for Serverless. |
| `serverless.yml` | The deployment recipe: 3 functions and 1 layer. |
| `src/checkInput.js` | Uses `util.isArray` / `util.isDate`, which were **removed in Node 23**. |
| `src/renderCss.js` | Uses `node-sass` from the layer, a **native binary built for Node 18 only**. |
| `src/whoAmI.js` | Uses `aws-sdk` **v2**, which is end of support and should move to SDK v3. |
| `layers/sass/nodejs/package.json` | The layer's package list (`node-sass@8.0.0`). |
| `scripts/build-layer.sh` | Installs the layer's packages **under the Node version in `.nvmrc`**. |
| `test/functions.test.js` | Automated tests. They pass on Node 18 and fail on newer Node. |

### What's in `package.json` (JSON files can't hold comments)
- `"engines": { "node": ">=18 <19" }` says "this project only supports Node 18". This makes the version lock visible.
- `"scripts"` holds shortcuts: `npm run build:layer` builds the layer, and `npm test` runs the tests.
- `"dependencies"` lists the packages the functions need. `aws-sdk` v2 is included because Node 18+ Lambda runtimes no longer contain it.

## Deploy it yourself (manual)

```bash
# 1. Download the functions' packages (aws-sdk) into node_modules/
npm install

# 2. Build the layer: downloads Node 18 temporarily and installs node-sass for it
npm run build:layer

# 3. Run the tests (should say "pass 3")
npx -p node@18 -- npm test

# 4. Log in to your AWS POC account in this terminal (your usual way), then deploy.
#    --stage dev = the "dev" environment. --region = where in the world to deploy.
serverless deploy --stage dev --region ap-south-1

# 5. Try each function in AWS:
serverless invoke -f checkInput --data '{"value":[1,2,3]}' --stage dev --region ap-south-1
serverless invoke -f renderCss --stage dev --region ap-south-1
serverless invoke -f whoAmI   --stage dev --region ap-south-1
```

**If step 4 fails** with an error like *"The runtime parameter of nodejs18.x is no longer supported for creating or updating AWS Lambda functions"*, AWS has blocked Node 18. Change `.nvmrc` to `20`, run steps 2–4 again, and tell Claude, because the planted problems need a small adjustment for Node 20.

## Remove everything from AWS afterwards
```bash
serverless remove --stage dev --region ap-south-1
```
