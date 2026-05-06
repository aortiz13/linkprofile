-- Sales Funnels A/B Testing
CREATE TABLE IF NOT EXISTS funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT false,
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS funnels_slug_idx ON funnels (slug);

-- Seed the two workshop funnels
INSERT INTO funnels (name, slug, description, active, variants, extra_links) VALUES
(
  'Embudo A — Venta Directa',
  'a',
  'Lleva directo a la página de venta del workshop ($17 USD). Dos variantes: A1 long-form y A2 VSL corta.',
  true,
  '[{"key":"1","label":"A1 · Long-form","path":"/w/a1","weight":50},{"key":"2","label":"A2 · VSL Corta","path":"/w/a2","weight":50}]'::jsonb,
  '[{"label":"Checkout Stripe","url":"https://buy.stripe.com/28EeVccJUfBo3MU4EN1Fe38"},{"label":"Bienvenido (post-pago)","url":"/w/bienvenido"}]'::jsonb
),
(
  'Embudo B — Tripwire',
  'b',
  'Captura lead con recurso gratis (PDF o video) → página de gracias con oferta tripwire → checkout.',
  false,
  '[{"key":"1","label":"B1 · PDF Lead Magnet","path":"/w/b1","weight":50},{"key":"2","label":"B2 · Video Lead Magnet","path":"/w/b2","weight":50}]'::jsonb,
  '[{"label":"Gracias (tripwire)","url":"/w/gracias"},{"label":"Checkout Stripe","url":"https://buy.stripe.com/28EeVccJUfBo3MU4EN1Fe38"},{"label":"Bienvenido (post-pago)","url":"/w/bienvenido"}]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
