'use strict';
/* favela.js — favela orgânica: morro suave, ruas curvas, vielas, casas com laje, postes e gambiarra.
   ORDEM: carregar DEPOIS de extras/systems/game.js e ANTES de props.js (ver index.html).
   Por que antes do props.js: o props.js "assa" nas malhas fachadas, postes e árvores; se rodasse
   antes, ficariam portas/caixas d'água/postes flutuando ou enterrados no morro.

   O que este arquivo faz:
   - limpa da área tudo que a grade antiga deixou (casas, lajes, postes, árvores, pisos de quarteirão)
   - morro baixo e largo, só do lado de dentro; as bordas voltadas p/ a cidade chegam em nível 0
   - cada casa tem um terraço plano (malha de 1 m, o chão nunca atravessa as paredes) e um alicerce
   - casas feitas aqui mesmo (caixas mescladas): janelas, porta, laje, caixa d'água, ferros de espera
   - transição: calçada de concreto na borda da cidade → terra batida; grama na borda de fora;
     ruas principais se alargam ao encontrar as ruas da cidade; casas baixas e claras na borda */
(()=>{
const NX=window.NX;
const X0=-390,X1=-200,SZ=X1-X0,CX=(X0+X1)/2;            // X1=-200 é o meio-fio da cidade (fim da calçada do quarteirão)
const PK=8,HC=[-268,-330],HR=88;                         // morro: altura, centro, raio
const HUB=[-348,-306,-382,-310];                         // área da história: 100% plana (y=0)
const PM=1.8,PADM=1.1,GAP=3.2;                            // vão de transição do terraço / folga do terraço / vão entre casas
const sm=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
const inR=(x,z)=>x>X0&&x<X1&&z>X0&&z<X1;
const inC=(x,z)=>x>X0-12&&x<X1-4&&z>X0-12&&z<X1-4;       // área de limpeza (não pega os postes da rua da cidade)
const inHub=(x,z)=>x>HUB[0]&&x<HUB[1]&&z>HUB[2]&&z<HUB[3];
const hubD=(x,z)=>Math.hypot(Math.max(HUB[0]-x,0,x-HUB[1]),Math.max(HUB[2]-z,0,z-HUB[3]));

/* ---------- 1. limpeza do que a grade antiga deixou ---------- */
NX.clear(X0-12,X1,X0-12,X1);                             // casas antigas (building) saem do BL e da cena
{const zero=new THREE.Matrix4().makeScale(0,0,0),m=new THREE.Matrix4(),old=[];
 scene.traverse(o=>{
  if(o.isInstancedMesh){let ch=0;for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);const e=m.elements;if(inC(e[12],e[14])){o.setMatrixAt(i,zero);ch=1}}if(ch)o.instanceMatrix.needsUpdate=true}   // postes, semáforos, árvores, ar-condicionado...
  else if(o.isMesh&&o.geometry&&o.geometry.parameters){const g=o.geometry,p=g.parameters,q=o.position;
   if(g.type==='BoxGeometry'&&p.height===.35&&o.material.color&&o.material.color.getHex()===0x8a4b2d&&inC(q.x,q.z))old.push(o);                 // lajes antigas
   else if(g.type==='PlaneGeometry'&&q.y>0&&q.y<.1&&Math.abs(o.rotation.x+Math.PI/2)<1e-3&&p.width<=48&&p.height<=48&&inR(q.x,q.z))old.push(o)}});   // pisos de quarteirão (terra marrom, praça verde)
 old.forEach(o=>scene.remove(o))}
for(const a of[tTr,tCr,poles,bulbs,sigP,sX,sZ])for(let i=a.length-1;i>=0;i--)if(inC(a[i][0],a[i][2]))a.splice(i,1);   // o props.js lê esses arrays
for(let i=cars.length-1;i>=0;i--){const c=cars[i];if(!c.ai&&!c.cop&&c!==pl.car&&inR(c.pos.x,c.pos.z)&&!inHub(c.pos.x,c.pos.z)){scene.remove(c.g);cars.splice(i,1)}}   // carro parado dentro do morro

/* ---------- 2. terreno ---------- */
function gyB(x,z){                                       // morro puro (sem terraços)
 if(!inR(x,z))return 0;
 const d=Math.hypot(x-HC[0],z-HC[1])/HR;if(d>=1)return 0;
 const f=sm(Math.min(x-X0,X1-x,z-X0,X1-z)/56)*sm(hubD(x,z)/42);
 return PK*(1+Math.cos(Math.PI*d))/2*(1+.04*Math.sin(x*.21)*Math.cos(z*.17))*f}
const PD=[];                                             // terraços das casas
function gy(x,z){const hb=gyB(x,z);let wm=0,sa=0,sy=0;                  // terraços: vence o de maior peso (dentro da casa = 1 exato; vizinhas não puxam)
 for(const p of PD){const ax=Math.abs(x-p.x)-p.hw,az=Math.abs(z-p.z)-p.hd;if(ax>=PM||az>=PM)continue;
  const dd=Math.hypot(Math.max(ax,0),Math.max(az,0));if(dd>=PM)continue;const w=1-sm(dd/PM),a=Math.pow(w,12);if(w>wm)wm=w;sa+=a;sy+=a*p.y}
 return sa>0?hb+(sy/sa-hb)*wm:hb}

