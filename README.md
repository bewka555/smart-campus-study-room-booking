# Study Room Booking — ระบบจองห้องติว Buddy Space

 **กลุ่มที่ 4**
## สมาชิก
| ที่ | ชื่อ–สกุล | รหัสนักศึกษา | GitHub username |
|---|---|---|---|
| 1 | วิมลณัฐ เปี่ยมน้อย|6721207007 |bewka555 |
| 2 | ฑิฆัมพร รักธรรม|6721207011 |Jaowxn |
| 3 | พรนภัส เลี่ยมนุช|6721207014 |Pornnapat2005 |
| 4 | นุศรา แวววรรณจิตร|6721207017 |nussara01-nn |
| 5 | ทอฝัน ธัญญเจริญ|6721207037 |thofun19-th |
| 6 | สุธาทิพย์ พูดขุนทด|6721207042 |iceZy24-24 |
---
Github Page:https://bewka555.github.io/smart-campus-study-room-booking/
## ฟีเจอร์
- [x] F1 fetch `data/rooms.json` แล้วสร้างการ์ดห้องด้วย DOM
- [x] F2 กรองตามความจุขั้นต่ำและอุปกรณ์ (checkbox หลายตัว)
- [x] F3 ตารางช่วงเวลา 08:00–20:00 ด้วย CSS Grid สร้างจาก JS (สี + ข้อความ)
- [x] F4 ฟอร์มจอง + validation (HTML และ JS)
- [x] F5 ตรวจจองซ้อน (JSON + localStorage) พร้อมบอกเหตุผล
- [x] F6 การจองของฉัน ยกเลิกได้ (ยืนยันก่อน) ช่วงเวลากลับมาว่าง
- [x] เสริม G3: แผงแสดงห้องว่าง "ตอนนี้" บนหน้าแรก อ้างอิงเวลาจริงและรายการจองของวันปัจจุบัน แสดงจำนวนนับห้องว่าง/ไม่ว่าง/ทั้งหมด นาฬิกา สัดส่วนห้องว่าง และสถานะเวลาเปิดบริการ
- [x] เสริม: ค้นหาห้องว่างตามชื่อห้อง อาคาร อุปกรณ์ และกรองตามชั้น พร้อมปุ่มล้างตัวกรองและอัปเดตสถานะทันที
- [x] เสริม: สถานะห้องว่างรีเฟรชอัตโนมัติทุก 30 วินาที และซิงก์เมื่อมีการเปลี่ยนแปลง localStorage จากแท็บอื่น
- [x] เสริม: หน้า "กำลังใช้งานอยู่ในขณะนี้" แสดงห้องที่มีการจองครอบคลุมเวลาปัจจุบัน พร้อมตัวกรองชั้น/ค้นหาชื่อกลุ่ม และอัปเดตสถานะอัตโนมัติทุก 30 วินาที
- [x] เสริม: สถิติห้องที่ถูกจองมากที่สุด

