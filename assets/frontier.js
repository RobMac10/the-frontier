/* The Frontier: timeline map, reveal cards, word cards, pattern. No audio. */
(function () {
  var F = window.FR || {};
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function link(u) { return u ? ' <a class="src-btn" href="' + u + '" target="_blank" rel="noopener">See the source ↗</a>' : ''; }
  // ---------- Frontier map with year slider ----------
  function fmap() {
    var box = document.getElementById('fmap'); if (!box || box.dataset.ready || box.offsetParent === null) return; box.dataset.ready = '1';
    var pts = (F.map || []).slice().sort(function (a, b) { return a.y - b.y; });
    var range = box.querySelector('.fmap-range'), yearEl = box.querySelector('.fmap-year'), list = box.querySelector('.fmap-list');
    var play = box.querySelector('.play'), all = box.querySelector('.all'), m = null, timer = null, items = [];
    if (window.L) {
      m = L.map(box.querySelector('.map'), { scrollWheelZoom: false, tap: true, zoomSnap: 0.25 });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' }).addTo(m);
      m.fitBounds([[-43.5, 114], [-23, 154]], { padding: [10, 10] });
    } else { box.querySelector('.map').innerHTML = '<p class="note">The map could not load. The places are listed below.</p>'; }
    pts.forEach(function (p, k) {
      var html = '<p class="stop-date">' + esc(p.date) + ' · ' + esc((F.types || {})[p.t] || '') + '</p><h4>' + esc(p.name) + '</h4><p>' + esc(p.text) + '</p><p class="src">Source. ' + esc(p.src) + link(p.url) + '</p>';
      var li = document.createElement('li'); li.className = 'fl t-' + p.t;
      li.innerHTML = '<button type="button" class="place-btn" aria-expanded="false"><span class="pin-n t-' + p.t + '">' + (k + 1) + '</span> ' + esc(p.name) + ' <small>' + esc(p.date) + '</small></button><div class="place-body" hidden>' + html + '</div>';
      list.appendChild(li);
      var mk = null;
      if (m) { mk = L.marker(p.ll, { icon: L.divIcon({ className: 'pin fpin t-' + p.t, html: '<span>' + (k + 1) + '</span>', iconSize: [28, 28], iconAnchor: [14, 14] }), title: p.name }).bindPopup('<div class="pop">' + html + '</div>', { maxWidth: 270, autoPanPadding: [20, 20] }); }
      var btn = li.querySelector('button'), body = li.querySelector('.place-body');
      btn.addEventListener('click', function () {
        var open = body.hidden; body.hidden = !open; btn.setAttribute('aria-expanded', String(open));
        if (open && m && mk) { stop(); if (Number(range.value) < p.y) { range.value = Math.ceil(p.y); update(); } m.closePopup(); m.once('moveend', function () { mk.openPopup(); }); m.flyTo(p.ll, 8, { duration: 0.7 }); }
      });
      items.push({ p: p, li: li, mk: mk });
    });
    function update() {
      var y = Number(range.value); yearEl.textContent = y >= Number(range.max) ? 'All years' : String(y);
      var shown = 0;
      items.forEach(function (it) {
        var on = it.p.y < y + 1; it.li.classList.toggle('off', !on); if (on) shown++;
        if (m && it.mk) { if (on && !m.hasLayer(it.mk)) it.mk.addTo(m); if (!on && m.hasLayer(it.mk)) m.removeLayer(it.mk); }
      });
      box.dataset.shown = shown;
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Play'; } }
    play.addEventListener('click', function () {
      if (timer) { stop(); return; }
      if (Number(range.value) >= Number(range.max)) range.value = range.min;
      play.textContent = '❚❚ Pause';
      timer = setInterval(function () { var v = Number(range.value) + 1; range.value = v; update(); if (v >= Number(range.max)) stop(); }, 450);
    });
    all.addEventListener('click', function () { stop(); range.value = range.max; update(); if (m) m.fitBounds([[-43.5, 114], [-23, 154]], { padding: [10, 10] }); });
    range.addEventListener('input', function () { stop(); update(); });
    update();
    if (m) setTimeout(function () { m.invalidateSize(); m.fitBounds([[-43.5, 114], [-23, 154]], { padding: [10, 10] }); }, 60);
  }
  // ---------- Reveal the record ----------
  [].forEach.call(document.querySelectorAll('.pair .reveal'), function (b) {
    b.addEventListener('click', function () {
      var rec = b.parentNode.querySelector('.rec'); var open = rec.hidden; rec.hidden = !open;
      b.setAttribute('aria-expanded', String(open)); b.textContent = open ? 'Hide the record' : 'Reveal the record';
    });
  });
  // ---------- Word cards ----------
  [].forEach.call(document.querySelectorAll('.wflip'), function (b) {
    b.addEventListener('click', function () {
      var back = b.parentNode.querySelector('.wback'); var open = back.hidden; back.hidden = !open;
      b.setAttribute('aria-expanded', String(open)); b.parentNode.classList.toggle('open', open);
      var t = b.querySelector('.tap'); if (t) t.textContent = open ? 'Tap to close' : 'Tap to decode';
    });
  });
  // ---------- My pattern ----------
  var pb = document.querySelector('.show-pattern');
  if (pb) pb.addEventListener('click', function () {
    var labels = { match: 'Matches', partly: 'Partly', no: 'Does not match', cantknow: 'We can’t know' }, counts = { match: 0, partly: 0, no: 0, cantknow: 0 }, total = 0, missing = [];
    [].forEach.call(document.querySelectorAll('.pair'), function (pr) {
      var c = pr.querySelector('input[type=radio]:checked'); if (c) { counts[c.value]++; total++; } else missing.push(pr.querySelector('h3').textContent);
    });
    var out = document.querySelector('.pattern-out'), html = '<div class="bars">';
    Object.keys(labels).forEach(function (k) { var w = total ? Math.round(100 * counts[k] / 8) : 0; html += '<div class="bar-row"><span class="bar-lab">' + labels[k] + '</span><span class="bar"><i class="b-' + k + '" style="width:' + w + '%"></i></span><span class="bar-n">' + counts[k] + '</span></div>'; });
    html += '</div>';
    html += missing.length ? '<p class="note">Still to judge: ' + missing.map(esc).join(', ') + '.</p>' : '<p class="note">All eight judged.</p>';
    out.innerHTML = html;
  });
  // ---------- Hook into tab changes ----------
  var prev = window.initBonus;
  window.initBonus = function () { if (prev) prev(); fmap(); };
})();