/* curva suave (Catmull-Rom) */
function spl(p){const o=[];for(let i=0;i<p.length-1;i++){const a=p[Math.max(0,i-1)],b=p[i],c=p[i+1],d=p[Math.min(p.length-1,i+2)];
 for(let t=0;t<1;t+=.125){const t2=t*t,t3=t2*t;o.push([0,1].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)))}}
 o.push(p[p.length-1]);return o}

/* ruas [largura, tipo, pontos, entrada]  a=asfalto  d=rua de terra  v=viela.
   As 2 primeiras começam EM CIMA das ruas da cidade (z=-256 e x=-256) e se alargam nessa ponta. */
const PATHS=[
 [8,'a',[[-196,-256],[-226,-261],[-250,-279],[-274,-292],[-296,-299],[-320,-308]],1],
 [7,'a',[[-256,-196],[-261,-226],[-279,-250],[-298,-272],[-312,-290],[-320,-308]],1],
 [7,'a',[[-320,-308],[-320,-326],[-320,-346],[-320,-366],[-320,-392]]],
 [6,'d',[[-296,-298],[-286,-318],[-270,-332],[-256,-350],[-240,-364],[-222,-356],[-220,-336],[-236,-318],[-250,-304]]],
 [6,'d',[[-250,-304],[-250,-282]]],
 [5,'d',[[-348,-346],[-362,-354],[-378,-350],[-380,-330],[-372,-314],[-352,-304],[-330,-308]]],
 [5,'d',[[-306,-362],[-290,-374],[-268,-382],[-246,-378],[-232,-364]]]
].map(([w,k,p,ent])=>({w,k,p:spl(p),ent}));
PATHS[0].out=[1,0];PATHS[1].out=[0,1];                    // saída p/ a grade da cidade (carros da favela voltam pra cidade por aqui)
for(let k=0,N0=PATHS.length;k<28;k++){const L=PATHS[Math.floor(R2()*N0)],i=1+Math.floor(R2()*(L.p.length-2)),q=L.p[i],a0=L.p[i-1],b0=L.p[i+1],tl=Math.hypot(b0[0]-a0[0],b0[1]-a0[1])||1,sd=R2()<.5?1:-1,nx=-(b0[1]-a0[1])/tl*sd,nz=(b0[0]-a0[0])/tl*sd;
 let x=q[0]+nx*(L.w/2-.5),z=q[1]+nz*(L.w/2-.5),a=Math.atan2(nz,nx)+rr(-.25,.25);   // começa na borda da rua, apontando pra fora
 if(inHub(x,z)||x<X0+8||x>X1-16||z<X0+8||z>X1-16)continue;
 const pts=[[x,z]];
 for(let s=0;s<4;s++){a+=rr(-.7,.7);x+=Math.cos(a)*rr(8,12);z+=Math.sin(a)*rr(8,12);
  if(x<X0+8||x>X1-16||z<X0+8||z>X1-16||inHub(x,z))break;pts.push([x,z])}
 if(pts.length>2)PATHS.push({w:2.4,k:'v',p:spl(pts)})}
function nearP(x,z){let m=1e9,b=null;for(const L of PATHS)for(const q of L.p){const d=Math.hypot(x-q[0],z-q[1]);if(d<m){m=d;b=q}}return b}
function nearR(x,z,hw,hd){let m=1e9;for(const L of PATHS){const mg=L.k==='v'?1.6:0;for(const q of L.p){   // vielas toleram casas mais coladas; ruas largas precisam de folga p/ o terraço não entrar na pista
 const d=Math.hypot(Math.max(Math.abs(q[0]-x)-hw,0),Math.max(Math.abs(q[1]-z)-hd,0))-L.w/2+mg;if(d<m)m=d}}return m}
function nearL(x,z){return nearR(x,z,0,0)}

/* ---------- 3. mescla de caixas (casas, postes, fios, árvores) ---------- */
function Batch(){const P=[],Nn=[],C=[],I=[];let n=0;
 return{add(g,M,col){const pa=g.attributes.position,na=g.attributes.normal,nm=new THREE.Matrix3().getNormalMatrix(M),c=new THREE.Color(col),v=new THREE.Vector3();
   for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(M);P.push(v.x,v.y,v.z);v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();Nn.push(v.x,v.y,v.z);C.push(c.r,c.g,c.b)}
   for(const k of g.index.array)I.push(k+n);n+=pa.count},
  mesh(mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));
   g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);const m=new THREE.Mesh(g,mat);m.castShadow=m.receiveShadow=true;scene.add(m);return m}}}
const MB=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92}),
 ML=new THREE.MeshStandardMaterial({vertexColors:true,emissive:0xffd98a,emissiveIntensity:0,roughness:.5});   // janelas acesas à noite
