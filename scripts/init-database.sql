SET search_path TO public;

CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    condition TEXT,
    admission_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'stable' CHECK (status IN ('stable', 'monitoring', 'critical', 'recovering')),
    doctor_name VARCHAR(100),
    emergency_contact VARCHAR(20),
    bed_number VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_room_bed UNIQUE (room_number, bed_number)
);

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

CREATE TABLE IF NOT EXISTS medication_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    cabinet_id UUID REFERENCES medicine_cabinets(id) ON DELETE CASCADE,
    time_of_day TIME NOT NULL,
    compartment VARCHAR(20) NOT NULL CHECK (compartment IN ('compartment1', 'compartment2')),
    dosage_amount INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_taken TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending', 'taken', 'missed', 'skipped')),
    notes TEXT,
    dispensed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_monitoring (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    heart_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    temperature DECIMAL(4,2),
    spo2 INTEGER,
    steps INTEGER,
    sleep_hours DECIMAL(4,2),
    stress_level INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_type VARCHAR(50) DEFAULT 'Samsung Watch',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfid_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES medicine_cabinets(id) ON DELETE CASCADE,
    rfid_card_id VARCHAR(50) NOT NULL,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('granted', 'denied')),
    user_name VARCHAR(100),
    user_role VARCHAR(50),
    purpose TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS water_dispenser_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES medicine_cabinets(id) ON DELETE CASCADE,
    water_level INTEGER NOT NULL,
    dispensed_amount INTEGER,
    trigger_type VARCHAR(20) CHECK (trigger_type IN ('automatic', 'manual')),
    dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Bảng hệ thống nước
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

