'use strict';
const App = {
  OPEN: 8,          
  CLOSE: 20,        
  MAX_HOURS: 2,     
  KEY: 'studyRoomMyBookings',


  async loadData() {
    const res = await fetch('data/rooms.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },


  getMine() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch (e) { return []; }
  },
 
  saveMine(list) {
    try { localStorage.setItem(this.KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  },


  allBookings(data) { return [...data.bookings, ...this.getMine()]; },

  toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; },


  overlaps(a, b) {
    return this.toMin(a.start) < this.toMin(b.end) && this.toMin(b.start) < this.toMin(a.end);
  },


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

  imgFallback(img) {
    const useFallback = () => { img.src = 'images/placeholder.svg'; };
    img.addEventListener('error', useFallback, { once: true });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) useFallback();
  },


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
