"""
LINKEDIN POST — copy below
──────────────────────────

You've seen the same "10 Python tricks" lists a hundred times.

These five stdlib gems aren't flashy — but they're the kind you try once
and then wonder why you ever did it the hard way.

(Snippets illustrate the idea — not copy-paste production code.)

1. Exception.add_note() — debug context without wrapping exceptions
Re-raising with a new exception hides the original type. Wrapping in another class is noisy. add_note() appends context to the traceback — same error, more clues when you're paged at 2am.

2. graphlib.TopologicalSorter — dependency order, no NetworkX
Build pipelines, migrations, task runners — someone always hand-rolls topo sort. stdlib has had this since 3.9. Pass a dict of "node → dependencies" and iterate in safe order.

3. itertools.pairwise — consecutive pairs, zero off-by-one
Diffs, rate-of-change, "is this row valid given the previous one?" — you don't need zip(lst, lst[1:]) or index math. pairwise() walks the window for you.

4. functools.singledispatch — isinstance chains, gone
Serializers, formatters, CLI encoders — one function name, different behaviour per type. Register handlers by type instead of a 40-line elif tree.

5. heapq.merge — merge sorted streams lazily
Concatenate three sorted log files? Don't load them all, don't sort again. merge() yields the combined stream in order — constant memory, one pass.

Which stdlib module did you discover embarrassingly late?
Share it below.
"""


# ── 1. Exception.add_note() — context without wrapping ─────────────────────
# Use when: re-raise same type but ops needs order_id / user_id on traceback.


def fetch_order(order_id: str): ...
def charge(order): ...


def process_payment_bad(order_id: str, user_id: str):
    try:
        order = fetch_order(order_id)
        return charge(order)
    except ConnectionError:
        # BAD: new exception type — callers/handlers lose the original shape
        raise RuntimeError(f"payment failed order={order_id} user={user_id}")


def process_payment_good(order_id: str, user_id: str):
    try:
        order = fetch_order(order_id)
        return charge(order)
    except ConnectionError as err:
        # GOOD: same type, richer traceback (Python 3.11+)
        err.add_note(f"order_id={order_id}")
        err.add_note(f"user_id={user_id}")
        raise


# ── 2. graphlib.TopologicalSorter — dependency order from stdlib ───────────
# Use when: migrations, DAG steps, build pipeline — "B after A".


from graphlib import TopologicalSorter


# node → things that must finish before this node runs
pipeline = {
    "lint": set(),
    "test": {"lint"},
    "build": {"lint", "test"},
    "deploy": {"build", "test"},
}

# BAD: manual ordering, breaks when deps change
run_order_bad = ["lint", "test", "build", "deploy"]

# GOOD: derive order from the graph
run_order_good = list(TopologicalSorter(pipeline).static_order())


# ── 3. itertools.pairwise — consecutive pairs without index tricks ────────
# Use when: deltas, validation against previous row, sliding pairs.


from itertools import pairwise


readings = [10, 11, 15, 14, 20]
THRESHOLD = 5


def check_spikes_bad(values: list[int]):
    # BAD: easy off-by-one, extra slice allocation
    for i in range(1, len(values)):
        if values[i] - values[i - 1] > THRESHOLD:
            return values[i]


def check_spikes_good(values: list[int]):
    # GOOD: (prev, curr) pairs, no indices (Python 3.10+)
    for prev, curr in pairwise(values):
        if curr - prev > THRESHOLD:
            return curr

            
from datetime import datetime
from decimal import Decimal

# ── 4. functools.singledispatch — one entry point, per-type handlers ──────
# Use when: serializers / exporters / "convert anything to JSON-ish".

from functools import singledispatch


@singledispatch
def to_json(obj):
    # BAD without dispatch: isinstance tree grows forever
    raise TypeError(f"unsupported: {type(obj)!r}")


@to_json.register
def _(obj: datetime):
    return obj.isoformat()


@to_json.register
def _(obj: Decimal):
    return str(obj)


@to_json.register
def _(obj: dict):
    return {k: to_json(v) for k, v in obj.items()}


# to_json({"paid_at": datetime.now(), "amount": Decimal("9.99")})


# ── 5. heapq.merge — lazy merge of already-sorted streams ─────────────────
# Use when: merge log shards, paginated sorted API pages, k sorted files.


import heapq


def iter_shard(path: str):
    ...  # yields rows sorted by timestamp


# BAD: materialize everything, sort again
def merge_logs_bad(shards: list[str]):
    rows = [row for path in shards for row in iter_shard(path)]
    return sorted(rows, key=lambda r: r["ts"])


def merge_logs_good(shards: list[str]):
    # GOOD: yields globally sorted stream, bounded memory
    streams = (iter_shard(path) for path in shards)
    return heapq.merge(*streams, key=lambda r: r["ts"])
