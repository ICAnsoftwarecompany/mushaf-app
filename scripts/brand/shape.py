"""Shape Arabic text with HarfBuzz and emit an SVG path (outlines, no font needed)."""
import sys, glob, uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

def text_path(font_file, text, features=None):
    data = open(font_file, 'rb').read()
    face = hb.Face(data); font = hb.Font(face)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, features or {})
    tt = TTFont(font_file); gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    pen = SVGPathPen(gs); bpen = BoundsPen(gs)
    x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        # flip Y (font units are y-up)
        t = (1, 0, 0, -1, x + pos.x_offset, -pos.y_offset)
        gs[name].draw(TransformPen(pen, t)); gs[name].draw(TransformPen(bpen, t))
        x += pos.x_advance
    return pen.getCommands(), bpen.bounds, tt['head'].unitsPerEm

if __name__ == '__main__':
    f, text = sys.argv[1], sys.argv[2]
    d, b, upm = text_path(f, text)
    print(b, upm, len(d))