-- Bảng lịch phát nước
CREATE TABLE IF NOT EXISTS water_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    water_system_id UUID REFERENCES water_systems(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    schedule_time TIME NOT NULL,
    dispense_amount INTEGER NOT NULL DEFAULT 200, -- ml
    is_active BOOLEAN DEFAULT TRUE,
    last_dispensed TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending', 'dispensed', 'missed', 'skipped')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cập nhật bảng water_dispenser_logs để liên kết với water_systems
DROP TABLE IF EXISTS water_dispenser_logs;
CREATE TABLE IF NOT EXISTS water_dispenser_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    water_system_id UUID REFERENCES water_systems(id) ON DELETE CASCADE,
    water_level INTEGER NOT NULL,
    dispensed_amount INTEGER,
    trigger_type VARCHAR(20) CHECK (trigger_type IN ('automatic', 'manual', 'scheduled')),
    dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicine_cabinets_updated_at BEFORE UPDATE ON medicine_cabinets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medication_schedules_updated_at BEFORE UPDATE ON medication_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_water_systems_updated_at BEFORE UPDATE ON water_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_water_schedules_updated_at BEFORE UPDATE ON water_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION set_cabinet_medications_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_cabinet_medications_updated_at ON cabinet_medications;
CREATE TRIGGER trg_set_cabinet_medications_updated_at BEFORE UPDATE ON cabinet_medications FOR EACH ROW EXECUTE FUNCTION set_cabinet_medications_updated_at();

CREATE INDEX IF NOT EXISTS idx_patients_room ON patients(room_number);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_patient ON medication_schedules(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_time ON medication_schedules(time_of_day);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_status ON medication_schedules(status);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_cabinet_id ON medication_schedules(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_health_monitoring_patient ON health_monitoring(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_monitoring_recorded ON health_monitoring(recorded_at);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_patient ON emergency_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_rfid_access_cabinet ON rfid_access_logs(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department);
CREATE INDEX IF NOT EXISTS idx_cabinet_medications_cabinet_id ON cabinet_medications(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_cabinet_medications_medication_id ON cabinet_medications(medication_id);
CREATE INDEX IF NOT EXISTS idx_water_systems_room ON water_systems(room_number);
CREATE INDEX IF NOT EXISTS idx_water_systems_status ON water_systems(status);
CREATE INDEX IF NOT EXISTS idx_water_systems_patient ON water_systems(patient_id);
CREATE INDEX IF NOT EXISTS idx_water_schedules_system ON water_schedules(water_system_id);
CREATE INDEX IF NOT EXISTS idx_water_schedules_time ON water_schedules(schedule_time);
CREATE INDEX IF NOT EXISTS idx_water_schedules_status ON water_schedules(status);
CREATE INDEX IF NOT EXISTS idx_water_dispenser_logs_system ON water_dispenser_logs(water_system_id);
CREATE INDEX IF NOT EXISTS idx_water_dispenser_logs_dispensed ON water_dispenser_logs(dispensed_at);

UPDATE patients SET bed_number = 'A' WHERE bed_number IS NULL;
UPDATE medicine_cabinets SET bed_number = 'A' WHERE bed_number IS NULL;

INSERT INTO patients (patient_code, name, age, room_number, condition, admission_date, status, doctor_name, emergency_contact) VALUES
('BN-001', 'NGUYỄN VĂN A', 65, '101', 'Tiểu đường type 2', '2025-06-10', 'stable', 'BS. Trần Văn B', '0987654321'),
('BN-002', 'TRẦN THỊ B', 72, '102', 'Cao huyết áp', '2025-06-12', 'monitoring', 'BS. Lê Thị C', '0912345678'),
('BN-003', 'LÊ VĂN C', 58, '103', 'Bệnh tim mạch', '2025-06-15', 'critical', 'BS. Nguyễn Văn D', '0923456789');

INSERT INTO medications (name, dosage, description, stock_quantity, unit, min_stock_alert) VALUES
('Paracetamol', '500mg', 'Thuốc giảm đau, hạ sốt', 150, 'viên', 20),
('Metformin', '500mg', 'Thuốc điều trị tiểu đường type 2', 120, 'viên', 15),
('Amlodipine', '5mg', 'Thuốc điều trị cao huyết áp', 100, 'viên', 10),
('Aspirin', '100mg', 'Thuốc chống đông máu', 200, 'viên', 25),
('Insulin', '100UI/ml', 'Hormone điều trị tiểu đường', 50, 'lọ', 5),
('Atorvastatin', '20mg', 'Thuốc điều trị cholesterol cao', 80, 'viên', 10),
('Omeprazole', '20mg', 'Thuốc điều trị dạ dày', 90, 'viên', 15),
('Vitamin D3', '1000IU', 'Bổ sung vitamin D', 75, 'viên', 10);

-- XÓA đoạn tự động sinh tủ thuốc theo bệnh nhân (dòng 246-248)
-- THÊM đoạn tạo 3 tủ thuốc cố định
INSERT INTO medicine_cabinets (cabinet_code, room_number, status, rfid_card_id)
VALUES
  ('CAB-001', '101', 'locked', 'RFID-001'),
  ('CAB-002', '102', 'locked', 'RFID-002'),
  ('CAB-003', '103', 'locked', 'RFID-003');

INSERT INTO medication_schedules (patient_id, medication_id, cabinet_id, time_of_day, compartment, dosage_amount) 
SELECT 
    p.id,
    m.id,
    c.id,
    CASE 
        WHEN random() < 0.33 THEN '07:00:00'::TIME
        WHEN random() < 0.66 THEN '15:30:00'::TIME
        ELSE '20:00:00'::TIME
    END,
    CASE 
        WHEN random() < 0.5 THEN 'compartment1'
        ELSE 'compartment2'
    END,
    1
FROM patients p
CROSS JOIN medications m
JOIN medicine_cabinets c ON c.patient_id = p.id
WHERE random() < 0.4;

INSERT INTO health_monitoring (patient_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, temperature, spo2, steps, sleep_hours, stress_level, recorded_at)
SELECT 
    id,
    60 + (random() * 40)::integer,
    110 + (random() * 50)::integer,
    70 + (random() * 30)::integer,
    36.0 + (random() * 2.0)::numeric(4,2),
    95 + (random() * 5)::integer,
    (random() * 10000)::integer,
    6.0 + (random() * 4.0)::numeric(4,2),
    1 + (random() * 9)::integer,
    NOW() - (random() * interval '24 hours')
FROM patients;

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

INSERT INTO cabinet_medications (cabinet_id, medication_id, quantity)
SELECT
  mc.id,
  m.id,
  FLOOR(random()*50)+10
FROM medicine_cabinets mc
CROSS JOIN LATERAL (
  SELECT id FROM medications ORDER BY random() LIMIT 1
) m
ON CONFLICT DO NOTHING;

-- Thêm dữ liệu hệ thống nước
INSERT INTO water_systems (system_code, room_number, patient_id, status, water_level, pump_status, last_dispense, next_schedule, daily_consumption) VALUES
('WS-001', '101', (SELECT id FROM patients WHERE room_number = '101'), 'active', 85, 'ready', NOW() - interval '2 hours', NOW() + interval '4 hours', 1200),
('WS-002', '102', (SELECT id FROM patients WHERE room_number = '102'), 'dispensing', 45, 'active', NOW() - interval '30 minutes', NOW() + interval '3 hours', 950),
('WS-003', '103', (SELECT id FROM patients WHERE room_number = '103'), 'low_water', 15, 'warning', NOW() - interval '1 hour', NOW() + interval '2 hours', 800),
('WS-004', '201', NULL, 'active', 95, 'ready', NOW() - interval '3 hours', NOW() + interval '5 hours', 600),
('WS-005', '202', NULL, 'maintenance', 0, 'error', NULL, NULL, 0);

-- Thêm lịch phát nước
INSERT INTO water_schedules (water_system_id, patient_id, schedule_time, dispense_amount, status) VALUES
((SELECT id FROM water_systems WHERE system_code = 'WS-001'), (SELECT id FROM patients WHERE room_number = '101'), '07:00:00', 200, 'dispensed'),
((SELECT id FROM water_systems WHERE system_code = 'WS-001'), (SELECT id FROM patients WHERE room_number = '101'), '12:00:00', 200, 'dispensed'),
((SELECT id FROM water_systems WHERE system_code = 'WS-001'), (SELECT id FROM patients WHERE room_number = '101'), '18:00:00', 200, 'scheduled'),
((SELECT id FROM water_systems WHERE system_code = 'WS-002'), (SELECT id FROM patients WHERE room_number = '102'), '07:30:00', 200, 'dispensed'),
((SELECT id FROM water_systems WHERE system_code = 'WS-002'), (SELECT id FROM patients WHERE room_number = '102'), '12:30:00', 200, 'dispensed'),
((SELECT id FROM water_systems WHERE system_code = 'WS-002'), (SELECT id FROM patients WHERE room_number = '102'), '18:30:00', 200, 'pending'),
((SELECT id FROM water_systems WHERE system_code = 'WS-003'), (SELECT id FROM patients WHERE room_number = '103'), '08:00:00', 200, 'dispensed'),
((SELECT id FROM water_systems WHERE system_code = 'WS-003'), (SELECT id FROM patients WHERE room_number = '103'), '13:00:00', 200, 'dispensed'),
((SELECT id FROM water_systems WHERE system_code = 'WS-003'), (SELECT id FROM patients WHERE room_number = '103'), '19:00:00', 200, 'scheduled');

-- Thêm log phát nước
INSERT INTO water_dispenser_logs (water_system_id, water_level, dispensed_amount, trigger_type, dispensed_at) VALUES
((SELECT id FROM water_systems WHERE system_code = 'WS-001'), 85, 200, 'scheduled', NOW() - interval '2 hours'),
((SELECT id FROM water_systems WHERE system_code = 'WS-002'), 45, 200, 'scheduled', NOW() - interval '30 minutes'),
((SELECT id FROM water_systems WHERE system_code = 'WS-003'), 15, 200, 'scheduled', NOW() - interval '1 hour'),
((SELECT id FROM water_systems WHERE system_code = 'WS-001'), 90, 200, 'scheduled', NOW() - interval '5 hours'),
((SELECT id FROM water_systems WHERE system_code = 'WS-002'), 50, 200, 'scheduled', NOW() - interval '3 hours'),
((SELECT id FROM water_systems WHERE system_code = 'WS-003'), 20, 200, 'scheduled', NOW() - interval '4 hours');

-- =============================
-- TÍCH HỢP FIX WATER SYSTEMS
-- =============================
-- Xóa tất cả dữ liệu cũ hệ thống nước
DELETE FROM water_dispenser_logs;
DELETE FROM water_schedules;
DELETE FROM water_systems;

-- Tạo hệ thống nước chỉ cho phòng có bệnh nhân
INSERT INTO water_systems (
  system_code,
  room_number,
  bed_number,
  patient_id,
  status,
  water_level,
  pump_status,
  daily_consumption,
  max_daily_consumption,
  created_at,
  updated_at
)
SELECT 
  'WS-' || LPAD(ROW_NUMBER() OVER()::text, 3, '0') as system_code,
  p.room_number,
  p.bed_number,
  p.id as patient_id,
  CASE 
    WHEN p.status = 'critical' THEN 'low_water'
    WHEN p.status = 'monitoring' THEN 'active'
    ELSE 'active'
  END as status,
  CASE 
    WHEN p.status = 'critical' THEN 15
    WHEN p.status = 'monitoring' THEN 65
    ELSE 85
  END as water_level,
  CASE 
    WHEN p.status = 'critical' THEN 'warning'
    WHEN p.status = 'monitoring' THEN 'ready'
    ELSE 'ready'
  END as pump_status,
  FLOOR(random() * 800) + 200 as daily_consumption,
  2000 as max_daily_consumption,
  NOW() as created_at,
  NOW() as updated_at
FROM patients p
WHERE p.id IS NOT NULL;

-- Tạo lịch phát nước cho mỗi hệ thống
INSERT INTO water_schedules (
  water_system_id,
  patient_id,
  schedule_time,
  dispense_amount,
  is_active,
  status,
  created_at,
  updated_at
)
SELECT 
  ws.id as water_system_id,
  ws.patient_id,
  CASE 
    WHEN random() < 0.33 THEN '07:00:00'::TIME
    WHEN random() < 0.66 THEN '12:00:00'::TIME
    ELSE '18:00:00'::TIME
  END as schedule_time,
  200 as dispense_amount,
  true as is_active,
  'scheduled' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM water_systems ws
WHERE ws.patient_id IS NOT NULL;

-- Tạo thêm lịch phát nước thứ 2 cho mỗi hệ thống
INSERT INTO water_schedules (
  water_system_id,
  patient_id,
  schedule_time,
  dispense_amount,
  is_active,
  status,
  created_at,
  updated_at
)
SELECT 
  ws.id as water_system_id,
  ws.patient_id,
  CASE 
    WHEN random() < 0.5 THEN '15:00:00'::TIME
    ELSE '20:00:00'::TIME
  END as schedule_time,
  200 as dispense_amount,
  true as is_active,
  'scheduled' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM water_systems ws
WHERE ws.patient_id IS NOT NULL;

-- Tạo log phát nước mẫu
INSERT INTO water_dispenser_logs (
  water_system_id,
  water_level,
  dispensed_amount,
  trigger_type,
  dispensed_at
)
SELECT 
  ws.id as water_system_id,
  ws.water_level,
  200 as dispensed_amount,
  'scheduled' as trigger_type,
  NOW() - (random() * interval '24 hours') as dispensed_at
FROM water_systems ws
WHERE ws.patient_id IS NOT NULL;

-- Hiển thị kết quả
SELECT 
  'Water systems created for patients:' as info,
  COUNT(*) as count
FROM water_systems;

SELECT 
  'Water schedules created:' as info,
  COUNT(*) as count
FROM water_schedules;

SELECT 
  'Water logs created:' as info,
  COUNT(*) as count
FROM water_dispenser_logs;

-- Hiển thị danh sách hệ thống nước đã tạo
SELECT 
  ws.system_code,
  ws.room_number,
  ws.bed_number,
  p.name as patient_name,
  ws.status,
  ws.water_level,
  ws.pump_status
FROM water_systems ws
JOIN patients p ON ws.patient_id = p.id
ORDER BY ws.room_number;

-- 1. Tạo bảng ngăn thuốc (compartments)
CREATE TABLE IF NOT EXISTS compartments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES medicine_cabinets(id) ON DELETE CASCADE,
    compartment_type VARCHAR(20) NOT NULL CHECK (compartment_type IN ('compartment1', 'compartment2')),
    rfid_code VARCHAR(50), -- mã RFID riêng cho ngăn (nếu có)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cabinet_id, compartment_type)
);

-- 2. Thêm cột compartment_id vào bảng cabinet_medications để liên kết thuốc với ngăn
ALTER TABLE cabinet_medications
ADD COLUMN compartment_id UUID REFERENCES compartments(id) ON DELETE CASCADE;

-- Thêm 2 ngăn cho mỗi tủ thuốc
INSERT INTO compartments (cabinet_id, compartment_type, rfid_code)
SELECT id, 'compartment1', NULL FROM medicine_cabinets
ON CONFLICT DO NOTHING;
INSERT INTO compartments (cabinet_id, compartment_type, rfid_code)
SELECT id, 'compartment2', NULL FROM medicine_cabinets
ON CONFLICT DO NOTHING;

ALTER TABLE medication_schedules ADD COLUMN compartment_id UUID REFERENCES compartments(id) ON DELETE SET NULL;
DELETE FROM cabinet_medications WHERE compartment_id IS NULL;
-- Drop health monitoring table
DROP TABLE IF EXISTS health_monitoring;

-- Delete evening compartments
DELETE FROM compartments WHERE compartment_type = 'evening';


