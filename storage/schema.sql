CREATE TABLE IF NOT EXISTS tickers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  date TEXT NOT NULL,
  close_price REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'yahoo_finance',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ticker, date)
);

CREATE TABLE IF NOT EXISTS btc_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  close_price REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'yahoo_finance',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  filing_date TEXT NOT NULL,
  btc_holdings REAL NOT NULL,
  shares_outstanding REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'sec_edgar',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ticker, filing_date)
);

CREATE TABLE IF NOT EXISTS mnav_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  date TEXT NOT NULL,
  mstr_price REAL NOT NULL,
  btc_price REAL NOT NULL,
  btc_holdings REAL NOT NULL,
  shares_outstanding REAL NOT NULL,
  market_cap REAL NOT NULL,
  btc_treasury_value REAL NOT NULL,
  btc_per_share REAL NOT NULL,
  mnav REAL NOT NULL,
  mnav_30d_avg REAL,
  mnav_30d_std REAL,
  btc_realized_vol_30d REAL,
  is_purchase_event INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ticker, date)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_hash TEXT NOT NULL UNIQUE,
  owner TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  requests_per_minute INTEGER NOT NULL DEFAULT 30,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO tickers(symbol, name) VALUES ('MSTR', 'MicroStrategy (Strategy)');
INSERT OR IGNORE INTO api_keys(key_hash, owner, tier, requests_per_minute, is_active)
VALUES (
  'bf4814322117c1183c716172028fd5e181ae20d80fbc960cd4a1a1ed83eb004c',
  'course-demo',
  'free',
  60,
  1
);
