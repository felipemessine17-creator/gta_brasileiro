'use strict';
/* lojaarmas.js — carregar POR ÚLTIMO (depois do armas.js).
   - Escopeta, Fuzil e Faca ganham mecânica (WP[3], WP[4], WP[5]).
   - Modo Livre: todas as armas liberadas, munição infinita (∞). Modo História: começa sem arma; progresso salvo (SV.ws).
   - Duas Armarias (cópias idênticas) em quarteirões diferentes: E no balcão abre a loja (↑↓ escolhe, Enter compra, Esc/E sai).
   - Soco/faca: animação de golpe + reação do NPC (tranco, tombo curto e faísca). */
(()=>{
const NX=window.NX,SY=window.SY,SV=SY.SV||{};
const WPI={fist:0,pistol:1,smg:2,shotgun:3,rifle:4,knife:5};
WP[3]={n:'Escopeta',dmg:13,dd:70,rate:.85,mag:6,sp:.055};     // 8 chumbinhos por tiro; dd = dano mostrado na roda
WP[4]={n:'Fuzil',dmg:48,rate:.14,mag:30,sp:.004};
WP[5]={n:'Faca',rate:.38,mag:0};
const CAT=SY.weapons.CAT;for(const c of CAT)if(WPI[c.id]!=null)c.wp=WPI[c.id];
pl.mg=[0,12,30,6,30,0];pl.am=[0,0,0,0,0,0];

/* ---------- PREÇOS (mexa à vontade): p = arma, pack = balas por pacote, pp = preço do pacote ---------- */
const ITEMS=[
 {id:'knife',  n:'Faca',     p:150},
 {id:'pistol', n:'Pistola',  p:600, pack:24,pp:90},
 {id:'shotgun',n:'Escopeta', p:1400,pack:12,pp:150},
 {id:'smg',    n:'SMG',      p:2200,pack:60,pp:180},
 {id:'rifle',  n:'Fuzil',    p:4500,pack:60,pp:320}];
const AMMO_MAX=400,free=()=>window.GAME_MODE=='free',owned=id=>{const c=CAT.find(c=>c.id==id);return !!(c&&c.own)};

/* ---------- modo: libera tudo (livre) ou zera (história) ---------- */
let applied=false;
function apply(){applied=true;
 if(free()){for(const c of CAT)c.own=true;pl.mg=[0,12,30,6,30,0];pl.am=[0,9999,9999,9999,9999,0];return}
 const ws=SV.ws||{},own=ws.own||[];
 for(const c of CAT)c.own=c.id=='fist'||own.includes(c.id);
 pl.mg=(ws.mg||[]).slice();pl.am=(ws.am||[]).slice();
 while(pl.mg.length<6)pl.mg.push(0);while(pl.am.length<6)pl.am.push(0);
 pl.w=0}
let svT=0;
function saveW(dt){svT-=dt;if(svT>0||window.GAME_MODE!='story')return;svT=1;
 SV.ws={own:CAT.filter(c=>c.own&&c.id!='fist').map(c=>c.id),mg:pl.mg.slice(),am:pl.am.slice()}}

/* ---------- golpes: soco, faca e escopeta ---------- */
const react=(q,dx,dz)=>{q.flin=.24;q.pos.x+=dx*.5;q.pos.z+=dz*.5;
 for(let i=0;i<4;i++)emit(V3(q.pos.x,1.3,q.pos.z),V3(rr(-2,2),rr(1,3),rr(-2,2)),0xffffff,.22,.3,0,-8);nz(.08,.18,500)};
const startPun=()=>{pl.pun=.28;pl.ps=(pl.ps||0)^1};
const _s0=shoot;
shoot=function(){const p=pl,ok=p.cd<=0&&p.rel<=0&&!p.dead&&!p.car;
 if(p.w===5){                                           // faca
  if(p.cd>0||p.dead||p.car)return;p.cd=WP[5].rate;p.sh=.5;p.kick=.6;startPun();
  const fx=Math.sin(p.ry),fz=Math.cos(p.ry);
  for(const q of peds)if(!q.dead&&Math.hypot(q.pos.x-p.pos.x-fx*1.2,q.pos.z-p.pos.z-fz*1.2)<1.3){hurtPed(q,55,true);react(q,fx,fz)}
  return}
 if(p.w===3&&ok&&p.mg[3]>0){                            // escopeta: 8 chumbinhos gastando 1 cartucho
  const m=p.mg[3];_s0();for(let k=0;k<7;k++){p.cd=0;_s0();p.mg[3]=m-1}p.cd=WP[3].rate;return}
 if(p.w===0&&ok){                                       // soco
  const fx=Math.sin(p.ry),fz=Math.cos(p.ry),near=peds.filter(q=>!q.dead&&Math.hypot(q.pos.x-p.pos.x,q.pos.z-p.pos.z)<3).map(q=>[q,q.hp]);
  _s0();startPun();for(const[q,h]of near)if(q.hp<h)react(q,fx,fz);return}
 _s0()};

const _an=anim;anim=function(p,sp,dt,o){_an(p,sp,dt,o);if(p!==P)return;
 if(pl.pun>0){const e=Math.sin(Math.min(1,1-pl.pun/.28)*Math.PI),a=pl.ps?p.aR:p.aL,c=pl.ps?p.aL:p.aR,s=pl.ps?1:-1;
  a.rotation.x=-1.55*e-.1;a.rotation.z=s*-.12*e;c.rotation.x=.5*e;p.t.rotation.y=s*.45*e}
 else p.t.rotation.y=0};

/* ---------- Armarias: acha dois quarteirões livres e monta a loja ---------- */
const PAL=[0xe3d3b4,0xd9a38f,0xc9d6c0,0xbfc4cf,0xeadfc8,0xb98f7a];
const FM={},fm=c=>FM[c]||(FM[c]=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.32,roughness:.75})),
 GLS=new THREE.MeshStandardMaterial({color:0x8fc4ee,transparent:true,opacity:.22,roughness:.05,metalness:.4,depthWrite:false}),LM=new THREE.MeshBasicMaterial({color:0xfff2cf});
