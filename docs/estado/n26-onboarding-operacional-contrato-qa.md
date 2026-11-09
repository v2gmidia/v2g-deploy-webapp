# Onboarding operacional — contrato candidato para QA — 09/11/2026

## Estado deste documento

Contrato ratificado pela Central para a candidata QA. O endpoint é
`POST /cadastro/operacional`: recebe a chamada server-only autenticada pelo
token de máquina, depois de o WebApp provar sessão e negócio ativo; valida a entrada e devolve conferência,
sem criar execução, disparar pipeline ou persistir no backend. A persistência
operacional continua no JSON versionado do WebApp. Para respeitar a função de
merge existente sem migration, metadados ficam em chaves reservadas de
`onboarding.respostas` (`_contatos_anunciante`, `_oferta` e
`_cadastro_operacional`). Relação, anunciante e contratante são respostas
atômicas explícitas; não são inferidos do nome da conta. Isto não autoriza webhook,
migration, provedor real ou o `/cadastro` legado.

## 1. Estados separados

O produto não usa mais um único booleano `cadastro completo` para representar
todas as decisões. A candidata QA separa:

- `cadastro_operacional`: contexto mínimo do anunciante e teto de mídia;
- `conexao`: ativos e permissões necessários para ler ou operar a conta;
- `revisao`: oferta, materiais e destino de atendimento conferidos;
- `autorizacao_publicacao`: autorização explícita para criar ou publicar;
- `diagnostico_economico`: ausente, parcial ou disponível, sem travar entrada.

Leitura de campanha existente depende da conexão correspondente, não da criação
de uma execução. Concluir cadastro operacional não dispara publicação.

## 2. Nomes candidatos do contrato versionado

```ts
type CadastroOperacionalV2 = {
  versao_contrato: "cadastro_operacional.v2";
  business_id: string;
  anunciante: {
    nome: string;
    descricao_livre: string;
    comprador_prioritario?: string;
  };
  relacao_de_acesso: {
    modelo: "direto" | "agencia_operadora";
    contratante_nome?: string;
    anunciante_nome: string;
    identidade_com_acesso: "contratante" | "agencia" | "anunciante";
  };
  campanha: {
    caminho: "existente" | "nova" | "a_definir";
  };
  atendimento: {
    destino?: "whatsapp" | "instagram" | "site" | "telefone" | "formulario" | "outro";
    destino_detalhe?: string;
    praca?: string;
  };
  oferta?: {
    descricao?: string;
    preco_referencia?: {
      moeda: "BRL";
      valor_min?: number;
      valor_max?: number;
      unidade: string;
      certeza: "confirmado" | "aproximado" | "nao_confirmado";
      fonte?: string;
      observado_em?: string;
    };
  };
  orcamento_mensal_disponivel: number;
};
```

O exemplo relatado de R$ 69–70 por fardo, com quantidade interna ainda não
confirmada, cabe apenas em `oferta.preco_referencia`. Ele não preenche
`ticket_medio` e não autoriza cálculo unitário.

## 3. Semântica de omissão, `null` e zero

- campo omitido: não alterar o valor que já existe;
- `null`: ausência conhecida, não comando implícito para apagar;
- zero: valor zero informado e confirmado, nunca substituto de desconhecido;
- dado legado: preservado com sua procedência e horário;
- campo desconhecido: permanece desconhecido e não impede o cadastro
  operacional, salvo se for uma guarda específica da ação solicitada.

## 4. Compatibilidade com o contrato legado

`CadastroCompleto`/`POST /cadastro` continua sendo chamado de contrato legado
V1. O WebApp não converte automaticamente `CadastroOperacionalV2` em V1. O
contrato V2 usa somente `/cadastro/operacional` e seu sucesso não significa
persistência, conclusão do onboarding, revisão, autorização ou publicação.

Nomes ratificados pela Central:

1. literal de versão `cadastro_operacional.v2`;
2. `relacao_de_acesso` e seus literais;
3. `campanha.caminho`;
4. `atendimento.destino`;
5. `oferta.preco_referencia`;
6. resposta com `estado: "conferido_sem_execucao"`, `persistido: false`,
   `id_execucao: null` e `pipeline_disparado: false`, mantendo criação e
   publicação não autorizadas;
7. `diagnostico_economico: "indisponivel"`, derivados nulos e
   `pendencias_por_acao` próprias da operação.

## 5. Guardas por ação

| Ação | Guarda mínima |
|---|---|
| concluir onboarding | `cadastro_operacional` pronto |
| ler campanha existente | conexão válida com a conta/ativo |
| preparar campanha nova | cadastro operacional + conexão + revisão |
| criar/publicar | guardas anteriores + autorização explícita + pré-voo |
| diagnóstico econômico | dados econômicos confiáveis, sob demanda |

Custo direto e lucro desejado ficam fora de toda entrada inicial. Ticket médio
é opcional e não é derivado de preço por unidade, embalagem ou fardo.
