-- Price history: one row per scrape per store
CREATE TABLE IF NOT EXISTS prices (
  id         TEXT    PRIMARY KEY,
  product_url TEXT   NOT NULL,
  product_title TEXT,
  store      TEXT    NOT NULL,
  price      REAL    NOT NULL,
  currency   TEXT    NOT NULL DEFAULT 'USD',
  scraped_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Price alerts: notify user when price drops below threshold
CREATE TABLE IF NOT EXISTS alerts (
  id              TEXT    PRIMARY KEY,
  product_url     TEXT    NOT NULL,
  threshold_price REAL    NOT NULL,
  email           TEXT    NOT NULL,
  active          INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_prices_url ON prices(product_url);
CREATE INDEX IF NOT EXISTS idx_alerts_url  ON alerts(product_url);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(active);
