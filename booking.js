const DATA_URL = "data/rooms.json";
const STORAGE_KEY = "studyRoomBookings"; 
const OPEN_HOUR = 8;
const CLOSE_HOUR = 20;
const MAX_HOURS = 2;
const STUDENT_ID_PATTERN = /^[A-Za-z0-9]{8,12}$/;

const filterForm = document.getElementById("filter-form");
const capacityFilter = document.getElementById("filter-capacity");
const equipmentFilters = document.getElementById("equipment-filters");
const roomStatus = document.getElementById("room-status");
const roomGrid = document.getElementById("room-grid");
const dateInput = document.getElementById("booking-date");
const scheduleMessage = document.getElementById("schedule-message");
const slotGrid = document.getElementById("slot-grid");
const chosenRoom = document.getElementById("chosen-room");
const bookingForm = document.getElementById("booking-form");
const startSelect = document.getElementById("start-time");
const endSelect = document.getElementById("end-time");
const peopleInput = document.getElementById("people");
const peopleHint = document.getElementById("people-hint");
const nameInput = document.getElementById("student-name");
const idInput = document.getElementById("student-id");
const formErrors = document.getElementById("form-errors");
const formSuccess = document.getElementById("form-success");

const fieldControls = [dateInput, startSelect, endSelect, peopleInput, nameInput, idInput];

let rooms = [];
let jsonBookings = [];
let selectedRoomId = null;

function pad(n) {
  return String(n).padStart(2, "0");
}

