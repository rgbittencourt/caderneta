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
    let r=rows.find(q=>Math.abs(q.y-y)<=Math.max(2,Math.abs((it.transform&&it.transform[3])||0)*0.4)); if(!r){ r={y,parts:[]}; rows.push(r); }
    r.parts.push({x,s:it.str,w:it.width||0}); });
  rows.sort((a,b)=>b.y-a.y);
  return rows.map(r=>{
    r.parts.sort((a,b)=>a.x-b.x); let out="", fim=null;
    r.parts.forEach(p=>{ if(fim!==null) out+=(p.x-fim>12?"   ":" "); out+=p.s; fim=p.x+p.w; });
    return out.replace(/\s+$/,""); }).join("\n"); }
async function textoDoPdf(arquivo,senha){
  await carregar(PDFJS);
  const lib=window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
  let doc;
  try{ doc=await lib.getDocument({data:await arquivo.arrayBuffer(), password:senha||undefined}).promise; }
  catch(e){ if(e&&e.name==="PasswordException"){ const x=new Error(e.code===2?"Senha errada.":"Esse PDF tem senha."); x.senha=true; x.errada=e.code===2; throw x; } throw e; }
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
const RE_VALOR=/(^|[\s(])(-\s?)?(?:R\$\s?)?(-\s?)?(\d{1,3}(?:\.\d{3})+|\d+),(\d{2})(?!\d)(\s?-|\s?[DC](?![A-Za-z])|\s?\(\s?[+-]\s?\))?/g;
function valores(linha){
  const out=[]; let m; RE_VALOR.lastIndex=0;
  while((m=RE_VALOR.exec(linha))){
    const cent=parseInt(m[4].replace(/\./g,""),10)*100+parseInt(m[5],10);
    const suf=(m[6]||"").replace(/[()\s]/g,"");
    out.push({v:cent, neg:!!(m[2]||m[3]||suf==="-"||suf==="D"), cred:suf==="C"||suf==="+",
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
  /* "20/12" numa fatura de janeiro é do ano anterior; "05/01" numa fatura fechada em dezembro é do ano seguinte */
  if(!y){ y=ano; const dif=mo-mesRef; if(dif>1) y=ano-1; else if(dif<-10) y=ano+1; }
  return {iso:y+"-"+pad(mo)+"-"+pad(d), len:m[0].length}; }

/* linhas que não são lançamento */
const IGN_COMUM=/\b(saldo|total|subtotal|limite|vencimento|resumo|periodo|pagina|historico|lancamentos futuros)\b/i;
const IGN_FATURA=/\b(pagamento(s)?( efetuado| recebido| da fatura)?|pgto|fatura anterior|minimo|rotativo previsto)\b/i;
const RE_ENTRADA=/\b(receb|credito|deposito|salario|estorno|rendimento|resgate|devolucao)/i;
const RE_PARC=/\b(?:parc(?:ela)?\.?\s*)?(\d{1,2})\s?(?:\/|de)\s?(\d{1,2})\b/i;

/* fatura do cartão e extrato do banco: uma linha por lançamento.
   Aceita data no começo (12/08, 12 AGO), um código curto ou dia da semana antes da data, duas colunas na
   mesma linha do PDF e extrato agrupado por dia (a data vem sozinha e vale para as linhas seguintes). */
const RE_OUTRA_COLUNA=/\s{3,}(?=\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]\d{2,4})?\s)/;
function dataNaLinha(linha,ano,mesRef){
  const dt=dataNoInicio(linha,ano,mesRef); if(dt) return dt;
  const lead=linha.match(/^(?:\S{1,6}|[A-Za-zÀ-ÿ\-]{3,14},?)\s+/);
  if(lead){ const d2=dataNoInicio(linha.slice(lead[0].length),ano,mesRef); if(d2) return {iso:d2.iso,len:lead[0].length+d2.len}; }
  return null; }

/* extrato em blocos (Banco do Brasil): cada lançamento tem o histórico numa linha ("Compra com Cartão"), a linha
   com dia, lote, documento e valor com (+) ou (-), e o detalhe na linha de baixo ("03/01 17:06 SUPERMERCADO").
   Quando o PDF põe o histórico ou o detalhe na mesma altura do valor, eles vêm na linha do valor.
   BB Rende Fácil é a aplicação automática do saldo: o dinheiro continua sendo da conta e fica de fora. */
const RE_LINHA_BLOCO=/^(\d{2})\/(\d{2})\/(\d{4})\s+(.*?)\s*((?:\d{1,3}(?:\.\d{3})+|\d+),\d{2})\s*\(\s*([+-])\s*\)$/;
const RE_CABECALHO_BLOCO=/^(extrato de conta|cliente\b|periodo\b|agencia\b|lancamentos$|dia lote|total aplicac|\*? ?saldos por dia|sujeitos a confirmac|pagina \d)/;
const RE_RENDE_FACIL=/\brende facil\b/;
const ehSaldoBloco=s=>/^(saldo\b|s a l d o\b)/.test(s);
function ehExtratoEmBlocos(texto){
  return String(texto||"").split(/\r?\n/).filter(l=>RE_LINHA_BLOCO.test(l.replace(/\s+/g," ").trim())).length>=3; }
function limparDetalhe(s){
  return String(s||"").replace(/^\d{2}\/\d{2}\s+\d{2}:\d{2}\s+/,"")
    .replace(/\b\d{2,3}\.\d{3}\.\d{3}(?:\/\d{4}-\d{2})?(?!\d)/g," ").replace(/\b\d{11,14}\b/g," ")
    .replace(/\s{2,}/g," ").replace(/^[\-–—:*\s]+|[\-–—:*\s]+$/g,""); }
function lerExtratoEmBlocos(texto){
  const itens=[]; let pend=[], ant=null, ignoradas=0, aplicacoes=0;
  /* linha de saldo, fim da página útil ou do texto: o que ficou pendente só pode ser o detalhe do anterior */
  const fechar=()=>{ if(ant&&ant.querDetalhe&&pend.length) ant.detalhe=pend[0]; if(ant) ant.querDetalhe=false; pend=[]; };
  for(const bruta of String(texto||"").split(/\r?\n/)){
    const linha=bruta.replace(/\s+/g," ").trim(), sem=semAcento(linha).toLowerCase();
    if(linha.length<2||RE_CABECALHO_BLOCO.test(sem)) continue;
    if(/lancamentos futuros/.test(sem)){ fechar(); break; }
    const m=linha.match(RE_LINHA_BLOCO);
    if(!m){ if(valores(linha).length) fechar(); else pend.push(linha); continue; }
    const meio=m[4].replace(/^(?:\d+(?:\s+|$)){0,2}/,"").trim();
    if(ehSaldoBloco(semAcento(meio).toLowerCase())){ fechar(); ignoradas++; continue; }
    const it={d:m[3]+"-"+m[2]+"-"+m[1], v:parseInt(m[5].replace(/[.,]/g,""),10), k:m[6]==="+"?"e":"g", inline:meio, hist:"", detalhe:""};
    /* as linhas soltas desde o lançamento anterior: o detalhe dele (se ainda falta) e o histórico deste */
    if(ant&&ant.querDetalhe&&(pend.length>=2||(pend.length===1&&it.inline&&!ant.inline))) ant.detalhe=pend.shift();
    if(ant) ant.querDetalhe=false;
    it.hist=pend.join(" "); pend=[];
    it.querDetalhe=!it.inline||!it.hist;
    itens.push(it); ant=it; }
  fechar();
  const linhas=[];
  itens.forEach(it=>{
    const hist=it.hist||it.inline, det=limparDetalhe(it.hist?[it.inline,it.detalhe].filter(Boolean).join(" "):it.detalhe);
    if(!it.v) return;
    /* aplicação automática do saldo (BB Rende Fácil): vira transferência para a conta da aplicação */
    const aplic=RE_RENDE_FACIL.test(semAcento(hist+" "+det).toLowerCase())?capitalizar(hist):"";
    if(aplic){ aplicacoes++; linhas.push({d:it.d, desc:aplic, v:it.v, k:it.k, i0:1, n:1, aplic}); return; }
    const h=capitalizar(hist), d=capitalizar(det);
    const desc=d?(/^compra com cartao$/i.test(semAcento(hist))?d:h+" · "+d):h;
    linhas.push({d:it.d, desc:desc||"Lançamento do extrato", v:it.v, k:it.k, i0:1, n:1}); });
  return {linhas, ignoradas, estornos:0, aplicacoes}; }

function lerLancamentos(texto,tipo,mes){
  if(tipo==="extrato"&&ehExtratoEmBlocos(texto)) return lerExtratoEmBlocos(texto);
  let ref=(mes||mesDeHoje()).split("-").map(Number);
  const fatura=tipo!=="extrato";
  const linhas=[], creditos=[]; let ignoradas=0, estornos=0, anulados=0, dataDoDia=null, saldoAnterior=0, pagoAnterior=0;
  let brutas=String(texto||"").split(/\r?\n/), fechada="", cartao="";
  if(fatura){
    /* a data de fechamento diz o ano das compras sem ano ("22/12" numa fatura fechada em 23/12/2025) */
    const f=semAcento(texto||"").match(/(?:fatura fechada em|data de fechamento|fechamento da fatura)\D{0,12}(\d{2})\/(\d{2})\/(\d{4})/i);
    if(f){ fechada=f[3]+"-"+f[2]+"-"+f[1]; ref=[+f[3],+f[2]]; }
    const c=String(texto||"").match(/fatura de\s+(.{3,40}?)\s+final\s+(\d{4})/i); if(c) cartao=c[1].trim()+" final "+c[2];
    /* só a tabela de lançamentos, quando ela tem cabeçalho: o resto da fatura é resumo, juros e avisos */
    const ini=brutas.findIndex(l=>/^\s*data\s+descri/i.test(semAcento(l)));
    if(ini>=0) brutas=brutas.slice(ini+1); }
  const ano=ref[0], mesRef=ref[1], partes=[];
  brutas.forEach(bruta=>bruta.replace(/[|•]/g," ").replace(/\s{2,}[A-Z]{2}(?=\s{2,}(?:R\$\s?)?-?\s?\d)/," ")      /* coluna País */
    .split(RE_OUTRA_COLUNA).forEach(p=>partes.push(p)));
  partes.forEach(bruta=>{
    const linha=bruta.replace(/\s+/g," ").trim(); if(linha.length<4) return;
    const sem=semAcento(linha);
    if(fatura&&/\d%/.test(linha)) return;                                      /* taxas de juros */
    /* a fatura começa com o saldo da fatura anterior e o pagamento que a quitou. Os dois não são compras: se somam
       zero, a anterior foi paga; o que sobrar é o que faltou pagar e o banco cobra de novo nesta fatura. */
    if(fatura){
      const vs=valores(linha), baixa=sem.toLowerCase();
      if(vs.length){
        const x=vs[vs.length-1], sinal=x.neg?-1:1;
        if(/\bsaldo\b.{0,24}\banterior\b/.test(baixa)){ saldoAnterior=sinal*x.v; ignoradas++; return; }
        if(!/minimo/.test(baixa)&&/\b(pagamento|pagto|pgto)\b|\bdebito (automatico|em conta)\b|\bdeb(ito)? autom/.test(baixa)){
          pagoAnterior+=x.v; ignoradas++; return; } } }
    let dt=dataNaLinha(linha,ano,mesRef);
    const vals=valores(linha).filter(x=>!dt||x.ini>=dt.len);
    if(dt&&!vals.length){
      const resto=linha.slice(dt.len).trim();
      if(resto.length<=24&&!/\d{3,}/.test(resto)) dataDoDia=dt.iso;        /* data sozinha: cabeçalho do dia */
      return; }
    if(!vals.length) return;
    if(!dt){ if(!dataDoDia||!/[a-z]{3,}/i.test(sem)) return; dt={iso:dataDoDia,len:0}; }
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
    if(!val.v) return;
    if(fatura){ if(val.neg||val.cred){ estornos++; creditos.push({v:val.v, i0, n}); return; } }
    else if(val.cred||(!val.neg&&RE_ENTRADA.test(sem))) k="e";
    linhas.push({d:dt.iso, desc:capitalizar(desc), v:val.v, k, i0, n}); });
  /* crédito que anula uma cobrança da mesma fatura (mesmo valor e mesma parcela, como o desconto da anuidade):
     os dois ficam de fora */
  creditos.forEach(c=>{ const j=linhas.findIndex(l=>l.v===c.v&&l.i0===c.i0&&l.n===c.n);
    if(j>=0){ linhas.splice(j,1); anulados++; } });
  return {linhas, ignoradas, estornos, anulados, fechada, cartao, saldoAnterior, pagoAnterior}; }

/* ---- saldo que o próprio banco imprime: serve para acertar a conta ---- */
function saldosDoExtrato(texto,mes){
  const ref=(mes||mesDeHoje()).split("-").map(Number), ano=ref[0], mesRef=ref[1];
  const out={anterior:null, final:null};
  String(texto||"").split(/\r?\n/).forEach(bruta=>{
    const linha=bruta.replace(/[|•]/g," ").replace(/\s+/g," ").replace(/\bS A L D O\b/i,"Saldo").trim(); if(linha.length<8) return;
    const sem=semAcento(linha).toLowerCase();
    if(sem.indexOf("saldo")<0) return;
    const vals=valores(linha); if(!vals.length) return;
    const val=vals[vals.length-1], v=val.neg?-val.v:val.v;
    let d="";
    const m=linha.match(/(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?(?!\d)/);
    if(m){ const dia=+m[1], mo=+m[2]; let y=m[3]?(m[3].length===2?2000+(+m[3]):+m[3]):0;
      if(dia>=1&&dia<=31&&mo>=1&&mo<=12){ if(!y){ y=ano; if(mo>mesRef+1) y=ano-1; } d=y+"-"+pad(mo)+"-"+pad(dia); } }
    if(/saldo (anterior|inicial)/.test(sem)){ if(!out.anterior) out.anterior={v,d}; return; }
    /* "28/02/2026 S A L D O 3.629,98 (-)" no fim do extrato do BB: é o saldo do último dia, e vale mais que o do dia a dia */
    if(/saldo (final|atual|do dia|disponivel|em conta)/.test(sem)||/^saldo\b/.test(sem)
      ||/^\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]\d{2,4})?\s+saldo\b/.test(sem)) out.final={v,d}; });
  /* as aplicações automáticas (BB Rende Fácil) entram como transferência para a conta da aplicação,
     então o saldo impresso pelo banco vale como está */
  if(RE_RENDE_FACIL.test(semAcento(texto||"").toLowerCase())) out.rendeFacil=true;
  return (out.anterior||out.final)?out:null; }

/* sem o tipo escolhido, tenta descobrir pelo conteúdo */
function adivinharTipo(texto,codigo){
  if(codigo) return "boleto";
  const s=semAcento(texto).toLowerCase();
  if(ehExtratoEmBlocos(texto)) return "extrato";
  /* a fatura traz a linha digitável para pagar e o extrato fala em "pagamento fatura de água": primeiro as marcas fortes */
  if(/pagamento minimo|melhor data de compra|lancamentos nesta fatura|total da fatura/.test(s)) return "fatura";
  if(/\d{5}[.\s]?\d{5}\s+\d{5}[.\s]?\d{6}\s+\d{5}[.\s]?\d{6}\s+\d\s+\d{14}/.test(s)||/8\d{10}[\s\-]?\d\s+\d{11}/.test(s)) return "boleto";
  if(/extrato|saldo anterior|saldo do dia|conta corrente/.test(s)) return "extrato";
  if(/fatura|limite (total|disponivel)/.test(s)) return "fatura";
  const datadas=s.split("\n").filter(l=>/^\s*\d{1,2}[\/.\-]\d{1,2}/.test(l)&&/\d,\d{2}/.test(l)).length;
  return datadas>=3?"fatura":"cupom"; }

/* ---- canhoto da maquininha e cupom fiscal ---- */
function lerCupom(texto){
  const L=String(texto||"").split(/\r?\n/).map(l=>l.replace(/\s+/g," ").trim()).filter(Boolean);
  const S=L.map(l=>semAcento(l).toLowerCase());
  let v=0;
  for(let i=S.length-1;i>=0&&!v;i--){
    if(/tribut|imposto|troco|desconto|acrescimo/.test(S[i])) continue;
    if(/valor total|total a pagar|valor a pagar|valor pago|valor do documento|valor cobrado|total pago|valor debitado|total r\$|^total\b|^valor\b|\bvalor:/.test(S[i])){
      const vs=valores(L[i]); if(vs.length) v=vs[vs.length-1].v; } }
  if(!v) L.forEach((l,i)=>{ if(/tribut|troco/.test(S[i])) return; valores(l).forEach(x=>{ if(x.v>v) v=x.v; }); });
  /* data: a do pagamento, quando o comprovante mostra; senão, a primeira que aparecer */
  const acharData=ls=>{ for(const l of ls){ const m=l.match(/\b(\d{2})[\/.\-](\d{2})[\/.\-](\d{2,4})\b/);
    if(m&&+m[1]>=1&&+m[1]<=31&&+m[2]>=1&&+m[2]<=12) return (m[3].length===2?"20"+m[3]:m[3])+"-"+m[2]+"-"+m[1]; } return ""; };
  let d=acharData(L.filter((l,i)=>/pag|debit|efetiv|realiz/.test(S[i])))||acharData(L);
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
    if(!codigo){ if(progCb) progCb(0,"preparando"); texto=ehPdf?await textoDoPdf(arquivo,op.senha):await ocr(await paraCanvas(arquivo)); }
    const tipo=op.tipo&&op.tipo!=="auto"?op.tipo:adivinharTipo(texto,codigo);
    const r=tipo==="boleto"?lerBoleto(codigo||texto):tipo==="cupom"?lerCupom(texto):lerLancamentos(texto,tipo,op.mes);
    r.tipo=tipo; r.texto=texto;
    if(tipo==="extrato") r.saldos=saldosDoExtrato(texto,op.mes);
    return r;
  } finally { progCb=null; } }

window.Leitor={ler, lerBoleto, lerCupom, lerLancamentos, saldosDoExtrato, adivinharTipo, linhasDoPdf, _dv:{mod10,mod11Banco,mod11Arrec,decodificar}};
})();
