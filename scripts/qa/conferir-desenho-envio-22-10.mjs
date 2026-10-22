/** Conferencia local de artefatos de planejamento; sem rede, Auth ou escrita. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const manifest = JSON.parse(read('docs/qa/envio-pronto-ui-manifesto-22-10.json'));
assert.equal(manifest.status, 'planned_not_executed_pending_specific_authorization');
assert.equal(manifest.target.app, 'https://v2g-webapp-qa.vercel.app');
assert.equal(manifest.target.supabaseProjectId, 'zskpijnqgkqwxksqmzmf');
assert.notEqual(manifest.target.supabaseProjectId, manifest.target.excludedProductionProjectId);
assert.equal(manifest.target.noConfigurationChanges, true);
assert.equal(manifest.actors.length, 2);
assert.equal(new Set(manifest.actors.map(actor => actor.email)).size, 2);
for (const actor of manifest.actors) {
  assert.match(actor.email, /@example\.invalid$/);
  assert.equal(actor.authUserId, null);
  assert.equal(actor.businessId, null);
}
assert.deepEqual(manifest.observedIds, { requests: [], objects: [], auxiliaryTasks: [] });
const image = readFileSync(new URL(manifest.image.source, root));
assert.equal(image.length, manifest.image.sizeBytes);
assert.equal(createHash('sha256').update(image).digest('hex'), manifest.image.sha256);
assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
assert.equal(manifest.uiCases.length, 6);
assert.ok(manifest.uiCases.every(test => test.status === 'pending'));
assert.equal(new Set(manifest.uiCases.map(test => test.id)).size, 6);
console.log('PASS manifesto planejado, QA isolado, dois atores nao criados, PNG e seis casos pendentes');

const architecture = read('docs/criativos-arquitetura-dados-documentos-n8n.md');
const examples = [...architecture.matchAll(/```json\r?\n([\s\S]*?)\r?\n```/g)]
  .map(match => JSON.parse(match[1]));
assert.equal(examples.length, 4);
assert.equal(examples[0].requestedFormats.length, 1);
assert.equal(examples[1].contractVersion, 'creative-generation.v1-proposal');
assert.equal(examples[2].providerCalled, false);
assert.equal(examples[3].cost.billed, null);
assert.equal(examples[3].cost.usageReported, null);
assert.ok(architecture.includes('Critérios propostos, não testes executados'));
assert.ok(architecture.includes('Itens 3/4/5 permanecem fora do escopo'));
console.log('PASS quatro exemplos JSON conceituais; custo desconhecido nao vira zero; aceite nao alegado');
for (const path of [
  'docs/criativos-arquitetura-dados-documentos-n8n.md',
  'docs/qa/envio-pronto-ui-manifesto-22-10.json',
  'docs/estado/e28-05-06-envio-e-desenho-22-10.md',
  'scripts/qa/conferir-desenho-envio-22-10.mjs',
]) {
  assert.ok(read(path).split(/\r?\n/).every(line => !/[ \t]+$/.test(line)), path);
}
console.log('PASS whitespace dos quatro artefatos, incluindo arquivos ainda nao rastreados');
console.log('Somente validacao estatica local. Nao executa ensaio UI nem geracao.');
