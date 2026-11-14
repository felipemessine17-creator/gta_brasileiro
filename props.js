'use strict';
/* props.js — carregado depois de game.js. Detalhes feitos de muitas formas pequenas combinadas.
   Tudo é mesclado em poucas malhas (vertexColors) para manter o desempenho. */
(()=>{
const NX=window.NX,SY=window.SY;
/* ---------- mesclador de formas ---------- */
function Batch(){const P=[],N=[],U=[],C=[],I=[];let vc=0,ox=0,oz=0,ry=0;const col=new THREE.Color();
 const push=(g,c)=>{if(ry)g.rotateY(ry);if(ox||oz)g.translate(ox,0,oz);const p=g.attributes.position.array,n=g.attributes.normal.array,u=g.attributes.uv?g.attributes.uv.array:null,cn=p.length/3;col.set(c);
  for(let i=0;i<p.length;i++){P.push(p[i]);N.push(n[i])}
  for(let i=0;i<cn;i++){C.push(col.r,col.g,col.b);U.push(u?u[i*2]:0,u?u[i*2+1]:0)}
  if(g.index){const ix=g.index.array;for(let i=0;i<ix.length;i++)I.push(ix[i]+vc)}else for(let i=0;i<cn;i++)I.push(vc+i);
  vc+=cn;g.dispose()};
 const B={at(x,z,r){ox=x;oz=z;ry=r||0;return B},
  box(w,h,d,x,y,z,c,rx,rz){const g=new THREE.BoxGeometry(w,h,d);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);g.translate(x,y,z);push(g,c)},
  cyl(rt,rb,h,x,y,z,c,seg,rx,rz){const g=new THREE.CylinderGeometry(rt,rb,h,seg||8);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);g.translate(x,y,z);push(g,c)},
  sph(r,x,y,z,c,sx,sy,sz,det){const g=new THREE.IcosahedronGeometry(r,det||0);if(sx||sy||sz)g.scale(sx||1,sy||1,sz||1);g.translate(x,y,z);push(g,c)},
  link(x1,y1,z1,x2,y2,z2,t,c){const dx=x2-x1,dy=y2-y1,dz=z2-z1,L=Math.hypot(dx,dy,dz)||.01,g=new THREE.BoxGeometry(t,t,L);g.rotateX(-Math.asin(dy/L));g.rotateY(Math.atan2(dx,dz));g.translate((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);push(g,c)},
  count:()=>vc,
  geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
   g.setIndex(new THREE.BufferAttribute(new(vc>65535?Uint32Array:Uint16Array)(I),1));return g}};return B}
/* FIM-BATCH */
const mV=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:.05}),wV=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:.1}),
 glT=new THREE.MeshStandardMaterial({color:0x1b2a38,transparent:true,opacity:.4,roughness:.05,metalness:.6,envMap:gl.envMap,envMapIntensity:1});

