CREATE
EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS user_account
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),keycloak_user_id VARCHAR
(
    255
) NOT NULL UNIQUE,email VARCHAR
(
    320
) NOT NULL,full_name VARCHAR
(
    255
),phone VARCHAR
(
    64
),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
));