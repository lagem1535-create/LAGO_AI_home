#!/usr/bin/env python3
"""scripts/en_extra.txt 의 번역을 public/assets/en.js 에 합쳐요. 다시 돌려도 안전해요."""
import json,re,os
R=os.path.dirname(os.path.abspath(__file__))+'/..'
P=R+'/public/assets/en.js'
s=open(P,encoding='utf-8').read()
d=json.loads(re.search(r'window\.LAGO_EN=(\{.*\});?\s*$',s,re.S).group(1))
n=0
for ln in open(R+'/scripts/en_extra.txt',encoding='utf-8'):
    ln=ln.rstrip('\n')
    if not ln or ln.startswith('#') or '=>' not in ln:continue
    k,v=ln.split('=>',1)
    if k and k!=v and d.get(k)!=v:d[k]=v;n+=1
open(P,'w',encoding='utf-8').write('window.LAGO_EN='+json.dumps(d,ensure_ascii=False,separators=(',',':'))+';\n')
print('en.js 항목',len(d),'· 바뀜',n)
