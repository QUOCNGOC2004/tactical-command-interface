-- Thiết lập schema mặc định là public
SET search_path TO public;

-- =================================================================
-- I. ĐỊNH NGHĨA CẤU TRÚC BẢNG (TABLE DEFINITIONS)
-- =================================================================

-- Bảng bệnh nhân (patients)
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    bed_number VARCHAR(10),
    condition TEXT,
    admission_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'stable' CHECK (status IN ('stable', 'monitoring', 'critical', 'recovering')),
    doctor_name VARCHAR(100),
    emergency_contact VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_room_bed UNIQUE (room_number, bed_number)
);

-- Bảng thuốc (medications)
CREATE TABLE IF NOT EXISTS medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    description TEXT,
    side_effects TEXT,
    contraindications TEXT,
    stock_quantity INTEGER DEFAULT 100,
    unit VARCHAR(20) DEFAULT 'viên',
    min_stock_alert INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng bác sĩ (doctors)
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    years_of_experience INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng tủ thuốc (medicine_cabinets)
CREATE TABLE IF NOT EXISTS medicine_cabinets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_code VARCHAR(20) UNIQUE NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    bed_number VARCHAR(10),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'locked' CHECK (status IN ('locked', 'open', 'error', 'maintenance')),
    last_opened TIMESTAMP WITH TIME ZONE,
    rfid_card_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng ngăn thuốc (compartments)
CREATE TABLE IF NOT EXISTS compartments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES medicine_cabinets(id) ON DELETE CASCADE,
    compartment_type VARCHAR(20) NOT NULL CHECK (compartment_type IN ('compartment1', 'compartment2')),
    rfid_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cabinet_id, compartment_type)
);

-- Bảng chi tiết thuốc trong tủ (cabinet_medications)
CREATE TABLE IF NOT EXISTS cabinet_medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES medicine_cabinets(id) ON DELETE CASCADE,
    compartment_id UUID REFERENCES compartments(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cabinet_id, medication_id, compartment_id)
);

-- Bảng lịch uống thuốc (medication_schedules)
CREATE TABLE IF NOT EXISTS medication_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    cabinet_id UUID REFERENCES medicine_cabinets(id) ON DELETE CASCADE,
    compartment_id UUID REFERENCES compartments(id) ON DELETE SET NULL,
    time_of_day TIME NOT NULL,
    dosage_amount INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_taken TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending', 'taken', 'missed', 'skipped')),
    notes TEXT,
    dispensed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng nhật ký khẩn cấp (emergency_logs)