/* ---------- veículos: para-choques, grade, retrovisores, portas, rodas com aro, interior e motorista ---------- */
const CG={};
function carGeo(t){if(CG[t])return CG[t];const T=CT[t];if(!T)return null;const wr=T.H>1.6?.55:.38,W=T.W,L=T.L,hx=W/2,y1=wr+T.H,ly=T.H>1.6?wr+.55:wr+T.H*.55,k=Batch(),it=Batch(),dr=Batch(),wb=Batch(),dk=0x1c1c1f,ch=0xc8ccd2,pw=0xeeeeee;
 // roda: pneu + aro + cubo + 5 raios
 const ww=T.two?.2:.3;wb.cyl(wr,wr,ww,0,0,0,0x141414,16,0,PI/2);wb.cyl(wr*.62,wr*.62,ww+.03,0,0,0,0xcfd3d8,12,0,PI/2);wb.cyl(wr*.2,wr*.2,ww+.06,0,0,0,0x333336,8,0,PI/2);
 for(let i=0;i<5;i++)wb.box(ww+.04,.05,wr*1.15,0,0,0,0x9da2a8,i*PI*2/5);
 if(!T.two){
  const big=T.H>1.6,S=T.C?cabSpec(T,t):null,zF=S?S.cz+S.cL/2:L/2-.7;
  // para-choques, grade e placas (a placa fica NA frente do para-choque, não flutuando)
  k.box(W+.06,.2,.16,0,wr+.13,L/2+.04,dk);k.box(W+.06,.2,.16,0,wr+.13,-L/2-.04,dk);
  k.box(W*.42,.14,.05,0,ly,L/2+.02,0x0d0d0f);k.box(W*.42,.03,.06,0,ly+.09,L/2+.03,ch);
  k.box(.5,.13,.02,0,wr+.13,L/2+.125,pw);k.box(.5,.13,.02,0,wr+.13,-L/2-.125,pw);
  // detalhes extras: escapamento, saias laterais, tampa do tanque, antena, faróis de milha, lanternas traseiras
  if(!big&&t!='bus'){k.cyl(.045,.05,.3,hx*.6,wr*.55,-L/2-.08,0x8d9298,8,PI/2);for(const s of[-1,1])k.box(.06,.1,L*.42,s*(hx+.01),wr*.7,0,0x101012);
   k.cyl(.07,.07,.03,hx+.01,wr+T.H*.55,-L*.3,0x2a2a2e,10,0,PI/2);for(const s of[-1,1]){k.box(.22,.1,.03,s*W*.36,wr+.4,-L/2-.015,0xb3141c);k.box(.14,.08,.03,s*W*.38,wr+.17,L/2+.015,0xffe9a8)}
   if(T.C)k.cyl(.012,.012,.55,-hx*.75,y1+T.C+.27,-L*.2,0x111111,5)}
  // retrovisores + frisos de porta + maçanetas + caixas de roda (decalque escuro fino, a roda aparece por cima)
  const tall=big||T.H>1.2,my=T.cab?wr+1.3:tall?wr+T.H*.7:y1+.12,mz=T.cab?L/2-1.1:big?L/2-.5:zF-.3,mx=T.cab?W*.95/2:hx;
  for(const s of[-1,1]){
   k.box(.08,.1,.16,s*(mx+.08),my,mz,dk);k.box(.12,.04,.04,s*(mx+.02),my,mz,dk);
   if(!big){k.box(.02,T.H*.78,.02,s*(hx+.01),wr+T.H*.5,L*.12,0x14141a);k.box(.02,T.H*.78,.02,s*(hx+.01),wr+T.H*.5,-L*.16,0x14141a);k.box(.03,.04,.16,s*(hx+.02),wr+T.H*.68,L*.02,ch)}
   for(const z of[L*.32,-L*.32])k.box(.012,wr*1.1,wr*2.4,s*(hx+.008),wr*1.55,z,0x0c0c0e)}
  if(t=='sport'||t=='porsche'){k.box(W*.85,.05,.35,0,y1+.14,-L/2+.25,dk);for(const s of[-1,1])k.box(.05,.22,.3,s*W*.38,y1+.03,-L/2+.25,dk);for(const s of[-1,1])k.cyl(.07,.07,.3,s*.35,wr+.1,-L/2-.12,ch,8,PI/2)}
  if(t=='pickup'||t=='saveiro'){   // caçamba: grades laterais, painel atrás da cabine e tampa traseira (nada entra na cabine)
   const z0=S.cz-S.cL/2-.03;
   for(const s of[-1,1])k.box(.05,.32,z0+L/2,s*(hx-.03),y1+.16,(z0-L/2)/2,0x55585d);
   k.box(W*.94,.38,.05,0,y1+.19,z0,0x55585d);k.box(W*.94,.32,.05,0,y1+.16,-L/2+.03,0x55585d);k.box(.3,.04,.04,0,y1+.3,-L/2-.01,ch)}
  if(t=='bus'){k.box(.05,T.H*.7,1.15,-(hx+.02),wr+T.H*.45,L*.3,0x2a3b4a);k.box(.05,T.H*.7,1.15,-(hx+.02),wr+T.H*.45,L*.15,0x2a3b4a);k.box(1.8,.3,.05,0,y1-.4,L/2+.02,0xffa000);for(const z of[-.25,.25])k.box(1.6,.35,1.2,0,y1+.18,z*L,0xd8d8d8);k.box(W+.02,.16,L*.96,0,wr+.3,0,0xffd23f)}
  if(t=='truck'){k.box(W*.8,.7,.04,0,wr+1.35,L/2+.012,0x1a2a3a);k.box(W*.5,.5,.02,0,wr+1.35,L/2-.25,0x15202c);k.cyl(.1,.1,3,hx-.3,wr+1.6,L/2-2.3,ch,8)}
  if(t=='van'||t=='ambulance'){k.box(W*.7,.05,L*.4,0,y1+C_(T)+.04,-L*.1,dk);k.box(.03,T.H*.8,.03,-(hx+.02),wr+T.H*.5,-L*.1,0x222)}
  if(t=='police')for(const s of[-1,1])k.box(.03,T.H*.7,L*.25,s*(hx+.02),wr+T.H*.5,L*.04,0xf2f2f2);
  if(t=='taxi')for(let i=0;i<10;i++)for(const s of[-1,1])k.box(.03,.1,.2,s*(hx+.02),wr+T.H*.55,-.9+i*.2,i%2?0x111111:0xf6d800);
  if(t=='ambulance')for(const s of[-1,1]){k.box(.03,.5,.14,s*(hx+.02),wr+T.H*.55,-L*.2,0xd32f2f);k.box(.03,.14,.5,s*(hx+.02),wr+T.H*.55,-L*.2,0xd32f2f)}
  if(t=='fusca')for(const s of[-1,1])k.sph(.17,s*hx*.62,ly,L/2+.02,0xfff6c8,1,1,.6,1);
  if(T.C){
   // interior encaixado na cabine: tudo abaixo do teto (antes a cabeça e o encosto furavam o teto)
   const C=T.C,dx=W*.22,zs=zF-1.25,dash=Math.min(zs+.8,zF-.3-S.sf*S.cL*.55),hb=Math.min(.5,C*.6),tH=Math.max(.12,C*.95-.28),rear=C>=.55&&zs-.75>=S.cz-S.cL/2+.25,zr=zs-.75;
   for(const s of[-1,1]){it.box(.42,.1,.45,s*dx,y1+.05,zs,0x2a2d33);it.box(.42,hb,.1,s*dx,y1+.1+hb/2,zs-.22,0x2a2d33);if(C>=.5)it.box(.2,.12,.08,s*dx,y1+.1+hb+.04,zs-.22,0x2a2d33)}
   if(rear){it.box(W*.7,.1,.45,0,y1+.05,zr,0x2a2d33);it.box(W*.7,hb,.1,0,y1+.1+hb/2,zr-.22,0x2a2d33)}
   it.box(W*.74,.22,.3,0,y1+.15,dash,0x1a1b1e);it.cyl(.17,.17,.03,dx,y1+.28,dash-.3,0x111111,10,1.1);it.box(.18,.18,.4,0,y1+.1,zs+.3,0x222226);it.box(W*.78,.02,S.cL*.8,0,y1+.01,S.cz,0x15161a);
   dr.sph(.1,dx,y1+.08+tH+.1,zs-.02,0xc9936a,1,1,1,1);dr.box(.32,tH,.2,dx,y1+.08+tH/2,zs-.04,0x445566);dr.box(.08,.08,.35,dx-.14,y1+.08+tH*.8,zs+.15,0x445566);dr.box(.08,.08,.35,dx+.14,y1+.08+tH*.8,zs+.15,0x445566)}
 }else{
  k.box(.9,.05,.05,0,1.25,L*.28,dk);for(const s of[-1,1])k.box(.1,.05,.05,s*.5,1.25,L*.28,0x111111);k.cyl(.04,.04,.9,0,.85,L*.4,ch,6,.35);k.sph(.12,0,1.1,L*.46,0xfff6c8,1,1,1,1);
  k.box(.36,.12,.75,0,wr+T.H+.08,-L*.1,0x151515);k.box(.38,.22,.5,0,wr+T.H+.12,L*.12,0x777b80);k.cyl(.05,.07,.8,.28,.45,-L*.35,ch,8,PI/2);k.box(.28,.05,.5,0,.85,-L*.42,dk);
  dr.sph(.16,0,wr+T.H+.9,-L*.05,0xaa2222,1,1,1,1);dr.box(.34,.5,.25,0,wr+T.H+.5,-L*.05,0x334455)}
 return CG[t]={k:k.count()?k.geo():null,i:it.count()?it.geo():null,d:dr.count()?dr.geo():null,w:wb.geo()}}
