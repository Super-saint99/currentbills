/**
 * Monthly Current Bill Reminder — WhatsApp
 * Features:
 *  - Add/remove renters with: name, meter number, phone, bill amount, billed date, due date
 *  - Bore bill quick select (0/100/150/200)
 *  - Auto-computed per-renter total and grand total
 *  - WhatsApp message in Telugu per renter; "Prepare All" opens chats for all renters
 *  - LocalStorage persistence
 */

const els = {
  rows: document.getElementById('rows'),
  addForm: document.getElementById('addForm'),
  name: document.getElementById('name'),
  meter: document.getElementById('meter'),
  phone: document.getElementById('phone'),
  amount: document.getElementById('amount'),
  billed: document.getElementById('billed'),
  due: document.getElementById('due'),
  boreGroup: document.getElementById('boreGroup'),
  resetForm: document.getElementById('resetForm'),
  sendAll: document.getElementById('sendAll'),
  clearAll: document.getElementById('clearAll'),
  grandTotal: document.getElementById('grandTotal'),
  toast: document.getElementById('toast'),
  defaultPhone: document.getElementById('defaultPhone'),
  saveDefault: document.getElementById('saveDefault'),
};

const STORAGE = {
  RENTERS: 'mcb.renters',
  DEFAULT_PHONE: 'mcb.defaultPhone',
};

function showToast(msg){
  els.toast.textContent = msg;
  els.toast.style.display = 'block';
  setTimeout(()=> els.toast.style.display = 'none', 2200);
}

function uid(){ return Math.random().toString(36).slice(2,10); }

function loadRenters(){ try { return JSON.parse(localStorage.getItem(STORAGE.RENTERS)) || [] } catch { return [] } }
function saveRenters(rs){ localStorage.setItem(STORAGE.RENTERS, JSON.stringify(rs)); }

function loadDefaultPhone(){ return localStorage.getItem(STORAGE.DEFAULT_PHONE) || '' }
function saveDefaultPhone(p){ localStorage.setItem(STORAGE.DEFAULT_PHONE, p || '') }

function fmtDate(d){
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'});
}

function computeTotal(r){ return (Number(r.amount||0) + Number(r.bore||0)) }

function render(){
  const renters = loadRenters();
  els.rows.innerHTML = '';
  let grand = 0;

  renters.forEach((r, idx) => {
    const tr = document.createElement('tr');

    // #
    const tdIdx = document.createElement('td');
    tdIdx.textContent = String(idx+1);

    // Name
    const tdName = document.createElement('td');
    const inName = document.createElement('input');
    inName.type = 'text'; inName.value = r.name || ''; inName.className='inline-input';
    inName.oninput = () => update(idx, {name: inName.value});
    tdName.appendChild(inName);

    // Meter
    const tdMeter = document.createElement('td');
    const inMeter = document.createElement('input');
    inMeter.type = 'text'; inMeter.value = r.meter || ''; inMeter.className='inline-input';
    inMeter.oninput = () => update(idx, {meter: inMeter.value});
    tdMeter.appendChild(inMeter);

    // Phone
    const tdPhone = document.createElement('td');
    const inPhone = document.createElement('input');
    inPhone.type = 'tel'; inPhone.value = r.phone || ''; inPhone.className='inline-phone';
    inPhone.placeholder = '+91...';
    inPhone.oninput = () => update(idx, {phone: inPhone.value});
    tdPhone.appendChild(inPhone);

    // Amount
    const tdAmt = document.createElement('td');
    const inAmt = document.createElement('input');
    inAmt.type = 'number'; inAmt.min='0'; inAmt.step='1'; inAmt.className='inline-input';
    inAmt.value = r.amount ?? '';
    inAmt.placeholder = '₹';
    inAmt.oninput = () => update(idx, {amount: Number(inAmt.value||0)});
    tdAmt.appendChild(inAmt);

    // Bore
    const tdBore = document.createElement('td');
    const boreWrap = document.createElement('div'); boreWrap.className='action-row';
    [0,100,150,200].forEach(val=>{
      const btn = document.createElement('button');
      btn.textContent = val ? `₹${val}` : '0';
      btn.className = val === r.bore ? 'ghost' : 'secondary';
      btn.onclick = (e)=>{ e.preventDefault(); update(idx, {bore: val}); };
      boreWrap.appendChild(btn);
    });
    tdBore.appendChild(boreWrap);

    // Total
    const tdTotal = document.createElement('td');
    tdTotal.textContent = '₹' + computeTotal(r);
    tdTotal.className = 'right';

    // Billed
    const tdBilled = document.createElement('td');
    const inBilled = document.createElement('input');
    inBilled.type='date'; inBilled.value = r.billed || ''; inBilled.className='inline-date';
    inBilled.oninput = () => update(idx, {billed: inBilled.value});
    tdBilled.appendChild(inBilled);

    // Due
    const tdDue = document.createElement('td');
    const inDue = document.createElement('input');
    inDue.type='date'; inDue.value = r.due || ''; inDue.className='inline-date';
    inDue.oninput = () => update(idx, {due: inDue.value});
    tdDue.appendChild(inDue);

    // Actions
    const tdAct = document.createElement('td');
    const rowActions = document.createElement('div');
    rowActions.className = 'action-row';
    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'WhatsApp';
    sendBtn.className = 'secondary';
    sendBtn.onclick = (e)=>{ e.preventDefault(); sendOne(r); };

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Remove';
    delBtn.className = 'danger';
    delBtn.onclick = (e)=>{ e.preventDefault(); remove(idx); };

    rowActions.appendChild(sendBtn);
    rowActions.appendChild(delBtn);
    tdAct.appendChild(rowActions);

    tr.append(tdIdx, tdName, tdMeter, tdPhone, tdAmt, tdBore, tdTotal, tdBilled, tdDue, tdAct);
    els.rows.appendChild(tr);

    grand += computeTotal(r);
  });

  els.grandTotal.textContent = '₹' + grand;
}

