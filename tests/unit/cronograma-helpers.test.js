import { describe, it, expect } from 'vitest';

describe('Unit Tests: Regras de Negócio e Helpers do Cronograma', () => {
  const STATUS_OPTIONS = [
    'Pendente',
    'Em separação',
    'Separado',
    'Aguardando peça',
    'Em manutenção',
    'Em revisão',
    'Agendado',
    'Em Rota',
    'Entregue',
    'Concluído',
    'Retirado',
    'Cancelado'
  ];

  const ARCHIVED_STATUS = ['Entregue', 'Concluído', 'Retirado', 'Cancelado'];

  function freteBadge(val) {
    const v = (val || 'CIF').toUpperCase();
    const cls = v === 'FOB' ? 'frete-fob' : 'frete-cif';
    return `<span class="${cls}">${v}</span>`;
  }

  function getNextStatus(currentStatus, isArchivedTab) {
    const idx = STATUS_OPTIONS.indexOf(currentStatus);
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];

    // Se estiver na aba cronograma e o próximo for arquivado, requer ação manual
    if (!isArchivedTab && ARCHIVED_STATUS.includes(next)) {
      return { allowed: false, message: 'Requer botão Editar para arquivar' };
    }
    return { allowed: true, next };
  }

  function validateCronogramaPayload(payload) {
    const errors = [];
    if (!payload.pedido && !payload.cliente) {
      errors.push('Informe ao menos o pedido ou o cliente.');
    }
    if (payload.frete && !['CIF', 'FOB'].includes(payload.frete.toUpperCase())) {
      errors.push('Frete inválido. Use CIF ou FOB.');
    }
    return { valid: errors.length === 0, errors };
  }

  it('freteBadge() deve renderizar as classes frete-cif e frete-fob corretamente', () => {
    expect(freteBadge('CIF')).toBe('<span class="frete-cif">CIF</span>');
    expect(freteBadge('fob')).toBe('<span class="frete-fob">FOB</span>');
    expect(freteBadge(null)).toBe('<span class="frete-cif">CIF</span>');
    expect(freteBadge('')).toBe('<span class="frete-cif">CIF</span>');
  });

  it('regra quickStatus não deve permitir arquivamento acidental pelo ciclo rápido', () => {
    // "Em Rota" é o status imediatamente anterior a "Entregue"
    const transicao = getNextStatus('Em Rota', false);
    expect(transicao.allowed).toBe(false);
    expect(transicao.message).toContain('Editar');

    // Transição entre status comuns deve ser permitida
    const transicaoNormal = getNextStatus('Pendente', false);
    expect(transicaoNormal.allowed).toBe(true);
    expect(transicaoNormal.next).toBe('Em separação');
  });

  it('validateCronogramaPayload() deve validar campos obrigatórios e frete', () => {
    expect(validateCronogramaPayload({ pedido: '123', cliente: 'Cliente A', frete: 'CIF' }).valid).toBe(true);
    expect(validateCronogramaPayload({ pedido: '', cliente: '', frete: 'CIF' }).valid).toBe(false);
    expect(validateCronogramaPayload({ pedido: '123', cliente: 'Cliente A', frete: 'INVALIDO' }).valid).toBe(false);
  });
});

