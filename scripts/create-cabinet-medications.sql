-- Tạo bảng cabinet_medications để quản lý thuốc trong từng tủ
CREATE TABLE IF NOT EXISTS cabinet_medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID NOT NULL REFERENCES medicine_cabinets(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Đảm bảo mỗi thuốc chỉ có một record trong mỗi tủ
    UNIQUE(cabinet_id, medication_id)
);

-- Tạo index để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_cabinet_medications_cabinet_id ON cabinet_medications(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_cabinet_medications_medication_id ON cabinet_medications(medication_id);

-- Thêm trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_cabinet_medications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cabinet_medications_updated_at
    BEFORE UPDATE ON cabinet_medications
    FOR EACH ROW
    EXECUTE FUNCTION update_cabinet_medications_updated_at();

-- Thêm cột dispensed_at vào medication_schedules nếu chưa có
ALTER TABLE medication_schedules 
ADD COLUMN IF NOT EXISTS dispensed_at TIMESTAMP WITH TIME ZONE;

-- Seed một số dữ liệu mẫu cho cabinet_medications
INSERT INTO cabinet_medications (cabinet_id, medication_id, quantity) 
SELECT 
    mc.id as cabinet_id,
    m.id as medication_id,
    FLOOR(RANDOM() * 20 + 5) as quantity
FROM medicine_cabinets mc
CROSS JOIN medications m
WHERE RANDOM() < 0.3  -- Chỉ thêm 30% tổ hợp để tránh quá nhiều dữ liệu
ON CONFLICT (cabinet_id, medication_id) DO NOTHING;
