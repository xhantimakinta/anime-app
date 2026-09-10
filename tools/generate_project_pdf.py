from html.parser import HTMLParser
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs' / 'project-guide.html'
OUTPUT = ROOT / 'docs' / 'AnimeVerse-Project-Guide.pdf'

class GuideParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.blocks = []
        self.current = None
        self.tag = None

    def handle_starttag(self, tag, attrs):
        if tag in {'h1', 'h2', 'h3', 'p', 'li', 'pre'}:
            self.current = []
            self.tag = tag
        elif tag == 'br' and self.current is not None:
            self.current.append('\n')

    def handle_endtag(self, tag):
        if self.current is not None and tag == self.tag:
            text = ''.join(self.current).strip()
            if text:
                self.blocks.append((self.tag, text))
            self.current = None
            self.tag = None

    def handle_data(self, data):
        if self.current is not None:
            self.current.append(data)

parser = GuideParser()
parser.feed(SOURCE.read_text(encoding='utf-8'))
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='CoverTitle', parent=styles['Title'], fontSize=30, leading=34, alignment=TA_CENTER, textColor=colors.HexColor('#e6395f'), spaceAfter=12))
styles.add(ParagraphStyle(name='H2Guide', parent=styles['Heading2'], fontSize=17, leading=21, textColor=colors.HexColor('#14213d'), spaceBefore=15, spaceAfter=8))
styles.add(ParagraphStyle(name='H3Guide', parent=styles['Heading3'], fontSize=12, leading=15, textColor=colors.HexColor('#14213d'), spaceBefore=10, spaceAfter=5))
styles.add(ParagraphStyle(name='BodyGuide', parent=styles['BodyText'], fontSize=9.5, leading=14, spaceAfter=6))
styles.add(ParagraphStyle(name='CodeGuide', parent=styles['Code'], fontSize=8, leading=11, backColor=colors.HexColor('#f1f5f9'), borderColor=colors.HexColor('#cbd5e1'), borderWidth=0.5, borderPadding=6, spaceAfter=8))
styles.add(ParagraphStyle(name='BulletGuide', parent=styles['BodyText'], fontSize=9.5, leading=14, leftIndent=14, firstLineIndent=-8, bulletIndent=2, spaceAfter=3))

story = []
first_h1 = True
for tag, raw in parser.blocks:
    text = escape(raw).replace('\n', '<br/>')
    if tag == 'h1':
        story.append(Paragraph(text, styles['CoverTitle']))
        story.append(Spacer(1, 18 * mm))
    elif tag == 'h2':
        if first_h1:
            story.append(PageBreak())
            first_h1 = False
        story.append(Paragraph(text, styles['H2Guide']))
    elif tag == 'h3':
        story.append(Paragraph(text, styles['H3Guide']))
    elif tag == 'li':
        story.append(Paragraph(text, styles['BulletGuide'], bulletText='-'))
    elif tag == 'pre':
        story.append(Paragraph(text, styles['CodeGuide']))
    else:
        story.append(Paragraph(text, styles['BodyGuide']))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#64748b'))
    canvas.drawString(16 * mm, 10 * mm, 'AnimeVerse Project Guide')
    canvas.drawRightString(A4[0] - 16 * mm, 10 * mm, f'Page {doc.page}')
    canvas.restoreState()

doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=16 * mm, leftMargin=16 * mm, topMargin=16 * mm, bottomMargin=17 * mm, title='AnimeVerse Project Guide', author='AnimeVerse')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f'Created {OUTPUT} ({OUTPUT.stat().st_size} bytes)')
