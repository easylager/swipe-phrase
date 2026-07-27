"""
LINKEDIN POST — copy below
──────────────────────────

The most dangerous line of Python I've ever seen was also the shortest:

except Exception: pass

No crash. No Sentry. No red dashboard. Just quiet, confident failure.

Here's the pattern.

A webhook handler had one "temporary" try/except around it.
Then a partner updated their API. One field disappeared from the payload.

The handler swallowed every error and returned 200 OK —
so the partner never retried either.
Payments applied: zero. Monitoring: green. Team: calm.

We found out from a support ticket:
"Hi, I paid twice and my account is still on the free plan."

Three things that block of code taught me:

1. Catch the narrowest exception you can name.
"except KeyError" tells the next developer exactly what can break.
"except Exception" tells them nothing — and hides everything.

2. If you must catch broadly — log with context and re-raise.
Broad catches are fine at top-level loops and workers.
Silent ones are never fine. Anywhere.

3. Return the right status code.
A webhook that answers 200 on failure kills the partner's retry logic.
Fail loudly → they retry → you get a free second chance.

The uncomfortable part: nobody writes "except: pass" because they're lazy.
They write it because "I'll handle it properly later."

Later never comes. The support tickets do.

(Before/after in the screenshots — illustrative, not production code.)

What's the "temporary" fix you've seen survive longest in production?
"""


# ── Screenshot 1: the silent failure ────────────────────────────────────────


async def handle_webhook_bad(request):
    try:
        event = parse_event(await request.json())
        await apply_payment(event)
    except Exception:
        pass  # "temporary" — survived 3 code reviews and 19 days in prod

    # 200 on failure = partner never retries. Error is now invisible
    # to your monitoring AND to theirs.
    return Response(status=200)


# ── Screenshot 2: the boring fix ────────────────────────────────────────────


async def handle_webhook_good(request):
    payload = await request.json()

    try:
        event = parse_event(payload)
    except KeyError as err:
        # Narrow catch: "malformed payload" is a case we expect and own
        logger.error("webhook missing field %s, payload_id=%s", err, payload.get("id"))
        return Response(status=400)  # partner sees the failure in their dashboard

    try:
        await apply_payment(event)
    except Exception:
        # Broad catch is OK here — but it logs and re-raises, never swallows
        logger.exception("payment apply failed, event_id=%s", event.id)
        raise  # 500 → partner retries → free second chance


# ── Screenshot 3 (optional): when swallowing IS the right call ──────────────

from contextlib import suppress


def warm_cache():
    # Explicit, searchable, intentional — and the narrowest type possible.
    # Reads as a decision, not an accident.
    with suppress(FileNotFoundError):
        load_cache_file(".cache.json")


# --- stubs so the file compiles ---------------------------------------------

def parse_event(payload: dict): ...
async def apply_payment(event): ...
def load_cache_file(path: str): ...


class Response:
    def __init__(self, status: int): ...


class _Logger:
    def error(self, *a): ...
    def exception(self, *a): ...


logger = _Logger()
