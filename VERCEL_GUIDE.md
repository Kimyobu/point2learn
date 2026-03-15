# 🔼 คู่มือการ Deploy บน Vercel (แนะนำสำหรับระยะยาว)

Vercel มีข้อดีคือฟรีและเร็วมาก แต่เนื่องจาก SQLite เป็นไฟล์นิ่ง Vercel จะไม่ยอมให้เซฟข้อมูลลงไฟล์ในเครื่องได้ คุณต้องใช้ฐานข้อมูลภายนอกแทนครับ

### 1. สิ่งที่ต้องเตรียม
- ฐานข้อมูล Postgres (แนะนำใช้ **Vercel Postgres** หรือ **Neon.tech**)
- บัญชี [Vercel](https://vercel.com/)

### 2. การปรับเปลี่ยนโค้ด (สำคัญ)
ก่อน Deploy ไป Vercel คุณต้องเปลี่ยน `prisma/schema.prisma` จาก `sqlite` เป็น `postgresql`:
```prisma
// เปลี่ยนใน prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. ขั้นตอนการ Deploy
1. เชื่อม GitHub กับ Vercel
2. เลือกโปรเจกต์แล้วเพิ่ม **Environment Variables**:
   - `DATABASE_URL`: (ลิงก์เชื่อมต่อ Postgres ที่ได้จาก Vercel หรือ Neon)
   - `JWT_SECRET`: (ข้อความสุ่ม)
3. กด **Deploy**

### 4. เกี่ยวกับรูปภาพ (Uploads)
Vercel ไม่รองรับการเก็บไฟล์ในเครื่อง (`public/uploads`) หากคุณอัปโหลดรูป รูปจะหายไปเมื่อ Vercel รีสตาร์ท
- **คำแนะนำ**: ควรเปลี่ยนไปใช้บริการเก็บรูปภายนอกเช่น **Cloudinary** หรือ **AWS S3** หากต้องการใช้ Vercel ในระยะยาวครับ

---
หากต้องการให้ผมช่วยเปลี่ยนระบบเป็น Postgres บอกได้เลยนะครับ! 😊
