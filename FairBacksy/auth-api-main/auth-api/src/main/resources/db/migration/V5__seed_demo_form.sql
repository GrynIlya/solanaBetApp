-- Seed a demo form template if missing
INSERT INTO form_template (code, title, version, json_schema)
SELECT 'demo', 'Demo Form', '1.0.0', '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM form_template WHERE code = 'demo'
);
