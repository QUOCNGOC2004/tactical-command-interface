-- Script sửa hệ thống nước - chỉ tạo cho phòng có bệnh nhân
-- Chạy script này để sửa lỗi hiển thị phòng không có bệnh nhân

-- Xóa tất cả dữ liệu cũ
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