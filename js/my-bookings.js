'use strict';
const errBox = document.getElementById('error-box');
const list = document.getElementById('my-list');
const empty = document.getElementById('empty');
const status = document.getElementById('status');
let data;

// F6: แสดงการจองจาก localStorage
function render() {
  const mine = App.getMine().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  list.replaceChildren();
  empty.hidden = mine.length > 0;
  const today = App.todayStr();
  for (const b of mine) {
    const room = data.rooms.find(r => r.id === b.roomId);
    const roomText = room ? App.label(room) : b.roomId;
    const past = b.date < today || (b.date === today && App.toMin(b.end) <= App.nowMin());

    const li = App.el('li', 'card booking-item');
    const info = App.el('div', 'card-body');
    info.append(
      App.el('h2', '', roomText),
      App.el('p', '', `วันที่ ${App.fmtDate(b.date)} เวลา ${b.start}–${b.end} น.`),
      App.el('p', '', `จำนวน ${b.people} คน · ผู้จอง ${b.by} (${b.studentId})`)
    );
    if (past) info.append(App.el('p', 'badge', 'ผ่านไปแล้ว'));

    const btn = App.el('button', 'btn btn-danger', 'ยกเลิกการจอง');
    btn.type = 'button';
    btn.setAttribute('aria-label', `ยกเลิกการจอง ${roomText} วันที่ ${App.fmtDate(b.date)} เวลา ${b.start}–${b.end}`);
    btn.addEventListener('click', () => cancel(b, roomText));
    info.append(btn);
    li.append(info);
    list.append(li);
  }
}

// ถามยืนยันก่อนยกเลิก แล้วลบออกจาก localStorage ช่วงเวลานั้นจะกลับมาว่างในตารางหน้าจอง
function cancel(b, roomText) {
  if (!confirm(`ยืนยันยกเลิกการจอง ${roomText} วันที่ ${App.fmtDate(b.date)} เวลา ${b.start}–${b.end} ?`)) return;
  if (!App.saveMine(App.getMine().filter(x => x.id !== b.id))) {
    App.showError(errBox, 'ยกเลิกไม่สำเร็จ เบราว์เซอร์ไม่อนุญาตให้บันทึกข้อมูล');
    return;
  }
  status.hidden = false;
  status.textContent = `ยกเลิกการจอง ${roomText} เวลา ${b.start}–${b.end} แล้ว ช่วงเวลานี้กลับมาว่าง`;
  render();
  status.focus();   // คืน focus ให้ผู้ใช้คีย์บอร์ด/โปรแกรมอ่านหน้าจอ (ปุ่มที่กดถูกลบไปแล้ว)
}

(async () => {
  try {
    data = await App.loadData();
    render();
  } catch (e) {
    App.showError(errBox, App.loadErrorMsg(e));
  }
})();
