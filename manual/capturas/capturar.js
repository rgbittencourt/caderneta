/* Driver das capturas do manual. Tudo com dados inventados (seed.js). */
window.espera = ms => new Promise(r=>setTimeout(r,ms||350));

window.carregaH2C = async function(){
  if(typeof html2canvas!=="undefined") return;
  await new Promise((ok,no)=>{ const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload=ok; s.onerror=no; document.head.appendChild(s); });
};
window.cap = async function(el,nome){
  if(!el) return nome+": ELEMENTO NÃO ENCONTRADO";
  await carregaH2C();
  el.scrollIntoView({block:"center"}); await espera(150);
  /* html2canvas desenha o conteúdo de <details> fechado; escondemos durante a foto */
  const escondidos=[...el.querySelectorAll("details")];
  escondidos.forEach(d=>{ d.dataset.dp=d.style.display; d.style.display="none"; });
  /* card esticado pelo grid fica com sobra em branco: solta a altura só para a foto */
  const alinhoAntes=el.style.alignSelf, alturaAntes=el.style.height;
  el.style.alignSelf="start"; el.style.height="auto";
  await espera(80);
  const c = await html2canvas(el,{scale:2,backgroundColor:getComputedStyle(document.body).backgroundColor,useCORS:true,onclone:semCorNova});
  escondidos.forEach(d=>{ d.style.display=d.dataset.dp||""; });
  el.style.alignSelf=alinhoAntes; el.style.height=alturaAntes;
  const b = await new Promise(r=>c.toBlob(r,'image/png'));
  const res = await fetch('http://127.0.0.1:8767/save/'+nome+'.png',{method:'POST',body:b});
  return nome+": "+c.width+"x"+c.height+" "+res.status;
};
/* acha a <div class="sec"> cujo título casa com o texto */
window.sec = function(view,re){
  return [...document.querySelectorAll("#p-"+view+" .sec")].find(s=>{
    const t=s.querySelector(".sec-t"); return t && re.test(t.textContent); });
};
/* acha o card que contém determinado texto */
window.cardCom = function(view,re){
  return [...document.querySelectorAll("#p-"+view+" .card")].find(c=>re.test(c.textContent));
};
window.irPara = async function(v){ setView(v); await espera(500); };
window.fecharFicha = function(){ try{ closeSheet(); }catch(e){} };
/* relógio fixo em 27/09/2026 15h, o dia dos dados de demonstração (seed.js) */
window.fixarRelogio = function(){
  if(window.__relogio) return; window.__relogio=1;
  const R=Date, off=new R(2026,8,27,15,0,0).getTime()-R.now();
  class D extends R{ constructor(...a){ if(a.length) super(...a); else super(R.now()+off); } static now(){ return R.now()+off; } }
  window.Date=D; };

/* html2canvas 1.4 não entende color(srgb …) — o que o navegador devolve para color-mix(). Troca por rgba no clone. */
window.semCorNova = function(doc){
  const conv=v=>v.replace(/color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)/g,(m,r,g,b,a)=>
    "rgba("+Math.round(r*255)+","+Math.round(g*255)+","+Math.round(b*255)+","+(a===undefined?1:a)+")");
  const P=["color","backgroundColor","borderTopColor","borderRightColor","borderBottomColor","borderLeftColor","outlineColor","boxShadow","backgroundImage","fill","stroke","textDecorationColor","columnRuleColor","caretColor"];
  const w=doc.defaultView;
  doc.querySelectorAll("*").forEach(n=>{ const cs=w.getComputedStyle(n);
    P.forEach(k=>{ const v=cs[k]; if(v&&v.indexOf("color(")>=0) n.style[k]=conv(v); }); }); };