CREATE TABLE IF NOT EXISTS emergency_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    emergency_type VARCHAR(50) NOT NULL CHECK (emergency_type IN ('medical', 'family', 'technical')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
    response_time INTEGER,
    responder_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Bảng hệ thống nước (water_systems)
CREATE TABLE IF NOT EXISTS water_systems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_code VARCHAR(20) UNIQUE NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    bed_number VARCHAR(10),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dispensing', 'low_water', 'maintenance', 'error')),
    water_level INTEGER DEFAULT 100 CHECK (water_level >= 0 AND water_level <= 100),
    pump_status VARCHAR(20) DEFAULT 'ready' CHECK (pump_status IN ('ready', 'active', 'warning', 'error')),
    last_dispense TIMESTAMP WITH TIME ZONE,
    next_schedule TIMESTAMP WITH TIME ZONE,
    daily_consumption INTEGER DEFAULT 0,
    max_daily_consumption INTEGER DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =================================================================
-- II. HÀM VÀ TRIGGER (FUNCTIONS AND TRIGGERS)
-- =================================================================

-- Hàm tự động cập nhật trường 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Gán trigger cho các bảng cần thiết
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicine_cabinets_updated_at BEFORE UPDATE ON medicine_cabinets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compartments_updated_at BEFORE UPDATE ON compartments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cabinet_medications_updated_at BEFORE UPDATE ON cabinet_medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medication_schedules_updated_at BEFORE UPDATE ON medication_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_water_systems_updated_at BEFORE UPDATE ON water_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =================================================================
-- III. CHỈ MỤC (INDEXES)
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_patients_room ON patients(room_number);
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department);
CREATE INDEX IF NOT EXISTS idx_medicine_cabinets_room ON medicine_cabinets(room_number);
CREATE INDEX IF NOT EXISTS idx_compartments_cabinet_id ON compartments(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_cabinet_medications_cabinet_id ON cabinet_medications(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_cabinet_medications_medication_id ON cabinet_medications(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_patient ON medication_schedules(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_time ON medication_schedules(time_of_day);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_status ON medication_schedules(status);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_patient ON emergency_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_water_systems_room ON water_systems(room_number);
CREATE INDEX IF NOT EXISTS idx_water_systems_status ON water_systems(status);
CREATE INDEX IF NOT EXISTS idx_water_systems_patient ON water_systems(patient_id);


-- =================================================================
-- IV. CHÈN DỮ LIỆU MẪU (SEED DATA)
-- =================================================================

-- Cập nhật giường mặc định cho bệnh nhân và tủ thuốc cũ (nếu có)
UPDATE patients SET bed_number = 'A' WHERE bed_number IS NULL;
UPDATE medicine_cabinets SET bed_number = 'A' WHERE bed_number IS NULL;

-- 1. Thêm dữ liệu bệnh nhân
INSERT INTO patients (patient_code, name, age, room_number, bed_number, condition, admission_date, status, doctor_name, emergency_contact) VALUES
('BN-001', 'NGUYỄN VĂN A', 65, '101', 'A', 'Tiểu đường type 2', '2025-06-10', 'stable', 'BS. Trần Văn B', '0987654321'),
('BN-002', 'TRẦN THỊ B', 72, '102', 'A', 'Cao huyết áp', '2025-06-12', 'monitoring', 'BS. Lê Thị C', '0912345678'),
('BN-003', 'LÊ VĂN C', 58, '103', 'A', 'Bệnh tim mạch', '2025-06-15', 'critical', 'BS. Nguyễn Văn D', '0923456789');

-- 2. Thêm dữ liệu thuốc
INSERT INTO medications (name, dosage, description, stock_quantity, unit, min_stock_alert) VALUES
('Paracetamol', '500mg', 'Thuốc giảm đau, hạ sốt', 150, 'viên', 20),
('Metformin', '500mg', 'Thuốc điều trị tiểu đường type 2', 120, 'viên', 15),
('Amlodipine', '5mg', 'Thuốc điều trị cao huyết áp', 100, 'viên', 10),
('Aspirin', '100mg', 'Thuốc chống đông máu', 200, 'viên', 25),
('Insulin', '100UI/ml', 'Hormone điều trị tiểu đường', 50, 'lọ', 5),
('Atorvastatin', '20mg', 'Thuốc điều trị cholesterol cao', 80, 'viên', 10),
('Omeprazole', '20mg', 'Thuốc điều trị dạ dày', 90, 'viên', 15),
('Vitamin D3', '1000IU', 'Bổ sung vitamin D', 75, 'viên', 10);

-- 3. Thêm dữ liệu bác sĩ
INSERT INTO doctors (doctor_code, name, specialization, department, phone, email, years_of_experience) VALUES
('BS-001', 'BS. Nguyễn Văn An', 'Tim mạch', 'Khoa Tim mạch', '0901234567', 'bs.an@hospital.com', 15),
('BS-002', 'BS. Trần Thị Bình', 'Nội tiết', 'Khoa Nội tiết', '0901234568', 'bs.binh@hospital.com', 12),
('BS-003', 'BS. Lê Văn Cường', 'Thần kinh', 'Khoa Thần kinh', '0901234569', 'bs.cuong@hospital.com', 18),
('BS-004', 'BS. Phạm Thị Dung', 'Tiêu hóa', 'Khoa Tiêu hóa', '0901234570', 'bs.dung@hospital.com', 10),
('BS-005', 'BS. Hoàng Văn Em', 'Hô hấp', 'Khoa Hô hấp', '0901234571', 'bs.em@hospital.com', 14),
('BS-006', 'BS. Vũ Thị Phương', 'Thận - Tiết niệu', 'Khoa Thận - Tiết niệu', '0901234572', 'bs.phuong@hospital.com', 16),
('BS-007', 'BS. Đặng Văn Giang', 'Cơ xương khớp', 'Khoa Cơ xương khớp', '0901234573', 'bs.giang@hospital.com', 11),
('BS-008', 'BS. Bùi Thị Hoa', 'Da liễu', 'Khoa Da liễu', '0901234574', 'bs.hoa@hospital.com', 9),
('BS-009', 'BS. Ngô Văn Inh', 'Mắt', 'Khoa Mắt', '0901234575', 'bs.inh@hospital.com', 13),
('BS-010', 'BS. Lý Thị Kim', 'Tai mũi họng', 'Khoa Tai mũi họng', '0901234576', 'bs.kim@hospital.com', 17);

-- 4. Thêm tủ thuốc cố định và liên kết với bệnh nhân theo phòng
INSERT INTO medicine_cabinets (cabinet_code, room_number, bed_number, patient_id, status, rfid_card_id)
SELECT 
  'CAB-' || p.room_number,
  p.room_number,
  p.bed_number,
  p.id,
  'locked',
  'RFID-' || p.room_number
FROM patients p;

-- 5. Thêm 2 ngăn cho mỗi tủ thuốc đã tạo
INSERT INTO compartments (cabinet_id, compartment_type)
SELECT id, 'compartment1' FROM medicine_cabinets ON CONFLICT DO NOTHING;
INSERT INTO compartments (cabinet_id, compartment_type)
SELECT id, 'compartment2' FROM medicine_cabinets ON CONFLICT DO NOTHING;

-- 6. Phân thuốc ngẫu nhiên vào các ngăn của tủ thuốc
INSERT INTO cabinet_medications (cabinet_id, compartment_id, medication_id, quantity)
SELECT
    c.id as cabinet_id,
    comp.id as compartment_id,
    (SELECT id FROM medications ORDER BY random() LIMIT 1) as medication_id,
    FLOOR(random() * 20) + 10 as quantity
FROM medicine_cabinets c
JOIN compartments comp ON c.id = comp.cabinet_id
-- Thêm 3 loại thuốc ngẫu nhiên cho mỗi tủ
CROSS JOIN generate_series(1, 3) 
ON CONFLICT DO NOTHING;

-- 7. Tạo lịch uống thuốc ngẫu nhiên cho bệnh nhân
INSERT INTO medication_schedules (patient_id, medication_id, cabinet_id, compartment_id, time_of_day, dosage_amount)
SELECT
    p.id as patient_id,
    cm.medication_id,
    mc.id as cabinet_id,
    cm.compartment_id,
    CASE 
        WHEN random() < 0.33 THEN '07:00:00'::TIME
        WHEN random() < 0.66 THEN '12:30:00'::TIME
        ELSE '19:00:00'::TIME
    END as time_of_day,
    1 as dosage_amount
FROM patients p
JOIN medicine_cabinets mc ON p.id = mc.patient_id
-- Lấy một loại thuốc đã có trong tủ của bệnh nhân đó
JOIN (
    SELECT DISTINCT ON (cabinet_id) cabinet_id, medication_id, compartment_id 
    FROM cabinet_medications ORDER BY cabinet_id, random()
) as cm ON mc.id = cm.cabinet_id
WHERE random() < 0.8 -- 80% bệnh nhân có lịch
ON CONFLICT DO NOTHING;

-- 8. Tạo hệ thống nước cho mỗi bệnh nhân
INSERT INTO water_systems (system_code, room_number, bed_number, patient_id, status, water_level, pump_status, daily_consumption, max_daily_consumption)
SELECT 
  'WS-' || p.room_number as system_code,
  p.room_number,
  p.bed_number,
  p.id as patient_id,
  CASE 
    WHEN p.status = 'critical' THEN 'low_water'
    ELSE 'active'
  END as status,
  CASE 
    WHEN p.status = 'critical' THEN 15
    WHEN p.status = 'monitoring' THEN 65
    ELSE 85
  END as water_level,
  CASE 
    WHEN p.status = 'critical' THEN 'warning'
    ELSE 'ready'
  END as pump_status,
  FLOOR(random() * 800) + 200 as daily_consumption,
  2000 as max_daily_consumption
FROM patients p
WHERE p.id IS NOT NULL;

-- Hoàn tất

-- =================================================================
-- SCRIPT CẬP NHẬT BẢNG water_systems
-- =================================================================

-- Bước 1: Thêm cột cabinet_id và các ràng buộc cần thiết
-- Thêm cột mới để lưu liên kết tới tủ thuốc
ALTER TABLE water_systems ADD COLUMN cabinet_id UUID;

-- Thêm ràng buộc khóa ngoại để liên kết water_systems với medicine_cabinets
ALTER TABLE water_systems
ADD CONSTRAINT fk_water_systems_cabinet
    FOREIGN KEY (cabinet_id)
    REFERENCES medicine_cabinets(id)
    ON DELETE SET NULL; -- Nếu tủ thuốc bị xóa, cabinet_id trong hệ thống nước sẽ thành NULL

-- Thêm ràng buộc UNIQUE để đảm bảo mỗi tủ thuốc chỉ có một hệ thống nước (quan hệ 1-1)
ALTER TABLE water_systems ADD CONSTRAINT uq_water_systems_cabinet_id UNIQUE (cabinet_id);

-- Tạo chỉ mục (index) để tối ưu hóa truy vấn trên cột mới
CREATE INDEX IF NOT EXISTS idx_water_systems_cabinet_id ON water_systems(cabinet_id);

-- ---

-- Bước 2: Cập nhật dữ liệu cho 3 hệ thống nước tương ứng với 3 tủ thuốc
-- Script này giả định rằng bạn đã có các hệ thống nước và tủ thuốc tương ứng trong cùng một phòng
-- và muốn liên kết chúng lại với nhau.
UPDATE water_systems ws
SET cabinet_id = mc.id
FROM medicine_cabinets mc
WHERE ws.room_number = mc.room_number; -- Liên kết dựa trên số phòng

-- Nếu bạn chưa có hệ thống nước nào và muốn tạo mới 3 cái tương ứng với 3 tủ thuốc đầu tiên,
-- bạn có thể dùng lệnh INSERT sau thay cho lệnh UPDATE ở trên:
/*
INSERT INTO water_systems (system_code, cabinet_id, status, water_level, pump_status, daily_consumption)
SELECT
  'WS-' || mc.room_number,
  mc.id,
  'active',
  100,
  'ready',
  0
FROM medicine_cabinets mc
LIMIT 3;
*/

-- ---

-- Bước 3: (Tùy chọn) Xóa các cột cũ sau khi đã chuyển dữ liệu sang cabinet_id
-- Chạy đoạn này sau khi bạn đã chắc chắn rằng việc liên kết dữ liệu ở Bước 2 thành công.
ALTER TABLE water_systems
DROP COLUMN room_number,
DROP COLUMN bed_number,
DROP COLUMN patient_id;

-- =================================================================
-- HOÀN TẤT
-- =================================================================
