'use strict';
/* phone.js — celular do jogador. Carregar POR ÚLTIMO (depois do transito.js).
   ABRIR/FECHAR: clique na RODINHA (botão do meio).
   COM O CELULAR ABERTO (estilo GTA V):
     · girar a rodinha PARA TRÁS    = seletor vai para a direita / próximo item   (invertido)
     · girar a rodinha PARA FRENTE  = seletor volta para a esquerda / item anterior
     · BOTÃO ESQUERDO = entra no app / liga para o contato / desliga a chamada
     · BOTÃO DIREITO  = voltar
     · (setas, Enter, Backspace e Esc continuam funcionando; clicar direto nos itens também)
   Apps: Contatos, Banco (depositar/sacar), Missão (distância do objetivo), Salvar.

   CONTATOS POR PERSONAGEM: veja BOOK (quem tem o número de quem no começo).
   Para liberar um contato durante a história:  PHONE.unlock('theo','enzo')   (fica salvo no progresso)
   CONVERSAS: veja D (chave 'quemLiga>quemAtende'). Cada variante: {w:'idle'|'busy', L:[linhas]}
     · 'idle' = jogador sem missão ativa · 'busy' = no meio de uma missão
     · linha: m('fala do jogador'), o('fala do contato'), s('narração/caixa postal')
     · algumas ligações caem na CAIXA POSTAL de forma aleatória (MAIL_CHANCE)
   Gancho extra: PHONE.onCall=(contato)=>'texto extra que o contato fala no fim'; */
