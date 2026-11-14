'use strict';
/* oficina.js — Oficina do Theo no TÉRREO do prédio onde fica o apartamento dele (ponto comercial alugado).
   Carregar DEPOIS do props.js e ANTES do story.js. Precisa do window.THEO_BLD que o game.js cria (ver instruções).
   - Corta o térreo do prédio (ele passa a começar a 4,5 m do chão) e monta uma salinha 11,8 × 8,4 com porta de serviço.
   - Exporta window.THEO_SHOP = {front, L1, L2, L3} (pontos de interação das missões: elevador, bancada, óleo). */
(()=>{
/* Remove decorações antigas (toldos, sacadas, aletas, caixas de telhado) que o props.js "assou" nos prédios e que ficaram soltas
   depois que o prédio foi apagado/alterado. Só mexe nos blocos de decoração (malhas com cor por vértice e mais de 24 vértices). */
window.stripDecor=(x0,x1,z0,z1,ymax)=>{
 for(const m of scene.children){const g=m.isMesh&&m.geometry;if(!g||!g.index||!g.attributes.color||g.attributes.position.count<=24)continue;
  const P=g.attributes.position.array,I=g.index.array,ins=i=>{const x=P[i*3],y=P[i*3+1],z=P[i*3+2];return x>x0&&x<x1&&z>z0&&z<z1&&y<ymax};let ch=0;
  for(let t=0;t<I.length;t+=3)if(ins(I[t])&&ins(I[t+1])&&ins(I[t+2])){I[t+1]=I[t];I[t+2]=I[t];ch=1}
  if(ch)g.index.needsUpdate=true}};
const T0=window.THEO_BLD;if(!T0||!T0.b)return;
const NX=window.NX,SY=window.SY,CX=T0.CX,CZ=T0.CZ,b=T0.b,GH=4.5;

stripDecor(CX-11.8,CX+11.8,CZ-10.5,CZ+11.8,GH+.1);   // toldo/porta/placa aleatórios do térreo do prédio original
/* ---------- 1) corta o térreo: o bloco maciço vira "andares de cima" ---------- */
{const i=BL.indexOf(b);if(i>=0)BL.splice(i,1);
 if(b.m){const H=b.h;b.m.scale.y=(H-GH)/H;b.m.position.y=GH+(H-GH)/2}}

/* ---------- helpers (coordenadas relativas ao centro do prédio: x = direita, z = frente/rua) ---------- */
const FM={},fm=c=>FM[c]||(FM[c]=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.32,roughness:.75})),
 LM=new THREE.MeshBasicMaterial({color:0xfff2cf}),
 GLS=new THREE.MeshStandardMaterial({color:0x8fc4ee,transparent:true,opacity:.22,roughness:.05,metalness:.4,depthWrite:false});
const T=(w,h,d,c,x,y,z,hit)=>{const m=NX.solid(CX+x,CZ+z,w,d,h,fm(c),y,!!hit);m.castShadow=false;return m};
const L=(w,h,d,x,y,z,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||LM);o.position.set(CX+x,y+h/2,CZ+z);scene.add(o);return o};
const cyl=(r,h,c,x,y,z,hit)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,14),fm(c));o.position.set(CX+x,y+h/2,CZ+z);scene.add(o);
 if(hit)BL.push({x0:CX+x-r,x1:CX+x+r,z0:CZ+z-r,z1:CZ+z+r,h:y+h,m:o,k:1});return o};
const sg=(t,c,bg,w,h,pw,ph,x,y,z,ry)=>NX.plane(pw,ph,NX.signM(t,c,bg,w,h),CX+x,y,CZ+z,ry||0);