function freeBlock(tx,tz,used){let best=null,bd=1e9;const TB=window.THEO_BLD;
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){if(park[i][j])continue;
  const cx=(i-N/2+.5)*B,cz=(j-N/2+.5)*B;
  if(used.some(u=>u[0]==cx&&u[1]==cz))continue;
  if(window.ZN&&ZN.zone(cx,cz)!='cid')continue;
  if(Math.abs(cz)<48||Math.abs(cx+160)<40&&Math.abs(cz+32)<40)continue;                       // Paulista e torre do Felipe
  if(TB&&Math.hypot(cx-TB.CX,cz-(TB.CZ-8))<40)continue;                                       // quarteirão do Theo
  if(cx+24>110&&cx-24<145&&cz+24>-240&&cz-24<-140)continue;                                   // viaduto
  if(cx+24>0&&cx-24<64&&cz+24>175&&cz-24<210)continue;                                        // túnel
  if(BL.some(b=>b.k&&(b.x0+b.x1)/2>cx-24&&(b.x0+b.x1)/2<cx+24&&(b.z0+b.z1)/2>cz-24&&(b.z0+b.z1)/2<cz+24))continue;   // posto, loja, galpão
  const d=Math.hypot(cx-tx,cz-tz);if(d<bd){bd=d;best=[cx,cz]}}
 return best}
