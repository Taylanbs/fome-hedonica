// ════════════════════════════════════════════════
//  LANY · UTILS
// ════════════════════════════════════════════════

var Utils = {

  // Formatar data
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

  // Hora atual
  horaAgora: function() {
    return new Date().toTimeString().slice(0, 5);
  },

  // Toast
  toast: function(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
  },

  // Chips — múltipla seleção
  toggleChip: function(el) {
    el.classList.toggle('selected');
  },

  // Chips — seleção única
  toggleSingle: function(el, groupId) {
    document.querySelectorAll('#' + groupId + ' .chip').forEach(function(c) {
      c.classList.remove('selected');
    });
    el.classList.add('selected');
  },

  // Ler chips selecionados
  getChips: function(groupId) {
    return Array.from(document.querySelectorAll('#' + groupId + ' .chip.selected'))
      .map(function(c) { return c.textContent.trim(); });
  },

  // Limpar chips
  clearChips: function(groupId) {
    document.querySelectorAll('#' + groupId + ' .chip').forEach(function(c) {
      c.classList.remove('selected');
    });
  },

  // Rating buttons
  selectRating: function(ratings, type, val) {
    ratings[type] = val;
    for (var i = 1; i <= 5; i++) {
      var btn = document.getElementById(type + '-r' + i);
      if (btn) btn.classList.toggle('selected', i === val);
    }
  },

  // Sync status
  setSyncStatus: function(elId, type, msg) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.style.display = 'flex';
    var clsMap = { ok: 'sync-ok', err: 'sync-err', loading: 'sync-loading' };
    var dotMap = { ok: 'dot-ok', err: 'dot-err', loading: 'dot-loading' };
    el.className = 'sync-status ' + clsMap[type];
    el.innerHTML = '<div class="sync-dot ' + dotMap[type] + '"></div><span>' + msg + '</span>';
  },

  // Slider
  updateSlider: function(el, valId) {
    var pct = el.value * 10;
    el.style.background = 'linear-gradient(to right, var(--teal) ' + pct + '%, rgba(58,173,171,0.2) ' + pct + '%)';
    if (valId) document.getElementById(valId).textContent = el.value;
  },

  // Chamada ao Apps Script
  post: function(payload, callback) {
    fetch(CONFIG.GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function() {
      // no-cors retorna opaque — assumimos sucesso
      if (callback) callback(null, { ok: true });
    })
    .catch(function(err) {
      if (callback) callback(err, null);
    });
  },

  get: function(params, callback) {
    var qs = Object.keys(params)
      .map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
      .join('&');
    fetch(CONFIG.GAS_URL + '?' + qs)
      .then(function(r) { return r.json(); })
      .then(function(data) { if (callback) callback(null, data); })
      .catch(function(err) { if (callback) callback(err, null); });
  },

  // Tabs
  showTab: function(id, btn, prefix) {
    prefix = prefix || 'tab-';
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    var sec = document.getElementById(prefix + id);
    if (sec) sec.classList.add('active');
    if (btn) btn.classList.add('active');
  },

  // LocalStorage helpers
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
