'use strict';
/* armas.js — modelos 3D das armas + roda de armas (estilo GTA V). Carregar por último (depois do intro.js).
   - O jogador começa de PUNHOS (pl.w=0). Segure TAB para abrir a roda; o mouse escolhe; soltar TAB (ou clicar) equipa.
     Atalhos 1–6 também funcionam. O tempo fica em câmera lenta enquanto a roda está aberta.
   - Modelos: pistola e SMG de verdade (ferrolho, cano, mira, carregador, empunhadura...). Escopeta, fuzil e faca já têm
     modelo e ícone, mas ficam TRANCADOS até a loja de armas existir: quando ela existir, chame SY.weapons.unlock('shotgun').
   - Os ícones da roda são fotografados dos próprios modelos 3D (nada de imagem externa). */
(()=>{
const SY=window.SY=window.SY||{};

/* ---------- catálogo (a ordem = posição na roda e tecla 1–6). wp = índice no array WP do script.js (null = ainda sem mecânica) ---------- */
const CAT=[
 {id:'fist',   n:'Punhos',    k:'Corpo a corpo',   wp:0,   own:true, d:'Sem arma. Resolve na mão, mas só serve pra desacatar.',st:[.15,.45,.6,0]},
 {id:'pistol', n:'Pistola',   k:'Pistolas',        wp:1,   own:true, d:'Compacta e precisa. Boa pra tiro certeiro e fuga rápida.'},
 {id:'smg',    n:'SMG',       k:'Submetralhadoras',wp:2,   own:true, d:'Cadência alta e carregador grande. Segura a onda no aperto.'},
 {id:'shotgun',n:'Escopeta',  k:'Espingardas',     wp:null,own:false,d:'Dano devastador de perto. Disponível na loja de armas.',st:[.95,.25,.3,.2]},
 {id:'rifle',  n:'Fuzil',     k:'Fuzis',           wp:null,own:false,d:'Alcance e potência. Disponível na loja de armas.',st:[.7,.75,.8,.9]},
 {id:'knife',  n:'Faca',      k:'Corpo a corpo',   wp:null,own:false,d:'Silenciosa e rápida. Disponível na loja de armas.',st:[.35,.7,1,0]}];
const byId=id=>CAT.find(c=>c.id==id);const AMS=v=>v>=999?'∞':v;
const curI=()=>{const i=CAT.findIndex(c=>c.wp===pl.w&&c.own);return i<0?0:i};
const curId=()=>CAT[curI()].id;

/* ---------- modelos ----------
   Convenção do modelo: frente = +Z, topo = +Y, lado = X, origem = a empunhadura (onde fica a mão). */
const MT=(c,m,r)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r});
const M={steel:MT(0x4a505a,.5,.38),dark:MT(0x23262c,.3,.55),poly:MT(0x2c2e33,.1,.85),chrome:MT(0xaab0b8,.6,.25),wood:MT(0x8a5a2b,.05,.75),skin:MT(0xd9a77f,0,.9)};
const bxg=(g,w,h,d,m,x,y,z,rx)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);if(rx)o.rotation.x=rx;g.add(o);return o};
const cyg=(g,r,l,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,12),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);g.add(o);return o};   // eixo ao longo de Z
function muzzle(g,y,z){const m=new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}),f=new THREE.Group();
 const c=new THREE.Mesh(new THREE.ConeGeometry(.03,.15,8),m);c.rotation.x=Math.PI/2;c.position.z=.075;f.add(c);f.add(new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),m));
 f.position.set(0,y,z);f.visible=false;g.add(f);return f}

