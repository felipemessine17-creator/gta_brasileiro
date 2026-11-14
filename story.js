'use strict';
/* story.js — prólogo: motor de missões + 10 missões. Carregado por último. */
(()=>{
const SY=window.SY,SV=SY.SV,PR=SY.PR,mkA=SY.mkA,rmA=SY.rmA,drvTo=SY.drvTo,hudEl=$('hud');
const el=(id,css,par)=>{const e=document.createElement('div');e.id=id;e.style.cssText=css;(par||hudEl).appendChild(e);return e};
const subEl=el('sub','left:50%;bottom:150px;transform:translateX(-50%);width:min(760px,90vw);text-align:center;font-size:19px;line-height:1.35;background:#000a;padding:8px 16px;border-radius:8px;display:none'),
 sobj=el('sobj','left:50%;top:100px;transform:translateX(-50%);font-size:18px;color:#7fd0ff;text-align:center;max-width:620px'),
 fade=el('fade','inset:0;background:#000;opacity:0;transition:opacity .5s'),bt=el('bt','left:0;right:0;top:0;height:0;background:#000;transition:height .8s'),
 bb=el('bb','left:0;right:0;bottom:0;height:0;background:#000;transition:height .8s'),big=el('big','left:0;right:0;top:36%;text-align:center;font-size:46px;font-weight:900;letter-spacing:4px;opacity:0;transition:opacity .8s;text-shadow:0 2px 8px #000'),
 chEl=document.createElement('div');chEl.id='choice';document.body.appendChild(chEl);
const CL={Henry:'#ffd23f',Theo:'#7fd0ff',Felipe:'#e8d9a8',Enzo:'#ff9a6e',Júlio:'#9be28a',Narrador:'#fff','Dona Neusa':'#ff9ec7','Dona Cleide':'#ff9ec7','Dona Dalva':'#ff9ec7',Marcão:'#ff8a65',Osvaldo:'#ff5252',Vanderlei:'#b9a2ff',Rato:'#ff5252',Contratante:'#ff3030',Dito:'#ffb74d',Primo:'#a5d6a7'};
const bcn=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,80,16,1,true),new THREE.MeshBasicMaterial({color:0x4aa3ff,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false,fog:false}));bcn.visible=false;scene.add(bcn);
const smk={x:0,z:0,l:'M',c:'#4aa3ff'};
let cur=null,subT=0,cdn=2.5,chOn=null,bigT=0,skipOn=false,rp=null;
const skh=el('skh','right:24px;top:92px;font-size:14px;opacity:.8;display:none');skh.textContent='🖱 Botão esq.: pular cena';
const dist=p=>Math.hypot(p.x-pl.pos.x,p.z-pl.pos.z),dd=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const sub=(w,t)=>{subEl.innerHTML=(w?'<b style="color:'+(CL[w]||'#fff')+'">'+w+':</b> ':'')+t;subEl.style.display='block';subT=Math.max(2.8,t.length*.058)};
const bars=on=>{bt.style.height=bb.style.height=on?'9vh':'0'},bigMsg=(t,c)=>{big.textContent=t;big.style.color=c||'#fff';big.style.opacity=1;bigT=3.5};
function mark(p){bcn.position.set(p.x,40,p.z);bcn.visible=true;SY.obj=p;smk.x=p.x;smk.z=p.z;if(!SY.markers.includes(smk))SY.markers.push(smk)}
/* ---- blocos de etapas ---- */
const S_=(w,t)=>({dlg:1,init:()=>{if(!skipOn)sub(w,t)},tick:()=>skipOn||subT<=0}),D=(...a)=>a.map(([w,t])=>S_(w,t)),X=f=>({x:1,tick:()=>{f();return 1}});
const G=(p,txt,r)=>({txt,init:()=>mark(p),tick:()=>dist(p)<(r||8)}),W=(txt,f)=>({txt,tick:f});
const GE=(p,txt,r)=>({txt:txt+' (E)',init:()=>{mark(p);cur.e=0},tick:()=>{if(dist(p)<(r||3.5))return cur.e;cur.e=0;return 0}});
const CH=(q,o,k)=>({init:()=>{chEl.innerHTML='';chOn={k,o};subEl.style.display='block';subEl.innerHTML=q;subT=999;o.forEach((x,i)=>{const ok=!x[1]||x[1](),b=document.createElement('button');b.textContent=(i+7)+'. '+x[0]+(ok?'':'  (indisponível)');b.disabled=!ok;b.style.opacity=ok?1:.45;b.onclick=()=>pick(i);chEl.appendChild(b)});chEl.style.display='flex'},tick:()=>cur.cho[k]!=null});
const BR=(k,arr)=>X(()=>cur.steps.splice(cur.i+1,0,...(arr[cur.cho[k]]||arr[0])));
function pick(i){if(!chOn)return;const x=chOn.o[i];if(x[1]&&!x[1]())return;cur.cho[chOn.k]=i;chEl.style.display='none';chOn=null;subT=0}
const SW=id=>X(()=>PR.sw(id,true)),CIN=(p,d,h,t)=>X(()=>{bars(1);SY.cine(p.x,p.z,d,h,t)}),OFF=X(()=>bars(0));
const car=(k,t,x,z,yaw,o)=>{const c=mkCar(t,x,z,yaw,Object.assign({keep:1,mission:1},o));cur.ents.push(c);cur.c[k]=c;return c};
const act=(k,x,z,o)=>{const a=mkA(x,z,Object.assign({unarmed:1,role:'npc'},o));cur.ents.push(a);cur.a[k]=a;return a};
const foe=(k,x,z,o)=>{const a=mkA(x,z,Object.assign({range:34},o));cur.ents.push(a);cur.a[k]=a;return a};
const follow=(c,who,stop,max)=>{c.drv=drvTo(()=>who().pos,1,{stop,max})};
const route=(c,pts,max)=>{let k=0;c.drv=drvTo(()=>{if(dd(c.pos,pts[k])<14&&k<pts.length-1)k++;return pts[k]},1,{max})};
const allDead=ks=>ks.every(k=>!cur.a[k].alive),own=id=>pl.car&&pl.car.owner==id;
const GC=(id,txt,fn)=>W(txt,()=>{const c=PR.stt[id].mycar;if(c&&!own(id))mark(c.pos);if(own(id)){fn(pl.car);return 1}return 0});
/* ---- locais ---- */
const HB={x:-326,z:-350},PETP={x:-324,z:-371},PAD={x:-324,z:-333},NEU={x:-345,z:-322},OFI=window.THEO_SHOP?THEO_SHOP.front:{x:160,z:-146},TERR={x:224,z:11},LOB={x:-160,z:-10},GAL={x:96,z:408},PAT={x:-320,z:-320},CLE={x:128,z:372},MAR={x:0,z:-128},DIT={x:192,z:-64},TOW={x:-128,z:-64},FER={x:320,z:-128},L1=window.THEO_SHOP?THEO_SHOP.L1:{x:154,z:-163},L2=window.THEO_SHOP?THEO_SHOP.L2:{x:168,z:-167},L3=window.THEO_SHOP?THEO_SHOP.L3:{x:151,z:-168},GALM={x:78,z:402};
const loc=(k,n,x,z,l,o)=>act(k,x,z,Object.assign({name:n,lines:l},o));
const FEL={name:'Felipe',chubby:1,sh:0xffffff,pa:0x1a1a22,skin:0xf1c9a5},THE={name:'Theo',glasses:1,sh:0x2a5d9f,pa:0x2a5d9f,skin:0xc68642},HEN={name:'Henry',sh:0xf2f2f2,pa:0x2b4a7a,skin:0x6b4226};
const GN=(p,txt,r,f,sd)=>({txt,init:()=>mark(p),tick:()=>{const k='sp'+cur.i;if(!cur[k]&&dist(p)<(sd||110)){cur[k]=1;f()}return !!cur[k]&&dist(p)<(r||8)}});
const LOOK={henry:HEN,theo:THE,messine:FEL};
function trio(){if(!cur)return;for(const k of['t1','t2'])if(cur.a[k]){rmA(cur.a[k]);delete cur.a[k]}let n=0;for(const id of['henry','theo','messine'])if(id!=PR.cur){const p=PR.stt[id].pos;act('t'+(++n),p.x,p.z,Object.assign({},LOOK[id]))}}
const SWT=id=>X(()=>{PR.sw(id,true);setTimeout(trio,700)});

