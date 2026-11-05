import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

describe('Unit Tests: Jarvis Voice Assistant Helpers (jarvis.js)', () => {
  beforeAll(() => {
    globalThis.loadScript('../js/auth.js');
    globalThis.loadScript('../js/cronograma.js');
    globalThis.loadScript('../js/jarvis.js');
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toastContainer"></div>
      <button id="jarvisBtn" data-state="off">
        <span id="jarvisBadge" class="jarvis-badge">OFF</span>
        <span id="jarvisRipple" style="display:none"></span>
      </button>
      <div id="jarvisOverlay">
        <div class="jarvis-overlay-title"></div>
        <div class="jarvis-overlay-transcript"></div>
      </div>
      <input id="searchInput" value="" />
      <select id="statusFilter"><option value="">Todos</option></select>
      <input id="dateFrom" value="" />
      <input id="dateTo" value="" />
      <table><tbody id="cronogramaBody"></tbody></table>
      <div id="emptyState" style="display:none"></div>
    `;

    window.allRows = [
      { id: '1', pedido: '5909', cliente: 'Academia Teste', status: 'Pendente' }
    ];

    window.SpeechRecognition = class {
      constructor() {}
      start() {}
      stop() {}
    };
  });

  it('closeJarvisOverlay() deve ocultar o overlay', () => {
    const overlay = document.getElementById('jarvisOverlay');
    overlay.classList.add('jarvis-overlay-show');
    expect(overlay.classList.contains('jarvis-overlay-show')).toBe(true);

    window.closeJarvisOverlay();
    expect(overlay.classList.contains('jarvis-overlay-show')).toBe(false);
  });

  it('initJarvis() deve configurar os helpers do jarvis em window.jarvisHelpers', () => {
    window.initJarvis();
    expect(window.jarvisHelpers).toBeDefined();
    expect(typeof window.jarvisHelpers.updateStatus).toBe('function');
    expect(typeof window.jarvisHelpers.createPedido).toBe('function');
    expect(typeof window.jarvisHelpers.filterDateRange).toBe('function');
    expect(typeof window.jarvisHelpers.search).toBe('function');
    expect(typeof window.jarvisHelpers.clearAll).toBe('function');
  });

  it('jarvisHelpers.search() deve atualizar o campo de busca e disparar filtros', () => {
    window.initJarvis();
    window.jarvisHelpers.search('5909');
    expect(document.getElementById('searchInput').value).toBe('5909');
  });

  it('jarvisHelpers.clearAll() deve limpar todos os filtros de busca, status e datas', () => {
    window.initJarvis();
    document.getElementById('searchInput').value = 'texto';
    document.getElementById('dateFrom').value = '2026-01-01';
    document.getElementById('dateTo').value = '2026-01-31';

    window.jarvisHelpers.clearAll();
    expect(document.getElementById('searchInput').value).toBe('');
    expect(document.getElementById('dateFrom').value).toBe('');
    expect(document.getElementById('dateTo').value).toBe('');
  });
});
