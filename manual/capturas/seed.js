/* Dados INVENTADOS para as telas do manual. Nada aqui é real. */
window.semear = async function(){
  const hoje = todayISO();                 /* 2026-09-27 */
  const M = ["2026-04","2026-05","2026-06","2026-07","2026-08","2026-09"];

  /* ---------- configuração ---------- */
  Object.keys(S.months).forEach(k=>delete S.months[k]);
  const c = S.cfg;
  c.income = 740000; c.cap = 680000; c.balanceGoal = 200000;
  c.rendas = [{desde:"2000-01", v:690000},{desde:"2026-06", v:740000}];
  c.goalName = "Reserva de emergência"; c.goalTarget = 1500000;
  c.deposits = []; c.dividas = []; c.fixed = []; c.plano = null;
  c.salAuto = false; c.salPausa = false;
  c.accounts = [
    {id:"cc",   n:"Conta corrente", type:"corrente", opening:40000, openDate:"2026-03-31", adjust:[]},
    {id:"poup", n:"Poupança",       type:"poupanca", opening:300000, openDate:"2026-03-31", adjust:[]},
    {id:"cart", n:"Carteira",       type:"carteira", opening:12000,  openDate:"2026-03-31", adjust:[]}];
  c.cards = [
    {id:"visa",  n:"Visa",       type:"credito", closing:6,  due:15, limit:600000, acct:"cc", proxFecha:"2026-10-06", melhorDia:7},
    {id:"master",n:"Mastercard", type:"credito", closing:12, due:20, limit:400000, acct:"cc", proxFecha:"2026-10-12", melhorDia:13},
    {id:"elo",   n:"Elo",        type:"credito", closing:20, due:28, limit:300000, acct:"cc", proxFecha:"2026-10-20", melhorDia:21},
    {id:"deb",   n:"Débito",     type:"debito",  acct:"cc"},
    {id:"pix",   n:"Pix",        type:"pix",     acct:"cc"},
    {id:"transf",n:"Transferência", type:"transferencia", acct:"cc"},
    {id:"din",   n:"Dinheiro",   type:"dinheiro", acct:"cart"},
    {id:"boleto",n:"Boleto",     type:"boleto",  acct:"cc"}];
  const lim = {merc:90000, alim:35000, lazer:30000, comb:45000};
  c.cats.forEach(x=>{ x.limit = lim[x.id]||0; });
  c.kwCat = {"bom preco":"merc","napoli":"alim","avenida":"comb","sao joao":"medic","petisco":"pet"};
  c.fixed = [
    {id:"fx1", name:"Aluguel",  amount:145000, day:5,  cat:"casa",  card:"boleto"},
    {id:"fx2", name:"Escola",   amount:48000,  day:8,  cat:"educ",  card:"deb"},
    {id:"fx3", name:"Internet", amount:12000,  day:10, cat:"assin", card:"deb"},
    {id:"fx4", name:"Energia",  amount:21000,  day:15, cat:"casa",  card:"deb"},
    {id:"fx6", name:"Plano de saúde", amount:62000, day:10, cat:"saude", card:"deb"},
    {id:"fx7", name:"Celular",  amount:18000,  day:18, cat:"assin", card:"deb"}];
  c.fixed.push({id:"fx5", name:"Financiamento do carro", amount:89000, day:12, cat:"divida", card:"deb", divida:"dv2"});
  c.dividas = [
    {id:"dv1", nome:"Consignado do banco", parcela:32000, total:12, i:1.7, folha:true,
     tipo:"consignado", data:"2026-05-20", inicio:"2026-06", card:"deb"},
    {id:"dv2", nome:"Financiamento do carro", parcela:89000, total:36, i:1.3, folha:false,
     tipo:"financiamento", data:"2026-02-10", inicio:"2026-03", card:"deb", fixId:"fx5"}];
  c.extratosLidos = {}; c.faturasLidas = {};
  ["2026-04","2026-05","2026-06","2026-07","2026-08"].forEach(m=>{ c.extratosLidos["e|cc|"+m]="auto"; });
  ["visa","master","elo"].forEach(k=>["2026-05","2026-06","2026-07","2026-08"].forEach(m=>{ c.faturasLidas[k+"|"+m]="auto"; }));
  await saveCfg();

  /* ---------- lançamentos ---------- */
  const T = (d,v,desc,cat,card,extra)=>Object.assign({
    id:uid(), raw:"Extrato", v, desc, cat,
    method:{visa:"credito",master:"credito",elo:"credito",deb:"debito",pix:"pix",din:"dinheiro",boleto:"boleto",transf:"transferencia"}[card],
    cardId:card, acct:card==="din"?"cart":"cc", n:1, i:1, date:d, time:"12:00", k:"g"}, extra||{});
  const E = (d,v,desc,cat)=>({id:uid(),raw:"Extrato",v,desc,cat,method:"transferencia",cardId:"transf",
    acct:"cc",n:1,i:1,date:d,time:"08:10",k:"e"});
  const lista = [];

  const mercado = {"2026-04":[[6,41850],[14,32790],[22,28640]], "2026-05":[[5,38900],[13,35420],[24,31180]],
                   "2026-06":[[4,44100],[12,29870],[21,33260]], "2026-07":[[6,47320],[15,38510],[25,29940]],
                   "2026-08":[[5,39680],[14,42230],[23,27510]], "2026-09":[[3,43770],[12,36150],[23,24980]]};
  const soltos = {
    "2026-04":[[3,8990,"Padaria da esquina","alim","deb"],[9,21400,"Posto Avenida","comb","visa"],
               [11,3990,"Streaming de filmes","assin","master"],[17,15900,"Pizzaria Napoli","alim","elo"],
               [19,7650,"Farmácia São João","medic","deb"],[26,12800,"Cinema com as crianças","lazer","master"]],
    "2026-05":[[2,9450,"Padaria da esquina","alim","deb"],[8,23100,"Posto Avenida","comb","visa"],
               [11,3990,"Streaming de filmes","assin","master"],[16,18700,"Restaurante do Zé","alim","elo"],
               [18,4300,"Ração do Petisco","pet","deb"],[27,9900,"Parque aquático","lazer","visa"]],
    "2026-06":[[5,8100,"Padaria da esquina","alim","deb"],[10,19800,"Posto Avenida","comb","visa"],
               [11,3990,"Streaming de filmes","assin","master"],[14,22400,"Churrascaria","alim","elo"],
               [20,13500,"Camisa e tênis","roupa","visa"],[28,6400,"Sorveteria","lazer","din"]],
    "2026-07":[[4,10200,"Padaria da esquina","alim","deb"],[9,24600,"Posto Avenida","comb","visa"],
               [11,3990,"Streaming de filmes","assin","master"],[13,31200,"Pizzaria Napoli","alim","elo"],
               [19,8800,"Farmácia São João","medic","deb"],[24,19900,"Viagem de fim de semana","lazer","visa"]],
    "2026-08":[[3,9100,"Padaria da esquina","alim","deb"],[7,22700,"Posto Avenida","comb","visa"],
               [11,3990,"Streaming de filmes","assin","master"],[15,16400,"Restaurante do Zé","alim","elo"],
               [18,5200,"Ração do Petisco","pet","deb"],[22,11300,"Cinema com as crianças","lazer","master"],
               [26,14900,"Consulta do dentista","saude","pix"]],
    "2026-09":[[2,8700,"Padaria da esquina","alim","deb"],[8,21900,"Posto Avenida","comb","visa"],
               [11,3990,"Streaming de filmes","assin","master"],[14,17600,"Pizzaria Napoli","alim","elo"],
               [17,6900,"Farmácia São João","medic","deb"],[21,9800,"Presente de aniversário","presente","din"],
               [24,13200,"Cinema com as crianças","lazer","master"]]};

  /* os fixos de cada mês, já lançados (o de setembro só até hoje) */
  const FIX=[["fx1",145000,5,"Aluguel","casa","boleto"],["fx2",48000,8,"Escola","educ","deb"],
             ["fx3",12000,10,"Internet","assin","deb"],["fx4",21000,15,"Energia","casa","deb"],
             ["fx5",89000,12,"Financiamento do carro","divida","deb"],
             ["fx6",62000,10,"Plano de saúde","saude","deb"],["fx7",18000,18,"Celular","assin","deb"]];
  for(const ym of M) FIX.forEach(([id,v,dia,nome,cat,card])=>{
    const d=ym+"-"+String(dia).padStart(2,"0");
    if(d<=hoje) lista.push(T(d,v,nome,cat,card,{fix:id})); });

  for(const ym of M){
    lista.push(E(ym+"-05", ym>="2026-06"?740000:690000, "Salário", "sal"));
    if(ym==="2026-07") lista.push(E(ym+"-20", 96000, "Reembolso do plano de saúde", "reemb"));
    if(ym==="2026-05") lista.push(T(ym+"-18", 145000, "Revisão e pneus do carro", "carro", "visa"));
    if(ym==="2026-07") lista.push(T(ym+"-22", 240000, "Viagem de férias", "lazer", "visa"));
    if(ym==="2026-09") lista.push(E(ym+"-10", 42000, "Venda da bicicleta antiga", "venda"));
    mercado[ym].forEach(([d,v])=>lista.push(T(ym+"-"+String(d).padStart(2,"0"), v, "Mercado Bom Preço", "merc", d%2?"deb":"visa")));
    soltos[ym].forEach(([d,v,desc,cat,card])=>lista.push(T(ym+"-"+String(d).padStart(2,"0"), v, desc, cat, card)));
  }
  /* saque e dinheiro na carteira */
  lista.push({id:uid(),raw:"",v:30000,desc:"Saque no caixa eletrônico",cat:"outros",method:"transferencia",
    cardId:"transf",acct:"cc",acct2:"cart",n:1,date:"2026-09-05",time:"10:00",k:"t"});

  for(const t of lista) await commit(t);

  /* parceladas: o app agenda sozinho as parcelas seguintes */
  await commit(T("2026-08-09",126000,"Notebook da escola","educ","visa",{n:3,i:1,total:126000}));
  await commit(T("2026-07-12",189000,"Sofá da sala","compras","master",{n:10,i:1,total:189000}));
  await commit(T("2026-09-06",110000,"Pneus novos","carro","visa",{n:4,i:1,total:110000}));

  /* faturas pagas: cada fatura que já venceu é paga no valor exato, no dia do vencimento (v92: a fatura tem o nome
     do mês em que vence, e o quadro do cartão avisa a que venceu sem pagamento — com valores inventados à parte,
     o manual mostrava avisos falsos) */
  for(const c of S.cfg.cards.filter(x=>x.type==="credito"))
    for(const ym of ["2026-03","2026-04","2026-05","2026-06","2026-07","2026-08","2026-09"]){
      const venc=vencimentoDe(c,ym), inv=cardInvoice(c.id,ym);
      if(!venc||venc>hoje||inv.total<=0) continue;
      await commit({id:uid(),raw:"",v:inv.total,desc:"Fatura "+c.n+" · "+ymLabel(mesDeVencimento(c,ym)),
        cat:"outros",method:"debito",cardId:c.id,acct:"cc",n:1,date:venc,time:"09:00",k:"p",ref:ym}); }

  /* o que já foi guardado, com a transferência de verdade */
  const guardar = async (d,v,nota)=>{ const tid=uid();
    await commit({id:tid,raw:"",v,desc:nota,cat:"outros",method:"transferencia",cardId:"transf",
      acct:"cc",acct2:"poup",n:1,date:d,time:"18:00",k:"t"});
    S.cfg.deposits.push({id:uid(),d,v,note:nota,de:"cc",para:"poup",tx:tid,ym:ymOf(d)}); };
  await guardar("2026-06-28",30000,"Sobra de junho");
  await guardar("2026-07-29",45000,"Sobra de julho");
  await guardar("2026-08-28",38000,"Sobra de agosto");
  await guardar("2026-09-08",52000,"Décimo adiantado");

  /* o plano de juntar */
  S.cfg.plano = {v:1200000, ate:"2027-06-30", usaGuardado:true, criado:"2026-06-01"};
  await saveCfg();
  render();
  return {meses:Object.keys(S.months).sort(), lancamentos:allTx().length,
    saldo:fmtN(totalBalance(todayISO())), guardado:fmt(savedTotal())};
};
