// ════════════════════════════════════════════════
//  LANY · DASHBOARD.JS — Painel da nutricionista
// ════════════════════════════════════════════════

var Dash = {
  pacientes: [],
  registros: [],
  semanais:  []
};

// ── UNLOCK ──
function unlock() {
  var senha = document.getElementById('pwd').value.trim();
  if (!senha) { document.getElementById('lock-err').textContent = 'Digite a senha.'; return; }

  var btn = document.querySelector('.lock-btn');
  if (btn) { btn.textContent = 'Verificando…'; btn.disabled = true; }

  // Verifica a senha tentando buscar os pacientes
  Utils.get({ acao: 'getPacientes', senha: senha }, function(err, data) {
    if (btn) { btn.textContent = 'Entrar'; btn.disabled = false; }

    if (err || !data || !data.ok) {
      document.getElementById('lock-err').textContent = 'Senha incorreta ou erro de conexão.';
      return;
    }

    // Senha correta — salvar e entrar
    CONFIG.DASH_PASSWORD = senha;
    document.getElementById('lock-screen').style.display = 'none';
    document.getElementById('dashboard').style.display   = 'block';

    Dash.pacientes = data.pacientes || [];
    Dash.preencherSelect();
  });
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    var pwd = document.getElementById('pwd');
    if (pwd && document.activeElement === pwd) unlock();
  }
});

// ── PREENCHER SELECT COM PACIENTES ──
Dash.preencherSelect = function() {
  var sel = document.getElementById('pac-select');
  sel.innerHTML = '<option value="">Selecione um paciente…</option>';
  Dash.pacientes.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value       = p.ID;
    opt.textContent = p.Nome + ' · ' + p.ID;
    sel.appendChild(opt);
  });
  if (Dash.pacientes.length === 0) {
    sel.innerHTML = '<option value="">Nenhum paciente cadastrado ainda.</option>';
  }
};

// ── CARREGAR LISTA DE PACIENTES ──
Dash.carregarPacientes = function(senha) {
  var sel = document.getElementById('pac-select');
  sel.innerHTML = '<option value="">Carregando…</option>';
  Utils.get({ acao: 'getPacientes', senha: senha || CONFIG.DASH_PASSWORD }, function(err, data) {
    if (err || !data || !data.ok) {
      sel.innerHTML = '<option value="">Erro ao carregar.</option>';
      return;
    }
    Dash.pacientes = data.pacientes || [];
    Dash.preencherSelect();
  });
};

// ── CARREGAR DADOS DO PACIENTE ──
function carregarPaciente() {
  var id    = document.getElementById('pac-select').value;
  var senha = CONFIG.DASH_PASSWORD;
  if (!id) return;

  document.getElementById('ps-status').textContent = 'Buscando dados…';
  document.getElementById('data-area').style.display    = 'none';
  document.getElementById('loading-area').style.display = 'block';

  Utils.get({ acao: 'getDashboard', senha: senha, pacienteId: id }, function(err, data) {
    document.getElementById('loading-area').style.display = 'none';

    if (err || !data || !data.ok) {
      document.getElementById('ps-status').textContent = 'Erro ao carregar dados.';
      return;
    }

    Dash.registros = data.registros || [];
    Dash.semanais  = data.semanais  || [];

    var pac = (data.pacientes || []).find(function(p) { return p.ID === id; });
    document.getElementById('pac-title').textContent   = pac ? pac.Nome + ' · ' + id : 'Paciente · ' + id;
    document.getElementById('pac-updated').textContent = 'Atualizado agora';
    document.getElementById('ps-status').textContent   =
      '✓ ' + Dash.registros.length + ' registros · ' + Dash.semanais.length + ' autoavaliações';

    document.getElementById('data-area').style.display = 'block';

    Dash.renderKPIs();
    Dash.renderAlertas();
    Dash.renderEmocoes();
    Dash.renderAmbientes();
    Dash.renderRegistros();
    Dash.renderSemanais();
  });
}

function atualizarDados() { carregarPaciente(); }

