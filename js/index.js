'use strict';
const errBox = document.getElementById('error-box');
App.imgFallback(document.getElementById('hero-img'));

// นับจำนวนการจองต่อห้อง (JSON + localStorage) เรียงมากไปน้อย
function countByRoom(data) {
  const all = App.allBookings(data);
  return data.rooms.map(r => ({ room: r, n: all.filter(b => b.roomId === r.id).length }))
    .sort((a, b) => b.n - a.n);
}

// หาห้องที่ว่าง "ตอนนี้" ตามเวลาปัจจุบัน
function getFreeNow(data) {
  const now = App.nowMin();
  const open = now >= App.OPEN * 60 && now < App.CLOSE * 60;
  const today = App.todayStr();
  const all = App.allBookings(data);
  const free = open ? data.rooms.filter(r => !all.some(b =>
    b.roomId === r.id && b.date === today && App.toMin(b.start) <= now && now < App.toMin(b.end))) : [];
  return { open, free };
}

function roomCard(r, statusText = 'ห้องว่าง', date = '') {
  const li = App.el('li', 'card');
  const thumb = App.el('div', 'thumb');
  const img = document.createElement('img');
  img.src = r.image;
  img.alt = `ภาพห้อง ${r.name} ชั้น ${r.floor}`;
  img.loading = 'lazy';
  App.imgFallback(img);
  thumb.append(img, App.el('span', 'floor', 'ชั้น ' + r.floor));

  const hasTv = r.equipment.includes('ทีวี');
  const meta = App.el('p', 'meta');
  const people = App.el('span', 'meta-item', `${r.capacityMin}–${r.capacity} คน`);
  people.prepend(App.icon('people'));
  const tv = App.el('span', 'meta-item', hasTv ? 'มีทีวี' : 'ไม่มีทีวี');
  tv.prepend(App.icon('tv'));
  meta.append(people, tv);

  const status = App.el('span', 'status', statusText);
  status.prepend(App.icon('check'));
  const link = App.el('a', 'btn btn-sm', 'จองเลย');
  link.href = `booking.html?room=${r.id}` + (date ? `&date=${date}` : '');
  link.setAttribute('aria-label', `จอง ${App.label(r)}`);
  const foot = App.el('div', 'card-foot');
  foot.append(status, link);

  const body = App.el('div', 'card-body');
  body.append(App.el('h3', '', r.name), meta, foot);
  li.append(thumb, body);
  return li;
}

function renderNow(data) {
  const { open, free } = getFreeNow(data);
  const t = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('sum-time').textContent = t + ' น.';
  document.getElementById('sum-free').textContent = free.length;
  const list = document.getElementById('free-now');
  list.replaceChildren();
  if (!open) {
    list.append(App.el('li', 'empty', `ขณะนี้อยู่นอกเวลาให้บริการ (${App.hh(App.OPEN)}–${App.hh(App.CLOSE)} น.)`));
  } else if (free.length === 0) {
    list.append(App.el('li', 'empty', 'ตอนนี้ทุกห้องมีผู้ใช้งาน ลองดูช่วงเวลาถัดไปในหน้าจอง'));
  } else {
    free.forEach(r => list.append(roomCard(r)));
  }
}

// ฟีเจอร์เสริม: สถิติห้องที่ถูกจองมากที่สุด (แสดงในการ์ดสรุปด้านบน)
function renderStats(data) {
  const top = countByRoom(data)[0];
  document.getElementById('sum-total').textContent = data.rooms.length;
  document.getElementById('sum-top').textContent = top.n > 0 ? App.label(top.room) : '–';
}

// แนะนำห้อง: เรียงตามจำนวนชั่วโมงที่ยังว่างมากที่สุด
// ถ้าเลยเวลาปิดแล้วจะแนะนำของวันพรุ่งนี้
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${App.pad(d.getMonth() + 1)}-${App.pad(d.getDate())}`;
}

function freeHours(data, room, date, fromHour) {
  const all = App.allBookings(data).filter(b => b.roomId === room.id && b.date === date);
  let n = 0;
  for (let h = fromHour; h < App.CLOSE; h++) {
    const slot = { start: App.hh(h), end: App.hh(h + 1) };
    if (!all.some(b => App.overlaps(b, slot))) n++;
  }
  return n;
}

function renderRecommend(data) {
  const todayStr = App.todayStr();
  const nowMin = App.nowMin();
  const afterClose = nowMin >= App.CLOSE * 60;
  const date = afterClose ? addDays(todayStr, 1) : todayStr;
  const fromHour = afterClose ? App.OPEN : Math.max(App.OPEN, Math.ceil(nowMin / 60));
  const dayText = afterClose ? 'พรุ่งนี้' : 'วันนี้';

  document.getElementById('rec-note').textContent =
    `ห้องที่ยังมีช่วงเวลาว่างมากที่สุด${dayText} (เรียงจากว่างมากไปน้อย)`;

  const picks = data.rooms
    .map(r => ({ room: r, free: freeHours(data, r, date, fromHour) }))
    .filter(x => x.free > 0)
    .sort((a, b) => b.free - a.free || b.room.capacity - a.room.capacity)
    .slice(0, 3);

  const list = document.getElementById('recommend');
  list.replaceChildren();
  if (picks.length === 0) {
    list.append(App.el('li', 'empty', `${dayText}ไม่มีห้องว่างเหลือ ลองเลือกวันอื่นในหน้าจอง`));
    return;
  }
  picks.forEach(p => list.append(roomCard(p.room, `ว่าง ${p.free} ชั่วโมง${dayText}`, date)));
}

(async () => {
  try {
    const data = await App.loadData();
    renderStats(data);
    renderRecommend(data);
    renderNow(data);
    setInterval(() => {
      const a = document.activeElement;
      if (a && a.closest && a.closest('#free-now, #recommend')) return;   // ไม่รีเฟรชขณะผู้ใช้โฟกัสอยู่ในรายการ
      renderNow(data); renderRecommend(data);
    }, 60000);   // อัปเดตทุกนาที
  } catch (e) {
    App.showError(errBox, App.loadErrorMsg(e));
  }
})();