function update(index, patch){
  const renters = loadRenters();
  renters[index] = {...renters[index], ...patch};
  saveRenters(renters);
  render();
}

function remove(index){
  const renters = loadRenters();
  renters.splice(index,1);
  saveRenters(renters);
  render();
}

function addRenter(e){
  e.preventDefault();
  const bore = Number((new FormData(els.addForm).get('bore')) || 0);
  const renter = {
    id: uid(),
    name: els.name.value.trim(),
    meter: els.meter.value.trim(),
    phone: els.phone.value.trim(),
    amount: Number(els.amount.value || 0),
    billed: els.billed.value || '',
    due: els.due.value || '',
    bore,
  };
  if (!renter.name){ showToast('Enter name'); return; }
  const renters = loadRenters();
  renters.push(renter);
  saveRenters(renters);
  showToast('Added');
  els.addForm.reset();
  // default bore to 0
  els.boreGroup.querySelector('input[value="0"]').checked = true;
  render();
}

function resetForm(){ els.addForm.reset(); els.boreGroup.querySelector('input[value="0"]').checked = true; }

function msgTelugu(r){
  // Telugu message:
  // “హలో <name> గారు, మీ మీటర్ నం: <meter>. బిల్లు: ₹<amount>, బోర్ ఛార్జ్: ₹<bore>, మొత్తం: ₹<total>.
  // బిల్లు తేదీ: <billed>, డ్యూ తేదీ: <due>. దయచేసి <due> లోపు తప్పనిసరిగా చెల్లించండి; ఆలస్యమైతే జరిమానా విధించబడుతుంది. ధన్యవాదాలు.”
  const total = computeTotal(r);
  const billedTxt = r.billed ? fmtDate(r.billed) : '-';
  const dueTxt = r.due ? fmtDate(r.due) : '-';
  const name = r.name || 'టెనెంట్';
  const meter = r.meter || '-';
  const lines = [
    `హలో ${name} గారు,`,
    `మీ మీటర్ నం: ${meter}`,
    `బిల్లు: ₹${Number(r.amount||0).toFixed(0)}, బోర్ ఛార్జ్: ₹${Number(r.bore||0).toFixed(0)}, మొత్తం: ₹${total.toFixed(0)}`,
    `బిల్లు తేదీ: ${billedTxt}, డ్యూ తేదీ: ${dueTxt}`,
    `దయచేసి ${dueTxt} లోపు తప్పనిసరిగా చెల్లించండి; ఆలస్యమైతే జరిమానా విధించబడుతుంది.`,
    `ధన్యవాదాలు.`
  ];
  return lines.join('\n');
}

function openWhatsApp(phone, text){
  const num = (phone || loadDefaultPhone() || '').replace(/[^0-9]/g,'');
  if (!num){ showToast('Set phone (row or default)'); return; }
  const url = `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function sendOne(r){
  const msg = msgTelugu(r);
  openWhatsApp(r.phone, msg);
}

function sendAll(){
  const renters = load