## แหล่งที่มาของข้อมูล
- ห้อง (6 ห้อง): สำรวจเองที่ห้องสมุด อาคาร 8 ชั้น 3, 7 และ 8 — 05/11/2026/วิมลณัฐ,พรนภัส
- การจองตัวอย่าง 15 รายการใน `data/rooms.json` เป็นข้อมูลตัวอย่างสำหรับทดสอบ **ต้องแทนด้วยข้อมูลจริงที่กลุ่มเก็บ** แล้วแก้ข้อความนี้
- [rooms.json](https://github.com/user-attachments/files/34546214/rooms.json){
  "_note": "ข้อมูลห้องมาจากที่กลุ่มสำรวจ (ห้องสมุด อาคาร 8 ชั้น 3, 7, 8) ส่วน bookings เป็นข้อมูลตัวอย่าง 15 รายการ",
  "rooms": [
    {
      "id": "r01",
      "name": "Buddy Space 1",
      "building": "ห้องสมุด อาคาร 8",
      "floor": 3,
      "capacity": 8,
      "capacityMin": 6,
      "maxHours": 2,
      "equipment": [
        "ทีวี",
        "โต๊ะ",
        "เก้าอี้"
      ],
      "image": "images/r01.jpg"
    },
    {
      "id": "r02",
      "name": "Buddy Space 2",
      "building": "ห้องสมุด อาคาร 8",
      "floor": 3,
      "capacity": 8,
      "capacityMin": 6,
      "maxHours": 2,
      "equipment": [
        "ทีวี",
        "โต๊ะ",
        "เก้าอี้"
      ],
      "image": "images/r02.jpg"
    },
    {
      "id": "r03",
      "name": "Buddy Space 3",
      "building": "ห้องสมุด อาคาร 8",
      "floor": 7,
      "capacity": 10,
      "capacityMin": 4,
      "maxHours": 2,
      "equipment": [
        "โต๊ะ",
        "เก้าอี้"
      ],
      "image": "images/r03.jpg"
    },
    {
      "id": "r04",
      "name": "Buddy Space 4",
      "building": "ห้องสมุด อาคาร 8",
      "floor": 7,
      "capacity": 10,
      "capacityMin": 4,
      "maxHours": 2,
      "equipment": [
        "โต๊ะ",
        "เก้าอี้"
      ],
      "image": "images/r04.jpg"
    },
    {
      "id": "r05",
      "name": "Buddy Space 6",
      "building": "ห้องสมุด อาคาร 8",
      "floor": 8,
      "capacity": 4,
      "capacityMin": 2,
      "maxHours": 2,
      "equipment": [
        "ทีวี",
        "โต๊ะ",
        "เก้าอี้"
      ],
      "image": "images/r05.jpg"
    },
    {
      "id": "r06",
      "name": "Buddy Space 7",
      "building": "ห้องสมุด อาคาร 8",
      "floor": 8,
      "capacity": 4,
      "capacityMin": 2,
      "maxHours": 2,
      "equipment": [
        "ทีวี",
        "โต๊ะ",
        "เก้าอี้"
      ],
      "image": "images/r06.jpg"
    }
  ],
  "bookings": [
    {
      "id": "b001",
      "roomId": "r01",
      "date": "2026-11-09",
      "start": "09:00",
      "end": "11:00",
      "people": 7,
      "by": "รินสา ทองปน",
      "studentId": "6821126035"
    },
    {
      "id": "b002",
      "roomId": "r03",
      "date": "2026-11-09",
      "start": "13:00",
      "end": "15:00",
      "people": 6,
      "by": "ธิดารัตน์ เพ็งสา",
      "studentId": "6821126034"
    },
    {
      "id": "b003",
      "roomId": "r02",
      "date": "2026-11-09",
      "start": "09:00",
      "end": "11:00",
      "people": 6,
      "by": "พิเชษฐ มะเดื่อ",
      "studentId": "6621105043"
    },
    {
      "id": "b004",
      "roomId": "r04",
      "date": "2026-11-10",
      "start": "09:00",
      "end": "11:00",
      "people": 7,
      "by": "วรวุฒิ ไชยมา",
      "studentId": "6621415013"
    },
    {
      "id": "b005",
      "roomId": "r06",
      "date": "2026-11-10",
      "start": "13:00",
      "end": "15:00",
      "people": 3,
      "by": "พงษ์พิพัฒน์ วงศ์กาลเลิศ",
      "studentId": "6721712041"
    },
    {
      "id": "b006",
      "roomId": "r05",
      "date": "2026-11-10",
      "start": "09:00",
      "end": "11:00",
      "people": 2,
      "by": "ตะวัน ภูวงษา",
      "studentId": "6721712045"
    },
    {
      "id": "b007",
      "roomId": "r05",
      "date": "2026-11-10",
      "start": "14:00",
      "end": "16:00",
      "people": 4,
      "by": "ธนินทร์ ธนวุฒิกร",
      "studentId": "6621415005"
    },
    {
      "id": "b008",
      "roomId": "r02",
      "date": "2026-11-11",
      "start": "09:00",
      "end": "11:00",
      "people": 7,
      "by": "จิรภัทรทองทา โรจนปัญญา",
      "studentId": "6621415011"
    },
    {
      "id": "b009",
      "roomId": "r06",
      "date": "2026-11-11",
      "start": "13:00",
      "end": "15:00",
      "people": 3,
      "by": "ภานุวัฒน์ เปี้ยฟ้า",
      "studentId": "6721712061"
    },
    {
      "id": "b010",
      "roomId": "r01",
      "date": "2026-11-12",
      "start": "14:00",
      "end": "16:00",
      "people": 8,
      "by": "สิทธิรินทร์ ศรีจันทร์",
      "studentId": "6621415007"
    },
    {
      "id": "b011",
      "roomId": "r04",
      "date": "2026-11-12",
      "start": "13:00",
      "end": "15:00",
      "people": 5,
      "by": "จิรกานต์ ทองอนาค",
      "studentId": "6621105033"
    },
    {
      "id": "b012",
      "roomId": "r03",
      "date": "2026-11-13",
      "start": "13:00",
      "end": "15:00",
      "people": 7,
      "by": "ธิดารัตน์ เพ็งสา",
      "studentId": "6821126034"
    },
    {
      "id": "b013",
      "roomId": "r03",
      "date": "2026-11-13",
      "start": "09:00",
      "end": "11:00",
      "people": 8,
      "by": "นภัสสร ปรีดาผล",
      "studentId": "6621126040"
    },
    {
      "id": "b014",
      "roomId": "r05",
      "date": "2026-11-14",
      "start": "14:00",
      "end": "16:00",
      "people": 4,
      "by": "ธนกร บุญเรือง",
      "studentId": "6721712055"
    },
    {
      "id": "b015",
      "roomId": "r06",
      "date": "2026-11-14",
      "start": "09:00",
      "end": "11:00",
      "people": 3,
      "by": "ศิริประภา การประชุม",
      "studentId": "6721712047"
    }
  ]
}

