/* Reutiliza pad() ya definido en Turno.js */

/* ---------------- ALMACENAMIENTO ---------------- */
const INCIDENCIAS_KEY = 'espacioPublico_incidencias';

function getIncidencias(){
  try{
    return JSON.parse(localStorage.getItem(INCIDENCIAS_KEY)) || [];
  }catch(err){
    return [];
  }
}

function guardarIncidencia(incidencia){
  const incidencias = getIncidencias();
  incidencias.push(incidencia);
  try{
    localStorage.setItem(INCIDENCIAS_KEY, JSON.stringify(incidencias));
    return { ok: true };
  }catch(err){
    // Probablemente se superó la cuota de almacenamiento del navegador (archivo muy pesado)
    incidencias.pop();
    return { ok: false, error: err };
  }
}

/* ---------------- ELEMENTOS BASE ---------------- */
const incidenciaOverlay = document.getElementById('incidenciaOverlay');
const incidenciaBody = document.getElementById('incidenciaBody');
const openIncidenciaBtn = document.getElementById('openIncidencia');
const closeIncidenciaBtn = document.getElementById('closeIncidencia');
let incidenciaInterval = null;
let incidenciaArchivo = null; // { dataUrl, tipo: 'image'|'video', nombre }

openIncidenciaBtn.onclick = () => { resetIncidenciaBody(); incidenciaOverlay.classList.add('open'); };
closeIncidenciaBtn.onclick = () => { incidenciaOverlay.classList.remove('open'); clearInterval(incidenciaInterval); };
incidenciaOverlay.onclick = (e) => { if(e.target === incidenciaOverlay){ incidenciaOverlay.classList.remove('open'); clearInterval(incidenciaInterval); } };

function startIncidenciaClock(clockId, dateId){
  const c = document.getElementById(clockId);
  const d = document.getElementById(dateId);
  function tick(){
    const now = new Date();
    c.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    d.textContent = now.toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }
  tick();
  clearInterval(incidenciaInterval);
  incidenciaInterval = setInterval(tick, 1000);
}

/* ---------------- PASO 1: ELEGIR TIPO DE REPORTE ---------------- */
function resetIncidenciaBody(){
  incidenciaArchivo = null;
  clearInterval(incidenciaInterval);
  incidenciaBody.innerHTML = `
    <p class="code-note" style="margin-bottom:14px;">¿Se pudo obtener información de la persona?</p>
    <div class="choice-buttons">
      <button type="button" class="choice-btn" id="btnConDatos">
        <span class="cb-title">Sí, tengo información de la persona</span>
        <span class="cb-desc">Registrar datos personales (opcionales) y describir la situación.</span>
      </button>
      <button type="button" class="choice-btn alt" id="btnSinDatos">
        <span class="cb-title">No se pudo registrar</span>
        <span class="cb-desc">Adjuntar foto o video y describir el problema o la situación.</span>
      </button>
    </div>
  `;
  document.getElementById('btnConDatos').onclick = () => mostrarFormularioConDatos();
  document.getElementById('btnSinDatos').onclick = () => mostrarFormularioSinDatos();
}

/* ---------------- CAMINO A: PERSONA IDENTIFICADA (datos opcionales) ---------------- */
function mostrarFormularioConDatos(){
  incidenciaBody.innerHTML = `
    <span class="back-link" id="volverEleccionA">← Volver</span>
    <div class="clock-field">
      <div>
        <div class="cf-label">🔒 Hora automática del dispositivo</div>
        <div class="cf-time" id="incClockA">00:00:00</div>
        <div class="cf-date" id="incDateA">-</div>
      </div>
    </div>
    <form id="incFormA">
      <div class="field">
        <label>Nombre <span class="optional-tag">Opcional</span></label>
        <input type="text" id="incNombre" placeholder="Nombre">
      </div>
      <div class="field">
        <label>Apellidos <span class="optional-tag">Opcional</span></label>
        <input type="text" id="incApellidos" placeholder="Apellidos">
      </div>
      <div class="field">
        <label>Cédula <span class="optional-tag">Opcional</span></label>
        <input type="text" id="incCedula" inputmode="numeric" placeholder="Número de cédula">
      </div>
      <div class="field">
        <label>Teléfono de contacto <span class="optional-tag">Opcional</span></label>
        <input type="text" id="incTelefono" inputmode="tel" placeholder="Número de contacto">
      </div>
      <div class="field">
        <label>Descripción de la situación</label>
        <textarea id="incDescripcionA" required placeholder="Describe qué está pasando, en qué actividad se encontró a la persona, etc."></textarea>
      </div>
      <div class="error-msg" id="incErrorA">Agrega una descripción de la situación.</div>
      <button type="submit" class="btn btn-block">Registrar incidencia</button>
    </form>
  `;
  startIncidenciaClock('incClockA', 'incDateA');
  document.getElementById('volverEleccionA').onclick = resetIncidenciaBody;
  document.getElementById('incFormA').addEventListener('submit', handleIncidenciaConDatosSubmit);
}

function handleIncidenciaConDatosSubmit(e){
  e.preventDefault();
  const nombre = document.getElementById('incNombre').value.trim();
  const apellidos = document.getElementById('incApellidos').value.trim();
  const cedula = document.getElementById('incCedula').value.trim();
  const telefono = document.getElementById('incTelefono').value.trim();
  const descripcion = document.getElementById('incDescripcionA').value.trim();
  const errorMsg = document.getElementById('incErrorA');

  if(!descripcion){
    errorMsg.style.display = 'block';
    return;
  }
  errorMsg.style.display = 'none';

  const registeredAt = new Date();
  const incidencia = {
    tipo: 'Persona identificada',
    nombre, apellidos, cedula, telefono,
    descripcion,
    media: null,
    fecha: registeredAt.toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' }),
    hora: `${pad(registeredAt.getHours())}:${pad(registeredAt.getMinutes())}:${pad(registeredAt.getSeconds())}`
  };

  clearInterval(incidenciaInterval);
  const resultado = guardarIncidencia(incidencia);
  mostrarBadgeIncidencia(incidencia, resultado);
}