/* ===== KIT DE MISSÃO v2 =====
   Colar em story.js, logo ANTES de "const MS=[" (usa os helpers do próprio story.js:
   mark, sub, dist, dd, W, X, G, GE, D, CH, BR, act, foe, car, route, allDead, fail). */

/* RESPIRO: jogador livre, sem combate. Cena viva (NPCs com E), dá tempo de absorver o cenário.
   Só avança depois de `secs` segundos E de estar perto do ponto p. */
const BREATH=(p,txt,secs)=>({txt,init:()=>{mark(p);cur.bt=0},tick:dt=>{cur.bt+=dt;return cur.bt>=secs&&dist(p)<10}});

/* INVESTIGAR: pontos {x,z,t} com pistas no cenário. E perto de cada um revela o texto t.
   Precisa de `need` pistas. Guarda em cur.cl (use depois para liberar opções de diálogo). */
const CLUES=(pts,txt,need)=>({txt,init:()=>{cur.cl=new Set();cur.e=0},tick:()=>{
 const left=pts.map((c,i)=>[c,i]).filter(([c,i])=>!cur.cl.has(i));
 if(left.length){const n=left.sort((a,b)=>dist(a[0])-dist(b[0]))[0];mark(n[0]);
  if(cur.e&&dist(n[0])<3.5){cur.e=0;cur.cl.add(n[1]);sub('',n[0].t)}else cur.e=0}
 sobj.textContent=txt+' ('+cur.cl.size+'/'+need+') — E nas pistas';
 return cur.cl.size>=need}});

/* SEGUIR SEM SER NOTADO: carro cur.c[k] (use route() nele). Fica entre lo e hi metros por `secs` s.
   Perto demais ou longe demais acumula "suspeita"; passou de 6 s = falha. */
const TAIL=(k,txt,lo,hi,secs)=>({txt,init:()=>{cur.tl=0;cur.tw=0},tick:dt=>{
 const c=cur.c[k];if(!c||c.dead){fail('Você perdeu o alvo');return 0}
 const d=dist(c.pos);cur.tl+=dt;mark(c.pos);
 if(d<lo){cur.tw+=dt;msg('Perto demais! Ele vai te notar')}
 else if(d>hi){cur.tw+=dt;msg('Você está perdendo o alvo')}
 else cur.tw=Math.max(0,cur.tw-dt);
 if(cur.tw>6){fail('O alvo percebeu você');return 0}
 return cur.tl>=secs}});

/* ===== MODELO DE MISSÃO (ritmo: Gancho > Respiro > Investigar > Tensão > Escolha > Clímax > Desfecho) =====
   Para ativar: copie dentro de MS=[ ... ] (ela roda na ordem da história). Troque as coordenadas. */
const MODELO={id:'m11',n:'Ninguém Some Sem Motivo',who:'henry',at:OFI,pay:900,xp:350,rep:3,
 d:'Um morador sumiu. Investigue o bairro, siga o suspeito e escolha como encarar o esconderijo.',
 obj:'Principal: achar 2 pistas, seguir o carro e resolver o esconderijo do jeito que preferir. Secundário: terminar sem disparar.',
 sec:[['Sem nenhum tiro',c=>!c.shot]],
 fails:[],
 steps:[
  /* 1 GANHO (curto, sem combate) */
  ...D(['Henry','Dona Cida disse que o Pixote não aparece há dois dias. Pixote nunca perde fofoca.']),
  /* 2 RESPIRO: andar pelo bairro, falar com moradores (E) */
  X(()=>{act('mor',OFI.x+10,OFI.z+6,{name:'Morador',lines:['Vi ele saindo de madrugada. Tava com pressa e sem sandália.','Aquele carro verde parou aqui duas noites seguidas.']})}),
  BREATH({x:OFI.x+10,z:OFI.z+6},'Converse com os vizinhos e sinta o clima do bairro (E)',25),
  /* 3 INVESTIGAR: cenário conta a história */
  CLUES([{x:OFI.x-12,z:OFI.z+14,t:'Um tênis largado e arrastado no chão. Ele foi levado, não saiu por vontade.'},
         {x:OFI.x+22,z:OFI.z-9,t:'Uma nota fiscal amassada com o endereço de um galpão.'},
         {x:OFI.x+5,z:OFI.z+30,t:'Marca de pneu fresca. O carro saiu daqui às pressas.'}],'Procure pistas no bairro',2),
  /* 4 TENSÃO SEM TIRO: perseguição discreta */
  X(()=>{const c=car('alvo','sedan',OFI.x+30,OFI.z,0,{col:0x2e8b57});route(c,[{x:OFI.x+100,z:OFI.z},{x:OFI.x+100,z:OFI.z-90},{x:OFI.x+20,z:OFI.z-90}])}),
  TAIL('alvo','Siga o carro verde sem ser notado',14,55,30),
  /* 5 ESCOLHA: a abordagem muda o clímax. Opção "furtiva" só existe se você investigou */
  CH('Galpão à vista. Como você entra?',[
    ['Pela frente, no tiro'],
    ['Pelos fundos (exige 2 pistas)',()=>cur.cl&&cur.cl.size>=2],
    ['Falar com o vigia']],'ent'),
  BR('ent',[
    /* 0: combate, mas com tática */
    [X(()=>{foe('g1',OFI.x+20,OFI.z-100,{role:'e',hp:60,dmg:5,spd:3.5,hold:9});foe('g2',OFI.x+26,OFI.z-100,{role:'e',hp:60,dmg:5,spd:3.5,hold:9});cur.shot=1}),
     W('Elimine os capangas',()=>allDead(['g1','g2']))],
    /* 1: furtivo, interage com o cenário */
    [GE({x:OFI.x+14,z:OFI.z-110},'Abra a porta dos fundos')],
    /* 2: social */
    [...D(['Henry','Fala, chefe. Vim buscar o Pixote antes que a conta dele aumente.'],['Vigia','…Leva ele e some daqui.'])]]),
  /* 6 DESFECHO = novo respiro */
  X(()=>{act('pix2',OFI.x+14,OFI.z-112,{name:'Pixote',lines:['Teu irmão tava certo: eu falo demais.']})}),
  ...D(['Pixote','Henry, eu só queria uma ajudinha com a dívida. Juro!'],['Henry','Da próxima, pede por mensagem, não por sequestro.']),
  BREATH({x:OFI.x,z:OFI.z},'Leve o Pixote de volta ao bairro',10)]};

