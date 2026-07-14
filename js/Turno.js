function pad(n){ return n.toString().padStart(2,'0'); }

/* ---------------- CONFIG DE CADA TURNO ---------------- */
const turnos = {
  inicio: {
    overlay: document.getElementById('inicioOverlay'),
    body: document.getElementById('inicioBody'),
    openBtn: document.getElementById('openInicio'),
    closeBtn: document.getElementById('closeInicio'),
    idPrefix: 'ini',
    label: 'Registrar inicio de turno',
    stamp: 'Inicio registrado',
    rowLabel: 'Inicio de turno',
    interval: null
  },
  cierre: {
    overlay: document.getElementById('cierreOverlay'),
    body: document.getElementById('cierreBody'),
    openBtn: document.getElementById('openCierre'),
    closeBtn: document.getElementById('closeCierre'),
    idPrefix: 'cie',
    label: 'Registrar cierre de turno',
    stamp: 'Cierre registrado',
    rowLabel: 'Fin de turno',
    interval: null
  }
};

function resetTurnoBody(t){
  t.body.innerHTML = `
    <div class="clock-field">
      <div>
        <div class="cf-label">🔒 Hora automática del dispositivo</div>
        <div class="cf-time" id="${t.idPrefix}Clock">00:00:00</div>
        <div class="cf-date" id="${t.idPrefix}Date">-</div>
      </div>
    </div>
    <form id="${t.idPrefix}Form">
      <div class="field">
        <label>Código de persona</label>
        <input type="text" id="${t.idPrefix}Codigo" required placeholder="Ej. EP-0452">
      </div>
      <div class="field">
        <label>Nombre</label>
        <input type="text" id="${t.idPrefix}Nombre" required placeholder="Nombre">
      </div>
      <div class="field">
        <label>Apellidos</label>
        <input type="text" id="${t.idPrefix}Apellidos" required placeholder="Apellidos">
      </div>
      <div class="field">
        <label>Cédula de ciudadanía</label>
        <input type="text" id="${t.idPrefix}Cedula" required inputmode="numeric" placeholder="Número de cédula">
      </div>
      <div class="error-msg" id="${t.idPrefix}Error">Completa todos los campos para registrar el turno.</div>
      <button type="submit" class="btn btn-block">${t.label}</button>
    </form>
  `;
  startClock(t);
  document.getElementById(`${t.idPrefix}Form`).addEventListener('submit', (e) => handleTurnoSubmit(e, t));
}

function startClock(t){
  const c = document.getElementById(`${t.idPrefix}Clock`);
  const d = document.getElementById(`${t.idPrefix}Date`);
  function tick(){
    const now = new Date();
    c.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    d.textContent = now.toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }
  tick();
  clearInterval(t.interval);
  t.interval = setInterval(tick, 1000);
}

function handleTurnoSubmit(e, t){
  e.preventDefault();
  const codigo = document.getElementById(`${t.idPrefix}Codigo`).value.trim();
  const nombre = document.getElementById(`${t.idPrefix}Nombre`).value.trim();
  const apellidos = document.getElementById(`${t.idPrefix}Apellidos`).value.trim();
  const cedula = document.getElementById(`${t.idPrefix}Cedula`).value.trim();
  const errorMsg = document.getElementById(`${t.idPrefix}Error`);

  if(!codigo || !nombre || !apellidos || !cedula){
    errorMsg.style.display = 'block';
    return;
  }
  errorMsg.style.display = 'none';

  const registeredAt = new Date();
  const timeStr = `${pad(registeredAt.getHours())}:${pad(registeredAt.getMinutes())}:${pad(registeredAt.getSeconds())}`;
  const dateStr = registeredAt.toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' });

  clearInterval(t.interval);

  t.body.innerHTML = `
    <div class="badge">
      <div class="badge-stamp">${t.stamp}</div>
      <div class="badge-row"><span class="k">Código</span><span class="v">${codigo}</span></div>
      <div class="badge-row"><span class="k">Nombre</span><span class="v">${nombre} ${apellidos}</span></div>
      <div class="badge-row"><span class="k">Cédula</span><span class="v">${cedula}</span></div>
      <div class="badge-row"><span class="k">${t.rowLabel}</span><span class="v badge-time">${timeStr}</span></div>
      <div class="badge-row"><span class="k">Fecha</span><span class="v">${dateStr}</span></div>
    </div>
    <button class="btn btn-block" style="margin-top:18px" id="${t.idPrefix}NewBtn">Registrar otra persona</button>
  `;
  document.getElementById(`${t.idPrefix}NewBtn`).onclick = () => resetTurnoBody(t);
}

/* ---------------- APERTURA / CIERRE DE MODALES ---------------- */
Object.values(turnos).forEach(t => {
  t.openBtn.onclick = () => { resetTurnoBody(t); t.overlay.classList.add('open'); };
  t.closeBtn.onclick = () => { t.overlay.classList.remove('open'); clearInterval(t.interval); };
  t.overlay.onclick = (e) => { if(e.target === t.overlay){ t.overlay.classList.remove('open'); clearInterval(t.interval); } };
});