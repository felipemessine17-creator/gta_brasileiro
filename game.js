'use strict';
/* game.js — carregado depois de systems.js. */
(()=>{
const NX=window.NX,SY=window.SY,SV=SY.SV,hudEl=$('hud'),cv=$('c');
const el=(id,css)=>{const e=document.createElement('div');e.id=id;e.style.cssText=css;hudEl.appendChild(e);return e};
SV.rep=SV.rep||0;SV.flags=SV.flags||{};

/* ---------- oceano de verdade (o plano de grama cobria o mar) ---------- */
scene.remove(sea);
const sg=new THREE.PlaneGeometry(3200,1500,80,40);sg.rotateX(-PI/2);
const sp=sg.attributes.position,nv=sp.count,cA=new Float32Array(nv*3),X0=new Float32Array(nv),Z0=new Float32Array(nv),c1=new THREE.Color(0x56d8d0),c2=new THREE.Color(0x0a3f73),tc=new THREE.Color();
for(let i=0;i<nv;i++){X0[i]=sp.getX(i);Z0[i]=sp.getZ(i);tc.copy(c1).lerp(c2,Math.pow(cl((Z0[i]+750)/260,0,1),.6));cA[i*3]=tc.r;cA[i*3+1]=tc.g;cA[i*3+2]=tc.b}
sg.setAttribute('color',new THREE.BufferAttribute(cA,3));
const sea2=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({vertexColors:true,map:waveT,roughness:.08,metalness:.35,transparent:true,opacity:.93,envMap:seaM.envMap,envMapIntensity:.9}));
sea2.position.set(0,-.02,1205);scene.add(sea2);NX.ground(3200,18,0xb9a67c,0,-.045,447);
const foam=new THREE.Mesh(new THREE.PlaneGeometry(3200,5),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false}));foam.rotation.x=-PI/2;foam.position.set(0,.01,456);scene.add(foam);
let wf=0;function waves(){if(++wf%2)return;const t=clock;for(let i=0;i<nv;i++){const a=Math.min(1,(Z0[i]+750)/120);sp.setY(i,a*(Math.sin(X0[i]*.04+t*1.2)+Math.sin(Z0[i]*.05-t*.9)*.8)*.2)}sp.needsUpdate=true;foam.position.z=456+Math.sin(t*.8)*2.5;foam.material.opacity=.35+.25*Math.sin(t*.8)}

/* ---------- veículos dos protagonistas ---------- */
CT.saveiro=Object.assign({},CT.pickup,{L:4.4,W:1.7,H:.62,C:.5,col:0xf4f4f4,ac:17,mx:34,gr:7.5,hp:130});
CT.fusca=Object.assign({},CT.sedan,{L:4,W:1.6,H:.7,C:.62,col:0x3f8f7b,ac:13,mx:30,gr:6.5,hp:120});
CT.porsche=Object.assign({},CT.sport,{L:4.5,W:1.85,H:.5,C:.42,col:0xc9cdd2,ac:32,mx:54,gr:5.5,br:44,hp:110});

/* ---------- protagonistas ---------- */
const CHR={
 henry:{n:'Henry',age:18,skin:0x6b4226,hair:0x111111,shirt:0xf2f2f2,pants:0x2b4a7a,jk:0,car:'Saveiro rebaixada',home:'a favela',hab:'Reflexo de Rua',desc:'Malandro, bom de tiro e com a vida estável. Mira firme e percebe ameaças por perto.',st:[5,3,2,4]},
 theo:{n:'Theo',age:18,skin:0xc68642,hair:0x3b2417,shirt:0x2a5d9f,pants:0x2a5d9f,jk:1,car:'Fusca (emprestado do primo)',home:'apartamento simples',hab:'Foco Turbo',desc:'Mecânico honesto, desengonçado e de óculos, que ama carro. Desacelera o tempo ao volante.',st:[2,5,3,3]},
 messine:{n:'Messine',age:20,skin:0xf1c9a5,hair:0x4a3320,shirt:0xffffff,pants:0x1a1a22,jk:2,car:'Esportivo estilo 911',home:'cobertura na Paulista',hab:'Mente Estratégica',desc:'Felipe “Messine”: gordinho, gênio dos golpes e milionário aos 20. Analisa a cena e destaca oportunidades.',st:[2,4,5,2]}};
const JK=[[0,0,0],[0x2a5d9f,0xf1c40f,1],[0x1d1f27,0xcfcfcf,1]];
const vest=P.t.children.filter(o=>o.geometry&&o.geometry.parameters&&o.geometry.parameters.width>=.55);
const acc={cap:[bx(.3,.08,.3,0xc0392b,0,.98,0,P.t),bx(.26,.03,.14,0xc0392b,0,.95,.2,P.t)],chain:[bx(.3,.03,.02,0xffd700,0,.62,.16,P.t),bx(.05,.12,.02,0xffd700,0,.55,.16,P.t)],glasses:[bx(.09,.09,.02,0x111111,-.06,.82,.13,P.t),bx(.09,.09,.02,0x111111,.06,.82,.13,P.t),bx(.04,.02,.02,0x111111,0,.83,.13,P.t)],watch:[bx(.17,.05,.17,0xd4af37,0,-.5,0,P.aL)]};
for(const k in acc)for(const m of acc[k]){m.visible=false;m.castShadow=false}
let curS=0xc68642,curH=0x1a1a1a;
function look(id){const d=CHR[id];P.sm.color.setHex(d.shirt);P.pm.color.setHex(d.pants);
 P.g.traverse(o=>{if(!o.isMesh||!o.material||!o.material.color||o.material===faceMatRef)return;const h=o.material.color.getHex();if(h==curS)o.material.color.setHex(d.skin);else if(h==curH)o.material.color.setHex(d.hair)});
 curS=d.skin;curH=d.hair;const j=JK[d.jk];vest.forEach((v,i)=>{v.visible=!!j[2];if(j[2])v.material.color.setHex(i?j[1]:j[0])});
 acc.cap.forEach(m=>m.visible=false);acc.chain.forEach(m=>m.visible=id=='henry');acc.glasses.forEach(m=>m.visible=id=='theo');acc.watch.forEach(m=>m.visible=id=='messine');P.g.scale.set(id=='messine'?1.22:1,1,id=='messine'?1.18:1)}
const faceMatRef=null;
const PR=SY.PR={cur:'henry',lock:false,CHR},stt={henry:{pos:V3(-326,0,-350),ry:PI/2,hp:100,ar:0,car:null},theo:{pos:V3(157,0,-143),ry:0,hp:100,ar:0,car:null},messine:{pos:V3(-162,0,-10),ry:0,hp:100,ar:0,car:null}};
const VS={henry:['saveiro',-324,-345,0],theo:['fusca',172,-142,0],messine:['porsche',-165,-6.5,PI/2]};
for(const k in VS){const v=VS[k],c=mkCar(v[0],v[1],v[2],v[3],{keep:1,owner:k});stt[k].mycar=c}
pl.pos.copy(stt.henry.pos);cy=PI/2;look('henry');
let swT=0;
function fadeDo(fn){const f=$('fade');if(!f){fn();return}f.style.opacity=1;setTimeout(()=>{fn();f.style.opacity=0},500)}
function sw(id,force){if(id==PR.cur||pl.dead)return;if(PR.lock&&!force){msg('A história não permite trocar agora');return}
 fadeDo(()=>{const s=stt[PR.cur];s.pos.copy(pl.pos);s.ry=pl.ry;s.hp=pl.hp;s.ar=pl.ar;s.car=pl.car;PR.cur=id;const n=stt[id];pl.car=null;pl.pos.copy(n.pos);pl.ry=n.ry;pl.hp=n.hp;pl.ar=n.ar;pl.vx=pl.vz=0;
  if(n.car&&!n.car.dead){pl.car=n.car;n.car.ai=null;P.g.visible=!!n.car.T.two}else P.g.visible=!pl.fp;
  look(id);cy=pl.ry;swT=1.4;ab.on>0&&endAb();msg('Agora você é '+CHR[id].n)})}
SY.PR.sw=sw;SY.PR.stt=stt;
/* ---------- contas separadas: cada protagonista tem carteira (S.money) e banco (SV.bank) próprios ---------- */
{const old=SV.bank||0;
 SV.acc=SV.acc||{henry:{m:500,b:old},theo:{m:150,b:0},messine:{m:20000,b:0}};      // saldo inicial; saves antigos: banco antigo vai pro Henry
 for(const k of['henry','theo','messine'])SV.acc[k]=SV.acc[k]||{m:0,b:0};
 Object.defineProperty(S,'money',{configurable:true,enumerable:true,get:()=>SV.acc[PR.cur].m,set:v=>{SV.acc[PR.cur].m=v}});   // tudo que ganha/gasta vai só pro personagem ativo
 Object.defineProperty(SV,'bank',{configurable:true,enumerable:false,get:()=>SV.acc[PR.cur].b,set:v=>{SV.acc[PR.cur].b=v}})}
const HOME={henry:[-326,-350],theo:[157,-143],messine:[-162,-10]},_rs=respawn;respawn=function(){_rs();const h=HOME[PR.cur];pl.pos.set(h[0],0,h[1])};
const swm=document.createElement('div');swm.id='swm';swm.innerHTML='<div><h2 style="text-align:center;margin-bottom:14px">Trocar de personagem</h2><div class="row" id="swr"></div><p style="text-align:center;opacity:.7;margin-top:14px">Teclas 1, 2 ou 3 · T ou Esc fecha</p></div>';document.body.appendChild(swm);
function drawFace(c,d){const g=c.getContext('2d'),h=n=>'#'+n.toString(16).padStart(6,'0');g.fillStyle='#2a2d36';g.fillRect(0,0,120,120);g.fillStyle=h(d.shirt);g.fillRect(18,86,84,40);g.fillStyle=h(d.skin);g.fillRect(52,72,16,18);g.beginPath();g.ellipse(60,52,22,26,0,0,6.3);g.fill();
 g.fillStyle=h(d.hair);g.beginPath();g.ellipse(60,36,23,15,0,Math.PI,0);g.fill();g.fillStyle='#111';g.fillRect(50,52,5,5);g.fillRect(66,52,5,5);g.fillRect(52,68,16,2);
 if(d.n=='Messine'){g.fillStyle=h(d.skin);g.beginPath();g.ellipse(60,62,30,24,0,0,6.3);g.fill();g.fillStyle='#111';g.fillRect(50,52,5,5);g.fillRect(66,52,5,5);g.fillRect(52,68,16,2)}if(d.n=='Theo'){g.strokeStyle='#111';g.lineWidth=3;g.beginPath();g.arc(50,54,9,0,6.3);g.arc(70,54,9,0,6.3);g.moveTo(59,54);g.lineTo(61,54);g.stroke()}if(d.n=='Henry'){g.fillStyle='#ffd700';g.fillRect(52,92,16,3)}}
const ids=['henry','theo','messine'];let swOpen=false,swSel=0;
ids.forEach((id,i)=>{const d=CHR[id],c=document.createElement('div');c.className='card';c.id='card_'+id;c.innerHTML='<canvas width="120" height="120"></canvas><h3>'+d.n+', '+d.age+'</h3><b style="color:#ffd23f">'+d.hab+'</b><small>'+d.desc+'</small><small>Tiro '+'▮'.repeat(d.st[0])+' · Direção '+'▮'.repeat(d.st[1])+'<br>Mente '+'▮'.repeat(d.st[2])+' · Fôlego '+'▮'.repeat(d.st[3])+'</small><small>🚗 '+d.car+'<br>🏠 '+d.home+'</small>';
 drawFace(c.firstChild,d);c.onclick=()=>pickSw(i);$('swr').appendChild(c)});
function swView(){ids.forEach((id,i)=>{const c=$('card_'+id);c.classList.toggle('on',i==swSel||id==PR.cur);c.classList.toggle('lock',PR.lock&&id!=PR.cur)})}
function swToggle(o){if(o==swOpen)return;swOpen=o;swm.style.display=o?'grid':'none';if(o){swSel=ids.indexOf(PR.cur);run=false;swView()}else run=true}
if(window.UI)UI.add(()=>swOpen,()=>swToggle(false),2);
function pickSw(i){swToggle(false);sw(ids[i])}
addEventListener('keydown',e=>{if(e.repeat)return;if(swOpen){if(e.code=='Escape'||e.code=='KeyT')swToggle(false);else if(/^Digit[1-3]$/.test(e.code))pickSw(+e.code[5]-1);else if(e.code=='ArrowRight'){swSel=(swSel+1)%3;swView()}else if(e.code=='ArrowLeft'){swSel=(swSel+2)%3;swView()}else if(e.code=='Enter')pickSw(swSel);return}
 if(!run||pl.dead)return;if(e.code=='KeyT')swToggle(true);if(e.code=='KeyX')useAb();if(e.code=='KeyG')garage()});
