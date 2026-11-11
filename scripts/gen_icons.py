#!/usr/bin/env python3
"""LAGO 물방울 아이콘을 모든 크기로 그려요. (PIL)  사용: python3 scripts/gen_icons.py"""
import math, os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SS = 4  # 확대해서 그린 뒤 줄여서 선을 매끈하게

def drop_points(S, scale=1.0, dy=0.0):
    cx = S / 2
    r = 0.30 * S * scale
    cy = (0.615 + dy) * S
    ay = cy - 0.47 * S * scale
    d = cy - ay
    phi = math.acos(r / d)
    pts = [(cx, ay)]
    # 접점에서 매끄럽게 이어지는 곡선으로 꼭대기까지 (물방울 어깨가 꺾이지 않게)
    def cub(p0, c1, c2, p1, n=60):
        return [((1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * c1[0] + 3 * (1 - t) * t * t * c2[0] + t ** 3 * p1[0], (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * c1[1] + 3 * (1 - t) * t * t * c2[1] + t ** 3 * p1[1]) for t in [i / n for i in range(n + 1)]]
    tr = (cx + r * math.sin(phi), cy - r * math.cos(phi))
    tl_ = (cx - r * math.sin(phi), cy - r * math.cos(phi))
    L = math.hypot(tr[0] - cx, tr[1] - ay)
    def side(t, sgn):
        ux, uy = (cx - t[0]) / L, (ay - t[1]) / L
        c1 = (t[0] + ux * 0.50 * L, t[1] + uy * 0.50 * L)
        c2 = (cx + sgn * 0.012 * S, ay + 0.30 * L)
        return c1, c2
    c1, c2 = side(tr, 1)
    right = cub((cx, ay), c2, c1, tr)
    arc = []
    steps = 200
    a0, a1 = phi, 2 * math.pi - phi
    for i in range(steps + 1):
        a = a0 + (a1 - a0) * i / steps
        arc.append((cx + r * math.sin(a), cy - r * math.cos(a)))
    tl = arc[-1]
    c1, c2 = side(tl, -1)
    left = cub(tl, c1, c2, (cx, ay))
    return right + arc[1:] + left[1:], (cx, cy, r, ay)

def gradient(S, top=(59, 130, 246), mid=(20, 184, 166), bot=(22, 163, 74)):
    g = Image.new("RGB", (S, S))
    px = g.load()
    for y in range(S):
        t = y / (S - 1)
        a, b, u = (top, mid, t / 0.55) if t < 0.55 else (mid, bot, (t - 0.55) / 0.45)
        c = tuple(int(a[i] + (b[i] - a[i]) * u) for i in range(3))
        for x in range(S):
            px[x, y] = c
    return g

def make(size, bg="round", scale=1.0):
    S = size * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    if bg in ("round", "square"):
        m = Image.new("L", (S, S), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22) if bg == "round" else 0, fill=255)
        base = Image.new("RGBA", (S, S), (244, 248, 255, 255))
        img.paste(base, (0, 0), m)
    pts, (cx, cy, r, ay) = drop_points(S, scale, 0.0)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    # 그림자
    sh = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sm = Image.new("L", (S, S), 0); ImageDraw.Draw(sm).polygon([(x, y + S * 0.018) for x, y in pts], fill=70)
    sm = sm.filter(ImageFilter.GaussianBlur(S * 0.018))
    sh.paste((11, 42, 111, 255), (0, 0), sm)
    if bg != "none": img = Image.alpha_composite(img, sh)
    # 물방울 색
    top = int(ay); bot = int(cy + r)
    g = gradient(S).crop((0, 0, S, S))
    # 방울 높이에 맞춰 그라데이션을 세로로 늘려 색이 방울 안에서 파랑 → 초록으로 흐르게
    gg = gradient(max(2, bot - top)).resize((S, max(2, bot - top)))
    fill = Image.new("RGBA", (S, S), (0, 0, 0, 0)); fill.paste(gg, (0, top))
    drop = Image.new("RGBA", (S, S), (0, 0, 0, 0)); drop.paste(fill, (0, 0), mask)
    # 하이라이트
    hl = Image.new("RGBA", (S, S), (0, 0, 0, 0)); hd = ImageDraw.Draw(hl)
    ex, ey = cx - r * 0.42, cy + r * 0.05
    hd.ellipse([ex - r * 0.16, ey - r * 0.42, ex + r * 0.16, ey + r * 0.42], fill=(255, 255, 255, 105))
    hl = hl.rotate(18, center=(cx, cy), resample=Image.BICUBIC)
    hd2 = ImageDraw.Draw(hl); hd2.ellipse([cx - r * 0.12, cy - r * 0.95, cx + r * 0.02, cy - r * 0.78], fill=(255, 255, 255, 0))
    dot = Image.new("RGBA", (S, S), (0, 0, 0, 0)); ImageDraw.Draw(dot).ellipse([cx - r * 0.62, cy - r * 0.62, cx - r * 0.40, cy - r * 0.40], fill=(255, 255, 255, 150))
    hlm = Image.new("RGBA", (S, S), (0, 0, 0, 0)); hlm.paste(Image.alpha_composite(hl, dot), (0, 0), mask)
    drop = Image.alpha_composite(drop, hlm)
    img = Image.alpha_composite(img, drop)
    return img.resize((size, size), Image.LANCZOS)

def save(img, *path):
    p = os.path.join(ROOT, *path); os.makedirs(os.path.dirname(p), exist_ok=True); img.save(p)

if __name__ == "__main__":
    save(make(512), "public/assets/icon-512.png")
    save(make(192), "public/assets/icon-192.png")
    save(make(180, "square"), "public/assets/apple-touch-icon.png")
    save(make(1024), "EXE/build/icon.png")
    for k, n in (("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)):
        save(make(n), f"APK/app/src/main/res/mipmap-{k}/ic_launcher.png")
    for n in (16, 32, 48, 128):
        save(make(n, "none", 1.12), f"EXT/icons/{n}.png")
    print("icons ok")
