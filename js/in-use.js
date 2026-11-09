'use strict';
const errBox = document.getElementById('error-box');
const list = document.getElementById('active-room-list');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptyDescription = document.getElementById('empty-description');
const searchInput = document.getElementById('room-search');
const floorFilter = document.getElementById('floor-filter');
const resultCount = document.getElementById('result-count');
const searchForm = document.getElementById('room-search-form');
const searchFeedback = document.getElementById('search-help');
let appliedQuery = '';
let appliedQueryLabel = '';
let data;
let timerId;

function isServiceOpen(now = new Date()) {
  const minute = now.getHours() * 60 + now.getMinutes();
  return minute >= App.OPEN * 60 && minute < App.CLOSE * 60;
}

function getActiveBookings(now = new Date()) {
  const today = App.todayStr();
  const minute = now.getHours() * 60 + now.getMinutes();
  return App.allBookings(data)
    .filter(booking => booking.date === today &&
      App.toMin(booking.start) <= minute && minute < App.toMin(booking.end))
    .map(booking => ({ booking, room: data.rooms.find(room => room.id === booking.roomId) }))
    .filter(item => item.room)
    .sort((a, b) => a.room.floor - b.room.floor || a.room.name.localeCompare(b.room.name, 'th'));
}

function formatRemaining(end) {
  const remaining = Math.max(0, App.toMin(end) - App.nowMin());
  const hours = Math.floor(remaining / 60);
  const minutes = remaining % 60;
  if (hours && minutes) return `เหลือ ${hours} ชม. ${minutes} นาที`;
  if (hours) return `เหลือ ${hours} ชั่วโมง`;
  return `เหลือ ${minutes} นาที`;
}

function makeRoomCard(item, now) {
  const { booking, room } = item;
  const card = App.el('li', 'card live-room-card');
  const thumb = App.el('div', 'thumb live-thumb');
  const img = document.createElement('img');
  img.src = room.image;
  img.alt = `ภาพ ${room.name} ชั้น ${room.floor}`;
  img.loading = 'lazy';
  App.imgFallback(img);
  const floor = App.el('span', 'floor', `ชั้น ${room.floor}`);
  const activeLabel = App.el('span', 'active-photo-label');
  activeLabel.append(App.el('span', 'live-dot'), document.createTextNode(' กำลังใช้งาน'));
  thumb.append(img, floor, activeLabel);

  const body = App.el('div', 'card-body live-card-body');
  const titleRow = App.el('div', 'live-title-row');
  titleRow.append(App.el('h3', '', room.name), App.el('span', 'status status-busy', 'ไม่ว่าง'));
  const detail = App.el('p', 'live-location', `${room.building} · ชั้น ${room.floor}`);
  const schedule = App.el('div', 'live-schedule');
  const timeBlock = App.el('div', 'live-time-block');
  timeBlock.append(App.el('span', 'live-field-label', 'เวลาใช้งาน'), App.el('strong', '', `${booking.start} – ${booking.end} น.`));
  const remainingBlock = App.el('div', 'live-time-block');
  remainingBlock.append(App.el('span', 'live-field-label', 'เวลาที่เหลือ'), App.el('strong', 'remaining-time', formatRemaining(booking.end)));
  schedule.append(timeBlock, remainingBlock);

  const duration = Math.max(1, App.toMin(booking.end) - App.toMin(booking.start));
  const elapsed = Math.min(duration, Math.max(0, now.getHours() * 60 + now.getMinutes() - App.toMin(booking.start)));
  const progress = App.el('div', 'usage-progress');
  progress.setAttribute('role', 'progressbar');
  progress.setAttribute('aria-label', `ใช้งานห้องไปแล้ว ${Math.round(elapsed / duration * 100)} เปอร์เซ็นต์`);
  progress.setAttribute('aria-valuemin', '0');
  progress.setAttribute('aria-valuemax', '100');
  progress.setAttribute('aria-valuenow', String(Math.round(elapsed / duration * 100)));
  const progressTrack = App.el('span', 'usage-progress-fill');
  progressTrack.style.width = `${Math.round(elapsed / duration * 100)}%`;
  progress.append(progressTrack);

  const meta = App.el('div', 'live-booking-meta');
  const people = App.el('span', 'meta-item', `${booking.people || 'ไม่ระบุ'} คน`);
  people.prepend(App.icon('people'));
  const groupName = App.el('span', 'meta-item', booking.by || 'ไม่ระบุชื่อผู้จอง');
  groupName.prepend(App.icon('users'));
  meta.append(people, groupName);

  const actions = App.el('div', 'card-foot live-card-foot');
  const link = App.el('a', 'btn btn-sm', 'ดูตารางเวลาห้อง');
  link.href = `booking.html?room=${encodeURIComponent(room.id)}&date=${encodeURIComponent(App.todayStr())}`;
  link.setAttribute('aria-label', `ดูตารางเวลาของ ${App.label(room)}`);
  actions.append(link);
  body.append(titleRow, detail, schedule, progress, meta, actions);
  card.append(thumb, body);
  return card;
}