const BB=[0,1,2,3].map(Batch),BLt=[0,1,2,3].map(Batch),qd=(x,z)=>(x>CX?1:0)+(z>CX?2:0);
const U=new THREE.BoxGeometry(1,1,1),CY=new THREE.CylinderGeometry(1,1,1,10),mt=new THREE.Matrix4(),qq=new THREE.Quaternion(),vp=new THREE.Vector3(),vs=new THREE.Vector3(),wd=new THREE.Object3D();
const box=(b,x,y,z,w,h,d,c)=>b.add(U,mt.compose(vp.set(x,y,z),qq.identity(),vs.set(w,h,d)),c);
const cyl=(b,x,y,z,r,h,c)=>b.add(CY,mt.compose(vp.set(x,y,z),qq.identity(),vs.set(r,h,r)),c);
const seg=(b,a,e,t,c)=>{const L=Math.hypot(e[0]-a[0],e[1]-a[1],e[2]-a[2])||.01;wd.position.set((a[0]+e[0])/2,(a[1]+e[1])/2,(a[2]+e[2])/2);wd.lookAt(e[0],e[1],e[2]);wd.scale.set(t,t,L);wd.updateMatrix();b.add(U,wd.matrix,c)};
const wire=(b,a,e,sag)=>{const m=[(a[0]+e[0])/2,(a[1]+e[1])/2-sag,(a[2]+e[2])/2];seg(b,a,m,.05,0x141414);seg(b,m,e,.05,0x141414)};

/* ---------- 4. casas ---------- */
const PAL=[0xe74c3c,0xf39c12,0x27ae60,0x2980b9,0x8e44ad,0xf1c40f,0xe67e22,0x1abc9c,0xd35400,0xecf0f1,0xb5651d,0xa9583a,0xc9b79c,0xb0aaa0,0x9c4a32,0xd9c9a6],
 PALB=[0xe3d3b4,0xd9c9a6,0xecf0f1,0xc9b79c,0xd9a38f,0xbfc4cf,0xeadfc8],                 // cores claras, parecidas com a cidade (borda)
 DOOR=[0x2e5a88,0x7a2f2f,0x2f6b34,0x6a6a6a,0xd9b35a,0x3a2d22],CLO=[0xe74c3c,0xf1c40f,0x3498db,0xecf0f1,0x2ecc71],SD=[[0,1],[0,-1],[1,0],[-1,0]];
const RB=[],HS=[];
function house(x,z,w,d,y0,fl,col,s){
 const b=BB[qd(x,z)],l=BLt[qd(x,z)],h=fl*3.05+rr(.1,.4),H=y0+h,yb=y0-2.6;
 box(b,x,(yb+H)/2,z,w,H-yb,d,col);                                          // corpo (afunda no morro)
 box(b,x,(yb+y0+.3)/2,z,w+.3,y0+.3-yb,d+.3,0x8c867b);                        // alicerce de concreto
 for(let k=1;k<fl;k++)box(b,x,y0+k*3.05,z,w+.14,.2,d+.14,0xcfc9bd);          // cintas entre andares
 box(b,x,H+.12,z,w+.9,.24,d+.9,0xb4aea4);                                    // laje
 const fb=(s_,u,y,wu,hh,th,v,c,bt)=>{const[nx,nz]=SD[s_],hn=s_<2?d/2:w/2;      // caixa colada na parede s_ (0:+z 1:-z 2:+x 3:-x)
  box(bt||b,s_<2?x+u:x+nx*(hn+v),y,s_<2?z+nz*(hn+v):z+u,s_<2?wu:th,hh,s_<2?th:wu,c)};
 const wins=(s_,door)=>{const len=s_<2?w:d,n=Math.max(1,Math.floor(len/2.7));
  for(let f=0;f<fl;f++)for(let i=0;i<n;i++){const u=(i-(n-1)/2)*len/n;if(door!=null&&f==0&&Math.abs(u-door)<1.3)continue;
   const y=y0+f*3.05+1.75,lit=R2()<.35;fb(s_,u,y,1.15,1.05,.1,.02,0xe6e1d6);fb(s_,u,y,.9,.8,.1,.07,lit?0x3a2f1e:0x1d2a36,lit?l:b)}};
 const du=rr(-(s<2?w:d)*.25,(s<2?w:d)*.25);
 fb(s,du,y0+1.05,1,2.1,.14,.04,pk(DOOR));fb(s,du,y0+.1,1.5,.2,.5,.25,0xa7a197);wins(s,du);   // porta + degrau + janelas da frente
 wins(s<2?pk([2,3]):pk([0,1]));                                              // janelas de uma lateral
 if(fl>1&&R2()<.5){const len=(s<2?w:d)*.7;fb(s,0,y0+3.05,len,.15,1.1,.55,0xcfc9bd);fb(s,0,y0+3.6,len,.9,.06,1.08,0x2b2b2b)}   // sacada com grade
 BL.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,h:H,m:null,y0});
 const eC=sm(Math.min(X1-x,X1-z)/80);
 if(R2()<.12+.3*eC){                                                         // andar a mais, recuado (tijolo cru ou reboco)
  const uw=w*.62,ud=d*.62,ux=x+rr(-.6,.6),uz=z+rr(-.6,.6),uh=rr(2.6,3.1);
  box(b,ux,H+.24+uh/2,uz,uw,uh,ud,R2()<.45?0xa9583a:pk(PAL));box(b,ux,H+.24+uh+.1,uz,uw+.6,.2,ud+.6,0xb4aea4);
  for(const sx of[-1,1])for(const sz of[-1,1])box(b,ux+sx*uw/2,H+.24+uh+.9,uz+sz*ud/2,.1,1.5,.1,0x8a4b2d);
  BL.push({x0:ux-uw/2,x1:ux+uw/2,z0:uz-ud/2,z1:uz+ud/2,h:H+.24+uh,m:null,y0:H})}
 else{
  const rx=()=>x+rr(-w/2+1.2,w/2-1.2),rz=()=>z+rr(-d/2+1.2,d/2-1.2);
  if(R2()<.7)cyl(b,rx(),H+.84,rz(),.8,1.2,0x2a7fd4);                          // caixa d'água
  if(R2()<.5)for(const sx of[-1,1])for(const sz of[-1,1])box(b,x+sx*(w/2-.15),H+1.1,z+sz*(d/2-.15),.1,1.7,.1,0x8a4b2d);   // ferros de espera
  if(R2()<.4){for(const sx of[-1,1])box(b,x+sx*(w/2-.2),H+1.25,z+d/2-.2,.06,2,.06,0x666666);box(b,x,H+2.2,z+d/2-.2,w-.4,.02,.02,0x999999);
   for(let i=0;i<4;i++)box(b,x-w/2+(i+.8)*w/5,H+1.85,z+d/2-.2,.45,.55,.04,pk(CLO))}   // varal
  if(R2()<.3){const px=rx(),pz=rz();box(b,px,H+.9,pz,.05,1.3,.05,0x777777);cyl(b,px,H+1.7,pz,.4,.12,0xdddddd)}}   // antena parabólica
 HS.push({x,z,H,w,d});
 RB.push({x,z,hw:w/2,hd:d/2});
 PD.push({x,z,hw:w/2+PADM,hd:d/2+PADM,y:y0-.06})}                            // terraço (no espaço do gy; o terreno fica em +.06)

