// ════════════════════════════════════════════════
//  LANY · APP.JS — Diário do paciente
// ════════════════════════════════════════════════

var App = {
  pacienteId:   null,
  pacienteNome: null,
  ratings: { week: 0, food: 0 }
};

// ── INIT ──
document.addEventListener('DOMContentLoaded', function() {
  var params = new URLSearchParams(window.location.search);
  var idURL  = params.get('id');

  if (idURL) {
    App.validarPaciente(idURL.toUpperCase().trim());
  } else {
    var idLocal = localStorage.getItem('lany_pac_id');
    if (idLocal) {
      App.iniciarSessao(idLocal, localStorage.getItem('lany_pac_nome') || '');
    } else {
      App.mostrarErro('Link inválido. Solicite um novo link à sua nutricionista.');
    }
  }
});

App.validarPaciente = function(id) {
  document.getElementById('loading-screen').style.display = 'flex';

  // Salvar localmente antes mesmo de validar
  // para que funcione offline após primeiro acesso
  var cachedNome = localStorage.getItem('lany_pac_nome_' + id);
  if (cachedNome) {
    App.iniciarSessao(id, cachedNome);
    return;
  }

  Utils.get({ acao: 'getPaciente', pacienteId: id }, function(err, data) {
    console.log('Resposta GAS:', err, data);

    if (err) {
      console.error('Erro na requisição:', err);
      App.mostrarErro('Erro de conexão. Tente novamente.');
      return;
    }

    if (!data || !data.ok) {
      App.mostrarErro('Código não encontrado. Verifique o link com sua nutricionista.');
      return;
    }

    localStorage.setItem('lany_pac_id', data.id);
    localStorage.setItem('lany_pac_nome', data.nome);
    localStorage.setItem('lany_pac_nome_' + data.id, data.nome);
    App.iniciarSessao(data.id, data.nome);
  });
};

App.iniciarSessao = function(id, nome) {
  App.pacienteId   = id;
  App.pacienteNome = nome;

  document.getElementById('loading-screen').style.display  = 'none';
  document.getElementById('erro-screen').style.display     = 'none';
  document.getElementById('app').style.display             = 'block';

  document.getElementById('header-id').textContent = id;
  var saudacao = document.getElementById('header-saudacao');
  if (saudacao && nome) saudacao.textContent = 'Olá, ' + nome.split(' ')[0] + ' 🌿';

  var timeEl = document.getElementById('reg-time');
  if (timeEl) timeEl.value = Utils.horaAgora();
};

App.mostrarErro = function(msg) {
  document.getElementById('loading-screen').style.display = 'none';
  var errEl = document.getElementById('erro-screen');
  if (errEl) {
    errEl.style.display = 'flex';
    var msgEl = document.getElementById('erro-msg');
    if (msgEl) msgEl.textContent = msg;
  }
};

// ── TABS ──
function showTab(id, btn) {
  Utils.showTab(id, btn, 'tab-');
  if (id === 'historico') App.renderHistory();
  if (id === 'insights')  App.renderInsights();
}

function toggleChip(el)        { Utils.toggleChip(el); }
function toggleSingle(el, gId) { Utils.toggleSingle(el, gId); }
function updateSlider(el)      { Utils.updateSlider(el, 'intensity-val'); }
function selectRating(type, val) { Utils.selectRating(App.ratings, type, val); }

// ── SALVAR REGISTRO ──
function salvarRegistro() {
  if (!App.pacienteId) { Utils.toast('Sessão inválida.'); return; }

  var emocoes = Utils.getChips('emotion-chips');
  var outraEm = document.getElementById('reg-emotion-other').value.trim();
  if (outraEm) emocoes.push(outraEm);

  var payload = {
    acao:        'salvarRegistro',
    pacienteId:  App.pacienteId,
    horario:     document.getElementById('reg-time').value,
    vontade:     document.getElementById('reg-food').value.trim(),
    contexto:    document.getElementById('reg-context').value.trim(),
    emocoes:     emocoes,
    intensidade: document.getElementById('reg-intensity').value,
    ambiente:    (Utils.getChips('env-chips')[0] || ''),
    comoLidou:   (Utils.getChips('action-chips')[0] || document.getElementById('reg-action-other').value.trim()),
    alternativa: document.getElementById('reg-alternative').value.trim()
  };

  if (!payload.vontade && !payload.contexto) {
    Utils.toast('Preencha ao menos a vontade ou o contexto ✨');
    return;
  }

  // Salvar localmente sempre
  var local = Utils.lerLocal('lany_entries_' + App.pacienteId, []);
  local.unshift(Object.assign({}, payload, { date: new Date().toISOString(), id: Date.now() }));
  Utils.salvarLocal('lany_entries_' + App.pacienteId, local);

  var btn = document.getElementById('save-btn');
  btn.disabled = true; btn.textContent = '⏳ Salvando…';
  Utils.setSyncStatus('sync-status', 'loading', 'Enviando para a nutricionista…');

  Utils.post(payload, function(err) {
    btn.disabled = false; btn.textContent = '💾 Salvar Registro';
    if (err) {
      Utils.setSyncStatus('sync-status', 'err', 'Salvo localmente. Sem conexão no momento.');
      Utils.toast('Salvo no celular.');
    } else {
      Utils.setSyncStatus('sync-status', 'ok', 'Taylan já pode ver este registro ✓');
      Utils.toast('Registro salvo! 🌿');
      App.limparFormulario();
    }
  });
}