/* ================= AS 10 MISSÕES ================= */
const MS=[
{id:'m1',n:'A Quebrada Não Para',who:'henry',at:HB,pay:300,xp:150,rep:3,
 d:'Henry mostra a favela, a casa, o pai Júlio e o irmão Enzo. Rotina, moradores e a primeira tarefa simples.',
 obj:'Principal: pegar pão, falar com Enzo e entregar a encomenda da Dona Neusa. Secundários: conversar com 3 moradores (E); levar a Saveiro sem bater.',
 sec:[['Conversar com 3 moradores',c=>Object.values(c.a).filter(a=>a.said).length>=3],['Saveiro intacta',c=>c.c.sav&&c.c.sav.hp>=c.c.sav.mhp*.9]],
 fails:[c=>c.c.sav&&c.c.sav.dead&&'A Saveiro foi destruída'],
 steps:[CIN(HB,28,16,9),...D(['Narrador','Nova Santos, seis e meia da manhã. Lá em cima a cidade ainda dorme. Aqui na quebrada o dia já começou: cheiro de pão, de café e de fofoca fresquinha.'],['Henry','Mais um dia na maior favela da cidade. Acordei lindo, como sempre. Quem discorda é porque nunca me viu de manhã.']),
  X(()=>{bars(0);loc('ze','Seu Zé',-322,-362,['Cuida desse carro, Henry. A Saveiro tá tão baixa que passa embaixo da lombada e pede desculpa.','Se o pai te pedir pão, compra logo, que a fila da padaria já deu volta no quarteirão.']);
   loc('cida','Dona Cida',-330,-320,['Essa corrente de ouro é sua ou do Banco Central, menino?','Aqui todo mundo se conhece. Se aprontar, eu fico sabendo antes da sua mãe.']);
   loc('pix','Pixote',-312,-344,['Teu irmão tá te procurando. Disse que é urgente, mas ele fala isso até quando acaba o gás.','Dormi três horas. Ou foi a laje do vizinho que dormiu em cima de mim, não sei.']);
   loc('jul','Júlio',-325,-368,['Pão! Padaria! Agora!'],{sh:0x2e7d32,pa:0x333333})}),
  G(PETP,'Fale com seu pai, Júlio, no pet shop (E conversa com moradores)',6),
  ...D(['Júlio','Acordou cedo, hein! Passa na Padaria Estrela e traz pão pra casa. E vê se não vai se meter em confusão.'],['Henry','Eu, pai? Eu sou um anjo.'],['Júlio','Anjo com corrente de ouro e Saveiro rebaixada. Deve ser o anjo da guarda dos malandros.'],['Henry','Esse é o melhor departamento do céu.']),
  GE(PAD,'Compre pão na Padaria Estrela'),X(()=>{S.money=Math.max(0,S.money-15);msg('Pão comprado −R$15 (o padeiro jura que é integral; é só queimado)')}),
  X(()=>act('enzo',-322,-342,Object.assign({},HEN,{name:'Enzo',sh:0x2980b9,pa:0x222222}))),G(HB,'Volte para casa: o Enzo chegou',9),
  ...D(['Enzo','Fala, irmão! Dormiu até tarde que nem rei, né?'],['Henry','Rei dorme até meio-dia. Eu acordei cedo por você. Valoriza.'],['Enzo','Preciso de um favor simples: leva essa sacola pra Dona Neusa, na rua de baixo. Ela encomendou de manhã.'],['Henry','Só isso? Achei que ia pedir pra buscar um tigre.'],['Enzo','Ainda não. Vai de Saveiro, que ela tá com pressa e com fome.']),
  GC('henry','Entre na Saveiro (F)',c=>cur.c.sav=c),
  GN(NEU,'Leve a encomenda até a Dona Neusa',9,()=>act('neu',NEU.x,NEU.z-3.5,{name:'Dona Neusa',sh:0xc2185b,pa:0x333333}),110),
  ...D(['Dona Neusa','Ai, meu filho, Deus te abençoe! Esse saco tá pesado, hein. É o quê?'],['Henry','Eu achei que era melancia.'],['Dona Neusa','É pão de queijo. Pra festa da minha neta. Pode comer um.'],['Henry','Dona Neusa, a senhora é a única pessoa que pede pra eu me servir. Te amo.']),
  CIN(HB,24,10,7),...D(['Enzo','(mensagem) Boa, mano! Passa na casa do pai mais tarde. Tenho um corre melhor.'],['Henry','Corre melhor… Isso nunca é bom sinal.']),OFF]},
{id:'m2',n:'Corre do Enzo',who:'henry',at:PETP,pay:500,xp:200,rep:2,
 d:'Enzo pede um transporte suspeito. Direção, navegação, uma viatura na cola e uma escolha com consequências.',
 obj:'Principal: levar a caixa ao lava-rápido da Dona Cleide. Secundários: chegar em 3 min; terminar sem procurado.',
 sec:[['Entrega em até 3 minutos',c=>c.fast],['Sem procurado ao chegar',c=>!wanted]],fails:[c=>c.sav&&c.sav.dead&&'A Saveiro foi destruída'],
 steps:[CIN(PETP,22,12,8),X(()=>act('enzo',-322,-368,Object.assign({},HEN,{name:'Enzo',sh:0x2980b9,pa:0x222222}))),
  ...D(['Enzo','Henry, preciso de ajuda. Um amigo do pai ia entregar uma encomenda no lava-rápido da Dona Cleide, mas o carro dele quebrou.'],['Henry','Encomenda de quê?'],['Enzo','Pergunta não, que resposta dá dor de cabeça. Leva essa caixa de ração premium e pronto.'],['Henry','Ração premium que pesa mais que o cachorro do Seu Zé… Esse cachorro come dinheiro?'],['Enzo','Chega em três minutos, que o cliente não gosta de esperar. Usa o minimapa e segue pelo Centro.']),
  X(()=>{bars(0);cur.t0=clock}),GC('henry','Entre na Saveiro (F)',c=>cur.sav=cur.c.sav=c),
  W('Dirija até o lava-rápido da Dona Cleide (siga o minimapa)',()=>{mark(CLE);return dist(HB)>180}),
  X(()=>{const c=pl.car,f=[Math.sin(c.yaw),Math.cos(c.yaw)],p=car('pol','police',c.pos.x-f[0]*28,c.pos.z-f[1]*28,c.yaw,{cop:1});follow(p,()=>pl.car||{pos:pl.pos},12,16)}),
  ...D(['Henry','Opa… viatura na minha cola. Será que é comigo?'],['Enzo','(rádio) Henry! Se pararem você, a caixa é do cachorro, tá?'],['Henry','Enzo, o cachorro nem existe!'],['Enzo','Por isso mesmo, mano. Ninguém prende um cachorro que não existe.']),
  CH('A viatura segue você. O que fazer?',[['Manter a calma e respeitar o trânsito'],['Pisar fundo e dar um migué']],'cop'),
  BR('cop',[[S_('Henry','Calma, Henry. Seta, retrovisor, cinto… cidadão exemplar. Até a Saveiro parece mais educada.'),W('Dirija sem pressa por 20 segundos',dt=>(cur.k=(cur.k||0)+dt)>20),X(()=>{cur.c.pol.del=true;msg('A viatura virou na esquina. Você respirou aliviado.');SV.flags.m2='calmo'})],
   [S_('Henry','Foi mal, seu guarda, hoje o carro tá com pressa!'),X(()=>{cur.c.pol.drv=null;crime(1);SV.flags.m2='fugiu'}),W('Despiste a polícia!',()=>!wanted)]]),
  GN(CLE,'Entregue a caixa no lava-rápido da Dona Cleide',12,()=>act('cle',CLE.x+6,CLE.z,{name:'Dona Cleide',sh:0xffffff,pa:0x2b4a7a}),110),X(()=>cur.fast=clock-cur.t0<180),
  ...D(['Dona Cleide','(de avental) Rapaz de confiança! Pode deixar a ração aí… ela rosna?'],['Henry','Só quando acordada, Dona Cleide.'],['Dona Cleide','Então eu guardo no cofre. Pro cachorro não se assustar.']),
  CIN(CLE,20,9,6),...D(['Enzo','(mensagem) Valeu, irmão. O pai nem precisa saber desse corre, tá ligado?'],['Henry','Nem sei o que eu fiz, mas fiz bem feito. Isso é talento.']),OFF]},
{id:'m3',n:'Cliente Nunca Tem Razão',who:'theo',at:OFI,pay:150,xp:200,rep:2,
 d:'Theo, a oficina deficitária e o Fusca emprestado. Um cliente enrola, não paga e causa confusão.',
 obj:'Principal: consertar o carro do Seu Marcão, segui-lo e cobrar. Secundários: concluir os três serviços; usar o Foco Turbo (X) na perseguição.',
 sec:[['Concluir os três serviços',c=>c.served],['Usar o Foco Turbo na perseguição',c=>c.used]],fails:[c=>c.c.cli&&c.rel&&dd(c.c.cli.pos,pl.pos)>260&&'Você perdeu o Seu Marcão de vista'],
 steps:[CIN(OFI,22,11,8),...D(['Narrador','Oficina do Theo. Aluguel atrasado, caixa vazio e uma placa que o vento já tentou derrubar duas vezes.'],['Theo','(ajeitando os óculos) Dezoito reais no caixa e o aluguel vence sexta. Dá pra pagar se o cliente vier… e pagar.']),
  X(()=>{bars(0);car('cli','sedan',OFI.x-3,OFI.z+7,0,{col:0x7a1f1f});act('mar',OFI.x+4,OFI.z-1,{name:'Marcão',sh:0xe8d49a,pa:0x333333,skin:0xf1c9a5})}),
  ...D(['Marcão','Fala, Theozinho! Tô com um barulho esquisito no freio. Dá uma olhada rapidinho?'],['Theo','Bom dia, Seu Marcão! Pode deixar. (tropeça numa caixa de ferramentas) Tô bem! A caixa tá bem?']),
  GE(L1,'Suba o carro no elevador'),X(()=>msg('Freio inspecionado: pastilha gasta. (Os óculos caíram dentro do motor. Resgatados.)')),GE(L2,'Pegue as ferramentas na bancada'),X(()=>msg('Pastilhas trocadas')),GE(L3,'Complete óleo e lubrificação'),X(()=>{cur.served=1;msg('Serviço concluído')}),
  ...D(['Marcão','Ficou ótimo! Só que hoje eu tô sem um centavo. Amanhã passo aqui e te pago em dobro, tá?'],['Theo','Mas, Seu Marcão… são duzentos reais.'],['Marcão','Theozinho, confia em mim. Eu sou homem de palavra.'],['Theo','O senhor me deve três palavras desde 2019.']),
  GC('theo','Pegue o Fusca (F) para seguir o Seu Marcão',()=>0),X(()=>{rmA(cur.a.mar);cur.rel=1;route(cur.c.cli,[{x:OFI.x,z:OFI.z+10},{x:0,z:-128}],19)}),
  W('Pegue o Fusca (F) e alcance o Seu Marcão! Dica: X ativa o Foco Turbo',dt=>{if(SY.abOn('theo'))cur.used=1;mark(cur.c.cli.pos);if(own('theo')&&dd(cur.c.cli.pos,pl.pos)<11)cur.k=(cur.k||0)+dt;return cur.k>1.5||(cur.c.cli.vel.length()<.5&&dist(cur.c.cli.pos)<40)}),
  ...D(['Theo','Seu Marcão! O senhor prometeu!'],['Marcão','Ô, rapaz… isso aqui é um bar, não um tribunal.'],['Theo','Eu só quero os duzentos reais.'],['Marcão','Toma cinquenta e vê se não enche. (joga as notas)'],['Theo','Cinquenta?! (desvia da nota, tropeça no meio-fio) Era duzentos!']),
  X(()=>{S.money+=50;msg('+R$50 (o prejuízo foi de R$150)')}),CIN(MAR,18,8,6),
  ...D(['Theo','Honesto e pobre. Combinação perfeita pra quem quer rir da própria vida.'],['Theo','(pro Fusca) Pelo menos você não me engana, amigo.']),OFF]},
{id:'m4',n:'Fiado Não Paga Aluguel',who:'theo',at:OFI,pay:200,xp:220,rep:2,
 d:'Pequenos trabalhos pela cidade, honestidade explorada e um senhorio que intimida. Primeiro conflito moral do Theo.',
 obj:'Principal: guinchar um carro, entregar peças, enfrentar o senhorio e decidir. Secundários: guincho sem bater; recusar o trabalho sujo.',
 sec:[['Guinchar o carro com cuidado',c=>c.c.van&&c.c.van.hp>=c.c.van.mhp*.7],['Recusar o trabalho sujo',c=>c.cho.mor==1]],fails:[c=>c.c.van&&c.c.van.dead&&'O carro guinchado foi destruído'],
 steps:[
  ...D(['Theo','Sexta-feira… tá chegando mais rápido que o ônibus. E o ônibus já é rápido, quando não quebra.'],['Theo','(telefone) Dona Dalva? Pode deixar, eu vou guinchar o seu carro. (derruba o celular) Peraí!']),
  GC('theo','Pegue o Fusca (F) e vá até o carro quebrado',()=>0),GN(TOW,'Vá até o carro quebrado',30,()=>{car('van','van',TOW.x,TOW.z,0,{col:0xcfcfcf});cur.c.van.hp=cur.c.van.mhp*.4;act('dal',TOW.x+3,TOW.z+3,{name:'Dona Dalva',sh:0xc2185b,pa:0x333333})},110),GE(TOW,'Engate o guincho (aproxime-se do carro quebrado)',7),
  ...D(['Dona Dalva','Meu filho, só posso pagar semana que vem. Fiado, né?'],['Theo','Tudo bem, Dona Dalva… fiado.'],['Theo','(pra si) Fiado: a palavra mais cara do dicionário.']),
  W('Leve o carro guinchado até a oficina (dirija devagar)',()=>{mark(OFI);if(!own('theo'))return 0;const c=pl.car,v=cur.c.van,fx=Math.sin(c.yaw),fz=Math.cos(c.yaw);v.pos.x=c.pos.x-fx*5.6;v.pos.z=c.pos.z-fz*5.6;v.yaw=c.yaw;v.vel.set(0,0,0);return dd(v.pos,OFI)<14}),
  ...D(['Theo','Fiado, fiado… eu já fiz mais fiado que a mercearia da esquina.']),GN(DIT,'Entregue as peças ao Seu Dito na avenida',10,()=>act('dit',DIT.x+4,DIT.z+4,{name:'Dito',sh:0xb26a00,pa:0x333333}),110),
  ...D(['Theo','Seu Dito, o radiador que o senhor pediu.'],['Dito','Ótimo! Toma aqui. (entrega as notas) Esse dez tá com a cara do Pelé… do lado errado.'],['Theo','(ajeitando os óculos) Acho que… o Pelé tá meio vesgo.']),
  X(()=>{S.money+=40;msg('+R$40 — duas notas eram falsas. Você só percebeu depois.')}),
  G(OFI,'Volte para a oficina',9),X(()=>{act('os',OFI.x-5,OFI.z+8,{name:'Osvaldo',sh:0x6b1f1f,pa:0x222222});act('g1',OFI.x+1,OFI.z+8,{sh:0x111111});act('g2',OFI.x+4,OFI.z+7,{sh:0x111111})}),
  CIN(OFI,16,6,6),...D(['Osvaldo','Theo, Theo, Theo… o aluguel era pra ontem.'],['Theo','S-Seu Osvaldo! Eu juro que sexta eu pago. (tropeça no tapete) Foi o chão! Digo, o tapete!'],['Osvaldo','Sexta eu quero o dinheiro ou a chave dessa oficina. Mas posso te ajudar: meu sobrinho tem um carro "especial" pra desmanchar. Oitocentos limpos.'],['Theo','Carro… roubado?'],['Osvaldo','Carro "especial". Você é mecânico, não é? (empurra Theo)'],['Theo','Eu… eu tenho alergia a ameaça!']),
  X(()=>{hurt(10);bars(0)}),
  CH('O que o Theo vai fazer?',[['Aceitar desmanchar o carro roubado (R$800)'],['Recusar e pedir mais prazo'],['Ligar para o primo pedir conselho']],'mor'),
  BR('mor',[[X(()=>{S.money+=800;SV.rep-=6;SV.flags.m4='cedeu'}),...D(['Theo','Só dessa vez… só dessa vez.'],['Osvaldo','É assim que se começa, garoto.'],['Theo','(sozinho) O pior é que o carro era bonito.'])],
   [X(()=>{SV.rep+=4;SV.flags.m4='honesto'}),...D(['Theo','Prefiro ficar pobre a ficar preso, Seu Osvaldo.'],['Osvaldo','Honesto, é? Vai ver onde isso te leva. Sexta.'],['Theo','(sozinho) Orgulho de mim… e medo de mim também.'])],
   [X(()=>{SV.flags.m4='primo'}),...D(['Theo','(telefone) Primo, o Seu Osvaldo tá me pressionando.'],['Primo','Ô Theo, se vira! Só não me estraga o Fusca, tá? Ele é mais sensível que você.'],['Osvaldo','Qual é a resposta, mecânico?'],['Theo','Eu… preciso de mais tempo.'])]]),
  ...D(['Narrador','Pela primeira vez, Theo percebeu que ser bom não paga as contas. E que alguém, em algum lugar, ainda anotava o nome dele num caderninho.']),OFF]},
{id:'m5',n:'O Menino da Paulista',who:'messine',at:LOB,pay:2000,xp:300,rep:3,
 d:'Felipe “Messine”, na cobertura da Paulista, no esportivo, num encontro de negócios. Primeiro uso da Mente Estratégica.',
 obj:'Principal: ir ao Terraço 360 e desmascarar o Vanderlei. Secundários: chegar em 90 s; usar a habilidade antes de falar com ele.',
 sec:[['Chegar em 90 s',c=>c.fast],['Analisar antes de conversar',c=>c.pre]],fails:[c=>c.c.por&&c.c.por.dead&&'O Porsche foi destruído'],
 steps:[CIN(LOB,30,40,9),...D(['Narrador','Avenida Paulista, nove da manhã. Num andar altíssimo, um garoto de vinte anos, gordinho, rico e sempre com fome de resultados acorda como quem não deve nada a ninguém. A não ser uma coxinha.'],['Felipe','Dois milhões na conta, nenhum amigo na agenda e uma coxinha na geladeira. Pelo menos a coxinha não me liga pedindo dinheiro.']),
  X(()=>{bars(0);cur.t0=clock}),GC('messine','Pegue o Porsche (F)',c=>cur.c.por=c),
  ...D(['Felipe','O Porsche é rápido. Eu não sou, mas o carro compensa.']),
  GN(TERR,'Dirija até o Terraço 360, na Paulista',10,()=>{act('van',TERR.x+3,TERR.z,{name:'Vanderlei',sh:0x303a5c,pa:0x222233,skin:0xe3b48f});act('s1',TERR.x+6,TERR.z+2,{name:'Capanga',sh:0x111111,pa:0x111111})},110),X(()=>{cur.fast=clock-cur.t0<90}),
  ...D(['Vanderlei','Felipe Messine! O jovem fenômeno! Vamos fechar aquele investimento?'],['Felipe','Vamos. Mas não me chama de jovem, Vanderlei. Eu envelheço rápido quando tem prejuízo.']),
  W('Use a Mente Estratégica (X) e examine o Vanderlei (E) para ler o blefe',()=>{if(SY.abOn('messine')){cur.pre=1;if(dist(cur.a.van.pos)<9)return cur.e}else cur.e=0;return 0}),
  ...D(['Felipe','Você coça o pulso esquerdo quando mente. Seu relógio tá gravando. E seu sócio tá no estacionamento, esperando meu sinal.'],['Vanderlei','C-como você…?'],['Felipe','Seu sapato novo ainda tem o preço colado na sola: oitenta e nove e noventa. Quem vai investir milhões com sapato da promoção?'],['Vanderlei','Isso é… um desconto.'],['Felipe','O desconto é meu: vinte por cento a mais na minha parte. Fechado?'],['Vanderlei','(suando) Fechado…']),
  CIN(TERR,16,14,7),...D(['Felipe','(sozinho, mastigando) Tava ótimo. Só faltou um sanduíche.'],['Narrador','Aprendeu cedo: com doze anos vendeu um "concurso de figurinhas" que ninguém ganhava. Hoje o concurso é maior, e ainda ninguém ganha.'],['Narrador','(mensagem) "Ainda lembra do Pátio do Cabeção? — H."'],['Felipe','Pátio do Cabeção… Faz tempo. Será que o Henry ainda me chama de Felipão?']),OFF]},
{id:'m6',n:'Dinheiro Não Compra Tudo',who:'messine',at:LOB,pay:500,xp:300,rep:2,
 d:'Uma negociação dá errado e Felipe precisa resolver a crise: diálogos ramificados e consequências.',
 obj:'Principal: resolver a negociação com a Galera do Porto. Secundários: usar a análise para destravar a saída inteligente; não pagar.',
 sec:[['Usar a análise e blefar',c=>c.cho.neg==1],['Resolver sem pagar',c=>c.cho.neg!=0]],fails:[c=>c.c.por&&c.c.por.dead&&'O Porsche foi destruído'],
 steps:[...D(['Vanderlei','(telefone) Felipe, deu ruim! O dinheiro do investimento sumiu e o pessoal do Porto diz que a culpa é sua!'],['Felipe','Eu não perco dinheiro, Vanderlei. Eu invisto em perder tempo.']),
  GC('messine','Pegue o Porsche (F)',c=>cur.c.por=c),G(GAL,'Dirija até o galpão no Porto',14),
  X(()=>{foe('rato',GAL.x+10,GAL.z,{name:'Rato',hostile:0,hp:80,sh:0x6a1b1b});for(const i of[1,2,3])foe('g'+i,GAL.x+6+i*3,GAL.z+4*(i%2?1:-1),{hostile:0,hp:60,sh:0x222222});cur.k=0}),
  ...D(['Rato','Então você é o menino rico. Cinquenta mil e a gente esquece o seu nome.'],['Felipe','(pensando) Dois seguranças olham a porta. O terceiro olha o meu lanche. Ele tá mentindo sobre o valor.']),
  W('Você tem alguns segundos: use X para analisar a situação (opcional)',dt=>{cur.k+=dt;if(SY.abOn('messine'))cur.an=1;return cur.k>12||(cur.an&&cur.k>3)}),
  CH('Como resolver a negociação?',[['Pagar R$3.000 para encerrar'],['Blefar com a informação que a análise mostrou',()=>cur.an],['Sair correndo (e rolando)']],'neg'),
  BR('neg',[[X(()=>{S.money=Math.max(0,S.money-3000);SV.flags.m6='pagou'}),...D(['Felipe','Dinheiro resolve. Mas não compra respeito. Nem tamanho de camisa.'],['Rato','Negócio é negócio, garoto.'])],
   [X(()=>{SV.rep+=5;S.money+=1500;SV.flags.m6='blefe'}),...D(['Felipe','O Rato aqui cobrou o dobro do que declarou ao chefe. Eu tenho a planilha. E uma memória excelente, que, aliás, também se lembra de onde fica a cozinha.'],['Rato','…Como é que você sabe disso?'],['Felipe','Eu li os seus movimentos. Devolve a parte do Vanderlei e a gente esquece o seu nome.'],['Rato','(engolindo seco) Tá… leva.'])],
   [X(()=>{for(const k of['rato','g1','g2','g3'])cur.a[k].hostile=undefined;for(const x of[1,2]){const c=car('ch'+x,'suv',GAL.x-50,GAL.z-60*x+60,0,{col:0x111111});c.drv=drvTo(()=>pl.pos,1,{max:30})}SV.flags.m6='fugiu'}),S_('Felipe','Eu não corro! Eu rolo… estrategicamente!'),W('Escape dos capangas!',()=>dist(cur.c.ch1.pos)>150&&dist(cur.c.ch2.pos)>150)]]),
  CIN(GAL,22,12,6),...D(['Vanderlei','(mensagem) Resolveu. Mas a Galera do Porto quer saber mais sobre você.'],['Felipe','Que queiram. Eu só tenho um segredo: a coxinha da Tia Maria.']),OFF]},
{id:'m7',n:'Três Caminhos',who:'henry',at:HB,pay:800,xp:350,rep:3,
 d:'Pequenos detalhes conectam as três histórias. A missão alterna entre Henry, Theo e Felipe.',
 obj:'Principal: seguir as pistas de cada protagonista. Secundário: usar a Mente Estratégica na foto.',
 sec:[['Analisar a foto com a Mente Estratégica',c=>c.an]],
 steps:[X(()=>{act('enzo',-322,-342,Object.assign({},HEN,{name:'Enzo',sh:0x2980b9,pa:0x222222}))}),CIN(HB,20,10,6),
  ...D(['Enzo','Henry, apareceu um cara de terno no pet shop, perguntando de você. Gordinho, bem-vestido, chegou com dois seguranças e uma caixa de bombons.'],['Henry','Gordinho de terno com bombons? FELIPE?! O Felipão?'],['Enzo','Falou "Messine" e deixou um cartão: Paulista One, cobertura.'],['Henry','Messine… Ele mudou o sobrenome só pra caber no cartão? Vou ligar pro Theo, aquele bobo deve estar com a oficina ainda.']),OFF,
  SW('theo'),G(OFI,'Theo: volte à oficina',9),
  ...D(['Theo','Esse barulho no motor… (examina) Gente, tem um envelope aqui debaixo do assento! (bate a cabeça no capô) Tô bem! O capô também!']),GE(L1,'Examine o envelope no elevador'),
  ...D(['Theo','É uma foto antiga! Eu, o Henry e o Felipe no Pátio do Cabeção, em 2012. Eu de óculos, o Henry de corrente, o Felipe com um pacote de biscoito. Nada mudou.'],['Theo','Atrás: "Se ainda lembra, Pátio do Cabeção, sexta, 20h".'],['Theo','…Meu Deus. E eu com o aluguel pra pagar.']),
  SW('messine'),G(LOB,'Felipe: abra o cofre do apartamento',8),
  ...D(['Felipe','(abrindo o cofre) Um relógio, ações, a mesma foto… e meio pacote de biscoito. Prioridades.']),
  W('Use a Mente Estratégica (X) para analisar a foto',()=>{if(SY.abOn('messine'))cur.an=1;return cur.an}),
  ...D(['Felipe','Atrás da foto, uma carimbada: "Pátio do Cabeção". Alguém quer nos juntar de novo. Quem?'],['Narrador','Três vidas. Uma foto. E alguém que sabia demais.']),CIN(LOB,20,14,6),OFF,SW('theo')]},
{id:'m8',n:'Quem É Você Mesmo?',who:'theo',at:OFI,pay:700,xp:350,rep:4,
 d:'Theo reencontra Henry sem esperar. Infância, cooperação e uma situação resolvida juntos.',
 obj:'Principal: consertar a Saveiro do Henry e recuperar peças no ferro-velho. Secundário: levar o Fusca sem bater.',
 sec:[['Fusca sem avarias',c=>c.c.fus&&c.c.fus.hp>=c.c.fus.mhp*.9]],fails:[c=>c.c.fus&&c.c.fus.dead&&'O Fusca foi destruído'],
 steps:[X(()=>{car('sav','saveiro',OFI.x+10,OFI.z+8,0,{col:0xf4f4f4});cur.c.sav.hp=cur.c.sav.mhp*.5;act('hen',OFI.x+13,OFI.z+8,HEN)}),CIN(OFI,16,8,8),
  ...D(['Henry','Ô, professor Pardal! Faz quanto tempo, hein?'],['Theo','Henry?! Henry do Pátio do Cabeção?! (ajeita os óculos e tropeça num pneu) Tô bem!'],['Henry','O próprio. Minha Saveiro apagou aqui na porta, e olha só quem é o mecânico!'],['Theo','Continua com a mesma cara de quem vai me meter em confusão.'],['Henry','Eu? Sou um anjo.'],['Theo','Anjo com corrente de ouro. Já vi esse filme.']),OFF,
  GE({x:OFI.x+10,z:OFI.z+8},'Conserte a Saveiro do Henry',4),X(()=>{cur.c.sav.hp=cur.c.sav.mhp}),
  ...D(['Henry','Lembra quando a gente roubava manga do Seu Zeca?'],['Theo','Você roubava. Eu segurava o saco.'],['Henry','E caiu da árvore.'],['Theo','Foi estratégia.'],['Henry','Agora preciso de peças de motor no ferro-velho do Beto, mas o pessoal de lá é esquisito.'],['Theo','Eu dirijo, você me cobre. Eu cubro com o quê? Com os óculos.']),
  W('Pegue o Fusca (F) e siga para o ferro-velho no leste',()=>own('theo')&&(cur.c.fus=pl.car)),
  X(()=>{follow(cur.c.sav,()=>pl.car||{pos:pl.pos},6,24)}),G(FER,'Dirija até o ferro-velho do Beto',14),
  X(()=>{act('henA',cur.c.sav.pos.x+2,cur.c.sav.pos.z,Object.assign({},HEN,{role:'ally',unarmed:0,hostile:0,spd:4.2}));for(const i of[0,1,2])foe('e'+i,FER.x+8+i*4,FER.z+(i-1)*5,{hp:60,sh:0x3a2a1e})}),
  ...D(['Henry','Theo, atrás do caminhão! Eu seguro eles aqui!'],['Theo','Eu sou mecânico, não soldado! Meu ponto forte é parafuso!'],['Henry','Então fica quieto e não tropeça! (tiros)'],['Theo','(PLAFT, tropeça) Tropecei!']),
  W('Abrigue-se enquanto o Henry elimina os capangas',()=>allDead(['e0','e1','e2'])),
  GE({x:FER.x+3,z:FER.z},'Pegue as peças do motor',4),
  ...D(['Henry','Aí, parceiro! Vinte anos depois e a gente ainda é dupla boa.'],['Theo','Eu só vim consertar o seu carro, tá?'],['Henry','Tá, tá… e o Felipe? Recebeu a foto também?'],['Theo','Recebi. Ele ainda é gordinho?'],['Henry','Gordinho e rico. Combina com ele.'],['Theo','Combina com a gente: ele paga o almoço.']),CIN(FER,20,12,6),OFF]},
{id:'m9',n:'Velhos Conhecidos',who:'theo',at:OFI,pay:1000,xp:400,rep:4,
 d:'Henry e Theo descobrem que Felipe está encrencado. Cenas cinematográficas e humor brasileiro.',
 obj:'Principal: achar o Felipe, perseguir o van e reunir os três. Secundários: manter o van à vista; usar o Foco Turbo.',
 sec:[['Usar o Foco Turbo na perseguição',c=>c.used],['Manter o van à vista',c=>!c.lost]],fails:[c=>c.c.van&&dd(c.c.van.pos,pl.pos)>260&&'Vocês perderam o van'],
 steps:[...D(['Henry','Theo, chega aí! O Pixote jura que viu o Felipe entrando num galpão no Porto, com uns homens esquisitos.'],['Theo','Esquisitos como?'],['Henry','Esquisitos de terno preto, Theo. Esquisitos de van preta. A gente só vê isso em filme!']),
  W('Pegue o Fusca (F)',()=>own('theo')),G(GAL,'Siga até o galpão no Porto',70),
  X(()=>{const v=car('van','van',GAL.x,GAL.z,0,{col:0x111111});v.hp=v.mhp=260;route(v,[{x:80,z:408},{x:80,z:392},{x:128,z:388},{x:128,z:0},{x:64,z:0},{x:64,z:-192}],21)}),
  ...D(['Theo','Olha! Uma van preta saindo do galpão!'],['Henry','É a van! Pisa, Theo! Usa aquele teu foco de piloto!'],['Theo','O mundo desacelerou… ou será que eu só tô com sono?']),
  W('Persiga o van (dica: X ativa o Foco Turbo)',dt=>{if(SY.abOn('theo'))cur.used=1;mark(cur.c.van.pos);const d=dd(cur.c.van.pos,pl.pos);if(d>60)cur.lost=1;if(d<24)cur.k=(cur.k||0)+dt;return cur.k>5}),
  X(()=>{sub('Henry','Segura firme que eu acerto o pneu!');cur.c.van.drv=()=>[0,0,true]}),
  X(()=>{bars(1);SY.cine(cur.c.van.pos.x,cur.c.van.pos.z,18,10,7)}),...D(['Henry','Pneu estourado. Elegante.'],['Theo','Você sempre foi bom de mira.'],['Felipe','(saindo do van, mãos pra cima, com a gravata torta) Esperem! Eu posso explicar!'],['Henry','Ô, Felipão! Virou rico e esqueceu da gente?'],['Felipe','Henry? Theo?! Vocês… cresceram.'],['Theo','Você também. Só que pros lados.'],['Felipe','Eu prefiro "volumoso". É mais elegante.'],['Henry','Volumoso e esnobe.'],['Felipe','Vocês trouxeram comida? Tô há duas horas numa van sem lanche. Isso é sequestro e tortura.']),OFF]},
{id:'m10',n:'De Volta ao Jogo',who:'henry',at:PAT,pay:3000,xp:600,rep:8,
 d:'Final do prólogo, no Pátio do Cabeção: os três conversam, discutem e agem juntos, cada um com seu papel.',
 obj:'Principal: Felipe marca os atacantes, Henry os elimina, Theo foge de carro até o lava-rápido. Secundário: fugir sem destruir o Fusca.',
 sec:[['Fuga sem destruir o Fusca',c=>c.c.fus&&!c.c.fus.dead]],fails:[c=>c.c.fus&&c.c.fus.dead&&'O Fusca foi destruído'],
 steps:[X(()=>{PR.lock=true;const s=PR.stt;s.henry.car=s.theo.car=s.messine.car=null;s.messine.pos.set(PAT.x+4,0,PAT.z+3);s.theo.pos.set(PAT.x-4,0,PAT.z+3);act('mes',PAT.x+4,PAT.z+3,FEL);act('the',PAT.x-4,PAT.z+3,THE)}),CIN(PAT,12,6,10),
  ...D(['Henry','Resumo da ópera: alguém juntou a gente de novo. E não foi pra festa.'],['Felipe','Alguém sabe demais: nomes, passado, até o nosso Pátio. E o meu tamanho de camisa.'],['Theo','Eu só queria pagar o aluguel…'],['Henry','Aluguel, Theo? A gente tá falando de conspiração!'],['Theo','Eu sei, mas o aluguel não espera conspiração!'],['Henry','Somos um trio estranho: o malandro, o mecânico e o gordinho esperto.'],['Felipe','Isso é bullying.'],['Henry','Isso é carinho.'],['Felipe','Tem gente chegando.']),
  X(()=>{bars(0);for(let i=0;i<6;i++){const a=foe('a'+i,i%2?PAT.x+rr(-6,6):PAT.x+rr(28,48),i%2?PAT.z-rr(28,48):PAT.z+rr(-6,6),{hostile:0,hp:60,sh:0x1a1a1a})}}),
  SW('messine'),W('Felipe: use a Mente Estratégica (X) para marcar os atacantes',()=>SY.abOn('messine')),
  ...D(['Felipe','Seis. Dois no flanco, três na frente, um no telhado. Henry, a mira é sua. Eu vou ficar aqui, estrategicamente seguro.']),SW('henry'),
  X(()=>{for(let i=0;i<6;i++)cur.a['a'+i].hostile=undefined}),
  W('Henry: elimine os atacantes (use X: Reflexo de Rua)',()=>allDead(['a0','a1','a2','a3','a4','a5'])),
  ...D(['Henry','Todo mundo inteiro?'],['Theo','Eu só vi o Henry e uma nuvem de fumaça. E o Felipe embaixo do carro.'],['Felipe','Eu não estava embaixo. Estava… analisando o chassi.']),SW('theo'),
  X(()=>{car('fus','fusca',PAT.x,PAT.z+8,0,{owner:'theo'});for(const x of[1,2]){const c=car('ch'+x,'suv',x==1?PAT.x+60:PAT.x,x==1?PAT.z:PAT.z+60,0,{col:0x111111});c.drv=drvTo(()=>pl.pos,1,{max:28})}}),
  W('Theo: entre no Fusca (F) e fuja até o lava-rápido (use X: Foco Turbo)',()=>own('theo')&&(cur.c.fus=pl.car)),G(CLE,'Fuja dos SUVs até o lava-rápido da Dona Cleide',10),
  X(()=>{for(const x of[1,2])cur.c['ch'+x].del=true;bars(1)}),CIN(CLE,16,10,12),
  ...D(['Theo','Se eu bater o Fusca, o primo me mata. Se eu não bater, o SUV me mata. Pelo menos nas duas eu morro de óculos.'],['Felipe','Se alguém quer jogar, a gente joga.'],['Henry','Mas dessa vez, a gente joga junto.'],['Theo','E alguém me paga o aluguel?'],['Henry','Theo!'],['Theo','Tá bom, tá bom!'],['Contratante','(mensagem de número desconhecido) Bem-vindos de volta ao jogo, rapazes. Isto foi só o aquecimento.'],['Felipe','…Alguém tá nos observando. E esse alguém sabe até que eu esqueci de pagar o IPTU.'],['Henry','Quem?'],['Contratante','Vocês descobrirão. Ou ele descobrirá vocês.']),
  X(()=>{bigMsg('FIM DO PRÓLOGO','#ffd23f')}),W('',()=>subT<=0&&bigT<2),OFF]}];