const who=el('who','left:50%;bottom:20px;transform:translateX(-50%);font-size:15px;text-align:center'),fxEl=el('fx','inset:0;opacity:0;transition:opacity .4s');

/* ---------- habilidades ---------- */
let ab={on:0,cd:0,id:'',max:1},TS=1,tsT=1;
const AB={henry:{n:'Reflexo de Rua',d:7,c:40,fx:'radial-gradient(transparent 45%,rgba(255,60,60,.38))'},theo:{n:'Foco Turbo',d:8,c:30,fx:'radial-gradient(transparent 38%,rgba(60,120,255,.5))'},messine:{n:'Mente Estratégica',d:10,c:45,fx:'radial-gradient(transparent 45%,rgba(150,90,255,.4))'}};
function useAb(){const id=PR.cur,A=AB[id];if(ab.on>0||ab.cd>0)return;if(id=='theo'&&!pl.car){msg('Foco Turbo só funciona ao volante');return}
 ab={on:A.d,cd:0,id,max:A.d};fxEl.style.background=A.fx;fxEl.style.opacity=1;tsT=id=='theo'?.38:id=='henry'?.75:1;if(id=='theo')cv.style.filter='saturate(.6) contrast(1.1)';msg(A.n+'!')}
function endAb(){ab.cd=AB[ab.id].c;ab.on=0;tsT=1;fxEl.style.opacity=0;cv.style.filter=''}
SY.abOn=id=>ab.id==id&&ab.on>0;
const pool=Array.from({length:40},()=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:sprT,depthTest:false,transparent:true,opacity:.9}));s.scale.set(2.4,2.4,1);s.visible=false;s.renderOrder=999;scene.add(s);return s});
function scan(){let k=0;const put=(x,z,c,y)=>{if(k<pool.length){const s=pool[k++];s.position.set(x,y||1.6,z);s.material.color.setHex(c);s.visible=true}};
 if(ab.id=='henry'){for(const a of actors)if(a.alive&&a.hostile!==0&&['e','boss','cop','thug'].includes(a.role)&&Math.hypot(a.pos.x-pl.pos.x,a.pos.z-pl.pos.z)<70)put(a.pos.x,a.pos.z,0xff3030,2.4);for(const c of cars)if(c.cop&&!c.dead&&c.pos.distanceTo(pl.pos)<70)put(c.pos.x,c.pos.z,0xff3030,2.4)}
 else{for(const a of actors)if(a.alive&&a.role!='npc')put(a.pos.x,a.pos.z,0xff9a30,2.4);for(const c of cars)if(c.cop&&!c.dead)put(c.pos.x,c.pos.z,0xff3030,2.4);for(const s of NX.shops)if(s.cd<=0&&s.st!='idle'||s.type=='joia')put(s.x,s.z,0xffd23f,5);if(SY.obj)put(SY.obj.x,SY.obj.z,0x40e0ff,6);
  let n=0;for(const c of cars)if(!c.ai&&!c.cop&&!c.dead&&n<8&&c.pos.distanceTo(pl.pos)<90){put(c.pos.x,c.pos.z,0xffffff,2.2);n++}}
 for(let j=k;j<pool.length;j++)pool[j].visible=false}

/* ---------- atores (inimigos, policiais a pé, NPCs de missão) ---------- */
const actors=SY.actors=[];
const los=a=>{for(let k=1;k<8;k++){const t=k/8;if(inB(a.pos.x+(pl.pos.x-a.pos.x)*t,1.2,a.pos.z+(pl.pos.z-a.pos.z)*t))return false}return true};
function mkA(x,z,o){o=o||{};SY.next={full:1,skin:o.skin,hair:o.hair};const p=person(o.sh??pk(SH),o.pa??0x222222),g=p.g;g.position.set(x,0,z);scene.add(g);
 if(!o.unarmed){bx(.08,.14,.45,0x111111,0,-.58,.18,p.aR);p.aR.rotation.x=-1.3}
 const a=Object.assign({p,g,pos:g.position,hp:60,alive:true,role:'e',spd:3.4,range:26,dmg:5,ft:rr(.5,1.2),on:false,name:''},o);if(o.rot!=null)g.rotation.y=o.rot;if(o.chubby)g.scale.set(1.22,1,1.18);if(o.glasses){bx(.09,.09,.02,0x111111,-.06,.82,.13,p.t);bx(.09,.09,.02,0x111111,.06,.82,.13,p.t);bx(.04,.02,.02,0x111111,0,.83,.13,p.t)}actors.push(a);return a}
function rmA(a){scene.remove(a.g);const i=actors.indexOf(a);if(i>=0)actors.splice(i,1)}
function killA(a){if(!a.alive)return;a.alive=false;a.g.rotation.x=-1.5;a.g.position.y=.2;SV.st.kills++;SY.xp(25);if(a.role=='cop'||a.role=='sw')crime(2);if(a.onkill)a.onkill(a)}
function actTick(dt){for(const a of actors.slice()){
 if(!a.alive){if(a.role=='cop'||a.role=='sw'){a.ttl=(a.ttl||10)-dt;if(a.ttl<=0)rmA(a)}continue}
 const dx=pl.pos.x-a.pos.x,dz=pl.pos.z-a.pos.z,d=Math.hypot(dx,dz)||1;
 if(a.role=='thug'){a.pos.x-=dx/d*a.spd*dt;a.pos.z-=dz/d*a.spd*dt;a.g.rotation.y=Math.atan2(-dx,-dz);const h=hitB(a.pos.x,a.pos.z,.4);if(h){a.pos.x+=h[0];a.pos.z+=h[1]}anim(a.p,a.spd,dt,{});continue}
 if(a.role=='ally'){const t=actors.find(o=>o.alive&&['e','boss','cop','sw'].includes(o.role)&&Math.hypot(o.pos.x-a.pos.x,o.pos.z-a.pos.z)<30);
  if(t){a.g.rotation.y=Math.atan2(t.pos.x-a.pos.x,t.pos.z-a.pos.z);a.p.aR.rotation.x=-1.5;a.ft-=dt;if(a.ft<=0){a.ft=1.3;t.hp-=34;t.on=true;emit(V3(a.pos.x,1.3,a.pos.z),V3(),0xffe08a,1,.05,0,0);nz(.08,.2,2200);if(t.hp<=0)killA(t)}anim(a.p,0,dt,{aim:true})}
  else{if(d>5){a.pos.x+=dx/d*4.2*dt;a.pos.z+=dz/d*4.2*dt;a.g.rotation.y=Math.atan2(dx,dz)}anim(a.p,d>5?4.2:0,dt,{})}continue}
 if(['e','boss','cop','sw'].includes(a.role)&&a.hostile!==0){
  if((a.role=='cop'||a.role=='sw')&&!wanted){a.rm=(a.rm||0)+dt;if(a.rm>6){rmA(a);continue}}
  if(d<a.range||a.on){a.on=true;a.g.rotation.y=Math.atan2(dx,dz);if(a.spd&&d>(a.hold||9)){a.pos.x+=dx/d*a.spd*dt;a.pos.z+=dz/d*a.spd*dt}
   const h=hitB(a.pos.x,a.pos.z,.4);if(h){a.pos.x+=h[0];a.pos.z+=h[1]}a.p.aR.rotation.x=-1.5;anim(a.p,a.spd&&d>(a.hold||9)?a.spd:0,dt,{aim:true});
   a.ft-=dt;if(a.ft<=0&&d<a.range+10){a.ft=rr(.9,1.5);if(los(a)&&R2()<.7){hurt(a.dmg);nz(.1,.25,2000);emit(V3(a.pos.x,1.3,a.pos.z),V3(),0xffe08a,1,.05,0,0)}}}}
 else if(a.talk)anim(a.p,0,dt,{})}}
function actorShot(){const W=WP[pl.w],q=V3();for(let t=pl.cdist+.8;t<60;t+=.35){q.copy(cam.position).addScaledVector(dv,t);if(q.y<=0||inB(q.x,q.y,q.z))return;
 for(const a of actors){if(!a.alive||['npc','vic'].includes(a.role)||Math.abs(a.pos.x-q.x)>.5||Math.abs(a.pos.z-q.z)>.5||q.y>1.9)continue;a.hp-=W.dmg;a.on=true;
  for(let i=0;i<4;i++)emit(q,V3(rr(-2,2),rr(0,3),rr(-2,2)),0xaa0000,.3,.5,0,-8);if(a.hp<=0)killA(a);return}}}
SY.mkA=mkA;SY.rmA=rmA;

/* ---------- roubo de veículo com animação ---------- */
let jk=null;const fleers=[];
const _en=enterCar;
enterCar=function(){if(jk)return;let b=null,bd=5;for(const c of cars)if(!c.dead&&!c.cop){const d=Math.hypot(c.pos.x-pl.pos.x,c.pos.z-pl.pos.z);if(d<bd){bd=d;b=c}}
 if(!b)return;if(!b.ai){_en();return}
 const armed=MB.r&&pl.w>0;if(b.vel.length()>4&&!armed){msg('Mire (botão dir.) para fazer o motorista parar');return}
 b.ai.tv=0;b.ai.sp*=.2;SY.next=null;const dr=person(pk(SH),pk(PA)),l=[Math.cos(b.yaw),-Math.sin(b.yaw)];dr.g.position.set(b.pos.x+l[0]*(b.T.W/2+.7),0,b.pos.z+l[1]*(b.T.W/2+.7));dr.g.rotation.y=b.yaw;scene.add(dr.g);
 pl.ry=Math.atan2(b.pos.x-pl.pos.x,b.pos.z-pl.pos.z);jk={c:b,t:0,dr,l};msg(pk(['“Pelo amor de Deus, leva o carro!”','“Calma, calma, tá aqui a chave!”','“Não me machuca, moço!”']));
 for(const q of peds)if(q.pos.distanceTo(pl.pos)<22)q.pan=7}
function jackTick(dt){if(!jk)return;jk.t+=dt;const d=jk.dr;d.aL.rotation.x=d.aR.rotation.x=-2.8;jk.c.vel.multiplyScalar(.9);
 if(jk.t>.55){d.g.rotation.x=0;d.g.position.x+=jk.l[0]*5*dt;d.g.position.z+=jk.l[1]*5*dt;anim(d,5,dt,{})}
 if(jk.t>.9){const dd=jk.dr;jk=null;_en();if(pl.car){crime(1);SV.rep-=2;fleers.push({p:dd,t:6,l:[Math.cos(pl.car.yaw),-Math.sin(pl.car.yaw)]})}else scene.remove(dd.g)}}
const _an=anim;anim=function(p,sp,dt,o){_an(p,sp,dt,o);if(p!==P)return;if(jk){p.aR.rotation.x=-1.5;p.gun.visible=true;return}
 if(sp<.3&&!o.aim&&!o.crouch){const t=clock;if(PR.cur=='henry'){p.t.rotation.z=Math.sin(t*1.3)*.05;p.aL.rotation.x=-.2}else if(PR.cur=='theo'){p.aR.rotation.x=Math.sin(t*2.5)*.35-.2;p.t.rotation.z=Math.sin(t*.9)*.06;p.t.rotation.x=Math.sin(t*.6)>.9?.2:0}else{p.t.rotation.z=Math.sin(t*1.1)*.03;p.aL.rotation.x=Math.sin(t*.7)>.8?-.9:0}}
 else if(sp>=.3){const k=PR.cur;if(k=='theo'){p.t.rotation.z=Math.sin(p.ph*.5)*.16;p.aL.rotation.x*=1.7;p.aR.rotation.x*=.3;if(stum<=0&&sp>3&&R2()<.0025)stum=.55;if(stum>0){stum-=.016;p.t.rotation.x=.45;p.lL.rotation.x=-1.1}}else if(k=='henry')p.t.rotation.z=Math.sin(p.ph)*.06;else p.t.rotation.z=Math.sin(p.ph)*.08}else p.t.rotation.z=0};
let stum=0;