// ── SALVAR SEMANAL ──
function salvarSemanal() {
  if (!App.pacienteId) return;

  var payload = {
    acao:       'salvarSemanal',
    pacienteId: App.pacienteId,
    notaSemana: App.ratings.week,
    notaComida: App.ratings.food,
    positivo:   document.getElementById('week-positive').value.trim(),
    desafio:    document.getElementById('week-challenge').value.trim(),
    proxima:    document.getElementById('week-next').value.trim(),
    mensagem:   document.getElementById('week-message').value.trim()
  };

  var btn = document.getElementById('weekly-btn');
  btn.disabled = true; btn.textContent = '⏳ Salvando…';
  Utils.setSyncStatus('weekly-sync', 'loading', 'Enviando…');

  Utils.post(payload, function(err) {
    btn.disabled = false; btn.textContent = '🌿 Salvar Autoavaliação';
    if (err) {
      Utils.setSyncStatus('weekly-sync', 'err', 'Erro. Tente novamente.');
    } else {
      Utils.setSyncStatus('weekly-sync', 'ok', 'Autoavaliação enviada para Taylan ✓');
      Utils.toast('Autoavaliação salva 🌿');
    }
  });
}

// ── HISTÓRICO LOCAL ──
App.renderHistory = function() {
  var data = Utils.lerLocal('lany_entries_' + App.pacienteId, []);
  var el   = document.getElementById('history-list');
  if (!el) return;
  if (!data.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🌱</div><p>Nenhum registro ainda.<br>Seu diário está esperando por você.</p></div>';
    return;
  }
  el.innerHTML = data.map(function(e) {
    return '<div class="history-item">' +
      '<div class="history-date">' + Utils.fmtDate(e.date) + (e.horario ? ' · ' + e.horario : '') + '</div>' +
      (e.emocoes && e.emocoes.length ? '<span class="history-badge">' + e.emocoes.slice(0,2).join(' · ') + '</span>' : '') +
      '<div class="history-food">' + (e.vontade || '—') + '</div>' +
      (e.contexto ? '<div class="history-ctx">' + e.contexto + '</div>' : '') +
      '<div class="history-int">Intensidade: ' + (e.intensidade||'?') + '/10' + (e.ambiente ? ' · ' + e.ambiente : '') + '</div>' +
      (e.comoLidou ? '<div class="history-act">→ ' + e.comoLidou + '</div>' : '') +
      '</div>';
  }).join('');
};

// ── INSIGHTS LOCAIS ──
App.renderInsights = function() {
  var data = Utils.lerLocal('lany_entries_' + App.pacienteId, []);
  var el   = document.getElementById('insights-content');
  if (!el) return;
  if (!data.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>Faça alguns registros para ver seus padrões.</p></div>';
    return;
  }

  var total = data.length;
  var avg   = (data.reduce(function(s,e){ return s + parseInt(e.intensidade||0); }, 0) / total).toFixed(1);
  var high  = data.filter(function(e){ return parseInt(e.intensidade) >= 8; }).length;

  var emCount = {};
  data.forEach(function(e) {
    (e.emocoes || []).forEach(function(em) { emCount[em] = (emCount[em]||0) + 1; });
  });
  var topEm = Object.entries(emCount).sort(function(a,b){ return b[1]-a[1]; }).slice(0,5);

  el.innerHTML =
    '<div class="insight-card insight-teal">' +
      '<div class="insight-num">' + total + '</div>' +
      '<div class="insight-label">Registros no total</div>' +
      '<div class="insight-detail">Intensidade média: <strong>' + avg + '/10</strong></div>' +
    '</div>' +
    '<div class="insight-card insight-gold">' +
      '<div class="insight-num">' + high + '</div>' +
      '<div class="insight-label">Episódios intensos (≥8)</div>' +
      '<div class="insight-detail">' + (high > 0 ? 'Converse com a Taylan sobre esses momentos.' : 'Ótimo! Nenhum episódio crítico. 🌟') + '</div>' +
    '</div>' +
    (topEm.length ? '<div class="insight-card insight-mint">' +
      '<div style="font-family:\'Cormorant Garamond\',serif;font-size:17px;margin-bottom:12px">Emoções mais frequentes</div>' +
      topEm.map(function(item) {
        return '<div class="bar-row">' +
          '<div class="bar-label">' + (item[0].length > 14 ? item[0].slice(0,14)+'…' : item[0]) + '</div>' +
          '<div class="bar-bg"><div class="bar-fill" style="width:' + Math.round(item[1]/total*100) + '%"></div></div>' +
          '<div class="bar-count">' + item[1] + '×</div></div>';
      }).join('') +
    '</div>' : '');
};

// ── LIMPAR FORMULÁRIO ──
App.limparFormulario = function() {
  ['reg-food','reg-context','reg-emotion-other','reg-action-other','reg-alternative'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var sl = document.getElementById('reg-intensity');
  if (sl) { sl.value = 5; Utils.updateSlider(sl, 'intensity-val'); }
  Utils.clearChips('emotion-chips');
  Utils.clearChips('env-chips');
  Utils.clearChips('action-chips');
  var timeEl = document.getElementById('reg-time');
  if (timeEl) timeEl.value = Utils.horaAgora();
};
