import asyncio
import logging
from datetime import datetime, timezone

import pgpy
from realtime import RealtimeSubscribeStates
from supabase import AsyncClient

from .common import get_async_client

logger = logging.getLogger(__name__)

CHANNEL = "yahoo_news"
BUCKET = "yahoo-news"
CONNECTION_CHECK_SECONDS = 30
CONNECTION_FAILED_CHECKS = 3
RESTART_SECONDS = 5
BACKFILL_ROWS = 1
BACKFILL_SECONDS = 60 * 5
PROCESS_ATTEMPTS = 3


def _strip_front_matter(text: str) -> tuple[str, int]:
    if text.startswith("---\n"):
        end = text.find("\n---\n\n", 4)
        if end >= 0:
            front_matter_size = end + len("\n---\n\n")
            return text[front_matter_size:], front_matter_size
    return text, 0


def _encrypt(text: str, passphrase: str) -> str:
    return str(pgpy.PGPMessage.new(text).encrypt(passphrase))


def _published_on(publication: dict) -> str:
    return datetime.fromtimestamp(publication["providerPublishTime"], tz=timezone.utc).isoformat()


async def _cutoff(client: AsyncClient) -> str:
    return (await client.rpc("yahoo_news_latest_mvcc_timestamp").execute()).data


async def _rows(client: AsyncClient, cutoff: str) -> list[dict]:
    return (await client.table("yahoo_news").select("id, publication, pgp_messages()").eq("extracted", True).is_("pgp_messages", "null").lte("crdb_internal_mvcc_timestamp", cutoff).limit(BACKFILL_ROWS).execute()).data


async def _download(client: AsyncClient, id: str) -> str:
    return (await client.storage.from_(BUCKET).download(f"{id}.md")).decode("utf-8")


async def _insert_pgp_messages(client: AsyncClient, id: str, published_on: str, title: str, content: str) -> None:
    await client.table("pgp_messages").insert({"id": id, "published_on": published_on, "title": title, "content": content}).execute()


async def _process(client: AsyncClient, lock: asyncio.Lock, passphrase: str, row: dict) -> bool:
    async with lock:
        try:
            id = row["id"]
            publication = row["publication"]
            text = await _download(client, id)
            logger.info(f"{id}: downloaded {len(text)} characters")
            text, front_matter_size = _strip_front_matter(text)
            logger.info(f"{id}: stripped {front_matter_size} characters of front matter")
            content = await asyncio.to_thread(_encrypt, text, passphrase)
            logger.info(f"{id}: encrypted {len(content)} characters")
            await _insert_pgp_messages(client, id, _published_on(publication), publication["title"], content)
            logger.info(f"{id}: inserted")
            return True
        except Exception as error:
            logger.error(f"{row.get('id')}: {error}")
            return False


async def _backfill(client: AsyncClient, lock: asyncio.Lock, passphrase: str) -> None:
    try:
        cutoff = await _cutoff(client)
    except Exception as error:
        logger.error(f"yahoo_news: {error}")
        return

    while True:
        try:
            rows = await _rows(client, cutoff)
        except Exception as error:
            logger.error(f"yahoo_news: {error}")
            return

        if not rows:
            return

        logger.info(f"publications: {len(rows)}")

        for row in rows:
            for attempt in range(PROCESS_ATTEMPTS):
                if await _process(client, lock, passphrase, row):
                    break
                await asyncio.sleep(attempt + 1)


async def _backfill_loop(client: AsyncClient, lock: asyncio.Lock, passphrase: str) -> None:
    while True:
        await _backfill(client, lock, passphrase)
        await asyncio.sleep(BACKFILL_SECONDS)


async def _serve(client: AsyncClient, passphrase: str) -> None:
    lock = asyncio.Lock()
    failed = asyncio.Event()
    backfill_task = None

    def on_update(payload: dict) -> None:
        record = payload["data"]["record"]
        if record.get("extracted"):
            logger.info(f"{record.get('id')}: extracted")
            asyncio.create_task(_process(client, lock, passphrase, record))

    def on_status(status: RealtimeSubscribeStates, error) -> None:
        nonlocal backfill_task
        if status == RealtimeSubscribeStates.SUBSCRIBED:
            logger.info(f"{CHANNEL}: subscribed")
            backfill_task = asyncio.create_task(_backfill_loop(client, lock, passphrase))
        else:
            logger.error(f"{CHANNEL}: {status} {error}")
            failed.set()

    channel = client.channel(CHANNEL)
    channel.on_postgres_changes("UPDATE", schema="public", table="yahoo_news", callback=on_update)
    await channel.subscribe(on_status)

    try:
        missed = 0
        while not failed.is_set():
            await asyncio.sleep(CONNECTION_CHECK_SECONDS)
            missed = 0 if client.realtime.is_connected else missed + 1
            if missed >= CONNECTION_FAILED_CHECKS:
                logger.error(f"{CHANNEL}: connection lost")
                return
    finally:
        if backfill_task:
            backfill_task.cancel()


async def _main(passphrase: str) -> None:
    while True:
        client = await get_async_client()
        try:
            await _serve(client, passphrase)
        except Exception as error:
            logger.error(f"{CHANNEL}: {error}")
        finally:
            await client.realtime.remove_all_channels()
        await asyncio.sleep(RESTART_SECONDS)


def run_encrypt(args: dict) -> None:
    asyncio.run(_main(args["passphrase"]))