function toDateString(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayString() {
  return toDateString(new Date());
}

function defaultDate() {
  const d = new Date();
  if (d.getHours() >= CLOSE_HOUR) {
    d.setDate(d.getDate() + 1); 
  }
  return toDateString(d);
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("th-TH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
function loadLocalBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((b) => b && b.roomId && b.date && b.start && b.end);
  } catch (err) {
    console.warn("อ่าน localStorage ไม่สำเร็จ", err);
    return [];
  }
}

function saveLocalBooking(booking) {
  try {
    const list = loadLocalBookings();
    list.push(booking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (err) {
    console.error("บันทึก localStorage ไม่สำเร็จ", err);
    return false;
  }
}

function allBookings() {
  return [...jsonBookings, ...loadLocalBookings()];
}
function findConflict(bookings, roomId, date, startMin, endMin) {
  return bookings.find(
    (b) =>
      b.roomId === roomId &&
      b.date === date &&
      startMin < toMinutes(b.end) &&
      endMin > toMinutes(b.start)
  );
}
function getSelectedRoom() {
  return rooms.find((r) => r.id === selectedRoomId);
}
function buildEquipmentFilters() {
  const items = [];
  rooms.forEach((room) => {
    (room.equipment || []).forEach((eq) => {
      if (!items.includes(eq)) items.push(eq);
    });
  });
  items.forEach((eq, i) => {
    const wrap = document.createElement("div");
    wrap.className = "check-item";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `eq-${i}`;
    input.name = "equipment";
    input.value = eq;
    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = eq;
    wrap.append(input, label);
    equipmentFilters.appendChild(wrap);
  });
}

function getFilteredRooms() {
  const minPeople = Number(capacityFilter.value) || 0;
  const needed = [...equipmentFilters.querySelectorAll("input:checked")].map((i) => i.value);
  return rooms.filter(
    (room) =>
      room.capacityMax >= minPeople &&
      needed.every((eq) => (room.equipment || []).includes(eq))
  );
}
function createRoomCard(room) {
  const isSelected = room.id === selectedRoomId;
  const card = document.createElement("article");
  card.className = "room-card" + (isSelected ? " is-selected" : "");

  const title = document.createElement("h3");
  title.textContent = room.name;

  const meta = document.createElement("p");
  meta.className = "room-meta";
  meta.textContent = `ชั้น ${room.floor} · รองรับ ${room.capacityMin}–${room.capacityMax} คน`;

  const tags = document.createElement("ul");
  tags.className = "tags";
  tags.setAttribute("aria-label", `อุปกรณ์ใน${room.name}`);
  (room.equipment || []).forEach((eq) => {
    const li = document.createElement("li");
    li.textContent = eq;
    tags.appendChild(li);
  });

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-secondary";
  button.dataset.roomId = room.id;
  button.setAttribute("aria-pressed", String(isSelected));
  button.textContent = isSelected ? "✓ เลือกอยู่" : `เลือก ${room.name}`;

  card.append(title, meta, tags, button);
  return card;
}

function renderRooms() {
  const list = getFilteredRooms();
  roomGrid.replaceChildren(...list.map(createRoomCard));
  roomStatus.classList.remove("error");
  roomStatus.textContent = list.length
    ? `พบ ${list.length} ห้องจากทั้งหมด ${rooms.length} ห้อง`
    : "ไม่พบห้องที่ตรงกับเงื่อนไข ลองลดจำนวนคนหรือยกเลิกอุปกรณ์บางรายการ";
  if (selectedRoomId && !list.some((r) => r.id === selectedRoomId)) {
    selectedRoomId = null;
    updateRoomDependents();
    renderRooms();
  }
}

function selectRoom(roomId, shouldFocus) {
  selectedRoomId = roomId;
  clearFeedback();
  updateRoomDependents();
  renderRooms();
  renderSchedule();
  if (shouldFocus) {
    const btn = roomGrid.querySelector(`button[data-room-id="${roomId}"]`);
    if (btn) btn.focus();
  }
}

function updateRoomDependents() {
  const room = getSelectedRoom();
  if (room) {
    chosenRoom.textContent = `ห้องที่เลือก: ${room.name} (ชั้น ${room.floor})`;
    peopleInput.max = room.capacityMax;
    peopleHint.textContent = `ไม่เกิน ${room.capacityMax} คน (แนะนำ ${room.capacityMin}–${room.capacityMax} คน)`;
  } else {
    chosenRoom.textContent = "ยังไม่ได้เลือกห้อง";
    peopleInput.removeAttribute("max");
    peopleHint.textContent = "เลือกห้องเพื่อดูความจุ";
  }
}
function getSlotState(bookings, room, date, hour) {
  const startMin = hour * 60;
  const endMin = startMin + 60;
  if (date === todayString() && endMin <= nowMinutes()) return "past";
  return findConflict(bookings, room.id, date, startMin, endMin) ? "busy" : "free";
}

function renderSchedule(focusHour) {
  const room = getSelectedRoom();
  const date = dateInput.value;
  slotGrid.replaceChildren();

  if (!room) {
    scheduleMessage.textContent = "เลือกห้องก่อน เพื่อดูตารางเวลา";
    return;
  }
  if (!date) {
    scheduleMessage.textContent = "เลือกวันที่เพื่อดูตารางเวลา";
    return;
  }

  const bookings = allBookings();
  const startH = startSelect.value ? parseInt(startSelect.value, 10) : NaN;
  const endH = endSelect.value ? parseInt(endSelect.value, 10) : NaN;
  let freeCount = 0;

  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    const state = getSlotState(bookings, room, date, h);
    const label = `${pad(h)}:00–${pad(h + 1)}:00`;
    const li = document.createElement("li");
    const time = document.createElement("span");
    time.className = "slot-time";
    time.textContent = label;
    const stateText = document.createElement("span");
    stateText.className = "slot-state";
    let el;

    if (state === "free") {
      freeCount++;
      const selected = h >= startH && h < endH;
      el = document.createElement("button");
      el.type = "button";
      el.dataset.hour = h;
      el.className = "slot slot-free" + (selected ? " slot-selected" : "");
      stateText.textContent = selected ? "✓ เลือกอยู่" : "✓ ว่าง";
      el.setAttribute("aria-label", `${label} ${selected ? "เลือกอยู่" : "ว่าง กดเพื่อเลือก"}`);
    } else {
      el = document.createElement("div");
      el.className = `slot slot-${state}`;
      stateText.textContent = state === "busy" ? "✕ ไม่ว่าง" : "หมดเวลาแล้ว";
    }

    el.append(time, stateText);
    li.appendChild(el);
    slotGrid.appendChild(li);
  }

  scheduleMessage.textContent = `${room.name} · ${formatDate(date)} · ว่าง ${freeCount} ช่วงจาก ${CLOSE_HOUR - OPEN_HOUR} ช่วง`;

  if (focusHour !== undefined) {
    const btn = slotGrid.querySelector(`button[data-hour="${focusHour}"]`);
    if (btn) btn.focus();
  }
}

function fillTimeOptions(select, fromHour, toHour) {
  select.append(new Option("เลือกเวลา", ""));
  for (let h = fromHour; h <= toHour; h++) {
    select.append(new Option(`${pad(h)}:00`, `${pad(h)}:00`));
  }
}
function validateBooking() {
  const errors = [];
  const room = getSelectedRoom();
  const date = dateInput.value;
  const start = startSelect.value;
  const end = endSelect.value;
  const people = Number(peopleInput.value);
  const name = nameInput.value.trim();
  const studentId = idInput.value.trim();

  if (!room) {
    errors.push({ field: null, message: "กรุณาเลือกห้องจากขั้นตอนที่ 1 ก่อน" });
  }

  if (!date) {
    errors.push({ field: dateInput, message: "กรุณาเลือกวันที่" });
  } else if (date < todayString()) {
    errors.push({ field: dateInput, message: "ไม่สามารถจองย้อนหลังได้ กรุณาเลือกวันนี้หรือวันถัดไป" });
  }

  let startMin = null;
  let endMin = null;
  if (!start) errors.push({ field: startSelect, message: "กรุณาเลือกเวลาเริ่ม" });
  if (!end) errors.push({ field: endSelect, message: "กรุณาเลือกเวลาสิ้นสุด" });
  if (start && end) {
    startMin = toMinutes(start);
    endMin = toMinutes(end);
    if (endMin <= startMin) {
      errors.push({ field: endSelect, message: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม" });
    } else if (endMin - startMin > MAX_HOURS * 60) {
      errors.push({
        field: endSelect,
        message: `จองได้ไม่เกิน ${MAX_HOURS} ชั่วโมงต่อครั้ง (ที่เลือกไว้คือ ${(endMin - startMin) / 60} ชั่วโมง)`,
      });
    } else if (date === todayString() && endMin <= nowMinutes()) {
      errors.push({ field: startSelect, message: "ช่วงเวลานี้ผ่านไปแล้ว กรุณาเลือกเวลาที่ยังไม่ถึง" });
    }
  }

  if (!Number.isInteger(people) || people < 1) {
    errors.push({ field: peopleInput, message: "จำนวนคนต้องเป็นจำนวนเต็มตั้งแต่ 1 คนขึ้นไป" });
  } else if (room && people > room.capacityMax) {
    errors.push({
      field: peopleInput,
      message: `${room.name} รองรับได้ไม่เกิน ${room.capacityMax} คน แต่ระบุไว้ ${people} คน`,
    });
  }

  if (name.length < 2) {
    errors.push({ field: nameInput, message: "กรุณากรอกชื่อ–สกุลผู้จอง" });
  }
  if (!STUDENT_ID_PATTERN.test(studentId)) {
    errors.push({ field: idInput, message: "รหัสนักศึกษาต้องเป็นตัวอักษรหรือตัวเลข 8–12 ตัว และไม่มีช่องว่าง" });
  }

  // F5: ตรวจการจองซ้อน เฉพาะเมื่อข้อมูลวันเวลาถูกต้องแล้ว
  const timeOk = !errors.some((e) => e.field === dateInput || e.field === startSelect || e.field === endSelect);
  if (room && timeOk && date && startMin !== null) {
    const conflict = findConflict(allBookings(), room.id, date, startMin, endMin);
    if (conflict) {
      errors.push({
        field: startSelect,
        message: `${room.name} ถูกจองแล้วในช่วง ${conflict.start}–${conflict.end} น. ของ${formatDate(date)} ซึ่งซ้อนกับช่วง ${start}–${end} น. กรุณาเลือกช่วงที่ว่างจากตาราง`,
      });
    }
  }

  return errors;
}

function clearFeedback() {
  formErrors.hidden = true;
  formErrors.replaceChildren();
  formSuccess.hidden = true;
  formSuccess.replaceChildren();
  fieldControls.forEach((el) => el.removeAttribute("aria-invalid"));
}

function showErrors(errors) {
  clearFeedback();
  const lead = document.createElement("p");
  const leadText = document.createElement("strong");
  leadText.textContent = "จองไม่สำเร็จ กรุณาแก้ไขรายการต่อไปนี้";
  lead.appendChild(leadText);
  const list = document.createElement("ul");
  errors.forEach((e) => {
    const li = document.createElement("li");
    li.textContent = e.message;
    list.appendChild(li);
    if (e.field) e.field.setAttribute("aria-invalid", "true");
  });
  formErrors.append(lead, list);
  formErrors.hidden = false;

  const firstField = errors.find((e) => e.field);
  (firstField ? firstField.field : formErrors).focus();
}

function showSuccess(booking, room) {
  clearFeedback();
  const msg = document.createElement("p");
  msg.textContent = `จอง ${room.name} สำเร็จ · ${formatDate(booking.date)} · ${booking.start}–${booking.end} น. · ${booking.people} คน`;
  const link = document.createElement("a");
  link.href = "my-bookings.html";
  link.textContent = "ดูการจองของฉัน";
  formSuccess.append(msg, link);
  formSuccess.hidden = false;
  formSuccess.focus();
}

function handleSubmit(event) {
  event.preventDefault();
  const errors = validateBooking();
  if (errors.length) {
    showErrors(errors);
    return;
  }

  const room = getSelectedRoom();
  const booking = {
    id: `u${Date.now()}`,
    roomId: room.id,
    date: dateInput.value,
    start: startSelect.value,
    end: endSelect.value,
    people: Number(peopleInput.value),
    by: nameInput.value.trim(),
    studentId: idInput.value.trim(),
  };

  if (!saveLocalBooking(booking)) {
    showErrors([{ field: null, message: "บันทึกการจองไม่สำเร็จ เบราว์เซอร์อาจปิดการเก็บข้อมูลไว้ กรุณาลองใหม่" }]);
    return;
  }

  showSuccess(booking, room);
  startSelect.value = "";
  endSelect.value = "";
  peopleInput.value = "";
  renderSchedule();
}

function setupEvents() {
  capacityFilter.addEventListener("input", renderRooms);
  equipmentFilters.addEventListener("change", renderRooms);
  filterForm.addEventListener("reset", () => setTimeout(renderRooms, 0));

  roomGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-room-id]");
    if (button) selectRoom(button.dataset.roomId, true);
  });

  slotGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-hour]");
    if (!button) return;
    const hour = Number(button.dataset.hour);
    startSelect.value = `${pad(hour)}:00`;
    endSelect.value = `${pad(hour + 1)}:00`;
    clearFeedback();
    renderSchedule(hour);
  });

  dateInput.addEventListener("change", () => {
    clearFeedback();
    renderSchedule();
  });
  startSelect.addEventListener("change", () => renderSchedule());
  endSelect.addEventListener("change", () => renderSchedule());
  bookingForm.addEventListener("submit", handleSubmit);
}

async function init() {
  fillTimeOptions(startSelect, OPEN_HOUR, CLOSE_HOUR - 1);
  fillTimeOptions(endSelect, OPEN_HOUR + 1, CLOSE_HOUR);
  dateInput.min = todayString();
  dateInput.value = defaultDate();
  setupEvents();

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    rooms = data.rooms || [];
    jsonBookings = data.bookings || [];
  } catch (err) {
    console.error("โหลดข้อมูลไม่สำเร็จ", err);
    roomStatus.textContent = "โหลดข้อมูลห้องไม่สำเร็จ กรุณารีเฟรชหน้านี้ หรือเปิดผ่านเซิร์ฟเวอร์ (ไม่ใช่ file://)";
    roomStatus.classList.add("error");
    bookingForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  buildEquipmentFilters();
  renderRooms();

  const preselect = new URLSearchParams(window.location.search).get("room");
  if (preselect && rooms.some((r) => r.id === preselect)) {
    selectRoom(preselect, false);
  }
}

init();
