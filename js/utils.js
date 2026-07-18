// ════════════════════════════════════════════════
//  LANY · UTILS
// ════════════════════════════════════════════════

var Utils = {

  fmtDate: function(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  },

  fmtDateTime: function(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },

  horaAgora: function() {
    return new Date().toTimeString().slice(0, 5);
  },

  toast: function(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
  },

  toggleChip: function(el) { el.classList.toggle('selected'); },

  toggleSingle: function(el, groupId) {
    document.querySelectorAll('#' + groupId + ' .chip').forEach(function(c) {
      c.classList.remove('selected');
    });
    el.classList.add('selected');
  },

  getChips: function(groupId) {
    return Array.from(document.querySelectorAll('#' + groupId + ' .chip.selected'))
      .map(function(c) { return c.textContent.trim(); });
  },

  clearChips: function(groupId) {
    document.querySelectorAll('#' + groupId + ' .chip').forEach(function(c) {
      c.classList.remove('selected');
    });
  },

  selectRating: function(ratings, type, val) {
    ratings[type] = val;
    for (var i = 1; i <= 5; i++) {
      var btn = document.getElementById(type + '-r' + i);
      if (btn) btn.classList.toggle('selected', i === val);
    }
  },

  setSyncStatus: function(elId, type, msg) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.style.display = 'flex';
    var clsMap = { ok: 'sync-ok', err: 'sync-err', loading: 'sync-loading' };
    var dotMap = { ok: 'dot-ok', err: 'dot-err', loading: 'dot-loading' };
    el.className = 'sync-status ' + clsMap[type];
    el.innerHTML = '<div class="sync-dot ' + dotMap[type] + '"></div><span>' + msg + '</span>';
  },

  updateSlider: function(el, valId) {
    var pct = el.value * 10;
    el.style.background = 'linear-gradient(to right, var(--teal) ' + pct + '%, rgba(58,173,171,0.2) ' + pct + '%)';
    if (valId) document.getElementById(valId).textContent = el.value;
  },

  // ── POST via fetch no-cors (fire-and-forget) ──
  post: function(payload, callback) {
    fetch(CONFIG.GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function() {
      if (callback) callback(null, { ok: true });
    })
    .catch(function(err) {
      if (callback) callback(err, null);
    });
  },

  // ── GET via JSONP — resolve CORS com Apps Script ──
  get: function(params, callback) {
    var cbName = 'lany_cb_' + Date.now();
    params.callback = cbName;

    var qs = Object.keys(params)
      .map(function(k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      })
      .join('&');

    var script = document.createElement('script');
    script.src = CONFIG.GAS_URL + '?' + qs;

    var timeout = setTimeout(function() {
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
      if (callback) callback(new Error('Timeout'), null);
    }, 15000);

    window[cbName] = function(data) {
      clearTimeout(timeout);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
      if (callback) callback(null, data);
    };

    document.head.appendChild(script);
  },

  showTab: function(id, btn, prefix) {
    prefix = prefix || 'tab-';
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    var sec = document.getElementById(prefix + id);
    if (sec) sec.classList.add('active');
    if (btn) btn.classList.add('active');
  },

  salvarLocal: function(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
  },

  lerLocal: function(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch(e) { return fallback; }
  }
};
