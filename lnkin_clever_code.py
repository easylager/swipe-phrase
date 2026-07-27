"""
LINKEDIN POST — copy below
──────────────────────────

Some of the cleverest Python in production never crashes.

It just quietly refuses to be changed.

Picture three string transforms on a username field.
Somewhere along the way it acquires a Protocol, a Pipeline class,
and a factory — "so we can extend it later."

Later never RSVPs.
The requirements stay boring. The indirection stays forever.

A small tweak becomes a scavenger hunt:
which file is the real logic, and which ones are ceremony?
You didn't ship a feature. You shipped a museum exhibit
about how flexible the feature could have been.

The punchline is usually the same:
delete the framework, keep the obvious code.
Same behaviour. Smaller blast radius. A diff humans can finish
before their coffee cools.

The bug wasn't Python.
It was betting on a future that never arrived —
and charging rent on every change in the present.

When two helpers truly share a step — share that step.
When they only look alike — leave them apart.
Fake generality is just ceremony with better branding.

(Screenshots: before / after — principles, not production code.)

What's the smallest problem you've seen over-solved with architecture?
"""


# ── 1. Over-abstracted — correct, typed, still not worth it ─────────────────
#
# Not broken: runs, types, tests. Smell is ROI —
# a pluggable pipeline for one call site that never gained a second plugin.


from typing import Protocol


class Transform(Protocol):
    def __call__(self, value: str) -> str: ...


class Pipeline:
    def __init__(self, *steps: Transform) -> None:
        self._steps = steps

    def run(self, value: str) -> str:
        for step in self._steps:
            value = step(value)
        return value


def collapse_whitespace(value: str) -> str:
    # Same rule as §2 — fair comparison, not a weaker strawman
    return "_".join(value.split())


def build_username_pipeline() -> Pipeline:
    # Looks extensible. Still serves a single field.
    return Pipeline(str.strip, str.lower, collapse_whitespace)


USERNAME_PIPELINE = build_username_pipeline()


def normalize_username(raw: str) -> str:
    return USERNAME_PIPELINE.run(raw)


# ── 2. Direct — same behaviour, no indirection tax ──────────────────────────
#
# split() collapses tabs / repeated spaces — idiomatic, not naive replace(" ","_").


def normalize_username_direct(raw: str) -> str:
    return "_".join(raw.strip().lower().split())


# ── 3. Right-sized — share real overlap, keep differences local ─────────────
#
# Both want trim + lower. Only username wants whitespace → "_".
#
# Don't: one Pipeline / normalize_identity for both (email ≠ username rules).
# Do: extract canonicalize(); leave the divergent step in the caller.


def canonicalize(raw: str) -> str:
    return raw.strip().lower()


def normalize_username_shared(raw: str) -> str:
    return "_".join(canonicalize(raw).split())


def normalize_email(raw: str) -> str:
    return canonicalize(raw)
