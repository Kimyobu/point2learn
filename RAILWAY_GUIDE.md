# 🚂 คู่มือการ Deploy บน Railway (แนะนำสำหรับ SQLite)

Railway เหมาะมากสำหรับโปรเจกต์นี้เพราะรองรับ Persistent Volume ทำให้ข้อมูลใน SQLite ไม่หายครับ

### 1. การเตรียมตัว
- เชื่อมต่อโปรเจกต์ของคุณกับ GitHub
- สมัครบัญชี [Railway](https://railway.app/)

### 2. ขั้นตอนการ Deploy
1. กด **New Project** -> **Deploy from GitHub repo**
2. เลือก Repository ของโปรเจกต์นี้
3. ไปที่แถบ **Variables** และเพิ่มตัวแปรดังนี้:
   - `DATABASE_URL`: `file:/app/storage/dev.db`
   - `UPLOAD_PATH`: `/app/storage/uploads`
   - `JWT_SECRET`: (ใส่ข้อความสุ่มยาวๆ เพื่อความปลอดภัย)
   - `PORT`: `3000`

### 3. การตั้งค่าการเก็บข้อมูล (Volumes) - สำคัญมาก
เพื่อให้ข้อมูลแฟนและรูปภาพไม่หายเวลาเปิิดเว็บใหม่:
1. ไปที่แถบ **Settings** ของ Service ใน Railway
2. เลื่อนลงมาที่หัวข้อ **Volumes** กด **Add Volume**
3. ตั้งชื่อ Volume และระบุ Mount Path เป็น `/app/storage`

### 4. การจัดการ Database
- คุณสามารถรัน `npx prisma db push` ผ่านหน้าจอ **Terminal** ใน Railway Console ได้หากต้องการตรวจสอบสถานะ

---
แอปจะรันคำสั่ง `npx prisma db push` อัตโนมัติทุกครั้งที่ Start เพื่อให้มั่นใจว่าตารางข้อมูลตรงตามโค้ดล่าสุดครับ! 💖