{let n=0;
 for(let t=0;t<9000&&n<240;t++){
  const w=rr(4.8,8.4),d=rr(4.8,8.4),x=rr(X0+10,X1-6),z=rr(X0+10,X1-6),hw=w/2,hd=d/2;
  if(x+hw>HUB[0]-5&&x-hw<HUB[1]+5&&z+hd>HUB[2]-5&&z-hd<HUB[3]+5)continue;
  if(nearR(x,z,hw,hd)<3.4)continue;
  if(RB.some(r=>Math.abs(x-r.x)<hw+r.hw+GAP&&Math.abs(z-r.z)<hd+r.hd+GAP))continue;
  if(BL.some(b=>x+hw>b.x0-2&&x-hw<b.x1+2&&z+hd>b.z0-2&&z-hd<b.z1+2))continue;
  const ys=[gyB(x-hw,z-hd),gyB(x+hw,z-hd),gyB(x-hw,z+hd),gyB(x+hw,z+hd),gyB(x,z)];
  if(Math.max(...ys)-Math.min(...ys)>2.2)continue;
  const y0=ys.reduce((a,c)=>a+c)/5+.06,eC=sm(Math.min(X1-x,X1-z)/80),                // eC: 0 = borda com a cidade, 1 = miolo
   fl=R2()<.05+.32*eC?3:R2()<.25+.4*eC?2:1,q=nearP(x,z),dx=q[0]-x,dz=q[1]-z,s=Math.abs(dz)>Math.abs(dx)?(dz>0?0:1):(dx>0?2:3);   // frente virada p/ a rua mais próxima
  house(x,z,w,d,y0,fl,R2()<.6-.35*eC?pk(PALB):pk(PAL),s);n++}
 /* árvores / bananeiras em terreno livre */
 const b=BB[0];for(let t=0,k=0;t<500&&k<36;t++){const x=rr(X0+4,X1-4),z=rr(X0+4,X1-4);
  if(nearL(x,z)<3||RB.some(r=>Math.abs(x-r.x)<r.hw+2.5&&Math.abs(z-r.z)<r.hd+2.5)||BL.some(c=>x>c.x0-2&&x<c.x1+2&&z>c.z0-2&&z<c.z1+2))continue;
  const y=gy(x,z)+.06,s=rr(.8,1.3),bb=BB[qd(x,z)];cyl(bb,x,y+1.4,z,.18,2.8,0x5b3a22);cyl(bb,x,y+3.3,z,1.5*s,1.6*s,0x3b8240);cyl(bb,x,y+4.4,z,1*s,1.2*s,0x4a9a4d);k++}}

