import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ambienteTs } from './test-utils/ts-isolado.mjs';

test('gráfico acessível preserva investimento zero e lacunas, sem receita nem cliques', () => {
  const { GraficoDiario } = ambienteTs({ ports: {
    './ResumoMetaDoInicio.module.css': { default: new Proxy({}, { get: (_, k) => k }) },
  } }).load('app/(protected)/inicio/GraficoDiario.tsx');
  const h = renderToStaticMarkup(React.createElement(GraficoDiario, {
    moeda: 'BRL', inconsistente: false,
    dias: [100, 0, null].map((gasto, i) => ({ dia: `2026-11-0${i + 1}`, gasto, impressoes: null, cliques: 999 })),
  }));
  assert.match(h, /role="slider"/); assert.match(h, /Use as setas/);
  assert.match(h, /1 de novembro de 2026/); assert.match(h, /0,00/);
  assert.match(h, /Não medido/); assert.match(h, /class="linha"/);
  assert.doesNotMatch(h, /Receita|receita|Não informada|Cliques|999/);
});
