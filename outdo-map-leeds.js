(function(){
if(window.__onmLeedsLoaded) return;   // guard: script included more than once
window.__onmLeedsLoaded = true;
var CFG = window.ONM_CONFIG || {};
var BASE = 'https://raw.githubusercontent.com/DanielOutdo/Leeds-map/main/';
var DATA_URLS = CFG.dataUrl ? [CFG.dataUrl] : [BASE+'routes-data-leeds.json'];

var CSS = ""
+ ".onm{font-family:'Inter',sans-serif;width:100%;box-sizing:border-box}"
+ ".onm *,.onm *:before,.onm *:after{box-sizing:border-box}"
+ ".onm-add-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px;max-width:560px}"
+ ".onm .onm-addbtn,button.onm-addbtn{font:700 15px 'Inter',sans-serif!important;color:#3A383D!important;background:#FFB300!important;border:none!important;border-radius:9999px!important;padding:12px 26px!important;margin:0!important;cursor:pointer;line-height:1.2!important;text-transform:none!important;letter-spacing:normal!important;box-shadow:none!important;transition:background 200ms cubic-bezier(.2,.8,.2,1);white-space:nowrap}"
+ ".onm .onm-addbtn:hover:not(:disabled),button.onm-addbtn:hover:not(:disabled){background:#E69F00!important}"
+ ".onm .onm-addbtn:disabled,button.onm-addbtn:disabled{background:#EDECEE!important;color:#B5B3B8!important;cursor:default}"
+ ".onm-select{flex:1 1 260px;max-width:420px;display:block;margin:0;font:500 15px 'Inter',sans-serif;color:#3A383D;background:#fff;padding:12px 16px;border:1.5px solid #D6D5D8;border-radius:12px;outline:none;cursor:pointer;appearance:none;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%233A383D' stroke-width='2' stroke-linecap='round'><path d='M6 9l6 6 6-6'/></svg>\");background-repeat:no-repeat;background-position:right 16px center}"
+ ".onm-select:focus{border-color:#FFB300}"
+ ".onm-picked{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px;align-items:center}"
+ ".onm-pill{display:inline-flex;align-items:center;gap:8px;font:500 14px 'Inter',sans-serif;color:#3A383D;background:#fff;border:1.5px solid #D6D5D8;border-radius:9999px;padding:7px 8px 7px 14px}"
+ ".onm-pill i{width:10px;height:10px;border-radius:9999px;flex:none;display:inline-block}"
+ ".onm-pill button{width:22px;height:22px;border:none;border-radius:9999px;background:#F6F5F7;color:#3A383D;font:700 13px 'Inter',sans-serif;line-height:1;cursor:pointer;flex:none}"
+ ".onm-pill button:hover{background:#FFB300}"
+ ".onm-clear{font:500 14px 'Inter',sans-serif;color:#6B6970;background:none;border:none;cursor:pointer;text-decoration:underline;padding:7px 4px}"
+ ".onm-clear:hover{color:#3A383D}"
+ ".onm-city{font:700 22px 'Bricolage Grotesque','Inter',sans-serif;letter-spacing:-.01em;color:#3A383D;white-space:nowrap;text-shadow:0 0 5px #fff,0 0 5px #fff,0 0 8px #fff,0 0 12px #fff;pointer-events:none}"
+ ".onm-map{width:100%;height:560px;border-radius:20px;overflow:hidden;border:1px solid #D6D5D8;background:#F6F5F7}"
+ "@media(max-width:640px){.onm-map{height:420px}}"
+ ".onm-map .leaflet-container{font-family:'Inter',sans-serif}"
+ ".onm-map .leaflet-control-attribution{background:rgba(255,255,255,.55)!important;font:400 9px 'Inter',sans-serif!important;color:#B5B3B8!important;padding:1px 5px!important;border-radius:6px 0 0 0!important;box-shadow:none!important}"
+ ".onm-map .leaflet-control-attribution a{color:#B5B3B8!important;text-decoration:none!important}"
+ ".onm-map .leaflet-control-attribution svg,.onm-map .leaflet-attribution-flag{display:none!important}"
+ ".onm-map .leaflet-pane img,.onm-map .leaflet-tile,.onm-map img.leaflet-image-layer{max-width:none!important;max-height:none!important;width:auto;padding:0!important;border:0!important}"
+ ".onm-map .leaflet-tile{margin:0!important}"
+ ".onm-map .leaflet-tooltip{background:#fff;color:#3A383D;border:1px solid #D6D5D8;border-radius:12px;padding:10px 16px;font:700 17px/1.3 'Inter',sans-serif;box-shadow:0 4px 14px rgba(58,56,61,.18);white-space:nowrap}";
var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

// Ensure Leaflet is present (Webflow can run embed scripts out of order)
function withLeaflet(cb){
  if(window.L && window.L.map) return cb();
  if(!document.querySelector('script[data-onm-leaflet]')){
    var s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.setAttribute('data-onm-leaflet','1');
    document.head.appendChild(s);
    if(!document.querySelector('link[href*="leaflet.css"]')){
      var lk = document.createElement('link'); lk.rel='stylesheet';
      lk.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(lk);
    }
  }
  var tries = 0;
  (function wait(){
    if(window.L && window.L.map) return cb();
    if(++tries > 100) return console.error('Outdo map: Leaflet failed to load');
    setTimeout(wait, 100);
  })();
}

var started = false;
function start(){
  if(started) return; started = true;
  var i = 0;
  (function tryNext(){
    if(i >= DATA_URLS.length){ console.error('Outdo map: could not load route data'); return; }
    var u = DATA_URLS[i++];
    fetch(u).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(d){ withLeaflet(function(){ init(d); }); })
      .catch(function(e){ console.warn('Outdo map: failed '+u, e); tryNext(); });
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
var picked = [], preview = null, layers = {}, map, home, cityLbl;
var mapEl = document.getElementById('onm-map');
var selectEl = document.getElementById('onm-select');
var pickedEl = document.getElementById('onm-picked');
var addBtn = document.getElementById('onm-add');

function byId(id){ for(var i=0;i<groups.length;i++) if(groups[i].id===id) return groups[i]; return null; }
function label(g){ return g.lines.join('/') + ' — ' + g.dest + ' (' + g.colorName + ')'; }
function short(g){ return g.colorName + ' (' + g.lines.join('/') + ')'; }
function has(id){ return picked.indexOf(id) !== -1; }
function toggle(id){ var i = picked.indexOf(id); if(i===-1) picked.push(id); else picked.splice(i,1); sync(); }

// Restore selection from ?routes=
try {
  var qs = new URLSearchParams(window.location.search).get('routes');
  if(qs) qs.split(',').forEach(function(id){ if(byId(id) && !has(id)) picked.push(id); });
} catch(e){}

// --- Map ---
if(mapEl._leaflet_id){ console.warn('Outdo map: container already initialised'); return; }
map = L.map(mapEl, { scrollWheelZoom:true, attributionControl:false });
L.control.attribution({prefix:false, position:'bottomright'}).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  { maxZoom:18, attribution:'&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
cityLbl = L.marker([53.7965,-1.5478], { interactive:false, icon: L.divIcon({
  className:'', html:'<div class="onm-city">Leeds</div>', iconSize:[0,0], iconAnchor:[-10,10]
})});
function toggleCity(){
  if(map.getZoom() >= 12){ if(map.hasLayer(cityLbl)) map.removeLayer(cityLbl); }
  else if(!map.hasLayer(cityLbl)) cityLbl.addTo(map);
}
map.on('zoomend', toggleCity);

groups.forEach(function(c){
  var casing = L.polyline(c.coords,{color:'#FFFFFF',weight:8,lineCap:'round'}).addTo(map);
  var main = L.polyline(c.coords,{color:c.color,weight:4,lineCap:'round'}).addTo(map);
  var hit = L.polyline(c.coords,{color:'#000',opacity:0,weight:18}).addTo(map);
  var pick = function(e){ if(e && e.originalEvent) e.originalEvent._stopped = true;
    if(has(c.id)) toggle(c.id); else { preview = (preview===c.id) ? null : c.id; sync(); } };
  main.on('click',pick); hit.on('click',pick);
  hit.bindTooltip(c.colorName+' ('+c.lines.join('/')+') — '+c.dest,{sticky:true});
  layers[c.id] = {casing:casing, main:main};
});
home = L.latLngBounds([[53.735,-1.72],[53.895,-1.38]]); // Leeds district
map.fitBounds(home,{padding:[24,24]});
function refit(){ map.invalidateSize(); if(!picked.length && !preview) map.fitBounds(home,{padding:[24,24]}); }
toggleCity();
setTimeout(refit,200); setTimeout(refit,600); setTimeout(refit,1200);
window.addEventListener('resize',refit);
if('ResizeObserver' in window) new ResizeObserver(refit).observe(mapEl);

// --- Dropdown adds a route ---
function renderSelect(){
  if(!selectEl) return;
  var html = '<option value="">Choose a route…</option>';
  groups.forEach(function(g){
    if(!has(g.id)) html += '<option value="'+g.id+'">'+label(g)+'</option>';
  });
  selectEl.innerHTML = html;
  selectEl.value = (preview && !has(preview)) ? preview : '';
}
if(selectEl) selectEl.addEventListener('change', function(){ preview = this.value || null; sync(); });
if(addBtn) addBtn.addEventListener('click', function(){
  if(preview && !has(preview)){ picked.push(preview); preview = null; sync(); }
});

// --- Selected pills ---
function renderPicked(){
  if(!pickedEl) return;
  if(!picked.length){ pickedEl.innerHTML = ''; return; }
  var html = '';
  picked.forEach(function(id){
    var g = byId(id); if(!g) return;
    html += '<span class="onm-pill"><i style="background:'+g.color+'"></i>'+short(g)
         +  '<button type="button" data-id="'+g.id+'" aria-label="Remove">✕</button></span>';
  });
  if(picked.length > 1) html += '<button type="button" class="onm-clear" data-clear="1">Clear all</button>';
  pickedEl.innerHTML = html;
}
if(pickedEl) pickedEl.addEventListener('click', function(e){
  var b = e.target.closest('button'); if(!b) return;
  if(b.getAttribute('data-clear')){ picked = []; sync(); }
  else if(b.getAttribute('data-id')) toggle(b.getAttribute('data-id'));
});

map.on('click', function(){ if(preview){ preview = null; sync(); } else if(picked.length){ picked = []; sync(); } });

function sync(){
  var any = picked.length > 0 || !!preview;
  groups.forEach(function(c){
    var l = layers[c.id], on = has(c.id) || preview===c.id;
    l.main.setStyle({opacity: any && !on ? 0.25 : 1, weight: on ? 7 : 4});
    l.casing.setStyle({opacity: any && !on ? 0.3 : 0.9, weight: on ? 11 : 8});
    if(on){ l.casing.bringToFront(); l.main.bringToFront(); }
  });
  try{
    var pts = [];
    picked.forEach(function(id){ var g = byId(id); if(g) pts = pts.concat(g.coords); });
    if(preview){ var pg = byId(preview); if(pg) pts = pts.concat(pg.coords); }
    if(pts.length) map.fitBounds(L.latLngBounds(pts), {padding:[50,50], maxZoom:13});
    else map.fitBounds(home,{padding:[24,24]});
  }catch(e){}
  if(addBtn){
    var pg2 = preview ? byId(preview) : null;
    addBtn.disabled = !pg2 || has(preview);
    addBtn.textContent = pg2 && !has(preview) ? 'Add '+short(pg2) : 'Add route';
  }
  renderSelect(); renderPicked();
  try {
    var url = new URL(window.location.href);
    if(picked.length) url.searchParams.set('routes', picked.join(',')); else url.searchParams.delete('routes');
    window.history.replaceState(null, '', url);
  } catch(e){}
  push();
}

// --- Push selection into any form on the page ---
function push(){
  var names = picked.map(function(id){ var g = byId(id); return g ? short(g)+' — '+g.dest : ''; }).filter(Boolean);
  var areas = [];
  picked.forEach(function(id){ var g = byId(id); if(g && areas.indexOf(g.area)===-1) areas.push(g.area); });
  var vals = {
    'Selected-Route': names.length ? names.join('; ') : 'Whole Leeds network',
    'Route-Area': areas.length ? areas.join(', ')+' Leeds' : 'All areas'
  };
  Object.keys(vals).forEach(function(k){
    var els = document.querySelectorAll('input[name="'+k+'"], select[name="'+k+'"], textarea[name="'+k+'"]');
    for(var i=0;i<els.length;i++){ els[i].value = vals[k]; els[i].dispatchEvent(new Event('input',{bubbles:true})); }
  });
  var lbls = document.querySelectorAll('#onm-selected, [onm-selected]');
  for(var j=0;j<lbls.length;j++) lbls[j].textContent = vals['Selected-Route'];
}

sync();
}
})();