// ── KPIs ──
Dash.renderKPIs = function() {
  var data = Dash.registros;
  if (!data.length) { document.getElementById('kpi-grid').innerHTML = ''; return; }

  var avg  = (data.reduce(function(s,e){ return s + parseInt(e.Intensidade||0); }, 0) / data.length).toFixed(1);
  var high = data.filter(function(e){ return parseInt(e.Intensidade) >= 8; }).length;
  var week = data.filter(function(e){
    return (Date.now() - new Date(e.DataHora).getTime()) < 7 * 864e5;
  }).length;

  document.getElementById('kpi-grid').innerHTML =
    '<div class="kpi"><div class="kpi-val">' + data.length + '</div><div class="kpi-label">Total Registros</div></div>' +
    '<div class="kpi"><div class="kpi-val">' + avg + '</div><div class="kpi-label">Intensidade Média</div><div class="kpi-sub">Escala 0–10</div></div>' +
    '<div class="kpi" style="border-color:rgba(242,160,61,0.28)"><div class="kpi-val" style="color:var(--amber)">' + high + '</div><div class="kpi-label">Alta Intensidade</div><div class="kpi-sub">≥ 8 na escala</div></div>' +
    '<div class="kpi" style="border-color:rgba(242,220,109,0.2)"><div class="kpi-val" style="color:var(--gold)">' + week + '</div><div class="kpi-label">Última Semana</div></div>';
};

// ── ALERTAS ──
Dash.renderAlertas = function() {
  var high = Dash.registros.filter(function(e){ return parseInt(e.Intensidade) >= 8; });
  var el   = document.getElementById('alerts-area');
  if (!high.length) { el.innerHTML = ''; return; }

  el.innerHTML =
    '<div class="dash-section">' +
    '<div class="dash-title">⚠️ Alertas Clínicos</div>' +
    '<div class="alert-card">' +
    '<div class="alert-title">🔴 ' + high.length + ' episódio(s) de alta intensidade</div>' +
    high.map(function(e) {
      return '<div class="alert-item">' +
        '<strong>' + (e.Vontade||'(não especificado)') + '</strong>' +
        ' · Intensidade ' + e.Intensidade + '/10 · ' + Utils.fmtDate(e.DataHora) +
        (e.Emocoes ? ' · ' + e.Emocoes.split(', ').slice(0,2).join(', ') : '') +
        (e.Contexto ? '<br><span style="color:var(--text-soft)">' + e.Contexto + '</span>' : '') +
        '</div>';
    }).join('') +
    '</div></div>';
};

// ── GRÁFICO EMOÇÕES ──
Dash.renderEmocoes = function() {
  var el = document.getElementById('em-chart');
  var counts = {};
  Dash.registros.forEach(function(e) {
    if (!e.Emocoes) return;
    e.Emocoes.split(', ').forEach(function(em) {
      em = em.trim();
      if (em) counts[em] = (counts[em]||0) + 1;
    });
  });
  var sorted = Object.entries(counts).sort(function(a,b){ return b[1]-a[1]; }).slice(0,8);
  if (!sorted.length) { el.innerHTML = '<div class="empty">Sem dados.</div>'; return; }
  var max = sorted[0][1];
  el.innerHTML = sorted.map(function(item) {
    return '<div class="bar-row">' +
      '<div class="bar-label">' + (item[0].length > 18 ? item[0].slice(0,18)+'…' : item[0]) + '</div>' +
      '<div class="bar-bg"><div class="bar-fill" style="width:' + Math.round(item[1]/max*100) + '%"></div></div>' +
      '<div class="bar-count">' + item[1] + '×</div>' +
      '</div>';
  }).join('');
};