const SHOPS=[];
function mkShop(cx,cz){
 NX.clear(cx-24,cx+24,cz-24,cz+24); if(window.stripDecor)stripDecor(cx-22.5,cx+22.5,cz-22.5,cz+22.5,999);   // some sacadas/toldos/telhadinhos soltos dos prédios apagados
 {const zero=new THREE.Matrix4().makeScale(0,0,0),m=new THREE.Matrix4();     // some antena/caixa d'água que ficou flutuando
  scene.traverse(o=>{if(!o.isInstancedMesh)return;let ch=0;for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);const e=m.elements;if((e[13]>4&&Math.abs(e[12]-cx)<25&&Math.abs(e[14]-cz)<25)||(Math.abs(e[12]-cx)<8.5&&e[14]>cz-1&&e[14]<cz+13)){o.setMatrixAt(i,zero);ch=1}}if(ch)o.instanceMatrix.needsUpdate=true})}
 building(cx,cz-17,48,14,rr(10,16),pk(PAL));building(cx,cz-5,14,10,rr(9,13),pk(PAL));
 building(cx-15.5,cz+1,17,22,rr(10,18),pk(PAL));building(cx+15.5,cz+1,17,22,rr(10,18),pk(PAL));
 const W=14,D=12,H=4.6,z1=cz+D,wc=fm(0x8a7a66),S=(x,z,w,d,h,m,y,hit)=>{const o=NX.solid(x,z,w,d,h,m,y||0,hit!==false);o.castShadow=false;return o},
  cl=(w,h,d,c,x,y,z,hit)=>S(cx+x,cz+z,w,d,h,fm(c),y,!!hit);
 S(cx,cz+.2,W,.4,H,wc);S(cx-6.8,cz+D/2,.4,D,H,wc);S(cx+6.8,cz+D/2,.4,D,H,wc);
 for(const s of[-1,1]){                                                      // fachada: pilar, vitrine com vidro, porta no meio (2,6 m)
  S(cx+s*5.6,z1-.2,2.8,.4,H,wc);
  S(cx+s*2.75,z1-.2,3,.4,1,wc);S(cx+s*2.75,z1-.2,3,.2,2.4,GLS,1);S(cx+s*2.75,z1-.2,3,.4,H-3.4,wc,3.4,false)}
 S(cx,z1-.2,2.6,.4,H-2.6,wc,2.6,false);
 S(cx,cz+D/2,W+.4,D+.4,.3,fm(0x555a60),H,false);
 NX.ground(W-.8,D-.8,fm(0x5a5d63),cx,.06,cz+D/2);NX.ground(2.6,6,fm(0x7a1f1f),cx,.07,cz+8.8);          // piso + tapete vermelho da porta ao balcão
 for(const x of[-4,0,4])for(const z of[3,8]){const l=new THREE.Mesh(new THREE.BoxGeometry(2.2,.05,.25),LM);l.position.set(cx+x,H-.1,cz+z);scene.add(l)}
 NX.plane(6,.8,NX.signM('ARMARIA — ARMAS & MUNIÇÃO','#ffd23f','#1a1a1a',512,64),cx,4.0,z1+.03,0);
 /* fundo: parede de armas. Cada modelo é MEDIDO e encaixado no seu espaço (nada atravessa nada) */
 S(cx,cz+.5,13.2,.1,3.5,fm(0x23262c),.5,false);
 const BMOD=SY.weapons.B;
 if(BMOD){const slots={shotgun:[-3.4,3.55,5.2,.6],rifle:[3.4,3.55,5.2,.6],knife:[-4.4,2.4,2.2,.5],pistol:[0,2.4,2.2,.5],smg:[4.4,2.4,2.2,.5]};   // [x, y do centro, largura máx, altura máx]
  for(const it of ITEMS){const mm=BMOD[it.id](),sl=slots[it.id],r=mm.root;if(mm.flash&&mm.flash.parent)mm.flash.parent.remove(mm.flash);
   r.position.set(0,0,0);r.scale.set(1,1,1);r.rotation.set(0,0,0);r.updateMatrixWorld(true);
   const bx=new THREE.Box3(),sz=new THREE.Vector3(),c=new THREE.Vector3();
   bx.setFromObject(r).getSize(sz);if(sz.z>sz.x){r.rotation.y=Math.PI/2;r.updateMatrixWorld(true);bx.setFromObject(r).getSize(sz)}
   r.scale.setScalar(Math.min(1.9,sl[2]/Math.max(sz.x,.01),sl[3]/Math.max(sz.y,.01)));r.updateMatrixWorld(true);
   bx.setFromObject(r);bx.getSize(sz);bx.getCenter(c);
   r.position.set(cx+sl[0]-c.x,sl[1]-c.y,cz+.7+sz.z/2-c.z);scene.add(r);
   S(cx+sl[0],cz+.6,sz.x+.5,.04,sz.y+.3,fm(0x3b3f47),sl[1]-sz.y/2-.15,false);                    // plaquinha atrás da arma
   NX.plane(1.5,.26,NX.signM(it.n.toUpperCase()+'  R$'+it.p,'#ffd23f','#10131a',384,64),cx+sl[0],sl[1]-sz.y/2-.4,cz+.6,0)}}
 /* balcão de parede a parede, atendente atrás (ao lado do centro para não tapar os preços) */
 S(cx,cz+5.2,13.2,1,1.05,fm(0x3b2f26));S(cx,cz+5.2,13.2,1.3,.08,fm(0x1c1c1f),1.05,false);
 cl(.5,.32,.4,0x2c2c2c,-2.6,1.13,5.1);cl(.34,.02,.26,0x7dff8a,-2.6,1.46,5.0);                      // caixa registradora
 NX.plane(3.4,.5,NX.signM('MUNIÇÃO — PERGUNTE NO BALCÃO','#fff','#8a1f1f',512,64),cx,.55,cz+5.73,0);
 {const ax=2.2;cl(.2,.6,.2,0x1a1a1a,ax-.3,0,3.4);cl(.2,.6,.2,0x1a1a1a,ax+.3,0,3.4);cl(.8,.7,.3,0x2d4a2d,ax,.6,3.4);cl(.28,.28,.28,0xe0b090,ax,1.3,3.4);cl(.34,.1,.34,0x1a1a1a,ax,1.58,3.4)}
 /* prateleiras de munição encostadas nas paredes laterais (lado do atendente, sem encostar no balcão nem na parede de armas) */
 for(const sx of[-1,1]){cl(.18,2.4,3.4,0x3b2f26,sx*6.46,0,2.5);
  for(let k=0;k<3;k++){const yb=.5+k*.8;cl(.5,.05,3.4,0x6b4a2b,sx*6.12,yb,2.5);
   for(let i=0;i<6;i++)cl(.3,.2,.4,[0xc0392b,0x27ae60,0xf1c40f,0x2980b9][(i+k)%4],sx*6.12,yb+.05,1.0+i*.55)}}
 /* lado do cliente: duas vitrines com munição DENTRO do vidro, e cartazes */
 for(const x of[-4.2,4.2]){cl(2.2,.95,.9,0x3b2f26,x,0,9.4,1);S(cx+x,cz+9.4,2.3,1,.5,GLS,.95,false);
  for(let i=0;i<4;i++)cl(.35,.15,.3,[0xc0392b,0x27ae60,0xf1c40f,0x2980b9][i],x-.8+i*.55,.98,9.4)}
 NX.plane(1.6,.9,NX.signM('PROCURADO: BOM PREÇO','#fff','#8a1f1f',384,192),cx-6.57,2.3,cz+9,Math.PI/2);
 NX.plane(1.6,.9,NX.signM('NÃO FIAMOS','#1a1a1a','#ffd23f',384,192),cx+6.57,2.3,cz+9,-Math.PI/2);
 SHOPS.push({cx,cz});SY.markers.push({x:cx,z:cz+16,l:'gun',c:'#ffb02e'})}
{const used=[];for(const t of[[-100,130],[200,110]]){const b=freeBlock(t[0],t[1],used);if(b){used.push(b);mkShop(b[0],b[1])}}}
const nearShop=()=>SHOPS.some(s=>Math.hypot(pl.pos.x-s.cx,pl.pos.z-(s.cz+7))<5.2&&pl.pos.y<3);

