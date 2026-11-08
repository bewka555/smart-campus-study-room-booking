'use strict';
const errBox = document.getElementById('error-box');
const form = document.getElementById('booking-form');
const slotGrid = document.getElementById('slot-grid');
const result = document.getElementById('result');
const f = {
  room: document.getElementById('room'), date: document.getElementById('date'),
  start: document.getElementById('start'), end: document.getElementById('end'),
  people: document.getElementById('people'), name: document.getElementById('name'),
  sid: document.getElementById('student-id')
};
let data;

const currentRoom = () => data.rooms.find(r => r.id === f.room.value);

function fillOptions() {
  for (const r of data.rooms) {
    const o = App.el('option', '', `${App.label(r)} · จุ ${r.capacityMin}–${r.capacity} คน`);
    o.value = r.id;
    f.room.append(o);
  }
  for (let h = App.OPEN; h < App.CLOSE; h++) {
    const o = App.el('option', '', App.hh(h)); o.value = App.hh(h); f.start.append(o);
  }
  for (let h = App.OPEN + 1; h <= App.CLOSE; h++) {
    const o = App.el('option', '', App.hh(h)); o.value = App.hh(h); f.end.append(o);
  }
}

// สถานะของแต่ละช่อง 1 ชั่วโมง: free / busy / mine / past
function slotStatus(room, date, h) {
  const slot = { start: App.hh(h), end: App.hh(h + 1) };
  const mineIds = App.getMine().map(b => b.id);
  const hit = App.allBookings(data).find(b => b.roomId === room.id && b.date === date && App.overlaps(b, slot));
  if (hit) return mineIds.includes(hit.id) ? 'mine' : 'busy';
  if (date === App.todayStr() && h * 60 < App.nowMin()) return 'past';
  return 'free';
}

const STATUS_TEXT = { free: 'ว่าง', busy: 'ไม่ว่าง', mine: 'จองโดยคุณ', past: 'เลยเวลาแล้ว' };

// F3: ตารางช่วงเวลา 08:00–20:00 สร้างด้วย JS แสดงผลด้วย CSS Grid
function renderSlots() {
  const room = currentRoom();
  slotGrid.replaceChildren();
  if (!room || !f.date.value) {
    slotGrid.append(App.el('p', 'hint', 'เลือกห้องและวันที่เพื่อดูตารางเวลา'));
    return;
  }
  const s = f.start.value ? App.toMin(f.start.value) / 60 : -1;
  const e = f.end.value ? App.toMin(f.end.value) / 60 : -1;
  for (let h = App.OPEN; h < App.CLOSE; h++) {
    const st = slotStatus(room, f.date.value, h);
    const picked = st === 'free' && h >= s && h < e;
    const btn = App.el('button', `slot slot-${st}${picked ? ' picked' : ''}`);
    btn.type = 'button';
    btn.dataset.hour = h;
    btn.disabled = st !== 'free';
    btn.setAttribute('aria-pressed', picked);
    btn.append(App.el('span', 'slot-time', `${App.hh(h)}–${App.hh(h + 1)}`),
               App.el('span', 'slot-status', picked ? 'เลือกแล้ว' : STATUS_TEXT[st]));
    slotGrid.append(btn);
  }
}

// T2: ตรวจสอบฟอร์มด้วย JS (นอกเหนือจาก attribute ใน HTML)
function validate() {
  const errs = {};
  const room = currentRoom();
  const today = App.todayStr();
  if (!f.room.value) errs.room = 'กรุณาเลือกห้อง';
  if (!f.date.value) errs.date = 'กรุณาเลือกวันที่';
  else if (f.date.value < today) errs.date = 'เลือกวันที่ย้อนหลังไม่ได้';
  if (!f.start.value) errs.start = 'กรุณาเลือกเวลาเริ่ม';
  if (!f.end.value) errs.end = 'กรุณาเลือกเวลาสิ้นสุด';
  if (f.start.value && f.end.value) {
    const hours = (App.toMin(f.end.value) - App.toMin(f.start.value)) / 60;
    if (hours <= 0) errs.end = 'เวลาสิ้นสุดต้องหลังเวลาเริ่ม';
    else if (hours > App.MAX_HOURS) errs.end = `จองได้ไม่เกิน ${App.MAX_HOURS} ชั่วโมงต่อครั้ง (ที่เลือก ${hours} ชั่วโมง)`;
    else if (!errs.date && f.date.value === today && App.toMin(f.start.value) < App.nowMin()) errs.start = 'เวลาเริ่มผ่านไปแล้ว เลือกเวลาถัดไป';
  }
  const n = Number(f.people.value);
  if (!f.people.value) errs.people = 'กรุณากรอกจำนวนคน';
  else if (!Number.isInteger(n) || n < 1) errs.people = 'จำนวนคนต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป';
  else if (room && n > room.capacity) errs.people = `ห้องนี้จุได้สูงสุด ${room.capacity} คน`;
  if (f.name.value.trim().length < 2) errs.name = 'กรุณากรอกชื่อ–สกุล';
  if (!/^[0-9]{10}$/.test(f.sid.value.trim())) errs.sid = 'รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก';
  return errs;
}

