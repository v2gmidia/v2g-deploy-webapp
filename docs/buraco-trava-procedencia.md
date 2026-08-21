# Buraco — a trava do valor confirmado não protege `UPDATE` direto

MEDIDO em 21/08/2026, lendo as migrations 0011, 0013 e 0015 contra o schema
real do V2G-SITE (`ushccxpoxjikzqnwhgfd`).

Não é deste lote. Está aqui porque é buraco real e some da memória se não
ficar escrito.

---

## O que a trava é, e onde ela mora

`0013_aplicar_proposta.sql`, dentro do laço que aplica os itens:

```sql
v_atual := public.procedencia_do_campo(
  v_item.tabela_alvo, v_prop.business_id, v_item.campo
);

if v_atual = 'confirmado' and v_item.decisao = 'aceito' then
  raise exception
    'o campo %.% ja foi confirmado pelo cliente. Aceitar a proposta do
     agente o sobrescreveria: corrija a mao (assumindo a troca) ou
     descarte o item.', v_item.tabela_alvo, v_item.campo;
end if;
```

Ela é mais fina do que "não sobrescreve confirmado": recusa **`aceito`** e
deixa **`corrigido`** passar. O comentário da própria migration explica —
*"Aceitar é não fazer nada, é o clique que se dá em vinte itens seguidos sem
ler. Corrigir é alguém ter digitado o valor com o aviso do conflito na
tela."*

## O buraco

**A trava é código dentro de uma função, não garantia da tabela.**

Ela protege exatamente um escritor: `aplicar_proposta`. Tudo o mais passa ao
largo sem tocar nela:

| escritor | passa pela trava? |
|---|---|
| `aplicar_proposta` (0013) | sim — é onde ela mora |
| `confirmar_campo_do_cliente` (0015) | não precisa: é ela que **produz** `confirmado` |
| `registrar_procedencia` (0011) | **não** — e só escreve o jsonb, nem toca no valor |
| `UPDATE public.businesses SET ...` direto | **não** |
| qualquer escritor novo | **não** |

E o modo de falha do `UPDATE` direto é pior do que perder a origem: o jsonb
de `procedencia` **não é tocado**. O valor muda e a procedência fica lá,
intacta, afirmando que o cliente confirmou um valor que ele nunca viu.
**Não apaga a origem — transforma a origem em mentira**, e em silêncio.
Apagar deixaria rastro; isto não deixa.

A cicatriz da `/conta`, registrada em `lib/cadastro/procedencia.ts`, é a
mesma família: *"Dois caminhos de escrita para a mesma coluna sempre acabam
assim."*

## O que já foi feito por cima disto

A migration `0019_escrever_apenas_se_livre.sql` dá ao backend uma porta que
respeita a regra — valor e procedência na mesma transação, pula o campo
`confirmado` e grava a divergência em `divergencias_de_cadastro`.

**Isso não fecha o buraco.** Fecha um escritor. O `UPDATE` direto continua
possível para quem não souber que a porta existe.

## Candidato de conserto: trigger

O que fecharia de verdade é um `before update` em `businesses`,
`identidade_visual` e `narrativa_negocio` que recuse mudança de valor em
campo com `procedencia = 'confirmado'` — a menos que a mesma instrução
atualize a procedência junto, que é o que as funções fazem.

Três coisas a resolver antes, e é por isso que é candidato e não plano:

1. **Como o trigger distingue escrita legítima de ilegítima.** As funções
   `security definer` também emitem `UPDATE`. Um flag de sessão
   (`set_config('v2g.porta_legitima', ...)`) resolve, mas é estado de
   sessão — e estado de sessão em pooler de transação é armadilha.
2. **Migração do que já existe.** Hoje o negócio `a85c37a9` tem 20 campos
   com procedência. Um trigger estrito pode travar escrita que hoje passa e
   que alguém depende.
3. **`service_role` ignora RLS mas não ignora trigger.** Isso é a favor —
   seria a primeira regra deste schema que vale igual para os dois lados.

## Nota separada: `resultado_campanhas_anteriores` merece coluna

Não tem coluna em `businesses` e não deveria virar jsonb de execução. Hoje
só alimenta o `diagnosticar-orcamento` daquela execução e ninguém lê depois.
É o dado mais interessante dos quatro que ficaram de fora do espelho —
quando alguém for usar histórico de campanha do cliente, começa por dar uma
coluna a ele.