/* postes de madeira + gambiarra de fios (poste → poste e poste → laje das casas) */
{const bw=BB[0];
 for(const L of PATHS){if(L.k==='v')continue;let acc=0,nx=12,prev=null;
  for(let i=1;i<L.p.length;i++){const a=L.p[i-1],b=L.p[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;acc+=l;if(acc<nx)continue;nx+=26;
   const sd=(prev&&prev.sd)?-1:1,x=b[0]-dz/l*(L.w/2+1.1)*sd,z=b[1]+dx/l*(L.w/2+1.1)*sd;
   if(!inR(x,z)||x>X1-10||z>X1-10||hubD(x,z)<3||RB.some(r=>Math.abs(x-r.x)<r.hw+1&&Math.abs(z-r.z)<r.hd+1)){prev=null;continue}
   const y=gy(x,z)+.06,b0=BB[qd(x,z)],top=y+7.1;box(b0,x,y+3.75,z,.22,7.5,.22,0x5b4228);box(b0,x,top,z,1.9,.12,.12,0x4a3620);
   if(prev&&Math.hypot(x-prev.x,z-prev.z)<42)for(const o of[-.7,.7])wire(b0,[prev.x+o,prev.t,prev.z],[x+o,top,z],.7);
   let c=0;for(const h of HS){if(c>=2)break;if(Math.hypot(h.x-x,h.z-z)<15&&R2()<.6){wire(b0,[x,top-.4,z],[h.x+rr(-h.w/3,h.w/3),h.H+.35,h.z+h.d/2],.5);c++}}
   prev={x,z,t:top,sd:sd>0}}}}

/* grafites nas paredes */
{const gt=tex(256,128,g=>{g.fillStyle='#e8e2d4';g.fillRect(0,0,256,128);const c=['#e74c3c','#f1c40f','#3498db','#2ecc71','#9b59b6'];for(let i=0;i<14;i++){g.fillStyle=pk(c);g.beginPath();g.arc(R2()*256,R2()*128,rr(10,38),0,6.3);g.fill()}g.fillStyle='#111';g.font='bold 40px system-ui';g.textAlign='center';g.fillText('QUEBRADA',128,76)}),
 gm=new THREE.MeshStandardMaterial({map:gt,roughness:1});
 let n=0;for(const b of BL){if(n>=10||!b.y0||b.m||b.x0<X0||b.x1>X1||R2()>.12)continue;
  const p=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(4.5,b.z1-b.z0-.6),2.2),gm);p.position.set(b.x1+.07,b.y0+1.9,(b.z0+b.z1)/2);p.rotation.y=Math.PI/2;scene.add(p);n++}}

/* meio-fio na borda da cidade (vãos nas ruas de entrada, z=-256 e x=-256) */
for(const[a,b]of[[X0,-264],[-248,X1]]){box(BB[1],X1-.2,.1,(a+b)/2,.4,.2,b-a,0xaeaeaa);box(BB[2],(a+b)/2,.1,X1-.2,b-a,.2,.4,0xaeaeaa)}
[...BB].forEach(b=>b.mesh(MB));[...BLt].forEach(b=>b.mesh(ML));

/* ---------- 5. textura do chão: calçada → terra, ruas, vielas ---------- */
const TEX=tex(1024,1024,g=>{const W=1024,K=W/SZ,P=v=>(v-X0)*K;
 g.fillStyle='#74604a';g.fillRect(0,0,W,W);gn(g,W,W,40000,.09);
 for(let i=0;i<60;i++){g.fillStyle=`rgba(${R2()<.5?'40,30,20':'150,125,95'},.12)`;g.beginPath();g.arc(R2()*W,R2()*W,rr(10,60),0,6.3);g.fill()}
 for(let i=0;i<30;i++){g.fillStyle='rgba(78,100,48,.22)';g.beginPath();g.arc(R2()*W,R2()*W,rr(8,34),0,6.3);g.fill()}   // mato ralo
 {const id=g.getImageData(0,0,W,W),d=id.data;                                           // passo 1: calçada de concreto na borda da cidade, grama na borda de fora
  for(let y=0;y<W;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4,ec=Math.min(W-1-x,W-1-y)/K,ew=Math.min(x,y)/K;
   let a=(1-sm((ec-5)/30))*.85,b=(1-sm(ew/18))*.6;const s=a+b>1?1/(a+b):1;a*=s;b*=s;const n=(R2()-.5)*14,k=1-a-b;
   d[i]=d[i]*k+(152+n)*a+88*b;d[i+1]=d[i+1]*k+(154+n)*a+122*b;d[i+2]=d[i+2]*k+(156+n)*a+66*b}
  g.putImageData(id,0,0)}
 g.lineCap=g.lineJoin='round';
 const col={a:['#9a9a96','#35363a'],d:['#4c3e2f','#9a8466'],v:['#5e5242','#a39b8d']};
 const st=(L,w,c)=>{g.strokeStyle=c;
  if(L.ent){let acc=0;for(let i=1;i<L.p.length;i++){const a=L.p[i-1],b=L.p[i];acc+=Math.hypot(b[0]-a[0],b[1]-a[1]);   // alarga a boca da rua perto da cidade
    g.beginPath();g.moveTo(P(a[0]),P(a[1]));g.lineTo(P(b[0]),P(b[1]));g.lineWidth=w*(1+.7*(1-sm(acc/45)))*K;g.stroke()}return}
  g.beginPath();L.p.forEach((q,i)=>g[i?'lineTo':'moveTo'](P(q[0]),P(q[1])));g.lineWidth=w*K;g.stroke()};
 const ORD=['v','d','a'];                                                              // vielas, depois terra, por último o asfalto (por cima)
 for(const k of ORD)for(const L of PATHS)if(L.k===k)st(L,L.w+1.6,col[k][0]);
 for(const k of ORD){for(const L of PATHS)if(L.k===k)st(L,L.w,col[k][1]);
  if(k==='d')for(const L of PATHS)if(L.k==='d')st(L,L.w*.55,'rgba(60,45,30,.22)')}     // terra batida
 g.setLineDash([14,18]);for(const L of PATHS)if(L.k==='a')st(L,.35,'rgba(230,200,70,.55)');g.setLineDash([]);
 const id=g.getImageData(0,0,W,W),d=id.data;                                            // passo 2: bordas translúcidas (curtas na cidade, longas na grama)
 for(let y=0;y<W;y++)for(let x=0;x<W;x++){const ec=Math.min(W-1-x,W-1-y)/K,ew=Math.min(x,y)/K;d[(y*W+x)*4+3]=255*Math.min(sm(ec/2.5),sm(ew/14))}
 g.putImageData(id,0,0)},1);