const B={
 pistol(){const g=new THREE.Group();
  bxg(g,.034,.036,.2,M.steel,0,.082,.07);                                       // ferrolho
  for(let i=0;i<4;i++)bxg(g,.037,.028,.004,M.dark,0,.084,-.012+i*.011);         // serrilha
  bxg(g,.03,.028,.17,M.dark,0,.052,.055);                                       // armação
  bxg(g,.032,.1,.048,M.poly,0,-.003,-.022,.2);                                  // empunhadura
  bxg(g,.028,.01,.046,M.steel,0,-.058,-.034,.2);                                // base do carregador
  bxg(g,.02,.007,.052,M.dark,0,.03,.1);bxg(g,.02,.03,.007,M.dark,0,.044,.125);  // guarda-mato
  bxg(g,.01,.022,.007,M.chrome,0,.044,.088);                                    // gatilho
  cyg(g,.009,.03,M.dark,0,.083,.175);                                           // boca do cano
  bxg(g,.006,.011,.012,M.dark,0,.105,.16);bxg(g,.022,.009,.012,M.dark,0,.104,-.018);   // massa e alça de mira
  return{root:wrap(g,1.5),flash:muzzle(g,.083,.19),two:true,low:0}},
 smg(){const g=new THREE.Group();
  bxg(g,.052,.07,.3,M.steel,0,.06,.1);                                          // receptor
  bxg(g,.034,.012,.28,M.dark,0,.101,.1);                                        // trilho
  bxg(g,.056,.062,.15,M.poly,0,.052,.275);                                      // guarda-mão
  for(let i=0;i<4;i++)bxg(g,.058,.05,.006,M.dark,0,.052,.22+i*.03);             // ventilação
  cyg(g,.011,.14,M.dark,0,.07,.42);cyg(g,.017,.05,M.dark,0,.07,.5);             // cano e quebra-chamas
  bxg(g,.008,.032,.01,M.dark,0,.12,.46);bxg(g,.03,.022,.012,M.dark,0,.118,-.02);// mira
  bxg(g,.04,.1,.046,M.poly,0,-.01,-.02,.28);                                    // empunhadura
  bxg(g,.03,.09,.036,M.poly,0,-.027,.3);                                        // empunhadura frontal
  bxg(g,.03,.09,.04,M.steel,0,-.03,.15,-.1);bxg(g,.03,.09,.04,M.steel,0,-.115,.172,-.3);   // carregador curvo
  bxg(g,.02,.007,.07,M.dark,0,.015,.065);bxg(g,.02,.03,.007,M.dark,0,.03,.1);bxg(g,.01,.022,.007,M.chrome,0,.03,.05);
  for(const s of[-1,1])bxg(g,.01,.01,.22,M.steel,s*.02,.07,-.16);               // coronha de arame
  bxg(g,.05,.075,.014,M.poly,0,.065,-.275);
  bxg(g,.012,.012,.03,M.steel,.032,.075,.06);                                   // alavanca de armar
  return{root:wrap(g,1.25),flash:muzzle(g,.07,.53),two:true,low:1}},
 shotgun(){const g=new THREE.Group();
  cyg(g,.014,.66,M.steel,0,.075,.38);cyg(g,.012,.48,M.steel,0,.04,.3);          // cano e tubo do carregador
  bxg(g,.046,.075,.22,M.steel,0,.06,.04);                                       // receptor
  bxg(g,.052,.05,.2,M.wood,0,.03,.28);                                          // pump
  bxg(g,.04,.09,.04,M.wood,0,-.01,-.03,.25);                                    // empunhadura
  bxg(g,.04,.085,.3,M.wood,0,.03,-.24,-.12);bxg(g,.044,.09,.012,M.dark,0,.03,-.395,-.12);   // coronha
  bxg(g,.008,.012,.012,M.dark,0,.097,.7);bxg(g,.02,.007,.07,M.dark,0,.015,.04);bxg(g,.01,.022,.007,M.chrome,0,.03,.03);
  return{root:wrap(g,1.1),flash:muzzle(g,.075,.72),two:true,low:1}},
 rifle(){const g=new THREE.Group();
  bxg(g,.048,.065,.32,M.steel,0,.06,.1);cyg(g,.011,.34,M.steel,0,.07,.45);cyg(g,.008,.3,M.steel,0,.105,.4);   // receptor, cano, tubo de gás
  bxg(g,.05,.045,.22,M.wood,0,.045,.3);bxg(g,.044,.02,.2,M.wood,0,.098,.3);     // guarda-mão
  cyg(g,.016,.045,M.dark,0,.07,.64);bxg(g,.008,.04,.01,M.dark,0,.115,.62);bxg(g,.03,.02,.01,M.dark,0,.105,0);
  bxg(g,.04,.1,.045,M.poly,0,-.01,-.02,.3);
  bxg(g,.032,.1,.045,M.steel,0,-.04,.17,-.15);bxg(g,.032,.1,.045,M.steel,0,-.13,.2,-.45);   // carregador curvo
  bxg(g,.04,.085,.28,M.wood,0,.04,-.22,-.08);bxg(g,.044,.09,.012,M.dark,0,.04,-.365,-.08);
  bxg(g,.02,.007,.07,M.dark,0,.015,.065);bxg(g,.01,.022,.007,M.chrome,0,.03,.05);
  return{root:wrap(g,1.1),flash:muzzle(g,.07,.67),two:true,low:1}},
 knife(){const g=new THREE.Group();
  bxg(g,.008,.04,.2,M.chrome,0,.02,.14);bxg(g,.008,.028,.028,M.chrome,0,.032,.255,.78);   // lâmina
  bxg(g,.026,.034,.11,M.poly,0,0,.01);bxg(g,.044,.012,.01,M.steel,0,.02,.07);             // cabo e guarda
  return{root:wrap(g,1.6),flash:null,two:false,low:0}},
 fist(){const g=new THREE.Group();
  bxg(g,.1,.08,.1,M.skin,0,0,0);for(let i=0;i<4;i++)bxg(g,.022,.05,.05,M.skin,-.039+i*.026,0,.075);bxg(g,.025,.025,.06,M.skin,.058,-.02,.03);
  return{root:wrap(g,1),flash:null,two:false,low:0}}};