function showErrors(errs) {
  let first = null;
  for (const key of Object.keys(f)) {
    const msg = errs[key] || '';
    document.getElementById('err-' + key).textContent = msg;
    f[key].setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg && !first) first = f[key];
  }
  if (first) first.focus();
}

function showResult(text, ok) {
  result.hidden = false;
  result.className = 'alert ' + (ok ? 'alert-ok' : 'alert-error');
  result.replaceChildren(text);
  if (ok) {
    const a = App.el('a', '', ' ดูการจองของฉัน');
    a.href = 'my-bookings.html';
    result.append(a);
  }
  result.focus();   // ให้โปรแกรมอ่านหน้าจออ่านผลทันที
}

// HTML validation (required, pattern, min, max) ทำงานก่อน แล้วเรามาแทนที่กล่องข้อความของเบราว์เซอร์
// ด้วยข้อความภาษาไทยของเรา (invalid ไม่ bubble จึงต้องฟังแบบ capture)
form.addEventListener('invalid', ev => {
  ev.preventDefault();
  const errs = validate();
  const key = Object.keys(f).find(k => f[k] === ev.target);
  if (key && !errs[key]) errs[key] = ev.target.validationMessage;
  showErrors(errs);
}, true);

// จำนวนคนสูงสุดตามความจุของห้องที่เลือก
function syncMaxPeople() {
  const room = currentRoom();
  if (room) f.people.max = room.capacity;
}

form.addEventListener('submit', ev => {
  ev.preventDefault();
  result.hidden = true;
  const errs = validate();
  showErrors(errs);
  if (Object.keys(errs).length) return;

  const nb = {
    id: 'u' + Date.now(), roomId: f.room.value, date: f.date.value,
    start: f.start.value, end: f.end.value, people: Number(f.people.value),
    by: f.name.value.trim(), studentId: f.sid.value.trim()
  };
  // F5: ตรวจจองซ้อนกับทั้ง JSON และ localStorage แล้วบอกเหตุผล
  const c = App.findConflict(data, nb);
  if (c) {
    showResult(`จองไม่ได้: ${App.label(currentRoom())} วันที่ ${App.fmtDate(nb.date)} เวลา ${nb.start}–${nb.end} ซ้อนกับการจองเดิมช่วง ${c.start}–${c.end} กรุณาเลือกช่วงเวลาที่ว่าง`, false);
    return;
  }
  const mine = App.getMine();
  mine.push(nb);
  if (!App.saveMine(mine)) {
    showResult('บันทึกการจองไม่สำเร็จ เบราว์เซอร์อาจปิดการเก็บข้อมูล (เช่นโหมดส่วนตัว) กรุณาเปิดการเก็บข้อมูลแล้วลองใหม่', false);
    return;
  }
  showResult(`จองสำเร็จ: ${App.label(currentRoom())} วันที่ ${App.fmtDate(nb.date)} เวลา ${nb.start}–${nb.end} น.`, true);
  f.start.value = ''; f.end.value = ''; f.people.value = '';
  renderSlots();
});

// คลิกช่องว่างในตาราง เพื่อเลือกเวลา (event delegation)
slotGrid.addEventListener('click', ev => {
  const btn = ev.target.closest('button[data-hour]');
  if (!btn) return;
  const h = Number(btn.dataset.hour);
  const startMin = f.start.value ? App.toMin(f.start.value) / 60 : null;
  const endMin = f.end.value ? App.toMin(f.end.value) / 60 : null;
  // ถ้าเลือกช่องถัดจากช่วงที่เลือกอยู่ ให้ต่อช่วงออกไป ไม่เช่นนั้นเริ่มเลือกใหม่
  if (startMin !== null && endMin === h && h + 1 - startMin <= App.MAX_HOURS) f.end.value = App.hh(h + 1);
  else { f.start.value = App.hh(h); f.end.value = App.hh(h + 1); }
  renderSlots();
  slotGrid.querySelector(`button[data-hour="${h}"]`)?.focus();   // renderSlots สร้างปุ่มใหม่ ต้องคืน focus
});

[f.room, f.date, f.start, f.end].forEach(el => el.addEventListener('change', renderSlots));
f.room.addEventListener('change', syncMaxPeople);

(async () => {
  try {
    data = await App.loadData();
    fillOptions();
    const p = new URLSearchParams(location.search);
    const today = App.todayStr();
    f.date.min = today;
    f.date.value = p.get('date') >= today ? p.get('date') : today;
    if (data.rooms.some(r => r.id === p.get('room'))) f.room.value = p.get('room');
    syncMaxPeople();
    renderSlots();
  } catch (e) {
    App.showError(errBox, App.loadErrorMsg(e));
    form.hidden = true;
  }
})();
