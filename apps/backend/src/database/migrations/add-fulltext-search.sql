-- 1. Añadir columna tsvector si no existe
ALTER TABLE licitaciones
ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- 2. Crear configuración de búsqueda en español
-- (PostgreSQL ya incluye 'spanish' por defecto)

-- 3. Poblar la columna con datos existentes
UPDATE licitaciones SET "searchVector" =
  setweight(to_tsvector('spanish', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE("adjudicatarioNombre", '')), 'C') ||
  setweight(to_tsvector('spanish', COALESCE("adjudicatarioNif", '')), 'C');

-- 4. Crear índice GIN para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_licitaciones_search
ON licitaciones USING GIN ("searchVector");

-- 5. Crear trigger para actualizar automáticamente cuando se inserta/actualiza
CREATE OR REPLACE FUNCTION licitaciones_search_trigger()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW."adjudicatarioNombre", '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW."adjudicatarioNif", '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_licitaciones_search ON licitaciones;
CREATE TRIGGER trg_licitaciones_search
BEFORE INSERT OR UPDATE OF title, description, "adjudicatarioNombre", "adjudicatarioNif"
ON licitaciones
FOR EACH ROW EXECUTE FUNCTION licitaciones_search_trigger();

-- 6. Índices adicionales para filtros
CREATE INDEX IF NOT EXISTS idx_licitaciones_estado ON licitaciones (estado);
CREATE INDEX IF NOT EXISTS idx_licitaciones_tipo ON licitaciones ("tipoContrato");
CREATE INDEX IF NOT EXISTS idx_licitaciones_ccaa ON licitaciones (ccaa);
CREATE INDEX IF NOT EXISTS idx_licitaciones_fecha_pub ON licitaciones ("fechaPublicacion" DESC);
CREATE INDEX IF NOT EXISTS idx_licitaciones_fecha_pres ON licitaciones ("fechaPresentacion");
CREATE INDEX IF NOT EXISTS idx_licitaciones_presupuesto ON licitaciones ("presupuestoBase");
CREATE INDEX IF NOT EXISTS idx_licitaciones_cpv ON licitaciones USING GIN ("cpvCodes");