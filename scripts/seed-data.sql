-- Thêm dữ liệu mẫu cho bệnh nhân
INSERT INTO patients (patient_code, name, age, room_number, condition, admission_date, status, doctor_name, emergency_contact) VALUES
('BN-001', 'NGUYỄN VĂN A', 65, '101', 'Tiểu đường type 2', '2025-06-10', 'stable', 'BS. Trần Văn B', '0987654321'),
('BN-002', 'TRẦN THỊ B', 72, '102', 'Cao huyết áp', '2025-06-12', 'monitoring', 'BS. Lê Thị C', '0912345678'),
('BN-003', 'LÊ VĂN C', 58, '103', 'Bệnh tim mạch', '2025-06-15', 'critical', 'BS. Nguyễn Văn D', '0923456789');

-- Thêm dữ liệu mẫu cho thuốc
INSERT INTO medications (name, dosage, description, stock_quantity, unit, min_stock_alert) VALUES
('Paracetamol', '500mg', 'Thuốc giảm đau, hạ sốt', 150, 'viên', 20),
('Metformin', '500mg', 'Thuốc điều trị tiểu đường type 2', 120, 'viên', 15),
('Amlodipine', '5mg', 'Thuốc điều trị cao huyết áp', 100, 'viên', 10),
('Aspirin', '100mg', 'Thuốc chống đông máu', 200, 'viên', 25),
('Insulin', '100UI/ml', 'Hormone điều trị tiểu đường', 50, 'lọ', 5),
('Atorvastatin', '20mg', 'Thuốc điều trị cholesterol cao', 80, 'viên', 10),
('Omeprazole', '20mg', 'Thuốc điều trị dạ dày', 90, 'viên', 15),
('Vitamin D3', '1000IU', 'Bổ sung vitamin D', 75, 'viên', 10);

-- Thêm tủ thuốc cho từng bệnh nhân
INSERT INTO medicine_cabinets (cabinet_code, room_number, patient_id, status, rfid_card_id) 
SELECT 'CAB-' || LPAD(ROW_NUMBER() OVER()::text, 3, '0'), room_number, id, 'locked', 'RFID-' || id::text
FROM patients;

-- Thêm lịch trình uống thuốc mẫu
INSERT INTO medication_schedules (patient_id, medication_id, cabinet_id, time_of_day, compartment, dosage_amount) 
SELECT 
    p.id,
    m.id,
    c.id,
    CASE 
        WHEN random() < 0.33 THEN '07:00:00'
        WHEN random() < 0.66 THEN '15:30:00'
        ELSE '20:00:00'
    END,
    CASE 
        WHEN random() < 0.33 THEN 'morning'
        WHEN random() < 0.66 THEN 'afternoon'
        ELSE 'evening'
    END,
    1
FROM patients p
CROSS JOIN medications m
JOIN medicine_cabinets c ON c.patient_id = p.id
WHERE random() < 0.4; -- Chỉ tạo 40% số lượng tổ hợp có thể có

-- Thêm dữ liệu theo dõi sức khỏe mẫu
INSERT INTO health_monitoring (patient_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, temperature, spo2, steps, sleep_hours, stress_level, recorded_at)
SELECT 
    id,
    60 + (random() * 40)::integer, -- heart rate 60-100
    110 + (random() * 50)::integer, -- systolic 110-160
    70 + (random() * 30)::integer, -- diastolic 70-100
    36.0 + (random() * 2.0)::numeric(4,2), -- temperature 36-38
    95 + (random() * 5)::integer, -- spo2 95-100
    (random() * 10000)::integer, -- steps 0-10000
    6.0 + (random() * 4.0)::numeric(4,2), -- sleep 6-10 hours
    1 + (random() * 9)::integer, -- stress 1-10
    NOW() - (random() * interval '24 hours')
FROM patients;
