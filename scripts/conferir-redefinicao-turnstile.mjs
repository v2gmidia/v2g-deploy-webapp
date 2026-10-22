import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const fonte = caminho => readFileSync(new URL('../' + caminho, import.meta.url), 'utf8');

test('redefinicao tem dois controles independentes acessiveis sem submit', () => {
  const form = fonte('app/(public)/redefinir/Form.tsx');
  assert.equal((form.match(/type="button"/g) ?? []).length, 2);
  for (const texto of ['Mostrar nova senha', 'Ocultar nova senha', 'Mostrar confirmação', 'Ocultar confirmação']) assert.ok(form.includes(texto));
  assert.match(form, /aria-controls="senha-nova"/);
  assert.match(form, /aria-controls="senha-confirmar"/);
  assert.match(form, /type=\{mostrarSenha \? "text" : "password"\}/);
  assert.match(form, /type=\{mostrarConfirmacao \? "text" : "password"\}/);
});
test('senha salva tem destino publico independente da sessao encerrada', () => {
  const action = fonte('app/(public)/redefinir/actions.ts');
  assert.ok(action.indexOf('validarNovaSenha(senha, confirmarSenha)') < action.indexOf('auth.updateUser'));
  assert.ok(action.indexOf('auth.updateUser') < action.indexOf('auth.signOut'));
  assert.match(action, /redirect\(saidaConfirmada \? "\/redefinir\/concluido"/);
  const page = fonte('app/(public)/redefinir/concluido/page.tsx');
  assert.match(page, /Sua nova senha foi salva/);
  assert.match(page, /href="\/entrar\?modo=login&adicionar=1"/);
  assert.doesNotMatch(page, /getUser|createClient|password|token/);
  assert.match(fonte('app/(public)/entrar/page.tsx'), /Suspense fallback=/);
});
test('Turnstile usa render explicito a cada montagem e remove widget na saida', () => {
  const widget = fonte('components/seguranca/Turnstile.tsx');
  assert.match(widget, /api\.js\?render=explicit/);
  assert.match(widget, /onReady=/);
  assert.match(widget, /api\.render\(container\.current/);
  assert.match(widget, /api\.remove\(id\)/);
  assert.match(widget, /\[pronto, siteKey\]/);
  assert.doesNotMatch(widget, /className="cf-turnstile"/);
});
