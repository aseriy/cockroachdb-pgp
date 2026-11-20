CREATE TABLE IF NOT EXISTS pgp_messages (
    id uuid PRIMARY KEY,
    published_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    content text NOT NULL
);
ALTER TABLE pgp_messages OWNER TO postgres;
GRANT SELECT ON pgp_messages TO anon, authenticated, service_role;
GRANT INSERT ON pgp_messages TO service_role;