/* ---------- menu de compra (teclado) ---------- */
{const st=document.createElement('style');st.textContent=`#armaria{position:fixed;inset:0;z-index:30;display:none;place-items:center;background:#000a}
#armaria .ab{width:min(560px,94vw);background:#14161c;border-radius:14px;padding:22px 26px}#armaria h2{letter-spacing:3px;text-transform:uppercase}
#armaria .mo{color:#7dff8a;font-size:20px;margin:4px 0 10px}#armaria .r{display:flex;justify-content:space-between;padding:8px 12px;margin:4px 0;border-radius:8px;background:#1d2029;border:2px solid transparent;font-weight:400}
#armaria .r.on{border-color:#ffd23f;background:#262a35}#armaria .r.off{opacity:.45}#armaria .h{opacity:.7;margin-top:10px;font-size:13px;font-weight:400}#armaria .f{min-height:20px;color:#ffd23f;margin-top:6px}`;
 document.head.appendChild(st)}
const sh=document.createElement('div');sh.id='armaria';sh.innerHTML='<div class="ab"><h2>Armaria</h2><div class="mo" id="amo"></div><div id="arows"></div><div class="f" id="afl"></div><div class="h">↑ ↓ escolhe · Enter compra · Esc ou E sai</div></div>';document.body.appendChild(sh);
let open=false,sel=0,lock=false,rows=[];
const flash=t=>{document.getElementById('afl').textContent=t};
function render(){rows=[];for(const it of ITEMS){rows.push({k:'w',it});if(it.pack)rows.push({k:'a',it})}
 if(sel>=rows.length)sel=0;document.getElementById('amo').textContent='R$ '+S.money;
 document.getElementById('arows').innerHTML=rows.map((r,i)=>{const it=r.it,ow=owned(it.id),wp=WPI[it.id];let l,rt,off=0;
  if(r.k=='w'){l=it.n;rt=ow?'COMPRADA':'R$ '+it.p}else{l='&nbsp;&nbsp;↳ Munição '+it.n+' (+'+it.pack+')';rt='R$ '+it.pp+' · você tem '+(pl.am[wp]+pl.mg[wp]);off=!ow}
  return'<div class="r'+(i==sel?' on':'')+(off?' off':'')+'"><span>'+l+'</span><b>'+rt+'</b></div>'}).join('')}