function wrap(g,s){const o=new THREE.Group();o.add(g);o.scale.setScalar(s);return o}

/* ---------- ícones: foto 3D de cada modelo ---------- */
const ICO={};
(()=>{let R=null;
 try{R=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});R.setSize(320,160);R.setClearColor(0x000000,0)}catch(e){R=null}
 for(const c of CAT){ICO[c.id]='';if(!R)continue;try{
  const sc=new THREE.Scene(),m=B[c.id]();if(m.flash)m.flash.visible=false;sc.add(m.root);
  sc.add(new THREE.HemisphereLight(0xffffff,0x666677,1.15));const d=new THREE.DirectionalLight(0xffffff,1.3);d.position.set(-2,3,-1.5);sc.add(d);
  const d2=new THREE.DirectionalLight(0x9fb4ff,.6);d2.position.set(2,1,2);sc.add(d2);
  const bb=new THREE.Box3().setFromObject(m.root),ce=bb.getCenter(new THREE.Vector3()),s=bb.getSize(new THREE.Vector3());
  const hw=(Math.max(s.z*.58,s.y*1.2)+.02)*1.12,hh=hw/2,cm=new THREE.OrthographicCamera(-hw,hw,hh,-hh,.01,50);
  cm.position.copy(ce).addScaledVector(new THREE.Vector3(-1,.35,-.45).normalize(),4);cm.lookAt(ce);
  R.render(sc,cm);ICO[c.id]=R.domElement.toDataURL('image/png')}catch(e){ICO[c.id]=''}}
 if(R){R.dispose();if(R.forceContextLoss)R.forceContextLoss()}})();

/* ---------- na mão do personagem ---------- */
P.aR.remove(P.gun);
const hold=new THREE.Group();hold.position.set(0,-.58,0);hold.rotation.x=Math.PI/2;       // eixo do braço (-y local) vira a frente do modelo
P.aR.add(hold);P.gun=hold;
const MD={};for(const id of['pistol','smg','shotgun','rifle','knife']){const m=B[id]();m.root.visible=false;hold.add(m.root);MD[id]=m}
const _an2=anim;anim=function(p,sp,dt,o){_an2(p,sp,dt,o);if(p!==P)return;
 const id=curId(),m=MD[id];for(const k in MD){MD[k].root.visible=k==id;if(MD[k].flash)MD[k].flash.visible=k==id&&pl.sh>.8&&pl.w>0}
 p.aR.rotation.z=p.aL.rotation.z=0;
 if(pl.w>0&&m&&o.gun){
  const two=m.two,aim=o.aim;
  if(aim){if(two){p.aL.rotation.x=-1.45;p.aL.rotation.z=.55}}
  else{p.aR.rotation.x=-.8+Math.sin(p.ph)*.04*Math.min(sp/3.5,1.2);if(m.low){p.aL.rotation.x=-1.05;p.aL.rotation.z=.5}}   // posição baixa: pistola numa mão, armas longas nas duas
  if(pl.rel>0){p.aR.rotation.x=-.85;p.aL.rotation.x=-1.1;p.aL.rotation.z=.65}                                            // recarregando
 }
 hold.position.y=-.58+Math.min(pl.kick,1)*.05};                                                                           // coice

/* ---------- primeira pessoa: arma na frente da câmera ---------- */
const vmG=new THREE.Group();scene.add(cam);cam.add(vmG);vmG.position.set(.2,-.2,-.45);vmG.rotation.y=Math.PI;vmG.scale.setScalar(.9);
const VM={};for(const id of['pistol','smg','shotgun','rifle','knife']){const m=B[id]();m.root.visible=false;vmG.add(m.root);VM[id]=m}
function vmTick(){const show=pl.fp&&!pl.car&&!pl.dead&&!open&&pl.w>0;vmG.visible=show;if(!show)return;const id=curId();
 for(const k in VM){VM[k].root.visible=k==id;if(VM[k].flash)VM[k].flash.visible=k==id&&pl.sh>.8}
 vmG.position.z=-.45+Math.min(pl.kick,1)*.05}

