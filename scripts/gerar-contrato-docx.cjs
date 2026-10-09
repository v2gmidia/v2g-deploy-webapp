const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1007-641-0_26.1007.641.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/docx");

const raiz = path.resolve(__dirname, "..");
const origem = path.join(raiz, "docs", "contrato-v2g-minuta-parametrica.md");
const destino = path.join(raiz, "docs", "contrato-v2g-minuta-parametrica.docx");
const markdown = fs.readFileSync(origem, "utf8").replace(/\r\n/g, "\n");

const CORES = {
  tinta: "15243A",
  secundaria: "526274",
  linha: "D7DEE7",
  suave: "F4F7FA",
  aviso: "FFF3CD",
  avisoLinha: "E0A800",
  branco: "FFFFFF",
};

function runsInline(texto, opcoes = {}) {
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return partes.map((parte) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      return new TextRun({ text: parte.slice(2, -2), bold: true, ...opcoes });
    }
    if (parte.startsWith("`") && parte.endsWith("`")) {
      return new TextRun({
        text: parte.slice(1, -1),
        font: "Consolas",
        size: 19,
        color: "23395B",
        shading: { type: ShadingType.CLEAR, fill: "EEF2F7", color: "auto" },
        ...opcoes,
      });
    }
    return new TextRun({ text: parte, ...opcoes });
  });
}

function celula(texto, largura, cabecalho = false) {
  return new TableCell({
    width: { size: largura, type: WidthType.DXA },
    shading: cabecalho
      ? { type: ShadingType.CLEAR, fill: CORES.tinta, color: "auto" }
      : { type: ShadingType.CLEAR, fill: CORES.branco, color: "auto" },
    margins: { top: 90, bottom: 90, left: 100, right: 100 },
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: runsInline(texto.trim(), {
          bold: cabecalho,
          color: cabecalho ? CORES.branco : CORES.tinta,
          size: 19,
        }),
      }),
    ],
  });
}

function tabelaMarkdown(linhas) {
  const dados = linhas
    .filter((_, indice) => indice !== 1)
    .map((linha) => linha.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
  const colunas = Math.max(...dados.map((linha) => linha.length));
  const larguraTotal = 9026;
  const base = Math.floor(larguraTotal / colunas);
  const larguras = Array.from({ length: colunas }, (_, i) =>
    i === colunas - 1 ? larguraTotal - base * (colunas - 1) : base,
  );
  return new Table({
    width: { size: larguraTotal, type: WidthType.DXA },
    columnWidths: larguras,
    rows: dados.map(
      (linha, indice) =>
        new TableRow({
          cantSplit: true,
          children: Array.from({ length: colunas }, (_, i) => celula(linha[i] || "", larguras[i], indice === 0)),
        }),
    ),
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: CORES.linha },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: CORES.linha },
      left: { style: BorderStyle.SINGLE, size: 4, color: CORES.linha },
      right: { style: BorderStyle.SINGLE, size: 4, color: CORES.linha },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 3, color: CORES.linha },
      insideVertical: { style: BorderStyle.SINGLE, size: 3, color: CORES.linha },
    },
  });
}

function aviso(texto) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [9026],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9026, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: CORES.aviso, color: "auto" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: CORES.avisoLinha },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: CORES.avisoLinha },
              left: { style: BorderStyle.SINGLE, size: 8, color: CORES.avisoLinha },
              right: { style: BorderStyle.SINGLE, size: 8, color: CORES.avisoLinha },
            },
            margins: { top: 140, bottom: 140, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 0 },
                children: runsInline(texto, { bold: true, color: "6B5200", size: 20 }),
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

const elementos = [];
const linhas = markdown.split("\n");
let i = 0;
let primeiroTitulo = true;

