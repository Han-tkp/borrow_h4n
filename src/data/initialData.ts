export const initialState = {
    user: null,
    selectedEquipment: new Set(),
    equipmentView: 'grid', // 'grid' or 'table'
    equipment: [
        { id: 1, serial: '0334 0418 0044', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.2', acquisition_date: '2008-01-25', status: 'available', notes: '', price: 2500 },
        { id: 2, serial: '0334 0418 0045', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.2', acquisition_date: '2008-01-25', status: 'available', notes: '', price: 2500 },
        { id: 3, serial: '0334 0418 0046', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.2', acquisition_date: '2008-01-25', status: 'available', notes: '', price: 2500 },
        { id: 4, serial: '0334 0418 0047', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.3', acquisition_date: '2008-01-25', status: 'available', notes: '', price: 2500 },
        { id: 5, serial: '0334 0418 0048', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.3', acquisition_date: '2008-01-25', status: 'available', notes: '', price: 2500 },
        { id: 6, serial: '0334 0418 0049', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.3', acquisition_date: '2008-01-25', status: 'available', notes: '', price: 2500 },
        { id: 7, serial: '0334 0418 0050', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'ศดม.', acquisition_date: '2008-01-25', status: 'available', notes: '', price: 2500 },
        { id: 8, serial: '0334 0418 0051', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'ศดม.', acquisition_date: '2008-01-25', status: 'available', notes: '', price: 2500 },
        { id: 9, serial: '0334 0418 0052', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'ศตม.', acquisition_date: '2008-01-25', status: 'available', notes: '', price: 2500 },
        { id: 10, serial: '0334 0418 0061', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'ศดม.', acquisition_date: '2008-10-21', status: 'available', notes: '', price: 2500 },
        { id: 11, serial: '0334 0418 0062', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'ศตม.', acquisition_date: '2008-10-21', status: 'available', notes: '', price: 2500 },
        { id: 12, serial: '0334 0418 0063', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'ศดม.', acquisition_date: '2008-10-21', status: 'available', notes: '', price: 2500 },
        { id: 13, serial: '0334 0418 0087', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'ศตม.', acquisition_date: '2009-07-09', status: 'available', notes: '', price: 2500 },
        { id: 14, serial: '0334 0418 0088', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'ศดม.', acquisition_date: '2009-07-09', status: 'available', notes: '', price: 2500 },
        { id: 15, serial: '0334 0418 0089', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.2', acquisition_date: '2009-07-09', status: 'available', notes: '', price: 2500 },
        { id: 16, serial: '0334 0461 01160 0106', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.2', acquisition_date: '2018-01-11', status: 'available', notes: '', price: 2500 },
        { id: 17, serial: '0334 0461 01160 0107', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.2', acquisition_date: '2018-01-11', status: 'available', notes: '', price: 2500 },
        { id: 18, serial: '0334 0461 01160 0108', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'ศดม.', acquisition_date: '2018-01-11', status: 'available', notes: '', price: 2500 },
        { id: 19, serial: 'สคร.0334 0429 0863 0124', name: 'IK VECTOR CONTROL SUPER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.2', acquisition_date: '2020-10-19', status: 'borrowed', notes: '', price: 3200 },
        { id: 20, serial: 'สคร.0334 0429 0863 0125', name: 'IK VECTOR CONTROL SUPER', type: 'เครื่องพ่นเคมีอัดลม', department: 'ศตม.', acquisition_date: '2020-10-19', status: 'borrowed', notes: '', price: 3200 },
        { id: 21, serial: 'สคร.0334 0429 0863 0126', name: 'IK VECTOR CONTROL SUPER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.2', acquisition_date: '2020-10-19', status: 'borrowed', notes: '', price: 3200 },
        { id: 22, serial: 'สคร.0334 0429 0863 0127', name: 'IK VECTOR CONTROL SUPER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.3', acquisition_date: '2020-10-19', status: 'available', notes: '', price: 3200 },
        { id: 23, serial: 'สคร.0334 0429 0465 0140', name: 'IK VECTOR CONTROL SUPER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.3', acquisition_date: '2022-09-28', status: 'available', notes: '', price: 3200 },
        { id: 24, serial: 'สคร.0334 0429 0465 0141', name: 'IK VECTOR CONTROL SUPER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.2', acquisition_date: '2022-09-28', status: 'pending_repair_approval', notes: 'ชำรุดจากการใช้งาน', price: 3200 },
        { id: 25, serial: 'สคร.0334 0429 0465 0142', name: 'IK VECTOR CONTROL SUPER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.3', acquisition_date: '2022-09-28', status: 'borrowed', notes: '', price: 3200 },
        { id: 26, serial: '51 6640 007 00005 (67)', name: 'Micron CS10', type: 'เครื่องพ่นฝอยละออง', department: 'ศตม.', acquisition_date: '2024-05-14', status: 'borrowed', notes: '', price: 15000 },
        { id: 27, serial: '0332 048 0001 (8551)', name: 'SWING FOG SN 11 P', type: 'เครื่องพ่นหมอกควัน', department: 'ศตม.', acquisition_date: '1997-06-13', status: 'available', notes: '', price: 45000 },
        { id: 28, serial: '0332 048 0001 (8666)', name: 'SWING FOG SN 50', type: 'เครื่องพ่นหมอกควัน', department: 'ศตม.', acquisition_date: '1997-06-13', status: 'available', notes: '', price: 45000 },
        { id: 29, serial: '0332 012.4 0010 (NR070542604)', name: 'IGEBA PORT 123 ULV', type: 'เครื่องพ่นฝอยละออง ULV', department: 'ศดม.', acquisition_date: '2006-02-18', status: 'available', notes: '', price: 68000 },
        { id: 30, serial: '0332 012.4 0011 (NR070545004)', name: 'IGEBA PORT 123 ULV', type: 'เครื่องพ่นฝอยละออง ULV', department: 'ศดม.', acquisition_date: '2006-02-18', status: 'under_maintenance', notes: 'รออะไหล่', price: 68000 },
        { id: 31, serial: '0332 012.4 0012', name: 'SWING FOG SN50', type: 'เครื่องพ่นหมอกควัน', department: 'ศตม.', acquisition_date: '2006-11-30', status: 'available', notes: '', price: 45000 },
        { id: 32, serial: '0332 00418 00049', name: 'ULV Leco 1800 E', type: 'เครื่องพ่นฝอยละอองแบบติดรถยนต์', department: 'ศดม.', acquisition_date: '2009-05-25', status: 'available', notes: '', price: 250000 },
        { id: 33, serial: '0332 0418 0098 (TL 060545)', name: 'TWISTER XL BY DYNAFOG', type: 'เครื่องพ่นละอองฝอย', department: 'ศตม.', acquisition_date: '2015-08-05', status: 'pending_repair_approval', notes: 'สตาร์ทไม่ติด', price: 22000 },
        { id: 34, serial: 'สคร.0332 0418 0105 (154710)', name: 'Swingtec ULV', type: 'เครื่องพ่นฝอยละออง ULV', department: 'ศตม.', acquisition_date: '2016-05-10', status: 'available', notes: '', price: 75000 },
        { id: 35, serial: 'สคร.0332 0418 0104 (154714)', name: 'Swingtec ULV', type: 'เครื่องพ่นฝอยละออง ULV', department: 'ศดม.', acquisition_date: '2016-05-29', status: 'available', notes: '', price: 75000 },
        { id: 36, serial: 'สคร.0332 0418 0121', name: 'FONTAN PORTASTARS', type: 'เครื่องพ่นฝอยละออง', department: 'ศตม.', acquisition_date: '2016-11-29', status: 'available', notes: '', price: 35000 },
        { id: 37, serial: 'สคร.0332 0418 0122', name: 'FONTAN PORTASTARS', type: 'เครื่องพ่นฝอยละออง', department: 'ศดม.', acquisition_date: '2016-11-29', status: 'available', notes: '', price: 35000 },
        { id: 38, serial: 'สคร.0332 0418 0126', name: 'FONTAN PORTASTARS', type: 'เครื่องพ่นฝอยละออง', department: 'ศตม.', acquisition_date: '2016-11-29', status: 'available', notes: '', price: 35000 },
        { id: 39, serial: '0334 0461 1260', name: 'Misuko 3WF-3A', type: 'เครื่องพ่นเคมีอัดลม', department: 'ศดม.', acquisition_date: '2018-01-12', status: 'available', notes: '', price: 4000 },
        { id: 40, serial: '0332 0461 11600124', name: 'Swingtac ULV', type: 'เครื่องพ่นฝอยละออง ULV', department: 'ศตม.', acquisition_date: '2018-01-12', status: 'available', notes: '', price: 75000 },
        { id: 41, serial: 'XYZ-001', name: 'FONTAN PORTASTARS', type: 'เครื่องพ่นฝอยละออง', department: 'ศดม.', acquisition_date: '2023-01-15', status: 'available', notes: '', price: 35000 },
        { id: 42, serial: 'XYZ-002', name: 'SWING FOG SN50', type: 'เครื่องพ่นหมอกควัน', department: 'ศตม.', acquisition_date: '2023-02-20', status: 'under_maintenance', notes: 'หัวพ่นตัน', price: 45000 },
        { id: 43, serial: 'XYZ-003', name: 'HUDSON X-PERT SPRAYER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.2', acquisition_date: '2023-03-10', status: 'available', notes: '', price: 2500 },
        { id: 44, serial: 'XYZ-004', name: 'Micron CS10', type: 'เครื่องพ่นฝอยละออง', department: 'ศตม.', acquisition_date: '2023-04-05', status: 'available', notes: '', price: 15000 },
        { id: 45, serial: 'XYZ-005', name: 'IK VECTOR CONTROL SUPER', type: 'เครื่องพ่นเคมีอัดลม', department: 'นคม.3', acquisition_date: '2023-05-15', status: 'available', notes: '', price: 3200 }
    ],
    borrows: [
        { id: 1, equipment_ids: [19], user_id: 4, user_name: 'ผู้ใช้ทั่วไป', borrow_date: '2025-09-10', due_date: '2025-09-17', return_date: null, purpose: 'พ่นป้องกันไข้เลือดออก หมู่บ้านจัดสรร', contact_name: 'คุณสมศรี', contact_phone: '081-234-5678', notes: 'ขอเข้าพื้นที่ช่วงบ่าย', status: 'borrowed' },
        { id: 2, equipment_ids: [20, 21], user_id: 6, user_name: 'สมหญิง รักดี', borrow_date: '2025-09-08', due_date: '2025-09-15', return_date: null, purpose: 'พ่นยุงในชุมชนแออัด', contact_name: 'คุณมานี', contact_phone: '082-345-6789', notes: '', status: 'pending_delivery' },
        { id: 3, equipment_ids: [22], user_id: 4, user_name: 'ผู้ใช้ทั่วไป', borrow_date: '2025-08-01', due_date: '2025-08-08', return_date: '2025-08-10', actual_return_date: '2025-08-10', late_return_reason: 'ติดภารกิจด่วน ไม่สามารถนำเครื่องมาคืนได้ทัน', status: 'returned_late', notes: '', contact_name: 'คุณสมศรี', contact_phone: '081-234-5678', purpose: 'พ่นยุงโรงเรียน' },
        { id: 4, equipment_ids: [24], user_id: 6, user_name: 'สมหญิง รักดี', borrow_date: '2025-08-15', due_date: '2025-08-22', return_date: '2025-08-22', actual_return_date: '2025-08-22', purpose: 'ควบคุมโรคระบาดในพื้นที่', contact_name: 'คุณมานี', contact_phone: '082-345-6789', status: 'returned_damaged' },
        { id: 5, equipment_ids: [25, 26], user_id: 4, user_name: 'ผู้ใช้ทั่วไป', borrow_date: '2025-09-12', due_date: '2025-09-19', return_date: null, purpose: 'ขอยืมใช้ฉุกเฉิน', contact_name: 'คุณสมศรี', contact_phone: '081-234-5678', notes: '', status: 'pending_borrow_approval' }
    ],
    repairs: [
        { id: 1, equipment_id: 30, equipment_name: 'IGEBA PORT 123 ULV', damage_description: 'ระบบพ่นทำงานผิดปกติ', status: 'repair_approved', technician_id: 3, repair_details: null, cost: null, parts_used: null, request_date: '2025-08-15', attachments: [] },
        { id: 2, equipment_id: 33, equipment_name: 'TWISTER XL BY DYNAFOG', damage_description: 'สตาร์ทไม่ติด', status: 'pending_repair_approval', technician_id: null, repair_details: null, cost: null, parts_used: null, request_date: '2025-08-18', attachments: [] },
        { id: 3, equipment_id: 24, equipment_name: 'IK VECTOR CONTROL SUPER', damage_description: 'ชำรุดจากการใช้งาน (ชุดยืม #4)', status: 'pending_repair_approval', technician_id: null, repair_details: null, cost: null, parts_used: null, request_date: '2025-08-22', attachments: [] },
        { id: 4, equipment_id: 10, equipment_name: 'HUDSON X-PERT SPRAYER', damage_description: 'แรงดันตก', status: 'completed', technician_id: 3, repair_details: 'เปลี่ยนหัวฉีดและซีลยาง O-ring ที่เสื่อมสภาพ', cost: 850, parts_used: 'หัวฉีด, ซีลยาง O-ring', request_date: '2025-07-05', repair_date: '2025-07-08', attachments: [] },
        { id: 5, equipment_id: 11, equipment_name: 'HUDSON X-PERT SPRAYER', damage_description: 'เครื่องเดินไม่เรียบ', status: 'completed', technician_id: 7, repair_details: 'ล้างทำความสะอาดคาร์บูเรเตอร์', cost: 300, parts_used: 'น้ำยาล้างคาร์บูเรเตอร์', request_date: '2025-07-10', repair_date: '2025-07-11', attachments: [] },
        { id: 6, equipment_id: 42, equipment_name: 'SWING FOG SN50', damage_description: 'หัวพ่นตัน', status: 'repair_approved', technician_id: 3, repair_details: null, cost: null, parts_used: null, request_date: '2025-09-01', attachments: [] }
    ],
    users: [
        { id: 1, full_name: 'ผู้ดูแลระบบ', email: 'admin@example.com', role: 'admin', status: 'active', agency: 'ส่วนกลาง', address: '-', phone: '0' },
        { id: 2, full_name: 'ผู้อนุมัติ', email: 'approver@example.com', role: 'approver', status: 'active', agency: 'สำนักงานใหญ่', address: '-', phone: '0' },
        { id: 3, full_name: 'ช่างเทคนิค', email: 'tech@example.com', role: 'technician', status: 'active', agency: 'แผนกซ่อมบำรุง', address: '-', phone: '0' },
        { id: 4, full_name: 'ผู้ใช้ทั่วไป', email: 'user@example.com', role: 'user', status: 'active', agency: 'อบต. ตัวอย่าง', address: '123 ถ.สุขุมวิท', phone: '080-000-0000' },
        { id: 6, full_name: 'สมหญิง รักดี', email: 'user2@example.com', role: 'user', status: 'active', agency: 'รพ.สต. แดนสุข', address: '789 ถ.ราษฎร์บำรุง', phone: '081-111-2222' },
        { id: 7, full_name: 'ช่างวิทย์', email: 'tech2@example.com', role: 'technician', status: 'active', agency: 'แผนกซ่อมบำรุง', address: '-', phone: '0' }
    ],
    pendingUsers: [
        { id: 5, full_name: 'สมชาย ใจดี', email: 'somchai@example.com', role: 'user', status: 'pending_approval', agency: 'เทศบาลนคร', address: '456 ถ.เพชรเกษม', phone: '090-000-0000' },
        { id: 8, full_name: 'มานะ อดทน', email: 'newuser@example.com', role: 'user', status: 'pending_approval', agency: 'อบจ. ใกล้กรุง', address: '101 ถ.มิตรภาพ', phone: '092-333-4444' }
    ],
    groups: [
        { id: 1, name: 'ทีม A', member_ids: [3, 4], permissions: ['CAN_VIEW_REPORTS'] },
        { id: 2, name: 'ทีม B', member_ids: [], permissions: [] }
    ],
    assessments: [
        { id: 1, equipment_id: 1, date: '2025-06-15', exterior_condition: 'mid', engine_start: 'easy', clean_pipe: true, clean_chem_line: true, clean_gas_tank: true, chem_name: 'Deltamethrin', chem_concentration: '2.5%', chem_mix_ratio: '1:25', result_temp: '55', result_flow_rate: '550', notes: 'สภาพโดยรวมดี' },
        { id: 2, equipment_id: 28, date: '2025-06-20', exterior_condition: 'old', engine_start: 'hard', clean_pipe: true, chem_name: 'Cypermethrin', chem_concentration: '10%', chem_mix_ratio: '1:100', result_temp: '60', result_flow_rate: '600', notes: 'ควรตรวจเช็คหัวเทียน' }
    ],
    notifications: [
        { id: 1, message: 'มีผู้ใช้ใหม่ลงทะเบียน: สมชาย ใจดี', target: ['admin', 'approver'], timestamp: new Date('2025-09-11T10:00:00Z'), read: false },
        { id: 2, message: 'คำขอยืม #5 จาก ผู้ใช้ทั่วไป กำลังรอการอนุมัติ', target: ['admin', 'approver'], timestamp: new Date('2025-09-12T11:30:00Z'), read: false },
        { id: 3, message: 'เครื่อง TWISTER XL BY DYNAFOG รอการอนุมัติซ่อม', target: ['admin', 'approver'], timestamp: new Date('2025-09-12T09:00:00Z'), read: true }
    ],
    activityLog: [
        { id: 1, admin_id: 2, admin_name: 'ผู้อนุมัติ', action: 'APPROVE_USER', target_type: 'user', target_id: 6, timestamp: '2025-09-01T09:05:00Z', details: 'อนุมัติผู้ใช้: สมหญิง รักดี' }
    ],
    seq: { borrow: 6, repair: 7, user: 9, equip: 46, assessment: 3, notification: 4, log: 2, group: 3 }
};