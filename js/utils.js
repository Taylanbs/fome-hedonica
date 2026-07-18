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

  // ── POST via form submit — contorna CORS completamente ──
  post: function(payload, callback) {
    // Cria um form oculto que faz POST direto ao GAS
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = CONFIG.GAS_URL;
    form.target = 'lany_post_frame_' + Date.now();
    form.style.display = 'none';

    // Serializa payload como campo oculto
    var input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = 'payload';
    input.value = JSON.stringify(payload);
    form.appendChild(input);

    // Iframe oculto para receber resposta
    var frameName = form.target;
    var iframe = document.createElement('iframe');
    iframe.name  = frameName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    document.body.appendChild(form);

    iframe.onload = function() {
      setTimeout(function() {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        if (form.parentNode)   form.parentNode.removeChild(form);
      }, 1000);
      if (callback) callback(null, { ok: true });
    };

    form.submit();
  },

  // ── GET via fetch direto — GAS público aceita com redirect ──
  get: function(params, callback) {
    var qs = Object.keys(params)
      .map(function(k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      })
      .join('&');

    var url = CONFIG.GAS_URL + '?' + qs;

    fetch(url, {
      method: 'GET',
      redirect: 'follow'
    })
    .then(function(r) {
      // GAS redireciona — pegar o texto da resposta final
      return r.text();
    })
    .then(function(text) {
      // Limpar possível wrapper JSONP
      var clean = text.trim();
      if (clean.startsWith('lany_cb')) {
        clean = clean.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '');
      }
      var data = JSON.parse(clean);
      if (callback) callback(null, data);
    })
    .catch(function(err) {
      console.error('GET error:', err);
      if (callback) callback(err, null);
    });
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
