'use strict';
const errBox = document.getElementById('error-box');
App.imgFallback(document.getElementById('hero-img'));

const freeList = document.getElementById('free-now');
const freeSearchForm = document.getElementById('free-filter-form');
const freeSearchInput = document.getElementById('free-search');
const freeFloorSelect = document.getElementById('free-floor');
const freeResult = document.getElementById('free-result');
let appliedFreeQuery = '';
let appliedFreeQueryLabel = '';
let dashboardData;

// นับจำนวนการจองต่อห้อง (JSON + localStorage) เรียงมากไปน้อย
function countByRoom(data) {
  const all = App.allBookings(data);
  return data.rooms.map(r => ({ room: r, n: all.filter(b => b.roomId === r.id).length }))
    .sort((a, b) => b.n - a.n);
}

// สร้าง snapshot ของวันและเวลาจาก Date ชุดเดียวกัน เพื่อป้องกันการเปลี่ยนวันคาบเกี่ยวเที่ยงคืน
function getAvailabilitySnapshot(data, now = new Date()) {
  const minute = now.getHours() * 60 + now.getMinutes();
  const today = `${now.getFullYear()}-${App.pad(now.getMonth() + 1)}-${App.pad(now.getDate())}`;
  const open = minute >= App.OPEN * 60 && minute < App.CLOSE * 60;
  const activeRoomIds = new Set();

  if (open) {
    App.allBookings(data).forEach(booking => {
      if (booking.date !== today || !booking.roomId || !booking.start || !booking.end) return;
      if (App.toMin(booking.start) <= minute && minute < App.toMin(booking.end)) {
        activeRoomIds.add(booking.roomId);
      }
    });
  }

  const busy = open ? data.rooms.filter(room => activeRoomIds.has(room.id)) : [];
  const free = open ? data.rooms.filter(room => !activeRoomIds.has(room.id)) : [];
  return { now, today, minute, open, free, busy, total: data.rooms.length };
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
  const tv = App.el('span', 'meta-item', hasTv ? 'มีทีวี' : 'ไม่มีทีวี');
  meta.append(people, tv);

  const status = App.el('span', 'status', statusText);
  const link = App.el('a', 'btn btn-sm', 'จองห้องนี้');
  link.href = `booking.html?room=${encodeURIComponent(r.id)}` + (date ? `&date=${encodeURIComponent(date)}` : '');
  link.setAttribute('aria-label', `จอง ${App.label(r)}`);
  const foot = App.el('div', 'card-foot');
  foot.append(status, link);

  const body = App.el('div', 'card-body');
  body.append(App.el('h3', '', r.name), meta, foot);
  li.append(thumb, body);
  return li;
}

function renderClock(now) {
  document.getElementById('now-clock').textContent = now.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  document.getElementById('now-date').textContent = now.toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('availability-updated').textContent = now.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }) + ' น.';
  document.getElementById('sum-time').textContent = now.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit'
  }) + ' น.';
}

function updateAvailabilityStats(snapshot) {
  const { open, free, busy, total } = snapshot;
  const freeCount = open ? free.length : 0;
  const busyCount = open ? busy.length : 0;
  const percent = open && total ? Math.round(freeCount / total * 100) : 0;

  document.getElementById('availability-free').textContent = freeCount;
  document.getElementById('availability-busy').textContent = busyCount;
  document.getElementById('availability-total').textContent = total;
  document.getElementById('availability-percent').textContent = percent + '%';
  document.getElementById('availability-progress').setAttribute('aria-valuenow', String(percent));
  document.getElementById('availability-progress-fill').style.width = percent + '%';
  document.getElementById('sum-free').textContent = freeCount;

  const serviceStatus = document.getElementById('service-status');
  serviceStatus.classList.toggle('service-open', open);
  serviceStatus.classList.toggle('service-closed', !open);
  serviceStatus.textContent = open ? 'เปิดให้บริการอยู่' : 'ปิดให้บริการ';

  document.getElementById('availability-note').textContent = open
    ? `ขณะนี้มีห้องว่าง ${freeCount} จาก ${total} ห้อง ระบบอ้างอิงรายการจองของวันนี้และอัปเดตอัตโนมัติ`
    : `ขณะนี้อยู่นอกเวลาให้บริการ (${App.hh(App.OPEN)}–${App.hh(App.CLOSE)} น.) ห้องจะพร้อมให้จองอีกครั้งในเวลาเปิดบริการ`;
}

