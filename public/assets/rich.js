/* LAGO rich answers: 표, 차트(막대·선·원), 수식, 굵게/기울임/코드/목록. window.LAGO_RICH(text) -> HTML (모든 입력은 이스케이프) */
(function(){
const E=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const SYM={alpha:"α",beta:"β",gamma:"γ",delta:"δ",epsilon:"ε",varepsilon:"ε",zeta:"ζ",eta:"η",theta:"θ",lambda:"λ",mu:"μ",nu:"ν",xi:"ξ",pi:"π",rho:"ρ",sigma:"σ",tau:"τ",phi:"φ",varphi:"φ",chi:"χ",psi:"ψ",omega:"ω",Gamma:"Γ",Delta:"Δ",Theta:"Θ",Lambda:"Λ",Pi:"Π",Sigma:"Σ",Phi:"Φ",Psi:"Ψ",Omega:"Ω",times:"×",cdot:"·",div:"÷",pm:"±",mp:"∓",leq:"≤",le:"≤",geq:"≥",ge:"≥",neq:"≠",ne:"≠",approx:"≈",equiv:"≡",infty:"∞",to:"→",rightarrow:"→",leftarrow:"←",Rightarrow:"⇒",Leftrightarrow:"⇔",leftrightarrow:"↔",in:"∈",notin:"∉",subset:"⊂",cup:"∪",cap:"∩",forall:"∀",exists:"∃",partial:"∂",nabla:"∇",ldots:"…",cdots:"⋯",degree:"°",circ:"°",angle:"∠",perp:"⊥",parallel:"∥",therefore:"∴",propto:"∝",sim:"∼",prime:"′",hbar:"ℏ",ell:"ℓ",emptyset:"∅",neg:"¬",land:"∧",lor:"∨",quad:" ",qquad:"  ",",":" ",";":" ","!":"",lt:"<",gt:">"};
const FN=/^(sin|cos|tan|cot|sec|csc|log|ln|exp|lim|max|min|det|sup|inf|arcsin|arccos|arctan|sinh|cosh|tanh)$/;
const BIG={sum:"∑",prod:"∏",int:"∫",oint:"∮"};
function grp(s,i){while(s[i]===" ")i++;if(s[i]==="{"){let d=0,j=i;for(;j<s.length;j++){if(s[j]==="{")d++;else if(s[j]==="}"){d--;if(!d)break;}}return[s.slice(i+1,j),j+1];}
 if(s[i]==="\\"){const m=/^\\([A-Za-z]+|.)/.exec(s.slice(i));return[m?m[0]:"",i+(m?m[0].length:1)];}
 return[s[i]||"",i+1];}
function tex(s,depth){depth=depth||0;if(depth>8)return E(s);let o="",i=0;
 while(i<s.length){const c=s[i];
  if(c==="\\"){const m=/^\\([A-Za-z]+|.)/.exec(s.slice(i));const n=m[1];i+=m[0].length;
   if(n==="frac"||n==="dfrac"||n==="tfrac"){let a,b;[a,i]=grp(s,i);[b,i]=grp(s,i);o+=`<span class="mf"><span class="mn">${tex(a,depth+1)}</span><span class="md">${tex(b,depth+1)}</span></span>`;}
   else if(n==="sqrt"){let idx="";if(s[i]==="["){const j=s.indexOf("]",i);if(j>0){idx=s.slice(i+1,j);i=j+1;}}let a;[a,i]=grp(s,i);o+=`<span class="msq">${idx?`<sup class="mrt">${tex(idx,depth+1)}</sup>`:""}√<span class="msqi">${tex(a,depth+1)}</span></span>`;}
   else if(n==="text"||n==="mathrm"||n==="mathbf"||n==="textbf"||n==="mathit"||n==="operatorname"){let a;[a,i]=grp(s,i);o+=(n==="mathbf"||n==="textbf"?"<b>":"")+(n==="mathit"?"<i>":"")+E(a)+(n==="mathbf"||n==="textbf"?"</b>":"")+(n==="mathit"?"</i>":"");}
   else if(n==="left"||n==="right"||n==="big"||n==="Big"||n==="bigg"){if(s[i]==="."){i++;}}
   else if(n==="overline"||n==="bar"){let a;[a,i]=grp(s,i);o+=`<span class="mov">${tex(a,depth+1)}</span>`;}
   else if(n==="vec"||n==="hat"){let a;[a,i]=grp(s,i);o+=`<span class="mvec">${tex(a,depth+1)}<i>${n==="vec"?"→":"^"}</i></span>`;}
   else if(BIG[n]){o+=`<span class="mbig">${BIG[n]}</span>`;}
   else if(n==="{"||n==="}"||n==="%"||n==="$"||n==="&"||n==="_"||n==="#")o+=E(n);
   else if(n==="\\"){o+="<br>";}
   else if(n==="lbrace"){o+="{";}else if(n==="rbrace"){o+="}";}
   else if(n==="langle"){o+="⟨";}else if(n==="rangle"){o+="⟩";}
   else if(SYM[n]!==undefined)o+=E(SYM[n]);
   else if(FN.test(n))o+=`<span class="mfn">${n}</span>`;
   else o+=E(n);
   continue;}
  if(c==="^"||c==="_"){let a;[a,i]=grp(s,i+1);let up="",dn="";if(c==="^")up=a;else dn=a;
   // 바로 이어지는 반대쪽 첨자도 한 묶음으로
   const k=s[i];if((c==="^"&&k==="_")||(c==="_"&&k==="^")){let b;[b,i]=grp(s,i+1);if(c==="^")dn=b;else up=b;}
   if(up&&dn)o+=`<span class="mss"><sup>${tex(up,depth+1)}</sup><sub>${tex(dn,depth+1)}</sub></span>`;else o+=up?`<sup>${tex(up,depth+1)}</sup>`:`<sub>${tex(dn,depth+1)}</sub>`;continue;}
  if(c==="{"||c==="}"){i++;continue;}
  if(/[A-Za-z]/.test(c)){let j=i;while(j<s.length&&/[A-Za-z]/.test(s[j]))j++;const w=s.slice(i,j);if(w.length>1&&FN.test(w)){o+=`<span class="mfn">${w}</span>`;}else o+=w.split("").map(x=>`<i class="mv">${x}</i>`).join("");i=j;continue;}
  if(c==="-"){o+="−";i++;continue;}
  if(c===" "){i++;continue;}
  o+=E(c);i++;}
 return o;}
const PAL=["#4A6CF7","#E8833A","#2BA39B","#C94F7C","#8A6FD1","#D9B13B","#5B8C5A","#7A869A"];
const nice=m=>{if(m<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(m))),f=m/p;return(f<=1?1:f<=2?2:f<=5?5:10)*p;};
const fmt=v=>{const a=Math.abs(v);return a>=1e4?String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,","):String(Math.round(v*100)/100);};
function chart(j){let d;try{d=JSON.parse(j);}catch(e){return null;}
 if(!d||typeof d!=="object")return null;
 const type=String(d.type||"bar").toLowerCase();let labels=(d.labels||d.x||[]).map(String);
 let series=d.series?d.series.map(s=>({name:String(s.name||""),data:(s.data||[]).map(Number)})):[{name:String(d.name||""),data:(d.data||d.values||[]).map(Number)}];
 series=series.filter(s=>s.data.length&&s.data.every(x=>isFinite(x)));if(!series.length)return null;
 const n=Math.max(...series.map(s=>s.data.length));while(labels.length<n)labels.push(String(labels.length+1));
 if(n>40)return null;
 const title=d.title?`<div class="chtt">${E(d.title)}</div>`:"";const W=520;
 if(type==="pie"||type==="doughnut"||type==="donut"||type==="원"){const dat=series[0].data.map(x=>Math.max(0,x));const tot=dat.reduce((a,b)=>a+b,0);if(!tot)return null;
  const cx=100,cy=100,r=88,ri=type==="pie"||type==="원"?0:50;let ang=-Math.PI/2,sl="";
  dat.forEach((v,i)=>{const a=v/tot*Math.PI*2;if(a<=0)return;const col=PAL[i%PAL.length];
   if(dat.filter(x=>x>0).length===1){sl+=`<circle cx="${cx}" cy="${cy}" r="${(r+ri)/2}" fill="none" stroke="${col}" stroke-width="${r-ri||r*2}"/>`;ang+=a;return;}
   const x1=cx+r*Math.cos(ang),y1=cy+r*Math.sin(ang),x2=cx+r*Math.cos(ang+a),y2=cy+r*Math.sin(ang+a),big=a>Math.PI?1:0;
   if(ri){const x3=cx+ri*Math.cos(ang+a),y3=cy+ri*Math.sin(ang+a),x4=cx+ri*Math.cos(ang),y4=cy+ri*Math.sin(ang);sl+=`<path d="M${x1},${y1} A${r},${r} 0 ${big} 1 ${x2},${y2} L${x3},${y3} A${ri},${ri} 0 ${big} 0 ${x4},${y4}Z" fill="${col}" class="chsl"><title>${E(labels[i])}: ${fmt(v)}</title></path>`;}
   else sl+=`<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${big} 1 ${x2},${y2}Z" fill="${col}" class="chsl"><title>${E(labels[i])}: ${fmt(v)}</title></path>`;
   ang+=a;});
  const lg=dat.map((v,i)=>`<li><i style="background:${PAL[i%PAL.length]}"></i>${E(labels[i])} <b>${fmt(v)}</b> <span>${Math.round(v/tot*1000)/10}%</span></li>`).join("");
  return `<figure class="chart pie">${title}<div class="chpie"><svg viewBox="0 0 200 200" role="img" aria-label="${E(d.title||"원그래프")}">${sl}</svg><ul class="chlg">${lg}</ul></div></figure>`;}
 const H=240,ml=44,mr=12,mt=14,mb=34,pw=W-ml-mr,ph=H-mt-mb;
 const all=series.flatMap(s=>s.data),mx0=Math.max(0,...all),mn0=Math.min(0,...all);const top=nice(mx0||1),bot=mn0<0?-nice(-mn0):0;const rg=top-bot;
 const y=v=>mt+ph-(v-bot)/rg*ph;let g="";
 for(let k=0;k<=4;k++){const v=bot+rg*k/4;g+=`<line x1="${ml}" x2="${W-mr}" y1="${y(v)}" y2="${y(v)}" class="chgl"/><text x="${ml-6}" y="${y(v)+4}" text-anchor="end" class="chtx">${fmt(v)}</text>`;}
 const bw=pw/n;let body="";
 const skip=Math.ceil(n/Math.max(1,Math.floor(pw/54)));
 labels.slice(0,n).forEach((l,i)=>{if(i%skip===0){const t=l.length>8?l.slice(0,7)+"…":l;body+=`<text x="${ml+bw*(i+.5)}" y="${H-mb+16}" text-anchor="middle" class="chtx">${E(t)}</text>`;}});
 if(type==="line"||type==="선"||type==="area"){
  series.forEach((s,si)=>{const col=PAL[si%PAL.length];const pts=s.data.map((v,i)=>[ml+bw*(i+.5),y(v)]);
   if(type==="area")body+=`<path d="M${pts[0][0]},${y(0)} ${pts.map(p=>"L"+p[0]+","+p[1]).join(" ")} L${pts[pts.length-1][0]},${y(0)}Z" fill="${col}" opacity=".15"/>`;
   body+=`<polyline points="${pts.map(p=>p.join(",")).join(" ")}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"/>`+pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.4" fill="${col}"><title>${E(labels[i])}: ${fmt(s.data[i])}</title></circle>`).join("");
   if(n<=12&&series.length===1)body+=pts.map((p,i)=>`<text x="${p[0]}" y="${p[1]-8}" text-anchor="middle" class="chtx v">${fmt(s.data[i])}</text>`).join("");});
 }else{
  const sn=series.length,gw=bw*.72,w1=gw/sn;
  series.forEach((s,si)=>{const col=PAL[si%PAL.length];s.data.forEach((v,i)=>{const x=ml+bw*i+(bw-gw)/2+w1*si,y0=y(0),y1=y(v);body+=`<rect x="${x}" y="${Math.min(y0,y1)}" width="${Math.max(1,w1-2)}" height="${Math.max(1,Math.abs(y0-y1))}" rx="2" fill="${col}" class="chsl"><title>${E(labels[i])}: ${fmt(v)}</title></rect>`;
   if(n<=12&&sn<=2)body+=`<text x="${x+(w1-2)/2}" y="${(v>=0?y1-5:y1+13)}" text-anchor="middle" class="chtx v">${fmt(v)}</text>`;});});
 }
 const lg=series.length>1||series[0].name?`<ul class="chlg row">${series.map((s,i)=>`<li><i style="background:${PAL[i%PAL.length]}"></i>${E(s.name||"")}</li>`).join("")}</ul>`:"";
 return `<figure class="chart">${title}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(d.title||"그래프")}">${g}<line x1="${ml}" x2="${W-mr}" y1="${y(0)}" y2="${y(0)}" class="chax"/>${body}</svg>${lg}</figure>`;}
