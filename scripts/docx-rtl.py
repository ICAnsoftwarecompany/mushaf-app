"""بيخلّي كل فقرات ملف Word من اليمين للشمال (القوايم والجداول كمان) — بيستخدمه npm run docs:docx"""
import re
import sys
import zipfile

path = sys.argv[1]
with zipfile.ZipFile(path) as z:
    files = {n: z.read(n) for n in z.namelist()}

def fix(xml: str) -> str:
    # كل فقرة: <w:bidi/> في خصائصها
    xml = re.sub(r'<w:p>(?!<w:pPr>)', '<w:p><w:pPr><w:bidi/></w:pPr>', xml)
    xml = re.sub(r'<w:p ([^>]*)>(?!<w:pPr>)', r'<w:p \1><w:pPr><w:bidi/></w:pPr>', xml)
    xml = re.sub(r'<w:pPr>(?!<w:bidi/>)', '<w:pPr><w:bidi/>', xml)
    # الجداول من اليمين
    xml = re.sub(r'<w:tblPr>(?!<w:bidiVisual/>)', '<w:tblPr><w:bidiVisual/>', xml)
    # النص: rtl
    xml = re.sub(r'<w:rPr>(?!<w:rtl/>)', '<w:rPr><w:rtl/>', xml)
    xml = re.sub(r'<w:r>(?!<w:rPr>)', '<w:r><w:rPr><w:rtl/></w:rPr>', xml)
    return xml

for name in ('word/document.xml', 'word/styles.xml', 'word/numbering.xml'):
    if name in files:
        files[name] = fix(files[name].decode('utf-8')).encode('utf-8')

with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
    for n, data in files.items():
        z.writestr(n, data)
print('rtl:', path)
