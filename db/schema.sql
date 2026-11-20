CREATE TABLE IF NOT EXISTS pgp_messages (
    id uuid NOT NULL REFERENCES yahoo_news(id),
    published_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    content text NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE pgp_messages OWNER TO postgres;
GRANT SELECT ON pgp_messages TO anon, authenticated, service_role;
GRANT INSERT ON pgp_messages TO service_role;
