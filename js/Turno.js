function pad(n){ return n.toString().padStart(2,'0'); }

/* ---------------- ALMACENAMIENTO: HISTÓRICO DE REGISTROS (para el Excel) ---------------- */
const STORAGE_KEY = 'espacioPublico_registrosTurno';

function getRegistros(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }catch(err){
    return [];
  }
}

function guardarRegistro(registro){
  const registros = getRegistros();
  registros.push(registro);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  return registros;
}

/* ---------------- ALMACENAMIENTO: PERSONAS CON TURNO ACTIVO (pendientes de cierre) ---------------- */
const ACTIVOS_KEY = 'espacioPublico_turnosActivos';

function getActivos(){
  try{
    return JSON.parse(localStorage.getItem(ACTIVOS_KEY)) || [];
  }catch(err){
    return [];
  }
}

function guardarActivo(activo){
  const activos = getActivos();
  activos.push(activo);
  localStorage.setItem(ACTIVOS_KEY, JSON.stringify(activos));
  return activos;
}

function eliminarActivo(codigoTurno){
  const activos = getActivos().filter(a => a.codigoTurno !== codigoTurno);
  localStorage.setItem(ACTIVOS_KEY, JSON.stringify(activos));
  return activos;
}

/* ---------------- GENERADOR DE CÓDIGO ÚNICO ---------------- */
// Se excluyen caracteres ambiguos (0, O, 1, I) para que sea fácil de leer y escribir.
const CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generarCodigoUnico(){
  const existentes = new Set(getActivos().map(a => a.codigoTurno));
  let codigo;
  do{
    codigo = '';
    for(let i = 0; i < 6; i++){
      codigo += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
    }
  }while(existentes.has(codigo));
  return codigo;
}

