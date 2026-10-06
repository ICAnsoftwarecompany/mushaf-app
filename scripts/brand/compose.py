"""
توليد لوجو «يتلو» (الاسم بخط الرقعة) كـ SVG بمسارات — من غير ما الخط يكون مطلوب وقت العرض.
المتطلبات: Python 3 + fonttools + uharfbuzz، وملف الخط Aref Ruqaa Bold (SIL OFL):
  pip install fonttools uharfbuzz
  npm pack @expo-google-fonts/aref-ruqaa  (وفك الضغط في نفس الفولدر)
التشغيل:  cd scripts/brand && python3 compose.py
التفاصيل في docs/brand.md
"""
import glob, sys
from shape import text_path
def F(n): return glob.glob(f'**/{n}.ttf', recursive=True)[0]

DEFS = '''<defs>
 <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E6153"/><stop offset="1" stop-color="#1A3D35"/></linearGradient>
 <radialGradient id="glow" cx="50%" cy="48%" r="50%"><stop offset="0" stop-color="#F3E3BF" stop-opacity=".16"/><stop offset="1" stop-color="#F3E3BF" stop-opacity="0"/></radialGradient>
 <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0D9A6"/><stop offset=".55" stop-color="#D9B878"/><stop offset="1" stop-color="#B8925A"/></linearGradient>
</defs>'''

def ornament(cx, y, w):
    # خط رفيع بنجمة ثمانية صغيرة في النص
    s = 16
    return (f'<g fill="url(#gold)"><rect x="{cx-w/2}" y="{y-1.5}" width="{w/2-s*1.8}" height="3" rx="1.5" opacity=".75"/>'
            f'<rect x="{cx+s*1.8}" y="{y-1.5}" width="{w/2-s*1.8}" height="3" rx="1.5" opacity=".75"/>'
            f'<g transform="translate({cx} {y})"><rect x="{-s}" y="{-s}" width="{2*s}" height="{2*s}"/><rect x="{-s}" y="{-s}" width="{2*s}" height="{2*s}" transform="rotate(45)"/></g></g>')

def wordmark_group(font, text, target_w, cx, cy, max_h=None):
    d, (x0, y0, x1, y1), upm = text_path(F(font), text)
    w, h = x1 - x0, y1 - y0
    k = target_w / w
    if max_h and h * k > max_h: k = max_h / h
    tx = cx - (x0 + w / 2) * k; ty = cy - (y0 + h / 2) * k
    return f'<path d="{d}" fill="url(#gold)" transform="translate({tx:.2f} {ty:.2f}) scale({k:.5f})"/>', h * k

def icon(font, text, rounded=True, orn=True, target_w=640, max_h=520, cy=470, bg=True):
    rx = 230 if rounded else 0
    g, h = wordmark_group(font, text, target_w, 512, cy, max_h)
    o = ornament(512, cy + h / 2 + 70, 360) if orn else ''
    back = f'<rect width="1024" height="1024" rx="{rx}" fill="url(#bg)"/><rect width="1024" height="1024" rx="{rx}" fill="url(#glow)"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{DEFS}{back}{g}{o}</svg>'

FONT, TEXT = 'ArefRuqaa_700Bold', 'يَتْلُو'

if __name__ == '__main__':
    open('yatlu-icon.svg', 'w').write(icon(FONT, TEXT, rounded=False))
    open('yatlu-icon-rounded.svg', 'w').write(icon(FONT, TEXT, rounded=True))
    # مقدمة أيقونة أندرويد: أصغر علشان تفضل جوه المنطقة الآمنة
    open('android-foreground.svg', 'w').write(icon(FONT, TEXT, bg=False, target_w=430, max_h=360, cy=480))
    open('yatlu-monochrome.svg', 'w').write(icon(FONT, TEXT, bg=False, target_w=430, max_h=360, cy=480).replace('url(#gold)', '#FFFFFF'))
    open('yatlu-wordmark.svg', 'w').write(icon(FONT, TEXT, bg=False, target_w=820, max_h=700, cy=460))
