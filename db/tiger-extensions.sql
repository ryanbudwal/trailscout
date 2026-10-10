-- Optional: run only on a Tiger Cloud service that supports these extensions.
-- The MVP requires vector. It does not claim to use a DiskANN index or hypertable.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vectorscale CASCADE;