/* ---------- 2) casca: massas laterais, parede da direita, fachada com serviço, teto ---------- */
const WC=0xb9a98c;
NX.solid(CX-6.1,CZ,9.8,20,GH,fm(WC));                       // massa à esquerda (lado do APTO DO THEO)
NX.solid(CX+4.9,CZ-4.4,12.2,11.2,GH,fm(WC));                // massa atrás da oficina
NX.solid(CX+10.8,CZ+5.6,.4,8.8,GH,fm(WC));                  // parede da direita
NX.solid(CX+2.7,CZ+9.8,7.8,.4,GH-3.4,fm(WC),3.4,false);     // fachada: só a verga acima do portão (a abertura é do portão animado)
NX.solid(CX+7.5,CZ+9.8,1.8,.4,GH-2.4,fm(WC),2.4,false);     // verga sobre a porta (abertura de 1,8 m)
NX.solid(CX+9.7,CZ+9.8,2.6,.4,1,fm(WC),0,true);             // janela: peitoril
{const g=NX.solid(CX+9.7,CZ+9.8,2.6,.2,1.6,GLS,1,true);g.castShadow=false}
NX.solid(CX+9.7,CZ+9.8,2.6,.4,GH-2.6,fm(WC),2.6,false);
NX.solid(CX+4.9,CZ+5.6,12.2,8.8,.3,fm(0xe9e6df),GH-.3,false);   // teto da oficina

/* fachada: portão de enrolar fechado, placa, letreiro de aberto, toldo */
{const sh=tex(128,128,g=>{g.fillStyle='#7d838b';g.fillRect(0,0,128,128);g.fillStyle='#5b6068';for(let y=0;y<128;y+=8)g.fillRect(0,y,128,2);g.fillStyle='#9aa0a8';g.fillRect(0,0,128,3)},1),
 sm=new THREE.MeshStandardMaterial({map:sh,emissive:0x2a2d32,roughness:.6,metalness:.3,side:THREE.DoubleSide});
 window.OFI_GATE=NX.plane(7,3.2,sm,CX+2.3,1.8,CZ+10.03,0)}
NX.solid(CX+6.2,CZ+9.8,.8,.5,GH,fm(0xa9a9a6),0,true);   // pilar de concreto dividindo o portão dos carros da entrada de clientes
sg('OFICINA DO THEO','#ffd23f','#1a1a1a',512,96,6.4,.9,3.2,3.95,10.03);
sg('ABERTO','#7dff8a','#10131a',192,64,.9,.34,7.5,2.65,10.03);
sg('FREIO · MOTOR · ÓLEO','#fff','#1b4f8a',384,64,2.6,.4,9.7,3.3,10.03);
T(2.6,.12,1.6,0xc0392b,7.5,2.75,10.8);
T(.08,2.75,.08,0x777777,6.4,0,11.5);T(.08,2.75,.08,0x777777,8.6,0,11.5);

/* ---------- 3) interior ---------- */
{const fl=tex(128,128,g=>{g.fillStyle='#6a6c70';g.fillRect(0,0,128,128);for(let k=0;k<420;k++){g.fillStyle='rgba(0,0,0,'+rr(.03,.1)+')';g.fillRect(R2()*128,R2()*128,rr(1,4),rr(1,4))}},4);
 NX.ground(11.8,8.4,new THREE.MeshStandardMaterial({map:fl,emissive:0x303030,roughness:.9}),CX+4.7,.06,CZ+5.4)}
for(const[x,z,w,d]of[[3.4,5.6,1.6,1.2],[8.8,3.6,1.1,.9],[1.1,3.4,1.4,1]])NX.ground(w,d,0x202226,CX+x,.07,CZ+z);   // manchas de óleo
for(const[x,z]of[[1.5,2.8],[5,5.5],[8.6,3],[5,8.4],[1,7.6],[9,7.2]])L(2.2,.05,.25,x,GH-.35,z);                    // luminárias