// ── GRÁFICO AMBIENTES ──
Dash.renderAmbientes = function() {
  var el = document.getElementById('env-chart');
  var counts = {};
  Dash.registros.forEach(function(e) {
    if (e.Ambiente) counts[e.Ambiente] = (counts[e.Ambiente]||0) + 1;
  });
  var sorted = Object.entries(counts).sort(function(a,b){ return b[1]-a[1]; });
  if (!sorted.length) { el.innerHTML = '<div class="empty">Sem dados.</div>'; return; }
  var max = sorted[0][1];
  el.innerHTML = sorted.map(function(item) {
    return '<div class="bar-row">' +
      '<div class="bar-label">' + item[0] + '</div>' +
      '<div class="bar-bg"><div class="bar-fill bar-fill-mint" style="width:' + Math.round(item[1]/max*100) + '%"></div></div>' +
      '<div class="bar-count">' + item[1] + '×</div>' +
      '</div>';
  }).join('');
};

// ── REGISTROS ──
Dash.renderRegistros = function() {
  var el = document.getElementById('entries-list');
  if (!Dash.registros.length) { el.innerHTML = '<div class="empty">Nenhum registro.</div>'; return; }

  el.innerHTML = Dash.registros.map(function(e) {
    var int  = parseInt(e.Intensidade);
    var cls  = int >= 8 ? 'int-high' : int >= 5 ? 'int-mid' : 'int-low';
    var tags = e.Emocoes ? e.Emocoes.split(', ').map(function(em) {
      return '<span class="em-tag">' + em.trim() + '</span>';
    }).join('') : '';

    return '<div class="entry-item">' +
      '<div class="entry-header">' +
        '<span class="entry-date">' + Utils.fmtDateTime(e.DataHora) + (e.Horario ? ' · ' + e.Horario : '') + '</span>' +
        '<span class="int-badge ' + cls + '">Intensidade ' + e.Intensidade + '/10</span>' +
      '</div>' +
      '<div class="entry-food">' + (e.Vontade||'(não especificado)') + '</div>' +
      (tags ? '<div class="em-tags">' + tags + '</div>' : '') +
      (e.Contexto   ? '<div class="entry-ctx">📍 ' + e.Contexto   + '</div>' : '') +
      (e.Ambiente   ? '<div class="entry-ctx">🌍 ' + e.Ambiente   + '</div>' : '') +
      (e.ComoLidou  ? '<div class="entry-act">→ '  + e.ComoLidou  + '</div>' : '') +
      (e.Alternativa? '<div class="entry-alt">💚 ' + e.Alternativa + '</div>' : '') +
    '</div>';
  }).join('');
};

// ── SEMANAIS ──
Dash.renderSemanais = function() {
  var el = document.getElementById('weekly-list');
  if (!Dash.semanais.length) { el.innerHTML = '<div class="empty">Nenhuma autoavaliação.</div>'; return; }

  var emojis = ['','😞','😕','😐','🙂','😊'];
  var moon   = ['','🌑','🌒','🌓','🌔','🌕'];

  el.innerHTML = Dash.semanais.map(function(w) {
    return '<div class="weekly-item">' +
      '<div class="weekly-date">' + Utils.fmtDateTime(w.DataHora) + '</div>' +
      '<div class="weekly-scores">' +
        '<div class="wscore"><div class="wscore-val">' + (emojis[w.NotaSemana]||'—') + '</div><div class="wscore-label">Semana geral</div></div>' +
        '<div class="wscore"><div class="wscore-val">' + (moon[w.NotaComida]||'—')   + '</div><div class="wscore-label">Relação c/ comida</div></div>' +
      '</div>' +
      (w.Positivo  ? '<div class="wfield"><div class="wfield-label">Positivo</div><div class="wfield-val">'      + w.Positivo       + '</div></div>' : '') +
      (w.Desafio   ? '<div class="wfield"><div class="wfield-label">Desafio</div><div class="wfield-val">'       + w.Desafio        + '</div></div>' : '') +
      (w.ProximaSemana ? '<div class="wfield"><div class="wfield-label">Próxima semana</div><div class="wfield-val">' + w.ProximaSemana + '</div></div>' : '') +
      (w.MensagemPraSiMesma ? '<div class="wmessage">"' + w.MensagemPraSiMesma + '"</div>' : '') +
    '</div>';
  }).join('');
};
