/* Caderneta — leitor de documentos: fatura, extrato, canhoto e boleto.
   Tudo roda no aparelho: o documento nunca sai do celular.
   - PDF com texto: pdf.js lê o texto exato.
   - Foto ou PDF escaneado: Tesseract.js reconhece o texto.
   - Boleto: código de barras (BarcodeDetector) ou linha digitável, conferida
     pelos dígitos verificadores.
   As bibliotecas só são baixadas na primeira vez que a função é usada. */
(function(){
"use strict";
const PDFJS="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const TESS="https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

const carregados={};
function carregar(src){
  return carregados[src]||(carregados[src]=new Promise((ok,no)=>{
    const s=document.createElement("script"); s.src=src; s.async=true; s.crossOrigin="anonymous";
    s.onload=ok;
    s.onerror=()=>{ delete carregados[src]; no(new Error("Não consegui baixar o leitor. Verifique a internet — é só na primeira vez.")); };
    document.head.appendChild(s); })); }

/* ---- imagem: reduz, acinzenta e estica o contraste (ajuda o reconhecimento) ---- */
function abrirImagem(arquivo){
  return new Promise((ok,no)=>{
    const u=URL.createObjectURL(arquivo), im=new Image();
    im.onload=()=>{ URL.revokeObjectURL(u); ok(im); };
    im.onerror=()=>{ URL.revokeObjectURL(u); no(new Error("Não consegui abrir essa imagem.")); };
    im.src=u; }); }
async function paraCanvas(fonte,maxLado){
  const img=fonte instanceof HTMLCanvasElement?fonte:await abrirImagem(fonte);
  const w0=img.naturalWidth||img.width, h0=img.naturalHeight||img.height;
  const k=Math.min(1,(maxLado||2200)/Math.max(w0,h0));
  const c=document.createElement("canvas"); c.width=Math.max(1,Math.round(w0*k)); c.height=Math.max(1,Math.round(h0*k));
  const g=c.getContext("2d",{willReadFrequently:true}); g.drawImage(img,0,0,c.width,c.height);
  const px=g.getImageData(0,0,c.width,c.height), a=px.data, hist=new Array(256).fill(0);
  for(let i=0;i<a.length;i+=4){ const y=(a[i]*0.299+a[i+1]*0.587+a[i+2]*0.114)|0; a[i]=y; hist[y]++; }
  const total=a.length/4; let acc=0, lo=0, hi=255;
  for(let v=0;v<256;v++){ acc+=hist[v]; if(acc>=total*0.02){ lo=v; break; } }
  acc=0; for(let v=255;v>=0;v--){ acc+=hist[v]; if(acc>=total*0.02){ hi=v; break; } }
  const esc=hi>lo?255/(hi-lo):1;
  for(let i=0;i<a.length;i+=4){ const y=Math.max(0,Math.min(255,(a[i]-lo)*esc)); a[i]=a[i+1]=a[i+2]=y; }
  g.putImageData(px,0,0);
  return c; }

/* ---- reconhecimento de texto ---- */
let tess=null, progCb=null;
async function ocr(canvas){
  await carregar(TESS);
  if(!tess) tess=await window.Tesseract.createWorker("por",1,{
    logger:m=>{ if(progCb&&m.status==="recognizing text") progCb(Math.round((m.progress||0)*100),"reconhecendo o texto"); } });
  const r=await tess.recognize(canvas);
  return (r&&r.data&&r.data.text)||""; }

/* ---- PDF: texto exato; página escaneada vira imagem e passa pelo reconhecimento ---- */
function linhasDoPdf(items){
  const rows=[];
  items.forEach(it=>{
    if(!it.str||!it.str.trim()) return;
    const x=it.transform[4], y=Math.round(it.transform[5]);
    let r=rows.find(q=>Math.abs(q.y-y)<=2); if(!r){ r={y,parts:[]}; rows.push(r); }
    r.parts.push({x,s:it.str,w:it.width||0}); });
  rows.sort((a,b)=>b.y-a.y);
  return rows.map(r=>{
    r.parts.sort((a,b)=>a.x-b.x); let out="", fim=null;
    r.parts.forEach(p=>{ if(fim!==null) out+=(p.x-fim>12?"   ":" "); out+=p.s; fim=p.x+p.w; });
    return out.replace(/\s+$/,""); }).join("\n"); }
async function textoDoPdf(arquivo){
  await carregar(PDFJS);
  const lib=window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
  const doc=await lib.getDocument({data:await arquivo.arrayBuffer()}).promise;
  const n=Math.min(doc.numPages,15), paginas=[];
  for(let p=1;p<=n;p++){
    const pg=await doc.getPage(p);
    let texto=linhasDoPdf((await pg.getTextContent()).items);
    if(texto.replace(/\s/g,"").length<40){
      const vp=pg.getViewport({scale:2}), c=document.createElement("canvas");
      c.width=vp.width; c.height=vp.height;
      await pg.render({canvasContext:c.getContext("2d"),viewport:vp}).promise;
      texto=await ocr(await paraCanvas(c,2400));
    }
    paginas.push(texto);
    if(progCb) progCb(Math.round(p/n*100),"lendo a página "+p+" de "+n);
  }
  return paginas.join("\n"); }

/* ---- boleto pela câmera: código de barras (Android/Chrome) ---- */
async function codigoDeBarras(arquivo){
  if(!("BarcodeDetector" in window)) return "";
  try{
    const fm=await window.BarcodeDetector.getSupportedFormats(); if(fm.indexOf("itf")<0) return "";
    const bmp=await createImageBitmap(arquivo);
    const r=await new window.BarcodeDetector({formats:["itf"]}).detect(bmp);
    const c=r.find(x=>/^\d{44}$/.test(x.rawValue)); return c?c.rawValue:"";
  }catch(e){ return ""; } }

/* ---- utilitários de leitura ---- */
const MESES={jan:1,fev:2,mar:3,abr:4,mai:5,jun:6,jul:7,ago:8,set:9,out:10,nov:11,dez:12};
const pad=n=>String(n).padStart(2,"0");
const semAcento=s=>String(s).normalize("NFD").replace(/[̀-ͯ]/g,"");
const mesDeHoje=()=>{ const t=new Date(); return t.getFullYear()+"-"+pad(t.getMonth()+1); };
function capitalizar(s){
  s=String(s||"").trim(); if(!s) return s;
  if(s!==s.toUpperCase()) return s.charAt(0).toUpperCase()+s.slice(1);
  return s.toLowerCase().replace(/(^|[\s*\/.\-])(\p{L})/gu,(m,a,b)=>a+b.toUpperCase()); }

/* valor no padrão brasileiro: 1.234,56 · -50,00 · 50,00- · 50,00 D · 50,00 C */
const RE_VALOR=/(^|[\s(])(-\s?)?(?:R\$\s?)?(-\s?)?(\d{1,3}(?:\.\d{3})+|\d+),(\d{2})(?!\d)(\s?-|\s?[DC](?![A-Za-z]))?/g;
function valores(linha){
  const out=[]; let m; RE_VALOR.lastIndex=0;
  while((m=RE_VALOR.exec(linha))){
    const cent=parseInt(m[4].replace(/\./g,""),10)*100+parseInt(m[5],10);
    const suf=(m[6]||"").trim();
    out.push({v:cent, neg:!!(m[2]||m[3]||suf==="-"||suf==="D"), cred:suf==="C",
      marca:!!(m[2]||m[3]||suf), ini:m.index+m[1].length}); }
  return out; }

/* data no começo da linha: 12/08 · 12/08/2026 · 12 AGO · 12 de agosto */
function dataNoInicio(linha,ano,mesRef){
  let m=linha.match(/^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?(?!\d)/), d,mo,y;
  if(m){ d=+m[1]; mo=+m[2]; y=m[3]?(m[3].length===2?2000+(+m[3]):+m[3]):0; }
  else {
    m=semAcento(linha).match(/^(\d{1,2})\s*(?:de\s+)?(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*\.?(?:\s*(?:de\s+)?(\d{4}))?/i);
    if(!m) return null; d=+m[1]; mo=MESES[m[2].toLowerCase()]; y=m[3]?+m[3]:0; }
  if(d<1||d>31||mo<1||mo>12) return null;
  if(!y){ y=ano; if(mo>mesRef+1) y=ano-1; }      /* "20/12" numa fatura de janeiro é do ano anterior */
  return {iso:y+"-"+pad(mo)+"-"+pad(d), len:m[0].length}; }

/* linhas que não são lançamento */
const IGN_COMUM=/\b(saldo|total|subtotal|limite|vencimento|resumo|periodo|pagina|historico|lancamentos futuros)\b/i;
const IGN_FATURA=/\b(pagamento(s)?( efetuado| recebido| da fatura)?|pgto|fatura anterior|minimo|rotativo previsto)\b/i;
const RE_ENTRADA=/\b(receb|credito|deposito|salario|estorno|rendimento|resgate|devolucao)/i;
const RE_PARC=/\b(?:parc(?:ela)?\.?\s*)?(\d{1,2})\s?(?:\/|de)\s?(\d{1,2})\b/i;

/* fatura do cartão e extrato do banco: uma linha por lançamento */
function lerLancamentos(texto,tipo,mes){
  const ref=(mes||mesDeHoje()).split("-").map(Number), ano=ref[0], mesRef=ref[1];
  const fatura=tipo!=="extrato";
  const linhas=[]; let ignoradas=0, estornos=0;
  String(texto||"").split(/\r?\n/).forEach(bruta=>{
    const linha=bruta.replace(/[|•]/g," ").replace(/\s+/g," ").trim(); if(linha.length<6) return;
    const sem=semAcento(linha);
    const dt=dataNoInicio(linha,ano,mesRef); if(!dt) return;
    const vals=valores(linha).filter(x=>x.ini>=dt.len); if(!vals.length) return;
    if(IGN_COMUM.test(sem)||(fatura&&IGN_FATURA.test(sem))){ ignoradas++; return; }
    /* o valor do lançamento: o marcado com sinal, D ou C; senão, na fatura o último,
       no extrato o primeiro (o último costuma ser a coluna de saldo) */
    const val=vals.find(x=>x.marca)||(fatura?vals[vals.length-1]:vals[0]);
    let desc=linha.slice(dt.len,val.ini).replace(/\b(US\$|USD|EUR)\s?[\d.,]+/gi,"").trim();
    let i0=1, n=1;
    if(fatura){ const pm=desc.match(RE_PARC);
      if(pm){ const a=+pm[1], b=+pm[2];
        if(b>=2&&b<=48&&a>=1&&a<=b){ i0=a; n=b; desc=desc.replace(pm[0]," "); } } }
    desc=desc.replace(/\s{2,}/g," ").replace(/^[\-–—:*\s]+|[\-–—:*\s]+$/g,"");
    if(!desc) desc=fatura?"Compra no cartão":"Lançamento do extrato";
    let k="g";
    if(fatura){ if(val.neg||val.cred){ estornos++; return; } }
    else if(val.cred||(!val.neg&&RE_ENTRADA.test(sem))) k="e";
    linhas.push({d:dt.iso, desc:capitalizar(desc), v:val.v, k, i0, n}); });
  return {linhas, ignoradas, estornos}; }

/* sem o tipo escolhido, tenta descobrir pelo conteúdo */
function adivinharTipo(texto,codigo){
  if(codigo) return "boleto";
  const s=semAcento(texto).toLowerCase();
  if(/\d{5}[.\s]?\d{5}\s+\d{5}[.\s]?\d{6}\s+\d{5}[.\s]?\d{6}\s+\d\s+\d{14}/.test(s)||/8\d{10}[\s\-]?\d\s+\d{11}/.test(s)) return "boleto";
  if(/fatura|limite (total|disponivel)|pagamento minimo/.test(s)) return "fatura";
  if(/extrato|saldo anterior|saldo do dia|conta corrente/.test(s)) return "extrato";
  const datadas=s.split("\n").filter(l=>/^\s*\d{1,2}[\/.\-]\d{1,2}/.test(l)&&/\d,\d{2}/.test(l)).length;
  return datadas>=3?"fatura":"cupom"; }

/* ---- canhoto da maquininha e cupom fiscal ---- */
function lerCupom(texto){
  const L=String(texto||"").split(/\r?\n/).map(l=>l.replace(/\s+/g," ").trim()).filter(Boolean);
  const S=L.map(l=>semAcento(l).toLowerCase());
  let v=0;
  for(let i=S.length-1;i>=0&&!v;i--){
    if(/tribut|imposto|troco|desconto|acrescimo/.test(S[i])) continue;
    if(/valor total|total a pagar|valor a pagar|valor pago|total r\$|^total\b|^valor\b|\bvalor:/.test(S[i])){
      const vs=valores(L[i]); if(vs.length) v=vs[vs.length-1].v; } }
  if(!v) L.forEach((l,i)=>{ if(/tribut|troco/.test(S[i])) return; valores(l).forEach(x=>{ if(x.v>v) v=x.v; }); });
  let d="";
  for(const l of L){ const m=l.match(/\b(\d{2})[\/.\-](\d{2})[\/.\-](\d{2,4})\b/);
    if(m&&+m[1]>=1&&+m[1]<=31&&+m[2]>=1&&+m[2]<=12){ d=(m[3].length===2?"20"+m[3]:m[3])+"-"+m[2]+"-"+m[1]; break; } }
  const RUIDO=/stone|cielo|getnet|pagseguro|pagbank|sumup|mercado ?pago|safrapay|\bton\b|\brede\b|vero|sipag|granito|cnpj|cpf|cupom|nfc|nf-e|documento|auxiliar|consumidor|extrato|via |cliente|estabelecimento|comprovante|ie:|endereco|rua |av\.|telefone|fone|^\d/;
  let loja="";
  for(let i=0;i<Math.min(L.length,8);i++){
    if(/[a-z]{3,}/i.test(L[i])&&!RUIDO.test(S[i])&&!valores(L[i]).length){ loja=L[i]; break; } }
  const tudo=S.join(" ");
  let metodo="", n=1, bandeira="";
  if(/credito/.test(tudo)) metodo="credito"; else if(/debito/.test(tudo)) metodo="debito";
  else if(/\bpix\b/.test(tudo)) metodo="pix"; else if(/dinheiro/.test(tudo)) metodo="dinheiro";
  const pm=tudo.match(/parcelado\D{0,12}(\d{1,2})|(\d{1,2})\s?x\s?(?:de|sem juros|s\/ juros)/);
  if(pm){ const q=+(pm[1]||pm[2]); if(q>=2&&q<=48) n=q; }
  const bm=tudo.match(/\b(visa|master(?:card)?|elo|amex|hipercard)\b/); if(bm) bandeira=bm[1];
  return v ? {linhas:[{d, desc:capitalizar(loja||"Compra"), v, k:"g", i0:1, n, metodo, bandeira}]}
           : {linhas:[], erro:"Não achei o valor nesse documento."}; }

/* ---- boleto: linha digitável ou código de barras, conferidos pelos dígitos verificadores ---- */
const BANCOS={"001":"Banco do Brasil","033":"Santander","041":"Banrisul","077":"Inter","085":"Ailos","104":"Caixa","136":"Unicred",
  "208":"BTG","212":"Original","237":"Bradesco","260":"Nubank","336":"C6","341":"Itaú","422":"Safra","748":"Sicredi","756":"Sicoob"};
const SEGMENTO={"1":["Prefeitura","imposto"],"2":["Água e saneamento","casa"],"3":["Energia ou gás","casa"],
  "4":["Telefone e internet","assin"],"5":["Órgão público","imposto"],"6":["Carnê","outros"],"7":["Multa de trânsito","imposto"],"9":["Conta","outros"]};
function mod10(s){ let soma=0, peso=2;
  for(let i=s.length-1;i>=0;i--){ let p=+s[i]*peso; if(p>9) p=Math.floor(p/10)+p%10; soma+=p; peso=peso===2?1:2; }
  const r=soma%10; return r===0?0:10-r; }
function somaPesos(s){ let soma=0, peso=2; for(let i=s.length-1;i>=0;i--){ soma+=+s[i]*peso; peso=peso===9?2:peso+1; } return soma; }
const mod11Banco=s=>{ const r=11-(somaPesos(s)%11); return (r===0||r===10||r===11)?1:r; };
const mod11Arrec=s=>{ const r=somaPesos(s)%11; return (r===0||r===1)?0:11-r; };
/* fator de vencimento: o ciclo recomeçou em 22/02/2025 (fator 1000); vale o ciclo mais perto de hoje */
function vencimento(fator){
  const f=+fator; if(!f) return "";
  const dia=86400000, c1=Date.UTC(1997,9,7)+f*dia, c2=Date.UTC(2025,1,22)+(f-1000)*dia, hoje=Date.now();
  return new Date(Math.abs(c2-hoje)<Math.abs(c1-hoje)?c2:c1).toISOString().slice(0,10); }
function decodificar(c){
  if(c.length===47){                                  /* boleto bancário: 3 campos com DV + DV geral */
    if(mod10(c.slice(0,9))!==+c[9]||mod10(c.slice(10,20))!==+c[20]||mod10(c.slice(21,31))!==+c[31]) return null;
    return decodificar(c.slice(0,4)+c[32]+c.slice(33,47)+c.slice(4,9)+c.slice(10,20)+c.slice(21,31)); }
  if(c.length===48){                                  /* arrecadação: 4 blocos de 11 + DV */
    const f=(+c[2]===6||+c[2]===8)?mod10:mod11Arrec;
    for(let k=0;k<4;k++) if(f(c.substr(k*12,11))!==+c[k*12+11]) return null;
    return decodificar(c.substr(0,11)+c.substr(12,11)+c.substr(24,11)+c.substr(36,11)); }
  if(c.length!==44) return null;
  if(c[0]==="8"){
    const ind=+c[2], f=(ind===6||ind===8)?mod10:mod11Arrec;
    if(f(c.slice(0,3)+c.slice(4))!==+c[3]) return null;
    const seg=SEGMENTO[c[1]]||["Conta","outros"];
    return {d:"", desc:seg[0], v:(ind===6||ind===7)?parseInt(c.slice(4,15),10):0, k:"g", i0:1, n:1, metodo:"boleto", cat:seg[1], codigo:c}; }
  if(mod11Banco(c.slice(0,4)+c.slice(5))!==+c[4]) return null;
  const venc=vencimento(c.slice(5,9));
  return {d:venc, desc:"Boleto "+(BANCOS[c.slice(0,3)]||"bancário"), v:parseInt(c.slice(9,19),10), k:"g", i0:1, n:1,
    metodo:"boleto", vencimento:venc, codigo:c}; }
function lerBoleto(entrada){
  const txt=String(entrada||""), cands=[];
  txt.split(/\r?\n/).forEach(l=>{ const d=l.replace(/\D/g,""); if(d.length===44||d.length===47||d.length===48) cands.push(d); });
  const tudo=txt.replace(/\D/g,"");
  if(tudo.length===44||tudo.length===47||tudo.length===48) cands.push(tudo);
  for(const c of cands){ const r=decodificar(c); if(r) return {linhas:[r]}; }
  for(const tam of [47,48,44]) for(let i=0;i+tam<=tudo.length;i++){ const r=decodificar(tudo.substr(i,tam)); if(r) return {linhas:[r]}; }
  return {linhas:[], erro:tudo.length>=44?"O código lido não bateu com os dígitos de conferência. Digite a linha digitável.":"Não achei o código do boleto. Digite a linha digitável."}; }

/* ---- porta de entrada ---- */
async function ler(arquivo,op){
  op=op||{}; progCb=op.onProgress||null;
  try{
    const ehPdf=/pdf/i.test(arquivo.type||"")||/\.pdf$/i.test(arquivo.name||"");
    let codigo="";
    if(!ehPdf&&(op.tipo==="boleto"||!op.tipo||op.tipo==="auto")) codigo=await codigoDeBarras(arquivo);
    let texto="";
    if(!codigo){ if(progCb) progCb(0,"preparando"); texto=ehPdf?await textoDoPdf(arquivo):await ocr(await paraCanvas(arquivo)); }
    const tipo=op.tipo&&op.tipo!=="auto"?op.tipo:adivinharTipo(texto,codigo);
    const r=tipo==="boleto"?lerBoleto(codigo||texto):tipo==="cupom"?lerCupom(texto):lerLancamentos(texto,tipo,op.mes);
    r.tipo=tipo; r.texto=texto; return r;
  } finally { progCb=null; } }

window.Leitor={ler, lerBoleto, lerCupom, lerLancamentos, adivinharTipo, linhasDoPdf, _dv:{mod10,mod11Banco,mod11Arrec,decodificar}};
})();
