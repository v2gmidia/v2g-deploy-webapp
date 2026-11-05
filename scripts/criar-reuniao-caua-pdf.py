from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)


ROOT = Path(r"C:\Users\victo\v2g-deploy\webapp")
MEETING_OUT = ROOT / "output" / "pdf" / "reuniao-caua-05-11-2026.pdf"
GOALS_OUT = ROOT / "output" / "pdf" / "metas-semana-caua-05-11-2026.pdf"
MEETING_OUT.parent.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))

NAVY = colors.HexColor("#051020")
COBALT = colors.HexColor("#0B40DA")
ICE = colors.HexColor("#B0E9FD")
LIME = colors.HexColor("#EAFF64")
INK = colors.HexColor("#102A35")
MUTED = colors.HexColor("#49606A")
LINE = colors.HexColor("#CCD9D6")
PALE = colors.HexColor("#F1F6F7")
GREEN = colors.HexColor("#24683F")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleV", fontName="Arial-Bold", fontSize=27, leading=32, textColor=INK, spaceAfter=11))
styles.add(ParagraphStyle(name="H1V", fontName="Arial-Bold", fontSize=16, leading=20, textColor=INK, spaceBefore=2, spaceAfter=9))
styles.add(ParagraphStyle(name="H2V", fontName="Arial-Bold", fontSize=10.8, leading=14, textColor=COBALT, spaceBefore=9, spaceAfter=4))
styles.add(ParagraphStyle(name="BodyV", fontName="Arial", fontSize=8.7, leading=12.7, textColor=INK, spaceAfter=5))
styles.add(ParagraphStyle(name="SmallV", fontName="Arial", fontSize=7.4, leading=10.5, textColor=MUTED, spaceAfter=4))
styles.add(ParagraphStyle(name="TinyV", fontName="Arial", fontSize=7, leading=9.5, textColor=INK))
styles.add(ParagraphStyle(name="TableHeadV", fontName="Arial-Bold", fontSize=7.2, leading=9.7, textColor=colors.white))
styles.add(ParagraphStyle(name="EyebrowV", fontName="Arial-Bold", fontSize=8, leading=10, textColor=COBALT, spaceAfter=8))
styles.add(ParagraphStyle(name="QuoteV", fontName="Arial-Bold", fontSize=11, leading=15, textColor=INK, spaceAfter=4))


def p(text, style="BodyV"):
    return Paragraph(text, styles[style])


def safe(text):
    return escape(str(text)).replace("\n", "<br/>")


def bullet(text):
    return p("<font color='#0B40DA'><b>•</b></font>  " + text)


def heading(title, kicker=None):
    items = []
    if kicker:
        items.append(p(kicker.upper(), "EyebrowV"))
    items.append(p(title, "H1V"))
    return items


def table(headers, rows, widths):
    data = [[p(safe(h), "TableHeadV") for h in headers]]
    for row in rows:
        data.append([p(safe(cell), "TinyV") for cell in row])
    t = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), COBALT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def card(title, body, accent=COBALT):
    x = Table([[p(title, "H2V")], [p(body)]], colWidths=[174*mm])
    x.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, 0), 5),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
    ]))
    return x


story = []
story += [p("REUNIÃO DE INTEGRAÇÃO · 05 NOV 2026", "EyebrowV"),
          p("Victor + Cauã<br/>Operação V2G", "TitleV"),
          p("O que dizer, onde clicar e quais decisões tomar durante a reunião.", "BodyV"),
          Spacer(1, 4*mm),
          card("Saída obrigatória da call", "Cauã acessa a mesa com a própria conta, entende a passagem dos clientes, assume uma rotina documentada e sai com entregas da primeira semana. Victor sai com uma lista de melhorias do produto, em ordem.", LIME),
          Spacer(1, 7*mm)]
