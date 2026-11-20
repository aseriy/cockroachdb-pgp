import os

from supabase import acreate_client, AsyncClient

url = os.environ["COCKROACHBASE_URL"].rstrip("/")
service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


async def get_async_client() -> AsyncClient:
    return await acreate_client(url, service_key)
