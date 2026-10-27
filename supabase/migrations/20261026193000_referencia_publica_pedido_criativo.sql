-- ADITIVA: mantém pedidos e envios v1; permite somente vínculo por ID público na v2.
-- Revisar e aplicar no ambiente autorizado antes de habilitar o catálogo.
-- Não copia, incorpora nem autoriza usar imagem de terceiro.

alter table public.creative_generation_requests
  drop constraint creative_generation_requests_payload_check;
alter table public.creative_generation_requests
  add constraint creative_generation_requests_payload_check check (
    jsonb_typeof(payload) = 'object'
    and payload ?& array['versao', 'objetivo', 'oferta', 'acao', 'promocao', 'validade']
    and (
      payload @> '{"versao":1}'::jsonb
      or (payload @> '{"versao":2}'::jsonb
        and coalesce(jsonb_typeof(payload->'referenciaId') = 'string', false)
        and coalesce(payload->>'referenciaId' ~ '^[0-9]{10,20}$', false))
    )
    and jsonb_typeof(payload->'objetivo') = 'string'
    and jsonb_typeof(payload->'oferta') = 'string'
    and jsonb_typeof(payload->'acao') = 'string'
    and jsonb_typeof(payload->'promocao') = 'boolean'
    and (
      (payload->'promocao' = 'false'::jsonb and payload->'validade' = 'null'::jsonb)
      or (payload->'promocao' = 'true'::jsonb
        and jsonb_typeof(payload->'validade') = 'string'
        and payload->>'validade' ~ '^\d{4}-\d{2}-\d{2}$')
    )
    and char_length(payload->>'objetivo') between 2 and 500
    and char_length(payload->>'oferta') between 2 and 500
    and char_length(payload->>'acao') between 2 and 200
    and octet_length(payload::text) <= 8192
  );

alter table public.creative_review_requests
  drop constraint creative_review_upload_intent_valida;
alter table public.creative_review_requests
  add constraint creative_review_upload_intent_valida check (
    upload_intent is null or coalesce((
      jsonb_typeof(upload_intent) = 'object'
      and octet_length(upload_intent::text) <= 512
      and upload_intent ?& array['version', 'objective', 'promotionEndsOn', 'confirmedAt']
      and (
        (upload_intent->'version' = '1'::jsonb
          and (upload_intent - array['version', 'objective', 'promotionEndsOn', 'confirmedAt']) = '{}'::jsonb)
        or (upload_intent->'version' = '2'::jsonb
          and (upload_intent - array['version', 'objective', 'promotionEndsOn', 'confirmedAt', 'referenceId']) = '{}'::jsonb
          and jsonb_typeof(upload_intent->'referenceId') = 'string'
          and upload_intent->>'referenceId' ~ '^[0-9]{10,20}$')
      )
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