/* ---------- física com Foco Turbo, dano, crime ---------- */
const _dr=drive;drive=function(c,thr,sT,hb,dt){if(c===pl.car&&TS<.9)dt/=Math.sqrt(TS);_dr(c,thr,sT,hb,dt)};
const _dm=dmg;dmg=function(c,a){a*=.4;if(c===pl.car&&PR.cur=='theo')a*=.6;_dm(c,a)};
const _cr=crime;crime=function(n){SV.rep-=n*2;_cr(n)};
/* estrelas graduais: começa com no máx. 2 por incidente; depois só +1 a cada 6 s (crimes em sequência não explodem pra 5 de uma vez) */
{const _c2=crime;let last=-99;crime=function(n){const w=wanted;let add=Math.min(n,w?1:2);if(w>=2&&clock-last<6)add=0;if(add>0)last=clock;_c2(add)}}
const _sh=shoot;shoot=function(){const s1=WP[1].sp,s2=WP[2].sp,d1=WP[1].dmg,d2=WP[2].dmg,on=SY.abOn('henry'),f=on?0:PR.cur=='henry'?.5:1;WP[1].sp*=f;WP[2].sp*=f;if(on){WP[1].dmg*=1.4;WP[2].dmg*=1.4}
 const m0=pl.mg[pl.w];_sh();WP[1].sp=s1;WP[2].sp=s2;WP[1].dmg=d1;WP[2].dmg=d2;if(pl.w&&pl.mg[pl.w]<m0)actorShot()};
let cin=null;SY.cine=(x,z,d,h,t)=>{cin={x,z,d,h,t,a:rr(0,6)}};SY.cineStop=()=>{cin=null};
const _uc=updCam;updCam=function(dt){_uc(dt);if(swT>0){swT-=dt;const k=swT/1.4;cam.position.y+=k*k*90;cam.lookAt(pl.pos.x,pl.pos.y+1,pl.pos.z)}
 if(cin){cin.t-=dt;cin.a+=dt*.18;cam.position.set(cin.x+Math.cos(cin.a)*cin.d,cin.h,cin.z+Math.sin(cin.a)*cin.d);cam.lookAt(cin.x,2.5,cin.z);if(cin.t<=0)cin=null}};

/* ---------- densidade por qualidade, NPCs variados e personalidades ---------- */
const DN=[{p:6,c:3,r:220},{p:28,c:12,r:240},{p:80,c:36,r:260},{p:160,c:75,r:280},{p:280,c:140,r:300}];
function behave(q){const r=R2();q.pers=r<.12?'brave':r<.42?'coward':'calm';q.id=R2()*6;const b=R2();
 q.beh=b<.55?'walk':b<.7?'stand':b<.82?'phone':b<.92?'chat':'wait';q.hx=q.pos.x;q.hz=q.pos.z;q.face=R2()*6.28;
 if(q.beh=='chat'){const o=peds[peds.length-2];if(o&&o!==q&&o.beh!='walk'){q.hx=o.hx+1.1;q.hz=o.hz;q.face=-PI/2;o.face=PI/2}else q.beh='stand'}}
const _mp=mkPed;mkPed=function(){_mp();behave(peds[peds.length-1])};
/* ===== Densidade de população por qualidade gráfica =====
   p = pedestres, c = carros de trânsito, r = raio (em volta do jogador) onde eles se concentram.
   Muito baixo: ruas quase vazias · Ultra: trânsito pesado e calçadas cheias. */
function nearLane(off,r){let l;for(let t=0;t<6;t++){const ax=R2()<.5,s=R2()<.5?1:-1,c=ax?pl.pos.z:pl.pos.x,o=ax?pl.pos.x:pl.pos.z,k=cl(Math.round((c+rr(-r,r))/B),-N/2,N/2)*B,a=cl(o+rr(-r,r),-H+14,H-14);
  l=ax?{x:a,z:k+s*off,d:[s,0]}:{x:k-s*off,z:a,d:[0,s]};if(Math.hypot(l.x-pl.pos.x,l.z-pl.pos.z)>55)break}return l}
let nearR=0;const _lane=lane;const inFav=(x,z)=>!!(NX.favR&&NX.favR(x,z));
lane=function(off){let l;for(let t=0;t<8;t++){l=nearR?nearLane(off,nearR):_lane(off);if(!inFav(l.x,l.z))break}return l};
let densOn=false;
function dens(inc){if(!densOn)return;const d=DN[S.q];nearR=d.r;
 const far=(e,m)=>Math.hypot(e.pos.x-pl.pos.x,e.pos.z-pl.pos.z)>m;
 // a grade da cidade passa por baixo do morro da favela: pedestre/carro da grade que parar lá dentro sai (a favela tem NPCs próprios, ver favela.js)
 for(let i=peds.length-1;i>=0;i--){const q=peds[i];if(!q.fv&&inFav(q.pos.x,q.pos.z)){scene.remove(q.g);peds.splice(i,1)}}
 for(const c of cars)if(c.ai&&!c.ai.fv&&!c.keep&&!c.mission&&inFav(c.pos.x,c.pos.z))c.del=true;   // carros da favela (ai.fv) podem ficar
 // pedestres da grade: remove excesso (e os muito distantes) e completa até a meta
 const gp=()=>peds.reduce((n,q)=>n+(q.fv?0:1),0);
 for(let i=peds.length-1;i>=0&&gp()>d.p;i--)if(!peds[i].fv){scene.remove(peds[i].g);peds.splice(i,1)}
 if(inc){let k=0;for(let i=peds.length-1;i>=0&&k<4;i--){const q=peds[i];if(!q.fv&&!q.dead&&far(q,d.r*1.8)){scene.remove(q.g);peds.splice(i,1);k++}}}
 for(let i=0,m=inc?6:1e9;gp()<d.p&&i<m;i++)mkPed();
 // carros de trânsito: idem
 const ai=cars.filter(c=>c.ai&&!c.ai.fv&&!c.keep&&!c.mission);
 for(let i=ai.length-1;i>=d.c;i--)ai[i].del=true;
 if(inc){let k=0;for(const c of ai)if(!c.del&&k<3&&far(c,d.r*1.8)){c.del=true;k++}}
 let n=ai.filter(c=>!c.del).length;
 for(let t=0,m=inc?8:d.c*4,made=0;n<d.c&&t<m&&(!inc||made<3);t++){const k=cars.length;traffic();if(cars.length>k){n++;made++}}
 nearR=0}
window.startPopulation=()=>{densOn=true;dens()};   // chamado no fim do story.js, depois do mapa fixo estar pronto
let dnT=0;const _ud=update;update=function(dt){_ud(dt);dnT-=dt;if(dnT<=0){dnT=1;dens(true)}};
const _aq=applyQ;applyQ=function(){_aq();dens()};
for(const q of peds)behave(q);
function pedTick(){const ar=MB.r&&pl.w>0&&!pl.car;
 for(const q of peds){if(q.dead)continue;
  if(ar&&q.pan<=0&&q.pos.distanceTo(pl.pos)<13){if(q.pers=='coward'){q.pan=7}else if(q.pers=='brave'){q.g.rotation.y=Math.atan2(pl.pos.x-q.pos.x,pl.pos.z-q.pos.z);if(R2()<.004)msg('“Tá maluco, mano?! Guarda isso!”')}}
  if(q.pan>0&&q.beh!='walk')q.beh='walk';
  if(q.beh=='walk')continue;q.pos.set(q.hx,0,q.hz);q.g.rotation.y=q.face;q.sp=0;const p=q.pp;
  if(q.beh=='phone'){p.aR.rotation.x=-1.7}else if(q.beh=='chat'){p.aR.rotation.x=-.7+Math.sin(clock*3+q.id)*.5;p.aL.rotation.x=-.3}}}

/* ---------- polícia: a pé, bloqueio, helicóptero e SWAT ---------- */
function drvTo(getT,spd,o){
 o=o||{};
 const W={px:0,pz:0,tm:0,stk:0,rv:0,rs:1,av:0,tries:0,ok:0,h:0,ht:0,init:0};
 // distância do 1º obstáculo (prédio) na direção a; 0 = livre
 const blk=(c,a,len)=>{const r=c.T.W/2+.5,sa=Math.sin(a),ca=Math.cos(a);
  for(let d=c.T.L/2;d<=c.T.L/2+len;d+=2.5)if(hitB(c.pos.x+sa*d,c.pos.z+ca*d,r))return d;return 0};
 // escolhe rumo livre mais próximo do alvo (whiskers); em modo "av" ignora o rumo direto
 const pick=(c,want,len)=>{
  if(W.av<=0&&!blk(c,want,len))return want;
  const s0=W.av>0?W.rs:(ang(want,c.yaw)>=0?1:-1);
  for(const k of W.av>0?[.9,1.4,1.9,2.5]:[.45,.9,1.35,1.8,2.4])
   for(const s of[s0,-s0]){const a=want+k*s;if(!blk(c,a,len))return a}
  return want+s0*1.8};
 // último recurso: reposiciona o carro na via mais próxima, virado para o alvo
 const rescue=(c,t)=>{
  const rx=Math.round(c.pos.x/B)*B,rz=Math.round(c.pos.z/B)*B,ax=Math.abs(c.pos.z-rz)<Math.abs(c.pos.x-rx),
   x=cl(ax?c.pos.x:rx,-H+10,H-10),z=cl(ax?rz:c.pos.z,-H+10,H-10);
  if(hitB(x,z,c.rad||2))return false;
  c.pos.set(x,c.pos.y,z);c.vel.set(0,0,0);c.st=0;
  c.yaw=ax?(t.x>x?PI/2:-PI/2):(t.z>z?0:PI);return true};
 return(c,dt)=>{
  const t=getT();if(!t)return[0,0,true];
  const dx=t.x-c.pos.x,dz=t.z-c.pos.z,ds=Math.hypot(dx,dz),sp=c.vel.length(),want=Math.atan2(dx,dz),
   mx=typeof o.max=='function'?o.max():o.max,st=typeof o.stop=='function'?o.stop():o.stop;
  if((W.ht-=dt)<=0){W.ht=.15;W.h=pick(c,want,12+sp*.8)}
  if(W.av>0)W.av-=dt;
  const d=ang(c.yaw,W.h);
  let thr=Math.abs(d)>1.2?.35:(spd||1),sT=cl(d*2.2,-1,1);
  if(st&&ds<st)thr=0;
  if(mx&&sp>mx)thr=0;
  // watchdog de progresso: mede deslocamento real a cada 0,5 s
  if(!W.init){W.px=c.pos.x;W.pz=c.pos.z;W.init=1}
  if((W.tm+=dt)>=.5){
   const mv=Math.hypot(c.pos.x-W.px,c.pos.z-W.pz);W.px=c.pos.x;W.pz=c.pos.z;W.tm=0;
   if(thr>0&&W.rv<=0&&mv<.5)W.stk++;
   else{W.stk=0;if(mv>2&&++W.ok>=8){W.tries=0;W.ok=0}}
   if(W.stk>=2){
    W.stk=0;W.ok=0;W.tries++;
    const l=blk(c,c.yaw+1.2,10),r=blk(c,c.yaw-1.2,10);
    W.rs=!l?1:!r?-1:-W.rs;              // lado mais livre (ou alterna)
    W.rv=Math.min(.9+.4*W.tries,2.5);   // ré cresce a cada tentativa
    W.av=2.5;W.ht=0;                    // depois da ré: contorna, não mira reto
    if(W.tries>=3&&(c.pos.distanceToSquared(cam.position)>3600||W.tries>=5)&&rescue(c,t)){W.tries=0;W.rv=0;W.av=0}
   }
  }
  if(W.rv>0){
   W.rv-=dt;
   sT=-cl(ang(c.yaw,want+W.rs*1.2)*2.2,-1,1); // ré girando o nariz para o lado livre
   return[-1,sT,false]
  }
  return[thr,sT,false]}}
SY.drvTo=drvTo;
const rb=[];let rbT=15,swc=null,hel=null,heliA=0;
{const g=new THREE.Group();bx(2.2,1.6,5,0x15181d,0,0,0,g);bx(.3,.3,5,0x15181d,0,.3,-4.5,g);const r1=bx(9,.08,.5,0x222222,0,1,0,g),r2=bx(.5,.08,9,0x222222,0,1,0,g);g.visible=false;scene.add(g);
 const bg=new THREE.ConeGeometry(5,1,16,1,true);bg.translate(0,-.5,0);bg.rotateX(-PI/2);const bm_=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:0xfff3b0,transparent:true,opacity:.15,side:THREE.DoubleSide,depthWrite:false,fog:false}));bm_.visible=false;scene.add(bm_);hel={g,r1,r2,beam:bm_}}