/* malha do terreno: 1 m por célula (os terraços entram em gy, por isso é criada depois das casas) */
{const geo=new THREE.PlaneGeometry(SZ,SZ,SZ,SZ),pa=geo.attributes.position;
 for(let i=0;i<pa.count;i++)pa.setZ(i,gy(CX+pa.getX(i),CX-pa.getY(i)));
 geo.computeVertexNormals();
 const t=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:TEX,roughness:1,transparent:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
 t.rotation.x=-Math.PI/2;t.position.set(CX,.06,CX);t.receiveShadow=true;scene.add(t)}

/* ---------- 6. integração com o resto do jogo ---------- */
const _up=update;update=function(dt){_up(dt);ML.emissiveIntensity=bm.emissiveIntensity*.9;
 for(const a of SY.actors||[]){const p=a.g.position,y=inR(p.x,p.z)?gy(p.x,p.z)+.06:0;p.y=a.alive?y:y+.2}};   // NPCs/inimigos acompanham o morro   // janelas acendem à noite junto com a cidade

/* IA de trânsito e pedestres fica fora da favela (as ruas dela não seguem a grade) */
const inZ=(x,z)=>x<-206&&z<-206;
const _lane=lane;lane=function(o){let l,k=0;do{l=_lane(o)}while(inZ(l.x,l.z)&&++k<30);return l};
// (o antigo 'quicar' na borda da favela foi removido: teletransportava o NPC 5 m a cada frame e causava o pisca-pisca. Ver seção 3, no fim do arquivo.)

/* carros sobem o morro (altura + inclinação) */
const _uc=updCar;updCar=function(c,dt){_uc(c,dt);const x=c.pos.x,z=c.pos.z;
 if(!inR(x,z)){if(c.pos.y){c.pos.y=0;c.g.rotation.x=0}return}
 const s=Math.sin(c.yaw),co=Math.cos(c.yaw),p=Math.atan2(gy(x+s*2,z+co*2)-gy(x-s*2,z-co*2),4);
 c.pos.y=gy(x,z)+.06;c.g.rotation.order='YXZ';c.g.rotation.x=-p;if(c===pl.car)pl.pos.y=c.pos.y};

/* câmera nunca entra no morro */
const _ucam=updCam;updCam=function(dt){_ucam(dt);const p=cam.position;if(!inR(p.x,p.z))return;const fl=gy(p.x,p.z)+.6;
 if(p.y<fl){const d=V3();cam.getWorldDirection(d);p.y=fl;cam.lookAt(p.x+d.x,p.y+d.y,p.z+d.z)}};

/* jogador a pé sobe o morro — SÓ dentro da favela (mantém o chão da cobertura do game.js) */
{let base=pl.fyf||null;
 Object.defineProperty(pl,'fyf',{configurable:true,enumerable:true,set:v=>{base=v},
  get:()=>(x,z,y)=>{const b=base?base(x,z,y):0;return inR(x,z)?Math.max(b,gy(x,z)+.06):b}})}

NX.gy=gy;NX.fav=(x,z)=>x>X0&&x<X1-12&&z>X0&&z<X1-12;NX.favR=inR;   // NX.fav: usado pelo props.js p/ não plantar postes da grade aqui dentro

/* ---------- 3. NPCs: a grade da cidade passa POR BAIXO do morro, então carros/pedestres da grade ficavam enterrados
   (piscando) e atravessavam casas. Agora: (a) a grade não entra na favela; (b) a favela tem pedestres próprios que
   andam pelas ruas e vielas (PATHS) e acompanham o relevo (gy). ---------- */