/* bancada de trabalho (fundo, à direita) com gavetas, bancada de madeira e tábua de ferramentas */
T(5.6,.84,.7,0x4a4f57,7,0,1.65,1);T(5.7,.08,.8,0x6b4a2b,7,.84,1.7,0);
for(let i=0;i<5;i++){T(.55,.04,.03,0xcccccc,4.8+i*1.1,.55,2.02);T(.9,.4,.02,0x3a3f46,4.8+i*1.1,.2,2.01)}
T(5.6,1.15,.05,0x3b3f45,7,1.45,1.27);                                                                       // painel perfurado
for(let i=0;i<11;i++)T(.05,.4+(i%3)*.08,.02,[0xbfc5cc,0xc0392b,0xf1c40f,0x2980b9][i%4],4.4+i*.52,1.5+(i%2)*.18,1.3);   // chaves penduradas
T(.7,.3,.35,0xc0392b,5.2,.92,1.75);T(.3,.25,.3,0x2f3a46,9.3,.92,1.7);T(.08,.08,.35,0x777777,9.3,1.1,1.95);       // caixa de ferramentas e morsa
T(.5,.02,.06,0xbfc5cc,6.3,.92,1.9);T(.4,.02,.05,0xbfc5cc,6.5,.92,1.55);T(.35,.04,.04,0x8a5a2b,7.4,.92,1.9);T(.1,.07,.07,0x555a60,7.58,.92,1.9);   // chaves e martelo
T(.12,.2,.12,0xe8c030,8.3,.92,1.6);T(.14,.16,.14,0xd32f2f,8.6,.92,1.85);                                         // latas
T(.5,.3,.3,0x2b2f36,6.9,.92,1.7);                                                                           // lanterna de oficina

/* elevador (L1): duas colunas, viga e sapatas */
T(.3,2.7,.45,0xf1c40f,1.7,0,5.6,1);T(.3,2.7,.45,0xf1c40f,5.1,0,5.6,1);T(3.7,.2,.4,0xf1c40f,3.4,2.7,5.6,0);
T(.55,.12,1.9,0x333840,2.45,.55,5.0,0);T(.55,.12,1.9,0x333840,4.35,.55,5.0,0);T(2.9,.1,.22,0x555a60,3.4,.5,4.5,0);T(2.9,.1,.22,0x555a60,3.4,.5,5.6,0);
T(.12,.08,3.4,0xf1c40f,1.95,0,5.2);T(.12,.08,3.4,0xf1c40f,4.85,0,5.2);                                          // faixas amarelas no chão

/* óleo e lubrificação (L3): tambores, bandeja, funil */
cyl(.32,.9,0x1b4f8a,.2,0,2.3,1);cyl(.32,.9,0xc0392b,.9,0,2.2,1);cyl(.32,.9,0x1b4f8a,.45,0,3.1,1);
cyl(.33,.04,0x222222,.2,.9,2.3);cyl(.15,.12,0x999999,.9,.9,2.2);T(1.2,.12,.8,0x2b2f36,1.4,0,3.5,0);T(.1,.3,.1,0xd32f2f,1.2,.12,3.5);

/* pneus, motor numa cavalete, bateria, estepe */
cyl(.34,.96,0x151515,10.1,0,8.6,1);cyl(.1,.97,0x2b2b2b,10.1,0,8.6);
cyl(.34,.5,0x151515,9.6,0,7.3,1);cyl(.1,.51,0x2b2b2b,9.6,0,7.3);
T(.9,.55,.7,0x6b6f76,9.8,.5,5.6,1);T(.12,.5,.12,0x333333,9.45,0,5.35);T(.12,.5,.12,0x333333,10.15,0,5.35);T(.12,.5,.12,0x333333,9.45,0,5.85);T(.12,.5,.12,0x333333,10.15,0,5.85);
T(.3,.2,.2,0x1b4f8a,9.9,0,4.2,0);T(.06,.06,.06,0xc0392b,9.82,.2,4.2);

