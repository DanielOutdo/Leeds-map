(function(){
var CFG = window.ONM_CONFIG || {};
var BASE = 'https://raw.githubusercontent.com/danielbeorigionalmarketing-web/Nottingham-map/main/';
var DATA_URLS = CFG.dataUrl ? [CFG.dataUrl] : [BASE+'routes-data-leeds.json'];

var CSS = ""
+ ".onm{font-family:'Inter',sans-serif;width:100%;box-sizing:border-box}"
+ ".onm *,.onm *:before,.onm *:after{box-sizing:border-box}"
+ ".onm-select{width:100%;max-width:420px;display:block;margin:0 0 16px;font:500 15px 'Inter',sans-serif;color:#3A383D;background:#fff;padding:12px 16px;border:1.5px solid #D6D5D8;border-radius:12px;outline:none;cursor:pointer;appearance:none;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%233A383D' stroke-width='2' stroke-linecap='round'><path d='M6 9l6 6 6-6'/></svg>\");background-repeat:no-repeat;background-position:right 16px center}"
+ ".onm-select:focus{border-color:#FFB300}"
+ ".onm-map{width:100%;height:560px;border-radius:20px;overflow:hidden;border:1px solid #D6D5D8;background:#F6F5F7}"
+ "@media(max-width:640px){.onm-map{height:420px}}"
+ ".onm-map .leaflet-container{font-family:'Inter',sans-serif}"
+ ".onm-map .leaflet-pane img,.onm-map .leaflet-tile,.onm-map img.leaflet-image-layer{max-width:none!important;max-height:none!important;width:auto;padding:0!important;border:0!important}"
+ ".onm-map .leaflet-tile{margin:0!important}"
+ ".onm-city{font:700 22px 'Bricolage Grotesque','Inter',sans-serif;letter-spacing:-.01em;color:#3A383D;white-space:nowrap;text-shadow:0 0 5px #fff,0 0 5px #fff,0 0 8px #fff,0 0 12px #fff;pointer-events:none}"
+ ".onm-map .leaflet-tooltip{background:#fff;color:#3A383D;border:1px solid #D6D5D8;border-radius:12px;padding:10px 16px;font:700 17px/1.3 'Inter',sans-serif;box-shadow:0 4px 14px rgba(58,56,61,.18);white-space:nowrap}";
var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

var started = false;
function start(){
  if(started) return; started = true;
  var i = 0;
  (function tryNext(){
    if(i >= DATA_URLS.length){ console.error('Outdo map: could not load route data'); return; }
    var u = DATA_URLS[i++];
    fetch(u).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(init).catch(function(e){ console.warn('Outdo map: failed '+u, e); tryNext(); });
  })();
}
function arm(tries){
  var el = document.getElementById('onm-map');
  if(!el){ if(tries>0) setTimeout(function(){ arm(tries-1); },200); else console.error('Outdo map: #onm-map not found'); return; }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(en){ if(en[0].isIntersecting){ io.disconnect(); start(); } },{rootMargin:'400px'});
    io.observe(el);
  } else start();
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ arm(25); });
else arm(25);

function init(DATA){
var groups = (DATA.groups||[]).slice().sort(function(a,b){
  return a.lines[0].localeCompare(b.lines[0], undefined, {numeric:true});
});
var sel = null, layers = {}, map, home;
var mapEl = document.getElementById('onm-map');
var selectEl = document.getElementById('onm-select');

function label(g){ return g.lines.join('/') + ' — ' + g.dest + ' (' + g.colorName + ')'; }
function summary(g){ return g ? g.colorName+' ('+g.lines.join('/')+') — '+g.dest : 'Whole Leeds network'; }
function cur(){ for(var i=0;i<groups.length;i++) if(groups[i].id===sel) return groups[i]; return null; }

// --- Selector ---
if(selectEl){
  var html = '<option value="">All routes — whole Leeds network</option>';
  groups.forEach(function(g){ html += '<option value="'+g.id+'">'+label(g)+'</option>'; });
  selectEl.innerHTML = html;
  selectEl.addEventListener('change', function(){ sel = this.value || null; sync(); });
}

// --- Map ---
map = L.map(mapEl, { scrollWheelZoom:true });
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  { maxZoom:18, attribution:'&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
var cityLbl = L.marker([53.7965,-1.5478], { interactive:false, icon: L.divIcon({
  className:'', html:'<div class="onm-city">Leeds</div>', iconSize:[0,0], iconAnchor:[-10,10]
})});
function toggleCity(){
  // Hide our label once the basemap shows its own place names
  if(map.getZoom() >= 12){ if(map.hasLayer(cityLbl)) map.removeLayer(cityLbl); }
  else if(!map.hasLayer(cityLbl)) cityLbl.addTo(map);
}
map.on('zoomend', toggleCity);
var all = [];
groups.forEach(function(c){
  c.coords.forEach(function(p){ all.push(p); });
  var casing = L.polyline(c.coords,{color:'#FFFFFF',weight:8,lineCap:'round'}).addTo(map);
  var main = L.polyline(c.coords,{color:c.color,weight:4,lineCap:'round'}).addTo(map);
  var hit = L.polyline(c.coords,{color:'#000',opacity:0,weight:18}).addTo(map);
  var pick = function(e){ if(e && e.originalEvent) e.originalEvent._stopped = true; sel = (sel===c.id)?null:c.id; sync(); };
  main.on('click',pick); hit.on('click',pick);
  hit.bindTooltip(c.colorName+' ('+c.lines.join('/')+') — '+c.dest,{sticky:true});
  layers[c.id] = {casing:casing, main:main};
});
home = L.latLngBounds([[53.735,-1.72],[53.895,-1.38]]); // Leeds district
map.fitBounds(home,{padding:[24,24]});
map.on('click',function(){ if(sel){ sel = null; sync(); } });
function refit(){ map.invalidateSize(); if(!sel) map.fitBounds(home,{padding:[24,24]}); }
toggleCity();
setTimeout(refit,200); setTimeout(refit,600); setTimeout(refit,1200);
window.addEventListener('resize',refit);
if('ResizeObserver' in window) new ResizeObserver(refit).observe(mapEl);

function sync(){
  groups.forEach(function(c){
    var l = layers[c.id], isSel = sel===c.id;
    l.main.setStyle({opacity: sel&&!isSel?0.35:1, weight:isSel?7:4});
    l.casing.setStyle({opacity: sel&&!isSel?0.4:0.9, weight:isSel?11:8});
    if(isSel){ l.casing.bringToFront(); l.main.bringToFront(); }
  });
  try{
    var g = cur();
    if(g) map.fitBounds(L.latLngBounds(g.coords),{padding:[50,50],maxZoom:13});
    else map.fitBounds(home,{padding:[24,24]});
  }catch(e){}
  if(selectEl) selectEl.value = sel || '';
  push();
}

// --- Push selection into any form on the page ---
function push(){
  var g = cur();
  var vals = {
    'Selected-Route': summary(g),
    'Route-Area': g ? g.area+' Leeds' : 'All areas'
  };
  Object.keys(vals).forEach(function(k){
    var els = document.querySelectorAll('input[name="'+k+'"], select[name="'+k+'"], textarea[name="'+k+'"]');
    for(var i=0;i<els.length;i++){ els[i].value = vals[k]; els[i].dispatchEvent(new Event('input',{bubbles:true})); }
  });
  var txt = g ? summary(g) : 'Whole Leeds network';
  var lbls = document.querySelectorAll('#onm-selected, [onm-selected]');
  for(var j=0;j<lbls.length;j++) lbls[j].textContent = txt;
}

sync();
}
})();