/* ================= motor ================= */
function adv(){cur.i++;cur.t=0;const s=cur.steps[cur.i];if(!s){win();return}
 if(skipOn&&!s.dlg&&!s.x){skipOn=false;SY.cineStop();bars(0);subEl.style.display='none'}   // fim da cena pulada: volta ao jogo
 s.init&&s.init()}
function begin(m,r){cur={m,i:-1,t:0,ents:[],c:{},a:{},cho:{},steps:m.steps.slice(),e:0};rp=r?{f:JSON.stringify(SV.flags||{}),rep:SV.rep}:null;skipOn=false;SY.busy=true;PR.lock=true;wanted=0;adv()}
function cleanup(){if(!cur)return;for(const o of cur.ents){if(o.p)rmA(o);else if(o.T)o.del=true}bcn.visible=false;sobj.textContent='';bars(0);SY.cineStop();chEl.style.display='none';chOn=null;PR.lock=false;SY.busy=false;SY.obj=null;const i=SY.markers.indexOf(smk);if(i>=0)SY.markers.splice(i,1);skipOn=false;if(rp){try{SV.flags=JSON.parse(rp.f)}catch(e){}SV.rep=rp.rep;rp=null}cur=null}   // rejogo não altera escolhas/reputação da história
function fail(t){cleanup();bigMsg('MISSÃO FALHOU','#ff5252');msg(t+' — volte ao marcador para tentar de novo');cdn=6}
function win(){const m=cur.m,sec=m.sec||[],ok=sec.filter(s=>s[1](cur)),rpl=!!rp,pay=rpl?0:m.pay+ok.length*100;S.money+=pay;if(!rpl){SV.rep+=m.rep;SY.xp(m.xp)}if(!SV.done.includes(m.id))SV.done.push(m.id);
 SV.ch=Math.max(SV.ch,MS.indexOf(m)+1);SY.persist();cleanup();bigMsg('MISSÃO CUMPRIDA','#7dff8a');msg(rpl?'Missão rejogada · secundários '+ok.length+'/'+sec.length:'+R$'+pay+' · secundários '+ok.length+'/'+sec.length);cdn=4;if(rpl)return;const nx=MS[SV.ch];if(nx&&nx.who!=PR.cur)setTimeout(()=>PR.sw(nx.who,true),3000)}
