create table public.pessoas_do_negocio (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  nome        text not null,
  papel       text,
  -- ============================================================
  -- ESTES TRES CAMPOS ESTAO SEM USO HOJE, E NAO SAO COLUNA MORTA.
  --
  -- Em 18/08/2026 o redline de LGPD (lp/docs/redline-lgpd.md) apertou a
  -- regra: a politica passou a aceitar foto com pessoa identificavel
  -- SOMENTE quando a pessoa for o proprio titular da conta. Foto de
  -- funcionario, cliente ou familiar e recusada. Ver privacidade.html
  -- secao 2-A.
  --
  -- Enquanto essa regra valer, `aparece_em_criativo` fica sempre false
  -- para terceiro e os dois campos de consentimento ficam nulos — nao
  -- porque ninguem os implementou, mas porque a politica proibe o caso
  -- que eles descrevem.
  --
  -- NAO APAGUE. A propria secao 2-A promete o recurso de autorizacao de
  -- imagem: a pessoa fotografada recebe um link, ve a imagem, e registra
  -- a autorizacao. Quando ele for construido, e aqui que o registro mora,
  -- e a exigencia da LGPD de consentimento DEMONSTRAVEL e o motivo de
  -- guardar a redacao vigente junto com a data.
  -- ============================================================
  aparece_em_criativo        boolean not null default false,
  -- Consentimento sob a LGPD precisa ser DEMONSTRÁVEL, e "clicou sim" não
  -- demonstra a quê. Guardar a redação vigente no momento do aceite é o
  -- que permite responder, dois anos depois, o que foi autorizado.
  consentimento_imagem_em    timestamptz,
  consentimento_imagem_texto text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.pessoas_do_negocio add constraint pessoas_id_business_key unique(id,business_id);

create table public.entrevistas (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.businesses (id) on delete cascade,
  realizada_em      timestamptz not null,
  conduzida_por     text not null,
  transcricao text,
  ferramenta        text,
  -- O par da transcrição: os números anotados à mão durante a conversa.
  -- É deles que sai a procedência 'manual'.
  anotacoes_numeros jsonb,
  criado_em         timestamptz not null default now()
);

alter table public.entrevistas add constraint entrevistas_id_business_key unique(id,business_id);

create table public.propostas_de_perfil (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses (id) on delete cascade,
  entrevista_id uuid not null,

  -- Daqui a seis meses a pergunta útil diante de uma proposta esquisita
  -- não é "o modelo errou", é QUAL prompt e QUAL modelo produziram isto.
  -- Sem estas duas colunas a pergunta não tem resposta.
  prompt_versao  text not null,
  modelo         text not null,

  estado         text not null default 'aberta',
  criado_em      timestamptz not null default now(),
  aplicada_em    timestamptz,
  aplicada_por   text,

  tokens_entrada integer,
  tokens_saida   integer,

  -- O que a verificação do §3(d) recusou, com motivo. Não vira item —
  -- mas some do lugar errado, não do registro.
  descartados    jsonb not null default '[]'::jsonb,

  constraint propostas_estado_check
    check (estado in ('aberta', 'aplicada', 'descartada')),
  -- Estado terminal exige carimbo. Sem isto, "aplicada" sem data é um
  -- registro que não responde quando.
  constraint propostas_aplicada_carimbada_check
    check ((estado = 'aplicada') = (aplicada_em is not null and aplicada_por is not null))
);

alter table public.propostas_de_perfil add constraint propostas_entrevista_negocio_fkey foreign key(entrevista_id,business_id) references public.entrevistas(id,business_id) on delete cascade;

create table public.itens_da_proposta (
  id            uuid primary key default gen_random_uuid(),
  proposta_id   uuid not null references public.propostas_de_perfil (id) on delete cascade,

  -- Só as três tabelas que têm coluna `procedencia`. `pessoas_do_negocio`
  -- fica de fora de propósito: extrair pessoa é criar LINHA, não preencher
  -- campo, e misturar as duas formas numa tabela só é o que faria a tela
  -- de revisão precisar de dois modos.
  tabela_alvo   text not null,
  campo         text not null,

  valor_proposto jsonb not null,
  confianca      text not null,
  trecho         text not null,
  trecho_verificado boolean not null default false,

  -- Números: o que a pessoa da V2G anotou à mão, quando diverge do que o
  -- agente extraiu. A anotação é `manual` e vence — quem anotou ouviu com
  -- o ouvido, não com o transcritor.
  divergencia_anotacao boolean not null default false,
  valor_anotado        jsonb,

  decisao       text not null default 'pendente',
  valor_final   jsonb,
  decidido_por  text,
  decidido_em   timestamptz,

  criado_em     timestamptz not null default now(),

  constraint itens_tabela_alvo_check
    check (tabela_alvo in ('businesses', 'identidade_visual', 'narrativa_negocio')),
  constraint itens_confianca_check
    check (confianca in ('explicito', 'inferido')),
  constraint itens_decisao_check
    check (decisao in ('pendente', 'aceito', 'corrigido', 'descartado')),

  -- `corrigido` sem valor digitado seria uma correção que não corrigiu
  -- nada; `pendente` ou `descartado` COM valor final seria um valor que
  -- ninguém escolheu esperando para ser gravado.
  constraint itens_valor_final_coerente_check
    check (
      (decisao = 'corrigido' and valor_final is not null)
      or (decisao = 'aceito')
      or (decisao in ('pendente', 'descartado') and valor_final is null)
    ),
  constraint itens_decisao_carimbada_check
    check ((decisao = 'pendente') = (decidido_em is null and decidido_por is null)),

  constraint itens_anotacao_coerente_check
    check (divergencia_anotacao = false or valor_anotado is not null),

  -- Um item por campo por proposta.
  constraint itens_campo_unico unique (proposta_id, tabela_alvo, campo)
);

alter table public.itens_da_proposta add constraint itens_aceito_sem_override_check check(decisao<>'aceito' or valor_final is null or valor_final=valor_proposto);

create table public.divergencias_de_cadastro (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses(id) on delete cascade,
  execucao_id         uuid,
  campo               text not null,
  valor_recusado      jsonb not null,
  valor_mantido       jsonb,
  procedencia_mantida text not null,
  origem_tentada      text not null,
  por                 text,
  em                  timestamptz not null default now()
);

alter table public.creatives add column pessoa_id uuid;
alter table public.creatives add constraint creatives_pessoa_negocio_fkey foreign key(pessoa_id,business_id) references public.pessoas_do_negocio(id,business_id) on delete set null(pessoa_id);
alter table public.creatives add constraint creatives_uso_check check(uso in ('logo','identidade','campanha','referencia'));

create index pessoas_do_negocio_business_id_idx on public.pessoas_do_negocio(business_id);
create index entrevistas_business_id_idx on public.entrevistas(business_id,realizada_em desc);
create index propostas_de_perfil_business_idx on public.propostas_de_perfil(business_id,criado_em desc);
create unique index propostas_uma_aberta_por_entrevista on public.propostas_de_perfil(entrevista_id) where estado='aberta';
create index itens_da_proposta_proposta_idx on public.itens_da_proposta(proposta_id);
create index itens_da_proposta_pendentes_idx on public.itens_da_proposta(proposta_id) where decisao='pendente';
create index idx_divergencias_business on public.divergencias_de_cadastro(business_id);
create index idx_divergencias_execucao on public.divergencias_de_cadastro(execucao_id);
create index creatives_pessoa_id_idx on public.creatives(pessoa_id) where pessoa_id is not null;

alter table public.pessoas_do_negocio enable row level security;
revoke all on public.pessoas_do_negocio from public,anon,authenticated,service_role;

alter table public.entrevistas enable row level security;
revoke all on public.entrevistas from public,anon,authenticated,service_role;

alter table public.propostas_de_perfil enable row level security;
revoke all on public.propostas_de_perfil from public,anon,authenticated,service_role;

alter table public.itens_da_proposta enable row level security;
revoke all on public.itens_da_proposta from public,anon,authenticated,service_role;

alter table public.divergencias_de_cadastro enable row level security;
revoke all on public.divergencias_de_cadastro from public,anon,authenticated,service_role;

grant select,insert,update,delete on public.pessoas_do_negocio to authenticated,service_role;
grant select on public.entrevistas to authenticated;
grant select,insert on public.entrevistas,public.divergencias_de_cadastro to service_role;
grant select,insert,update,delete on public.propostas_de_perfil,public.itens_da_proposta to service_role;

create policy pessoas_do_negocio_select_own on public.pessoas_do_negocio for select to authenticated using(private.owns_business(business_id));
create policy pessoas_do_negocio_insert_own on public.pessoas_do_negocio for insert to authenticated with check(private.owns_business(business_id));
create policy pessoas_do_negocio_update_own on public.pessoas_do_negocio for update to authenticated using(private.owns_business(business_id)) with check(private.owns_business(business_id));
create policy pessoas_do_negocio_delete_own on public.pessoas_do_negocio for delete to authenticated using(private.owns_business(business_id));
create policy entrevistas_select_own on public.entrevistas for select to authenticated using(private.owns_business(business_id));
create trigger pessoas_do_negocio_atualizado_em before update on public.pessoas_do_negocio for each row execute function public.set_atualizado_em();

create function public.aplicar_proposta(p_proposta_id uuid,p_por text) returns jsonb
language plpgsql security definer set search_path=public as $apply_profile$
declare v_prop record;v_item record;v_tipo text;v_valor jsonb;v_origem text;v_atual text;v_aplicados int:=0;
begin
 select * into v_prop from public.propostas_de_perfil where id=p_proposta_id for update;
 if not found then raise exception 'proposta nao encontrada';end if;
 if v_prop.estado<>'aberta' then raise exception 'so proposta aberta pode ser aplicada';end if;
 perform 1 from public.businesses where id=v_prop.business_id for update;
 if not found then raise exception 'negocio nao encontrado';end if;
 if exists(select 1 from public.itens_da_proposta where proposta_id=p_proposta_id and decisao='pendente') then raise exception 'ainda ha itens pendentes';end if;
 for v_item in select * from public.itens_da_proposta where proposta_id=p_proposta_id and decisao in ('aceito','corrigido') order by tabela_alvo,campo for update loop
  if not ((v_item.tabela_alvo,v_item.campo) in(values ('businesses','name'),('businesses','city'),('businesses','cep'),('businesses','niche'),('businesses','description'),('businesses','atende_somente_no_local'),('businesses','business_hours'),('businesses','availability'),('businesses','delivery_time'),('businesses','payment_policy'),('businesses','guarantee'),('businesses','differentiators'),('businesses','site_url'),('businesses','instagram_handle'),('businesses','avg_ticket_min'),('businesses','avg_ticket_max'),('businesses','avg_direct_cost'),('businesses','target_profit_per_customer'),('businesses','monthly_budget'),('narrativa_negocio','quem_somos'),('narrativa_negocio','historia'),('narrativa_negocio','por_que_existe'),('narrativa_negocio','para_quem'),('narrativa_negocio','o_que_nao_fazemos'),('identidade_visual','tom_de_voz'),('identidade_visual','observacoes'))) then raise exception 'campo fora do perfil permitido';end if;
  if v_item.decisao='aceito' and v_item.valor_final is not null and v_item.valor_final is distinct from v_item.valor_proposto then raise exception 'aceito nao permite override';end if;
  v_valor:=case when v_item.decisao='corrigido' then v_item.valor_final else v_item.valor_proposto end;
  v_origem:=case when v_item.decisao='corrigido' then 'manual' else 'extraido' end;
  if v_item.tabela_alvo='identidade_visual' then
   insert into public.identidade_visual(business_id) values(v_prop.business_id) on conflict(business_id) do nothing;
   perform 1 from public.identidade_visual where business_id=v_prop.business_id for update;
  elsif v_item.tabela_alvo='narrativa_negocio' then
   insert into public.narrativa_negocio(business_id) values(v_prop.business_id) on conflict(business_id) do nothing;
   perform 1 from public.narrativa_negocio where business_id=v_prop.business_id for update;
  end if;
  v_atual:=public.procedencia_do_campo(v_item.tabela_alvo,v_prop.business_id,v_item.campo);
  if v_atual='confirmado' and v_item.decisao='aceito' then raise exception 'campo ja confirmado pelo cliente';end if;
  select data_type into v_tipo from information_schema.columns where table_schema='public' and table_name=v_item.tabela_alvo and column_name=v_item.campo;
  if v_tipo is null then raise exception 'campo de perfil inexistente';end if;
  execute format('update public.%I set %I = %s where %I = $2',v_item.tabela_alvo,v_item.campo,
   case v_tipo when 'numeric' then '($1 #>> ''{}'')::numeric' when 'integer' then '($1 #>> ''{}'')::integer' when 'boolean' then '($1 #>> ''{}'')::boolean' when 'ARRAY' then 'array(select jsonb_array_elements_text($1))' else '($1 #>> ''{}'')' end,
   case when v_item.tabela_alvo='businesses' then 'id' else 'business_id' end) using v_valor,v_prop.business_id;
  perform public.registrar_procedencia(v_item.tabela_alvo,v_prop.business_id,v_item.campo,v_origem,p_por,
   jsonb_build_object('proposta_id',p_proposta_id,'item_id',v_item.id,'entrevista_id',v_prop.entrevista_id));
  v_aplicados:=v_aplicados+1;
 end loop;
 update public.propostas_de_perfil set estado='aplicada',aplicada_em=now(),aplicada_por=p_por where id=p_proposta_id;
 return jsonb_build_object('aplicados',v_aplicados);
end;
$apply_profile$;

create function public.escrever_apenas_se_livre(
  p_business_id uuid,
  p_campo       text,
  p_valor       jsonb,
  p_origem      text,
  p_por         text,
  p_execucao_id uuid default null
) returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_atual        text;
  v_valor_atual  jsonb;
  v_afetadas     int;
begin
  -- `confirmado` NAO entra aqui. Ele so nasce em `confirmar_campo_do_cliente`,
  -- que e a unica porta que representa o cliente. Uma escrita automatica
  -- alegando confirmacao seria afirmacao falsa sobre quem disse o que.
  if p_origem is null or p_origem not in ('manual', 'extraido') then
    raise exception
      'origem invalida para escrita automatica: %. Use manual (alguem da V2G anotou na conversa) ou extraido (o agente tirou da transcricao). `confirmado` so sai de confirmar_campo_do_cliente.',
      p_origem;
  end if;

  if p_campo is null or p_campo not in ('name','city','cep','niche','description','atende_somente_no_local','business_hours','availability','delivery_time','payment_policy','guarantee','differentiators','site_url','instagram_handle','avg_ticket_min','avg_ticket_max','avg_direct_cost','target_profit_per_customer','monthly_budget') then raise exception 'campo fora do perfil permitido';end if;

  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'businesses' and column_name = p_campo
  ) then
    raise exception 'campo % nao existe em businesses', p_campo;
  end if;

  perform 1 from public.businesses where id=p_business_id for update;
  if not found then
    raise exception 'negocio % nao encontrado', p_business_id;
  end if;

  -- Valor nulo nao apaga. Ausente no cadastro significa "nao falamos disso",
  -- nunca "apaga o que estava la" — mesma regra do `exclude_unset` do
  -- /onboarding/call.
  if p_valor is null or jsonb_typeof(p_valor) = 'null' then
    return 'sem_valor';
  end if;

  v_atual := public.procedencia_do_campo('businesses', p_business_id, p_campo);

  execute format('select to_jsonb(b.%I) from public.businesses b where b.id = $1', p_campo)
     into v_valor_atual using p_business_id;

  -- ---------- A trava ----------
  if v_atual = 'confirmado' then
    -- Mesmo valor nao e divergencia: o formulario so concorda com o cliente.
    if v_valor_atual is not distinct from p_valor then
      return 'ja_igual';
    end if;

    insert into public.divergencias_de_cadastro
      (business_id, execucao_id, campo, valor_recusado, valor_mantido,
       procedencia_mantida, origem_tentada, por)
    values
      (p_business_id, p_execucao_id, p_campo, p_valor, v_valor_atual,
       v_atual, p_origem, p_por);

    return 'pulado_confirmado';
  end if;

  -- ---------- A escrita, valor e procedencia na mesma transacao ----------
  -- `jsonb_populate_record` faz a coercao de tipo pela propria definicao da
  -- tabela: text, numeric, boolean e text[] saem certos sem cast a mao, e sem
  -- o `->>` que devolveria escalar com aspas.
  execute format(
    'update public.businesses set %I = v.%I, updated_at = now() '
    'from (select * from jsonb_populate_record(null::public.businesses, '
    '                                          jsonb_build_object(%L, $1))) as v '
    'where public.businesses.id = $2',
    p_campo, p_campo, p_campo
  ) using p_valor, p_business_id;

  get diagnostics v_afetadas = row_count;
  if v_afetadas = 0 then
    raise exception 'negocio % nao encontrado na escrita de %', p_business_id, p_campo;
  end if;

  perform public.registrar_procedencia(
    'businesses', p_business_id, p_campo, p_origem, p_por,
    case when p_execucao_id is null then '{}'::jsonb
         else jsonb_build_object('execucao_id', p_execucao_id) end
  );

  return 'gravado';
end $function$;

revoke all on function public.aplicar_proposta(uuid,text),public.escrever_apenas_se_livre(uuid,text,jsonb,text,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.aplicar_proposta(uuid,text),public.escrever_apenas_se_livre(uuid,text,jsonb,text,text,uuid) to service_role;
