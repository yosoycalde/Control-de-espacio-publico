/* ---------------- MAPA ---------------- */
const map = L.map('map', { zoomControl: true }).setView([5.0689, -75.5174], 15); // Manizales, Colombia (ajusta si tu ciudad es otra)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

const hivisIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#3B82F6;border:2px solid #0F1A26;transform:rotate(-45deg);box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
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