/* lado esquerdo: carrinho de ferramentas, prateleira com peças, mesinha do caixa e o aviso do aluguel */
T(.6,1.0,.9,0xc0392b,-.8,0,4.5,1);for(let i=0;i<4;i++)T(.02,.04,.5,0xdddddd,-.49,.2+i*.22,4.5);
T(.35,.05,2.2,0x8a6a3f,-1.02,1.5,6.2);for(let i=0;i<5;i++)T(.2,.22,.2,[0xe8c030,0xd32f2f,0x2980b9,0xe8e4d8,0x27ae60][i],-1.02,1.55,5.3+i*.45);
T(1.6,.8,.7,0x7a5a3a,.3,0,8.7,1);T(.4,.25,.35,0x2c2c2c,.1,.8,8.7);T(.3,.02,.25,0x7dff8a,.1,1.05,8.62);T(.5,.03,.35,0xffffff,.75,.8,8.7);   // balcão, caixa registradora, notas
T(.5,.05,.5,0xd6322b,.5,.45,7.7);T(.5,.5,.05,0xd6322b,.5,.45,7.48);T(.05,.45,.05,0xeeeeee,.3,0,7.5);T(.05,.45,.05,0xeeeeee,.7,0,7.9);   // banquinho
sg('ALUGUEL VENCE SEXTA','#c0392b','#fff3d6',384,128,1.5,.5,-1.17,2.1,8.2,Math.PI/2);
sg('FIADO SÓ AMANHÃ','#1a1a1a','#ffd23f',384,64,1.3,.3,-1.17,1.55,6.6,Math.PI/2);
sg('PRIMAVERA','#fff','#3a5a8a',192,64,.9,.3,5.5,3.6,1.24);                                                // calendário "decorativo"

/* ---------- 3b) tudo que o apartamento tinha no andar de cima (paredes, móveis) deixa de bloquear o térreo ---------- */
for(const e of BL)if(e.k&&e.h>GH+8&&Math.abs((e.x0+e.x1)/2-CX)<11.6&&Math.abs((e.z0+e.z1)/2-CZ)<10.6)e.sky=GH+8;

/* hitB original ignora a altura de onde o objeto começa: as paredes/móveis do apartamento (lá em cima) bloqueavam o térreo.
   Agora quem tem e.sky só colide com quem está acima dessa altura (y indefinido = carro/chão = ignora). */
hitB=function(x,z,r,y){
 for(const b of BL){
  if(y>b.h+.5)continue;
  if(b.sky!=null&&!(y>=b.sky))continue;
  if(x>b.x0-r&&x<b.x1+r&&z>b.z0-r&&z<b.z1+r){
   const dx=x-cl(x,b.x0,b.x1),dz=z-cl(z,b.z0,b.z1),d=Math.hypot(dx,dz);
   if(d<r){
    if(d>1e-4)return[dx/d*(r-d),dz/d*(r-d)];
    const l=x-b.x0,rt=b.x1-x,t=z-b.z0,bt=b.z1-z,m=Math.min(l,rt,t,bt);
    return m==l?[-(l+r),0]:m==rt?[rt+r,0]:m==t?[0,-(t+r)]:[0,bt+r]}}}
 return null};

/* ---------- portão de enrolar animado: sobe quando um carro (ou o jogador) chega perto, desce quando ninguém está por perto ---------- */
{const G=window.OFI_GATE,gb={x0:CX-1.2,x1:CX+5.8,z0:CZ+9.6,z1:CZ+10.2,h:GH,m:G,k:1};BL.push(gb);
 let op=0,inBL=true;
 const _ug=update;
 update=function(dt){
  let want=0;
  const near=(x,z)=>x>CX-4&&x<CX+9&&z>CZ+4&&z<CZ+19;
  for(const c of cars){if(!c.del&&near(c.pos.x,c.pos.z)){want=1;break}}
  if(!want&&pl.car&&near(pl.car.pos.x,pl.car.pos.z))want=1;
  op+=(want?1:-1)*dt*.7;op=Math.max(0,Math.min(1,op));
  if(G){const sy=Math.max(.06,1-op*.94);G.scale.y=sy;G.position.y=3.4-1.6*sy;G.visible=sy>.07}
  const solid=op<.75;
  if(solid&&!inBL){BL.push(gb);inBL=true}else if(!solid&&inBL){const i=BL.indexOf(gb);if(i>=0)BL.splice(i,1);inBL=false}
  _ug(dt)}}