const C_=T=>T.C||0;
function dress(c){if(c.pdet||!c.T)return;c.pdet=1;const g=carGeo(c.t);if(!g)return;
 if(g.k)c.bd.add(new THREE.Mesh(g.k,mV));if(g.i)c.bd.add(new THREE.Mesh(g.i,mV));if(g.d){c.dm=new THREE.Mesh(g.d,mV);c.bd.add(c.dm)}
 if(c.T.C&&!c.T.two&&c.bd.children[1])c.bd.children[1].material=glT;
 c.ws.forEach(w=>{w.geometry=g.w;w.material=wV})}
for(const c of cars)dress(c);
const _mk=mkCar;mkCar=function(t,x,z,yaw,o){const c=_mk(t,x,z,yaw,o);dress(c);return c};

/* ---------- cenário: fachadas, telhados, favela, mobiliário, postes e árvores ---------- */
const chunks={},CS=160,mkChunk=(kind,x,z)=>{const gx=Math.floor((x+420)/CS),gz=Math.floor((z+420)/CS),key=kind+gx+'_'+gz;return chunks[key]||(chunks[key]={b:Batch(),cx:gx*CS-420+CS/2,cz:gz*CS-420+CS/2,kind})};
const AWN=[0xc0392b,0x2980b9,0xf39c12,0x27ae60,0x8e44ad,0xe67e22],SGN=[0xf1c40f,0xe74c3c,0x3498db,0x2ecc71,0xecf0f1,0xff7a1a],TRIM=[0xcfc9bd,0xbab4a8,0xd8d3c8],DOOR=[0x2e5a88,0x7a2f2f,0x2f6b34,0x6a6a6a,0xd9b35a];
const ROT=[0,PI,PI/2,-PI/2];
function front(C,b,fi){const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,half=(fi<2?b.d:b.w)/2,len=fi<2?b.w:b.d;if(len<8)return;C.at(cx,cz,ROT[fi]);const dx=rr(-len*.15,len*.15),ac=pk(AWN);
 C.box(1.5,2.5,.12,dx,1.25,half+.05,0x3a2d22);C.box(1.1,1.7,.05,dx,1.4,half+.12,0x7fb7d6);C.box(.08,.4,.08,dx+.45,1.2,half+.16,0xd4af37);
}
function balc(C,b,fi){const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,half=(fi<2?b.d:b.w)/2,len=fi<2?b.w:b.d;C.at(cx,cz,ROT[fi]);
 for(let y=5;y<Math.min(b.h-3,32);y+=3.6){C.box(len*.62,.2,1.2,0,y,half+.6,0xcfcac0);C.box(len*.62,.85,.06,0,y+.5,half+1.18,0x4d5258);C.box(.06,.85,1.2,-len*.31,y+.5,half+.6,0x4d5258);C.box(.06,.85,1.2,len*.31,y+.5,half+.6,0x4d5258)}}
