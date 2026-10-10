/* Receitas das telas do manual (v92). Como usar: ver CLAUDE.md, "Telas do manual". Rodar depois de seed.js/semear() e capturar.js, com a janela em 1054x900
   (telas de computador) ou 375x812 (lote "celular"). Tudo com dados inventados. */
window.capSem=async(el,sel,nome)=>{ const es=[...el.querySelectorAll(sel)]; es.forEach(x=>{ x.dataset.dp2=x.style.display; x.style.display="none"; }); const r=await cap(el,nome); es.forEach(x=>{ x.style.display=x.dataset.dp2||""; }); return r; };
window.capCurto=async(el,sel,max,nome)=>{ const es=[...el.querySelectorAll(sel)].slice(max); es.forEach(x=>{ x.dataset.dp3=x.style.display; x.style.display="none"; }); const r=await cap(el,nome); es.forEach(x=>{ x.style.display=x.dataset.dp3||""; }); return r; };
window.lotes={
 painel: async(t)=>{ S.ym="2026-09"; await irPara("painel");
  await t(()=>cap([...document.querySelectorAll('#p-painel .sec')][0],'painel-banco'));
  await t(()=>cap([...document.querySelectorAll('#p-painel .sec')][2],'painel-teto'));
  await t(()=>cap(sec('painel',/Próximos vencimentos/),'painel-vencimentos'));
  await t(()=>cap(cardCom('painel',/Onde meu dinheiro está indo/),'painel-categorias'));
  await t(()=>cap(cardCom('painel',/Últimos 6 meses/),'painel-6meses'));
  await t(()=>cap(cardCom('painel',/Ritmo do mês/),'painel-ritmo'));
  await t(()=>cap(cardCom('painel',/Quanto do futuro já está comprometido/),'painel-comprometido')); },
 lancar: async(t)=>{ await irPara("lancar"); const s=sec('lancar',/Lançar por fala/);
  await t(()=>capSem(s,':scope > .card, #parseStatus','lancar-fala'));
  const cards=[...s.querySelectorAll(':scope > .card')];
  await t(()=>cap(cards[0],'lancar-extrato')); await t(()=>cap(cards[1],'lancar-fatura')); await t(()=>cap(cards[2],'lancar-dividas'));
  await t(()=>cap(document.querySelector('#p-lancar .sec'),'melhor-cartao'));
  $("#say").value="Cento e vinte e sete reais e noventa, mercado Bom Preço, cartão de débito. Trinta e nove e noventa, streaming de filmes, Mastercard. Quatrocentos e vinte reais, óculos novo, Visa em três vezes.";
  readInput(); await espera(700);
  await t(()=>cap(document.getElementById('parseStatus'),'conferencia-status'));
  await t(()=>cap(document.getElementById('draftSec'),'conferencia'));
  S.drafts=[]; render(); await espera(400); },
 contas: async(t)=>{ await irPara("mes");
  await t(()=>capCurto(sec('mes',/Contas a pagar/),'.linkrow, .row',8,'mes-contas-pagar'));
  await irPara("contas");
  await t(()=>cap(sec('contas',/Onde o dinheiro está/),'contas-onde'));
  await t(()=>cap(sec('contas',/Cartões de crédito/),'contas-cartoes'));
  S.ext="cc"; renderContas(); await espera(500);
  await t(()=>capCurto(document.getElementById('extSec'),'.row',9,'contas-extrato'));
  S.ext="card:visa"; renderContas(); await espera(500);
  await t(()=>cap(document.getElementById('extSec'),'contas-fatura'));
  S.ext="cc"; renderContas(); await espera(300); },
 ajustes: async(t)=>{ await irPara("ajustes");
  await t(()=>cap(sec('ajustes',/Saldo de cada conta/),'ajustes-saldos'));
  S.cfg.extratosLidos={}; ["2026-04","2026-05","2026-06","2026-07","2026-08"].forEach(m=>{ S.cfg.extratosLidos["cc|"+m]="auto"; }); await saveCfg(); await irPara("ajustes");
  await t(()=>cap(sec('ajustes',/O que já foi importado/),'importacoes'));
  await t(()=>capCurto(sec('ajustes',/Categorias de gasto/),'.linkrow',7,'cat-lista'));
  openSaldoInicial("cc"); await espera(400); await t(()=>cap(document.getElementById('sheet'),'ficha-saldo-inicial')); closeSheet(); await espera(200);
  openCorrigirSaldo("cc"); await espera(400); await t(()=>cap(document.getElementById('sheet'),'ficha-corrigir-saldo')); closeSheet(); await espera(200);
  openCorrigirFatura("visa"); await espera(400); await t(()=>cap(document.getElementById('sheet'),'ficha-corrigir-fatura')); closeSheet(); await espera(200);
  openCat("merc"); await espera(300); document.getElementById("kKill").click(); await espera(350);
  await t(()=>cap(document.getElementById('sheet'),'cat-excluir')); closeSheet(); },
 meta: async(t)=>{ await irPara("futuro");
  await t(()=>cap(document.querySelector('#p-futuro .card.pad.chart'),'futuro'));
  await irPara("meta"); const secsMeta=[...document.querySelectorAll('#p-meta .sec')];
  await t(()=>cap(document.getElementById('m5030'),'meta-5030'));
  const partes=[...secsMeta[1].children];
  await t(()=>cap(partes[1],'meta-plano'));
  await t(()=>capCurto(partes[3],':scope > div[style*="border-bottom"]',6,'meta-plano-meses'));
  await t(()=>capSem(partes[5],'details','meta-plano-cortes'));
  await t(()=>cap(secsMeta[secsMeta.length-1],'meta-guardados'));
  openDeposit(); await espera(400); $("#pV").value="520,00"; $("#pN").value="Sobra de setembro";
  await t(()=>cap(document.getElementById('sheet'),'meta-guardei')); closeSheet(); },
 analises: async(t)=>{ await irPara("analises");
  await t(()=>capCurto(sec('analises',/Diagnóstico/),'.ins > *',6,'analises-diagnostico'));
  await t(()=>cap(sec('analises',/Dívidas/),'analises-dividas'));
  openDivida("dv2"); await espera(450); await t(()=>cap(document.getElementById('sheet'),'ficha-divida')); closeSheet(); await espera(200);
  openQuitacao((S.cfg.dividas||[]).find(x=>x.id==="dv2")); await espera(450);
  await t(()=>capCurto(document.getElementById('sheet'),'.set-f:last-child > div > div',6,'ficha-quitar')); closeSheet(); },
 consulta: async(t)=>{ await irPara("consulta");
  S.ym="2026-09"; S.consulta={periodo:"mes",de:"2026-09-01",ate:todayISO(),cats:[],formas:[],tipo:"g"}; renderConsulta(); await espera(450);
  const secsC=[...document.querySelectorAll('#p-consulta .sec')];
  await t(()=>cap(secsC[0].querySelector('.card'),'consulta-filtros'));
  await t(()=>cap(secsC[1].querySelector('.grid'),'consulta-resumo'));
  await t(()=>capCurto(secsC[2],'.row',9,'consulta-lista'));
  S.ym="2026-02"; S.consulta.periodo="semana"; renderConsulta(); await espera(350);
  await t(()=>cap(document.querySelector('#p-consulta .sec .card'),'consulta-mes-barra'));
  S.ym="2026-09"; S.consulta={periodo:"livre",de:"2026-08-10",ate:"2026-09-15",cats:[],formas:[],tipo:"g"}; renderConsulta(); await espera(350);
  await t(()=>cap(document.querySelector('#p-consulta .sec .card'),'consulta-datas'));
  document.getElementById('cqDe').click(); await espera(400);
  await t(()=>cap(document.getElementById('sheet'),'consulta-calendario')); closeSheet(); await espera(250);
  S.consulta={periodo:"mes",de:"2026-09-01",ate:todayISO(),cats:["merc","alim"],formas:[],tipo:"g"}; renderConsulta(); await espera(350);
  openMoverLinhas(consultaAchados().linhas,"g"); await espera(400);
  await t(()=>cap(document.getElementById('sheet'),'consulta-mudar')); closeSheet();
  S.consulta={periodo:"mes",de:"2026-09-01",ate:todayISO(),cats:[],formas:[],tipo:"g"}; },
 ajuda: async(t)=>{ await irPara("ajuda"); const secsAj=[...document.querySelectorAll('#p-ajuda .sec')];
  await t(()=>cap(secsAj[0],'ajuda'));
  const b=document.querySelector('#p-ajuda input'); b.value="fatura"; b.dispatchEvent(new Event('input')); await espera(400);
  /* só as 6 primeiras respostas — e sem os títulos de grupo que sobram depois delas */
  const filhos=[...document.getElementById('ajLista').children]; let n=0, corte=-1;
  filhos.forEach((f,i)=>{ if(f.classList.contains('linkrow')&&++n===6) corte=i; });
  const fora=filhos.slice(corte+1); fora.forEach(x=>{ x.dataset.dp4=x.style.display; x.style.display='none'; });
  await t(()=>cap([...document.querySelectorAll('#p-ajuda .sec')].pop(),'ajuda-busca'));
  fora.forEach(x=>{ x.style.display=x.dataset.dp4||''; }); b.value=""; b.dispatchEvent(new Event('input'));
  S.user.name="Maria"; S.user.full="Maria Aparecida de Souza Lima"; renderNav(); await irPara("painel");
  await t(()=>cap(document.querySelector('nav.side'),'menu-lateral'));
  showGate(); await espera(600); await t(()=>cap(document.querySelector('.gate-in'),'entrada')); hideGate(); await espera(300); },
 novas: async(t)=>{ S.ym="2026-09"; await irPara("contas");
  openPay('elo'); await espera(500); await t(()=>cap(document.getElementById('sheet'),'pagar-fatura'));
  document.querySelector('#sheet .dt-btn').click(); await espera(400);
  await t(()=>cap(document.querySelector('#calOv .cal-box'),'calendario')); fecharCalendario(); closeSheet(); await espera(200);
  const venc=Date.UTC(2026,9,20), fator=Math.round((venc-Date.UTC(2025,1,22))/864e5)+1000;
  const semDV="3419"+String(fator)+"0000035000"+"1234567890123456789012345", cod=semDV.slice(0,4)+Leitor._dv.mod11Banco(semDV)+semDV.slice(4);
  await irPara("lancar"); leitorBoleto.pago=""; boletoLido(Leitor.lerBoleto(cod)); await espera(900);
  await t(()=>cap(document.getElementById('sheet'),'boleto-lido')); closeSheet();
  const v=parseOne("conta de telefone 90 reais no débito",S.cfg); v.date="2026-09-10"; v.time="19:20"; await commit(v);
  mostrarLidos({tipo:"extrato",linhas:[{d:"2026-09-10",desc:"Pagto Telefone Operadora",v:8990,k:"g"},{d:"2026-09-11",desc:"Padaria Pao Quente",v:1250,k:"g"}],saldos:null},
    {mes:"2026-09",conta:"cc",box:document.querySelector('[data-leitor="extrato"]')}); await espera(600);
  await t(()=>cap(document.getElementById('draftSec'),'conferencia-voz')); S.drafts=[]; render(); await espera(300);
  const tv=allTx().find(x=>x.desc==="Conta de telefone"); if(tv) await removeTx(tv.ym,tv.id,false);
  mostrarConferencia([{ok:true,cid:'visa',ym:'2026-08',tot:cardInvoice('visa','2026-08').total,tb:cardInvoice('visa','2026-08').total}],null); await espera(700);
  await t(()=>cap(document.getElementById('sheet'),'conferencia-banco')); closeSheet();
  await irPara("ajustes"); openRevisao(); await espera(600); await t(()=>cap(document.getElementById('sheet'),'revisao')); closeSheet(); },
 celular: async(t)=>{ await irPara("painel"); await t(()=>cap(document.querySelector('nav.tabs'),'celular-abas'));
  await irPara("lancar"); await t(()=>capSem(sec('lancar',/Lançar por fala/),':scope > .card, #parseStatus','celular-lancar'));
  await irPara("contas"); S.ext="cc"; renderContas(); await espera(450);
  await t(()=>capCurto(document.getElementById('extSec'),'.row',6,'celular-extrato'));
  /* segurar para falar: a faixa "Ouvindo" e o botão vermelho, recortados do pé da tela */
  await irPara("lancar"); const box=document.querySelector('#p-lancar .say-box'); window.scrollTo(0,0); await espera(200);
  const H=430; window.scrollBy(0, box.getBoundingClientRect().top-(innerHeight-H+12)); await espera(300);
  const btn=document.getElementById('pttBtn'), ov=document.getElementById('pttOv');
  btn.classList.add('ouvindo'); ov.hidden=false; document.getElementById('pttTxt').textContent='quarenta e cinco reais farmácia no débito ontem'; await espera(300);
  await t(async()=>{ await carregaH2C(); const c=await html2canvas(document.body,{scale:2,x:0,y:window.scrollY+innerHeight-H,width:innerWidth,height:H,
    windowWidth:innerWidth,windowHeight:innerHeight,backgroundColor:getComputedStyle(document.body).backgroundColor,useCORS:true,onclone:semCorNova});
    const bl=await new Promise(r=>c.toBlob(r,'image/png')); await fetch('http://127.0.0.1:8767/save/fala-segurar.png',{method:'POST',body:bl}); return 'fala-segurar'; });
  btn.classList.remove('ouvindo'); ov.hidden=true;
  /* câmera do código de barras: um papel inventado, com barras que não são código nenhum (para não ler e fechar) */
  const cv=document.createElement("canvas"); cv.width=1080; cv.height=1920; const g=cv.getContext("2d");
  let sem=7; const rnd=()=>{ sem=(sem*9301+49297)%233280; return sem/233280; };
  const barras=[]; let x=0; while(x<820){ const w=rnd()<0.6?3:8; barras.push([x,w,rnd()<0.5]); x+=w; }
  const desenha=()=>{ g.fillStyle="#8d8a84"; g.fillRect(0,0,1080,1920); g.save(); g.translate(540,960); g.rotate(-0.012); g.translate(-500,-330);
    g.fillStyle="#fbfaf7"; g.fillRect(0,0,1000,660); g.fillStyle="#777"; g.font="26px sans-serif"; g.fillText("Pagável em qualquer banco até o vencimento",50,80);
    g.fillStyle="#333"; g.font="30px monospace"; g.fillText("34191.09008 61234.567890 12345",50,170); g.fillText("678901 2 99990000035000",50,215);
    barras.forEach(([bx,w,b])=>{ if(b){ g.fillStyle="#151515"; g.fillRect(90+bx,250,w,200); } });
    g.fillStyle="#999"; g.font="24px sans-serif"; g.fillText("Autenticação mecânica",50,540); g.restore(); };
  const timer=setInterval(desenha,100); desenha();
  const gum=navigator.mediaDevices.getUserMedia; navigator.mediaDevices.getUserMedia=async()=>cv.captureStream(15);
  const det=detectorDeBoleto; detectorDeBoleto=async()=>null;
  abrirLeitorBoleto(""); await espera(4000);
  document.querySelector('#bolOv .bol-mira').style.boxShadow='none';   /* html2canvas pinta a sombra gigante de preto */
  const ovB=document.getElementById('bolOv'); ovB.style.height=innerHeight+'px';
  await t(()=>cap(ovB,'boleto-camera'));
  fecharLeitorBoleto(); clearInterval(timer); navigator.mediaDevices.getUserMedia=gum; detectorDeBoleto=det; }
};
window.rodar=async(nome)=>{ const r=[]; const t=async f=>{ try{ r.push(await f()); }catch(e){ r.push('ERRO '+String(e).slice(0,100)); } }; await lotes[nome](t); return r; };
