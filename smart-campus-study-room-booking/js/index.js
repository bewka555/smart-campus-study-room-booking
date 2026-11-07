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

function roomCard(r) {
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

  const status = App.el('span', 'status', 'ห้องว่าง');
  status.prepend(App.icon('check'));
  const link = App.el('a', 'btn btn-sm', 'จองเลย');
  link.href = `booking.html?room=${r.id}`;
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

// สถิติห้องที่ถูกจองมากที่สุด: การ์ดสรุป + แผนภูมิแท่ง
function renderStats(data) {
  const counts = countByRoom(data);
  const top = counts[0];
  document.getElementById('sum-total').textContent = data.rooms.length;
  document.getElementById('sum-top').textContent = top.n > 0 ? App.label(top.room) : '–';

  const list = document.getElementById('stats');
  list.replaceChildren();
  counts.forEach(c => {
    // อันดับ: ห้องที่จองเท่ากันได้อันดับเท่ากัน
    const rank = 1 + counts.filter(x => x.n > c.n).length;
    const isTop = c.n > 0 && c.n === top.n;
    const li = App.el('li', 'tile' + (isTop ? ' tile-top' : ''));
    const head = App.el('div', 'tile-head');
    head.append(App.el('span', 'rank', 'อันดับ ' + rank));
    if (isTop) head.append(App.el('span', 'top-badge', 'จองมากที่สุด'));
    const meta = App.el('p', 'meta');
    const where = App.el('span', 'meta-item', `${c.room.building} ชั้น ${c.room.floor}`);
    where.prepend(App.icon('building'));
    meta.append(where);
    li.append(head, App.el('h3', '', c.room.name), meta, App.el('p', 'tile-count', c.n + ' ครั้ง'));
    list.append(li);
  });
}

(async () => {
  try {
    const data = await App.loadData();
    renderStats(data);
    renderNow(data);
    setInterval(() => renderNow(data), 60000);   // อัปเดตทุกนาที
  } catch (e) {
    App.showError(errBox, App.loadErrorMsg(e));
  }
})();