function openShop(){if(free()){msg('Modo Livre: todas as armas já estão liberadas');return}
 open=true;lock=!!document.pointerLockElement;run=false;for(const k in K)K[k]=false;MB.l=MB.r=0;flash('');sh.style.display='grid';render()}
function closeShop(noRun){if(!open)return;open=false;sh.style.display='none';if(!noRun)run=lock?!!document.pointerLockElement:true}
function buy(r){const it=r.it,wp=WPI[it.id],ow=owned(it.id);
 if(r.k=='w'){if(ow)return flash('Você já tem essa arma');if(S.money<it.p)return flash('Dinheiro insuficiente');
  S.money-=it.p;SY.weapons.unlock(it.id,0);if(WP[wp].mag)pl.mg[wp]=WP[wp].mag;SY.weapons.equip(it.id);flash('Comprou '+it.n+' (R$'+it.p+')')}
 else{if(!ow)return flash('Compre a arma antes');if(pl.am[wp]>=AMMO_MAX)return flash('Munição cheia');if(S.money<it.pp)return flash('Dinheiro insuficiente');
  S.money-=it.pp;pl.am[wp]=Math.min(AMMO_MAX,pl.am[wp]+it.pack);flash('+'+it.pack+' balas de '+it.n)}
 render()}
addEventListener('keydown',e=>{if(!open)return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
 if(e.code=='Escape'||e.code=='KeyE'||e.code=='Backspace')closeShop();
 else if(e.code=='ArrowDown'||e.code=='KeyS'){sel=(sel+1)%rows.length;render()}
 else if(e.code=='ArrowUp'||e.code=='KeyW'){sel=(sel+rows.length-1)%rows.length;render()}
 else if(e.code=='Enter'||e.code=='Space')buy(rows[sel])},true);
addEventListener('keydown',e=>{if(e.code=='KeyE'&&!e.repeat&&run&&!open&&!pl.car&&!pl.dead&&nearShop())openShop()});
document.addEventListener('pointerlockchange',()=>{if(open&&!document.pointerLockElement)closeShop(true)});
if(window.UI)UI.add(()=>open,()=>closeShop(true),3);

/* ---------- laço: modo, ∞, HUD, reação dos NPCs, aviso da loja ---------- */
const _up=update;update=function(dt){
 if(!applied&&window.GAME_MODE)apply();
 if(open)dt=0;
 _up(dt);
 if(pl.pun>0)pl.pun-=dt;
 if(!pl.dead){const s_=.42,sy_=Math.sin(cy),co_=Math.cos(cy);for(const sh of SHOPS){const dx=sh.cx-pl.pos.x,dz=sh.cz+16-pl.pos.z,x=85+(-dx*co_+dz*sy_)*s_,y=85-(dx*sy_+dz*co_)*s_;if(Math.hypot(x-85,y-85)>74)continue;SY.gunIcon(mm,x,y,.8,'#ffb02e')}}
 if(applied){if(free())for(let i=1;i<5;i++)pl.am[i]=9999;saveW(dt)}
 for(const q of peds)if(q.flin>0){q.flin-=dt;if(!q.dead)q.g.rotation.x=q.flin>0?-.55*Math.sin(Math.min(1,q.flin/.24)*Math.PI):0}
 if(!pl.car){const w=pl.w,e=document.getElementById('wp');
  if(w===5)e.textContent='Faca';
  else if(w>0&&free())e.textContent=WP[w].n+'  '+pl.mg[w]+' / ∞'+(pl.rel>0?'  (recarregando)':'')}
 if(!open&&!pl.car&&!pl.dead&&nearShop())document.getElementById('pr').textContent=free()?'Armaria (Modo Livre: tudo liberado)':'E — Armaria: comprar armas e munição'};
})();