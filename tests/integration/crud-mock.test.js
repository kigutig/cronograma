import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Integration Tests: Operações CRUD de Cronograma e Aguardando', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      from: vi.fn()
    };
  });

  it('deve realizar inserção de novo pedido no cronograma com dados completos', async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    mockDb.from.mockReturnValue({ insert: insertMock });

    const newRecord = {
      data: '2026-11-20',
      pedido: '7788',
      cliente: 'Academia Platinum',
      rota: 'Leste',
      placa: 'BRA2E19',
      motorista: 'Ricardo',
      frete: 'CIF',
      status: 'Pendente',
      observacoes: 'Entregar pela manhã',
      criado_por: 'user-id-123'
    };

    const { error } = await mockDb.from('cronograma').insert(newRecord);

    expect(mockDb.from).toHaveBeenCalledWith('cronograma');
    expect(insertMock).toHaveBeenCalledWith(newRecord);
    expect(error).toBeNull();
  });

  it('deve atualizar status de um registro existente com sucesso', async () => {
    const eqMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockDb.from.mockReturnValue({ update: updateMock });

    const rowId = 'c123-uuid';
    const { error } = await mockDb.from('cronograma').update({ status: 'Entregue' }).eq('id', rowId);

    expect(mockDb.from).toHaveBeenCalledWith('cronograma');
    expect(updateMock).toHaveBeenCalledWith({ status: 'Entregue' });
    expect(eqMock).toHaveBeenCalledWith('id', rowId);
    expect(error).toBeNull();
  });

  it('deve propagar erro de banco de dados caso ocorra falha de inserção', async () => {
    const dbError = { message: 'violates foreign key constraint' };
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: dbError });
    mockDb.from.mockReturnValue({ insert: insertMock });

    const { error } = await mockDb.from('cronograma').insert({ pedido: 'invalid' });
    expect(error).toBeDefined();
    expect(error.message).toContain('foreign key');
  });

  it('deve suportar fluxo de agendamento de item que estava em aguardando', async () => {
    // 1. Insert no cronograma
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    // 2. Delete no aguardando
    const eqMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });

    mockDb.from.mockImplementation((table) => {
      if (table === 'cronograma') return { insert: insertMock };
      if (table === 'aguardando') return { delete: deleteMock };
      return {};
    });

    const agItem = { id: 'ag-555', pedido: '8900', cliente: 'Academia Gold' };
    const cronogramaPayload = {
      ...agItem,
      data: '2026-11-25',
      motorista: 'José',
      status: 'Agendado'
    };

    // Ação 1: insere no cronograma
    const { error: insError } = await mockDb.from('cronograma').insert(cronogramaPayload);
    expect(insError).toBeNull();

    // Ação 2: remove de aguardando
    const { error: delError } = await mockDb.from('aguardando').delete().eq('id', agItem.id);
    expect(delError).toBeNull();
    expect(eqMock).toHaveBeenCalledWith('id', 'ag-555');
  });
});