function storyTick(dt){subT-=dt;{const c=cur&&cur.steps[cur.i];skh.style.display=c&&c.dlg&&!skipOn?'block':'none'}if(subT<=0&&!chOn)subEl.style.display='none';if(bigT>0){bigT-=dt;if(bigT<=0)big.style.opacity=0}
 if(window.GAME_MODE=='free'){bcn.visible=false;SY.obj=null;const i=SY.markers.indexOf(smk);if(i>=0)SY.markers.splice(i,1);return}   // MODO LIVRE: sem missões, marcadores nem diálogos de história
 if(!cur){const m=MS[SV.ch];if(!m){bcn.visible=false;return}cdn-=dt;if(PR.cur==m.who&&!pl.dead){mark(m.at);if(cdn<=0&&dist(m.at)<5)begin(m)}else{bcn.visible=false;SY.obj=null}return}
 if(pl.dead){fail('Você morreu');return}cur.t+=dt;for(const f of cur.m.fails||[]){const r=f(cur);if(r){fail(r);return}}
 for(const k in cur.a){const a=cur.a[k];if(a.role=='npc'&&a.alive&&dist(a.pos)<14)a.g.rotation.y=Math.atan2(pl.pos.x-a.pos.x,pl.pos.z-a.pos.z)}
 const s=cur.steps[cur.i];if(!s){win();return}sobj.textContent=s.txt||'';if(s.tick&&s.tick(dt)){if(cur)adv()}}
