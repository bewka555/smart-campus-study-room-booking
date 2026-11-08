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

  // เมนูพับบนมือถือ และคงแถบเมนูไว้ด้านบนขณะเลื่อนหน้า
  initNav() {
    const header = document.querySelector('.site-header');
    const syncHeaderHeight = () => {
      if (header) {
        const height = Math.ceil(header.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--site-header-height', `${height}px`);
      }
    };

    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('main-nav');
    document.documentElement.classList.add('has-js');

    // ชดเชยพื้นที่ของ header ที่เปลี่ยนความสูงได้ โดยไม่ทับเนื้อหาหน้าเว็บ
    syncHeaderHeight();
    if (header && 'ResizeObserver' in window) {
      header._siteHeaderObserver = new ResizeObserver(syncHeaderHeight);
      header._siteHeaderObserver.observe(header);
    } else {
      window.addEventListener('resize', syncHeaderHeight, { passive: true });
    }

    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      syncHeaderHeight();
    });
  }
};
App.initNav();