story += heading("Agenda sugerida · 75 minutos")
story.append(table(["Min", "Bloco", "Resultado"], [
    ("00–05", "Abertura", "Papel de cada um e objetivo do mês."),
    ("05–20", "Jornada do cliente", "LP → acesso → onboarding → Início → Criativos → Anúncios → Avisos/Conta."),
    ("20–30", "Mesa do gestor", "Cauã encontra a V2G e explica a próxima ação."),
    ("30–40", "Meta + recebimento", "Ativos, permissões, vínculo e piloto."),
    ("40–55", "GitHub + localhost", "Cauã localiza o código e aprende a relatar defeitos."),
    ("55–65", "App Review", "Feedback anterior, evidências e dono de cada parte."),
    ("65–75", "Combinados", "Rotina, metas semanais e pendências com dono."),
], [19*mm, 47*mm, 108*mm]))
story += [Spacer(1, 4*mm), p("Regra da reunião: mostrar ambiente, fonte e última atualização quando houver números. Uma tela bonita não prova integração.", "SmallV"), PageBreak()]

story += heading("Passo a passo na tela: jornada do cliente", "05–20 min")
story += [
    bullet("1. Abra a LP. Mostre proposta, preço e os dois caminhos de entrada. Não faça nova compra na demonstração."),
    bullet("2. Abra Entrar / Primeiro acesso. Explique que a confirmação do pagamento libera o vínculo. Use conta de teste autorizada; não mostre senha."),
    bullet("3. Abra um negócio de demonstração. Percorra onboarding: respostas → contas → marca → conclusão. Aponte onde a ficha do gestor recebe essas informações."),
    bullet("4. Abra Início. Leia o estado exibido e a próxima ação. Marcação no Google e confirmação dentro do app precisam ser conferidas separadamente."),
    bullet("5. Abra Criativos. Mostre biblioteca, envio de peça e o que o gestor precisa revisar. Não chamar simulação de geração final."),
    bullet("6. Abra Anúncios. Escolha conta e período; confira se há leitura real, erro, ausência ou zero observado. Não inferir resultado de tela vazia."),
    bullet("7. Abra Avisos e Conta. Identifique o que o cliente realmente vê hoje; anote o que depende de comunicação manual."),
    Spacer(1, 4*mm),
    card("Pergunta a Cauã", "Depois desse percurso, o que você precisa saber para assumir uma conta amanhã? Registre cada lacuna como tela, impacto, dono e próxima prova.", ICE),
    PageBreak(),
]

story += heading("Passo a passo na tela: mesa do gestor", "20–30 min")
story += [
    bullet("1. Cauã entra no QA com sua conta e abre /supergestor → Carteira de negócios."),
    bullet("2. Leia os quatro números do topo e os avisos de consulta parcial. Contagem não substitui conferência de cada conta."),
    bullet("3. Abra Minhas próximas ações; se não aparecer ou estiver vazia, registre o motivo."),
    bullet("4. Busque V2G; selecione Minhas contas, se disponível. Confirme responsável, pendências e última execução."),
    bullet("5. Expanda Preparar conversa com o cliente. Abra ficha e materiais de marca; compare respostas declaradas com evidências."),
    bullet("6. Abra contas de anúncios, contratações, criativos e tarefas quando os links estiverem presentes."),
    bullet("7. Abra Ver números apenas se disponível. Confira negócio, conta, intervalo, fonte e coleta; compare com a Meta na mesma janela."),
    bullet("8. Cauã anota: situação V2G, próxima ação, bloqueio, quem resolve, data da próxima conferência."),
    Spacer(1, 4*mm),
    card("Aceite da demonstração", "Cauã localiza a V2G, explica a próxima ação e distingue uma campanha cadastrada de uma campanha ativa com métricas medidas.", GREEN),
    PageBreak(),
]

