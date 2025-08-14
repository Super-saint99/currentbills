function getState() {
  return JSON.parse(localStorage.getItem('billState') || '{"renters":[],"settings":{}}');
}
function setState(newState) {
  localStorage.setItem('billState', JSON.stringify({...getState(), ...newState}));
}
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show';
  setTimeout(()=> toast.className = 'toast', 3000);
}
function renderRenters() {
  const { renters } = getState();
  const list = document.getElementById('renterList');
  list.innerHTML = '';
  renters.forEach((r, idx) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${r.name}</td>
      <td><input type="number" value="${r.bill}" onchange="updateBill(${idx}, this.value)"></td>
      <td>
        ${[100,150,200].map(v=>`<button class='amount-btn' onclick='setBoreBill(${idx},${v})'>₹${v}</button>`).join('')}
      </td>
      <td><input type="date" value="${r.dateBilled}" onchange="updateDateBilled(${idx}, this.value)"></td>
      <td><input type="date" value="${r.dueDate}" onchange="updateDueDate(${idx}, this.value)"></td>
      <td><input type="text" value="${r.meter}" onchange="updateMeter(${idx}, this.value)"></td>
      <td><button class="remove-btn" onclick="removeRenter(${idx})">X</button></td>
    `;
    list.appendChild(tr);
  });
}
function addRenter() {
  const name = document.getElementById('newName').value.trim();
  const bill = document.getElementById('newBill').value.trim();
  const dateBilled = document.getElementById('newDateBilled').value;
  const dueDate = document.getElementById('newDueDate').value;
  const meter = document.getElementById('newMeter').value.trim();
  if (!name || !bill || !dateBilled || !dueDate) {
    showToast('Please fill all details');
    return;
  }
  const state = getState();
  state.renters.push({ name, bill, boreBill: 0, dateBilled, dueDate, meter });
  setState({ renters: state.renters });
  document.getElementById('newName').value = '';
  document.getElementById('newBill').value = '';
  document.getElementById('newDateBilled').value = '';
  document.getElementById('newDueDate').value = '';
  document.getElementById('newMeter').value = '';
  renderRenters();
}
function removeRenter(i) {
  const state = getState();
  state.renters.splice(i,1);
  setState({ renters: state.renters });
  renderRenters();
}
function updateBill(i, val) {
  const state = getState();
  state.renters[i].bill = val;
  setState({ renters: state.renters });
}
function setBoreBill(i, val) {
  const state = getState();
  state.renters[i].boreBill = val;
  setState({ renters: state.renters });
}
function updateDateBilled(i, val) {
  const state = getState();
  state.renters[i].dateBilled = val;
  setState({ renters: state.renters });
}
function updateDueDate(i, val) {
  const state = getState();
  state.renters[i].dueDate = val;
  setState({ renters: state.renters });
}
function updateMeter(i, val) {
  const state = getState();
  state.renters[i].meter = val;
  setState({ renters: state.renters });
}
function saveSettings() {
  const phone = document.getElementById('phone').value.trim();
  const state = getState();
  state.settings.phone = phone;
  setState({ settings: state.settings });
  showToast('Settings saved');
}
function compileSummary() {
  const { renters } = getState();
  let lines = renters.map(r => 
    `${r.name} | Bill: ₹${r.bill} | Bore Bill: ₹${r.boreBill || 0} | Date: ${r.dateBilled} | Due: ${r.dueDate} | Meter: ${r.meter} | Please pay by due date to avoid fines.`
  );
  return `Monthly Current Bill Reminder:\n` + lines.join('\n');
}
function sendSummary() {
  const { settings } = getState();
  if (!settings.phone) { showToast('Set your WhatsApp number first.'); return; }
  const summary = encodeURIComponent(compileSummary());
  const phoneNum = settings.phone.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${phoneNum}?text=${summary}`;
  window.open(url, '_blank');
  showToast('WhatsApp reminder prepared ✔');
}
document.addEventListener('DOMContentLoaded', renderRenters);