function updateClock(now = new Date()) {
  document.getElementById('current-clock').textContent = now.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  document.getElementById('current-date').textContent = now.toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('updated-at').textContent = now.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
}

function render() {
  const now = new Date();
  updateClock(now);
  const open = isServiceOpen(now);
  const active = getActiveBookings(now);
  const available = Math.max(0, data.rooms.length - active.length);
  document.getElementById('active-count').textContent = active.length;
  document.getElementById('people-count').textContent = active.reduce((sum, item) => sum + (Number(item.booking.people) || 0), 0);
  document.getElementById('available-count').textContent = available;
  document.getElementById('service-message').textContent = open
    ? 'แสดงเฉพาะรายการจองที่อยู่ในช่วงเวลาปัจจุบัน'
    : `ขณะนี้อยู่นอกเวลาให้บริการ (${App.hh(App.OPEN)}–${App.hh(App.CLOSE)} น.)`;

  const selectedFloor = floorFilter.value;
  const filtered = active.filter(item => {
    const searchable = `${item.room.name} ${item.room.building} ${item.room.floor} ${item.booking.by || ''} ${item.booking.people || ''}`.toLocaleLowerCase('th');
    return (!appliedQuery || searchable.includes(appliedQuery)) &&
      (selectedFloor === 'all' || String(item.room.floor) === selectedFloor);
  });

  list.replaceChildren(...filtered.map(item => makeRoomCard(item, now)));
  list.setAttribute('aria-busy', 'false');
  resultCount.textContent = `${filtered.length} ห้อง`;
  if (!appliedQuery && selectedFloor === 'all') {
    searchFeedback.textContent = `แสดงห้องที่กำลังใช้งานทั้งหมด ${filtered.length} ห้อง`;
  } else {
    const terms = [];
    if (appliedQuery) terms.push(`คำค้นหา “${appliedQueryLabel}”`);
    if (selectedFloor !== 'all') terms.push(`ชั้น ${selectedFloor}`);
    searchFeedback.textContent = filtered.length
      ? `พบ ${filtered.length} ห้อง จาก${terms.join(' และ ')}`
      : `ไม่พบห้องที่ตรงกับ${terms.join(' และ ')} ลองเปลี่ยนคำค้นหาหรือเลือกทุกชั้น`;
  }
  emptyState.hidden = filtered.length > 0;

  if (!open) {
    emptyTitle.textContent = 'ขณะนี้อยู่นอกเวลาให้บริการ';
    emptyDescription.textContent = `Buddy Space เปิดให้บริการเวลา ${App.hh(App.OPEN)}–${App.hh(App.CLOSE)} น. โปรดกลับมาตรวจสอบในช่วงเวลาเปิดให้บริการ`;
  } else if (active.length === 0) {
    emptyTitle.textContent = 'ขณะนี้ยังไม่มีห้องที่กำลังใช้งาน';
    emptyDescription.textContent = 'ทุกห้องยังว่างอยู่ สามารถเลือกดูห้องทั้งหมดหรือจองห้องสำหรับช่วงเวลาที่ต้องการได้';
  } else if (filtered.length === 0) {
    emptyTitle.textContent = 'ไม่พบห้องที่ตรงกับตัวกรอง';
    emptyDescription.textContent = 'ลองเปลี่ยนคำค้นหาหรือเลือกดูทุกชั้นอีกครั้ง';
  }
}

function refresh() {
  if (!data) return;
  list.setAttribute('aria-busy', 'true');
  render();
}

(async () => {
  try {
    data = await App.loadData();
    searchForm.addEventListener('submit', event => {
      event.preventDefault();
      appliedQueryLabel = searchInput.value.trim();
      appliedQuery = appliedQueryLabel.toLocaleLowerCase('th');
      render();
    });
    floorFilter.addEventListener('change', render);
    document.getElementById('refresh-status').addEventListener('click', refresh);
    document.getElementById('clear-filters').addEventListener('click', () => {
      searchInput.value = '';
      appliedQuery = '';
      appliedQueryLabel = '';
      floorFilter.value = 'all';
      render();
      searchInput.focus();
    });
    render();
    timerId = window.setInterval(refresh, 30000);
    window.addEventListener('beforeunload', () => window.clearInterval(timerId), { once: true });
  } catch (error) {
    list.setAttribute('aria-busy', 'false');
    App.showError(errBox, App.loadErrorMsg(error));
  }
})();