story += heading("Meta: acesso do gestor e primeiro cliente", "30–40 min")
story += [
    bullet("1. Abra o portfólio empresarial V2G e localize conta de anúncios, Página e Instagram. Anote nomes e IDs."),
    bullet("2. Cauã confere seu acesso próprio a cada ativo e as tarefas recebidas. Falta de permissão vira pendência; não usar login, token ou 2FA de outra pessoa."),
    bullet("3. Compare esses IDs com o negócio V2G no WebApp. Responsável na mesa não significa permissão na Meta."),
    bullet("4. Para cada cliente novo: identificar contratante e negócio → confirmar acesso WebApp → cliente compartilha ativos mínimos como parceiro → Cauã testa operação manual → equipe testa leitura separadamente."),
    bullet("5. Só depois de peça, orçamento e autorização específicos: publicar manualmente, registrar IDs retornados e comparar o que a Meta e o app mostram."),
    Spacer(1, 3*mm),
    p("Meta for Developers é ferramenta da equipe técnica. O cliente não precisa virar desenvolvedor do app. Cauã pode apoiar evidências do App Review; acesso administrativo amplo será decidido conforme a tarefa exata.", "SmallV"),
]
story += heading("GitHub e localhost", "40–55 min")
story += [
    bullet("1. Cauã entra no GitHub com sua conta e confere leitura do WebApp. Escrita no repositório é decisão separada."),
    bullet("2. Clona o projeto, abre AGENTS.md e identifica as pastas da mesa, cliente e documentação."),
    bullet("3. Instala dependências e prepara variáveis locais próprias por canal seguro. Não copiar .env nem tokens de Victor."),
    bullet("4. Roda pnpm dev e abre /supergestor no localhost. Login e dados locais podem diferir do QA; registrar a diferença."),
    bullet("5. Reproduz um problema e envia: URL, ambiente, passos, esperado, observado, captura sem segredo."),
    PageBreak(),
]

story += heading("App Review: o trabalho concreto", "55–65 min · Meta Developers consultado em 04/11")
story += [
    card("Estado observado", "App V2G publicado; envio anterior de App Review não aprovado. No painel atual não há permissões em um novo envio. Publicado não significa permissões aprovadas.", ICE),
    Spacer(1, 4*mm),
    p("<b>Feedback da Meta:</b> as permissões business_management, pages_read_engagement, pages_show_list, pages_manage_ads, ads_read e ads_management foram recusadas porque o screencast não mostrou o caso de uso completo. A Meta pediu login, consentimento e uso efetivo da permissão. Para Marketing API Access Tier, apontou chamadas Ads API insuficientes nos 15 dias anteriores ao envio.", "BodyV"),
    bullet("Cauã: reproduzir o fluxo real com conta autorizada; anotar tela, ação, permissão necessária e resultado; gravar demonstração limpa com Victor, sem segredos."),
    bullet("Victor/equipe técnica: conferir a arquitetura de token, quais permissões são realmente necessárias, preparar texto do caso de uso e evidência de API, revisar o vídeo e fazer o envio."),
    bullet("Critério de pronto interno: roteiro de screencast reproduzível + permissões justificadas + fluxo testado. Aprovação final e prazo pertencem à Meta."),
    p("Fonte: https://developers.facebook.com/apps/1580613430339464/app-review/submissions/feedback/?submission_id=1602738544793619", "SmallV"),
    PageBreak(),
]

story += heading("Decisões para fechar antes de encerrar", "Folha de condução")
story += [
    bullet("Quem são os clientes da carteira atual? Preencher lista nominal e começar por um piloto autorizado."),
    bullet("Quais ativos Meta Cauã já alcança com a conta dele? O que falta e quem concede?"),
    bullet("Qual rotina diária mínima ele consegue cumprir sem depender de uma função ainda inexistente na mesa?"),
    bullet("Qual é o primeiro vídeo reproduzível do App Review e quem grava cada trecho?"),
    bullet("Quais três problemas da interface mais atrapalham a operação? Victor escolhe a ordem de correção."),
    Spacer(1, 5*mm),
    card("Combinado de saída", "Cauã assume a operação e documenta o dia a dia. Victor assume as correções do produto e a trilha técnica do App Review. Ambos revisam a carteira e os bloqueios no fim da primeira semana.", LIME),
    Spacer(1, 6*mm),
    p("Depois da reunião: registrar decisões e acompanhar as entregas no PDF separado de metas do Cauã. Este roteiro não declara que funções pendentes já estão prontas.", "SmallV"),
]