function policeTick(dt){
 for(const c of cars)if(c.cop&&!c.dead&&!c.drv&&wanted&&!c.dis&&c.pos.distanceTo(pl.pos)<38&&(!pl.car||pl.car.vel.length()<5)){c.dis=1;for(const s of[-1,1]){const l=[Math.cos(c.yaw)*s*2.4,-Math.sin(c.yaw)*s*2.4];
  mkA(c.pos.x+l[0],c.pos.z+l[1],{role:'cop',sh:0x1f3a6b,pa:0x1b2a44,hp:70,dmg:4,spd:4.2,range:60,hold:7+(s>0?4:0)})}}
 if(wanted>=3&&pl.car&&pl.car.vel.length()>6){rbT-=dt;if(rbT<=0&&!rb.length){rbT=45;const v=pl.car.vel,ax=Math.abs(v.x)>Math.abs(v.z),sx=Math.sign(ax?v.x:v.z),k=ax?Math.round(pl.pos.z/B)*B:Math.round(pl.pos.x/B)*B;
  for(const o of[-5,0,5]){const x=ax?pl.pos.x+sx*140:k+o,z=ax?k+o:pl.pos.z+sx*140;if(Math.abs(x)>370||Math.abs(z)>370)continue;const c=mkCar('police',x,z,ax?0:PI/2,{cop:1,keep:1});c.drv=()=>[0,0,true];rb.push(c)}}}
 if(rb.length&&(wanted<3||rb.every(c=>c.pos.distanceTo(pl.pos)>260))){for(const c of rb)c.del=true;rb.length=0}
 const hv=wanted>=4;hel.g.visible=hel.beam.visible=hv;
 if(hv){heliA+=dt*.5;hel.g.position.set(pl.pos.x+Math.cos(heliA)*22,38,pl.pos.z+Math.sin(heliA)*22);hel.g.rotation.y=-heliA;hel.r1.rotation.y+=dt*30;hel.r2.rotation.y+=dt*30;hel.beam.position.copy(hel.g.position);hel.beam.lookAt(pl.pos);hel.beam.scale.z=hel.g.position.distanceTo(pl.pos)}
 if(wanted>=5&&!swc){const x=cl(pl.pos.x+(R2()<.5?90:-90),-360,360),z=cl(pl.pos.z+(R2()<.5?90:-90),-360,360);swc=mkCar('truck',x,z,0,{cop:1,keep:1,col:0x1a1a1a});swc.drv=drvTo(()=>pl.pos,1,{stop:14});msg('Operação especial a caminho!')}
 if(swc&&!swc.dead&&!swc.out&&swc.pos.distanceTo(pl.pos)<30){swc.out=1;for(let i=0;i<3;i++)mkA(swc.pos.x+i*1.6-1.6,swc.pos.z+3,{role:'sw',sh:0x2d3b2d,pa:0x2d3b2d,hp:120,dmg:7,spd:4,range:60,hold:10})}
 if(swc&&wanted<5){swc.del=true;swc=null}}

/* ---------- cenário brasileiro: casas, oficina, túnel, viaduto, garagens ---------- */
/* Casa do Henry: casa oca de tijolo aparente, simples (sala/quarto num cômodo só): PC, TV, Xbox, sofá, cama. Porta na face +x (onde fica a placa). */
function henryHouse(){
 const X=-333,Z=-352,W=7,D=7,H=3.6,x0=X-W/2,x1=X+W/2,z0=Z-D/2,z1=Z+D/2,t=.3,WH=3.3;
 NX.clear(x0-3,x1+3,z0-3,z1+3);
 const brk=tex(128,128,g=>{g.fillStyle='#b9b0a4';g.fillRect(0,0,128,128);for(let r=0;r<8;r++){for(let k=-1;k<4;k++){const ox=(r%2)*16;g.fillStyle='hsl('+(10+R2()*10)+','+(45+R2()*15)+'%,'+(36+R2()*10)+'%)';g.fillRect(k*32+ox+1,r*16+1,30,14)}}},1);
 const BR=new THREE.MeshStandardMaterial({map:brk,emissive:0x6a3a2a,emissiveIntensity:.35,roughness:.9});
 const FMt={},fm=c=>FMt[c]||(FMt[c]=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.32,roughness:.75}));
 const S=(cx,cz,w,d,h,m,y,hit)=>{const o=NX.solid(cx,cz,w,d,h,m,y||0,!!hit);o.castShadow=false;return o};
 // chão e paredes
 S(X,Z,W-.2,D-.2,.1,fm(0x8a6a4a),0,false);
 S(X,z0+t/2,W,t,WH,BR,0,true);S(X,z1-t/2,W,t,WH,BR,0,true);S(x0+t/2,Z,t,D-2*t,WH,BR,0,true);
 const dz=.95;                                                         // porta de 1,9 m centrada em Z
 S(x1-t/2,(z0+t+Z-dz)/2,t,Z-dz-z0-t,WH,BR,0,true);
 S(x1-t/2,(z1-t+Z+dz)/2,t,z1-t-Z-dz,WH,BR,0,true);
 S(x1-t/2,Z,t,dz*2,WH-2.3,BR,2.3,false);                               // verga da porta
 {const g=S(x1-t/2,z0+1.5,t*.4,1.4,1.1,new THREE.MeshStandardMaterial({color:0x8fc4ee,transparent:true,opacity:.25,depthWrite:false}),1.1,false);g.castShadow=false}
 S(X,Z,W+.6,D+.6,.3,fm(0x9a9a9a),WH,false);                            // laje do telhado
 NX.plane(Math.min(8,D),1.2,NX.signM('CASA DO HENRY','#fff','#1b4f8a',320,64),x1+.06,H-.9,Z,PI/2);
 // luminária
 {const l=new THREE.Mesh(new THREE.BoxGeometry(1.4,.05,.25),new THREE.MeshBasicMaterial({color:0xfff2cf}));l.position.set(X,WH-.05,Z);scene.add(l)}
 // tapete
 S(X-.4,Z,2.6,2.2,.02,fm(0x7a2d2d),.1,false);
 // TV + Xbox na parede oeste
 S(x0+t+.3,Z,.5,1.8,.5,fm(0x5a4030),0,true);
 S(x0+t+.15,Z,.08,1.3,.75,fm(0x0a0a0a),.6,false);
 S(x0+t+.2,Z,.02,1.15,.6,new THREE.MeshBasicMaterial({color:0x2b6fd6}),.67,false);
 S(x0+t+.35,Z+.75,.2,.2,.25,fm(0x111111),.5,false);
 S(x0+t+.46,Z+.75,.02,.02,.2,new THREE.MeshBasicMaterial({color:0x4cff4c}),.52,false);
 // sofá virado pra TV
 S(X-.9,Z,.9,2.2,.5,fm(0x4a5560),0,true);S(X-.5,Z,.3,2.2,.55,fm(0x3c4650),.4,false);
 // mesa de centro
 S(X-2,Z,.5,.8,.35,fm(0x6b4a2f),0,true);
 // PC (canto norte): mesa, monitor, torre, cadeira
 S(X+1.3,z0+t+.4,1.8,.7,.75,fm(0x3a3a3f),0,true);
 S(X+1.3,z0+t+.3,.75,.06,.45,fm(0x0a0a0a),.95,false);
 S(X+1.3,z0+t+.34,.65,.01,.36,new THREE.MeshBasicMaterial({color:0x7fd4ff}),1,false);
 S(X+.5,z0+t+.4,.25,.5,.5,fm(0x1a1a1a),.75,false);
 S(X+1.3,z0+t+1.3,.5,.5,.45,fm(0x222222),0,false);S(X+1.3,z0+t+1.5,.5,.1,.5,fm(0x222222),.45,false);
 // cama (canto sul-oeste) + criado
 S(x0+t+1.1,z1-t-.65,2,1.1,.45,fm(0x6b8bb5),0,true);S(x0+t+.35,z1-t-.65,.4,.8,.1,fm(0xf0f0f0),.45,false);
 S(x0+t+2.4,z1-t-.3,.4,.4,.4,fm(0x5a4030),0,true);
 // geladeirinha + prateleira simples
 S(x1-t-.35,z1-t-.35,.6,.6,1.1,fm(0xdddddd),0,true);
 S(X+.5,z1-t-.15,1.4,.25,.05,fm(0x5a4030),1.5,false);
 // detalhes: pôster, relógio, ventilador, lixeira, tênis, cortina, caixa de som, controle na mesinha
 S(X+1.3,z0+t+.03,.8,.02,.6,fm(0xc0392b),1.5,false);S(X+1.3,z0+t+.03,.5,.02,.3,fm(0xf1c40f),1.55,false);
 S(X-.3,z0+t+.03,.35,.02,.35,fm(0xeeeeee),2.3,false);
 S(x1-t-.3,Z-1.9,.4,.4,.05,fm(0x333333),0,false);S(x1-t-.3,Z-1.9,.05,.05,.9,fm(0x333333),.05,false);S(x1-t-.3,Z-1.9,.45,.08,.45,fm(0x888888),.9,false);
 S(x1-t-.3,z0+t+.4,.3,.3,.4,fm(0x2c3e50),0,true);
 S(x0+t+2.5,z1-t-1.4,.3,.18,.1,fm(0xffffff),0,false);S(x0+t+2.5,z1-t-1.1,.3,.18,.1,fm(0xe74c3c),0,false);
 S(x0+t+.1,z0+t+1.7,.05,.5,1.6,fm(0x2e86c1),1.3,false);S(x0+t+.4,z0+t+.5,.2,.3,.2,fm(0x222222),0,true);
 S(X-2,Z+.1,.12,.18,.02,fm(0x111111),.35,false);
}
function house(x,z,w,d,h,c,name){NX.clear(x-w/2-3,x+w/2+3,z-d/2-3,z+d/2+3);NX.solid(x,z,w,d,h,c);NX.solid(x,z,w+.6,d+.6,.3,0xbdbdbd,h,false);if(name)NX.plane(Math.min(8,d),1.2,NX.signM(name,'#fff','#1b4f8a',320,64),x+w/2+.06,h-.9,z,PI/2)}
henryHouse();house(-333,-371,8,6,3.8,0x3b8bc4,'PET SHOP DO JÚLIO');house(-333,-333,8,6,3.4,0xd9a066,'PADARIA ESTRELA');
if(0){const ox=160,oz=-160,w=0x8d8f93;NX.clear(ox-24,ox+24,oz-24,oz+24);NX.ground(46,46,0x45474b,ox,.03,oz);NX.ground(22,19,0x2f3135,ox,.05,oz);
 NX.solid(ox,oz-10,24,.6,5.5,w);NX.solid(ox-12,oz,.6,20,5.5,w);NX.solid(ox+12,oz,.6,20,5.5,w);NX.solid(ox-8,oz+10,8,.6,5.5,w);NX.solid(ox+8,oz+10,8,.6,5.5,w);NX.solid(ox,oz,25,21,.5,0x666a70,5.5,false);
 NX.plane(14,1.6,NX.signM('OFICINA DO THEO','#ffd23f','#1a1a1a',384,64),ox,6.3,oz+10.4,0);NX.solid(ox+8,oz-7,6,1.5,1.1,0x7a5a3a);NX.solid(ox-6,oz-3,3.4,6,.5,0x555a60);for(let k=0;k<4;k++)bx(1.1,.3,1.1,0x111111,ox-9,.15+k*.3,oz-8,scene)}
NX.plane(12,1.4,NX.signM('PAULISTA ONE','#e8d9a8','#0b0d12',384,64),-160,6,-11.7,0);
function tunnel(x0,x1,z){const L=x1-x0,cx=(x0+x1)/2,c=0x8d8f93;NX.solid(cx,z-8.6,L,.8,7,c);NX.solid(cx,z+8.6,L,.8,7,c);NX.solid(cx,z,L,17.6,1,c,7,false);NX.solid(x0,z,.8,17.6,1.6,c,7.6,false);
 const l=new THREE.Mesh(new THREE.BoxGeometry(L-2,.1,.6),new THREE.MeshBasicMaterial({color:0xfff2c0}));l.position.set(cx,6.9,z);scene.add(l);NX.plane(6,1.2,NX.signM('TÚNEL SANTOS DUMONT','#fff','#14508c',384,64),x0-.5,9,z,-PI/2)}
