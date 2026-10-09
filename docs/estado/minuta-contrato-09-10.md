# Minuta parametrizada do contrato — 09/10/2026

## 0. Dependências humanas que continuam abertas

1. A versão `minuta-interna-2026-10-09-v1` **não foi aprovada por advogado** e não pode ser enviada para assinatura.
2. Permanecem pendentes as decisões que Victor pediu para não inventar: saída antes de seis meses, anual antecipado, inadimplência, renovação, reajuste, suporte, relatórios, comunicações, responsabilidade, tratamento final de dados e foro.
3. O provedor de assinatura continua pendente de identificação, contratação e prova em sandbox.
4. A trava da primeira publicação precisa existir também no serviço que efetivamente publica, não apenas na interface.

## 1. Entregas

- `docs/contrato-v2g-minuta-parametrica.md`: minuta em linguagem clara, com placeholders literais, mapa de variáveis, decisões, fluxo técnico e checklist.
- `docs/contrato-v2g.schema.json`: JSON Schema Draft 2020-12 com tipos, obrigatoriedade, origem e validação.
- `docs/contrato-v2g.exemplo-ficticio.json`: exemplo integralmente fictício e compatível com o schema.
- `docs/contrato-v2g-minuta-parametrica.docx`: versão editável para revisão e comentários.
- `scripts/gerar-contrato-docx.cjs`: gerador reproduzível do DOCX a partir do Markdown.
- `scripts/validar-contrato-docx.py`: conferidor estrutural do pacote DOCX e de frases essenciais.

## 2. Conteúdo preservado

- R$ 500 mensais por conta de anúncios.
- R$ 5.280 no anual pago à vista por conta, com 12% de desconto.
- Permanência mínima de seis meses, sem inventar a consequência jurídica da saída antecipada.
- Verba de mídia separada.
- Acesso ao WebApp após pagamento aprovado; onboarding e reunião possíveis antes da assinatura.
- Primeira publicação manual pelo gestor, depois de assinatura, acessos e conferências.
- Ausência de promessa de resultado.
- Um documento por CNPJ e uma unidade por conta de anúncios.
- Correção pré-assinatura cria nova versão; documento assinado é imutável e mudança posterior exige aditivo ou novo contrato.

## 3. Verificações realizadas

- O schema é JSON válido e foi aceito pelo validador Draft 2020-12 disponível localmente.
- O exemplo fictício passa no schema.
- Quantidade de unidades e valor total foram reconciliados.
- CPF e CNPJs fictícios têm dígitos verificadores válidos.
- O DOCX foi gerado com cabeçalho, rodapé, paginação, estilos, tabelas e marcadores.
- O pacote DOCX passou em verificação independente: ZIP íntegro, XML legível, relacionamentos internos presentes e conteúdo essencial encontrado. Foram encontrados 15 marcadores de decisão pendente.

## 4. Limite da verificação

O conversor de prévia do pacote de documentos falhou no Windows por depender de `socket.AF_UNIX`; o validador auxiliar também não trouxe `defusedxml`. A validação estrutural independente passou, mas **não houve inspeção visual renderizada página a página**. Abrir o DOCX no Word e conferir quebras, tabelas e paginação continua recomendado antes de encaminhá-lo ao advogado.

## 5. Ações não realizadas

Nenhum contrato foi enviado ou assinado. Nenhum provedor foi contratado, nenhuma cobrança ou NFS-e foi criada, nenhuma campanha foi publicada e não houve commit, push, migration ou deploy.