addEventListener('mousedown',e=>{if(!run||e.button!=0||!cur)return;const s=cur.steps[cur.i];if(s&&s.dlg){skipOn=true;subT=0;subEl.style.display='none';e.stopImmediatePropagation()}},true);
addEventListener('keydown',e=>{if(!run||e.repeat)return;if(e.code=='KeyE'){if(cur)cur.e=1;for(const a of SY.actors)if(a.lines&&a.alive&&dist(a.pos)<3.2){sub(a.name,pk(a.lines));a.said=1;break}}
 if(chOn&&/^Digit[7-9]$/.test(e.code))pick(+e.code[5]-7)});
SY.replay=i=>{const m=MS[i];if(!m||i>=SV.ch||cur||SY.busy||pl.dead)return;
 $('go').click();   // fecha o menu e retoma o jogo
 const go=()=>{if(pl.car)exitCar();pl.pos.set(m.at.x,0,m.at.z);pl.vx=pl.vz=0;const c=PR.stt[m.who].mycar;if(c&&c.dead){c.dead=false;c.hp=c.mhp;c.cm.color.copy(c.base)}wanted=0;begin(m,1)};
 if(PR.cur!=m.who){PR.sw(m.who,true);setTimeout(go,620)}else{fade.style.opacity=1;setTimeout(()=>{go();fade.style.opacity=0},500)}};