function fins(C,b,fi){const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,half=(fi<2?b.d:b.w)/2,len=fi<2?b.w:b.d,n=Math.min(9,Math.floor(len/2.6));C.at(cx,cz,ROT[fi]);for(let i=0;i<n;i++)C.box(.22,b.h,.5,-len/2+(i+.5)*len/n,b.h/2,half+.25,0xaebbc7)}
function favDet(C,b){const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,w=b.w,d=b.d,h=b.h,rust=0x8a4b2d;C.at(cx,cz,0);
 C.box(w+.9,.25,d+.9,0,h+.12,0,0xb0aaa0);for(const sx of[-1,1])for(const sz of[-1,1])C.cyl(.06,.06,1.7,sx*(w/2-.1),h+1.1,sz*(d/2-.1),rust,5);
 if(R2()<.7){C.cyl(.8,.8,1.2,rr(-w/4,w/4),h+.85,rr(-d/4,d/4),0x2a7fd4,10)}
 if(R2()<.5){const x=rr(-w/4,w/4),z=rr(-d/4,d/4);C.sph(.45,x,h+1.3,z,0xdddddd,1,.35,1,1);C.box(.05,.6,.05,x,h+.9,z,0x777777)}
 if(R2()<.5){C.cyl(.03,.03,2,-w/2,h+1,d/2-.2,0x666666,5);C.cyl(.03,.03,2,w/2,h+1,d/2-.2,0x666666,5);C.box(w,.02,.02,0,h+1.9,d/2-.2,0x999999);for(let i=0;i<4;i++)C.box(.45,.55,.03,-w/2+(i+.8)*w/5,h+1.55,d/2-.2,pk([0xe74c3c,0xf1c40f,0x3498db,0xecf0f1,0x2ecc71]))}
 for(const fi of[0,2]){const half=(fi<2?d:w)/2,len=fi<2?w:d;C.at(cx,cz,ROT[fi]);C.box(1.1,2.2,.1,rr(-len*.2,len*.2),1.1,half+.04,pk(DOOR));for(const s of[-1,1])if(h>3.2){C.box(.9,.8,.06,s*len*.28,2.1,half+.04,0x1b1b1b);C.box(.8,.7,.04,s*len*.28,2.1,half+.08,0x86bfe0);for(let g=-1;g<=1;g++)C.box(.03,.7,.03,s*len*.28+g*.25,2.1,half+.11,0x222222)}}
 C.at(cx,cz,0);for(let i=0;i<2;i++)if(R2()<.55)C.box(rr(1,2.2),rr(.6,1.4),.05,rr(-w/3,w/3),rr(1,Math.max(1.2,h-.5)),d/2+.03,0x9c3d2a);

 // reboco incompleto: tijolo aparente, vergalhões no laje, caixa de luz, ar-condicionado, parabólica, soleiras e degrau
 C.at(cx,cz,0);if(R2()<.7){const bx=rr(-w/4,w/4);C.box(rr(1.2,2.4),rr(.8,1.6),.04,bx,rr(.9,Math.max(1,h-1)),d/2+.045,0xa2452c);for(let r=0;r<3;r++)C.box(.9,.02,.045,bx,.5+r*.3,d/2+.07,0x7a3322)}
 for(let i=0;i<5;i++)C.cyl(.012,.012,rr(.5,1),-w/2+.3+i*(w-.6)/4,h+.25+.45,-d/2+.3,0x6a4a3a,4);
 for(const fi of[0,2]){const half=(fi<2?d:w)/2,len=fi<2?w:d;C.at(cx,cz,ROT[fi]);C.box(.5,.7,.2,rr(-len*.2,len*.2)+.9,1.4,half+.1,0x888e94);C.box(1.3,.12,.5,-.2,.06,half+.25,0x9a9a9a);
  if(h>3.2)for(const s of[-1,1])C.box(1.05,.07,.18,s*len*.28,1.7,half+.12,0xd8d2c4);if(R2()<.5){C.box(.3,.4,.12,rr(-len*.3,len*.3),1.5,half+.08,0xe9e9e9);C.cyl(.2,.2,.04,rr(-len*.3,len*.3),h-.6,half+.1,0xd7d7d7,10,PI/2)}}
 C.at(cx,cz,0);if(R2()<.4){C.cyl(.35,.35,.05,w/2-.9,h+2.2,-d/2+.9,0xdedede,10,.9);C.cyl(.02,.02,.8,w/2-.9,h+1.8,-d/2+.9,0x666666,4)}
 if(R2()<.3)for(let s=0;s<6;s++)C.box(1,.18,.5,w/2+.5,.3+s*.4,-d/2+.5+s*.5,0x9a9a9a)}
