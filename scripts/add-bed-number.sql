-- Add bed_number column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS bed_number VARCHAR(10);

-- Add bed_number column to medicine_cabinets table  
ALTER TABLE medicine_cabinets ADD COLUMN IF NOT EXISTS bed_number VARCHAR(10);

-- Add unique constraint for room and bed combination
ALTER TABLE patients ADD CONSTRAINT unique_room_bed UNIQUE (room_number, bed_number);

-- Update existing patients with default bed numbers
UPDATE patients SET bed_number = 'A' WHERE bed_number IS NULL;

-- Update existing medicine_cabinets with bed numbers
UPDATE medicine_cabinets 
SET bed_number = 'A' 
WHERE bed_number IS NULL;

-- Create cabinet_medications table to track medications in each cabinet
CREATE TABLE IF NOT EXISTS cabinet_medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES medicine_cabinets(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cabinet_id, medication_id)
);

-- Add dispensed_at column to medication_schedules
ALTER TABLE medication_schedules ADD COLUMN IF NOT EXISTS dispensed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cabinet_medications_cabinet_id ON cabinet_medications(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_cabinet_medications_medication_id ON cabinet_medications(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_cabinet_id ON medication_schedules(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_status ON medication_schedules(status);
