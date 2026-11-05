import { describe, it, expect } from 'vitest';

describe('Unit Tests: Motor de Busca e Filtros do Cronograma', () => {
  const sampleRows = [
    { id: '1', pedido: '5001', cliente: 'Academia Corpo & Vida', motorista: 'Carlos', rota: 'Zona Sul', placa: 'ABC-1234', data: '2026-11-01', status: 'Agendado' },
    { id: '2', pedido: '5002', cliente: 'CrossFit Iron', motorista: 'Marcos', rota: 'Zona Norte', placa: 'XYZ-9876', data: '2026-11-03', status: 'Em Rota' },
    { id: '3', pedido: '5003', cliente: 'Studio Pilates', motorista: 'Carlos', rota: 'Centro', placa: 'ABC-1234', data: '2026-11-05', status: 'Entregue' },
    { id: '4', pedido: '5004', cliente: 'Academia Movimento', motorista: 'Eduardo', rota: 'Zona Oeste', placa: 'DEF-5555', data: '2026-11-07', status: 'Concluído' },
    { id: '5', pedido: '5005', cliente: 'Fit Center', motorista: 'Carlos', rota: 'Zona Sul', placa: 'ABC-1234', data: '2026-11-10', status: 'Pendente' }
  ];

  const ARCHIVED_STATUS = ['Entregue', 'Concluído', 'Retirado', 'Cancelado'];

  function filterLogic(rows, { activeTab, query, status, from, to }) {
    const q = (query || '').toLowerCase();

    // Filtro de aba (cronograma vs arquivo)
    const tabRows = rows.filter(r => {
      const isArchived = ARCHIVED_STATUS.includes(r.status || 'Pendente');
      return activeTab === 'arquivo' ? isArchived : !isArchived;
    });

    return tabRows.filter(r => {
      const matchQ = !q || [r.pedido, r.cliente, r.motorista, r.rota, r.placa]
        .some(v => (v || '').toLowerCase().includes(q));
      const matchS = !status || r.status === status;
      const matchFrom = !from || (r.data && r.data >= from);
      const matchTo = !to || (r.data && r.data <= to);
      return matchQ && matchS && matchFrom && matchTo;
    });
  }

  it('deve separar corretamente registros ativos (aba Cronograma) e arquivados (aba Arquivo)', () => {
    const ativos = filterLogic(sampleRows, { activeTab: 'cronograma' });
    const arquivados = filterLogic(sampleRows, { activeTab: 'arquivo' });

    expect(ativos.length).toBe(3); // 5001 (Agendado), 5002 (Em Rota), 5005 (Pendente)
    expect(arquivados.length).toBe(2); // 5003 (Entregue), 5004 (Concluído)

    expect(ativos.map(r => r.pedido)).toEqual(['5001', '5002', '5005']);
    expect(arquivados.map(r => r.pedido)).toEqual(['5003', '5004']);
  });

  it('deve filtrar por termo de busca livre em múltiplos campos (cliente, motorista, rota, placa, pedido)', () => {
    // Busca por motorista Carlos na aba cronograma
    const resCarlos = filterLogic(sampleRows, { activeTab: 'cronograma', query: 'Carlos' });
    expect(resCarlos.length).toBe(2);
    expect(resCarlos.map(r => r.pedido)).toEqual(['5001', '5005']);

    // Busca por número de pedido
    const resPedido = filterLogic(sampleRows, { activeTab: 'cronograma', query: '5002' });
    expect(resPedido.length).toBe(1);
    expect(resPedido[0].cliente).toBe('CrossFit Iron');

    // Busca por placa
    const resPlaca = filterLogic(sampleRows, { activeTab: 'cronograma', query: 'xyz' });
    expect(resPlaca.length).toBe(1);
    expect(resPlaca[0].pedido).toBe('5002');
  });

  it('deve filtrar por status específico', () => {
    const resStatus = filterLogic(sampleRows, { activeTab: 'cronograma', status: 'Em Rota' });
    expect(resStatus.length).toBe(1);
    expect(resStatus[0].pedido).toBe('5002');
  });

  it('deve filtrar por intervalo de datas (from/to)', () => {
    const resDatas = filterLogic(sampleRows, {
      activeTab: 'cronograma',
      from: '2026-11-02',
      to: '2026-11-08'
    });
    expect(resDatas.length).toBe(1);
    expect(resDatas[0].pedido).toBe('5002');
  });
});

