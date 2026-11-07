'use strict';
// ฟังก์ชันที่ใช้ร่วมกันทุกหน้า (โหลดก่อนไฟล์ JS ของแต่ละหน้า)
const App = {
  OPEN: 8,          // เปิด 08:00
  CLOSE: 20,        // ปิด 20:00
  MAX_HOURS: 2,     // จองได้ไม่เกิน 2 ชม./ครั้ง
  KEY: 'studyRoomMyBookings',

  // F1/T7: ดึงข้อมูลจาก JSON (path แบบ relative เพื่อให้ใช้บน GitHub Pages ได้)
  async loadData() {
    const res = await fetch('data/rooms.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },

  // localStorage: การจองของผู้ใช้
  getMine() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch (e) { return []; }
  },
  // คืนค่า true ถ้าบันทึกสำเร็จ (อาจล้มเหลวในโหมดส่วนตัวหรือเมื่อพื้นที่เต็ม)
  saveMine(list) {
    try { localStorage.setItem(this.KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  },

  // รวมการจองจาก JSON + localStorage
  allBookings(data) { return [...data.bookings, ...this.getMine()]; },

  toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; },

  // ช่วงเวลา a และ b ทับกันหรือไม่ (a เริ่มก่อน b จบ และ b เริ่มก่อน a จบ)
  overlaps(a, b) {
    return this.toMin(a.start) < this.toMin(b.end) && this.toMin(b.start) < this.toMin(a.end);
  },

  // F5: หาการจองที่ซ้อนกับการจองใหม่ (ห้องเดียวกัน วันเดียวกัน เวลาทับกัน)
  findConflict(data, nb) {
    return this.allBookings(data).find(b =>
      b.roomId === nb.roomId && b.date === nb.date && this.overlaps(b, nb));
  },

  pad(n) { return String(n).padStart(2, '0'); },
  hh(h) { return this.pad(h) + ':00'; },
  todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  },
  nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); },
  label(r) { return `${r.name} (ชั้น ${r.floor})`; },
  fmtDate(s) {
    return new Date(s + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  // สร้าง element พร้อม class และข้อความ
  el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  },
  showError(box, msg) { box.hidden = false; box.textContent = msg; },
  loadErrorMsg(e) {
    return 'โหลดข้อมูลห้องไม่สำเร็จ กรุณารีเฟรชหน้า (ถ้าเปิดไฟล์โดยตรง ให้เปิดผ่าน Live Server) รายละเอียด: ' + e.message;
  },
  // ถ้ารูปห้องโหลดไม่ได้ ให้ใช้ภาพแทนที่
  imgFallback(img) {
    const useFallback = () => { img.src = 'images/placeholder.svg'; };
    img.addEventListener('error', useFallback, { once: true });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) useFallback();
  },

  // ไอคอน SVG แบบ inline (ชุดไอคอนอนุญาตตาม T9) ใส่ aria-hidden เพราะมีข้อความกำกับเสมอ
  ICONS: {
    home: 'M12 3 2 12h3v8h5v-5h4v5h5v-8h3z',
    grid: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
    calendar: 'M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2zM5 10v10h14V10z',
    list: 'M4 6h2v2H4zM8 6h12v2H8zM4 11h2v2H4zM8 11h12v2H8zM4 16h2v2H4zM8 16h12v2H8z',
    info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM11 7h2v2h-2zM11 11h2v6h-2z',
    book: 'M2 5q5-2 10 1v14q-5-3-10-1zM22 5q-5-2-10 1v14q5-3 10-1z',
    building: 'M4 3h10v18h-4v-4H8v4H4zM16 8h4v13h-4zM6 6h2v2H6zM10 6h2v2h-2zM6 10h2v2H6zM10 10h2v2h-2z',
    check: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM10.5 16.5 6.5 12.5l1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z',
    star: 'M12 2l3 6.5 7 .9-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.9z',
    clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM11 6h2v5.6l3.5 2-1 1.7L11 13z',
    people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c0-3.5 3-6 7-6s7 2.5 7 6zM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17.5 14c3 .2 5 2 5 5h-4.5c0-2-.5-3.6-.5-5z',
    tv: 'M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4.5 6v8.5h15V6zM8 19h8v2H8z',
    arrow: 'M4 11h12.2l-5.6-5.6L12 4l8 8-8 8-1.4-1.4 5.6-5.6H4z'
  },
  icon(name) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', this.ICONS[name]);
    path.setAttribute('fill-rule', 'evenodd');
    svg.append(path);
    return svg;
  },
  // ใส่ไอคอนให้ทุก element ที่มี data-icon="ชื่อ"
  fillIcons() {
    document.querySelectorAll('[data-icon]').forEach(e => e.prepend(this.icon(e.dataset.icon)));
  },
  // เมนูพับบนมือถือ (ถ้า JS ไม่ทำงาน เมนูจะแสดงเต็มตามปกติ)
  initNav() {
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('main-nav');
    if (!toggle || !nav) return;
    document.documentElement.classList.add('has-js');
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
};
App.fillIcons();
App.initNav();
