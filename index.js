// หน้าแรก: ดึงข้อมูลห้องจาก data/rooms.json แล้วแสดงห้องที่ว่าง "ตอนนี้"
const DATA_URL = "data/rooms.json";
const STORAGE_KEY = "studyRoomBookings"; // array ของ booking รูปแบบเดียวกับใน JSON
const OPEN_HOUR = 8;
const CLOSE_HOUR = 20;

const roomGrid = document.getElementById("room-grid");
const statusMessage = document.getElementById("status-message");
const todayLabel = document.getElementById("today-label");
const statTotal = document.getElementById("stat-total");
const statFree = document.getElementById("stat-free");
const statBookings = document.getElementById("stat-bookings");

let rooms = [];
let jsonBookings = [];

function pad(n) {
  return String(n).padStart(2, "0");
}

function toDateString(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function loadLocalBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("อ่าน localStorage ไม่สำเร็จ", err);
    return [];
  }
}

function getTodayBookings(now) {
  const today = toDateString(now);
  return [...jsonBookings, ...loadLocalBookings()].filter((b) => b.date === today);
}

// คืนค่า { state: "free" | "busy" | "closed", note: string }
function getRoomStatus(room, todayBookings, now) {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin < OPEN_HOUR * 60 || nowMin >= CLOSE_HOUR * 60) {
    return { state: "closed", note: `นอกเวลาให้บริการ (${pad(OPEN_HOUR)}:00–${pad(CLOSE_HOUR)}:00 น.)` };
  }

  const roomBookings = todayBookings
    .filter((b) => b.roomId === room.id)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  const current = roomBookings.find(
    (b) => toMinutes(b.start) <= nowMin && nowMin < toMinutes(b.end)
  );
  if (current) {
    return { state: "busy", note: `ไม่ว่าง จนถึง ${current.end} น.` };
  }

  const next = roomBookings.find((b) => toMinutes(b.start) > nowMin);
  return {
    state: "free",
    note: next ? `ว่างจนถึง ${next.start} น.` : "ว่างตลอดวันนี้",
  };
}

function createRoomPhoto(room) {
  if (!room.image) return null;
  const img = document.createElement("img");
  img.className = "room-photo";
  img.src = room.image;
  img.alt = room.imageAlt || `ภาพห้อง ${room.name}`;
  img.width = 800;
  img.height = 600;
  img.loading = "lazy";
  return img;
}

function createCard(room, status) {
  const card = document.createElement("article");
  card.className = "room-card";

  const title = document.createElement("h3");
  title.textContent = room.name;

  const badge = document.createElement("span");
  const labels = { free: "✓ ว่าง", busy: "✕ ไม่ว่าง", closed: "ปิดให้บริการ" };
  badge.className = `badge badge-${status.state}`;
  badge.textContent = labels[status.state];

  const note = document.createElement("p");
  note.className = "room-meta";
  note.textContent = status.note;

  const place = document.createElement("p");
  place.className = "room-meta";
  place.textContent = `ชั้น ${room.floor} · รองรับ ${room.capacityMin}–${room.capacityMax} คน`;

  const tags = document.createElement("ul");
  tags.className = "tags";
  tags.setAttribute("aria-label", `อุปกรณ์ใน${room.name}`);
  (room.equipment || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    tags.appendChild(li);
  });

  const link = document.createElement("a");
  link.className = "btn btn-secondary";
  link.href = `booking.html?room=${encodeURIComponent(room.id)}`;
  link.textContent = `จอง${room.name}`;

  card.append(...[createRoomPhoto(room), title, badge, note, place, tags, link].filter(Boolean));
  return card;
}

function render() {
  const now = new Date();
  const todayBookings = getTodayBookings(now);

  todayLabel.textContent = `วันนี้ ${now.toLocaleDateString("th-TH", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })} · เวลา ${pad(now.getHours())}:${pad(now.getMinutes())} น.`;

  const statuses = rooms.map((room) => ({ room, status: getRoomStatus(room, todayBookings, now) }));
  const freeRooms = statuses.filter((s) => s.status.state === "free");

  statTotal.textContent = rooms.length;
  statFree.textContent = freeRooms.length;
  statBookings.textContent = todayBookings.length;

  roomGrid.replaceChildren();
  freeRooms.forEach(({ room, status }) => roomGrid.appendChild(createCard(room, status)));

  statusMessage.classList.remove("error");
  if (statuses.length && statuses[0].status.state === "closed") {
    statusMessage.textContent = `ขณะนี้นอกเวลาให้บริการ (${pad(OPEN_HOUR)}:00–${pad(CLOSE_HOUR)}:00 น.) จองล่วงหน้าได้ที่หน้าจองห้อง`;
  } else if (freeRooms.length === 0) {
    statusMessage.textContent = "ตอนนี้ไม่มีห้องว่าง ลองเลือกช่วงเวลาอื่นในหน้าจองห้อง";
  } else {
    statusMessage.textContent = `พบ ${freeRooms.length} ห้องที่ว่างตอนนี้`;
  }
}

async function init() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    rooms = data.rooms || [];
    jsonBookings = data.bookings || [];
    render();
    setInterval(render, 60 * 1000); // อัปเดตสถานะทุก 1 นาที
  } catch (err) {
    console.error("โหลดข้อมูลไม่สำเร็จ", err);
    statusMessage.textContent = "โหลดข้อมูลห้องไม่สำเร็จ กรุณารีเฟรชหน้านี้ หรือเปิดผ่านเซิร์ฟเวอร์ (ไม่ใช่ file://)";
    statusMessage.classList.add("error");
  }
}

init();