SY.renderMissions=pan=>{const nx=SV.ch,busy=!!cur||pl.dead;pan.onclick=e=>{const b=e.target.closest&&e.target.closest('[data-rp]');if(b&&!b.disabled)SY.replay(+b.dataset.rp)};
 pan.innerHTML='<div class="mrow"><b>Prólogo</b> — Henry, Theo e Felipe “Messine” · reputação <b>'+SV.rep+'</b><br><i>Missões concluídas podem ser rejogadas a qualquer momento (sem dinheiro, XP ou reputação extra). As ainda não concluídas ficam bloqueadas.</i></div>'+(cur?'<div class="mrow">Missão em andamento: termine ou falhe antes de rejogar outra.</div>':'')+
 MS.map((m,i)=>'<div class="mrow">'+(i<nx?'✔':i==nx?'▶':'🔒')+' <b>'+(i+1)+'. '+m.n+'</b> ('+PR.CHR[m.who].n+')<br>'+m.d+(i==nx?'<br><i>'+m.obj+'</i>':'')+(i<nx?'<br><button class="tab" style="margin-top:6px"'+(busy?' disabled':'')+' data-rp="'+i+'">↺ Rejogar</button>':'')+'</div>').join('')};
function miniObj(){const t=SY.obj;if(!t)return;const s=.42,dx=t.x-pl.pos.x,dz=t.z-pl.pos.z,sy=Math.sin(cy),co=Math.cos(cy);let x=85+(-dx*co+dz*sy)*s,y=85-(dx*sy+dz*co)*s;const ox=x-85,oy=y-85,d=Math.hypot(ox,oy);if(d>74){x=85+ox/d*74;y=85+oy/d*74}
 mm.save();mm.fillStyle=Math.floor(clock*3)%2?'#4aa3ff':'#bfe1ff';mm.strokeStyle='#fff';mm.lineWidth=2;mm.beginPath();mm.arc(x,y,6,0,6.3);mm.fill();mm.stroke();mm.fillStyle='#000';mm.font='bold 9px system-ui';mm.textAlign='center';mm.fillText('M',x,y+3);mm.restore()}
const _u=update;update=function(dt){_u(dt);storyTick(dt);miniObj()};
})();

// Mundo terminou de ser gerado: daqui pra frente o aleatório volta ao normal (tráfego, pedestres, eventos)
liveRandom();
window.startPopulation();   // só agora povoa a cidade conforme a qualidade (o mapa fixo já está pronto)