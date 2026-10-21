-- Preparada localmente. Não aplicada. Mantém bucket privado, RLS e permissões atuais.
-- NULL preserva o legado; nunca inferir um objetivo para envios anteriores.
alter table public.creative_review_requests add column upload_intent jsonb;

alter table public.creative_review_requests
  add constraint creative_review_upload_intent_valida check (
    upload_intent is null or coalesce((
      jsonb_typeof(upload_intent) = 'object'
      and octet_length(upload_intent::text) <= 512
      and upload_intent ?& array['version', 'objective', 'promotionEndsOn', 'confirmedAt']
      and (upload_intent - array['version', 'objective', 'promotionEndsOn', 'confirmedAt']) = '{}'::jsonb
      and upload_intent->'version' = '1'::jsonb
      and jsonb_typeof(upload_intent->'objective') = 'string'
      and upload_intent->>'objective' in ('whatsapp_messages', 'instagram_visits')
      and (upload_intent->'promotionEndsOn' = 'null'::jsonb or (
        jsonb_typeof(upload_intent->'promotionEndsOn') = 'string'
        and upload_intent->>'promotionEndsOn' ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$'
        and to_char((upload_intent->>'promotionEndsOn')::date, 'YYYY-MM-DD') = upload_intent->>'promotionEndsOn'
      ))
      and jsonb_typeof(upload_intent->'confirmedAt') = 'string'
      and upload_intent->>'confirmedAt' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$'
      and to_char((upload_intent->>'confirmedAt')::timestamptz at time zone 'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') = upload_intent->>'confirmedAt'
    ), false)
  );

comment on column public.creative_review_requests.upload_intent is
  'Intenção confirmada no app: objetivo e fim de promoção (dia inclusivo em America/Sao_Paulo). Não publica nem agenda pausa. NULL = envio legado sem dados inferidos.';