/* detalhes extras da oficina: relógio, extintor, ventilador, lixeira, rádio, cavalete de macaco, mangueira de ar, tapete, manchas e cones */
sg('FIAT LUX 24H','#ffd23f','#1a1a1a',192,64,.9,.3,3.4,3.55,1.24);
T(.5,.5,.06,0xf2f2f2,9.6,2.7,1.26);T(.04,.2,.02,0x222222,9.6,2.78,1.3);T(.14,.02,.02,0x222222,9.65,2.72,1.3);                       // relógio de parede
cyl(.1,.5,0xd32f2f,10.5,0,2.2,0);T(.08,.12,.08,0x222222,10.5,.5,2.2);                                                           // extintor
cyl(.04,1.1,0x555a60,.5,0,6.6,0);cyl(.28,.05,0x777c82,.5,1.1,6.6,0);cyl(.28,.02,0x9aa0a6,.5,1.15,6.6,0);                          // ventilador de coluna
cyl(.2,.45,0x2b2f36,10.3,0,9.2,1);T(.34,.04,.34,0x1a1c20,10.3,.45,9.2,0);                                                       // lixeira
T(.45,.25,.2,0x3a3f46,9.5,.92,1.55);T(.04,.3,.02,0x999999,9.7,1.17,1.55);T(.28,.2,.02,0x7dff8a,9.45,.98,1.66);                      // rádio da bancada
T(.12,.5,.12,0x444444,3.9,0,7.6,1);T(.12,.5,.12,0x444444,4.4,0,7.6,1);T(.6,.06,.2,0xc0392b,4.15,.5,7.6,0);                            // cavalete de macaco
cyl(.12,.05,0x1a1a1a,6.9,0,7.5,0);cyl(.09,.05,0x1a1a1a,6.9,.05,7.5,0);T(.04,.04,2.4,0x2c6fbb,6.9,.03,6.2,0);                         // mangueira de ar
T(1.4,.02,.9,0x2b2f36,8.2,.07,8.6,0);T(1.2,.02,.7,0x8a1c1c,8.2,.08,8.6,0);                                                      // tapete
cyl(.12,.5,0xff7a00,9.9,0,2.6,0);cyl(.07,.04,0xffffff,9.9,.35,2.6,0);cyl(.12,.5,0xff7a00,10.3,0,2.9,0);                           // cones
for(const[x,z]of[[5.6,7.4],[7.2,6.1],[3.6,8.6]])NX.ground(.6,.4,0x1a1b1e,CX+x,.075,CZ+z);                                       // mais manchas de óleo
T(1.3,.9,.04,0xf2e9d0,3.1,1.5,1.26);T(1.1,.7,.02,0x3a5a8a,3.1,1.6,1.3);                                                          // quadro de avisos
T(.6,.02,.04,0xf1c40f,3.1,1.85,1.32);T(.4,.02,.04,0xffffff,3.1,1.65,1.32);

/* ---------- 4) exporta pontos de interação (missões) ---------- */
window.THEO_SHOP={front:{x:CX+7.5,z:CZ+14},L1:{x:CX+3.4,z:CZ+5.2},L2:{x:CX+7,z:CZ+3},L3:{x:CX+.7,z:CZ+3.4}};
if(SY&&SY.markers)SY.markers.push({x:CX+7.5,z:CZ+14,l:'T',c:'#ffd23f'});
})();