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


CREATE VIEW IF NOT EXISTS yahoo_news_unencrypted AS
    SELECT
        yahoo_news.id,
        yahoo_news.publication,
        yahoo_news.crdb_internal_mvcc_timestamp AS mvcc_timestamp
    FROM yahoo_news
    WHERE yahoo_news.extracted = true
    AND NOT EXISTS (
        SELECT 1 FROM pgp_messages WHERE pgp_messages.id = yahoo_news.id
    );

ALTER VIEW yahoo_news_unencrypted OWNER TO postgres;
GRANT SELECT ON yahoo_news_unencrypted TO service_role;