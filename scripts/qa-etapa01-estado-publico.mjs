/** Somente leitura do pedido ficticio estornado; --preview sobe apenas localhost. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { consultarEstadoPagamento } from '../lib/contratacao/consultar-estado-pagamento.ts';
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://zskpijnqgkqwxksqmzmf.supabase.co');
assert.equal(process.env.ASAAS_ENVIRONMENT, 'sandbox');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const { data: pedido, error } = await admin.from('commercial_orders')
  .select('id,status,provider_charge_id').eq('id', '809717c6-1b88-4b97-bacb-e118f2623f2d').single();
assert.ifError(error);
assert.equal(pedido.provider_charge_id, 'pay_hhcjxx7c3ytmt48x');
const estado = await consultarEstadoPagamento(admin, pedido);
assert.equal(estado, 'refunded');
console.log(JSON.stringify({ ok: true, scope: 'Leitura QA', estadoExibido: estado,
  pedidoHistorico: pedido.status, nenhumaEscrita: true }));
if (process.argv.includes('--http')) {
  for (const [ref, esperado] of [
    ['fb6c4adb-aeeb-4aa1-9123-dda12a181d21', 200],
    ['invalida', 400], ['00000000-0000-4000-8000-000000000000', 404],
  ]) {
    const response = await fetch('http://127.0.0.1:3011/api/contratar/status?ref=' + ref);
    assert.equal(response.status, esperado);
    const body = await response.json();
    if (esperado === 200) {
      assert.deepEqual(body, { status: 'refunded' });
      assert.match(response.headers.get('cache-control'), /no-store/);
    } else assert.deepEqual(Object.keys(body), ['erro']);
  }
  console.log('PASS: API local exibe estorno, nao expõe dados privados e rejeita referencias invalidas/ausentes.');
}
if (process.argv.includes('--preview')) {
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3011',
    ...(process.argv.includes('--webpack') ? ['--webpack'] : [])], {
    stdio: 'inherit', env: { ...process.env, V2G_CHECKOUT_ENABLED: 'true',
      V2G_CHECKOUT_API_ENABLED: 'true', V2G_CHECKOUT_SANDBOX_DB_REF: 'zskpijnqgkqwxksqmzmf' },
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('exit', code => { process.exitCode = code ?? 0; });
}
