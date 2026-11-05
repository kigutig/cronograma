// ============================================================
// JARVIS.JS — Assistente de Voz com IA (Groq + Web Speech)
// ------------------------------------------------------------
// A IA é chamada pela Supabase Edge Function "jarvis"
// (supabase/functions/jarvis). A chave do Groq fica só no servidor
// como segredo — nenhuma chave é enviada ao navegador.
// ============================================================

const JARVIS_WAKE_WORD    = 'jarvis';
const JARVIS_FUNCTION     = 'jarvis';

// ── Estado interno ────────────────────────────────────────────
let _recognition   = null;
let _isListening   = false;
let _isBusy        = false;   // processando IA
let _jarvisReady   = false;

// ── Inicialização ─────────────────────────────────────────────
function initJarvis() {
  // Limpa chaves antigas que versões anteriores salvavam no navegador
  localStorage.removeItem('jarvis-groq-key');

  // Verifica suporte à Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    document.getElementById('jarvisBtn')?.setAttribute('title', 'Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.');
    document.getElementById('jarvisBtn')?.classList.add('jarvis-unsupported');
    return;
  }

  // Configura o reconhecimento de voz
  _recognition = new SpeechRecognition();
  _recognition.lang = 'pt-BR';
  _recognition.continuous = true;
  _recognition.interimResults = true;

  _recognition.onresult   = _onSpeechResult;
  _recognition.onerror    = _onSpeechError;
  _recognition.onend      = _onSpeechEnd;

  _jarvisReady = true;
  _updateJarvisUI('off');

  // Inicializa helpers globais para o Jarvis executar ações no DOM/Supabase
  window.jarvisHelpers = {
    updateStatus: async (pedido, status) => {
      await jarvisHelpers.updateField(pedido, 'status', status);
    },
    updateField: async (pedido, campo, valor) => {
      const row = allRows.find(r => String(r.pedido) === String(pedido));
      if (!row) {
        showToast(`Pedido ${pedido} não encontrado`, 'warning');
        _jarvisSay(`Não encontrei o pedido ${pedido}.`);
        return;
      }
      
      const camposValidos = ['status', 'data', 'motorista', 'rota', 'placa', 'observacoes', 'frete', 'cliente'];
      if (!camposValidos.includes(campo)) {
        showToast(`Campo ${campo} inválido`, 'error');
        return;
      }

      // Converte data brasileira (DD/MM/YYYY) para ISO (YYYY-MM-DD) do banco
      let valorFinal = valor;
      if (campo === 'data') {
        if (valor.includes('/')) {
          const parts = valor.split('/');
          if (parts.length === 3) {
            valorFinal = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
      }

      const payload = {};
      payload[campo] = valorFinal;

      const { error } = await db.from('cronograma').update(payload).eq('id', row.id);
      if (error) {
        showToast(`Erro ao atualizar ${campo}: ${error.message}`, 'error');
      } else {
        const valorExibido = campo === 'data' ? fmtDate(valorFinal) : valorFinal;
        showToast(`Pedido ${pedido}: ${campo} atualizado para ${valorExibido}`, 'success');
        _jarvisSay(`Certo! ${campo} do pedido ${pedido} alterado para ${valorExibido}.`);
        await loadCronograma();
      }
    },
    createPedido: async (dados) => {
      let dataFinal = dados.data || null;
      if (dataFinal && dataFinal.includes('/')) {
        const parts = dataFinal.split('/');
        if (parts.length === 3) {
          dataFinal = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      const payload = {
        data: dataFinal,
        pedido: dados.pedido || '',
        cliente: dados.cliente || '',
        rota: dados.rota || '',
        placa: (dados.placa || '').toUpperCase(),
        motorista: dados.motorista || '',
        frete: (dados.frete || 'CIF').toUpperCase(),
        status: dados.status || 'Pendente',
        observacoes: dados.observacoes || '',
        criado_por: currentUser.id
      };
      const { error } = await db.from('cronograma').insert(payload);
      if (error) {
        showToast(`Erro ao criar pedido: ${error.message}`, 'error');
      } else {
        showToast(`Pedido ${payload.pedido} criado`, 'success');
        _jarvisSay(`Pedido ${payload.pedido} criado no cronograma.`);
        await loadCronograma();
      }
    },
    addAguardando: async (pedido, cliente, observacoes = '') => {
      const payload = {
        pedido: pedido || '',
        cliente: cliente || '',
        observacoes: observacoes || '',
        adicionado_por: currentUser.id
      };
      const { error } = await db.from('aguardando').insert(payload);
      if (error) {
        showToast(`Erro ao adicionar: ${error.message}`, 'error');
      } else {
        showToast(`Pedido ${pedido} adicionado à espera`, 'success');
        _jarvisSay(`Pedido ${pedido} do cliente ${cliente} adicionado à lista de espera.`);
        await loadAguardando();
      }
    },
    deleteAguardando: async (pedido) => {
      const item = aguardandoList.find(i => String(i.pedido) === String(pedido));
      if (!item) {
        showToast(`Pedido ${pedido} não está na espera`, 'warning');
        _jarvisSay(`Não encontrei o pedido ${pedido} na lista de espera.`);
        return;
      }
      const { error } = await db.from('aguardando').delete().eq('id', item.id);
      if (error) {
        showToast(`Erro ao excluir: ${error.message}`, 'error');
      } else {
        showToast(`Pedido ${pedido} removido da espera`, 'success');
        _jarvisSay(`Removi o pedido ${pedido} da lista de espera.`);
        await loadAguardando();
      }
    },
    agendarAguardandoDireto: async (pedido, dados) => {
      const item = aguardandoList.find(i => String(i.pedido) === String(pedido));
      if (!item) {
        showToast(`Pedido ${pedido} não encontrado na espera`, 'warning');
        _jarvisSay(`Não encontrei o pedido ${pedido} na lista de espera.`);
        return;
      }

      let dataFinal = dados.data || null;
      if (dataFinal && dataFinal.includes('/')) {
        const parts = dataFinal.split('/');
        if (parts.length === 3) {
          dataFinal = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const payload = {
        data: dataFinal,
        pedido: item.pedido || '',
        cliente: item.cliente || '',
        rota: dados.rota || '',
        placa: (dados.placa || '').toUpperCase(),
        motorista: dados.motorista || '',
        frete: (dados.frete || 'CIF').toUpperCase(),
        status: dados.status || 'Pendente',
        observacoes: dados.observacoes || item.observacoes || '',
        criado_por: currentUser.id
      };

      const { error: insError } = await db.from('cronograma').insert(payload);
      if (insError) {
        showToast(`Erro ao agendar: ${insError.message}`, 'error');
        return;
      }
      
      await db.from('aguardando').delete().eq('id', item.id);
      showToast(`Pedido ${pedido} agendado com sucesso`, 'success');
      _jarvisSay(`Pedido ${pedido} promovido e agendado no cronograma.`);
      await loadCronograma();
      await loadAguardando();
    },
    filterDateRange: (de, ate) => {
      let deFinal = de;
      let ateFinal = ate;
      if (de && de.includes('/')) {
        const parts = de.split('/');
        deFinal = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      if (ate && ate.includes('/')) {
        const parts = ate.split('/');
        ateFinal = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const elDe = document.getElementById('dateFrom');
      const elAte = document.getElementById('dateTo');
      if (elDe) elDe.value = deFinal || '';
      if (elAte) elAte.value = ateFinal || '';
      applyFilters();
      _jarvisSay(`Filtrando entregas de ${de || 'início'} até ${ate || 'fim'}.`);
    },
    viewPedido: (pedido) => {
      const row = allRows.find(r => String(r.pedido) === String(pedido));
      if (!row) {
        showToast(`Pedido ${pedido} não encontrado`, 'warning');
        _jarvisSay(`Não encontrei o pedido ${pedido}.`);
        return;
      }
      openViewModal(row.id);
      const statusText = row.status || 'Pendente';
      const clienteText = row.cliente ? `do cliente ${row.cliente}` : '';
      _jarvisSay(`O status do pedido ${pedido} ${clienteText} é: ${statusText}.`);
    },
    editPedido: (pedido) => {
      const row = allRows.find(r => String(r.pedido) === String(pedido));
      if (!row) {
        showToast(`Pedido ${pedido} não encontrado`, 'warning');
        _jarvisSay(`Não encontrei o pedido ${pedido}.`);
        return;
      }
      openEditModal(row.id);
    },
    deletePedido: (pedido) => {
      const row = allRows.find(r => String(r.pedido) === String(pedido));
      if (!row) {
        showToast(`Pedido ${pedido} não encontrado`, 'warning');
        _jarvisSay(`Não encontrei o pedido ${pedido}.`);
        return;
      }
      confirmDelete(row.id, row.pedido, row.cliente, 'cronograma');
    },
    agendarAguardando: (pedido) => {
      const item = aguardandoList.find(i => String(i.pedido) === String(pedido));
      if (!item) {
        showToast(`Pedido ${pedido} não está aguardando`, 'warning');
        _jarvisSay(`Não encontrei o pedido ${pedido} na lista de espera.`);
        return;
      }
      agendarItem(item.id, item.pedido, item.cliente);
    },
    openAddAguardandoModal: () => {
      openAddAguardando();
    },
    search: (query) => {
      const el = document.getElementById('searchInput');
      if (el) {
        el.value = query;
        applyFilters();
      }
    },
    filterStatus: (status) => {
      const el = document.getElementById('statusFilter');
      if (el) {
        el.value = status;
        applyFilters();
      }
    },
    clearAll: () => {
      clearFilters();
      const elDe = document.getElementById('dateFrom');
      const elAte = document.getElementById('dateTo');
      if (elDe) elDe.value = '';
      if (elAte) elAte.value = '';
      applyFilters();
    }
  };
}

// ── Toggle microfone ──────────────────────────────────────────
function toggleJarvis() {
  if (!_jarvisReady) {
    showToast('Reconhecimento de voz não suportado neste navegador.', 'error');
    return;
  }

  if (_isListening) {
    _stopListening();
  } else {
    _startListening();
  }
}

function _startListening() {
  try {
    _recognition.start();
    _isListening = true;
    _updateJarvisUI('listening');
    _setOverlay('show', 'Ouvindo... diga <strong>Jarvis</strong> seguido do comando', '');
    showToast('🎤 Jarvis ativado — diga "Jarvis, altere o status do pedido..."', 'info');
  } catch (e) {
    console.warn('Jarvis start error:', e);
  }
}

function _stopListening() {
  try { _recognition.stop(); } catch { /* ignore */ }
  _isListening = false;
  _isBusy = false;
  _updateJarvisUI('off');
  _setOverlay('hide');
}

function _stopMicrophone() {
  try { _recognition.stop(); } catch { /* ignore */ }
  _isListening = false;
  _updateJarvisUI('off');
}

// ── Processamento de fala ─────────────────────────────────────
function _onSpeechResult(event) {
  let interim = '';
  let final   = '';

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const t = event.results[i][0].transcript;
    if (event.results[i].isFinal) final += t;
    else interim += t;
  }

  const text = (final || interim).trim().toLowerCase();

  // Mostra transcrição ao vivo
  if (text) {
    _setOverlay('show', 'Ouvindo...', text);
  }

  if (!final) return;

  const hasWake = final.toLowerCase().includes(JARVIS_WAKE_WORD);

  // Processa comando normal (contém 'jarvis' e não está ocupado)
  if (hasWake && !_isBusy) {
    _isBusy = true;
    _stopMicrophone(); // Desliga o microfone imediatamente
    _updateJarvisUI('processing');
    _setOverlay('show', '<span class="jarvis-processing-txt">⚡ Processando...</span>', final.trim());
    _interpretCommand(final.trim());
  }
}

function _onSpeechError(event) {
  // 'no-speech' é esperado — ignora
  if (event.error === 'no-speech') return;
  console.warn('Speech error:', event.error);
  if (event.error === 'not-allowed') {
    showToast('Permissão ao microfone negada. Verifique as configurações do navegador.', 'error');
    _stopListening();
  }
}

function _onSpeechEnd() {
  // Reinicia automaticamente se ainda deveria estar ouvindo
  if (_isListening && !_isBusy) {
    try { _recognition.start(); } catch { /* ignore */ }
  }
}

// ── Interpretação via Edge Function (Groq no servidor) ───────
async function _interpretCommand(text) {
  try {
    const { data, error } = await db.functions.invoke(JARVIS_FUNCTION, {
      body: { text }
    });

    if (error) {
      let msg = error.message || 'Erro desconhecido';
      try {
        const body = await error.context?.json?.();
        if (body?.error) msg = body.error;
      } catch { /* ignore */ }
      const status = error.context?.status;
      if (status === 401 || status === 403) {
        showToast('Sessão inválida ou usuário sem permissão para usar o Jarvis.', 'error');
        _setOverlay('show', '❌ Sem permissão', text);
      } else {
        showToast(`Erro Jarvis: ${msg}`, 'error');
        _setOverlay('show', '❌ Erro ao processar', text);
      }
      _isBusy = false;
      _updateJarvisUI('listening');
      setTimeout(() => _setOverlay('show', 'Ouvindo... diga <strong>Jarvis</strong> seguido do comando', ''), 3000);
      return;
    }

    const raw          = data?.content || '{}';
    const finishReason = data?.finish_reason;

    console.log('%c🤖 Groq respondeu:', 'color:#a78bfa;font-weight:bold', raw);
    console.log('%c📋 finishReason:', 'color:#a78bfa', finishReason, '| chars:', raw.length);

    // Tenta extrair JSON: remove markdown, depois tenta regex para pegar { ... }
    let clean = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
    // Fallback: extrai o primeiro bloco JSON da resposta
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) clean = jsonMatch[0];

    let action;
    try {
      action = JSON.parse(clean);
      console.log('%c✅ Ação interpretada:', 'color:#4ade80;font-weight:bold', action);
    } catch {
      console.warn('%c⚠️ JSON parse falhou. Resposta bruta:', 'color:#fbbf24', raw);
      action = { action: 'unknown', message: 'Não consegui interpretar o comando.' };
    }

    await _executeAction(action, text);

  } catch (e) {
    console.error('Jarvis fetch error:', e);
    showToast('Erro de conexão ao processar o comando.', 'error');
  } finally {
    _isBusy = false;
    // Fecha o overlay após 5 segundos
    setTimeout(() => {
      if (!_isBusy && !_isListening) {
        _setOverlay('hide');
      }
    }, 5000);
  }
}

// ── Execução de ações ─────────────────────────────────────────
async function _executeAction(action, originalText) {
  // Ação especial para parar
  if (action.action === 'stop') {
    _jarvisSay('Entendido! Estou em standby.');
    _setOverlay('show', '✅ Até logo!', originalText);
    setTimeout(() => _stopListening(), 800);
    return;
  }

  // Executa o código javascript gerado pela IA
  if (action.code) {
    console.log('%c🏃 Executando código Jarvis:', 'color:#a78bfa', action.code);
    try {
      if (action.speech) {
        _jarvisSay(action.speech);
        _setOverlay('show', `🤖 <em>${action.speech}</em>`, originalText);
      }

      // Executa o código javascript gerado dinamicamente
      const result = eval(action.code);
      if (result instanceof Promise) {
        await result;
      }
    } catch (err) {
      console.error('Erro ao executar ação do Jarvis:', err);
      showToast('Erro ao executar comando.', 'error');
      _setOverlay('show', '❌ Erro ao executar ação no site', originalText);
    }
  } else if (action.action === 'unknown') {
    const msg = action.message || 'Comando não reconhecido.';
    _jarvisSay(msg);
    _setOverlay('show', `❓ ${msg}`, originalText);
    showToast(`Jarvis: ${msg}`, 'warning');
  } else {
    // Fallback genérico para tratar comandos não-nativos antigos
    _setOverlay('show', '❓ Comando não interpretado corretamente', originalText);
  }
}

// ── Resposta de voz (Text-to-Speech) ─────────────────────────
function _jarvisSay(text) {
  if (!window.speechSynthesis) return;
  // Cancela qualquer fala anterior
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang  = 'pt-BR';
  utt.rate  = 1.05;
  utt.pitch = 0.95;
  utt.volume = 0.9;

  // Tenta usar uma voz portuguesa
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang.startsWith('pt'));
  if (ptVoice) utt.voice = ptVoice;

  window.speechSynthesis.speak(utt);
}

// ── Overlay de feedback ───────────────────────────────────────
function _setOverlay(state, title = '', transcript = '') {
  const overlay = document.getElementById('jarvisOverlay');
  if (!overlay) return;

  if (state === 'hide') {
    overlay.classList.remove('jarvis-overlay-show');
    return;
  }

  const titleEl      = overlay.querySelector('.jarvis-overlay-title');
  const transcriptEl = overlay.querySelector('.jarvis-overlay-transcript');

  if (titleEl)      titleEl.innerHTML = title;
  if (transcriptEl) transcriptEl.textContent = transcript;

  overlay.classList.add('jarvis-overlay-show');
}

// ── UI do botão Jarvis ────────────────────────────────────────
function _updateJarvisUI(state) {
  // state: 'off' | 'listening' | 'processing'
  const btn    = document.getElementById('jarvisBtn');
  const badge  = document.getElementById('jarvisBadge');
  const ripple = document.getElementById('jarvisRipple');

  if (!btn) return;

  btn.dataset.state = state;

  const STATES = {
    off:        { badge: 'OFF',        badgeCls: 'jarvis-badge-off',        tip: 'Ativar Jarvis (assistente de voz)' },
    listening:  { badge: 'Ouvindo',    badgeCls: 'jarvis-badge-listening',   tip: 'Clique para desativar' },
    processing: { badge: 'Pensando…',  badgeCls: 'jarvis-badge-processing',  tip: 'Processando comando…' },
  };

  const s = STATES[state] || STATES.off;

  if (badge) {
    badge.textContent = s.badge;
    badge.className   = `jarvis-badge ${s.badgeCls}`;
  }
  if (ripple) {
    ripple.style.display = state === 'listening' ? 'block' : 'none';
  }
  btn.setAttribute('title',    s.tip);
  btn.setAttribute('data-tip', s.tip);

  btn.classList.toggle('jarvis-active', state !== 'off');
}

function closeJarvisOverlay() {
  _setOverlay('hide');
}

// ── Teste via console do navegador ───────────────────────────
// Use no console (F12): jarvisTest("altere o status do pedido 5909 para entregue")
async function jarvisTest(texto) {
  if (!texto) {
    console.info(
      '%c🎤 JARVIS TEST\n' +
      '%cUso: jarvisTest("altere o status do pedido 5909 para entregue")\n' +
      'Outros exemplos:\n' +
      '  jarvisTest("qual o status do pedido 1234")\n' +
      '  jarvisTest("busca pedidos do cliente João")',
      'color:#a78bfa;font-weight:bold;font-size:14px',
      'color:#c4b5fd;font-size:12px'
    );
    return;
  }

  console.log('%c🎤 Jarvis Test → ' + texto, 'color:#a78bfa;font-weight:600');
  _setOverlay('show', '⚡ Testando comando...', texto);
  _isBusy = true;
  await _interpretCommand('jarvis ' + texto);
  _isBusy = false;
}

// Expõe globalmente para uso no console
window.jarvisTest = jarvisTest;
