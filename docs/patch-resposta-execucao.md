# Patch: expor `nome_negocio`, `criado_em` e `atualizado_em`

**O backend não está nesta máquina** — procurei por `main.py`,
`requirements.txt`, `pyproject.toml` e pelo próprio identificador
`RespostaExecucao` em todo o perfil do usuário, e não existe cópia local.
Então este é o patch para você aplicar onde o backend vive.

Independente da migração. Não toca em banco, não toca em rota, não muda
comportamento — só devolve três colunas que **já estão preenchidas** em
`execucoes`.

## O modelo hoje

Extraído do `/openapi.json` do deploy, não do handoff:

```
RespostaExecucao
  id_execucao       str (uuid)     obrigatório
  cliente_id        str | None     obrigatório
  status            EstadoExecucao obrigatório
  nicho             str | None     obrigatório
  requer_revisao    bool           obrigatório
  motivos_revisao   list[str]      obrigatório
  confianca_minima  float | None   obrigatório
  resultados        dict           obrigatório
  aprovacoes        list[dict]     opcional
```

## Os três campos a acrescentar

```python
class RespostaExecucao(BaseModel):
    id_execucao: UUID
    cliente_id: UUID | None
    status: EstadoExecucao
    nicho: str | None
    requer_revisao: bool
    motivos_revisao: list[str]
    confianca_minima: float | None
    resultados: dict
    aprovacoes: list[dict] = []

    # ---- os três novos ----
    nome_negocio: str | None = None
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None
```

**Com valor padrão `None`**, e não obrigatórios: assim o modelo continua
válido para qualquer chamador que ainda não mande os campos, e o deploy
não precisa ser atômico com o resto.

Se a montagem da resposta for explícita (`RespostaExecucao(id_execucao=…,
…)` campo a campo) em vez de `from_orm` / `model_validate`, os três
precisam ser passados também no ponto de construção — em
`GET /execucoes/{id}` e em `GET /execucoes-em-revisao`.

Confira que o `select` do repositório traz as colunas. Se ele lista campos
explicitamente, `nome_negocio`, `criado_em` e `atualizado_em` precisam
entrar na lista.

## Como saber que funcionou, sem abrir a tela

```bash
curl -s https://api.v2gmidia.com.br/execucoes-em-revisao \
  -H "X-V2G-Token: $V2G_BACKEND_TOKEN" \
  | python -c "import json,sys; d=json.load(sys.stdin)[0]; print({k:d.get(k) for k in ('nome_negocio','criado_em','atualizado_em')})"
```

Esperado: os três preenchidos. Hoje esse comando devolve os três como
`None`, porque as chaves nem existem no corpo.

## O que o front faz quando os campos chegarem

`lib/backend/execucoes.ts` já valida de forma defensiva, então **o campo
novo não quebra nada ao aparecer** — ele é ignorado até alguém lê-lo.

O que muda em `app/(protected)/saude-meta/page.tsx`:

- o nome do negócio passa a ser o de verdade, e não o nome da campanha
  gerada com a ressalva "não é o nome do negócio";
- "há quanto tempo está parado" deixa de ser impossível, e a fila pode ser
  ordenada por espera — hoje ela sai na ordem que o backend devolveu;
- três das quatro linhas do bloco "o que a resposta não traz" saem da
  tela.

Aviso ao mexer nisso: `criado_em` e `atualizado_em` **não são mantidos por
gatilho** — o Oregon não tem gatilho nenhum. Quem escreve `atualizado_em`
é a aplicação. Se ela parar de escrever, o campo congela sem erro.