meeting_story = story
story = [
    p("PLANO OPERACIONAL · A PARTIR DE 05 NOV 2026", "EyebrowV"),
    p("Metas do Cauã<br/>Primeiras semanas", "TitleV"),
    p("Um plano de operação para transformar cada cliente em uma conta acompanhada, com acesso, evidência e próxima ação claros.", "BodyV"),
    Spacer(1, 4*mm),
    card("Meta da primeira semana completa", "Até 13/11, cada cliente da carteira atual deve ter acesso próprio ao negócio correto ou um bloqueio nominal, com dono e próximo passo. O piloto V2G vem antes da repetição em escala.", LIME),
    Spacer(1, 5*mm),
]
story += heading("Ritmo de todo dia")
story += [
    bullet("Manhã: abrir a carteira, escolher as contas que exigem ação e conferir Meta, materiais, orçamento, reunião e resultado nas fontes certas."),
    bullet("Durante o dia: resolver ou encaminhar a pendência; registrar a decisão e não depender da memória ou de uma conversa solta."),
    bullet("Fim do dia: atualizar uma linha por cliente com estado, prova, bloqueio, dono, próxima ação e data da próxima conferência."),
    p("Modelo da linha: CLIENTE/NEGÓCIO | ACESSO WEBAPP | ATIVOS META | CAMPANHA | RESULTADO LIDO | AÇÃO | DONO | FONTE/DATA. Use 'não verificado' quando faltar prova; não preencha com zero ou 'pronto' por suposição.", "SmallV"),
    PageBreak(),
]

story += heading("Semana de entrada: 05 e 06/11", "O que Cauã faz primeiro")
story += [
    table(["Dia", "Ação do Cauã", "Aceite observável"], [
        ("Qui 05/11", "Entrar na mesa com conta própria; localizar V2G; conferir ficha, marca, conta e sua atribuição; listar clientes reais da carteira.", "V2G identificada sem usar login de Victor; lista nominal com estado de cada negócio."),
        ("Qui 05/11", "Abrir Meta com a própria conta; localizar ativos da V2G e tarefas concedidas; registrar o que não alcança.", "IDs, proprietário e acesso anotados; pendência com pessoa que pode conceder."),
        ("Sex 06/11", "Escolher com Victor um cliente-piloto autorizado; conferir contratação, WebApp, responsável, ativos e próximo contato.", "Ficha do piloto completa ou campos não verificados destacados; nenhuma associação por nome apenas."),
        ("Sex 06/11", "Fechar a primeira semana com os bloqueios da carteira e três melhorias da mesa que mais custaram tempo.", "Registro por cliente e três problemas reproduzíveis: tela, passos, esperado e observado."),
    ], [23*mm, 78*mm, 73*mm]),
    Spacer(1, 4*mm),
    p("Dependências de Victor: confirmar quem são os clientes, autorizar o piloto e resolver acessos/falhas de produto que Cauã não controla. Cauã não cria contrato, pagamento, vínculo ou permissão por dedução.", "SmallV"),
    PageBreak(),
]