function renderFreeRooms(snapshot) {
  const { open, free, today } = snapshot;
  const floor = freeFloorSelect.value;
  const filtered = free.filter(room => {
    const searchable = `${room.name} ${room.building || ''} ${room.floor} ${room.capacity} ${room.capacityMin} ${(room.equipment || []).join(' ')}`.toLocaleLowerCase('th');
    return (!appliedFreeQuery || searchable.includes(appliedFreeQuery)) &&
      (floor === 'all' || String(room.floor) === floor);
  });

  freeList.replaceChildren();
  freeList.setAttribute('aria-busy', 'false');
  if (!open) {
    freeList.append(App.el('li', 'empty availability-empty', `ขณะนี้อยู่นอกเวลาให้บริการ (${App.hh(App.OPEN)}–${App.hh(App.CLOSE)} น.)`));
    freeResult.textContent = 'ระบบจะแสดงห้องว่างอีกครั้งเมื่อถึงเวลาเปิดให้บริการ';
    return;
  }

  if (filtered.length) {
    filtered.forEach(room => freeList.append(roomCard(room, 'ว่างอยู่ตอนนี้', today)));
    const filters = [];
    if (appliedFreeQuery) filters.push(`คำค้นหา “${appliedFreeQueryLabel}”`);
    if (floor !== 'all') filters.push(`ชั้น ${floor}`);
    freeResult.textContent = filters.length
      ? `พบห้องว่าง ${filtered.length} ห้อง จาก${filters.join(' และ ')}`
      : `พบห้องว่าง ${filtered.length} ห้องจากทั้งหมด ${snapshot.total} ห้อง`;
  } else if (free.length === 0) {
    freeList.append(App.el('li', 'empty availability-empty', 'ขณะนี้ทุกห้องมีผู้ใช้งานหรือถูกจองอยู่'));
    freeResult.textContent = 'ยังไม่มีห้องว่างในเวลานี้ ลองตรวจสอบอีกครั้งภายหลัง';
  } else {
    freeList.append(App.el('li', 'empty availability-empty', 'ไม่พบห้องว่างที่ตรงกับตัวกรอง'));
    freeResult.textContent = 'ไม่พบห้องที่ตรงกับเงื่อนไข ลองเปลี่ยนคำค้นหาหรือเลือกทุกชั้น';
  }
}

function renderNow(data = dashboardData) {
  if (!data) return;
  const now = new Date();
  const snapshot = getAvailabilitySnapshot(data, now);
  renderClock(now);
  updateAvailabilityStats(snapshot);
  renderFreeRooms(snapshot);
}

function populateFloorFilter(data) {
  const floors = [...new Set(data.rooms.map(room => String(room.floor)))].sort((a, b) => Number(a) - Number(b));
  floors.forEach(floor => {
    const option = App.el('option', '', `ชั้น ${floor}`);
    option.value = floor;
    freeFloorSelect.append(option);
  });
}

function initAvailabilityControls(data) {
  populateFloorFilter(data);

  freeSearchForm.addEventListener('submit', event => {
    event.preventDefault();
    appliedFreeQueryLabel = freeSearchInput.value.trim();
    appliedFreeQuery = appliedFreeQueryLabel.toLocaleLowerCase('th');
    renderNow(data);
  });

  freeFloorSelect.addEventListener('change', () => renderNow(data));
  document.getElementById('clear-free-filter').addEventListener('click', () => {
    freeSearchInput.value = '';
    appliedFreeQuery = '';
    appliedFreeQueryLabel = '';
    freeFloorSelect.value = 'all';
    renderNow(data);
    freeSearchInput.focus();
  });

  document.getElementById('refresh-free-now').addEventListener('click', event => {
    const button = event.currentTarget;
    button.disabled = true;
    renderNow(data);
    button.disabled = false;
  });
}

// ฟีเจอร์เสริม: สถิติห้องที่ถูกจองมากที่สุด (แสดงในการ์ดสรุปด้านบน)
function renderStats(data) {
  const top = countByRoom(data)[0];
  document.getElementById('sum-total').textContent = data.rooms.length;
  document.getElementById('sum-top').textContent = top && top.n > 0 ? App.label(top.room) : '–';
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
    dashboardData = await App.loadData();
    renderStats(dashboardData);
    renderRecommend(dashboardData);
    initAvailabilityControls(dashboardData);
    renderNow(dashboardData);

    // อัปเดตเวลาและสถานะทุก 30 วินาที รวมถึงเมื่อกลับมาเปิดแท็บอีกครั้ง
    const timer = window.setInterval(() => {
      renderNow(dashboardData);
      renderRecommend(dashboardData);
    }, 30000);
    window.addEventListener('storage', event => {
      if (event.key === App.KEY || event.key === null) renderNow(dashboardData);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        renderNow(dashboardData);
        renderRecommend(dashboardData);
      }
    });
    window.addEventListener('focus', () => renderNow(dashboardData));
    window.addEventListener('beforeunload', () => window.clearInterval(timer), { once: true });
  } catch (e) {
    freeList.setAttribute('aria-busy', 'false');
    App.showError(errBox, App.loadErrorMsg(e));
  }
})();
