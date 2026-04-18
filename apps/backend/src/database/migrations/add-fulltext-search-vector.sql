-- Add full-text search support to licitaciones table
-- This enables semantic search across title and description

-- Step 1: Add tsvector column for full-text search
ALTER TABLE licitaciones 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Step 2: Populate existing rows with search vectors
UPDATE licitaciones 
SET search_vector = to_tsvector('spanish', 
  COALESCE(title, '') || ' ' || COALESCE(description, '')
)
WHERE search_vector IS NULL;

-- Step 3: Create GiST index for fast searches
CREATE INDEX IF NOT EXISTS idx_licitaciones_search_vector 
ON licitaciones 
USING GiST(search_vector);

-- Step 4: Create function to auto-update search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION update_licitacion_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('spanish', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to call function on INSERT/UPDATE
DROP TRIGGER IF EXISTS tg_licitacion_search_vector ON licitaciones;
CREATE TRIGGER tg_licitacion_search_vector
BEFORE INSERT OR UPDATE ON licitaciones
FOR EACH ROW
EXECUTE FUNCTION update_licitacion_search_vector();

-- Verify the setup
-- SELECT id, title, search_vector FROM licitaciones LIMIT 5;