/* ---------------- CAMINO B: NO SE PUDO REGISTRAR (foto/video + descripción) ---------------- */
function mostrarFormularioSinDatos(){
  incidenciaBody.innerHTML = `
    <span class="back-link" id="volverEleccionB">← Volver</span>
    <div class="clock-field">
      <div>
        <div class="cf-label">🔒 Hora automática del dispositivo</div>
        <div class="cf-time" id="incClockB">00:00:00</div>
        <div class="cf-date" id="incDateB">-</div>
      </div>
    </div>
    <form id="incFormB">
      <div class="field">
        <label>Foto o video de la situación</label>
        <label class="file-drop" id="fileDropLabel">
          <div class="fd-icon">📎</div>
          <div class="fd-label">Toca para elegir una foto o video</div>
          <div class="fd-filename" id="fdFilename"></div>
          <input type="file" id="incArchivo" accept="image/*,video/*">
        </label>
        <div id="mediaPreviewWrap"></div>
      </div>
      <div class="field">
        <label>Descripción del problema o situación</label>
        <textarea id="incDescripcionB" required placeholder="Describe qué ocurrió, dónde y por qué no fue posible identificar a la persona."></textarea>
      </div>
      <div class="error-msg" id="incErrorB">Adjunta una foto o video y agrega una descripción.</div>
      <button type="submit" class="btn btn-block">Registrar incidencia</button>
    </form>
  `;
  startIncidenciaClock('incClockB', 'incDateB');
  document.getElementById('volverEleccionB').onclick = resetIncidenciaBody;

  document.getElementById('incArchivo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;

    const tipo = file.type.startsWith('video') ? 'video' : 'image';
    const reader = new FileReader();
    reader.onload = () => {
      incidenciaArchivo = { dataUrl: reader.result, tipo, nombre: file.name };
      document.getElementById('fdFilename').textContent = file.name;
      const previewWrap = document.getElementById('mediaPreviewWrap');
      previewWrap.innerHTML = tipo === 'video'
        ? `<div class="media-preview"><video src="${reader.result}" controls></video></div>`
        : `<div class="media-preview"><img src="${reader.result}" alt="Vista previa"></div>`;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('incFormB').addEventListener('submit', handleIncidenciaSinDatosSubmit);
}

function handleIncidenciaSinDatosSubmit(e){
  e.preventDefault();
  const descripcion = document.getElementById('incDescripcionB').value.trim();
  const errorMsg = document.getElementById('incErrorB');

  if(!descripcion || !incidenciaArchivo){
    errorMsg.style.display = 'block';
    return;
  }
  errorMsg.style.display = 'none';

  const registeredAt = new Date();
  const incidencia = {
    tipo: 'No se pudo registrar',
    nombre: '', apellidos: '', cedula: '', telefono: '',
    descripcion,
    media: incidenciaArchivo,
    fecha: registeredAt.toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' }),
    hora: `${pad(registeredAt.getHours())}:${pad(registeredAt.getMinutes())}:${pad(registeredAt.getSeconds())}`
  };

  clearInterval(incidenciaInterval);
  const resultado = guardarIncidencia(incidencia);
  mostrarBadgeIncidencia(incidencia, resultado);
}

/* ---------------- CONFIRMACIÓN ---------------- */
function mostrarBadgeIncidencia(incidencia, resultado){
  if(!resultado.ok){
    incidenciaBody.innerHTML = `
      <div class="error-msg" style="display:block; margin-bottom:16px;">
        No se pudo guardar la incidencia: el archivo adjunto es demasiado pesado para el almacenamiento
        de este dispositivo. Intenta con una foto o un video más liviano (o más corto).
      </div>
      <button class="btn btn-block" id="incRetryBtn">Volver a intentar</button>
    `;
    document.getElementById('incRetryBtn').onclick = resetIncidenciaBody;
    return;
  }

  const nombreCompleto = (incidencia.nombre || incidencia.apellidos)
    ? `${incidencia.nombre} ${incidencia.apellidos}`.trim()
    : 'Sin datos personales';

  incidenciaBody.innerHTML = `
    <div class="badge">
      <div class="badge-stamp">Incidencia registrada</div>
      <div class="badge-row"><span class="k">Tipo</span><span class="v">${incidencia.tipo}</span></div>
      <div class="badge-row"><span class="k">Persona</span><span class="v">${nombreCompleto}</span></div>
      ${incidencia.cedula ? `<div class="badge-row"><span class="k">Cédula</span><span class="v">${incidencia.cedula}</span></div>` : ''}
      ${incidencia.telefono ? `<div class="badge-row"><span class="k">Contacto</span><span class="v">${incidencia.telefono}</span></div>` : ''}
      <div class="badge-row"><span class="k">Hora</span><span class="v badge-time">${incidencia.hora}</span></div>
      <div class="badge-row"><span class="k">Fecha</span><span class="v">${incidencia.fecha}</span></div>
    </div>
    <p class="code-note" style="margin-top:14px;">${incidencia.descripcion}</p>
    <button class="btn btn-block" id="incNewBtn">Reportar otra incidencia</button>
  `;
  document.getElementById('incNewBtn').onclick = resetIncidenciaBody;
}