(()=>{
const SY=window.SY,SV=SY.SV;
const DAYS=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const NAMES={henry:'Henry',theo:'Theo',felipe:'Felipe',enzo:'Enzo',julio:'Júlio'};
const CONTACTS=[
 {id:'theo',n:'Theo',c:'#7fd0ff',r:'Mecânico',l:['Fala, parceiro! Tô na oficina, cheio de graxa.','Qualquer coisa de mecânica é comigo. Passa aqui.']},
 {id:'felipe',n:'Felipe',c:'#e8d9a8',r:'Amigo',l:['Oi... tava comendo. Fala aí.','Se precisar de uma ideia, eu dou um jeito. Quase sempre.']},
 {id:'enzo',n:'Enzo',c:'#ff9a6e',r:'Irmão',l:['Fala, irmão! Qual é a boa?','Tô de olho na quebrada. Precisando, grita.']},
 {id:'henry',n:'Henry',c:'#ffd23f',r:'Amigo',l:['Fala, mano! Tô na correria, mas pode falar.','Se for treta, me chama que eu chego rápido.']},
 {id:'julio',n:'Júlio',c:'#9be28a',r:'Pai do Henry',l:['Oi, filho. Cuidado na rua, hein.','Passa em casa depois, tem café.']}];
const APPS=[{k:'contacts',i:'👥',n:'Contatos'},{k:'bank',i:'🏦',n:'Banco'},{k:'mission',i:'🎯',n:'Missão'},{k:'save',i:'💾',n:'Salvar'}];

/* ---------- quem tem o número de quem (no começo do jogo) ---------- */
const BOOK={
 henry:['enzo','julio','theo','felipe'],
 theo:['henry','felipe'],                       // Theo NÃO tem o Enzo no começo (PHONE.unlock('theo','enzo') libera)
 felipe:['henry','theo']};
const DEFAULT_BOOK=['henry','theo','felipe'];
const REL={                                      // como cada um enxerga o contato (sobrescreve o papel padrão)
 theo:{henry:'Parceiro',felipe:'Amigo',enzo:'Irmão do Henry'},
 felipe:{henry:'Amigo',theo:'Amigo',enzo:'Irmão do Henry'},
 henry:{felipe:'Amigo'}};

/* ---------- conversas ---------- */
const m=t=>[0,t],o=t=>[1,t],s=t=>[2,t];
const D={
 'henry>enzo':[
  {w:'idle',L:[m('Fala, Enzo! Tudo certo aí?'),o('Fala, irmão! Tudo na paz. Tá precisando de alguma coisa?'),m('Nada não, só queria ouvir sua voz.'),o('Hahaha, olha quem fala! Se cuida, irmão.')]},
  {w:'idle',L:[o('E aí, Henry! Precisa de ajuda com alguma coisa?'),m('Por enquanto não. E você?'),o('Também tô de boa. Bora marcar um rolê depois.'),m('Fechou. Falou, irmão!')]},
  {w:'busy',L:[m('Enzo, tô no meio de uma correria agora.'),o('Eita! Quer que eu vá aí te ajudar?'),m('Relaxa, eu me viro. E você, precisa de algo?'),o('Também tô ocupado aqui, resolvendo umas paradas.'),m('Então a gente se fala depois.'),o('Fechou, irmão. Toma cuidado!')]},
  {w:'busy',L:[m('Fala, Enzo. Tô numa missão agora, não dá pra conversar.'),o('Tranquilo, mano. Eu também tô no corre.'),m('Nenhum dos dois precisa de nada, então?'),o('Acho que não. Depois a gente se fala.'),m('Beleza. Valeu, irmão!')]}],
 'henry>julio':[
  {w:'idle',L:[m('Oi, pai!'),o('Oi, filho. Tudo bem por aí? Tá se alimentando direito?'),m('Tô sim, pai.'),o('Passa em casa depois, tem café.'),m('Passo sim. Beijo!')]},
  {w:'idle',L:[o('Fala, filho! Precisa de alguma coisa?'),m('Nada, pai. Só ligando pra saber de você.'),o('Tô bem. Cuidado na rua, hein.'),m('Pode deixar.')]},
  {w:'busy',L:[m('Pai, tô meio ocupado agora, depois eu ligo.'),o('Tudo bem, filho. Tá tudo certo?'),m('Tá sim, só uma correria.'),o('Cuidado na rua, hein. Depois a gente conversa.')]}],
 'henry>theo':[
  {w:'idle',L:[m('Fala, Theo! Como tá a oficina?'),o('Cheia de graxa, como sempre. Precisa de alguma coisa no carro?'),m('Por enquanto não. Só passando pra dar um oi.'),o('Beleza. Qualquer coisa de mecânica, é só chamar.')]},
  {w:'busy',L:[m('Theo, tô no meio de uma parada, depois eu passo aí.'),o('Tranquilo! Se o carro tiver pedindo socorro, me chama.'),m('Fechou.')]}],
 'henry>felipe':[
  {w:'idle',L:[o('Oi... tava comendo. Fala aí.'),m('Só ligando pra ver se tá tudo bem, Felipe.'),o('Tá sim. Se precisar de uma ideia, eu dou um jeito. Quase sempre.'),m('Hahaha, valeu.')]},
  {w:'busy',L:[m('Felipe, tô numa missão, depois a gente conversa.'),o('Ah, beleza. Eu tô aqui... comendo.'),m('Claro que tá. Falou!')]}],
 'theo>henry':[
  {w:'idle',L:[m('Fala, Henry! Tá precisando de mecânico?'),o('Fala, Theo! Por agora não, o carro tá inteiro.'),m('Então tá bom. Só avisando que a oficina tá aberta.'),o('Valeu, parceiro!')]},
  {w:'busy',L:[m('Henry, tô enrolado aqui agora.'),o('Eu também tô no meio de uma parada.'),m('Então nenhum dos dois pode conversar.'),o('Isso. Depois a gente se fala, parceiro!')]}],
 'theo>felipe':[
  {w:'idle',L:[m('Felipe, e aí? Tá vivo?'),o('Tô, tô. Tava pensando numa ideia aqui.'),m('Cuidado com as suas ideias, hein.'),o('Hahaha. Passa aqui depois que eu te explico.')]},
  {w:'busy',L:[m('Felipe, tô no meio de uma missão, depois te ligo.'),o('Sem problema. Eu também tô ocupado... pensando.'),m('Fechou.')]}],
 'theo>enzo':[
  {w:'idle',L:[m('Enzo? Aqui é o Theo, amigo do Henry. Salvei seu número.'),o('Opa, Theo! Fala aí. Precisa de alguma coisa?'),m('Nada, só queria deixar o contato.'),o('Beleza. Qualquer coisa eu tô na quebrada.')]},
  {w:'busy',L:[m('Enzo, é o Theo. Tô no meio de um corre agora.'),o('Tranquilo, depois a gente se fala. Precisa de ajuda?'),m('Por enquanto não.'),o('Fechou. Se cuida!')]}],
 'felipe>henry':[
  {w:'idle',L:[m('Henry! Tava aqui pensando numa ideia.'),o('Lá vem. Fala.'),m('Depois eu te conto, ainda tá meio crua.'),o('Hahaha, tá bom. Me avisa.')]},
  {w:'busy',L:[m('Henry, tô no meio de uma missão. Precisa de algo?'),o('Também tô ocupado, Felipe.'),m('Então tá tudo certo. Depois a gente se fala.'),o('Fechou.')]}],
 'felipe>theo':[
  {w:'idle',L:[m('Theo, e a oficina?'),o('Cheia de graxa. Tá precisando de mecânico?'),m('Ainda não, mas a gente nunca sabe.'),o('Haha, passa aqui quando precisar.')]},
  {w:'busy',L:[m('Theo, tô numa missão, depois eu ligo.'),o('Beleza, Felipe. Qualquer coisa, me chama.'),m('Valeu!')]}],
 'felipe>enzo':[
  {w:'idle',L:[m('Enzo? Aqui é o Felipe, amigo do Henry.'),o('Opa, Felipe! Tá precisando de alguma coisa?'),m('Nada, só salvei seu número.'),o('Beleza, qualquer coisa é só gritar.')]}]};
const RECADOS=['Fala, é o {eu}. Me liga quando puder.','E aí, {eu} aqui. Depois a gente se fala.','Só passando pra dar um alô. Qualquer coisa, me chama.'];
const MAIL_CHANCE=.15,DIAL=2,END_WAIT=1.6;
const rnd=a=>a[Math.floor(Math.random()*a.length)];

const st=document.createElement('style');
st.textContent=`
#phone{position:fixed;right:34px;bottom:0;width:250px;height:470px;z-index:25;background:#0a0a0c;border-radius:34px;padding:10px;
 box-shadow:0 0 0 2px #333,0 12px 40px #000c;transform:translateY(110%) rotate(-3deg);transition:transform .28s cubic-bezier(.2,.8,.3,1);font-weight:400;pointer-events:none}
#phone.on{transform:translateY(-24px) rotate(-3deg);pointer-events:auto}
#phone .sc{width:100%;height:100%;border-radius:26px;overflow:hidden;background:linear-gradient(160deg,#1c2a44,#0e1424 70%);display:flex;flex-direction:column}
#phone .bar{display:flex;justify-content:space-between;padding:10px 16px 6px;font-size:13px;font-weight:700;letter-spacing:.5px}
#phone .bd{flex:1;padding:6px 14px;overflow:auto}
#phone h4{font-size:15px;letter-spacing:2px;text-transform:uppercase;margin:6px 0 10px;color:#ffd23f}
#phone .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:10px}
#phone .ic{aspect-ratio:1;border-radius:16px;background:#232c42;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:30px;border:2px solid transparent;cursor:pointer}
#phone .ic small{font-size:10px;margin-top:2px;opacity:.85}
#phone .ic.on,#phone .it.on{border-color:#ffd23f;background:#2d3a58}
#phone .it{display:flex;justify-content:space-between;align-items:center;padding:9px 10px;margin:5px 0;border-radius:10px;background:#1d2538;border:2px solid transparent;cursor:pointer;font-size:13px}
#phone .it small{opacity:.65}
#phone .big{font-size:40px;font-weight:700;text-align:center;margin:18px 0 0}
#phone .sub{text-align:center;opacity:.7;margin-bottom:6px}
#phone .box{background:#1d2538;border-radius:10px;padding:10px 12px;margin:6px 0;font-size:13px;line-height:1.45}
#phone .box.me{margin-left:22px;background:#2a3a5c}
#phone .box.sys{font-style:italic;opacity:.8;text-align:center}
#phone .box small{display:block;font-size:10px;letter-spacing:1px;text-transform:uppercase;opacity:.8;margin-bottom:2px}
#phone .av{width:76px;height:76px;border-radius:50%;margin:8px auto 6px;display:grid;place-items:center;font-size:32px;font-weight:800;color:#111}
#phone .ft{padding:8px 12px 12px;font-size:10px;opacity:.55;text-align:center}`;
document.head.appendChild(st);
const root=document.createElement('div');root.id='phone';root.innerHTML='<div class="sc"><div class="bar"><span id="phd"></span><span id="pht"></span></div><div class="bd" id="phb"></div><div class="ft">rodinha: navegar · esq: abrir · dir/⌫: voltar · rodinha (clique) fecha</div></div>';
document.body.appendChild(root);
const $p=id=>document.getElementById(id);

let open=false,view='home',sel=0,callT=0,call=null,note='';
const lastV={};
const fmt=n=>'R$ '+Math.round(n||0).toLocaleString('pt-BR');
const cur=()=>String((SY.PR&&SY.PR.cur)||'').toLowerCase();
const meName=()=>NAMES[cur()]||'Você';
const free=()=>window.GAME_MODE=='free';
const beep=f=>{try{if(typeof bp=='function')bp(f,.05)}catch(e){}};
const contacts=()=>{const k=cur(),ids=(BOOK[k]||DEFAULT_BOOK).concat((SV.pc&&SV.pc[k])||[]);
 return CONTACTS.filter(c=>c.id!==k&&ids.includes(c.id)).map(c=>Object.assign({},c,{r:(REL[k]&&REL[k][c.id])||c.r}))};
function unlock(who,id){who=String(who).toLowerCase();SV.pc=SV.pc||{};const a=SV.pc[who]=SV.pc[who]||[];
 if(a.includes(id)||(BOOK[who]||[]).includes(id))return;a.push(id);
 if(who==cur()){try{msg('Novo contato: '+(NAMES[id]||id))}catch(e){}}}

/* ---------- dia da semana: conta cada volta do relógio do jogo ---------- */
let lastTD=typeof TD=='number'?TD:0;
function dayTick(){if(typeof TD!='number')return;if(TD<lastTD-6)SV.pday=(SV.pday||0)+1;lastTD=TD}
function clockText(){const t=typeof TD=='number'?TD:0;return String(Math.floor(t)).padStart(2,'0')+':'+String(Math.floor(t%1*60)).padStart(2,'0')}
function statusBar(){$p('phd').textContent=DAYS[(SV.pday||0)%7];$p('pht').textContent=clockText()}

/* ---------- ações ---------- */
function items(){
 if(view=='home')return APPS;
 if(view=='contacts')return contacts();
 if(view=='bank')return[{n:'Depositar tudo'},{n:'Sacar tudo'}];
 return[]}
function objText(){
 if(free())return'Modo Livre: sem missões.';
 if(!SY.obj)return'Nenhum objetivo ativo para este personagem agora.';
 const d=Math.round(Math.hypot(SY.obj.x-pl.pos.x,SY.obj.z-pl.pos.z));
 return'Objetivo marcado no mapa: a '+d+' m de você.'}

/* monta a conversa: caixa postal (aleatória), variante 'busy' se há missão ativa, senão 'idle'; evita repetir a última */
function pickConv(c){
 const k=cur(),key=k+'>'+c.id,busy=!free()&&!!SY.obj;
 if(Math.random()<MAIL_CHANCE)return{mail:1,L:[s('Caixa postal de '+c.n+'. Deixe seu recado após o sinal.'),m(rnd(RECADOS).replace('{eu}',meName()))]};
 let a=(D[key]||[]).filter(v=>v.w==(busy?'busy':'idle'));
 if(!a.length)a=(D[key]||[]).filter(v=>!v.w);
 let L;
 if(a.length){let i=Math.floor(Math.random()*a.length);if(a.length>1&&i===lastV[key])i=(i+1)%a.length;lastV[key]=i;L=a[i].L.slice()}
 else L=busy?[m('Tô no meio de uma missão, falo contigo depois.'),o('Sem problema. Depois a gente conversa.')]
  :[o(c.l[0]),m('Só queria saber se estava tudo bem.'),o(c.l[1]||'Qualquer coisa, me chama.'),m('Valeu, falou!')];
 try{if(typeof PHONE.onCall=='function'){const x=PHONE.onCall(c);if(x)L.push(o(x))}}catch(e){}
 return{mail:0,L}}
function startCall(c,i){
 const v=pickConv(c),at=[];let t=DIAL;
 for(const l of v.L){at.push(t);t+=1.6+l[1].length*.045}
 call={c,i,mail:v.mail,L:v.L,at,end:t+END_WAIT,n:-1};callT=0;view='call'}
const shown=()=>call?call.at.filter(t=>t<=callT).length:0;

function act(){
 if(view=='mission'||view=='save'||view=='call')return back();
 const it=items()[sel];if(!it)return;
 if(view=='home'){beep(700);view=it.k;sel=0;note='';if(view=='save')doSave();return render()}
 if(view=='contacts'){beep(500);startCall(it,sel);return render()}
 if(view=='bank'){
  if(sel==0){if(S.money>0){SV.bank+=S.money;note='Depositado '+fmt(S.money);S.money=0}else note='Você está sem dinheiro na mão'}
  else{if(SV.bank>0){S.money+=SV.bank;note='Sacado '+fmt(SV.bank);SV.bank=0}else note='Conta vazia'}
  beep(800);return render()}}
function doSave(){SY.persist();note=free()?'Salvo. (No Modo Livre não há progresso de história.)':'Progresso salvo!';msg(note)}
function back(){
 if(view=='home')return close();
 if(view=='call'){const i=call?call.i:0;view='contacts';call=null;sel=Math.max(0,i||0)}else{const i=APPS.findIndex(a=>a.k==view);view='home';sel=Math.max(0,i)}
 note='';render()}
function openP(){if(open||!run||pl.dead)return;open=true;view='home';sel=0;note='';call=null;render();root.classList.add('on')}
function close(){if(!open)return;open=false;call=null;root.classList.remove('on')}

/* ---------- desenho ---------- */
function render(){
 statusBar();let h='';
 if(view=='home'){
  h='<div class="big" id="phbig">'+clockText()+'</div><div class="sub">'+DAYS[(SV.pday||0)%7]+'</div><div class="grid">'+
   APPS.map((a,i)=>'<div class="ic'+(i==sel?' on':'')+'" data-i="'+i+'">'+a.i+'<small>'+a.n+'</small></div>').join('')+'</div>'}
 else if(view=='contacts'){
  const cs=contacts();
  h='<h4>Contatos</h4>'+(cs.length?cs.map((c,i)=>'<div class="it'+(i==sel?' on':'')+'" data-i="'+i+'"><b style="color:'+c.c+'">'+c.n+'</b><small>'+c.r+'</small></div>').join(''):'<div class="box">Nenhum contato salvo.</div>')}
 else if(view=='bank'){
  h='<h4>Banco</h4><div class="box">Dinheiro na mão: <b>'+fmt(S.money)+'</b><br>Na conta: <b>'+fmt(SV.bank)+'</b><br><small>Dinheiro na conta é protegido se você morrer.</small></div>'+
   ['Depositar tudo','Sacar tudo'].map((t,i)=>'<div class="it'+(i==sel?' on':'')+'" data-i="'+i+'">'+t+'</div>').join('')+(note?'<div class="box">'+note+'</div>':'')}
 else if(view=='mission'){
  h='<h4>Missão</h4><div class="box">'+(free()?'':'Capítulo '+((SV.ch||0)+1)+'<br>')+objText()+'</div>'}
 else if(view=='save'){h='<h4>Salvar</h4><div class="box">'+note+'</div>'}
 else if(view=='call'&&call){
  const n=shown(),dialing=callT<DIAL,over=n>=call.L.length;
  const state=dialing?'Chamando…':call.mail?'Caixa postal':over?'Chamada encerrada':'Em chamada';
  h='<div class="av" style="background:'+call.c.c+'">'+call.c.n[0]+'</div><div class="big" style="font-size:22px;margin:0">'+call.c.n+'</div><div class="sub">'+state+'</div>'+
   call.L.slice(0,n).slice(-4).map(l=>l[0]==2?'<div class="box sys">'+l[1]+'</div>'
    :'<div class="box'+(l[0]==0?' me':'')+'" style="border-left:3px solid '+(l[0]==0?'#7fd0ff':call.c.c)+'"><small>'+(l[0]==0?meName():call.c.n)+'</small>'+l[1]+'</div>').join('')+
   '<div class="sub" style="margin-top:10px">clique / ⌫ para desligar</div>'}
 $p('phb').innerHTML=h;
 const bd=$p('phb');bd.scrollTop=bd.scrollHeight}

/* ---------- entradas ---------- */
addEventListener('mousedown',e=>{                                   // rodinha (clique): abre/fecha
 if(e.button!=1)return;e.preventDefault();
 if(open)return close();
 const w=$p('wheel'),sh=$p('armaria');
 if(w&&w.style.display=='block'||sh&&sh.style.display=='grid')return;
 openP()},true);
addEventListener('auxclick',e=>{if(e.button==1)e.preventDefault()},true);

addEventListener('mousedown',e=>{                                   // celular aberto: esquerdo = escolher, direito = voltar (não atira/mira)
 if(!open||(e.button!=0&&e.button!=2))return;
 e.stopImmediatePropagation();
 if(e.target.closest&&e.target.closest('#phone'))return;             // cursor livre: o clique no item trata
 e.preventDefault();try{MB.l=MB.r=0}catch(x){}
 if(e.button==0)act();else back()},true);
addEventListener('mouseup',e=>{if(open&&(e.button==0||e.button==2))e.stopImmediatePropagation()},true);
addEventListener('contextmenu',e=>{if(open)e.preventDefault()},true);

let wlast=0;
addEventListener('wheel',e=>{                                       // rodinha gira: frente = próximo, trás = anterior (não dá zoom na câmera)
 if(!open)return;e.preventDefault();e.stopImmediatePropagation();
 const now=performance.now(),n=items().length;
 if(now-wlast<110||!n||view=='call')return;wlast=now;
 sel=(sel+(e.deltaY>0?1:-1)+n)%n;beep(450);render()},{capture:true,passive:false});   // INVERTIDO: trás = próximo/direita. Para voltar ao normal, troque > por <

addEventListener('keydown',e=>{
 if(!open)return;
 const k=e.code,n=items().length,cols=view=='home'?3:1;
 if(k=='Backspace'){e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;return back()}
 if(k=='Enter'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&view!='call')act();return}
 const d=k=='ArrowRight'?1:k=='ArrowLeft'?-1:k=='ArrowDown'?cols:k=='ArrowUp'?-cols:0;
 if(!d)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(!n||view=='call')return;
 const mv=sel+d;if(mv>=0&&mv<n){sel=mv;beep(450);render()}},true);
root.addEventListener('click',e=>{
 const t=e.target.closest('[data-i]');
 if(!t){if(view=='mission'||view=='save'||view=='call')back();return}
 sel=+t.dataset.i;act()});

/* ---------- laço ---------- */
const _up=update;update=function(dt){
 _up(dt);dayTick();
 if(!open)return;
 if(pl.dead||!run)return close();
 const e=$p('phd');if(e)statusBar();
 const b=$p('phbig');if(b)b.textContent=clockText();
 if(view=='call'&&call){
  callT+=dt;const n=shown();
  if(n!==call.n){if(call.n>=0&&n>call.n)beep(520);call.n=n;render()}
  if(callT>call.end)back()}};

if(window.UI)UI.add(()=>open,close,1);
window.PHONE={open:openP,close,CONTACTS,BOOK,D,unlock,onCall:null};
})();