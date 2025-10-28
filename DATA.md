# เอกสารข้อมูลจำลอง (Mock Data)

เอกสารนี้อธิบายโครงสร้างของข้อมูลจำลองที่ใช้ในแอปพลิเคชันต้นแบบ

## `equipment`

อาร์เรย์ของอ็อบเจกต์อุปกรณ์แต่ละชิ้น

-   `id`: (Number) ID ที่ไม่ซ้ำกัน
-   `serial`: (String) หมายเลขซีเรียล
-   `name`: (String) ชื่ออุปกรณ์
-   `type`: (String) ประเภทของอุปกรณ์
-   `department`: (String) หน่วยงานที่รับผิดชอบ
-   `acquisition_date`: (String) วันที่ได้รับ (รูปแบบ YYYY-MM-DD)
-   `status`: (String) สถานะปัจจุบัน (`available`, `borrowed`, `under_maintenance`, `pending_repair_approval`, `deleted`)
-   `notes`: (String) หมายเหตุเพิ่มเติม
-   `price`: (Number) ราคา

**ตัวอย่าง:**
```json
{ 
  "id": 1, 
  "serial": "0334 0418 0044", 
  "name": "HUDSON X-PERT SPRAYER", 
  "type": "เครื่องพ่นเคมีอัดลม", 
  "department": "นคม.2", 
  "acquisition_date": "2008-01-25", 
  "status": "available", 
  "notes": "", 
  "price": 2500 
}
```

---

## `borrows`

อาร์เรย์ของอ็อบเจกต์บันทึกการยืม

-   `id`: (Number) ID ที่ไม่ซ้ำกัน
-   `equipment_ids`: (Array of Numbers) ID ของอุปกรณ์ที่ถูกยืม
-   `user_id`: (Number) ID ของผู้ยืม
-   `user_name`: (String) ชื่อผู้ยืม
-   `borrow_date`: (String) วันที่ยืม (YYYY-MM-DD)
-   `due_date`: (String) วันที่กำหนดคืน (YYYY-MM-DD)
-   `return_date`: (String | null) วันที่คืนจริง
-   `purpose`: (String) วัตถุประสงค์การยืม
-   `status`: (String) สถานะการยืม (`pending_borrow_approval`, `pending_delivery`, `borrowed`, `returned_late`, `returned_damaged`, etc.)

---

## `repairs`

อาร์เรย์ของอ็อบเจกต์บันทึกการซ่อม

-   `id`: (Number) ID ที่ไม่ซ้ำกัน
-   `equipment_id`: (Number) ID ของอุปกรณ์ที่ซ่อม
-   `damage_description`: (String) รายละเอียดความเสียหาย
-   `status`: (String) สถานะการซ่อม (`pending_repair_approval`, `repair_approved`, `completed`)
-   `request_date`: (String) วันที่แจ้งซ่อม (YYYY-MM-DD)
-   `cost`: (Number | null) ค่าใช้จ่ายในการซ่อม

---

## `users`

อาร์เรย์ของอ็อบเจกต์ผู้ใช้งาน

-   `id`: (Number) ID ที่ไม่ซ้ำกัน
-   `full_name`: (String) ชื่อ-สกุล
-   `email`: (String) อีเมล
-   `role`: (String) บทบาท (`admin`, `approver`, `technician`, `user`)
-   `status`: (String) สถานะบัญชี (`active`, `pending_approval`, `deleted`)
-   `agency`: (String) หน่วยงาน