/* ---------- ícone da arma no HUD ---------- */
const hi=document.createElement('img');hi.style.cssText='right:24px;bottom:88px;height:44px;display:none;filter:drop-shadow(0 1px 3px #000)';document.getElementById('hud').appendChild(hi);
let hiId='';
function hudTick(){const on=!pl.car&&pl.w>0,id=on?curId():'';if(id!==hiId){hiId=id;if(on&&ICO[id]){hi.src=ICO[id];hi.style.display='block'}else hi.style.display='none'}}

/* ---------- a roda ---------- */
const st=document.createElement('style');st.textContent=`
#wheel{position:fixed;inset:0;z-index:20;display:none;opacity:0;transition:opacity .12s;background:radial-gradient(ellipse at center,#000a 0%,#000d 75%);backdrop-filter:blur(5px)}
#wheel.on{opacity:1}
#wheel .wc{position:absolute;left:50%;top:50%;width:300px;transform:translate(-50%,-50%);text-align:center;pointer-events:none}
#wheel .wn{font-size:30px;font-weight:900;letter-spacing:3px;text-transform:uppercase}
#wheel .wk{color:#ffd23f;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px}
#wheel .wd{font-weight:400;opacity:.75;line-height:1.4;font-size:13px;min-height:36px;margin-bottom:10px}
#wheel .wr{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin:4px 0}
#wheel .wr span{width:84px;text-align:left;opacity:.7}
#wheel .wbar{flex:1;height:6px;background:#fff2;border-radius:3px;overflow:hidden}
#wheel .wbar div{height:100%;background:#ffd23f}
#wheel .wa{margin-top:10px;font-size:20px;color:#7dff8a;min-height:26px}
#wheel .wt{position:absolute;left:50%;top:50%;width:170px;height:104px;border-radius:12px;background:linear-gradient(#303541,#1b1e26);border:2px solid #3a3f4b;
 transform:translate(calc(-50% + var(--x,0px)),calc(-50% + var(--y,0px))) scale(var(--s,1));transition:transform .1s,border-color .1s,box-shadow .1s;text-align:center;overflow:hidden}
#wheel .wt.on{--s:1.12;border-color:#ffd23f;box-shadow:0 0 24px #ffd23f66}
#wheel .wt img{width:132px;height:66px;object-fit:contain;margin-top:6px}
#wheel .wt .nm{position:absolute;bottom:5px;left:0;right:0;font-size:12px;letter-spacing:2px;text-transform:uppercase}
#wheel .wt .nu{position:absolute;top:5px;left:9px;font-size:12px;opacity:.6}
#wheel .wt .am{position:absolute;top:5px;right:9px;font-size:11px;color:#7dff8a}
#wheel .wt .eq{position:absolute;top:8px;left:50%;width:7px;height:7px;margin-left:-3px;border-radius:50%;background:#ffd23f;display:none}
#wheel .wt.cur .eq{display:block}
#wheel .wt.lock img{filter:brightness(0) opacity(.4)}
#wheel .wt.lock .nm{opacity:.5}
#wheel .wt .lk{position:absolute;left:0;right:0;top:26px;font-size:20px;display:none}
#wheel .wt.lock .lk{display:block}
#wheel .wh{position:absolute;bottom:26px;left:0;right:0;text-align:center;opacity:.7;font-weight:400}`;
document.head.appendChild(st);
const root=document.createElement('div');root.id='wheel';
root.innerHTML='<div class="wc"><div class="wk" id="wk"></div><div class="wn" id="wn"></div><div class="wd" id="wd"></div><div id="wsb"></div><div class="wa" id="wa"></div></div>'+
 '<div class="wh">Mouse escolhe · solte <b>Tab</b> ou clique para equipar · <b>1–6</b> atalho · <b>Esc</b> cancela</div>';
document.body.appendChild(root);
const tiles=CAT.map((c,i)=>{const t=document.createElement('div');t.className='wt';
 t.innerHTML='<span class="nu">'+(i+1)+'</span><span class="am"></span><span class="eq"></span><img alt="">'+'<span class="lk">🔒</span><span class="nm">'+c.n+'</span>';
 t.querySelector('img').src=ICO[c.id]||'';t.onmouseenter=()=>{if(open){sel=i;view()}};root.appendChild(t);return t});

