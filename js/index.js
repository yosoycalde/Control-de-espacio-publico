/* ---------------- MAPA ---------------- */
  const map = L.map('map', { zoomControl: true }).setView([5.0689, -75.5174], 15); // Manizales, Colombia (ajusta si tu ciudad es otra)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  const hivisIcon = L.divIcon({
    className: '',
    html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#D4F62B;border:2px solid #16211C;transform:rotate(-45deg);box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
    iconSize: [22,22],
    iconAnchor: [11,22]
  });

  let pointCount = 0;
  const countEl = document.getElementById('pointCount');
  let pendingLatLng = null;

  function lockMap(){ map.dragging.disable(); map.scrollWheelZoom.disable(); map.doubleClickZoom.disable(); }
  function unlockMap(){ map.dragging.enable(); map.scrollWheelZoom.enable(); map.doubleClickZoom.enable(); }

  const pointOverlay = document.getElementById('pointOverlay');
  const openPointModal = (latlng) => {
    pendingLatLng = latlng;
    document.getElementById('pointName').value = '';
    document.getElementById('pointCategory').value = '';
    document.getElementById('pointDesc').value = '';
    pointOverlay.classList.add('open');
    lockMap();
  };
  document.getElementById('closePoint').onclick = () => { pointOverlay.classList.remove('open'); unlockMap(); };
  pointOverlay.onclick = (e) => { if(e.target === pointOverlay){ pointOverlay.classList.remove('open'); unlockMap(); } };

  map.on('click', (e) => openPointModal(e.latlng));

  document.getElementById('savePoint').onclick = () => {
    const name = document.getElementById('pointName').value.trim() || 'Punto sin nombre';
    const cat = document.getElementById('pointCategory').value.trim() || 'General';
    const desc = document.getElementById('pointDesc').value.trim();
    const marker = L.marker(pendingLatLng, { icon: hivisIcon }).addTo(map);
    marker.bindPopup(`<strong>${name}</strong><br><em>${cat}</em>${desc ? '<br>' + desc : ''}`).openPopup();
    pointCount++;
    countEl.textContent = pointCount + (pointCount === 1 ? ' punto registrado' : ' puntos registrados');
    pointOverlay.classList.remove('open');
    unlockMap();
  };

  /* ---------------- RELOJ EN VIVO ---------------- */
  const liveClock = document.getElementById('liveClock');
  const liveDate = document.getElementById('liveDate');
  function pad(n){ return n.toString().padStart(2,'0'); }
  function tick(){
    const now = new Date();
    liveClock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    liveDate.textContent = now.toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }
  tick();
  setInterval(tick, 1000);

  /* ---------------- MODAL DE TURNO ---------------- */
  const turnoOverlay = document.getElementById('turnoOverlay');
  const turnoBody = document.getElementById('turnoBody');
  const openTurnoBtn = document.getElementById('openTurno');
  const closeTurnoBtn = document.getElementById('closeTurno');

  function resetTurnoBody(){
    turnoBody.innerHTML = `
      <div class="clock-field">
        <div>
          <div class="cf-label">🔒 Hora automática del dispositivo</div>
          <div class="cf-time" id="liveClock">00:00:00</div>
          <div class="cf-date" id="liveDate">-</div>
        </div>
      </div>
      <form id="turnoForm">
        <div class="field">
          <label>Código de persona</label>
          <input type="text" id="fCodigo" required placeholder="Ej. EP-0452">
        </div>
        <div class="field">
          <label>Nombre</label>
          <input type="text" id="fNombre" required placeholder="Nombre">
        </div>
        <div class="field">
          <label>Apellidos</label>
          <input type="text" id="fApellidos" required placeholder="Apellidos">
        </div>
        <div class="field">
          <label>Cédula de ciudadanía</label>
          <input type="text" id="fCedula" required inputmode="numeric" placeholder="Número de cédula">
        </div>
        <div class="error-msg" id="turnoError">Completa todos los campos para registrar el turno.</div>
        <button type="submit" class="btn btn-block">Registrar inicio de turno</button>
      </form>
    `;
    startClock();
    document.getElementById('turnoForm').addEventListener('submit', handleTurnoSubmit);
  }

  let clockInterval;
  function startClock(){
    const c = document.getElementById('liveClock');
    const d = document.getElementById('liveDate');
    function t(){
      const now = new Date();
      c.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      d.textContent = now.toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    }
    t();
    clearInterval(clockInterval);
    clockInterval = setInterval(t, 1000);
  }

  openTurnoBtn.onclick = () => { resetTurnoBody(); turnoOverlay.classList.add('open'); lockMap(); };
  closeTurnoBtn.onclick = () => { turnoOverlay.classList.remove('open'); clearInterval(clockInterval); unlockMap(); };
  turnoOverlay.onclick = (e) => { if(e.target === turnoOverlay){ turnoOverlay.classList.remove('open'); clearInterval(clockInterval); unlockMap(); } };

  function handleTurnoSubmit(e){
    e.preventDefault();
    const codigo = document.getElementById('fCodigo').value.trim();
    const nombre = document.getElementById('fNombre').value.trim();
    const apellidos = document.getElementById('fApellidos').value.trim();
    const cedula = document.getElementById('fCedula').value.trim();
    const errorMsg = document.getElementById('turnoError');

    if(!codigo || !nombre || !apellidos || !cedula){
      errorMsg.style.display = 'block';
      return;
    }
    errorMsg.style.display = 'none';

    const registeredAt = new Date();
    const timeStr = `${pad(registeredAt.getHours())}:${pad(registeredAt.getMinutes())}:${pad(registeredAt.getSeconds())}`;
    const dateStr = registeredAt.toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' });

    clearInterval(clockInterval);

    turnoBody.innerHTML = `
      <div class="badge">
        <div class="badge-stamp">Registrado</div>
        <div class="badge-row"><span class="k">Código</span><span class="v">${codigo}</span></div>
        <div class="badge-row"><span class="k">Nombre</span><span class="v">${nombre} ${apellidos}</span></div>
        <div class="badge-row"><span class="k">Cédula</span><span class="v">${cedula}</span></div>
        <div class="badge-row"><span class="k">Inicio de turno</span><span class="v badge-time">${timeStr}</span></div>
        <div class="badge-row"><span class="k">Fecha</span><span class="v">${dateStr}</span></div>
      </div>
      <button class="btn btn-block" style="margin-top:18px" id="newTurnoBtn">Registrar otra persona</button>
    `;
    document.getElementById('newTurnoBtn').onclick = resetTurnoBody;
  }