function buildings(){let n=0;for(const b of BL){if(b.k||!b.m||!b.w)continue;const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,w=b.w,d=b.d,h=b.h,fav=cx<-190&&cz<-190;if(w<5||d<5)continue;
 const C=mkChunk('b',cx,cz).b,tr=pk(TRIM);C.at(cx,cz,0);
 C.box(w+.3,.7,.35,0,h+.35,d/2+.05,tr);C.box(w+.3,.7,.35,0,h+.35,-d/2-.05,tr);C.box(.35,.7,d+.3,w/2+.05,h+.35,0,tr);C.box(.35,.7,d+.3,-w/2-.05,h+.35,0,tr);
 if(fav){favDet(C,b);continue}
 C.at(cx,cz,0);
 if(h>10&&R2()<.8){const sw=Math.min(4,w*.35),sd=Math.min(4,d*.35),x=rr(-w/4,w/4),z=rr(-d/4,d/4);C.box(sw,2.6,sd,x,h+1.3,z,0xb8b4aa);C.box(sw+.3,.2,sd+.3,x,h+2.7,z,0x777777);C.box(.9,1.8,.05,x,h+.9,z+sd/2+.03,0x3a3a3a)}
 if(h>20&&R2()<.5){const x=rr(-w/4,w/4),z=rr(-d/4,d/4);C.cyl(.06,.08,6,x,h+3,z,0x888888,6);C.box(1.6,.06,.06,x,h+5,z,0x888888)}
 if(h>8&&h<30&&R2()<.4)for(let i=0;i<3;i++)C.box(2.2,.06,1.2,-w/4+i*w/4,h+.7,rr(-d/4,d/4),0x1f3a6b,-.5);
 if(h>12)for(const sx of[-1,1])for(const sz of[-1,1])C.box(.55,h,.55,sx*(w/2+.03),h/2,sz*(d/2+.03),tr);
 if(h>120&&R2()<.4){C.cyl(5,5,.3,0,h+.15,0,0x4a4d52,16);C.box(.5,.05,3,-1.2,h+.33,0,0xffffff);C.box(.5,.05,3,1.2,h+.33,0,0xffffff);C.box(2.4,.05,.5,0,h+.33,0,0xffffff)}
 const f1=Math.floor(R2()*4);front(C,b,f1);if(R2()<.7)front(C,b,(f1+1+Math.floor(R2()*3))%4);
 if(h>14&&h<75&&R2()<.65)balc(C,b,Math.floor(R2()*4));
 if(h>60)fins(C,b,Math.floor(R2()*4));n++}}
