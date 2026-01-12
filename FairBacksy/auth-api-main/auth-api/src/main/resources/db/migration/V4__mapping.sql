CREATE TABLE IF NOT EXISTS form_mapping
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),form_code VARCHAR
(
    64
) NOT NULL,field_path VARCHAR
(
    255
) NOT NULL, source VARCHAR
(
    64
) NOT NULL, UNIQUE
(
    form_code,
    field_path
), CONSTRAINT fk_form_code_map FOREIGN KEY
(
    form_code
) REFERENCES form_template
(
    code
) ON UPDATE CASCADE);