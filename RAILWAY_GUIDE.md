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

### 3. การตั้งค่าการเก็บข้อมูลถาวร (Volumes) - สำคัญมาก!
หากบนหน้าเว็บไม่ได้ตั้งค่า Volume ทันที ให้คุณกดสร้างโปรเจกต์ไปก่อน แล้วทำตามนี้:
1. กดที่กล่องโปรเจกต์ (Service) ของคุณในหน้าจอ Railway
2. ไปที่แถบ **Settings** ด้านบน
3. เลื่อนลงมาเรื่อยๆ จนเจอหมวด **Volumes** (หรือถ้าใน UI ใหม่ อาจจะใช้วิธีคลิกขวาที่พื้นที่ว่างหน้า Canvas ละเลือก New -> Volume เล็กๆ) 
4. ปกติจะกด **New Volume** ภายในตัว Service ได้เลยครับ
5. สำคัญ: กำหนด **Mount Path** ให้พิมพ์คำว่า: `/app/storage`

### 4. การจัดการ Database
- คุณสามารถรัน `npx prisma db push` ผ่านหน้าจอ **Terminal** ใน Railway Console ได้หากต้องการตรวจสอบสถานะ

---
แอปจะรันคำสั่ง `npx prisma db push` อัตโนมัติทุกครั้งที่ Start เพื่อให้มั่นใจว่าตารางข้อมูลตรงตามโค้ดล่าสุดครับ! 💖
