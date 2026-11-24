# poc-python-app

This is a small demo project on **Python 3.8 (`python3.8`)**. Parts of it are built to break when the Lambda runtime is upgraded, so the upgrade process has real problems to find and fix.

## What's inside

| File / folder | What it is |
|---|---|
| `.python-version` | **The only place the Python version is written** (`3.8`). Renovate changes this line when it upgrades. |
| `runtime.js` | Reads `.python-version` and turns `3.8` into `python3.8` for Serverless. It's JavaScript because Serverless is a JavaScript tool, and it isn't uploaded to Lambda. |
| `serverless.yml` | The deployment recipe: 3 functions and 1 layer. |
| `src/report.py` | Uses numpy/pandas from the layer. The machine code is **built for Python 3.8 only**. |
| `src/plugin_loader.py` | Uses the `imp` module, **removed in Python 3.12**. |
| `src/plugins/greeting.py` | A tiny example plugin that `plugin_loader` loads. |
| `src/version_check.py` | Uses `distutils`, **removed in 3.12**, and `datetime.utcnow()`, **deprecated**. |
| `layers/data/requirements.txt` | The layer's package list: `numpy==1.24.4` and `pandas==2.0.3`, the last versions that support 3.8. |
| `scripts/build-layer.sh` | Downloads those packages **built for the Python in `.python-version`** and for Lambda's Linux. |
| `tests/test_functions.py` | Automated tests. They pass on 3.8 and fail on 3.12+. |

## Results already checked on the laptop
| Python | Result |
|---|---|
| 3.8 | ✅ 3 of 3 tests pass |
| 3.13 (clean) | ❌ all 3 fail: `No module named 'imp'`, `'distutils'`, and the numpy machine code doesn't load |

## Deploy it yourself (manual)

```bash
# 1. Build the layer (~150 MB of numpy + pandas built for Python 3.8)
bash scripts/build-layer.sh

# 2. Run the tests on your laptop's Python. They FAIL on a new Python; that is expected.
#    (To run them on 3.8 you need a 3.8 interpreter, e.g. with uv:
#     uv run --no-project --python 3.8 python -m unittest discover -s tests -v)
python3 -m unittest discover -s tests -v

# 3. Log in to your AWS POC account in this terminal (your usual way), then deploy.
serverless deploy --stage dev --region ap-south-1

# 4. Try each function in AWS:
serverless invoke -f report       --stage dev --region ap-south-1
serverless invoke -f loadPlugin   --data '{"name":"Namratha"}' --stage dev --region ap-south-1
serverless invoke -f versionCheck --data '{"version":"2.3.0"}' --stage dev --region ap-south-1
```

**If step 3 fails** with *"The runtime parameter of python3.8 is no longer supported for creating or updating AWS Lambda functions"*, AWS has blocked Python 3.8. Change `.python-version` to the oldest Python version Lambda still accepts (e.g. `3.10` or `3.11`), run steps 1 and 3 again, and tell Claude. On 3.10/3.11 the planted problems still exist, because `imp` and `distutils` only disappear in 3.12.

## Remove everything from AWS afterwards
```bash
serverless remove --stage dev --region ap-south-1
```