const fbi=(i,j)=>inR(i*B,j*B);                           // esse cruzamento da grade fica dentro da favela?
nav=function(e,off,dt,tv){
 if(e.fv==2)return favDrive(e,dt,tv);
 if(e.fv)return favWalk(e,dt,tv);
 const[dx,dz]=e.dir,p=e.pos;
 e.sp+=(tv-e.sp)*Math.min(1,dt*3);
 p.x+=dx*e.sp*dt;p.z+=dz*e.sp*dt;
 const k=Math.min(1,dt*4);
 if(dx)p.z+=(Math.round(p.z/B)*B+dx*off-p.z)*k;else p.x+=(Math.round(p.x/B)*B-dz*off-p.x)*k;
 const a=dx?p.x:p.z,m=Math.round(a/B),d=(a-m*B)*(dx||dz);
 if(e.pd<0&&d>=0&&Math.abs(m)<=N/2){
  const ix=Math.round(p.x/B),iz=Math.round(p.z/B),
   o=[[dx,dz],[dz,-dx],[-dz,dx]].filter(v=>Math.abs(ix+v[0])<=N/2&&Math.abs(iz+v[1])<=N/2&&!fbi(ix+v[0],iz+v[1]));   // nunca vira pra dentro da favela
  e.dir=(o.some(v=>v[0]==dx&&v[1]==dz)&&R2()<.6)?[dx,dz]:o.length?pk(o):[-dx,-dz];
  e.pd=1;return}
 e.pd=d};

function favStart(e){const L=PATHS[Math.floor(R2()*PATHS.length)],i=Math.floor(R2()*L.p.length),q=L.p[i];
 e.fp={L,i,s:R2()<.5?1:-1,lo:rr(-1,1)};e.pos.set(q[0],gy(q[0],q[1]),q[1]);e.pd=0}
function favHop(f){                                       // cruzamento de ruas/vielas: às vezes troca de caminho
 const h=f.L.p[f.i];if(R2()>.5)return;
 for(const L of PATHS){if(L===f.L)continue;for(let k=0;k<L.p.length;k++)if(Math.hypot(L.p[k][0]-h[0],L.p[k][1]-h[1])<5.5){f.L=L;f.i=k;f.s=k==0?1:k==L.p.length-1?-1:(R2()<.5?1:-1);return}}}
function favWalk(e,dt,tv){
 let f=e.fp;if(!f){favStart(e);f=e.fp}
 let P=f.L.p,t=P[f.i];
 if(Math.hypot(t[0]-e.pos.x,t[1]-e.pos.z)>40){favStart(e);f=e.fp;P=f.L.p;t=P[f.i]}   // foi parar longe (ex.: renasceu na grade): volta pra rua
 e.sp+=(tv-e.sp)*Math.min(1,dt*3);
 const a=P[Math.max(0,f.i-1)],b=P[Math.min(P.length-1,f.i+1)],sx=b[0]-a[0],sz=b[1]-a[1],sl=Math.hypot(sx,sz)||1,lw=f.L.k==='v'?f.lo*.4:Math.sign(f.lo||1)*(f.L.w/2+.5),
  tx=t[0]-sz/sl*lw,tz=t[1]+sx/sl*lw;                      // cada pedestre anda numa faixa própria da rua
 const dx=tx-e.pos.x,dz=tz-e.pos.z,d=Math.hypot(dx,dz);
 if(d<.9){favHop(f);let n=f.i+f.s;if(n<0||n>=f.L.p.length){f.s=-f.s;n=f.i+f.s}f.i=cl(n,0,f.L.p.length-1)}
 else{const st=Math.min(d,e.sp*dt);e.pos.x+=dx/d*st;e.pos.z+=dz/d*st;e.dir=[dx/d,dz/d]}
 e.pos.y+=(gy(e.pos.x,e.pos.z)-e.pos.y)*Math.min(1,dt*12)}  // sobe e desce o morro


/* ---------- carros da favela: seguem as ruas de carro (asfalto 'a' e terra 'd'), nunca as vielas. Entram e saem pela grade da cidade. ---------- */
const CRD=PATHS.filter(L=>L.k!=='v'),CRDIST=40;
const ENT=[{x:-196,z:-256,L:PATHS[0],inn:[-1,0]},{x:-256,z:-196,L:PATHS[1],inn:[0,-1]}];   // cruzamentos da grade que dão na favela
const FWK=['sedan','fusca','saveiro','pickup','van','bike'];                              // só carros simples da cidade entram
const FAVC=[0,2,4,7,10];                                                                   // carros por qualidade gráfica
const favCars=()=>cars.filter(c=>c.ai&&c.ai.fv==2);
function favFind(h,thr,skip){for(const L of CRD){if(L===skip)continue;for(let k=0;k<L.p.length;k++)if(Math.hypot(L.p[k][0]-h[0],L.p[k][1]-h[1])<thr)return{L,k}}return null}
function favLane(f,i){const P=f.L.p,a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)],sx=b[0]-a[0],sz=b[1]-a[1],l=Math.hypot(sx,sz)||1,o=f.s*f.L.w*.22;   // mão direita
 return[P[i][0]-sz/l*o,P[i][1]+sx/l*o,sx/l*f.s,sz/l*f.s]}
