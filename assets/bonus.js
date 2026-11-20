/* Maps and timeline game. Data comes from window.BONUS. No audio. */
(function () {
  var B = window.BONUS || {};
  var OSM = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function srcLink(u, label) { return u ? ' <a class="src-btn" href="' + u + '" target="_blank" rel="noopener">' + esc(label || 'See the source') + ' ↗</a>' : ''; }
  function baseMap(el, opts) {
    if (!window.L) { el.innerHTML = '<p class="note">The map could not load. The places are listed below.</p>'; return null; }
    var m = L.map(el, { scrollWheelZoom: false, tap: true, zoomSnap: 0.25 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: OSM }).addTo(m);
    return m;
  }
  function pin(n, cls) { return L.divIcon({ className: 'pin ' + (cls || ''), html: '<span>' + n + '</span>', iconSize: [30, 30], iconAnchor: [15, 15] }); }
  // ---------- Tap-through route ----------
  function route(cfg) {
    var box = document.getElementById(cfg.id); if (!box || box.dataset.ready || box.offsetParent === null) return; box.dataset.ready = '1';
    var mapEl = box.querySelector('.map'), card = box.querySelector('.stop-card'), prev = box.querySelector('.prev'), next = box.querySelector('.next-stop'), count = box.querySelector('.stop-count');
    var m = baseMap(mapEl), i = 0, markers = [];
    if (m) {
      L.polyline(cfg.path || cfg.stops.map(function (s) { return s.ll; }), { color: '#8b3a1e', weight: 3, dashArray: '6 8' }).addTo(m);
      cfg.stops.forEach(function (s, k) { var mk = L.marker(s.ll, { icon: pin(k + 1), title: s.name, keyboard: true }).addTo(m); mk.on('click', function () { go(k); }); markers.push(mk); });
      m.fitBounds(L.latLngBounds(cfg.stops.map(function (s) { return s.ll; })), { padding: [30, 30] });
    }
    function go(k) {
      i = Math.max(0, Math.min(cfg.stops.length - 1, k)); var s = cfg.stops[i];
      card.innerHTML = '<p class="stop-date">' + esc(s.date) + '</p><h4>' + esc(s.name) + '</h4><p>' + esc(s.text) + '</p><p class="src">Source. ' + esc(s.src) + srcLink(s.url) + '</p>';
      count.textContent = 'Stop ' + (i + 1) + ' of ' + cfg.stops.length;
      prev.disabled = i === 0; next.disabled = i === cfg.stops.length - 1;
      markers.forEach(function (mk, j) { var el = mk.getElement(); if (el) el.classList.toggle('on', j === i); });
      if (m) m.flyTo(s.ll, s.z || 7, { duration: 0.8 });
    }
    prev.addEventListener('click', function () { go(i - 1); });
    next.addEventListener('click', function () { go(i + 1); });
    box.querySelector('.whole').addEventListener('click', function () { if (m) m.flyToBounds(L.latLngBounds(cfg.stops.map(function (s) { return s.ll; })), { padding: [30, 30], duration: 0.8 }); });
    go(0); if (m) setTimeout(function () { m.invalidateSize(); m.fitBounds(L.latLngBounds(cfg.stops.map(function (s) { return s.ll; })), { padding: [30, 30] }); }, 50);
  }
  // ---------- Places map ----------
  function places(cfg) {
    var box = document.getElementById(cfg.id); if (!box || box.dataset.ready || box.offsetParent === null) return; box.dataset.ready = '1';
    var m = baseMap(box.querySelector('.map')), list = box.querySelector('.place-list');
    var bounds = [];
    cfg.places.forEach(function (p, k) {
      var html = '<p class="stop-date">' + esc(p.date) + '</p><h4>' + esc(p.name) + '</h4><p>' + esc(p.text) + '</p><p class="src">Source. ' + esc(p.src) + srcLink(p.url) + '</p>';
      var li = document.createElement('li'); li.innerHTML = '<button type="button" class="place-btn"><span class="pin-n">' + (k + 1) + '</span> ' + esc(p.name) + ' <small>' + esc(p.date) + '</small></button><div class="place-body" hidden>' + html + '</div>';
      list.appendChild(li);
      var btn = li.querySelector('button'), body = li.querySelector('.place-body');
      var mk = null;
      if (m) { mk = L.marker(p.ll, { icon: pin(k + 1), title: p.name }).addTo(m).bindPopup('<div class="pop">' + html + '</div>', { maxWidth: 260, autoPanPadding: [20, 20] }); bounds.push(p.ll); }
      btn.addEventListener('click', function () { var open = body.hidden; body.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if (open && m && mk) { m.closePopup(); m.once('moveend', function () { mk.openPopup(); }); m.flyTo(p.ll, p.z || 11, { duration: 0.7 }); } });
    });
    if (m) { m.fitBounds(bounds, { padding: [24, 24] }); setTimeout(function () { m.invalidateSize(); m.fitBounds(bounds, { padding: [24, 24] }); }, 50); }
  }
  // ---------- Drag-to-order timeline ----------
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function game(cfg) {
    var box = document.getElementById(cfg.id); if (!box || box.dataset.ready) return; box.dataset.ready = '1';
    var ol = box.querySelector('ol.cards'), msg = box.querySelector('.game-msg');
    function deal() {
      var items = shuffle(cfg.events); var same = items.every(function (e, k) { return e === cfg.events[k]; }); if (same) items.reverse();
      ol.innerHTML = ''; msg.textContent = '';
      items.forEach(function (e) {
        var li = document.createElement('li'); li.className = 'card'; li.dataset.order = cfg.events.indexOf(e);
        li.innerHTML = '<span class="grip" aria-hidden="true">⋮⋮</span><span class="ev">' + esc(e.text) + '<span class="when" hidden> · ' + esc(e.date) + '</span></span><span class="moves"><button type="button" class="up" aria-label="Move earlier">▲</button><button type="button" class="down" aria-label="Move later">▼</button></span>';
        ol.appendChild(li);
      });
    }
    ol.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var li = b.closest('li'); clearMarks();
      if (b.classList.contains('up') && li.previousElementSibling) ol.insertBefore(li, li.previousElementSibling);
      if (b.classList.contains('down') && li.nextElementSibling) ol.insertBefore(li.nextElementSibling, li);
      b.focus();
    });
    var drag = null, startY = 0;
    ol.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return; var li = e.target.closest('li.card'); if (!li) return;
      drag = li; startY = e.clientY; li.classList.add('dragging'); li.setPointerCapture(e.pointerId); clearMarks(); e.preventDefault();
    });
    ol.addEventListener('pointermove', function (e) {
      if (!drag) return; drag.style.transform = 'translateY(' + (e.clientY - startY) + 'px)';
      var sibs = [].slice.call(ol.children).filter(function (x) { return x !== drag; });
      for (var k = 0; k < sibs.length; k++) {
        var r = sibs[k].getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) { if (drag.nextElementSibling !== sibs[k]) { var before = drag.getBoundingClientRect().top; ol.insertBefore(drag, sibs[k]); startY += drag.getBoundingClientRect().top - before; } return; }
      }
      if (ol.lastElementChild !== drag) { var b2 = drag.getBoundingClientRect().top; ol.appendChild(drag); startY += drag.getBoundingClientRect().top - b2; }
    });
    function end() { if (!drag) return; drag.classList.remove('dragging'); drag.style.transform = ''; drag = null; }
    ol.addEventListener('pointerup', end); ol.addEventListener('pointercancel', end);
    function clearMarks() { [].forEach.call(ol.children, function (li) { li.classList.remove('right', 'wrong'); li.querySelector('.when').hidden = true; }); msg.textContent = ''; }
    box.querySelector('.check').addEventListener('click', function () {
      var right = 0; [].forEach.call(ol.children, function (li, k) { var ok = Number(li.dataset.order) === k; li.classList.toggle('right', ok); li.classList.toggle('wrong', !ok); li.querySelector('.when').hidden = false; if (ok) right++; });
      msg.textContent = right + ' of ' + cfg.events.length + ' in the right place.' + (right === cfg.events.length ? ' All in order.' : ' Move the others and check again.');
    });
    box.querySelector('.show').addEventListener('click', function () {
      var lis = [].slice.call(ol.children).sort(function (a, b) { return a.dataset.order - b.dataset.order; });
      lis.forEach(function (li) { ol.appendChild(li); li.classList.add('right'); li.classList.remove('wrong'); li.querySelector('.when').hidden = false; });
      msg.textContent = 'This is the order the records give.';
    });
    box.querySelector('.again').addEventListener('click', deal);
    deal();
  }
  window.initBonus = function () {
    (B.routes || []).forEach(route); (B.places || []).forEach(places); (B.games || []).forEach(game);
  };
})();