tunnel(8,56,192);
{const cx=128,cz=-192;NX.solid(cx,cz,22,76,1.2,0x9a9ca0,8.4,false);for(const a of[-10,10])for(const b of[-16,16])NX.solid(cx+a,cz+b,1.4,1.4,8.4,0x9a9ca0)}
const GAR=[[-326,-358],[131,-185],[-170,-12]];for(const g of GAR)SY.markers.push({x:g[0],z:g[1],l:'G',c:'#cfcfcf'});
const PAL=[0xd32f2f,0x2f6fb5,0x222222,0xeeeeee,0xe0a82e,0x2e8b57,0x6a4c93,0xff7a1a];
function garage(){const c=pl.car;if(!c||!GAR.some(g=>Math.hypot(c.pos.x-g[0],c.pos.z-g[1])<14)){return}if(S.money<100){msg('Garagem: precisa de R$100');return}S.money-=100;c.hp=c.mhp;c.dead=false;c.base.setHex(pk(PAL));c.cm.color.copy(c.base);msg('Garagem: reparado e repintado −R$100')}

/* ---------- eventos aleatórios ---------- */
let ev=null,evT=rr(70,130);
function rp(a,b){for(let i=0;i<12;i++){const ax=R2()<.5,k=Math.floor(rr(-5,6))*B,v=(ax?pl.pos.x:pl.pos.z)+rr(-b,b),x=ax?v:k,z=ax?k:v,d=Math.hypot(x-pl.pos.x,z-pl.pos.z);if(d>a&&d<b&&Math.abs(x)<360&&Math.abs(z)<360&&!inFav(x,z))return{x,z}}return null}
function startEv(){const p=rp(90,180);if(!p)return;const mk={x:p.x,z:p.z,l:'!',c:'#ff5252'};SY.markers.push(mk);
 if(R2()<.5){const th=mkA(p.x,p.z,{role:'thug',spd:6.4,hp:50,unarmed:1,sh:0x111111});const v=mkA(p.x+1.4,p.z,{role:'npc',unarmed:1});v.g.rotation.x=-1.4;v.g.position.y=.2;th.onkill=()=>{const m=Math.floor(rr(250,500));S.money+=m;msg('Bolsa recuperada +R$'+m);SV.rep+=3;ev.done=1};
  ev={n:'Assalto na rua! Alcance o ladrão (marcador vermelho)',t:0,max:90,mk,ents:[th,v],pos:()=>th.pos}}
 else{const s=R2()<.5?1:-1,c=mkCar('truck',p.x,s*3.2,0,{col:0xdfe6ee});c.hp=c.mhp=380;c.ai={pos:c.pos,dir:[s,0],sp:0,tv:8,pd:0};pd0(c.ai);c.pos.z=s*3.2;
  ev={n:'Carro-forte na Av. Paulista! Destrua-o para pegar o dinheiro',t:0,max:140,mk,cars:[c],pos:()=>c.pos,chk:()=>{if(c.dead){const m=Math.floor(rr(1800,3000));S.money+=m;crime(2);msg('Carro-forte aberto! +R$'+m);ev.done=1}}}}
 msg(ev.n)}
function endEv(){if(!ev)return;const i=SY.markers.indexOf(ev.mk);if(i>=0)SY.markers.splice(i,1);for(const a of ev.ents||[])rmA(a);for(const c of ev.cars||[])if(c.dead||c.pos.distanceTo(pl.pos)>200)c.del=true;ev=null}
function evTick(dt){if(SY.busy||pl.dead){return}if(!ev){evT-=dt;if(evT<=0){evT=rr(80,150);startEv()}return}
 ev.t+=dt;const p=ev.pos();ev.mk.x=p.x;ev.mk.z=p.z;ev.chk&&ev.chk();if(ev.done||ev.t>ev.max||Math.hypot(p.x-pl.pos.x,p.z-pl.pos.z)>320)endEv()}

/* ---------- laço principal ---------- */
const _u=update;
update=function(dt){TS+=(tsT-TS)*Math.min(1,dt*6);
 if(ab.on>0){ab.on-=dt;if(ab.on<=0||(ab.id=='theo'&&!pl.car))endAb();else if(ab.id!='theo')scan()}else{if(ab.cd>0)ab.cd-=dt;for(const s of pool)s.visible=false}
 _u(dt*TS);jackTick(dt);actTick(dt);pedTick();policeTick(dt);evTick(dt);waves();
 for(const f of fleers){f.t-=dt;f.p.g.position.x+=f.l[0]*5*dt;f.p.g.position.z+=f.l[1]*5*dt;anim(f.p,5,dt,{});if(f.t<=0){scene.remove(f.p.g);f.dead=1}}
 for(let i=fleers.length-1;i>=0;i--)if(fleers[i].dead)fleers.splice(i,1);
 const A=AB[PR.cur];const ws='<b>'+CHR[PR.cur].n+'</b> · [X] '+A.n+' — '+(ab.on>0?'ATIVA '+Math.ceil(ab.on)+'s':ab.cd>0?'recarga '+Math.ceil(ab.cd)+'s':'pronta')+' · [T] trocar';if(ws!==lastWho){who.innerHTML=ws;lastWho=ws}};
let lastWho='';
/* ---------- carros mais rápidos (×2,2) ---------- */
for(const t in CT){const T=CT[t];T.ac*=1.7;T.br*=2.4;T.gr*=1.3}
/* teto de velocidade por modelo (km/h); os de missão (van, ambulância, táxi) herdam do tipo base */
const VMAX={sport:220,porsche:240,sedan:165,police:190,taxi:150,suv:155,ambulance:140,pickup:145,saveiro:150,fusca:125,van:130,truck:100,bus:90,bike:180};
for(const t in VMAX)if(CT[t])CT[t].mx=VMAX[t]/3.6;

