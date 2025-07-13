-- Tạo bảng bệnh nhân
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng loại thuốc
CREATE TABLE IF NOT EXISTS medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    description TEXT,
    side_effects TEXT,
    contraindications TEXT,
    stock_quantity INTEGER DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'viên',
    min_stock_alert INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng tủ thuốc
CREATE TABLE IF NOT EXISTS medicine_cabinets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_code VARCHAR(20) UNIQUE NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'locked' CHECK (status IN ('locked', 'open', 'error', 'maintenance')),
    last_opened TIMESTAMP WITH TIME ZONE,
    rfid_card_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng lịch trình uống thuốc
CREATE TABLE IF NOT EXISTS medication_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    cabinet_id UUID REFERENCES medicine_cabinets(id) ON DELETE CASCADE,
    time_of_day TIME NOT NULL,
    compartment VARCHAR(20) NOT NULL CHECK (compartment IN ('morning', 'afternoon', 'evening')),
    dosage_amount INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_taken TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending', 'taken', 'missed', 'skipped')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng theo dõi sức khỏe
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

-- Tạo bảng nhật ký truy cập RFID
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

-- Tạo bảng nhật ký khẩn cấp
CREATE TABLE IF NOT EXISTS emergency_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    emergency_type VARCHAR(50) NOT NULL CHECK (emergency_type IN ('medical', 'family', 'technical')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
    response_time INTEGER, -- in seconds
    responder_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Tạo bảng hệ thống nước
CREATE TABLE IF NOT EXISTS water_dispenser_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cabinet_id UUID REFERENCES medicine_cabinets(id) ON DELETE CASCADE,
    water_level INTEGER NOT NULL, -- percentage
    dispensed_amount INTEGER, -- in ml
    trigger_type VARCHAR(20) CHECK (trigger_type IN ('automatic', 'manual')),
    dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index để tối ưu hiệu suất
CREATE INDEX IF NOT EXISTS idx_patients_room ON patients(room_number);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_patient ON medication_schedules(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_time ON medication_schedules(time_of_day);
CREATE INDEX IF NOT EXISTS idx_health_monitoring_patient ON health_monitoring(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_monitoring_recorded ON health_monitoring(recorded_at);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_patient ON emergency_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_rfid_access_cabinet ON rfid_access_logs(cabinet_id);

-- Thêm trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_medicine_cabinets_updated_at BEFORE UPDATE ON medicine_cabinets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_medication_schedules_updated_at BEFORE UPDATE ON medication_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
