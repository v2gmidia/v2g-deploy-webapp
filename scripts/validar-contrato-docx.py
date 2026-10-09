from pathlib import Path
from zipfile import ZipFile
import posixpath
import re
import xml.etree.ElementTree as ET


ARQUIVO = Path(__file__).resolve().parents[1] / "docs" / "contrato-v2g-minuta-parametrica.docx"
OBRIGATORIOS = {
    "[Content_Types].xml",
    "_rels/.rels",
    "word/document.xml",
    "word/styles.xml",
    "word/_rels/document.xml.rels",
}
FRASES = {
    "MINUTA INTERNA PARA REVISÃO JURÍDICA",
    "R$ 500,00 por conta de anúncios por mês",
    "R$ 5.280,00 por conta de anúncios por 12 meses",
    "permanência mínima de 6 (seis) meses",
    "Depois da assinatura completa, o documento assinado é imutável",
    "CHECKLIST ANTES DE AUTOMATIZAR",
}
NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r": "http://schemas.openxmlformats.org/package/2006/relationships",
}


with ZipFile(ARQUIVO) as pacote:
    nomes = set(pacote.namelist())
    faltando = OBRIGATORIOS - nomes
    if faltando:
        raise SystemExit(f"partes obrigatórias ausentes: {sorted(faltando)}")
    corrompido = pacote.testzip()
    if corrompido:
        raise SystemExit(f"entrada ZIP corrompida: {corrompido}")

    for nome in sorted(n for n in nomes if n.endswith((".xml", ".rels"))):
        ET.fromstring(pacote.read(nome))

    rels = ET.fromstring(pacote.read("word/_rels/document.xml.rels"))
    for rel in rels.findall("r:Relationship", NS):
        if rel.attrib.get("TargetMode") == "External":
            continue
        alvo = rel.attrib.get("Target", "")
        resolvido = posixpath.normpath(posixpath.join("word", alvo))
        if resolvido not in nomes:
            raise SystemExit(f"relacionamento interno sem destino: {alvo}")

    documento = ET.fromstring(pacote.read("word/document.xml"))
    texto = re.sub(r"\s+", " ", " ".join(t.text or "" for t in documento.findall(".//w:t", NS)))
    ausentes = sorted(frase for frase in FRASES if frase not in texto)
    if ausentes:
        raise SystemExit(f"frases essenciais ausentes: {ausentes}")

    if texto.count("DECISÃO PENDENTE") < 10:
        raise SystemExit("marcadores de decisão pendente abaixo do esperado")

print(
    f"docx-estrutura-ok bytes={ARQUIVO.stat().st_size} "
    f"xml={sum(1 for n in nomes if n.endswith('.xml'))} "
    f"decisoes_pendentes={texto.count('DECISÃO PENDENTE')}"
)
