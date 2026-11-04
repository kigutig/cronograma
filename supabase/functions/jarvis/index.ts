// ============================================================
// EDGE FUNCTION: jarvis — proxy seguro para a API do Groq
// ------------------------------------------------------------
// A chave do Groq fica APENAS no servidor, como segredo:
//   supabase secrets set GROQ_API_KEY=gsk_...
// Só usuários autenticados e ativos (profiles.ativo = true) podem usar.
// O prompt é montado aqui, então o endpoint não serve como LLM genérico.
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL    = 'llama-3.1-8b-instant';
const MAX_TEXT_LEN  = 500;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildPrompt(text: string) {
  return `Você é o Jarvis, assistente de voz do Cockpit de Entregas.
O usuário falou: "${text}"

Seu trabalho é gerar um código Javascript curto que controle a página web de acordo com o comando do usuário, junto com a fala de confirmação do assistente.

Retorne SOMENTE um JSON válido com esta estrutura:
{
  "code": "código javascript válido para ser executado com eval()",
  "speech": "resposta por voz curta em português (máx 15 palavras)"
}

APIs e Funções Globais Disponíveis na página:
1. jarvisHelpers.updateStatus(pedido, status)
   - Status exatos: "Pendente", "Em separação", "Separado", "Aguardando peça", "Em manutenção", "Em revisão", "Agendado", "Em Rota", "Entregue", "Concluído", "Retirado", "Cancelado".
2. jarvisHelpers.updateField(pedido, campo, valor)
   - Permite alterar QUALQUER campo de um pedido. Campos válidos: 'data', 'motorista', 'rota', 'placa', 'observacoes', 'frete', 'cliente'.
   - O 'valor' da data deve ser passado no formato brasileiro 'DD/MM/YYYY'.
3. jarvisHelpers.createPedido(dados)
   - Cria um novo pedido direto no cronograma. O objeto 'dados' pode ter: { pedido, cliente, data, motorista, rota, placa, status, frete, observacoes }.
4. jarvisHelpers.addAguardando(pedido, cliente, observacoes) -> Adiciona um pedido novo à lista de espera/aguardando.
5. jarvisHelpers.deleteAguardando(pedido) -> Exclui um pedido da lista de espera.
6. jarvisHelpers.agendarAguardandoDireto(pedido, dadosAgendamento)
   - Tira um pedido da lista de espera e cria no cronograma com dados: { data, motorista, rota, placa, status, frete, observacoes }.
7. jarvisHelpers.filterDateRange(de, ate) -> Filtra o cronograma pelo intervalo de datas brasileiro (ex: '10/07/2026', '15/07/2026').
8. jarvisHelpers.viewPedido(pedido) -> Abre visualização detalhada do pedido
9. jarvisHelpers.editPedido(pedido) -> Abre modal de edição do pedido
10. jarvisHelpers.deletePedido(pedido) -> Abre diálogo para deletar o pedido
11. jarvisHelpers.agendarAguardando(pedido) -> Abre o modal de agendamento manual de um item da espera.
12. jarvisHelpers.openAddAguardandoModal() -> Abre o formulário de inclusão de item em aguardando.
13. jarvisHelpers.search(texto) -> Busca por texto/cliente/motorista
14. jarvisHelpers.filterStatus(status) -> Filtra por status
15. jarvisHelpers.clearAll() -> Limpa todos os filtros de busca/status/data
16. switchTab('cronograma' | 'arquivo') -> Muda de aba
17. toggleTheme() -> Alterna tema do site (escuro/claro)
18. openAddModal() -> Abre tela para criar novo pedido do zero
19. toggleFullscreenElement('#tableWrap', 'btnFullscreen', 'fullscreenIcon') -> Tela cheia

Variáveis Globais que você pode ler se precisar:
- allRows: array contendo todos os pedidos atuais. Cada pedido é um objeto com estes campos exatos:
  * pedido (número do pedido)
  * cliente (nome do cliente)
  * motorista (nome do motorista)
  * rota (rota de entrega)
  * placa (placa do veículo)
  * status (status atual)
  * observacoes (observações do registro)
  * data (data no formato 'YYYY-MM-DD', você pode formatá-la usando a função global fmtDate(row.data))
- aguardandoList: array de pedidos aguardando agendamento { id, pedido, cliente, observacoes }
- activeTab: string 'cronograma' ou 'arquivo'

Regras de Geração do Código:
- NUNCA utilize variáveis não declaradas como 'pedido', 'status', 'rota' etc.
- Passe sempre os valores diretamente como strings ou números nas chamadas.
- Para responder perguntas gerais sobre os dados de um pedido (data, motorista, rota, observações, cliente etc.), escreva um código JS que localize o pedido em allRows e use a função _jarvisSay() para falar a resposta exata.
- EXEMPLOS DE CÓDIGO CORRETOS PARA CADA INTENÇÃO:
  * Para criar um novo pedido no cronograma (ex: pedido 7000 para cliente Acme no dia 20/07/2026):
    "code": "jarvisHelpers.createPedido({ pedido: '7000', cliente: 'Acme', data: '20/07/2026', motorista: 'Carlos' });", "speech": "Criando pedido 7000 no cronograma."
  * Para adicionar à lista de espera/aguardando (ex: pedido 8000 para cliente Fenix):
    "code": "jarvisHelpers.addAguardando('8000', 'Fenix', 'Urgente');", "speech": "Adicionando pedido 8000 à lista de espera."
  * Para agendar/promover direto um pedido que está em aguardando (ex: pedido 8000 para o dia 22/07/2026 com motorista Carlos):
    "code": "jarvisHelpers.agendarAguardandoDireto('8000', { data: '22/07/2026', motorista: 'Carlos' });", "speech": "Agendando pedido da lista de espera."
  * Para excluir do aguardando/espera (ex: pedido 8000):
    "code": "jarvisHelpers.deleteAguardando('8000');", "speech": "Removendo pedido 8000 da lista de espera."
  * Para filtrar entregas de 10/07/2026 a 15/07/2026:
    "code": "jarvisHelpers.filterDateRange('10/07/2026', '15/07/2026');", "speech": "Filtrando período de 10 a 15 de julho."
  * Para alterar a data do pedido 5909 para 20/07/2026:
    "code": "jarvisHelpers.updateField('5909', 'data', '20/07/2026');", "speech": "Alterando a data do pedido 5909 para 20 de julho."
  * Para alterar o motorista do pedido 5909 para Carlos:
    "code": "jarvisHelpers.updateField('5909', 'motorista', 'Carlos');", "speech": "Alterando motorista do pedido 5909 para Carlos."
  * Para saber/perguntar a data do pedido 5909:
    "code": "const row = allRows.find(r => String(r.pedido) === '5909'); if (row) { _jarvisSay('A data do pedido 5909 é ' + fmtDate(row.data)); } else { _jarvisSay('Pedido 5909 não encontrado.'); }", "speech": "Buscando a data do pedido..."
  * Para saber/perguntar quem é o motorista do pedido 5909:
    "code": "const row = allRows.find(r => String(r.pedido) === '5909'); if (row) { _jarvisSay('O motorista do pedido 5909 é ' + (row.motorista || 'não informado')); } else { _jarvisSay('Pedido não encontrado.'); }", "speech": "Buscando motorista..."
  * Para saber/perguntar a rota ou destino do pedido 5909:
    "code": "const row = allRows.find(r => String(r.pedido) === '5909'); if (row) { _jarvisSay('A rota do pedido 5909 é ' + (row.rota || 'não informada')); } else { _jarvisSay('Pedido não encontrado.'); }", "speech": "Buscando rota..."
  * Para consultar/ver/saber o status do pedido 5909 (abrindo detalhes):
    "code": "jarvisHelpers.viewPedido('5909');", "speech": "Aqui está o status do pedido 5909."
  * Para alterar o status do pedido 5909 para Entregue:
    "code": "jarvisHelpers.updateStatus('5909', 'Entregue');", "speech": "Pedido 5909 alterado para Entregue."
  * Para buscar/filtrar por cliente João:
    "code": "jarvisHelpers.search('João');", "speech": "Filtrando pedidos do João."
  * Para limpar filtros de busca:
    "code": "jarvisHelpers.clearAll();", "speech": "Filtros limpos."
  * Para mudar de aba:
    "code": "switchTab('arquivo');", "speech": "Abrindo aba arquivo."
  * Para fechar telas/modais abertos:
    "code": "closeModal('rowModal'); closeModal('viewModal');", "speech": "Telas fechadas."
  * Para mudar o tema do site:
    "code": "toggleTheme();", "speech": "Tema alterado."
  * Para entrar/sair de tela cheia:
    "code": "toggleFullscreenElement('#tableWrap', 'btnFullscreen', 'fullscreenIcon');", "speech": "Tela cheia alternada."

Retorne APENAS o JSON, sem markdown ou explicações.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')    return json({ error: 'Método não permitido' }, 405);

  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (!groqKey) return json({ error: 'GROQ_API_KEY não configurada no servidor' }, 500);

  // ── Autenticação: exige usuário logado e ativo ──────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: 'Não autenticado' }, 401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('ativo')
    .eq('id', user.id)
    .single();
  if (!profile?.ativo) return json({ error: 'Usuário inativo' }, 403);

  // ── Entrada ─────────────────────────────────────────────────
  let text = '';
  try {
    const body = await req.json();
    text = String(body?.text ?? '').trim();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }
  if (!text)                     return json({ error: 'Texto vazio' }, 400);
  if (text.length > MAX_TEXT_LEN) return json({ error: 'Comando muito longo' }, 400);

  // ── Chamada ao Groq ─────────────────────────────────────────
  const res = await fetch(GROQ_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'Você é um assistente que retorna APENAS JSON válido, sem markdown, sem explicações.' },
        { role: 'user',   content: buildPrompt(text) },
      ],
      temperature: 0.1,
      max_tokens: 256,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Groq error', res.status, err);
    return json({ error: err?.error?.message || `Erro Groq (${res.status})` }, 502);
  }

  const data = await res.json();
  return json({
    content: data?.choices?.[0]?.message?.content || '{}',
    finish_reason: data?.choices?.[0]?.finish_reason ?? null,
  });
});