function favDrive(e,dt,tv){
 const f=e.fp;let P=f.L.p,t=favLane(f,f.i),dx=t[0]-e.pos.x,dz=t[1]-e.pos.z,d=Math.hypot(dx,dz);
 if(d<2.6){
  const h=P[f.i];f.cd=(f.cd||0)-1;let sw=(f.cd<=0&&R2()<.5)?favFind(h,5,f.L):null;                // cruzamento: às vezes troca de rua
  if(!sw){let n=f.i+f.s;
   if(n<0||n>=P.length){                                                                          // ponta da rua
    sw=favFind(h,8,f.L);
    if(!sw){
     if(n<0&&f.L.out){e.fv=0;e.fp=null;e.dir=[f.L.out[0],f.L.out[1]];pd0(e);return}               // saiu pra cidade: vira carro da grade
     if(e.car&&e.car.pos.distanceTo(pl.pos)>50){e.car.del=true;return}                           // beco sem saída longe do jogador: some
     f.s=-f.s;n=f.i+f.s}}                                                                          // senão, faz o retorno
   if(!sw)f.i=cl(n,0,P.length-1)}
  if(sw){f.L=sw.L;P=f.L.p;f.i=sw.k;f.s=sw.k==0?1:sw.k==P.length-1?-1:(R2()<.5?1:-1);f.cd=8}
  t=favLane(f,f.i);dx=t[0]-e.pos.x;dz=t[1]-e.pos.z;d=Math.hypot(dx,dz)}
 const dd=d||1,df=Math.atan2(Math.sin(Math.atan2(dx,dz)-Math.atan2(e.dir[0],e.dir[1])),Math.cos(Math.atan2(dx,dz)-Math.atan2(e.dir[0],e.dir[1])));
 const tv2=Math.min(tv,8)*(1-.55*Math.min(1,Math.abs(df)/1.1))*(f.L.k==='d'?.8:1);                // devagar em curva e na terra
 e.sp+=(tv2-e.sp)*Math.min(1,dt*3);
 const st=Math.min(dd,e.sp*dt);e.pos.x+=dx/dd*st;e.pos.z+=dz/dd*st;e.dir=[dx/dd,dz/dd]}
function favCarSpawn(){
 const L=CRD[Math.floor(R2()*CRD.length)],f={L,i:Math.floor(R2()*L.p.length),s:R2()<.5?1:-1,cd:0},t=favLane(f,f.i);
 if(Math.hypot(t[0]-pl.pos.x,t[1]-pl.pos.z)<28||cars.some(o=>Math.hypot(o.pos.x-t[0],o.pos.z-t[1])<7))return;
 const z=window.ZN,ty=z?z.pick('fav'):pk(['fusca','saveiro','sedan']),o={},cc=z?z.col(ty,'fav'):null;if(cc!=null)o.col=cc;
 const c=mkCar(ty,t[0],t[1],Math.atan2(t[2],t[3]),o);c.hp=Math.round(c.hp*rr(.5,.85));                // carro velho / estourado
 c.ai={pos:c.pos,dir:[t[2],t[3]],sp:0,tv:CT[ty].mx*rr(.2,.28),pd:0,fv:2,fp:f,car:c,tf:1}}
{const _uc3=updCar;updCar=function(c,dt){const a=c.ai;                                           // carro simples da grade que chega no cruzamento da favela: às vezes entra
 if(a&&!a.fv&&!a.tf&&!c.keep&&!c.mission&&!c.cop&&FWK.includes(c.t))for(const E of ENT){
  const dx=c.pos.x-E.x,dz=c.pos.z-E.z,ok=E.inn[0]?(Math.abs(dz)<7&&dx<7&&dx>-4):(Math.abs(dx)<7&&dz<7&&dz>-4);
  if(ok&&a.dir[0]===E.inn[0]&&a.dir[1]===E.inn[1]){a.tf=1;if(R2()<.4&&favCars().length<(FAVC[S.q]||0)){a.fv=2;a.fp={L:E.L,i:0,s:1,cd:0};a.car=c;a.pd=0;a.tv=Math.min(a.tv,8)}break}}
 _uc3(c,dt)}}
setInterval(()=>{if(!run)return;const far=Math.hypot(pl.pos.x-CX,pl.pos.z-CX)>CRDIST*8,want=far?0:(FAVC[S.q]||0),fc=favCars();
 if(fc.length>want){const o=fc.filter(c=>c.pos.distanceTo(pl.pos)>45).sort((a,b)=>b.pos.distanceTo(pl.pos)-a.pos.distanceTo(pl.pos))[0];if(o)o.del=true}
 else if(fc.length<want)favCarSpawn()},1100);

/* população da favela por qualidade gráfica (pedestres próprios; a grade da cidade não entra aqui) */
const FAVP=[0,3,7,12,18];
setInterval(()=>{if(!run)return;const want=FAVP[S.q]||0;let n=0;
 for(let i=peds.length-1;i>=0;i--)if(peds[i].fv){if(++n>want){scene.remove(peds[i].g);peds.splice(i,1);n--}}
 if(n<want){mkPed();const q=peds[peds.length-1];q.fv=1;q.beh='walk';q.pan=0;favStart(q)}},700);
})();