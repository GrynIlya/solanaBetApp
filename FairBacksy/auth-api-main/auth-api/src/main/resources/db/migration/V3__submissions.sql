CREATE TABLE IF NOT EXISTS form_submission
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),user_sub VARCHAR
(
    255
) NOT NULL,form_code VARCHAR
(
    64
) NOT NULL,status VARCHAR
(
    16
) NOT NULL DEFAULT 'DRAFT',payload JSONB NOT NULL DEFAULT '{}'::jsonb,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
), CONSTRAINT fk_form_code FOREIGN KEY
(
    form_code
) REFERENCES form_template
(
    code
) ON UPDATE CASCADE);
CREATE INDEX IF NOT EXISTS idx_submission_user ON form_submission(user_sub);