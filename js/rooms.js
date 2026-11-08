'use strict';
const errBox = document.getElementById('error-box');
const grid = document.getElementById('room-list');
const minCap = document.getElementById('min-capacity');
const equipBox = document.getElementById('equipment-filters');
const countEl = document.getElementById('result-count');
let rooms = [];

// F1: สร้างการ์ดห้องด้วย DOM
function card(r) {
  const li = App.el('li', 'card');
  const img = document.createElement('img');
  img.src = r.image;
  img.alt = `ภาพห้อง ${r.name} ชั้น ${r.floor} ${r.building}`;
  img.loading = 'lazy';
  App.imgFallback(img);

  const body = App.el('div', 'card-body');
  body.append(
    App.el('h2', '', App.label(r)),
    App.el('p', '', `${r.building} ชั้น ${r.floor}`),
    App.el('p', '', `ความจุ ${r.capacityMin}–${r.capacity} คน · จองได้ครั้งละไม่เกิน ${r.maxHours} ชม.`)
  );
  const chips = App.el('ul', 'chips');
  r.equipment.forEach(e => chips.append(App.el('li', '', e)));
  const link = App.el('a', 'btn', 'จองห้องนี้');
  link.href = `booking.html?room=${r.id}`;
  link.setAttribute('aria-label', `จอง ${App.label(r)}`);
  body.append(chips, link);
  li.append(img, body);
  return li;
}

// F2: กรองตามความจุขั้นต่ำและอุปกรณ์ (ต้องมีครบทุกอย่างที่ติ๊ก)
function render() {
  const min = Number(minCap.value) || 0;
  const checked = [...equipBox.querySelectorAll('input:checked')].map(i => i.value);
  const result = rooms.filter(r => r.capacity >= min && checked.every(e => r.equipment.includes(e)));
  grid.replaceChildren(...result.map(card));
  countEl.textContent = result.length ? `พบ ${result.length} ห้อง` : 'ไม่พบห้องที่ตรงเงื่อนไข ลองลดจำนวนคนหรืออุปกรณ์ที่ต้องการ';
}

function buildEquipFilters() {
  const all = [...new Set(rooms.flatMap(r => r.equipment))];
  for (const e of all) {
    const label = App.el('label', 'check');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = e;
    label.append(input, ' ' + e);
    equipBox.append(label);
  }
}

(async () => {
  try {
    rooms = (await App.loadData()).rooms;
    buildEquipFilters();
    render();
    document.querySelector('.filters').addEventListener('submit', ev => ev.preventDefault());
    minCap.addEventListener('input', render);
    equipBox.addEventListener('change', render);
    document.getElementById('reset').addEventListener('click', () => {
      minCap.value = '';
      equipBox.querySelectorAll('input').forEach(i => { i.checked = false; });
      render();
    });
  } catch (e) {
    App.showError(errBox, App.loadErrorMsg(e));
  }
})();