story += heading("Metas semanais do primeiro mês", "Entrega, não apenas atividade")
story += [
    table(["Semana", "Meta de Cauã", "Prova para fechar"], [
        ("09–13/11", "Concluir o piloto e percorrer a carteira atual: cada cliente com acesso próprio confirmado ou bloqueio nominal. Separar acesso manual, leitura API, campanha publicada e números no app.", "Cliente entra no negócio certo; IDs e fontes reconciliados. Para os demais, motivo, dono e próximo ato. Convite enviado não conta como acesso."),
        ("16–20/11", "Operar e documentar a carteira diariamente. Montar com Victor um screencast fiel do App Review: login, consentimento e uso da permissão.", "Cinco registros diários úteis; ensaio de vídeo reproduzível sem segredo nem cliente não autorizado."),
        ("23–27/11", "Acompanhar passagem dos clientes restantes, qualidade das peças e tempo entre recebimento e decisão. Reunir evidências para o reenvio do App Review.", "Estado cliente por cliente, pendências resolvidas ou encaminhadas; pacote de evidências conferido. Aprovação Meta não está sob controle de Cauã."),
        ("30/11–04/12", "Apontar as três tarefas mais repetidas e quanto tempo tomaram; propor a ordem de simplificação da mesa.", "Victor recebe exemplos, frequência, tempo e risco. A automação escolhida nasce de trabalho medido."),
    ], [24*mm, 78*mm, 72*mm]),
    Spacer(1, 5*mm),
    card("Definição de pronto para cada cliente", "Acesso ao negócio correto + responsável identificado + ativos Meta conferidos + situação da campanha registrada + números com fonte e período quando disponíveis + pendência e próximo ato visíveis. Se uma prova faltar, a conta fica em preparação.", ICE),
    PageBreak(),
]

story += heading("Como medir o trabalho de Cauã", "Revisão curta com Victor toda sexta")
story += [
    bullet("Clientes com acesso confirmado / clientes elegíveis da carteira. Mostrar também quantos estão bloqueados e por quê."),
    bullet("Contas com acesso manual Meta provado; contas com leitura API provada; campanhas publicadas; campanhas com resultados medidos no app. Não somar esses estados."),
    bullet("Peças recebidas, peças decididas e tempo até decisão; tarefas abertas, resolvidas e encaminhadas."),
    bullet("Tempo gasto nas três rotinas mais repetidas. Esse é o insumo para Victor melhorar a mesa, avisos e automação."),
    Spacer(1, 5*mm),
    card("Responsabilidade dividida", "Cauã responde pela operação, atendimento e documentação. Victor/equipe técnica responde pelo produto, integração, avisos, geração de criativos, CRM e envio técnico do App Review. Cauã prepara as provas operacionais do App Review.", LIME),
    Spacer(1, 5*mm),
    p("A meta de todos acessarem na semana de 09/11 depende de identidade, contratação e autorização de cada cliente. É uma meta de execução, não uma garantia de acesso ou aprovação da Meta.", "SmallV"),
]


class V2GDoc(BaseDocTemplate):
    def __init__(self, filename, label, title):
        self.label = label
        super().__init__(filename, pagesize=A4, leftMargin=18*mm, rightMargin=18*mm,
                         topMargin=20*mm, bottomMargin=17*mm, title=title)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height,
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id="body", frames=frame, onPage=self.decorate))

    def decorate(self, canvas, doc):
        canvas.saveState()
        w, h = A4
        canvas.setFillColor(NAVY)
        canvas.rect(0, h-11*mm, w, 11*mm, fill=1, stroke=0)
        canvas.setFillColor(LIME)
        canvas.setFont("Arial-Bold", 9)
        canvas.drawString(18*mm, h-7.2*mm, "V2G")
        canvas.setFillColor(colors.white)
        canvas.setFont("Arial", 7)
        canvas.drawRightString(w-18*mm, h-7.2*mm, self.label)
        canvas.setStrokeColor(LINE)
        canvas.line(18*mm, 13*mm, w-18*mm, 13*mm)
        canvas.setFillColor(MUTED)
        canvas.setFont("Arial", 7)
        canvas.drawString(18*mm, 9*mm, "Roteiro interno · dados e permissões devem ser conferidos")
        canvas.drawRightString(w-18*mm, 9*mm, f"{doc.page}")
        canvas.restoreState()


V2GDoc(str(MEETING_OUT), "REUNIÃO CAUÃ  ·  05.11.2026", "Reunião de integração do Cauã — V2G").build(meeting_story)
V2GDoc(str(GOALS_OUT), "METAS CAUÃ  ·  NOV 2026", "Metas semanais do Cauã — V2G").build(story)
print(MEETING_OUT)
print(GOALS_OUT)
