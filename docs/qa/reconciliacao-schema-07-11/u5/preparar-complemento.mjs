// Consulta complementar estrita permitida pela Central: so commercial_events.
import {readFileSync,writeFileSync} from 'node:fs';
const old=readFileSync(new URL('../u4/capturar-pais.sql',import.meta.url),'utf8');
const relation=old.trim().replace(/;$/,'').replace("'profiles','leads_lp','commercial_orders'","'commercial_events'");
const extra="jsonb_build_object('column_details',(select jsonb_agg(jsonb_build_object('schema','public','table','commercial_events','column',a.attname,'identity',a.attidentity,'generated',a.attgenerated,'comment',col_description(a.attrelid,a.attnum)) order by a.attnum) from pg_attribute a where a.attrelid='public.commercial_events'::regclass and a.attnum>0 and not a.attisdropped),'definitions',(select jsonb_agg(jsonb_build_object('definition',pg_get_functiondef(p.oid),'owner',p.proowner::regrole::text,'acl',p.proacl::text)) from pg_trigger t join pg_proc p on p.oid=t.tgfoid where t.tgrelid='public.commercial_events'::regclass and not t.tgisinternal))";
writeFileSync(new URL('capturar-eventos.sql',import.meta.url),'-- Catalogos apenas, complementar indispensavel. Nenhuma linha comercial/Auth/Vault.\nselect ('+relation+')||'+extra+';\n');
