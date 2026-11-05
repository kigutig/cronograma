import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

describe('Unit Tests: Cronograma DOM e Funções (cronograma.js)', () => {
  beforeAll(() => {
    globalThis.loadScript('../js/auth.js');
    globalThis.loadScript('../js/cronograma.js');
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toastContainer"></div>
      <div id="pageLoading">Carregando...</div>
      <button id="tabCronograma" class="active"></button>
      <button id="tabArquivo"></button>
      <span id="tabCountCronograma">0</span>
      <span id="tabCountArquivo">0</span>
      <button id="btnNovo"></button>
      <input id="searchInput" value="" />
      <select id="statusFilter"><option value="">Todos</option><option value="Agendado">Agendado</option></select>
      <input id="dateFrom" value="" />
      <input id="dateTo" value="" />
      <span id="rowCount">0 registros</span>
      <table><tbody id="cronogramaBody"></tbody></table>
      <div id="emptyState" style="display:none"></div>
      <div id="aguardandoList"></div>
      <div id="aguardandoEmpty" style="display:none"></div>
      <span id="aguardandoCount">0</span>
      <!-- Modais -->
      <div id="rowModal" class="modal-overlay">
        <span id="modalTitle"></span>
        <input id="fieldData" />
        <input id="fieldPedido" />
        <input id="fieldCliente" />
        <input id="fieldRota" />
        <input id="fieldPlaca" />
        <input id="fieldMotorista" />
        <select id="fieldFrete"><option value="CIF">CIF</option><option value="FOB">FOB</option></select>
        <select id="fieldStatus"><option value="Pendente">Pendente</option></select>
        <textarea id="fieldObs"></textarea>
        <input id="agFromId" />
        <button id="saveBtn"></button>
      </div>
      <div id="viewModal" class="modal-overlay">
        <span id="viewModalTitle"></span>
        <div id="viewModalContent"></div>
        <button id="viewEditBtn"></button>
      </div>
      <div id="deleteModal" class="modal-overlay">
        <span id="deleteInfo"></span>
        <button id="confirmDeleteBtn"></button>
      </div>
    `;

    window.currentUser = { id: 'u1' };
    window.userProfile = { id: 'u1', papel: 'editor', nome: 'Editor Teste', ativo: true };
    window.allRows = [
      { id: '1', pedido: '6001', cliente: 'Academia Alpha', motorista: 'Marcos', rota: 'Sul', placa: 'ABC1234', data: '2026-11-01', status: 'Agendado', frete: 'CIF' },
      { id: '2', pedido: '6002', cliente: 'Academia Beta', motorista: 'Carlos', rota: 'Norte', placa: 'XYZ9876', data: '2026-11-05', status: 'Entregue', frete: 'FOB' }
    ];
    window.aguardandoList = [
      { id: 'ag1', pedido: '8001', cliente: 'Academia Delta', observacoes: 'Urgente' }
    ];
  });

  it('renderTable() deve renderizar linhas na tabela cronogramaBody com valores escapados', () => {
    window.renderTable(window.allRows);
    const tbody = document.getElementById('cronogramaBody');
    expect(tbody.children.length).toBe(2);
    expect(tbody.innerHTML).toContain('6001');
    expect(tbody.innerHTML).toContain('Academia Alpha');
    expect(tbody.innerHTML).toContain('frete-cif');
    expect(tbody.innerHTML).toContain('frete-fob');
  });

  it('renderTable() com lista vazia deve exibir emptyState', () => {
    window.renderTable([]);
    expect(document.getElementById('emptyState').style.display).toBe('flex');
    expect(document.getElementById('cronogramaBody').innerHTML).toBe('');
  });

  it('renderAguardando() deve renderizar cards de pedidos na espera', () => {
    window.renderAguardando();
    const list = document.getElementById('aguardandoList');
    expect(list.innerHTML).toContain('8001');
    expect(list.innerHTML).toContain('Academia Delta');
    expect(document.getElementById('aguardandoCount').textContent).toBe('1');
  });

  it('openAddModal() e resetForm() devem limpar e preparar os campos', () => {
    window.openAddModal('7000', 'Cliente Novo', 'ag123');
    expect(document.getElementById('modalTitle').textContent).toBe('Novo Registro');
    expect(document.getElementById('fieldPedido').value).toBe('7000');
    expect(document.getElementById('fieldCliente').value).toBe('Cliente Novo');
    expect(document.getElementById('agFromId').value).toBe('ag123');
    expect(document.getElementById('rowModal').classList.contains('show')).toBe(true);
  });

  it('openEditModal() deve preencher o formulário com os dados da linha selecionada', () => {
    window.openEditModal('1');
    expect(document.getElementById('modalTitle').textContent).toBe('Editar Registro');
    expect(document.getElementById('fieldPedido').value).toBe('6001');
    expect(document.getElementById('fieldCliente').value).toBe('Academia Alpha');
    expect(document.getElementById('fieldRota').value).toBe('Sul');
    expect(document.getElementById('rowModal').classList.contains('show')).toBe(true);
  });

  it('openViewModal() deve renderizar os detalhes completos do pedido', () => {
    window.openViewModal('1');
    expect(document.getElementById('viewModalTitle').textContent).toContain('6001');
    expect(document.getElementById('viewModalContent').innerHTML).toContain('Academia Alpha');
    expect(document.getElementById('viewModal').classList.contains('show')).toBe(true);
  });

  it('openViewAguardando() deve renderizar detalhes do item aguardando', () => {
    window.openViewAguardando('ag1');
    expect(document.getElementById('viewModalTitle').textContent).toContain('8001');
    expect(document.getElementById('viewModalContent').innerHTML).toContain('Academia Delta');
  });

  it('switchTab() deve atualizar a aba ativa e ocultar o botão novo no histórico', () => {
    window.switchTab('arquivo');
    expect(window.activeTab).toBe('arquivo');
    expect(document.getElementById('btnNovo').style.display).toBe('none');

    window.switchTab('cronograma');
    expect(window.activeTab).toBe('cronograma');
    expect(document.getElementById('btnNovo').style.display).toBe('');
  });

  it('updateTabCounts() deve atualizar a contagem de registros ativos e arquivados nos badges de abas', () => {
    window.updateTabCounts();
    expect(document.getElementById('tabCountCronograma').textContent).toBe('1');
    expect(document.getElementById('tabCountArquivo').textContent).toBe('1');
  });

  it('applyFilters() e clearFilters() devem filtrar na tabela com base nos inputs do DOM', () => {
    document.getElementById('searchInput').value = 'Beta';
    window.switchTab('arquivo'); // Beta está entregue (arquivo)
    window.applyFilters();
    expect(document.getElementById('cronogramaBody').children.length).toBe(1);
    expect(document.getElementById('rowCount').textContent).toContain('1 registro');

    window.clearFilters();
    expect(document.getElementById('searchInput').value).toBe('');
  });

  it('updateRowCount() deve formatar singular e plural corretamente', () => {
    window.updateRowCount(0);
    expect(document.getElementById('rowCount').textContent).toBe('0 registros');
    window.updateRowCount(1);
    expect(document.getElementById('rowCount').textContent).toBe('1 registro');
    window.updateRowCount(5);
    expect(document.getElementById('rowCount').textContent).toBe('5 registros');
  });

  it('hidePageLoading() deve adicionar classe hide e remover o loader', () => {
    expect(document.getElementById('pageLoading')).toBeTruthy();
    window.hidePageLoading();
    expect(document.getElementById('pageLoading').classList.contains('hide')).toBe(true);
  });

  it('_openEditFromView() deve transitar do modal de detalhes para o modal de edição', () => {
    window.openViewModal('1');
    window._openEditFromView();
    expect(document.getElementById('viewModal').classList.contains('show')).toBe(false);
    expect(document.getElementById('rowModal').classList.contains('show')).toBe(true);
  });

  it('confirmDelete() deve abrir o modal de confirmação com os dados do registro', () => {
    window.confirmDelete('1', '6001', 'Academia Alpha', 'cronograma');
    expect(document.getElementById('deleteInfo').textContent).toContain('6001');
    expect(document.getElementById('deleteModal').classList.contains('show')).toBe(true);
  });
});
