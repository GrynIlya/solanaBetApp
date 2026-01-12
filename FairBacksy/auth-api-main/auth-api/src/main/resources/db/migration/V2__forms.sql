CREATE TABLE IF NOT EXISTS form_template
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),code VARCHAR
(
    64
) NOT NULL UNIQUE,title VARCHAR
(
    255
) NOT NULL,version VARCHAR
(
    32
) NOT NULL,json_schema JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
));