buildings();
const PR_={
 bench:S=>{S.box(1.7,.08,.5,0,.5,0,0x8a6a3f);S.box(1.7,.5,.07,0,.85,-.22,0x8a6a3f,-.1);for(const x of[-.7,.7])S.box(.08,.5,.45,x,.25,0,0x333333)},
 bin:S=>{S.cyl(.3,.26,.9,0,.45,0,0x3d5a45,8);S.cyl(.32,.32,.07,0,.93,0,0x2b3f33,8);S.box(.2,.05,.05,0,.97,0,0x222222)},
 hydrant:S=>{S.cyl(.16,.2,.7,0,.35,0,0xc0392b,8);S.sph(.18,0,.78,0,0xc0392b,1,.8,1);S.box(.5,.1,.1,0,.5,0,0xa5281b)},
 mailbox:S=>{S.box(.45,.9,.4,0,.9,0,0xf1c40f);S.box(.6,.12,.5,0,1.4,0,0xe0b000);for(const x of[-.15,.15])S.box(.06,.45,.06,x,.22,0,0x555555)},
 orelhao:S=>{S.cyl(.06,.06,1.6,0,.8,0,0x555555,6);S.sph(.55,0,1.8,0,0xe8581c,1,.75,.8,1);S.box(.5,.3,.05,0,1.8,.4,0x222222);S.box(.4,.15,.1,0,1.45,.35,0xb0b4b8)},
 banca:S=>{S.box(2.4,2.2,1.8,0,1.1,0,0x2e7d6a);S.box(2.7,.12,2.1,0,2.26,0,0xc0392b);S.box(2.0,.8,.05,0,1.5,.93,0xf1d36b);for(let i=0;i<6;i++)S.box(.25,.35,.03,-.9+i*.36,1.5,.97,pk([0xe74c3c,0x3498db,0x2ecc71,0xf39c12]));S.box(2.4,.08,.6,0,1.0,1.15,0x555555)},
 pipoca:S=>{S.box(1.1,.8,.7,0,.9,0,0xf4f1e8);S.box(1.0,.7,.6,0,1.65,0,0xd6322b);for(const x of[-.5,.5])S.cyl(.22,.22,.08,x,.3,.4,0x222222,10,0,PI/2);S.cyl(.04,.04,1.7,.4,2.4,0,0x888888,6);S.cyl(.05,1.2,.45,.4,3.2,0,0xd6322b,10);S.sph(.3,0,2.15,0,0xfff0b0,1,.7,1,1)},
 feira:S=>{for(const x of[-1.3,1.3])for(const z of[-.8,.8])S.cyl(.05,.05,2.2,x,1.1,z,0x777777,6);for(let i=0;i<6;i++)S.box(.45,.06,1.9,-1.1+i*.45,2.3,0,i%2?0xffffff:0xd6322b,.1);S.box(2.4,.8,1.0,0,.4,0,0x8a6a3f);for(let i=0;i<7;i++)S.box(.3,.25,.3,-1+i*.33,.93,rr(-.2,.2),pk([0xe74c3c,0xf1c40f,0x2ecc71,0xe67e22]))},
 boteco:S=>{S.cyl(.5,.5,.05,0,.75,0,0xdddddd,12);S.cyl(.05,.05,.75,0,.37,0,0x888888,6);for(const[x,z]of[[1,0],[-1,0],[0,1],[0,-1]]){S.box(.4,.05,.4,x*.85,.45,z*.85,0xd6322b);S.box(.4,.4,.05,x*.85+(x?x*.2:0),.7,z*.85+(z?z*.2:0),0xd6322b);for(const a of[-1,1])S.box(.04,.45,.04,x*.85+a*.15,.22,z*.85+a*.15,0xeeeeee)}S.cyl(.04,.04,2.3,0,1.15,0,0x888888,6);S.cyl(.05,1.5,.5,0,2.45,0,0xe30613,10)},
 pare:S=>{S.cyl(.05,.05,2.4,0,1.2,0,0x777777,6);S.cyl(.4,.4,.05,0,2.5,.03,0xc0392b,8,PI/2);S.cyl(.34,.34,.03,0,2.5,.06,0xffffff,8,PI/2)},
 bollard:S=>{S.cyl(.12,.12,.8,0,.4,0,0xf1c40f,8);S.cyl(.125,.125,.1,0,.65,0,0x222222,8)}};
