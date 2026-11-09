'use strict';
const dateInput = document.getElementById('schedule-date');
const floorFilter = document.getElementById('floor-filter');
const head = document.getElementById('schedule-head');
const body = document.getElementById('schedule-body');
const feedback = document.getElementById('schedule-feedback');
const errorBox = document.getElementById('error-box');
let data;
function dual(full, short){ const f=document.createElement('span'); f.className='t-full'; f.textContent=full; const m=document.createElement('span'); m.className='t-short'; m.setAttribute('aria-hidden','true'); m.textContent=short; return [f,m]; }
function bookingFor(roomId, date, hour) {
  const slot = { start: App.hh(hour), end: App.hh(hour+1) };
  return App.allBookings(data).find(b => b.roomId === roomId && b.date === date && App.overlaps(b, slot));
}
function render() {
  const date = dateInput.value;
  if (!date) return;
  const rooms = data.rooms.filter(r => floorFilter.value === 'all' || String(r.floor) === floorFilter.value)
    .sort((a,b) => a.floor-b.floor || a.name.localeCompare(b.name,'th'));
  const bookings = App.allBookings(data).filter(b => b.date === date);
  const busy = new Set();
  bookings.forEach(b => { for(let h=App.toMin(b.start)/60; h<App.toMin(b.end)/60; h++) busy.add(`${b.roomId}-${h}`); });
  const total = rooms.length * (App.CLOSE-App.OPEN);
  const occupied = [...busy].filter(key => rooms.some(r => key.startsWith(r.id+'-'))).length;
  document.getElementById('schedule-date-label').textContent = App.fmtDate(date);
  document.getElementById('schedule-summary-text').textContent = ` ${rooms.length} ห้อง · มีการจอง ${occupied} จาก ${total} ช่วงเวลา · ว่าง ${total-occupied} ช่วงเวลา`;
  document.getElementById('book-selected-date').href = `booking.html?date=${encodeURIComponent(date)}`;
  head.replaceChildren();
  const trh = document.createElement('tr');
  const timeTh = App.el('th','schedule-time-col','เวลา'); timeTh.scope='col'; trh.append(timeTh);
  rooms.forEach(room => { const th=App.el('th',''); th.scope='col'; const n=room.name.match(/\d+$/); th.append(...dual(`${room.name} (ชั้น ${room.floor})`, `${n?n[0]:room.name}`)); const fl=App.el('small','t-short',`ชั้น ${room.floor}`); fl.setAttribute('aria-hidden','true'); th.append(fl); th.title=`${room.name} (ชั้น ${room.floor})`; trh.append(th); });
  head.append(trh);
  body.replaceChildren();
  const now = new Date();
  for(let h=App.OPEN; h<App.CLOSE; h++) {
    const tr=document.createElement('tr'); const th=App.el('th','schedule-time-col'); th.append(...dual(`${App.hh(h)}–${App.hh(h+1)}`, `${App.hh(h)}`)); th.scope='row'; tr.append(th);
    rooms.forEach(room => {
      const td=document.createElement('td'); const hit=bookingFor(room.id,date,h);
      const past=date < App.todayStr() || (date === App.todayStr() && h*60 < now.getHours()*60+now.getMinutes());
      const cell=document.createElement('a'); cell.className='schedule-cell';
      if(hit) {
        cell.classList.add('schedule-busy'); cell.href=`booking.html?room=${encodeURIComponent(room.id)}&date=${encodeURIComponent(date)}`;
        cell.append(...dual('ไม่ว่าง','เต็ม'));
        cell.setAttribute('aria-label',`${room.name} ${App.hh(h)} ไม่ว่าง`);
      } else if(past) {
        cell.classList.add('schedule-past'); cell.href=`booking.html?room=${encodeURIComponent(room.id)}&date=${encodeURIComponent(date)}`;
        cell.append(...dual('ผ่านเวลาแล้ว','ผ่าน')); cell.setAttribute('aria-label',`${room.name} ${App.hh(h)} ผ่านเวลาแล้ว`);
      } else {
        cell.classList.add('schedule-free'); cell.href=`booking.html?room=${encodeURIComponent(room.id)}&date=${encodeURIComponent(date)}`;
        cell.append(...dual('ว่าง','ว่าง')); cell.setAttribute('aria-label',`จอง ${room.name} วันที่ ${App.fmtDate(date)} เวลา ${App.hh(h)} ถึง ${App.hh(h+1)}`);
      }
      td.append(cell); tr.append(td);
    }); body.append(tr);
  }
  feedback.textContent = rooms.length ? 'กดช่องสีเขียวเพื่อไปหน้าจองห้อง โดยระบบจะเลือกห้องและวันที่ให้ล่วงหน้า จากนั้นเลือกเวลาอีกครั้ง' : 'ไม่พบห้องในชั้นที่เลือก';
}
dateInput.addEventListener('change',render); floorFilter.addEventListener('change',render);
(async()=>{try{data=await App.loadData();dateInput.min=App.todayStr();dateInput.value=App.todayStr();render();}catch(e){App.showError(errorBox,App.loadErrorMsg(e));}})();