/* ---------------- EXPORTAR A EXCEL ---------------- */
function descargarExcel(){
  const registros = getRegistros();
  if(!registros.length) return;

  const filas = registros.map(r => ({
    'Tipo de registro': r.tipo,
    'Código de turno': r.codigoTurno || '',
    'Código': r.codigo,
    'Nombre': r.nombre,
    'Apellidos': r.apellidos,
    'Cédula': r.cedula,
    'Fecha': r.fecha,
    'Hora': r.hora
  }));

  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja['!cols'] = [
    { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 10 }
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Turnos');

  const ahora = new Date();
  const nombreArchivo = `turnos_espacio_publico_${ahora.getFullYear()}-${pad(ahora.getMonth()+1)}-${pad(ahora.getDate())}_${pad(ahora.getHours())}${pad(ahora.getMinutes())}.xlsx`;

  XLSX.writeFile(libro, nombreArchivo);
}

/* ---------------- CONFIG DE CADA TURNO ---------------- */
const turnos = {
  inicio: {
    overlay: document.getElementById('inicioOverlay'),
    body: document.getElementById('inicioBody'),
    openBtn: document.getElementById('openInicio'),
    closeBtn: document.getElementById('closeInicio'),
    idPrefix: 'ini',
    tipo: 'Inicio',
    label: 'Registrar inicio de turno',
    stamp: 'Inicio registrado',
    rowLabel: 'Inicio de turno',
    interval: null,
    draft: null
  },
  cierre: {
    overlay: document.getElementById('cierreOverlay'),
    body: document.getElementById('cierreBody'),
    openBtn: document.getElementById('openCierre'),
    closeBtn: document.getElementById('closeCierre'),
    idPrefix: 'cie',
    tipo: 'Cierre',
    label: 'Registrar cierre de turno',
    stamp: 'Cierre registrado',
    rowLabel: 'Fin de turno',
    interval: null,
    draft: null,
    seleccionado: null
  }
};

/* =========================================================
   INICIO DE TURNO
   ========================================================= */
function resetInicioBody(t){
  t.draft = null;
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
  document.getElementById(`${t.idPrefix}Form`).addEventListener('submit', (e) => handleInicioSubmit(e, t));
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

function handleInicioSubmit(e, t){
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
  const codigoTurno = generarCodigoUnico();

  const registro = {
    tipo: t.tipo,
    codigoTurno,
    codigo, nombre, apellidos, cedula,
    fecha: dateStr,
    hora: timeStr
  };

  clearInterval(t.interval);
  guardarRegistro(registro);
  guardarActivo(registro);
  mostrarBadgeInicio(t, registro);
}

function mostrarBadgeInicio(t, registro){
  t.body.innerHTML = `
    <div class="badge">
      <div class="badge-stamp">${t.stamp}</div>
      <div class="badge-row"><span class="k">Código</span><span class="v">${registro.codigo}</span></div>
      <div class="badge-row"><span class="k">Nombre</span><span class="v">${registro.nombre} ${registro.apellidos}</span></div>
      <div class="badge-row"><span class="k">Cédula</span><span class="v">${registro.cedula}</span></div>
      <div class="badge-row"><span class="k">${t.rowLabel}</span><span class="v badge-time">${registro.hora}</span></div>
      <div class="badge-row"><span class="k">Fecha</span><span class="v">${registro.fecha}</span></div>
    </div>
    <div class="code-badge">${registro.codigoTurno}</div>
    <p class="code-note">
      ⚠️ Este es el <strong>código único de turno</strong> de <strong>${registro.nombre} ${registro.apellidos}</strong>.
      Debe guardarlo: se pedirá para cerrar el turno más tarde. Sin este código no será posible cerrar el turno.
    </p>
    <button class="btn btn-block" id="${t.idPrefix}NewBtn">Registrar otra persona</button>
  `;
  document.getElementById(`${t.idPrefix}NewBtn`).onclick = () => resetInicioBody(t);
}

/* =========================================================
   CIERRE DE TURNO
   ========================================================= */

// Paso 1: lista de personas con turno activo
function resetCierreBody(t){
  t.draft = null;
  t.seleccionado = null;
  clearInterval(t.interval);
  renderListaActivos(t);
}

function renderListaActivos(t){
  const activos = getActivos();

  if(!activos.length){
    t.body.innerHTML = `
      <div class="empty-state">No hay personas con turno activo en este momento.</div>
    `;
    return;
  }

  const items = activos.map(a => `
    <div class="persona-item" data-id="${a.codigoTurno}">
      <div>
        <div class="pi-name">${a.nombre} ${a.apellidos}</div>
        <div class="pi-meta">Código: ${a.codigo} · Inicio: ${a.hora}</div>
      </div>
      <div class="pi-arrow">→</div>
    </div>
  `).join('');

  t.body.innerHTML = `
    <p class="code-note" style="margin-bottom:14px;">Selecciona a la persona que va a cerrar turno.</p>
    <div class="persona-list">${items}</div>
  `;

  t.body.querySelectorAll('.persona-item').forEach(el => {
    el.onclick = () => {
      const activo = activos.find(a => a.codigoTurno === el.dataset.id);
      if(activo) mostrarFormularioCodigo(t, activo);
    };
  });
}

// Paso 2: se eligió a la persona, ahora se pide su código único
function mostrarFormularioCodigo(t, activo){
  t.seleccionado = activo;
  t.body.innerHTML = `
    <div class="clock-field">
      <div>
        <div class="cf-label">🔒 Hora automática del dispositivo</div>
        <div class="cf-time" id="${t.idPrefix}Clock">00:00:00</div>
        <div class="cf-date" id="${t.idPrefix}Date">-</div>
      </div>
    </div>
    <div class="selected-person">
      <div class="sp-name">${activo.nombre} ${activo.apellidos}</div>
      <div class="sp-meta">Código: ${activo.codigo} · Cédula: ${activo.cedula} · Inicio: ${activo.hora}</div>
    </div>
    <form id="${t.idPrefix}Form">
      <div class="field">
        <label>Código único de turno</label>
        <input type="text" id="${t.idPrefix}CodigoTurno" required placeholder="Ej. 7K4M2Q" style="text-transform:uppercase;letter-spacing:0.1em;">
      </div>
      <div class="error-msg" id="${t.idPrefix}Error">El código único no coincide con el de esta persona.</div>
      <button type="submit" class="btn btn-block">${t.label}</button>
      <button type="button" class="btn btn-block btn-ghost" style="margin-top:10px" id="${t.idPrefix}Volver">← Elegir otra persona</button>
    </form>
  `;
  startClock(t);
  document.getElementById(`${t.idPrefix}Form`).addEventListener('submit', (e) => handleCierreSubmit(e, t));
  document.getElementById(`${t.idPrefix}Volver`).onclick = () => resetCierreBody(t);
}

// Paso 3: verificar el código único
function handleCierreSubmit(e, t){
  e.preventDefault();
  const input = document.getElementById(`${t.idPrefix}CodigoTurno`);
  const codigoIngresado = input.value.trim().toUpperCase();
  const errorMsg = document.getElementById(`${t.idPrefix}Error`);

  if(!codigoIngresado || codigoIngresado !== t.seleccionado.codigoTurno){
    errorMsg.style.display = 'block';
    return;
  }
  errorMsg.style.display = 'none';

  const registeredAt = new Date();
  const timeStr = `${pad(registeredAt.getHours())}:${pad(registeredAt.getMinutes())}:${pad(registeredAt.getSeconds())}`;
  const dateStr = registeredAt.toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' });

  t.draft = {
    tipo: t.tipo,
    codigoTurno: t.seleccionado.codigoTurno,
    codigo: t.seleccionado.codigo,
    nombre: t.seleccionado.nombre,
    apellidos: t.seleccionado.apellidos,
    cedula: t.seleccionado.cedula,
    fecha: dateStr,
    hora: timeStr
  };

  clearInterval(t.interval);
  mostrarConfirmacionCierre(t);
}

// Paso 4: pantalla de confirmación antes de cerrar definitivamente
function mostrarConfirmacionCierre(t){
  const r = t.draft;
  t.body.innerHTML = `
    <div class="badge">
      <div class="badge-stamp" style="color:var(--alert); border-color:var(--alert);">Confirmar</div>
      <div class="badge-row"><span class="k">Código</span><span class="v">${r.codigo}</span></div>
      <div class="badge-row"><span class="k">Nombre</span><span class="v">${r.nombre} ${r.apellidos}</span></div>
      <div class="badge-row"><span class="k">Cédula</span><span class="v">${r.cedula}</span></div>
      <div class="badge-row"><span class="k">Fin de turno</span><span class="v badge-time">${r.hora}</span></div>
      <div class="badge-row"><span class="k">Fecha</span><span class="v">${r.fecha}</span></div>
    </div>
    <p style="font-size:13px; line-height:1.55; color:var(--ink-soft); margin-top:16px;">
      Estás a punto de <strong>cerrar el turno</strong> de esta persona. Al confirmar, se guardará el cierre,
      la persona se eliminará de la lista de turnos activos y se descargará automáticamente una hoja de cálculo (.xlsx)
      con todos los registros de inicio y cierre almacenados.
    </p>
    <button class="btn btn-block" style="margin-top:16px" id="${t.idPrefix}ConfirmarCierre">Sí, cerrar turno y descargar</button>
    <button class="btn btn-block btn-ghost" style="margin-top:10px" id="${t.idPrefix}CancelarCierre">Cancelar</button>
  `;
  document.getElementById(`${t.idPrefix}ConfirmarCierre`).onclick = () => confirmarCierre(t);
  document.getElementById(`${t.idPrefix}CancelarCierre`).onclick = () => resetCierreBody(t);
}

function confirmarCierre(t){
  if(!t.draft) return;
  guardarRegistro(t.draft);
  eliminarActivo(t.draft.codigoTurno);
  descargarExcel();
  mostrarBadge(t, t.draft);
  t.draft = null;
  t.seleccionado = null;
}

/* ---------------- BADGE FINAL (compartido) ---------------- */
function mostrarBadge(t, registro){
  t.body.innerHTML = `
    <div class="badge">
      <div class="badge-stamp">${t.stamp}</div>
      <div class="badge-row"><span class="k">Código</span><span class="v">${registro.codigo}</span></div>
      <div class="badge-row"><span class="k">Nombre</span><span class="v">${registro.nombre} ${registro.apellidos}</span></div>
      <div class="badge-row"><span class="k">Cédula</span><span class="v">${registro.cedula}</span></div>
      <div class="badge-row"><span class="k">${t.rowLabel}</span><span class="v badge-time">${registro.hora}</span></div>
      <div class="badge-row"><span class="k">Fecha</span><span class="v">${registro.fecha}</span></div>
    </div>
    <button class="btn btn-block" style="margin-top:18px" id="${t.idPrefix}NewBtn">Registrar otra persona</button>
  `;
  document.getElementById(`${t.idPrefix}NewBtn`).onclick = () => t.tipo === 'Inicio' ? resetInicioBody(t) : resetCierreBody(t);
}

/* ---------------- APERTURA / CIERRE DE MODALES ---------------- */
Object.values(turnos).forEach(t => {
  t.openBtn.onclick = () => {
    if(t.tipo === 'Inicio') resetInicioBody(t); else resetCierreBody(t);
    t.overlay.classList.add('open');
  };
  t.closeBtn.onclick = () => { t.overlay.classList.remove('open'); clearInterval(t.interval); };
  t.overlay.onclick = (e) => { if(e.target === t.overlay){ t.overlay.classList.remove('open'); clearInterval(t.interval); } };
});