#!/usr/bin/env python3
"""app.css의 고정 색을 읽어 다크 테마 규칙을 만들어 app.css 끝(마커 사이)에 넣어요. 다시 돌려도 안전해요."""
import re,colorsys,sys
CSS='public/assets/app.css'
MARK_A='/* ==DARK-GEN-START== */'; MARK_B='/* ==DARK-GEN-END== */'
def hx(s):
    s=s.lstrip('#')
    if len(s)==3:s=''.join(c*2 for c in s)
    return tuple(int(s[i:i+2],16)/255 for i in (0,2,4))
def tohex(r,g,b):return '#%02X%02X%02X'%tuple(max(0,min(255,round(v*255))) for v in (r,g,b))
def hls(c):
    h,l,s=colorsys.rgb_to_hls(*hx(c));return h,l,s
def mk(h,l,s):
    r,g,b=colorsys.hls_to_rgb(h,l,s);return tohex(r,g,b)
def surf(c):
    h,l,s=hls(c)
    if l<0.55:return c
    return mk(h,0.13+(1-l)*0.9,min(s*0.5,0.22))
def line(c):
    h,l,s=hls(c)
    if l<0.55:return c
    return mk(h,0.2+(1-l)*0.9,min(s*0.5,0.2))
def text(c):
    h,l,s=hls(c)
    if l>=0.55:return c
    return mk(h,max(0.7,min(0.93,1-l)),min(s,0.7) if s>0.3 else s)
HEX=re.compile(r'#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')
def conv(val,fn):
    def r(m):
        t=m.group(0)
        if len(t)==9:return t
        return fn(t)
    return HEX.sub(r,val)
def decls(body):
    out=[];depth=0;cur=''
    for ch in body:
        if ch=='(':depth+=1
        if ch==')':depth-=1
        if ch==';' and depth==0:out.append(cur);cur=''
        else:cur+=ch
    if cur.strip():out.append(cur)
    return out
def dark_decls(body):
    res=[]
    for d in decls(body):
        if ':' not in d:continue
        p,v=d.split(':',1);p=p.strip().lower();v=v.strip();imp=''
        if v.endswith('!important'):v=v[:-10].strip();imp=' !important'
        if p in('background','background-color','background-image') and 'var(--blue)' in v:
            res.append(f'{p}:'+v.replace('var(--blue)','#3B62D6')+imp)
        if p.startswith('border') and 'var(--blue)' in v:
            res.append(f'{p}:'+v.replace('var(--blue)','#3B62D6')+imp)
        if p in('color','fill','stroke') and 'var(--navy)' in v:
            res.append(f'{p}:#E7ECFF'+imp)
        if not HEX.search(v):continue
        if p in('color','fill','stroke','caret-color'):nv=conv(v,text)
        elif p in('background','background-color','background-image'):nv=conv(v,surf)
        elif p.startswith('border') or p.startswith('outline'):nv=conv(v,line)
        else:continue
        if nv!=v:res.append(f'{p}:{nv}{imp}')
    return res
def rules(css,out,wrap=None):
    i=0;n=len(css)
    while i<n:
        j=css.find('{',i)
        if j<0:break
        sel=css[i:j].strip();k=j+1;depth=1
        while k<n and depth:
            if css[k]=='{':depth+=1
            elif css[k]=='}':depth-=1
            k+=1
        body=css[j+1:k-1];i=k
        if sel.startswith('@media'):
            sub=[];rules(body,sub);
            if sub:out.append(sel+'{'+''.join(sub)+'}')
            continue
        if sel.startswith('@'):continue
        dd=dark_decls(body)
        if not dd:continue
        sels=[s.strip() for s in sel.split(',') if s.strip()]
        out.append(','.join(':root[data-lago=dark] '+s for s in sels)+'{'+';'.join(dd)+'}')
src=open(CSS).read()
a=src.find(MARK_A)
if a>=0:src=src[:a].rstrip()+'\n'
# 이전에 넣었던 색 반전 방식 줄은 지워요
src=re.sub(r':root\[data-lago=dark\]\{filter:[^}]*\}\n?','',src)
src=re.sub(r':root\[data-lago=dark\] img,[^{]*\{filter:[^}]*\}\n?','',src)
out=[];rules(src,out)
# 인라인 스타일에 박힌 색
inl=[]
seen=set()
for f in ('public/assets/app.js','public/assets/admin.js'):
    for m in re.finditer(r'(background|color|border-color)\s*:\s*(#[0-9a-fA-F]{3,6})\b',open(f).read()):
        key=(m.group(1),m.group(2).lower())
        if key in seen:continue
        seen.add(key)
        prop,c=key
        fn=text if prop=='color' else (line if prop=='border-color' else surf)
        nv=fn(c)
        if nv.lower()==c.lower():continue
        inl.append(f':root[data-lago=dark] [style*="{prop}:{c}" i],:root[data-lago=dark] [style*="{prop}: {c}" i]{{{prop}:{nv} !important}}')
vars_='''
:root[data-lago=dark]{color-scheme:dark;--bg:#14161C;--card:#1D2028;--side:#181B21;--line:#2E3441;--ink:#E7EAF3;--ink2:#C5CBDA;--mut:#9CA5BA;--mut2:#8A93A9;--mut3:#7B849A;--blue:#8FAAF5;--sky:#7FA2FF;--mist:#212A45;--sel:#283766;--gbg:#14201A;--gt:#1B2E24;--gline:#27402F;--gside:#17241D;--kt:#16293B;--warnbg:#33231B;--g:#4CC585;--gd:#BDE8D0;--kd:#8CC6F2;--err:#F07468;--warn:#E08A62}
:root[data-lago=dark] svg.wm{color:#E7ECFF !important}
:root[data-lago=dark] .composer textarea{background:none}
:root[data-lago=dark] .wm,:root[data-lago=dark] h1,:root[data-lago=dark] h2,:root[data-lago=dark] h3{color:#E7ECFF}
:root[data-lago=dark] .btn.pri,:root[data-lago=dark] button.pri,:root[data-lago=dark] .send{background:#2D52C4;color:#fff;border-color:#2D52C4}
:root[data-lago=dark] .toast{background:#2A3042;color:#E7EAF3}
:root[data-lago=dark] img[src^="/api/"],:root[data-lago=dark] .shopimg img{filter:none}
:root[data-lago=dark] input,:root[data-lago=dark] textarea,:root[data-lago=dark] select{background:#1D2028;color:#E7EAF3;border-color:#2E3441}
:root[data-lago=dark] .modebtn,:root[data-lago=dark] .modebtn *{color:#E7ECFF}
:root[data-lago=dark] ::placeholder{color:#7B849A}
'''
block=MARK_A+'\n'+vars_+'\n'.join(out)+'\n'+'\n'.join(inl)+'\n'+MARK_B+'\n'
open(CSS,'w').write(src.rstrip()+'\n'+block)
print('rules',len(out),'inline',len(inl))
