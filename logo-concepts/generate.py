import os

html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>StaySpace Logo Concepts</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Poppins',sans-serif;background:#f8fafc;color:#111827;padding:40px 20px}
h1{text-align:center;font-size:2rem;margin-bottom:8px}
.sub{text-align:center;color:#6B7280;margin-bottom:40px;font-size:.9rem}
.wrap{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:40px}
.c{background:#fff;border-radius:20px;padding:32px;box-shadow:0 8px 30px rgba(0,0,0,.08);border:1px solid #e5e7eb}
.ch{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.cn{font-size:.75rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#F43F5E,#E11D48);padding:4px 14px;border-radius:20px}
.nm{font-size:1.1rem;font-weight:700}
.ds{color:#6B7280;font-size:.85rem;margin-bottom:24px;line-height:1.6}
.lp{border-radius:16px;padding:40px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;min-height:140px}
.lt{background:#fff;border:1px solid #e5e7eb}
.dk{background:linear-gradient(135deg,#0f172a,#1e293b)}
.vg{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}
.v{border-radius:12px;padding:18px;display:flex;flex-direction:column;align-items:center;gap:8px}
.vl{background:#fff;border:1px solid #e5e7eb}
.vd{background:#0f172a}
.vp{background:linear-gradient(135deg,#F43F5E,#E11D48)}
.vg2{background:linear-gradient(135deg,#1e293b,#0f172a)}
.vlb{font-size:.6rem;font-weight:600;text-transform:uppercase;letter-spacing:1px}
.vl .vlb{color:#6B7280} .vd .vlb{color:#94A3B8} .vp .vlb{color:rgba(255,255,255,.8)} .vg2 .vlb{color:#94A3B8}
.st{font-size:1.4rem;font-weight:700;margin:60px 0 30px;text-align:center}
.pa{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-bottom:40px}
.sw{width:80px;height:80px;border-radius:16px;position:relative;box-shadow:0 4px 12px rgba(0,0,0,.1)}
.sw span{position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);font-size:.6rem;color:#9CA3AF;white-space:nowrap}
</style>
</head>
<body>
<h1>StaySpace Logo Concepts</h1>
<p class="sub">5 premium logo concepts inspired by your reference style</p>
<div class="wrap">

<!-- CONCEPT 1: Rounded Square Cityscape -->
<div class="c">
<div class="ch"><span class="cn">#1</span><span class="nm">Urban Skyline</span></div>
<p class="ds">A rounded square containing a stylized city skyline with buildings rising from a base. Clean flat geometry with layered rooftops creates depth. The solid square grounds the design while the buildings suggest premium urban stays. Works perfectly at favicon size.</p>
<div class="lp lt">
<svg viewBox="0 0 360 70" width="360" height="70">
<rect x="2" y="8" width="52" height="52" rx="14" fill="#F43F5E"/>
<rect x="10" y="32" width="10" height="18" rx="2" fill="white" opacity=".9"/>
<rect x="23" y="22" width="10" height="28" rx="2" fill="white" opacity=".8"/>
<rect x="36" y="28" width="10" height="22" rx="2" fill="white" opacity=".7"/>
<rect x="16" y="18" width="8" height="6" rx="1.5" fill="white" opacity=".5"/>
<text x="70" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#111827" letter-spacing="-0.5">Stay</text>
<text x="152" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#F43F5E" letter-spacing="-0.5">Space</text>
</svg>
</div>
<div class="lp dk">
<svg viewBox="0 0 360 70" width="360" height="70">
<rect x="2" y="8" width="52" height="52" rx="14" fill="#F43F5E"/>
<rect x="10" y="32" width="10" height="18" rx="2" fill="#0f172a" opacity=".25"/>
<rect x="23" y="22" width="10" height="28" rx="2" fill="#0f172a" opacity=".2"/>
<rect x="36" y="28" width="10" height="22" rx="2" fill="#0f172a" opacity=".15"/>
<rect x="16" y="18" width="8" height="6" rx="1.5" fill="#0f172a" opacity=".12"/>
<text x="70" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#ffffff" letter-spacing="-0.5">Stay</text>
<text x="152" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#F43F5E" letter-spacing="-0.5">Space</text>
</svg>
</div>
<div class="vg">
<div class="v vl">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="2" y="2" width="52" height="52" rx="14" fill="#F43F5E"/><rect x="10" y="28" width="10" height="18" rx="2" fill="white" opacity=".9"/><rect x="23" y="18" width="10" height="28" rx="2" fill="white" opacity=".8"/><rect x="36" y="24" width="10" height="22" rx="2" fill="white" opacity=".7"/></svg>
<span class="vlb">Light</span>
</div>
<div class="v vd">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="2" y="2" width="52" height="52" rx="14" fill="#F43F5E"/><rect x="10" y="28" width="10" height="18" rx="2" fill="#0f172a" opacity=".25"/><rect x="23" y="18" width="10" height="28" rx="2" fill="#0f172a" opacity=".2"/><rect x="36" y="24" width="10" height="22" rx="2" fill="#0f172a" opacity=".15"/></svg>
<span class="vlb">Dark</span>
</div>
<div class="v vp">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="2" y="2" width="52" height="52" rx="14" fill="white"/><rect x="10" y="28" width="10" height="18" rx="2" fill="#F43F5E" opacity=".15"/><rect x="23" y="18" width="10" height="28" rx="2" fill="#F43F5E" opacity=".12"/><rect x="36" y="24" width="10" height="22" rx="2" fill="#F43F5E" opacity=".1"/></svg>
<span class="vlb">White</span>
</div>
<div class="v vg2">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="2" y="2" width="52" height="52" rx="14" fill="#F43F5E" opacity=".15"/><rect x="10" y="28" width="10" height="18" rx="2" fill="#F43F5E" opacity=".2"/><rect x="23" y="18" width="10" height="28" rx="2" fill="#F43F5E" opacity=".15"/><rect x="36" y="24" width="10" height="22" rx="2" fill="#F43F5E" opacity=".1"/></svg>
<span class="vlb">Ghost</span>
</div>
</div></div>

<!-- CONCEPT 2: Location Pin + Home -->
<div class="c">
<div class="ch"><span class="cn">#2</span><span class="nm">Home Pin</span></div>
<p class="ds">A modern location pin with a house silhouette cutout inside. The pin says "destination" while the home says "stay." The contrast between the solid rose pin and the clean white home creates an iconic, memorable mark. Emotional and travel-focused.</p>
<div class="lp lt">
<svg viewBox="0 0 360 70" width="360" height="70">
<defs><linearGradient id="p2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F43F5E"/><stop offset="100%" stop-color="#E11D48"/></linearGradient></defs>
<path d="M28 4C16 4 6 14 6 28C6 44 28 58 28 58C28 58 50 44 50 28C50 14 40 4 28 4Z" fill="url(#p2)"/>
<path d="M28 22L20 30V44H36V30L28 22Z" fill="white" opacity=".9"/>
<text x="66" y="40" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#111827" letter-spacing="-0.5">Stay</text>
<text x="148" y="40" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#F43F5E" letter-spacing="-0.5">Space</text>
</svg>
</div>
<div class="lp dk">
<svg viewBox="0 0 360 70" width="360" height="70">
<defs><linearGradient id="p2d" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F43F5E"/><stop offset="100%" stop-color="#E11D48"/></linearGradient></defs>
<path d="M28 4C16 4 6 14 6 28C6 44 28 58 28 58C28 58 50 44 50 28C50 14 40 4 28 4Z" fill="url(#p2d)"/>
<path d="M28 22L20 30V44H36V30L28 22Z" fill="#0f172a" opacity=".25"/>
<text x="66" y="40" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#ffffff" letter-spacing="-0.5">Stay</text>
<text x="148" y="40" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#F43F5E" letter-spacing="-0.5">Space</text>
</svg>
</div>
<div class="vg">
<div class="v vl">
<svg viewBox="0 0 48 60" width="34" height="42"><path d="M24 4C14 4 4 14 4 26C4 40 24 54 24 54C24 54 44 40 44 26C44 14 34 4 24 4Z" fill="#F43F5E"/><path d="M24 20L18 26V38H30V26L24 20Z" fill="white" opacity=".9"/></svg>
<span class="vlb">Light</span>
</div>
<div class="v vd">
<svg viewBox="0 0 48 60" width="34" height="42"><path d="M24 4C14 4 4 14 4 26C4 40 24 54 24 54C24 54 44 40 44 26C44 14 34 4 24 4Z" fill="#F43F5E"/><path d="M24 20L18 26V38H30V26L24 20Z" fill="#0f172a" opacity=".25"/></svg>
<span class="vlb">Dark</span>
</div>
<div class="v vp">
<svg viewBox="0 0 48 60" width="34" height="42"><path d="M24 4C14 4 4 14 4 26C4 40 24 54 24 54C24 54 44 40 44 26C44 14 34 4 24 4Z" fill="white"/><path d="M24 20L18 26V38H30V26L24 20Z" fill="#F43F5E" opacity=".2"/></svg>
<span class="vlb">White</span>
</div>
<div class="v vg2">
<svg viewBox="0 0 48 60" width="34" height="42"><path d="M24 4C14 4 4 14 4 26C4 40 24 54 24 54C24 54 44 40 44 26C44 14 34 4 24 4Z" fill="#F43F5E" opacity=".2"/><path d="M24 20L18 26V38H30V26L24 20Z" fill="white" opacity=".15"/></svg>
<span class="vlb">Ghost</span>
</div>
</div></div>

<!-- CONCEPT 3: Rounded Square + Compass Pin -->
<div class="c">
<div class="ch"><span class="cn">#3</span><span class="nm">Discovery Mark</span></div>
<p class="ds">A rounded square with a compass-like pin at its center — the outer ring suggests a map, the inner dot pinpoints your destination. Abstract enough to be iconic, meaningful enough to communicate travel. The circle-within-square motif feels premium and app-ready.</p>
<div class="lp lt">
<svg viewBox="0 0 360 70" width="360" height="70">
<rect x="2" y="8" width="52" height="52" rx="14" fill="#F43F5E"/>
<circle cx="28" cy="34" r="14" fill="none" stroke="white" stroke-width="2.5" opacity=".6"/>
<circle cx="28" cy="34" r="6" fill="white" opacity=".9"/>
<line x1="28" y1="20" x2="28" y2="26" stroke="white" stroke-width="1.5" opacity=".5"/>
<line x1="28" y1="42" x2="28" y2="48" stroke="white" stroke-width="1.5" opacity=".5"/>
<line x1="14" y1="34" x2="20" y2="34" stroke="white" stroke-width="1.5" opacity=".5"/>
<line x1="36" y1="34" x2="42" y2="34" stroke="white" stroke-width="1.5" opacity=".5"/>
<text x="70" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#111827" letter-spacing="-0.5">Stay</text>
<text x="152" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#F43F5E" letter-spacing="-0.5">Space</text>
</svg>
</div>
<div class="lp dk">
<svg viewBox="0 0 360 70" width="360" height="70">
<rect x="2" y="8" width="52" height="52" rx="14" fill="#F43F5E"/>
<circle cx="28" cy="34" r="14" fill="none" stroke="#0f172a" stroke-width="2.5" opacity=".2"/>
<circle cx="28" cy="34" r="6" fill="#0f172a" opacity=".25"/>
<line x1="28" y1="20" x2="28" y2="26" stroke="#0f172a" stroke-width="1.5" opacity=".15"/>
<line x1="28" y1="42" x2="28" y2="48" stroke="#0f172a" stroke-width="1.5" opacity=".15"/>
<line x1="14" y1="34" x2="20" y2="34" stroke="#0f172a" stroke-width="1.5" opacity=".15"/>
<line x1="36" y1="34" x2="42" y2="34" stroke="#0f172a" stroke-width="1.5" opacity=".15"/>
<text x="70" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#ffffff" letter-spacing="-0.5">Stay</text>
<text x="152" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#F43F5E" letter-spacing="-0.5">Space</text>
</svg>
</div>
<div class="vg">
<div class="v vl">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="2" y="2" width="52" height="52" rx="14" fill="#F43F5E"/><circle cx="28" cy="28" r="12" fill="none" stroke="white" stroke-width="2" opacity=".6"/><circle cx="28" cy="28" r="5" fill="white" opacity=".9"/></svg>
<span class="vlb">Light</span>
</div>
<div class="v vd">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="2" y="2" width="52" height="52" rx="14" fill="#F43F5E"/><circle cx="28" cy="28" r="12" fill="none" stroke="#0f172a" stroke-width="2" opacity=".2"/><circle cx="28" cy="28" r="5" fill="#0f172a" opacity=".25"/></svg>
<span class="vlb">Dark</span>
</div>
<div class="v vp">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="2" y="2" width="52" height="52" rx="14" fill="white"/><circle cx="28" cy="28" r="12" fill="none" stroke="#F43F5E" stroke-width="2" opacity=".2"/><circle cx="28" cy="28" r="5" fill="#F43F5E" opacity=".2"/></svg>
<span class="vlb">White</span>
</div>
<div class="v vg2">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="2" y="2" width="52" height="52" rx="14" fill="#F43F5E" opacity=".15"/><circle cx="28" cy="28" r="12" fill="none" stroke="#F43F5E" stroke-width="2" opacity=".2"/><circle cx="28" cy="28" r="5" fill="#F43F5E" opacity=".2"/></svg>
<span class="vlb">Ghost</span>
</div>
</div></div>

<!-- CONCEPT 4: Building Blocks Grid -->
<div class="c">
<div class="ch"><span class="cn">#4</span><span class="nm">Property Grid</span></div>
<p class="ds">Four rounded squares arranged in a 2x2 grid with progressive opacity — like apartment windows, property tiles, or a bird's-eye view of a resort complex. The staggered opacity creates depth and rhythm. Ultra-clean, geometric, and modern.</p>
<div class="lp lt">
<svg viewBox="0 0 360 70" width="360" height="70">
<rect x="2" y="8" width="24" height="24" rx="7" fill="#F43F5E"/>
<rect x="30" y="8" width="24" height="24" rx="7" fill="#F43F5E" opacity=".65"/>
<rect x="2" y="36" width="24" height="24" rx="7" fill="#F43F5E" opacity=".4"/>
<rect x="30" y="36" width="24" height="24" rx="7" fill="#F43F5E" opacity=".2"/>
<text x="70" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#111827" letter-spacing="-0.5">Stay</text>
<text x="150" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#F43F5E" letter-spacing="-0.5">Space</text>
</svg>
</div>
<div class="lp dk">
<svg viewBox="0 0 360 70" width="360" height="70">
<rect x="2" y="8" width="24" height="24" rx="7" fill="#F43F5E"/>
<rect x="30" y="8" width="24" height="24" rx="7" fill="#F43F5E" opacity=".65"/>
<rect x="2" y="36" width="24" height="24" rx="7" fill="#F43F5E" opacity=".4"/>
<rect x="30" y="36" width="24" height="24" rx="7" fill="#F43F5E" opacity=".2"/>
<text x="70" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#ffffff" letter-spacing="-0.5">Stay</text>
<text x="150" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#F43F5E" letter-spacing="-0.5">Space</text>
</svg>
</div>
<div class="vg">
<div class="v vl">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="4" y="4" width="20" height="20" rx="6" fill="#F43F5E"/><rect x="28" y="4" width="20" height="20" rx="6" fill="#F43F5E" opacity=".6"/><rect x="4" y="28" width="20" height="20" rx="6" fill="#F43F5E" opacity=".35"/><rect x="28" y="28" width="20" height="20" rx="6" fill="#F43F5E" opacity=".18"/></svg>
<span class="vlb">Light</span>
</div>
<div class="v vd">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="4" y="4" width="20" height="20" rx="6" fill="#F43F5E"/><rect x="28" y="4" width="20" height="20" rx="6" fill="#F43F5E" opacity=".6"/><rect x="4" y="28" width="20" height="20" rx="6" fill="#F43F5E" opacity=".35"/><rect x="28" y="28" width="20" height="20" rx="6" fill="#F43F5E" opacity=".18"/></svg>
<span class="vlb">Dark</span>
</div>
<div class="v vp">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="4" y="4" width="20" height="20" rx="6" fill="white"/><rect x="28" y="4" width="20" height="20" rx="6" fill="white" opacity=".6"/><rect x="4" y="28" width="20" height="20" rx="6" fill="white" opacity=".35"/><rect x="28" y="28" width="20" height="20" rx="6" fill="white" opacity=".18"/></svg>
<span class="vlb">White</span>
</div>
<div class="v vg2">
<svg viewBox="0 0 56 56" width="48" height="48"><rect x="4" y="4" width="20" height="20" rx="6" fill="#F43F5E" opacity=".2"/><rect x="28" y="4" width="20" height="20" rx="6" fill="#F43F5E" opacity=".15"/><rect x="4" y="28" width="20" height="20" rx="6" fill="#F43F5E" opacity=".1"/><rect x="28" y="28" width="20" height="20" rx="6" fill="#F43F5E" opacity=".07"/></svg>
<span class="vlb">Ghost</span>
</div>
</div></div>

<!-- CONCEPT 5: Arch Gateway -->
<div class="c">
<div class="ch"><span class="cn">#5</span><span class="nm">Gateway Arch</span></div>
<p class="ds">An elegant archway with a solid location marker at its apex and a grounding dot at the base. The arch is a doorway to your next stay. The marker says "you've arrived." The most architectural and premium concept — evokes grand hotel entrances and luxury resorts.</p>
<div class="lp lt">
<svg viewBox="0 0 360 70" width="360" height="70">
<path d="M10 58L10 26C10 14 18 6 28 6C38 6 46 14 46 26L46 58" stroke="#F43F5E" stroke-width="4.5" fill="none" stroke-linecap="round"/>
<circle cx="28" cy="24" r="6.5" fill="#F43F5E"/>
<circle cx="28" cy="24" r="3" fill="white"/>
<circle cx="28" cy="58" r="2.5" fill="#F43F5E"/>
<text x="62" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#111827" letter-spacing="-0.5">Stay</text>
<text x="144" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#F43F5E" letter-spacing="-0.5">Space</text>
</svg>
</div>
<div class="lp dk">
<svg viewBox="0 0 360 70" width="360" height="70">
<path d="M10 58L10 26C10 14 18 6 28 6C38 6 46 14 46 26L46 58" stroke="#F43F5E" stroke-width="4.5" fill="none" stroke-linecap="round"/>
<circle cx="28" cy="24" r="6.5" fill="#F43F5E"/>
<circle cx="28" cy="24" r="3" fill="#0f172a"/>
<circle cx="28" cy="58" r="2.5" fill="#F43F5E"/>
<text x="62" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#ffffff" letter-spacing="-0.5">Stay</text>
<text x="144" y="42" font-family="Poppins,sans-serif" font-size="30" font-weight="700" fill="#F43F5E" letter-spacing="-0.5">Space</text>
</svg>
</div>
<div class="vg">
<div class="v vl">
<svg viewBox="0 0 48 60" width="36" height="44"><path d="M6 52L6 22C6 12 12 4 24 4C36 4 42 12 42 22L42 52" stroke="#F43F5E" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="24" cy="20" r="5.5" fill="#F43F5E"/><circle cx="24" cy="20" r="2.5" fill="white"/><circle cx="24" cy="52" r="2" fill="#F43F5E"/></svg>
<span class="vlb">Light</span>
</div>
<div class="v vd">
<svg viewBox="0 0 48 60" width="36" height="44"><path d="M6 52L6 22C6 12 12 4 24 4C36 4 42 12 42 22L42 52" stroke="#F43F5E" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="24" cy="20" r="5.5" fill="#F43F5E"/><circle cx="24" cy="20" r="2.5" fill="#0f172a"/><circle cx="24" cy="52" r="2" fill="#F43F5E"/></svg>
<span class="vlb">Dark</span>
</div>
<div class="v vp">
<svg viewBox="0 0 48 60" width="36" height="44"><path d="M6 52L6 22C6 12 12 4 24 4C36 4 42 12 42 22L42 52" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="24" cy="20" r="5.5" fill="white"/><circle cx="24" cy="20" r="2.5" fill="#F43F5E" opacity=".3"/><circle cx="24" cy="52" r="2" fill="white"/></svg>
<span class="vlb">White</span>
</div>
<div class="v vg2">
<svg viewBox="0 0 48 60" width="36" height="44"><path d="M6 52L6 22C6 12 12 4 24 4C36 4 42 12 42 22L42 52" stroke="#F43F5E" stroke-width="4" fill="none" stroke-linecap="round" opacity=".2"/><circle cx="24" cy="20" r="5.5" fill="#F43F5E" opacity=".2"/><circle cx="24" cy="20" r="2.5" fill="white" opacity=".15"/><circle cx="24" cy="52" r="2" fill="#F43F5E" opacity=".2"/></svg>
<span class="vlb">Ghost</span>
</div>
</div></div>

</div>

<div class="st">Color Palette</div>
<div class="pa">
<div class="sw" style="background:linear-gradient(135deg,#F43F5E,#E11D48)"><span>#F43F5E</span></div>
<div class="sw" style="background:#E11D48"><span>#E11D48</span></div>
<div class="sw" style="background:#111827"><span>#111827</span></div>
<div class="sw" style="background:#6B7280"><span>#6B7280</span></div>
<div class="sw" style="background:#F8FAFC;border:1px solid #e5e7eb"><span>#F8FAFC</span></div>
<div class="sw" style="background:#ffffff;border:1px solid #e5e7eb"><span>#FFFFFF</span></div>
</div>

<div class="st">Typography Options</div>
<div style="text-align:center;margin-bottom:20px">
<p style="color:#6B7280;font-size:.85rem;margin-bottom:20px">Font: <strong style="color:#111827">Poppins</strong> (Google Fonts)</p>
<div style="display:flex;justify-content:center;gap:40px;flex-wrap:wrap">
<div style="margin-bottom:16px"><span style="font-weight:700;font-size:2rem;color:#111827">Stay</span><span style="font-weight:700;font-size:2rem;color:#F43F5E">Space</span><br/><span style="font-size:.65rem;color:#9CA3AF">Bold 700 (both)</span></div>
<div style="margin-bottom:16px"><span style="font-weight:700;font-size:2rem;color:#111827">Stay</span><span style="font-weight:300;font-size:2rem;color:#F43F5E">Space</span><br/><span style="font-size:.65rem;color:#9CA3AF">Bold + Light contrast</span></div>
<div style="margin-bottom:16px"><span style="font-weight:600;font-size:2rem;color:#111827">Stay</span><span style="font-weight:600;font-size:2rem;color:#F43F5E">Space</span><br/><span style="font-size:.65rem;color:#9CA3AF">SemiBold 600 (both)</span></div>
</div>
</div>

</body>
</html>"""

path = os.path.join(os.path.dirname(__file__), 'final-concepts.html')
with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
print(f'Written: {os.path.getsize(path)} bytes')
