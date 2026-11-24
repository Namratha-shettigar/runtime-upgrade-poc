# ---------------------------------------------------------------------------
# report — takes a list of sales and returns total, average and best region.
#
# THE PROBLEM PLANTED HERE:
#   numpy 1.24.4 and pandas 2.0.3 (the last versions that support Python 3.8)
#   live in the layer. They contain machine code compiled for Python 3.8 only
#   (files ending in "cpython-38"). On Python 3.12+ the import fails.
#   The fix: rebuild the layer for the new Python with newer numpy/pandas.
# ---------------------------------------------------------------------------

# numpy does fast number crunching; "np" is the usual short name.
import numpy as np
# pandas works with tables of data ("DataFrames"); "pd" is the usual short name.
import pandas as pd

# Example data used when the caller sends nothing.
SAMPLE_SALES = [
    {"region": "south", "amount": 1200},
    {"region": "north", "amount": 800},
    {"region": "south", "amount": 450},
    {"region": "west", "amount": 975},
]


def summarise(sales):
    """Turn a list of {region, amount} records into a small summary."""
    # Put the records into a table: one row per sale, columns "region" and "amount".
    df = pd.DataFrame(sales)
    # Add up the amounts per region, e.g. south -> 1650.
    per_region = df.groupby("region")["amount"].sum()
    return {
        # Sum of all amounts. int() turns numpy's number type into a normal number.
        "total": int(df["amount"].sum()),
        # Average amount, rounded to 2 decimals using numpy.
        "average": float(np.round(df["amount"].mean(), 2)),
        # The region with the highest total. idxmax() = "label of the biggest value".
        "best_region": per_region.idxmax(),
    }


def handler(event, context):
    """Lambda entry point. 'event' = the input; 'context' = info from Lambda."""
    # Use the sales from the input if given, otherwise the sample data.
    sales = (event or {}).get("sales", SAMPLE_SALES)
    # Return the summary; Lambda sends it back to the caller.
    return summarise(sales)