const KEYS=Object.keys(PR_);
function street(){for(let i=0;i<N;i++)for(let j=0;j<N;j++){const cx=(i-N/2+.5)*B,cz=(j-N/2+.5)*B,fav=i<3&&j<3,n=fav?1:2+Math.floor(R2()*3);
 for(let k=0;k<n;k++){const e=Math.floor(R2()*4),a=rr(-15,15),x=e<2?cx+a:cx+(e==2?22.4:-22.4),z=e<2?cz+(e==0?22.4:-22.4):cz+a,r=e==0?0:e==1?PI:e==2?PI/2:-PI/2;if(NX.fav&&NX.fav(x,z))continue;PR_[pk(KEYS)](mkChunk('s',x,z).b.at(x,z,r))}}}
street();
function utility(){const T=0x6b4f33,A=0x5b4228;
 for(let k=-5;k<=5;k++)for(const ax of[0,1]){const line=k*B,side=(k%2?1:-1)*9.7;let prev=null;
  for(let a=-370;a<=370;a+=32){const m=((a%B)+B)%B;if(m<11||m>B-11)continue;if(NX.fav&&NX.fav(ax?line+side:a,ax?a:line+side)){prev=null;continue}const x=ax?line+side:a,z=ax?a:line+side,S=mkChunk('u',x,z).b.at(x,z,ax?0:PI/2);
   S.cyl(.12,.17,8.5,0,4.25,0,T,6);S.box(2.2,.12,.12,0,7.9,0,A);for(const o of[-.9,0,.9])S.cyl(.05,.05,.2,o,8.05,0,0xdddddd,5);S.box(1.4,.1,.1,0,6.9,0,A);
   if(R2()<.25){S.cyl(.4,.4,.9,.3,7.0,.45,0x777b80,8);S.box(.2,.2,.2,.3,7.6,.45,0x333333)}
   const cur=[0,1,2].map(i=>{const o=(i-1)*.9;return ax?[x+o,8.05,z]:[x,8.05,z+o]});
   if(prev){const L=mkChunk('u',x,z).b.at(0,0,0);for(let i=0;i<3;i++){const mx=(prev[i][0]+cur[i][0])/2,mz=(prev[i][2]+cur[i][2])/2;L.link(prev[i][0],prev[i][1],prev[i][2],mx,7.6,mz,.04,0x1a1a1a);L.link(mx,7.6,mz,cur[i][0],cur[i][1],cur[i][2],.04,0x1a1a1a)}}prev=cur}}
}
utility();
function lights(){const S=mkChunk('s',0,0).b.at(0,0,0);
 for(const p of poles){const c=mkChunk('s',p[0],p[2]).b.at(p[0],p[2],0);c.box(1.4,.1,.1,-.6,7.0,0,0x44474c);c.box(.9,.18,.35,-1.3,7.15,0,0xdddddd);c.box(.35,.3,.35,0,.15,0,0x44474c)}
 for(const arr of[sX,sZ])for(const p of arr){const c=mkChunk('s',p[0],p[2]).b.at(p[0],p[2],0);c.box(.5,1.5,.45,0,p[1]-.4,0,0x1e1e1e);c.box(.62,.12,.6,0,p[1]+.45,.05,0x1e1e1e)}}