while (i < linhas.length) {
  const linha = linhas[i];
  const texto = linha.trim();

  if (!texto) {
    i += 1;
    continue;
  }

  if (texto.startsWith("|")) {
    const bloco = [];
    while (i < linhas.length && linhas[i].trim().startsWith("|")) {
      bloco.push(linhas[i]);
      i += 1;
    }
    elementos.push(tabelaMarkdown(bloco));
    elementos.push(new Paragraph({ spacing: { after: 80 } }));
    continue;
  }

  if (texto.startsWith(">")) {
    const bloco = [];
    while (i < linhas.length && linhas[i].trim().startsWith(">")) {
      const conteudo = linhas[i].trim().replace(/^>\s?/, "").trim();
      if (conteudo) bloco.push(conteudo);
      i += 1;
    }
    elementos.push(aviso(bloco.join(" ")));
    elementos.push(new Paragraph({ spacing: { after: 120 } }));
    continue;
  }

  const titulo = texto.match(/^(#{1,3})\s+(.+)$/);
  if (titulo) {
    const nivel = titulo[1].length;
    if (nivel === 1 && primeiroTitulo) {
      elementos.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 500, after: 260 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 14, color: CORES.tinta, space: 10 } },
          children: [new TextRun({ text: titulo[2], bold: true, size: 34, color: CORES.tinta })],
        }),
      );
      primeiroTitulo = false;
    } else {
      elementos.push(
        new Paragraph({
          heading: nivel === 1 ? HeadingLevel.HEADING_1 : nivel === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          keepNext: true,
          pageBreakBefore: nivel === 2 && titulo[2].startsWith("ANEXO"),
          children: runsInline(titulo[2]),
        }),
      );
    }
    i += 1;
    continue;
  }

  if (texto.startsWith("- [ ] ")) {
    elementos.push(
      new Paragraph({
        indent: { left: 320, hanging: 200 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "☐ ", font: "Segoe UI Symbol" }), ...runsInline(texto.slice(6))],
      }),
    );
    i += 1;
    continue;
  }

  if (texto.startsWith("- ")) {
    elementos.push(
      new Paragraph({
        numbering: { reference: "lista-marcadores", level: 0 },
        spacing: { after: 80 },
        children: runsInline(texto.slice(2)),
      }),
    );
    i += 1;
    continue;
  }

  const numerada = texto.match(/^(\d+)\.\s+(.+)$/);
  if (numerada) {
    elementos.push(
      new Paragraph({
        numbering: { reference: "lista-numerada", level: 0 },
        spacing: { after: 80 },
        children: runsInline(numerada[2]),
      }),
    );
    i += 1;
    continue;
  }

  const alinea = texto.match(/^([a-z])\)\s+(.+)$/i);
  elementos.push(
    new Paragraph({
      indent: alinea ? { left: 320, hanging: 220 } : undefined,
      spacing: { after: 105, line: 300 },
      keepLines: true,
      children: runsInline(texto),
    }),
  );
  i += 1;
}

const documento = new Document({
  creator: "V2G",
  title: "Minuta parametrizada de contrato de prestação de serviços V2G",
  subject: "Minuta interna para revisão jurídica",
  description: "Versão minuta-interna-2026-10-09-v1. Não enviar para assinatura sem aprovação jurídica.",
  styles: {
    default: {
      document: {
        run: { font: "Aptos", size: 21, color: CORES.tinta },
        paragraph: { spacing: { after: 105, line: 300 } },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "Aptos Display", bold: true, size: 30, color: CORES.tinta },
        paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "Aptos Display", bold: true, size: 25, color: CORES.tinta },
        paragraph: {
          spacing: { before: 260, after: 120 },
          outlineLevel: 1,
          border: { bottom: { style: BorderStyle.SINGLE, size: 5, color: CORES.linha, space: 5 } },
        },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "Aptos", bold: true, size: 22, color: CORES.tinta },
        paragraph: { spacing: { before: 180, after: 90 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "lista-marcadores",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 180 } } },
          },
        ],
      },
      {
        reference: "lista-numerada",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 420, hanging: 240 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 500, footer: 500 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: CORES.linha, space: 4 } },
              children: [
                new TextRun({
                  text: "V2G · MINUTA INTERNA PARA REVISÃO JURÍDICA",
                  bold: true,
                  size: 16,
                  color: CORES.secundaria,
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: CORES.linha, space: 4 } },
              children: [
                new TextRun({ text: "minuta-interna-2026-10-09-v1 · página ", size: 16, color: CORES.secundaria }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: CORES.secundaria }),
                new TextRun({ text: " de ", size: 16, color: CORES.secundaria }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: CORES.secundaria }),
              ],
            }),
          ],
        }),
      },
      children: elementos,
    },
  ],
});

Packer.toBuffer(documento).then((buffer) => {
  fs.writeFileSync(destino, buffer);
  process.stdout.write(`${destino}\n`);
});