- รูปภาพ:ถ่ายเอง
<img width="1000" height="750" alt="r04" src="https://github.com/user-attachments/assets/1e273221-6fce-4afe-9290-2361e799b76d" />
<img width="1000" height="750" alt="r03" src="https://github.com/user-attachments/assets/08f32548-56a5-4a61-8fa3-c68339b0a24b" />
<img width="1000" height="750" alt="r02" src="https://github.com/user-attachments/assets/c3c980ee-3c0f-4a89-a742-8282f0a71c0b" />
<img width="1000" height="750" alt="r06" src="https://github.com/user-attachments/assets/79d8790f-9ea8-43b0-b699-81c5a04ab4cd" />
<img width="1024" height="538" alt="r05" src="https://github.com/user-attachments/assets/bc968edb-969e-46ef-8af0-9f34904296a1" />
<img width="1000" height="750" alt="r01" src="https://github.com/user-attachments/assets/5bfd2350-467d-4a47-8eb5-46f2a9caa09d" />
<img width="1200" height="674" alt="hero" src="https://github.com/user-attachments/assets/ffbb9646-150b-4140-9d1e-26bd0efeeae2" />



## Lighthouse (Accessibility)
<img width="1907" height="970" alt="Screenshot 2026-11-08 222042" src="https://github.com/user-attachments/assets/ce1b6750-54c3-4b29-9451-339faef6386f" />
<img width="1917" height="962" alt="Screenshot 2026-11-08 222748" src="https://github.com/user-attachments/assets/0013c030-fd58-4bd5-b9a8-864f4b69193d" />
<img width="1913" height="965" alt="Screenshot 2026-11-08 222143" src="https://github.com/user-attachments/assets/c4fea824-ba34-4982-a531-2e69ff295f98" />
<img width="1917" height="965" alt="Screenshot 2026-11-08 222237" src="https://github.com/user-attachments/assets/dbf3e719-cc55-46fb-81ce-b01b380649ee" />
<img width="1917" height="961" alt="Screenshot 2026-11-08 222309" src="https://github.com/user-attachments/assets/a470fd75-ba98-4c1b-b6a2-70573c1d4e3d" />
<img width="1917" height="958" alt="Screenshot 2026-11-08 222712" src="https://github.com/user-attachments/assets/4cd5c685-a87f-4dbe-bcce-2e92773edb11" />