lights();
function trees(){const gr=[0x2f6b34,0x3b8240,0x2a5d2e,0x4a9a4d];for(const t of tTr){const x=t[0],z=t[2];if(x<-430||Math.abs(z)>470)continue;const S=mkChunk('t',x,z).b.at(x,z,0);for(let k=0;k<3;k++)S.sph(rr(1.2,1.8),rr(-.8,.8),5+rr(-.3,1.2),rr(-.8,.8),pk(gr));S.box(.1,1.4,.1,.4,3.2,0,0x5b3a22,0,.6)}}
trees();
// grafites nas paredes da favela
{const gt=tex(256,128,g=>{g.fillStyle='#e8e2d4';g.fillRect(0,0,256,128);const c=['#e74c3c','#f1c40f','#3498db','#2ecc71','#9b59b6'];for(let i=0;i<14;i++){g.fillStyle=pk(c);g.beginPath();g.arc(R2()*256,R2()*128,rr(10,38),0,6.3);g.fill()}g.fillStyle='#111';g.font='bold 40px system-ui';g.textAlign='center';g.fillText('QUEBRADA',128,76)}),gm=new THREE.MeshBasicMaterial({map:gt});let n=0;
 for(const b of BL){if(b.k||!b.m||!b.w||n>=10)continue;const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;if(cx<-190&&cz<-190&&b.h>3&&R2()<.2){const p=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(5,b.d-.5),2.4),gm);p.position.set(b.x1+.07,2,cz);p.rotation.y=PI/2;scene.add(p);n++}}}
/* ---------- montagem das malhas e LOD por distância e qualidade ---------- */
const meshes=[];for(const k in chunks){const c=chunks[k];if(!c.b.count())continue;const m=new THREE.Mesh(c.b.geo(),mV);m.receiveShadow=false;m.castShadow=false;scene.add(m);c.m=m;meshes.push(c)}
let lt=0;const R_=[0,260,340,420,520];
const _u=update;update=function(dt){_u(dt);lt-=dt;if(lt<=0){lt=.5;const r=R_[S.q]||0;for(const c of meshes){const d=Math.hypot(c.cx-pl.pos.x,c.cz-pl.pos.z);c.m.visible=r>0&&d<r+CS*.7}
  for(const c of cars)if(c.dm)c.dm.visible=!!c.ai}};
})();