function inline(s){return s
 .replace(/\*\*([^*\n]+?)\*\*/g,"<b>$1</b>").replace(/__([^_\n]+?)__/g,"<b>$1</b>")
 .replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?!\*)/g,"$1<i>$2</i>").replace(/(^|[^\w_])_([^_\s][^_\n]*?)_(?![\w_])/g,"$1<i>$2</i>")
 .replace(/~~([^~\n]+?)~~/g,"<s>$1</s>").replace(/\[(\d)\]/g,'<span class="cite">[$1]</span>');}
function rich(text){let t=String(text||"").replace(/\r/g,"");const stash=[];const put=h=>"\u0001"+(stash.push(h)-1)+"\u0002";
 t=t.replace(/```([A-Za-z0-9_-]*)[ \t]*\n([\s\S]*?)```/g,(m,lang,code)=>{lang=lang.toLowerCase();
  if(lang==="chart"||lang==="graph"||lang==="plot"){const c=chart(code.trim());if(c)return put(c);}
  if(lang==="math"||lang==="latex"||lang==="tex")return put(`<div class="mathb">${tex(code.trim())}</div>`);
  const D=window.lagoDesktop,sh=/^(bash|sh|shell|zsh|console|cmd|bat|powershell|ps1|ps)$/.test(lang);
  return put(`<div class="codewrap" data-lang="${E(lang)}"><div class="codebar"><span>${E(lang||"code")}</span><span class="cbgrow"></span>${D&&sh?'<button type="button" class="cbtn" data-act="runcode">실행</button>':""}${D&&!sh?'<button type="button" class="cbtn" data-act="savecode">파일로 저장</button>':""}<button type="button" class="cbtn" data-act="cpcode">복사</button></div><pre class="codeb"><code>${E(code.replace(/\n$/,""))}</code></pre></div>`);});
 t=t.replace(/\$\$([\s\S]+?)\$\$/g,(m,a)=>put(`<div class="mathb">${tex(a.trim())}</div>`)).replace(/\\\[([\s\S]+?)\\\]/g,(m,a)=>put(`<div class="mathb">${tex(a.trim())}</div>`))
  .replace(/\\\(([\s\S]+?)\\\)/g,(m,a)=>put(`<span class="math">${tex(a.trim())}</span>`))
  .replace(/\$([^\s$](?:[^$\n]*?[^\s$])?)\$(?![\d$])/g,(m,a)=>put(`<span class="math">${tex(a)}</span>`));
 t=t.replace(/`([^`\n]+)`/g,(m,a)=>put(`<code>${E(a)}</code>`));
 const lines=t.split("\n"),out=[];let para=[];
 const flush=()=>{if(para.length){out.push(`<p>${inline(E(para.join("\n"))).replace(/\n/g,"<br>")}</p>`);para=[];}};
 const cells=l=>l.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(c=>c.trim());
 for(let i=0;i<lines.length;i++){const l=lines[i];
  if(/^\s*\|.*\|?\s*$/.test(l)&&l.includes("|")&&i+1<lines.length&&/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(lines[i+1])){flush();
   const head=cells(l),al=cells(lines[i+1]).map(c=>/^:-+:$/.test(c)?"center":/-:$/.test(c)?"right":"");let rows=[];i+=2;
   while(i<lines.length&&lines[i].includes("|")&&lines[i].trim()){rows.push(cells(lines[i]));i++;}i--;
   const td=(c,k,tag)=>`<${tag}${al[k]?` style="text-align:${al[k]}"`:""}>${inline(E(c))}</${tag}>`;
   out.push(`<div class="tblw"><table class="rt"><thead><tr>${head.map((c,k)=>td(c,k,"th")).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${head.map((_,k)=>td(r[k]||"",k,"td")).join("")}</tr>`).join("")}</tbody></table></div>`);continue;}
  if(/^\u0001\d+\u0002$/.test(l.trim())){flush();out.push(l.trim());continue;}
  let m;
  if((m=/^(#{1,4})\s+(.+)$/.exec(l))){flush();out.push(`<p class="rh">${inline(E(m[2]))}</p>`);continue;}
  if(/^\s*([-*•]|\d+[.)])\s+/.test(l)){flush();const ord=/^\s*\d+[.)]/.test(l);const items=[];
   while(i<lines.length&&/^\s*([-*•]|\d+[.)])\s+/.test(lines[i])){items.push(lines[i].replace(/^\s*([-*•]|\d+[.)])\s+/,""));i++;}i--;
   out.push(`<${ord?"ol":"ul"} class="rl">${items.map(x=>`<li>${inline(E(x))}</li>`).join("")}</${ord?"ol":"ul"}>`);continue;}
  if(/^\s*(---+|\*\*\*+)\s*$/.test(l)){flush();out.push("<hr>");continue;}
  if(!l.trim()){flush();continue;}
  para.push(l);}
 flush();
 return out.join("").replace(/\u0001(\d+)\u0002/g,(m,k)=>stash[+k]);}
window.LAGO_RICH=rich;window.LAGO_TEX=tex;
})();
