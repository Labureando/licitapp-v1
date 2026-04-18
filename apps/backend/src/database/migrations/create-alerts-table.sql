-- Create alerts table for personalized notifications
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  email VARCHAR(255),
  
  -- Search criteria (all nullable/optional)
  estados TEXT[] DEFAULT '{}',
  "tiposContrato" TEXT[] DEFAULT '{}',
  procedimientos TEXT[] DEFAULT '{}',
  tramitaciones TEXT[] DEFAULT '{}',
  ccaas TEXT[] DEFAULT '{}',
  provincias TEXT[] DEFAULT '{}',
  "cpvCodes" TEXT[] DEFAULT '{}',
  "importeMin" BIGINT,
  "importeMax" BIGINT,
  "palabrasClave" VARCHAR,
  
  -- Control flags
  "isActive" BOOLEAN DEFAULT true,
  "lastTriggeredAt" TIMESTAMPTZ,
  "triggerCount" INTEGER DEFAULT 0,
  
  -- Timestamps
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_alerts_user_id ON alerts("userId");
CREATE INDEX idx_alerts_active ON alerts("isActive");
CREATE INDEX idx_alerts_created_at ON alerts("createdAt");
CREATE INDEX idx_alerts_last_triggered ON alerts("lastTriggeredAt");