/* ---------- interiores simples (E na porta): cobertura do Messine e apartamento do Theo ---------- */
{const H=3.5,W=12,D=10,doors=[];
 const mkRoom=(rx,rz,col,floor,furn,at,out,label)=>{
  const wm=new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.5,roughness:.9});
  NX.ground(W,D,floor,rx,.05,rz);NX.solid(rx,rz-D/2,W,.4,H,wm);NX.solid(rx,rz+D/2,W,.4,H,wm);NX.solid(rx-W/2,rz,.4,D,H,wm);NX.solid(rx+W/2,rz,.4,D,H,wm);NX.solid(rx,rz,W+.8,D+.8,.3,0x555555,H,false);
  const l=new THREE.Mesh(new THREE.BoxGeometry(2,.08,1.2),new THREE.MeshBasicMaterial({color:0xfff6d8}));l.position.set(rx,H-.05,rz);scene.add(l);
  bx(1.4,2.4,.1,0x2a2018,rx,1.2,rz+D/2-.3,scene);furn(rx,rz);
  doors.push({a:at,b:{x:rx,z:rz+D/2-1.6},in:{x:rx,z:rz+D/2-2.4},ex:out,label})};
 const furnM=(x,z)=>{bx(2,.35,2.4,0x2b2b33,x-3.8,.2,z-3,scene);bx(1.9,.25,2.3,0xf4f4f4,x-3.8,.5,z-3,scene);bx(.8,.15,.4,0xe2e2e2,x-3.8,.7,z-3.9,scene);bx(.6,.05,1.6,0x3a4a7a,x-3.8,.65,z-2.4,scene);
  bx(1,.5,2.6,0x3a3f4a,x+2.5,.35,z,scene);bx(.25,.6,2.6,0x3a3f4a,x+1.95,.8,z,scene);bx(.5,.5,2.4,0x222226,x+5.5,.3,z,scene);bx(.1,1.2,2.2,0x050505,x+5.7,1.5,z,scene);bx(.02,1,2,0x2a5a9a,x+5.64,1.5,z,scene);
  NX.ground(4,3.2,0x7a2f2f,x+3,.07,z);
  bx(1.8,.08,.8,0x6b4a2b,x-3.8,.8,z+3.2,scene);for(const a of[-.8,.8])bx(.08,.8,.08,0x333333,x-3.8+a,.4,z+3.2,scene);bx(.5,.03,.35,0x888888,x-3.8,.86,z+3.2,scene);bx(.5,.35,.03,0x1a1a1a,x-3.8,1.05,z+3,scene,0);
  bx(.4,.5,.4,0x6b4a2b,x+4.8,.25,z+4,scene);const p=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,0),M(0x2f8f46));p.position.set(x+4.8,.9,z+4);scene.add(p);
  NX.plane(3,.6,NX.signM('FELIPE MESSINE','#e8d9a8','#0b0d12',384,64),x-3.8,2.2,z-4.77,0)};
 const furnT=(x,z)=>{bx(1.8,.22,2.2,0xc9d6e8,x-3.8,.15,z-3,scene);bx(.7,.15,.4,0xffffff,x-3.8,.32,z-3.9,scene);bx(1.8,.1,1.2,0xc0392b,x-3.8,.3,z-2.6,scene);
  bx(1.4,.08,1,0x8a6a3f,x+1.5,.78,z+1,scene);for(const a of[-.6,.6])for(const b of[-.4,.4])bx(.07,.78,.07,0x555555,x+1.5+a,.39,z+1+b,scene);bx(.2,.02,.08,0x111111,x+1.3,.83,z+.9,scene);
  for(const s of[-1,1]){bx(.5,.05,.5,0xd6322b,x+1.5+s*1.1,.45,z+1,scene);bx(.05,.45,.5,0xd6322b,x+1.5+s*1.35,.7,z+1,scene)}
  bx(.9,1.8,.8,0xeeeeee,x+5,.9,z-4.2,scene);bx(.05,.5,.05,0x888888,x+4.55,1.1,z-3.8,scene);bx(1,.9,.6,0xc0392b,x-5,.45,z+1,scene);bx(1,.5,.8,0x6b5a4a,x+4.5,.25,z+2,scene);bx(.9,.5,.08,0x111111,x+4.5,.75,z+2,scene);
  for(let i=0;i<3;i++)bx(.5,.15,.4,[0x3498db,0xf1c40f,0xe74c3c][i],x-4.8+i*.2,.1+i*.12,z+4,scene);
  NX.plane(1.6,1.1,NX.signM('ALUGUEL VENCE SEXTA','#c0392b','#fff3d6',384,128),x+3,1.9,z-4.77,0)};
 // ===== Cobertura do Felipe: último andar da torre Paulista One (mesma planta 26×26 da torre) =====
 {const TX=-160,TZ=-32,TH=150,S=26,HH=4.2,F=TH+1.2,P=S/2-.25,
   shell=new THREE.MeshStandardMaterial({color:0xcfd6dc,emissive:0xcfd6dc,emissiveIntensity:.35,roughness:.85}),
   GLS=new THREE.MeshStandardMaterial({color:0x8fc4ee,transparent:true,opacity:.18,roughness:.05,metalness:.4,depthWrite:false}),
   FM={},fm=c=>FM[c]||(FM[c]=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.32,roughness:.65})),
   LM=new THREE.MeshBasicMaterial({color:0xfff2cf}),SCR=new THREE.MeshBasicMaterial({color:0x2d62a8}),MUL=fm(0x2c3138);
  NX.clear(TX-20,TX+20,TZ-20,TZ+20);                       // remove base + torre sorteadas desse quarteirão
  building(TX,TZ,40,40,11,0x9bb8d3);building(TX,TZ,S,S,TH,0x7f9db8);NX.solid(TX,TZ,S,S,1.2,0x5d6b78,TH,false);
  const n0=scene.children.length,b0=BL.length;
  // móvel (hit=1 colide) e luz emissiva; coordenadas relativas ao centro, y = altura da base
  const T=(w,h,d,c,x,y,z,hit)=>{const m=NX.solid(TX+x,TZ+z,w,d,h,fm(c),y,!!hit);m.castShadow=false;return m};
  const L=(w,h,d,x,y,z,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||LM);o.position.set(TX+x,y+h/2,TZ+z);scene.add(o);return o};
  // paredes: pilares + faixas de vidro (peitoril baixo, vidro quase até o teto) com montantes
  const wall=(alongX,c,spans,sill,head)=>{const e=S/2;let p=-e;
   const seg=(a,b,y0,h,m)=>{if(b-a<.01||h<.01)return;const s=alongX?NX.solid(TX+(a+b)/2,TZ+c,b-a,.5,h,m,y0):NX.solid(TX+c,TZ+(a+b)/2,.5,b-a,h,m,y0);if(m===GLS)s.castShadow=false};
   for(const[a,b]of spans){seg(p,a,0,HH,shell);seg(a,b,0,sill,shell);seg(a,b,head,HH-head,shell);seg(a,b,sill,head-sill,GLS);
    const n=Math.ceil((b-a)/4.5);for(let i=1;i<n;i++){const q=a+(b-a)*i/n,s=alongX?NX.solid(TX+q,TZ+c,.14,.6,head-sill,MUL,sill,false):NX.solid(TX+c,TZ+q,.6,.14,head-sill,MUL,sill,false);s.castShadow=false}
    p=b}
   seg(p,e,0,HH,shell)};
  wall(true,P,[[-11.8,-2.2],[2.2,11.8]],.5,3.7);           // sul (fachada p/ a Paulista) — porta no pilar central
  wall(true,-P,[[-1,11.8]],.5,3.7);                        // norte — cozinha no pilar
  wall(false,-P,[[-11.8,-5.5],[3.5,11.8]],.5,3.7);         // oeste — cama no pilar
  wall(false,P,[[-11.8,-3],[3,11.8]],.5,3.7);              // leste — TV no pilar
  // piso de tacos, teto e luminárias
  const pq=tex(256,256,(g,w,h)=>{g.fillStyle='#24170e';g.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let k=-1;k<3;k++){g.fillStyle=`hsl(${26+r%3*2},${38+r%2*6}%,${30+(r+k+8)%4*3}%)`;g.fillRect((r%2)*64+k*128+1,r*32+1,126,30)}},6);
  NX.ground(S-1,S-1,new THREE.MeshStandardMaterial({map:pq,emissive:0xffffff,emissiveMap:pq,emissiveIntensity:.4,roughness:.35,metalness:.1}),TX,.06,TZ);
  NX.solid(TX,TZ,S+1.4,S+1.4,.4,0x4a525c,HH,false);T(S-1,.05,S-1,0xe9e6df,0,HH-.05,0);
  for(const x of[-8,0,8])for(const z of[-8,0,8])L(1.6,.05,.5,x,HH-.1,z);
  // entrada (sul)
  T(1.7,2.7,.12,0x2a1c12,0,0,12.4);T(.12,2.8,.2,0x1a120a,-.9,0,12.4);T(.12,2.8,.2,0x1a120a,.9,0,12.4);T(1.9,.12,.2,0x1a120a,0,2.7,12.4);T(.05,.05,.4,0xd4af37,.6,1.05,12.28);
  NX.plane(3.2,.6,NX.signM('FELIPE MESSINE','#e8d9a8','#0b0d12',384,64),TX,3.3,TZ+12.47,PI);
  T(10.6,.01,4,0xdedede,0,.07,10.2);T(1.6,.45,.5,0x6b4a2b,-3.4,0,11.9,1);
  const bk=[0xc0392b,0x2980b9,0xf1c40f,0x27ae60,0x8e44ad,0xe67e22];
  for(const sx of[-1,1]){T(1,2.2,.35,0x4a3320,sx*1.45,0,12.3,1);for(let k=0;k<3;k++)for(let i=0;i<5;i++)T(.12,.3,.22,bk[(i+k*2+(sx>0?3:0))%6],sx*1.45-.4+i*.2,.35+k*.7,12.3)}
  // sala de estar: sofá + TV no pilar leste
  T(.1,1.6,3,0x070707,12.35,.9,0);L(.02,1.4,2.8,12.29,1,0,SCR);T(.55,.5,4.4,0x2a2a2e,12.2,0,0,1);for(const s of[-1,1])T(.35,1.2,.35,0x111114,12.2,0,s*2.7,1);
  T(2.5,.03,6.4,0x2f3a52,7.4,.065,0);T(1,.45,5.6,0x3a3f4a,3.9,0,0,1);T(.3,.6,5.6,0x3a3f4a,3.45,.45,0,1);for(const s of[-1,1]){T(1,.25,.35,0x3a3f4a,3.9,.45,s*2.95);T(.7,.15,1.7,0x4a5060,4.05,.45,s*1.9)}T(.7,.15,1.7,0x4a5060,4.05,.45,0);
  for(const s of[-1,1])T(.25,.3,.5,0xc98a2b,3.75,.6,s*2.2);
  T(2,.06,1.1,0xeaeaec,7.2,.42,0,1);for(const a of[-.9,.9])for(const b of[-.45,.45])T(.06,.42,.06,0x111114,7.2+a,.07,b);
  for(const s of[-1,1]){T(1.1,.4,1.1,0xb8863b,7.4,0,s*4.3,1);T(1.1,.6,.25,0xb8863b,7.4,.4,s*4.95,1)}
  T(.06,1.6,.06,0x333333,3.7,0,-3.7);L(.4,.4,.4,3.7,1.6,-3.7);
  // jantar
  T(3.6,.06,1.3,0xe8dcc8,4.5,.74,-8,1);for(const a of[-1.6,1.6])for(const b of[-.5,.5])T(.08,.74,.08,0x222222,4.5+a,0,-8+b);
  for(const s of[-1,1])for(const a of[-1.1,0,1.1]){T(.5,.45,.5,0x5a4636,4.5+a,0,-8+s*1.05);T(.5,.55,.08,0x5a4636,4.5+a,.45,-8+s*1.33)}
  L(2.8,.12,.5,4.5,HH-1,-8);for(const a of[-1.2,1.2])T(.02,1,.02,0x333333,4.5+a,HH-1,-8);
  // cozinha (pilar norte)
  T(9,.9,.65,0x2b2f38,-7,0,-12.15,1);T(9.1,.06,.7,0xf0f0f2,-7,.9,-12.15);T(5.5,.9,.38,0x3a3f4a,-8.75,1.7,-12.3);
  for(const a of[-.3,.3])for(const b of[-.2,.2])T(.3,.02,.3,0x111111,-4+a,.96,-12.15+b);
  T(.9,.25,.5,0xc8ccd0,-4,2.2,-12.2);T(.3,.8,.25,0xc8ccd0,-4,2.45,-12.35);T(.8,.02,.5,0x888888,-9,.96,-12.15);T(.04,.3,.04,0xcccccc,-9,.96,-12.4);
  T(1,2.1,.8,0xc8ccd0,-1.7,0,-12.1,1);T(.04,.8,.04,0x333333,-2,.9,-11.68);
  T(4.2,.92,1.3,0x2b2f38,-7,0,-7.4,1);T(4.3,.06,1.4,0xeae8e4,-7,.92,-7.4);
  for(const a of[-1.4,0,1.4]){T(.4,.06,.4,0x222222,-7+a,.68,-6.15);T(.08,.68,.08,0x777777,-7+a,0,-6.15);L(.35,.22,.35,-7+a,HH-.8,-7.4);T(.02,.6,.02,0x333333,-7+a,HH-.6,-7.4)}
  // quarto (pilar oeste)
  T(.2,1.5,2.7,0x4a3a2c,-12.35,0,-1,1);T(2.2,.35,2.2,0x2b2b33,-11.2,0,-1,1);T(2.1,.25,2.1,0xf4f4f4,-11.15,.35,-1);T(1,.07,2.12,0x3a4a7a,-10.7,.6,-1);
  for(const z of[-1.7,-.3])T(.45,.15,.8,0xe2e2e8,-12,.6,z);T(3.4,.03,3.4,0x8a7a66,-10.8,.065,-1);T(.5,.4,1.8,0x6b5a4a,-9.7,0,-1,1);
  for(const z of[-2.85,.85]){T(.5,.55,.5,0x6b4a2b,-12.2,0,z,1);T(.05,.3,.05,0x333333,-12.2,.55,z);L(.22,.22,.22,-12.2,.85,z)}
  const art=tex(256,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#1d3557');gr.addColorStop(1,'#e8b04a');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.arc(70,60,26,0,6.3);g.fill();g.fillStyle='rgba(20,20,30,.8)';g.fillRect(130,30,70,80);g.fillStyle='#c0392b';g.fillRect(160,70,60,30)});
  NX.plane(2.8,1.4,new THREE.MeshBasicMaterial({map:art}),TX-12.47,2.6,TZ-1,PI/2);
  // escritório + xadrez (canto sudoeste)
  T(1,.05,2.6,0x6b4a2b,-10.7,.74,8.6,1);for(const a of[-.4,.4])for(const b of[-1.2,1.2])T(.06,.74,.06,0x222222,-10.7+a,0,8.6+b);
  for(const z of[8.1,9.1]){T(.06,.2,.06,0x111111,-10.95,.79,z);L(.04,.55,.9,-10.95,.99,z,SCR)}
  T(.55,.08,.55,0x222226,-9.6,.48,8.6);T(.08,.65,.55,0x222226,-9.35,.56,8.6);T(.08,.48,.08,0x222226,-9.6,0,8.6);
  T(.9,.55,.9,0x3b2a1a,-5.8,0,9.4,1);const cb=new THREE.MeshStandardMaterial({map:tex(64,64,g=>{for(let i=0;i<8;i++)for(let j=0;j<8;j++){g.fillStyle=(i+j)%2?'#1c1c1c':'#eee';g.fillRect(i*8,j*8,8,8)}}),roughness:.5});
  NX.ground(.8,.8,cb,TX-5.8,.56,TZ+9.4);for(let i=0;i<4;i++){T(.07,.18,.07,i%2?0x111111:0xf0f0f0,-5.95+i*.1,.56,9.3+i%2*.2)}
  for(const s of[-1,1])T(.4,.45,.4,0x444444,-5.8,0,9.4+s*.9);
  // acabamento: rodapé e sanca de gesso, spots de teto embutidos e faixa de LED no forro
  for(const sz of[-1,1]){T(S-.9,.14,.06,0x2a2e34,0,0,sz*(P-.25));T(S-.9,.12,.12,0xf2efe8,0,HH-.12,sz*(P-.3),0)}
  for(const sx of[-1,1]){T(.06,.14,S-.9,0x2a2e34,sx*(P-.25),0,0);T(.12,.12,S-.9,0xf2efe8,sx*(P-.3),HH-.12,0,0)}
  for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)L(.35,.03,.35,i*4.6,HH-.04,j*4.6);
  L(S-4,.03,.12,0,HH-.05,-9.4);L(S-4,.03,.12,0,HH-.05,9.4);
  // plantas
  for(const[x,z]of[[10.8,10.8],[10.8,-10.8],[3.6,11.6],[11.2,4.6]]){T(.6,.5,.6,0x6b4a2b,x,0,z,1);for(const[r,y,m]of[[.55,1,1],[.35,1.5,.8]]){const p=new THREE.Mesh(new THREE.IcosahedronGeometry(r,0),fm(0x2f8f46));p.position.set(TX+x,y,TZ+z);scene.add(p)}}
  // antena com luz de aviso no teto
  NX.solid(TX+8,TZ+8,.3,.3,10,0xdddddd,HH+.4,false);const bm_=new THREE.MeshBasicMaterial({color:0xff2222}),bc_=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),bm_);bc_.position.set(TX+8,HH+10.6,TZ+8);scene.add(bc_);NX.bcn=bm_;
  // sobe a sala inteira para o topo da torre
  const g=new THREE.Group();g.position.y=F;scene.add(g);scene.children.slice(n0).forEach(o=>{if(o!==g)g.add(o)});
  for(let i=b0;i<BL.length;i++)BL[i].h+=F;
  pl.fyf=(x,z,y)=>y>F-1&&Math.abs(x-TX)<12.9&&Math.abs(z-TZ)<12.9?F:0;   // chão do jogador dentro da cobertura
  doors.push({a:{x:-160,z:-10.4},b:{x:TX,z:TZ+11.2},in:{x:TX,y:F,z:TZ+10.2},ex:{x:-160,z:-9.2},label:'cobertura do Felipe'})}
 // ===== Casa do Theo: laje simples no topo de um prédio perto da oficina (versão pobre da cobertura do Felipe) =====
 {const OX=160,OZ=-160,TH=24,F2=TH+1.2,RH=3;
  let pick=null,pd=1e9;
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){if(park[i][j])continue;
   const cx=(i-N/2+.5)*B,cz=(j-N/2+.5)*B,d=Math.hypot(cx-OX,cz-OZ);
   if(d<30||d>150||d>=pd)continue;
   if(cx+24>117&&cx-24<139&&cz+24>-236&&cz-24<-148)continue;                       // viaduto
   if(BL.some(b=>b.k&&(b.x0+b.x1)/2>cx-24&&(b.x0+b.x1)/2<cx+24&&(b.z0+b.z1)/2>cz-24&&(b.z0+b.z1)/2<cz+24))continue;   // posto, loja, galpão
   pick=[cx,cz];pd=d}
  if(pick){
   const CX=pick[0],CZ=pick[1]+8,BZ0=pick[1];
   NX.clear(CX-24,CX+24,BZ0-24,BZ0+24);
   {const zero=new THREE.Matrix4().makeScale(0,0,0),m=new THREE.Matrix4();   // some o ar-condicionado/caixa d'água que ficou flutuando
    scene.traverse(o=>{if(!o.isInstancedMesh)return;let ch=0;for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);const e=m.elements;if(e[13]>4&&Math.abs(e[12]-CX)<21&&Math.abs(e[14]-BZ0)<21){o.setMatrixAt(i,zero);ch=1}}if(ch)o.instanceMatrix.needsUpdate=true})}
   building(CX,BZ0-11,34,16,rr(9,13),pk(PS_));building(CX-16.5,CZ,9,20,rr(8,13),pk(PS_));building(CX+16.5,CZ,9,20,rr(8,13),pk(PS_));
   building(CX,CZ,22,20,TH,0xc9b79c);BL[BL.length-1].w=0;window.THEO_BLD={CX,CZ,b:BL[BL.length-1]};                           // w=0: o props.js não põe lixo no telhado
   NX.solid(CX,CZ,22.6,20.6,1.2,0x5d6b78,TH,false);
   const n0=scene.children.length,b0=BL.length;
   const FM={},fm=c=>FM[c]||(FM[c]=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.32,roughness:.75})),
    shell=new THREE.MeshStandardMaterial({color:0xe6dccb,emissive:0xe6dccb,emissiveIntensity:.3,roughness:.9}),
    GLS=new THREE.MeshStandardMaterial({color:0x8fc4ee,transparent:true,opacity:.18,roughness:.05,metalness:.4,depthWrite:false}),
    LM=new THREE.MeshBasicMaterial({color:0xfff2cf}),SCR=new THREE.MeshBasicMaterial({color:0x2d62a8}),MUL=fm(0x2c3138);
   const T=(w,h,d,c,x,y,z,hit)=>{const m=NX.solid(CX+x,CZ+z,w,d,h,fm(c),y,!!hit);m.castShadow=false;return m},
    L=(w,h,d,x,y,z,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||LM);o.position.set(CX+x,y+h/2,CZ+z);scene.add(o);return o};
   const seg=(ax,c,a,b,y0,h,m)=>{if(b-a<.01||h<.01)return;(ax?NX.solid(CX+(a+b)/2,CZ+c,b-a,.4,h,m,y0):NX.solid(CX+c,CZ+(a+b)/2,.4,b-a,h,m,y0)).castShadow=false};
   const wall=(ax,c,e0,e1,spans,sill,head)=>{let p=e0;for(const[a,b]of spans){seg(ax,c,p,a,0,RH,shell);seg(ax,c,a,b,0,sill,shell);seg(ax,c,a,b,head,RH-head,shell);seg(ax,c,a,b,sill,head-sill,GLS);
     const n=Math.ceil((b-a)/3);for(let i=1;i<n;i++){const q=a+(b-a)*i/n;(ax?NX.solid(CX+q,CZ+c,.12,.5,head-sill,MUL,sill,false):NX.solid(CX+c,CZ+q,.5,.12,head-sill,MUL,sill,false)).castShadow=false}p=b}seg(ax,c,p,e1,0,RH,shell)};
   // laje (terraço) + piso cerâmico barato da sala
   const laje=tex(128,128,g=>{g.fillStyle='#9d9b94';g.fillRect(0,0,128,128);gn(g,128,128,900,.12);for(let i=0;i<8;i++){g.fillStyle='rgba(60,55,45,.18)';g.beginPath();g.arc(R2()*128,R2()*128,rr(6,18),0,6.3);g.fill()}},5),
    piso=tex(64,64,g=>{g.fillStyle='#cdbfa6';g.fillRect(0,0,64,64);g.strokeStyle='#a89a80';g.lineWidth=2;g.strokeRect(0,0,64,64);gn(g,64,64,120,.12)},6);
   NX.ground(21.6,19.6,new THREE.MeshStandardMaterial({map:laje,emissive:0x333333,roughness:.95}),CX,.04,CZ);
   NX.ground(12.6,9.6,new THREE.MeshStandardMaterial({map:piso,emissive:0x2a2a2a,roughness:.7}),CX,.06,CZ-2.5);
   // sala 13×10 (bem menor que a do Felipe): sul = porta + janela, norte/oeste/leste = janelinhas
   wall(true,2.25,-6.5,6.5,[[.5,5.5]],.9,2.3);wall(true,-7.25,-6.5,6.5,[[-4,-1.5]],1.2,2.3);
   wall(false,-6.25,-7.5,2.5,[[-5,-1]],.9,2.3);wall(false,6.25,-7.5,2.5,[[-5.5,.5]],.9,2.3);
   T(13,.05,10.2,0xe9e6df,0,RH-.05,-2.5);NX.solid(CX,CZ-2.5,14,11.2,.35,0x6a6f75,RH,false);
   L(.18,.18,.18,-1,RH-.6,-2.8);T(.015,.45,.015,0x111111,-1,RH-.45,-2.8);                // lâmpada pelada no fio
   // porta (no pilar sul)
   T(1.5,2.2,.1,0x3a2d22,-3,0,2.02);T(.05,.05,.12,0xd4af37,-2.4,1.05,1.98);
   // cama = colchão no chão, roupas e caixote de criado-mudo
   T(1.5,.22,2,0xb9c7d9,-4.7,0,-6.1);T(.6,.1,.35,0xffffff,-4.7,.22,-6.9);T(1.45,.06,1.1,0xc0392b,-4.7,.22,-5.5);
   T(.7,.3,.5,0x3a5a8a,-3,0,-6.9);T(.5,.2,.4,0xf1c40f,-3.05,.3,-6.9);T(.45,.4,.45,0x8a6a3f,-3.5,0,-5.3,1);L(.2,.2,.2,-3.5,.4,-5.3);
   // estante de tijolo e tábua
   for(const x of[-1.8,-.4])T(.3,.5,.3,0xa9583a,x,0,-7.05,1);T(1.9,.05,.35,0x8a6a3f,-1.1,.5,-7.05);for(let i=0;i<5;i++)T(.2,.28,.25,[0xc0392b,0x2980b9,0xf1c40f,0x27ae60,0x8e44ad][i],-1.8+i*.35,.55,-7.05);
   // cozinha minúscula: geladeira velha, fogão de 2 bocas, botijão e tábua de bancada
   T(.8,1.6,.7,0xe8e4d8,5.6,0,-6.9,1);T(.04,.6,.04,0x777777,5.2,.7,-6.5);T(.6,.8,.55,0xcfcfcf,4.6,0,-7,1);T(.2,.02,.2,0x111111,4.45,.8,-7.1);T(.2,.02,.2,0x111111,4.75,.8,-7.1);
   {const gz=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.5,10),M(0xd6a000));gz.position.set(CX+3.9,.25,CZ-7);scene.add(gz)}
   T(1.5,.06,.55,0x8a6a3f,2.8,.85,-7,1);for(const x of[2.15,3.45])T(.05,.85,.05,0x555555,x,0,-7);T(.3,.2,.3,0xaaaaaa,2.3,.91,-7);
   // mesa dobrável com duas cadeiras de plástico e um tapete
   T(2.3,.015,2.6,0x4a6a8a,-1.6,.075,-2.8);T(1.1,.05,.75,0xdedede,-1.6,.73,-2.8,1);for(const a of[-.5,.5])for(const b of[-.33,.33])T(.05,.73,.05,0x555555,-1.6+a,0,-2.8+b);
   for(const[z,s]of[[-2,1],[-3.6,-1]]){T(.42,.05,.42,0xd6322b,-1.6,.44,z);T(.42,.5,.05,0xd6322b,-1.6,.44,z+s*.23);for(const a of[-.17,.17])for(const b of[-.17,.17])T(.04,.44,.04,0xeeeeee,-1.6+a,0,z+b)}
   // sofá velho com manta, TV de tubo em cima de um caixote
   T(.9,.4,1.7,0x6b5a4a,2.3,0,1,1);T(.25,.6,1.7,0x6b5a4a,1.8,.4,1);T(.7,.05,.8,0xc98a2b,2.3,.4,1.3);
   T(.7,.5,.5,0x8a6a3f,5.5,0,1.2,1);T(.55,.45,.45,0x1c1c1f,5.5,.5,1.2);L(.02,.32,.38,5.2,.58,1.2,SCR);T(.02,.45,.02,0xcccccc,5.5,.95,1.05);T(.02,.45,.02,0xcccccc,5.5,.95,1.35);
   // ===== detalhes do apartamento (o que era caixote genérico agora é coisa reconhecível) =====
   {const mt=(w,h,fn)=>new THREE.MeshBasicMaterial({map:tex(w,h,fn,1)}),pla=(w,h,m,x,y,z,ry)=>NX.plane(w,h,m,CX+x,y,CZ+z,ry||0);
   // COZINHA: pia com torneira, escorredor com pratos, panela e chaleira no fogão, geladeira com freezer e ímãs
   T(.9,.85,.5,0xb8bcc2,1.2,0,-6.95,1);T(.6,.03,.34,0x7d838b,1.2,.85,-6.95);T(.04,.28,.04,0xdddddd,1.2,.88,-7.12);T(.04,.04,.2,0xdddddd,1.2,1.12,-7.02);
   T(.5,.04,.3,0xdde2e8,3.1,.91,-7);for(let i=0;i<3;i++)T(.02,.2,.22,0xffffff,2.95+i*.12,.95,-7);
   T(.26,.18,.26,0x9aa0a6,4.45,.82,-7.1);T(.14,.03,.04,0x333333,4.68,.95,-7.1);T(.18,.2,.18,0xd6322b,4.75,.82,-7.1);T(.04,.05,.04,0x222222,4.75,1.02,-7.1);
   T(.8,.02,.02,0x999999,5.6,1.05,-6.54);T(.04,.25,.04,0x777777,5.2,1.25,-6.5);T(.07,.07,.02,0xe74c3c,5.85,1.35,-6.54);T(.07,.07,.02,0x2980b9,5.65,1.25,-6.54);T(.14,.18,.01,0xffffff,5.45,1.3,-6.54);
   // MESA: fruteira, garrafa térmica, copos e um carburador desmontado em cima de um pano (ele é mecânico)
   T(.32,.08,.32,0xc98a2b,-1.95,.78,-2.65);T(.1,.1,.1,0xf1c40f,-2,.86,-2.65);T(.1,.1,.1,0xd32f2f,-1.9,.86,-2.6);T(.09,.09,.09,0x27ae60,-1.95,.86,-2.72);
   T(.1,.3,.1,0xc0392b,-1.25,.78,-2.6);T(.12,.05,.12,0x222222,-1.25,1.08,-2.6);T(.07,.09,.07,0xffffff,-1.4,.78,-2.9);T(.07,.09,.07,0xffffff,-1.15,.78,-2.95);
   T(.4,.01,.3,0x8f8f8f,-1.7,.78,-3);T(.2,.13,.16,0x9aa0a6,-1.7,.79,-3);T(.12,.08,.12,0x6b6f76,-1.7,.92,-3);T(.2,.03,.03,0xf1c40f,-1.45,.79,-3.05);
   // SALA: braços e almofada no sofá, controle remoto; entrada: capacho, chinelos, caixa de ferramentas, botas e macacão com o nome dele
   T(.8,.28,.18,0x5a4a3a,2.35,.4,.24);T(.8,.28,.18,0x5a4a3a,2.35,.4,1.76);T(.4,.12,.45,0x9c3b2e,2.5,.4,.55);T(.06,.03,.18,0x1a1a1a,2.4,.45,1.35);
   T(.9,.015,.6,0x6b4a2b,-3,0,1.6);T(.1,.03,.26,0x2f6fb5,-3.25,.015,1.6);T(.1,.03,.26,0x2f6fb5,-2.95,.015,1.55);
   T(.6,.3,.35,0xc0392b,-4.2,0,1.6,1);T(.4,.04,.04,0x777777,-4.2,.3,1.6);T(.15,.3,.3,0x3a2d22,-5.05,0,1.5);T(.15,.3,.3,0x3a2d22,-5.3,0,1.5);
   T(.5,.06,.06,0x6b4a2b,-5.3,1.9,1.98);T(.5,.85,.06,0x1b4f8a,-5.3,1.05,1.97);T(.2,.5,.06,0x1b4f8a,-5.4,.55,1.97);T(.2,.5,.06,0x1b4f8a,-5.2,.55,1.97);
   pla(.26,.1,NX.signM('THEO','#fff','#c0392b',128,48),-5.3,1.55,1.93,PI);
   // QUARTO: cômoda de 3 gavetas com porta-retrato, ventilador de coluna
   T(.5,.9,1.2,0x8a6a3f,-5.8,0,-2.9,1);T(.02,.02,1.1,0x3a2d22,-5.54,.3,-2.9);T(.02,.02,1.1,0x3a2d22,-5.54,.6,-2.9);
   for(const y of[.15,.45,.75])T(.04,.05,.05,0xd4af37,-5.53,y,-2.9);
   T(.04,.22,.3,0x6b4a2b,-5.9,.9,-2.6);T(.01,.17,.24,0xdbe7f3,-5.87,.92,-2.6);
   T(.4,.04,.4,0x333840,-.4,0,-4.6);T(.04,.95,.04,0xbbbbbb,-.4,.04,-4.6);T(.38,.38,.12,0x2f6fb5,-.4,.99,-4.6);T(.3,.3,.02,0xdddddd,-.4,1.03,-4.52);
   // PAREDES: calendário, relógio e foto da família
   pla(.5,.7,mt(128,180,g=>{g.fillStyle='#f4ecd8';g.fillRect(0,0,128,180);g.fillStyle='#c0392b';g.fillRect(0,0,128,34);g.fillStyle='#fff';g.font='bold 20px sans-serif';g.textAlign='center';g.fillText('NOVEMBRO',64,24);
    g.fillStyle='#222';g.font='11px sans-serif';for(let i=0;i<30;i++)g.fillText(i+1,14+(i%7)*17,56+Math.floor(i/7)*22);g.strokeStyle='#c0392b';g.lineWidth=2;g.beginPath();g.arc(14+(19%7)*17,52+Math.floor(19/7)*22,9,0,6.3);g.stroke()}),-.8,1.55,-7.04);
   pla(.4,.4,mt(128,128,g=>{g.fillStyle='#fff';g.beginPath();g.arc(64,64,62,0,6.3);g.fill();g.strokeStyle='#222';g.lineWidth=4;g.stroke();g.lineWidth=2;for(let i=0;i<12;i++){const a=i*Math.PI/6;g.beginPath();g.moveTo(64+Math.sin(a)*52,64-Math.cos(a)*52);g.lineTo(64+Math.sin(a)*58,64-Math.cos(a)*58);g.stroke()}
    g.lineWidth=5;g.beginPath();g.moveTo(64,64);g.lineTo(64,28);g.stroke();g.beginPath();g.moveTo(64,64);g.lineTo(88,74);g.stroke()}),.2,2.2,-7.04);
   pla(.6,.45,mt(192,144,g=>{g.fillStyle='#7fb5e0';g.fillRect(0,0,192,144);g.fillStyle='#5fa35a';g.fillRect(0,100,192,44);
    for(const[x,h,c]of[[50,56,'#c0392b'],[96,70,'#f1c40f'],[142,50,'#3498db']]){g.fillStyle=c;g.fillRect(x-16,144-h,32,h-20);g.fillStyle='#e0b090';g.beginPath();g.arc(x,144-h-6,13,0,6.3);g.fill()}
    g.strokeStyle='#6b4a2b';g.lineWidth=8;g.strokeRect(0,0,192,144)}),3,1.9,-7.04);
   // LAJE: tanque de lavar roupa com torneira, balde, grelha e espetos na churrasqueira
   T(.9,.85,.55,0xdfe6ee,-7.5,0,8.6,1);T(.6,.02,.35,0x7d9bb5,-7.5,.85,8.6);T(.04,.25,.04,0xcccccc,-7.5,.87,8.8);T(.3,.3,.3,0x2f6fb5,-6.5,0,8.7);
   T(1.1,.03,.45,0xbfc5cc,8.3,1.02,6.5);T(.03,.03,.6,0x999999,8.0,1.1,6.5);T(.03,.03,.6,0x999999,8.4,1.1,6.5)}
   // mais detalhes: rodapé, ventilador de teto, cortinas, pôster, violão, cesto de roupa, filtro, lixeira, pote de gato, extensão e planta
   T(12.8,.1,.04,0x8a8478,0,0,-7.03);T(.04,.1,9.4,0x8a8478,-6.03,0,-2.5);T(.04,.1,9.4,0x8a8478,6.03,0,-2.5);
   {T(.05,.3,.05,0x777777,-1,RH-.4,1.5);T(1.1,.03,.12,0x6b4a2b,-1,RH-.55,1.5);T(.12,.03,1.1,0x6b4a2b,-1,RH-.55,1.5);T(.22,.1,.22,0x333333,-1,RH-.58,1.5)}
   for(const x of[.6,5.2])T(.55,1.3,.05,0xc0392b,x,.9,2.0);
   T(.8,.02,.3,0x555a60,2.9,2.45,2.02);
   NX.plane(.9,.6,new THREE.MeshBasicMaterial({map:tex(160,110,g=>{g.fillStyle='#14161c';g.fillRect(0,0,160,110);g.fillStyle='#c0392b';g.fillRect(25,60,110,22);g.fillStyle='#e6e6e6';g.fillRect(50,48,55,16);g.fillStyle='#222';g.beginPath();g.arc(48,84,11,0,6.3);g.arc(112,84,11,0,6.3);g.fill();g.fillStyle='#ffd23f';g.font='bold 14px sans-serif';g.fillText('TURBO',52,22)},1)}),CX-4.7,1.7,CZ-7.04,0);
   T(.3,.8,.05,0xb5793a,-5.55,0,-4.3);T(.1,.5,.04,0x3a2d22,-5.55,.55,-4.28);T(.28,.12,.04,0xb5793a,-5.55,.2,-4.28);
   T(.45,.4,.35,0x9bb5d0,-2.2,0,-5.8,1);T(.4,.02,.3,0x7d98b5,-2.2,.4,-5.8);
   T(.2,.35,.2,0x4a90c9,1.9,.91,-7);T(.3,.3,.3,0x2c2c2c,.4,0,-6.9,1);T(.28,.02,.28,0x111111,.4,.3,-6.9);
   T(.2,.05,.2,0xd6322b,3.6,0,-5.4);T(.12,.03,.12,0xdddddd,3.6,.05,-5.4);
   T(.04,.03,2.2,0xf1c40f,5.9,.02,-.5);T(.1,.06,.12,0xffffff,5.9,.02,.7);
   T(.25,.3,.25,0x6b4a2b,5.7,0,2.0);{const pp=new THREE.Mesh(new THREE.IcosahedronGeometry(.32,0),M(0x2f8f46));pp.position.set(CX+5.7,.65,CZ+2.0);scene.add(pp)}
   // caixas de papelão e aviso de aluguel na parede
   T(.6,.5,.6,0x9a7a52,-5.8,0,-.9,1);T(.5,.4,.5,0xa88a60,-5.8,.5,-.9);T(.5,.35,.5,0x9a7a52,-5.75,0,-.1,1);
   NX.plane(1.8,.6,NX.signM('ALUGUEL VENCE SEXTA','#c0392b','#fff3d6',384,128),CX-6.03,1.9,CZ+1.1,PI/2);
   // telhado da sala: caixa d'água, antena de TV
   {const st=T(1.4,.4,1.4,0xa9583a,4.5,RH+.35,-5.5),tk=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,1.2,14),M(0x2a7fd4,.6));tk.position.set(CX+4.5,RH+.35+.4+.6,CZ-5.5);tk.castShadow=true;scene.add(tk)}
   T(.05,2.4,.05,0x888888,-5,RH+.35,-5.5);T(1,.04,.04,0x999999,-5,RH+.35+2.1,-5.5);T(.7,.04,.04,0x999999,-5,RH+.35+1.7,-5.5);
   // laje: varal com roupas, mesinha de plástico, churrasqueira de tijolo, vaso
   for(const x of[-9.5,-3.5])T(.06,2.2,.06,0x777777,x,0,6.5);T(6,.02,.02,0xaaaaaa,-6.5,2.15,6.5);
   for(let i=0;i<6;i++)T(.45,.7,.04,pk([0xe74c3c,0xf1c40f,0x3498db,0xecf0f1,0x2ecc71,0xe67e22]),-9+i*.95,1.45,6.5);
   T(.8,.05,.8,0xf0f0f0,5,.7,6.5,1);for(const a of[-.35,.35])for(const b of[-.35,.35])T(.05,.7,.05,0xe0e0e0,5+a,0,6.5+b);
   for(const[x,s]of[[3.9,-1],[6.1,1]]){T(.4,.05,.4,0xeeeeee,x,.44,6.5);T(.05,.5,.4,0xeeeeee,x+s*.2,.44,6.5);for(const a of[-.15,.15])for(const b of[-.15,.15])T(.04,.44,.04,0xdddddd,x+a,0,6.5+b)}
   T(1.4,.9,.7,0xa9583a,8.3,0,6.5,1);T(1.2,.05,.5,0x222222,8.3,.9,6.5);
   T(.4,.4,.4,0xc0392b,-9.8,0,8.7,1);{const pl_=new THREE.Mesh(new THREE.IcosahedronGeometry(.4,0),M(0x2f8f46));pl_.position.set(CX-9.8,.7,CZ+8.7);scene.add(pl_)}
   // mureta em volta da laje (alta o bastante para não dar pra pular)
   T(22.6,1.7,.3,0xb4aea4,0,0,-9.85,1);T(22.6,1.7,.3,0xb4aea4,0,0,9.85,1);T(.3,1.7,20,0xb4aea4,-10.85,0,0,1);T(.3,1.7,20,0xb4aea4,10.85,0,0,1);
   // sobe tudo para o topo do prédio
   const g=new THREE.Group();g.position.y=F2;scene.add(g);scene.children.slice(n0).forEach(o=>{if(o!==g)g.add(o)});
   for(let i=b0;i<BL.length;i++)BL[i].h+=F2;
   const pf=pl.fyf;pl.fyf=(x,z,y)=>y>F2-1&&Math.abs(x-CX)<10.8&&Math.abs(z-CZ)<9.8?F2:(pf?pf(x,z,y):0);
   // porta na fachada sul do prédio (E para subir)
   bx(1.5,2.5,.14,0x2a2018,CX-5,1.25,CZ+10.08,scene);NX.plane(2.6,.55,NX.signM('APTO DO THEO','#ffd23f','#1a1a1a',320,64),CX-5,3.2,CZ+10.1,0);
   doors.push({a:{x:CX-5,z:CZ+11.6},b:{x:CX-3,z:CZ+1},in:{x:CX-3,y:F2,z:CZ+1.2},ex:{x:CX-5,z:CZ+12.6},label:'apartamento do Theo'});SY.markers.push({x:CX-5,z:CZ+12.6,l:'AP',c:'#4dd2ff',edge:1})}}
 bx(2.2,2.8,.15,0x2a2018,-160,1.4,-11.85,scene);NX.plane(4,.7,NX.signM('PAULISTA ONE — COBERTURA','#e8d9a8','#0b0d12',384,64),-160,3.4,-11.7,0);
 const near=()=>{for(const d of doors){if(pl.pos.y<5&&Math.hypot(pl.pos.x-d.a.x,pl.pos.z-d.a.z)<3)return[d,1];if(Math.abs(pl.pos.y-(d.in.y||0))<4&&Math.hypot(pl.pos.x-d.b.x,pl.pos.z-d.b.z)<2.4)return[d,0]}return null};
 addEventListener('keydown',e=>{if(!run||e.repeat||pl.dead||pl.car||e.code!='KeyE')return;const n=near();if(!n)return;const d=n[0],inn=n[1];
  fadeDo(()=>{const t=inn?d.in:d.ex;pl.pos.set(t.x,t.y||0,t.z);pl.vx=pl.vz=0;cy=inn?PI:0;cam.position.set(t.x,(t.y||0)+3,t.z+(inn?5:-5))})});
 const _ui=update;update=function(dt){_ui(dt);if(NX.bcn)NX.bcn.color.setHex(Math.floor(clock*1.2)%2?0xff2222:0x330000);if(!pl.car){const n=near();if(n)$('pr').textContent=n[1]?'E — entrar: '+n[0].label:'E — sair'}};
}


})();