let open=false,sel=0,mx=0,my=0,cy0=0,cp0=0;
const pc=v=>Math.round(Math.max(0,Math.min(1,v))*100)+'%';
function stats(c){if(c.wp!=null&&c.wp>0){const W=WP[c.wp];return[(W.dd||W.dmg)/60,(1/W.rate)/12,1-W.sp*20,W.mag/30]}return c.st||[0,0,0,0]}
function layout(){const rx=Math.min(340,innerWidth*.3),ry=Math.min(210,innerHeight*.3);
 tiles.forEach((t,i)=>{const a=(-90+60*i)*Math.PI/180;t.style.setProperty('--x',Math.round(Math.cos(a)*rx)+'px');t.style.setProperty('--y',Math.round(Math.sin(a)*ry)+'px')})}
function view(){const ci=curI();
 tiles.forEach((t,i)=>{const c=CAT[i];t.classList.toggle('on',i==sel);t.classList.toggle('lock',!c.own);t.classList.toggle('cur',i==ci);
  t.querySelector('.am').textContent=c.own&&c.wp>0?pl.mg[c.wp]+' / '+AMS(pl.am[c.wp]):''});
 const c=CAT[sel],s=stats(c),L=['Dano','Cadência','Precisão','Carregador'];
 document.getElementById('wk').textContent=c.k;document.getElementById('wn').textContent=c.n;document.getElementById('wd').textContent=c.d;
 document.getElementById('wsb').innerHTML=L.map((l,i)=>'<div class="wr"><span>'+l+'</span><div class="wbar"><div style="width:'+pc(s[i])+'"></div></div></div>').join('');
 document.getElementById('wa').textContent=!c.own?'🔒 Loja de armas':c.wp>0?'Munição  '+pl.mg[c.wp]+' / '+AMS(pl.am[c.wp]):''}
function openW(){if(open||!run||pl.dead||pl.car)return;open=true;cy0=cy;cp0=cp;mx=my=0;sel=curI();layout();view();root.style.display='block';requestAnimationFrame(()=>root.classList.add('on'))}
function closeW(apply){if(!open)return;open=false;root.classList.remove('on');root.style.display='none';if(apply)equip(sel)}
function equip(i){const c=CAT[i];if(!c.own){msg('Compre essa arma na loja de armas');return}if(c.wp==null)return;if(pl.w!==c.wp){pl.w=c.wp;pl.rel=0}}

addEventListener('keydown',e=>{
 if(e.code=='Tab'&&!e.repeat){if(run)openW();return}
 if(!open)return;
 if(e.code=='Escape')closeW(false);
 else if(/^Digit[1-6]$/.test(e.code)){sel=+e.code[5]-1;closeW(true)}
 else if(e.code=='ArrowRight'||e.code=='ArrowDown'){sel=(sel+1)%6;view()}
 else if(e.code=='ArrowLeft'||e.code=='ArrowUp'){sel=(sel+5)%6;view()}
 else if(e.code=='Enter')closeW(true)});
addEventListener('keyup',e=>{if(e.code=='Tab'&&open)closeW(true)});
addEventListener('mousedown',()=>{if(open)closeW(true)},true);
addEventListener('blur',()=>closeW(false));
if(window.UI)UI.add(()=>open,()=>closeW(false),2);
document.addEventListener('pointerlockchange',()=>closeW(false));
document.addEventListener('mousemove',e=>{if(!open)return;mx+=e.movementX||0;my+=e.movementY||0;const l=Math.hypot(mx,my);
 if(l>140){mx*=140/l;my*=140/l}
 if(l>28){const a=Math.atan2(my,mx)*180/Math.PI,i=Math.round(((a+90+360)%360)/60)%6;if(i!=sel){sel=i;view()}}});

/* câmera lenta e mundo "parado" para a mira enquanto a roda está aberta */
const _up=update;update=function(dt){
 if(open){dt*=.18;cy=cy0;cp=cp0;MB.l=0;K.KeyW=K.KeyA=K.KeyS=K.KeyD=false}
 _up(dt);hudTick();vmTick()};

/* ---------- API para a loja de armas (futura) ---------- */
SY.weapons={B,CAT,owned:id=>!!(byId(id)&&byId(id).own),
 unlock(id,ammo){const c=byId(id);if(!c)return;c.own=true;if(ammo&&c.wp>0)pl.am[c.wp]+=ammo},   // ex.: SY.weapons.unlock('shotgun')
 equip:id=>{const i=CAT.findIndex(c=>c.id==id);if(i>=0)equip(i)},open:openW,close:closeW};

pl.w=0;                                                     // começa sem nada nas mãos
})();