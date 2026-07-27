"""
LINKEDIN POST — copy below
──────────────────────────

Your app is green in staging. Demo day? Flawless.

Then real traffic hits — and these five patterns turn "works on my machine" into a 3am pager.

Here are 5 things that quietly kill apps under load (and how to fix them).

1. No idempotency — retries become double charges
Clients retry on timeouts. Load balancers replay requests. Without an idempotency key, every retry is a fresh payment, email, or shipment. Same user, charged twice. Not a great look.

2. No backpressure — spikes eat all your memory
When producers outrun workers, unbounded queues balloon until the process OOMs. You didn't run out of CPU — you ran out of RAM babysitting jobs that never finished.

3. Unbounded concurrency — you DDoS your own stack
asyncio.gather on 10,000 items feels fast in a notebook. In prod you just opened 10,000 DB connections and HTTP calls at once. Your dependencies have limits. Your code should too.

4. External APIs inside DB transactions — locks pile up
A transaction holds row locks until it commits. Call Stripe or a partner API inside that window and a 50ms write becomes a 30s lock. Everything else waits in line behind you.

5. Retry storms — you amplify the outage
Fifty workers retrying instantly don't help a dying service — they bury it. Backoff + jitter spread the pain. And only retry what's safe to run twice.

(Snippets below illustrate the principles — not copy-paste production code.)

What's the production bug that taught you the most?
Share it below.
"""

# Дальше по одному скриншоту на каждый пример

import asyncio

# ── 1. No idempotency — retries become double charges ───────────────────────
# Problem: client retries on timeout → second payment / email / shipment.


async def charge_card(amount: int, idempotency_key: str): ...
async def find_payment_by_key(key: str): ...
async def save_payment(key: str, result): ...


async def create_payment_bad(amount: int):
    # BAD: every retry is a brand-new charge
    return await charge_card(amount, idempotency_key="")


async def create_payment_good(amount: int, idempotency_key: str):
    # GOOD: same key → same result, safe to retry
    if existing := await find_payment_by_key(idempotency_key):
        return existing
    result = await charge_card(amount, idempotency_key=idempotency_key)
    await save_payment(idempotency_key, result)
    return result


# ── 2. No backpressure — spikes eat all your memory ─────────────────────────
# Problem: accept every job instantly → unbounded list → OOM under spike.


async def process_job(job: dict): ...


pending: list[dict] = []  # BAD: grows forever when workers fall behind


async def enqueue_bad(job: dict):
    pending.append(job)  # never blocks — memory absorbs the spike


queue: asyncio.Queue[dict] = asyncio.Queue(maxsize=100)


async def enqueue_good(job: dict):
    # GOOD: at 100 items, await put() pauses this coroutine until worker gets one
    await queue.put(job)


async def worker():
    while True:
        job = await queue.get()  # frees a slot → a blocked put() can proceed
        await process_job(job)
        queue.task_done()


# ── 3. Unbounded concurrency — you DDoS your own stack ────────────────────
# Problem: 10k tasks at once → connection pool + partner API collapse.

urls = ["https://api.example.com/item/1", "..."]


async def fetch(url: str): ...


async def fetch_all_bad():
    # BAD: 10,000 URLs → 10,000 simultaneous connections
    return await asyncio.gather(*(fetch(url) for url in urls))


limit = asyncio.Semaphore(20)  # GOOD: cap in-flight work to what infra handles


async def fetch_limited(url: str):
    async with limit:
        return await fetch(url)


async def fetch_all_good():
    return await asyncio.gather(*(fetch_limited(url) for url in urls))


# ── 4. External APIs inside DB transactions — locks pile up ─────────────────
# Problem: row locked while Stripe/partner takes seconds → queue behind you.

db = ...
stripe = ...


async def checkout_bad(order_id: str, total: int):
    async with db.transaction():
        order = await db.lock_order(order_id)
        # BAD: DB lock held for entire HTTP round-trip (2–30s)
        charge = await stripe.charge(total)
        order.status = "paid"
        order.charge_id = charge.id


async def checkout_good(order_id: str, total: int, idempotency_key: str):
    # GOOD: short txn — release locks, then call out
    async with db.transaction():
        order = await db.mark_payment_pending(order_id)

    charge = await stripe.charge(total, idempotency_key=idempotency_key)

    async with db.transaction():
        await db.mark_paid(order_id, charge.id)


# ── 5. Retry storms — you amplify the outage ────────────────────────────────
# Problem: tight retry loop × many workers = harder spike than the original.

import random


async def call_partner(): ...


async def call_partner_bad():
    # BAD: hammers a service that is already failing
    for _ in range(50):
        try:
            return await call_partner()
        except Exception:
            continue
    raise RuntimeError("gave up")


async def call_partner_good():
    # GOOD: exponential backoff + jitter; cap attempts
    for attempt in range(5):
        try:
            return await call_partner()
        except Exception:
            delay = min(30, 2**attempt) + random.uniform(0, 1)
            await asyncio.sleep(delay)
    raise RuntimeError("gave up")
