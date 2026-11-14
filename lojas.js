'use strict';
/* lojas.js — carregar POR ÚLTIMO (depois do phone.js, antes ou depois do fisica.js, tanto faz).
   Refaz as lojas do extras.js (Mercadinho, Farmácia, Boutique, Armas & Cia, Joalheria) para ficarem como a Oficina do Theo:
   a loja vira o TÉRREO de um prédio de rua (vitrine com vidro, toldo listrado, letreiro, pilastras, andares em cima),
   com prédios vizinhos dos dois lados (com portinha e plaquinha). Quarteirão inteiro só no posto de gasolina (mkGas).
   Mantém toda a lógica de assalto/compra: mesma posição da loja, do balcão, do atendente, da porta e do saco de dinheiro.
   Interior por tipo, feito de caixinhas (juntadas em UMA malha por loja, leve):
     Mercadinho: geladeira de bebidas, corredores com latas/caixas/garrafas, salgadinhos, caixotes de fruta
     Farmácia: parede de remédios, corredores de caixinhas e vitaminas, cadeiras de espera, cruz verde
     Boutique: araras com roupas, mesa de dobrados, parede de sapatos, manequins na vitrine, provadores
     Perfumaria (metade das Boutiques vira Perfumaria): shampoo = retângulos rosas altos e finos, sabonete = blocos brancos baixos e gordos,
        parede de perfumes, balcão de maquiagem, esmaltes
     Armas & Cia: parede de armas, balcão de vidro com pistolas, caixas de munição, cofre, alvos
     Joalheria: vitrines de vidro com ouro/prata/gemas, tapete vermelho, lustre, cofre
   SUPERMERCADO: os Mercadinhos que ficavam em lotes de quarteirão inteiro viram supermercado (corredores, congelados, hortifruti, 4 caixas, estacionamento).
   Para mudar tamanho/posição de algo, procure o comentário do tipo (// MERCADINHO etc.). */
(()=>{
const NX=window.NX;if(!NX||!NX.shops||!NX.shops.length)return;
const W=22,D=16,H=4.5;
const FM={},fm=c=>FM[c]||(FM[c]=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.3,roughness:.75}));
const GLS=new THREE.MeshStandardMaterial({color:0x9fd4ff,transparent:true,opacity:.25,roughness:.05,metalness:.3,depthWrite:false});
const LM=new THREE.MeshBasicMaterial({color:0xfff4d6});
const TY={
 conv:{n:'Mercadinho',c:0x2e8b57,fl:0xd9d6cf},
 farm:{n:'Farmácia',c:0x2e86de,fl:0xe8f0f4},
 roupa:{n:'Boutique',c:0xe84393,fl:0xd8c7b0},
 cosm:{n:'Perfumaria & Cosméticos',c:0xff7eb6,fl:0xf3e1e8},
 arma:{n:'Armas & Cia',c:0xa1662f,fl:0x5f5a52},
 joia:{n:'Joalheria',c:0xf1c40f,fl:0x3a3340}};
const CANS=[0xc0392b,0x27ae60,0xf1c40f,0x2980b9,0xecf0f1,0xe67e22],hex=c=>'#'+c.toString(16).padStart(6,'0');
const SIGNS=['SALÃO','STUDIO','CLÍNICA','LAVANDERIA','PADARIA','BARBEARIA','ESCRITÓRIO','PAPELARIA'];

/* junta várias caixinhas coloridas numa malha só */
function Batch(){const P=[],Nn=[],C=[],I=[];let o=0;
 return{add(w,h,d,x,y,z,col){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);const p=g.attributes.position.array,n=g.attributes.normal.array,c=new THREE.Color(col);
  for(let i=0;i<p.length;i+=3){P.push(p[i],p[i+1],p[i+2]);Nn.push(n[i],n[i+1],n[i+2]);C.push(c.r,c.g,c.b)}
  for(const k of g.index.array)I.push(k+o);o+=p.length/3;g.dispose()},
 mesh(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,emissive:0x2a2a2a}));m.castShadow=false;scene.add(m);return m}}}

function ctx(sx,sz,f){
 /* helpers em coordenadas da loja: lx = direita/esquerda, lz = fundo … porta (+) */
 const X=lx=>sx+lx,Z=lz=>sz+f*lz,ry=f>0?0:Math.PI,bt=Batch();
 const S=(lx,lz,w,d,h,c,y,hit)=>{const m=NX.solid(X(lx),Z(lz),w,d,h,typeof c=='object'?c:fm(c),y||0,hit!==false);m.castShadow=false;return m};
 const blk=(lx,lz,w,d,h)=>BL.push({x0:X(lx)-w/2,x1:X(lx)+w/2,z0:Z(lz)-d/2,z1:Z(lz)+d/2,h,m:null,k:1});
 const bx_=(w,h,d,lx,y,lz,c)=>bt.add(w,h,d,X(lx),y+h/2,Z(lz),c);          // y = base da caixa
 const pln=(w,h,m,lx,y,lz,r)=>NX.plane(w,h,m,X(lx),y,Z(lz),r==null?ry:r);
 const sg=(t,c,bg,w,h,pw,ph,lx,y,lz,r)=>pln(pw,ph,NX.signM(t,c,bg,w,h),lx,y,lz,r);
 const rp=a=>a[Math.floor(Math.random()*a.length)];
 /* gôndola (corredor com os dois lados) e prateleira de parede (um lado). item(i,nível) => [larg,alt,prof,cor] */
 const gond=(lx,lz,len,hh,item)=>{bx_(len,.12,1,lx,0,lz,0x4a4f57);bx_(len,hh,.08,lx,0,lz,0x5a5f67);blk(lx,lz,len,1,hh);
  for(let lv=0;lv<3;lv++){const y=.3+lv*(hh-.4)/3;bx_(len,.05,1,lx,y,lz,0x7a808a);
   for(const sd of[-1,1])for(let i=0;i<len/.36-.5;i++){const it=item(i,lv);bx_(it[0],it[1],it[2],lx-len/2+.3+i*.36,y+.05,lz+sd*.3,it[3])}}};
 const line=(lx,lz,len,hh,item,ax)=>{const z=ax=='z';
  if(z){bx_(.3,hh,len,lx,0,lz,0x4a4f57);blk(lx,lz,.4,len,hh)}else{bx_(len,hh,.3,lx,0,lz,0x4a4f57);blk(lx,lz,len,.4,hh)}
  for(let lv=0;lv<4;lv++){const y=.25+lv*(hh-.4)/4;
   for(let i=0;i<len/.36-.5;i++){const it=item(i,lv),o=-len/2+.3+i*.36,sd=z?(lx>0?-1:1)*.22:.22;
    if(z)bx_(it[0],it[1],it[2],lx+sd,y+.05,lz+o,it[3]);else bx_(it[0],it[1],it[2],lx+o,y+.05,lz+sd*(lz<0?1:-1),it[3])}}};
 return{X,Z,ry,bt,S,blk,bx_,pln,sg,rp,gond,line}}

let rN=0;
function build(s){
 const sx=s.x,sz=s.z,f=s.f,kind=s.type=='roupa'?((rN++%2)?'cosm':'roupa'):s.type,T=TY[kind];if(!T)return;
 s.name=T.n;s.rebuilt=1;if(s.T)s.T=Object.assign({},s.T,{n:T.n,c:T.c});
 /* 1) demole a loja antiga (paredes, balcão, prateleiras, luzes, letreiro) — mantém o saco de dinheiro e os atendentes */
 for(let i=BL.length-1;i>=0;i--){const b=BL[i];if(!b.k)continue;const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;
  if(Math.abs(cx-sx)<W/2+.6&&Math.abs(cz-sz)<D/2+.6){if(b.m){scene.remove(b.m);b.m.geometry.dispose()}BL.splice(i,1)}}
 for(const o of scene.children.slice()){if(!o.isMesh||o.isInstancedMesh||o===s.bag||o.position.y>6.5)continue;
  if(Math.abs(o.position.x-sx)<W/2+.6&&Math.abs(o.position.z-sz)<D/2+.6){scene.remove(o);if(o.geometry)o.geometry.dispose()}}

 const {X,Z,ry,bt,S,blk,bx_,pln,sg,rp,gond,line}=ctx(sx,sz,f);

 /* 2) casca: paredes, fachada com vitrine/porta, toldo, letreiro, laje */
 const wc=fm(0xcfc3ae),dark=0x2b2f36;
 S(0,-7.8,W,.4,H,wc);S(-W/2+.2,0,.4,D,H,wc);S(W/2-.2,0,.4,D,H,wc);
 for(const q of[-1,1]){S(q*9.6,7.8,2.8,.4,H,wc);                                // pilastra
  S(q*5.2,7.8,6,.4,.8,wc);S(q*5.2,7.8,6,.2,2.6,GLS,.8);                           // peitoril + vidro
  bx_(.12,2.6,.3,q*5.2,.8,7.85,dark);bx_(6,.1,.3,q*5.2,2.2,7.85,dark);           // divisórias da vitrine
  S(q*5.2,7.8,6,.4,H-3.4,wc,3.4,false)}                                           // faixa acima do vidro
 S(0,7.8,4.4,.4,H-2.6,wc,2.6,false);                                              // verga da porta (abertura 4,4 m)
 for(let i=0;i<8;i++)bx_(2,.14,2.2,-7+i*2,3.3,9,i%2?0xffffff:T.c);                // toldo listrado
 sg(T.n.toUpperCase(),'#fff',hex(T.c),512,64,11,1,0,3.95,8.04);
 S(0,0,W+.8,D+.8,.4,fm(0x4a4d52),H,false);                                        // laje
 NX.ground(W-.8,D-.8,fm(T.fl),X(0),.06,Z(0));
 for(const x of[-6,0,6])for(const z of[-3.5,3.5]){const l=new THREE.Mesh(new THREE.BoxGeometry(2,.06,.35),LM);l.position.set(X(x),H-.1,Z(z));scene.add(l)}
 /* andares de cima (como a Oficina do Theo): prédio com janelas começando a 4,9 m do chão */
 {const up=rr(7,12),hh=H+.4+up;building(sx,sz,W+.6,D+.6,hh,pk(PS_));const b=BL.pop();if(b&&b.m){b.m.scale.y=up/hh;b.m.position.y=H+.4+up/2}}
 /* prédios vizinhos com portinha e plaquinha */
 for(const q of[-1,1]){building(sx+q*17,sz,12,D,rr(9,17),pk(PS_));
  pln(1.6,2.4,new THREE.MeshBasicMaterial({color:rp([0x5a3a22,0x2f4a63,0x3b3f45])}),q*17,1.2,8.04);
  sg(rp(SIGNS),'#1a1a1a','#e8d9a8',256,64,2.4,.5,q*17,2.9,8.05)}

 /* 3) balcão (mesma posição de antes: o atendente e o saco de dinheiro ficam em cima/atrás dele) */
 S(4,-2.5,7,1.2,1.1,0x6d5a48);S(4,-2.5,7.2,1.4,.08,0x1c1c1f,1.1,false);
 bx_(.55,.35,.45,2.5,1.18,-2.5,0x2c2c2c);bx_(.34,.02,.26,2.5,1.53,-2.5,0x7dff8a);

 /* 4) interior por tipo */
 if(kind=='conv'){                                                                // MERCADINHO
  line(-6,-7.4,9,2.3,(i,lv)=>[.22,.5,.22,CANS[(i+lv)%6]],'x');S(-6,-6.9,9.2,.1,2.3,GLS,0,false);   // geladeira de bebidas
  gond(-6,2.5,7,1.7,(i,lv)=>lv==0?[.28,.38,.28,rp(CANS)]:lv==1?[.38,.55,.14,rp(CANS)]:[.14,.5,.14,rp(CANS)]);
  gond(-6,-1.2,7,1.7,(i,lv)=>lv==0?[.38,.55,.14,rp(CANS)]:lv==1?[.28,.38,.28,rp(CANS)]:[.3,.3,.3,rp(CANS)]);
  line(10.3,3,7,2.2,()=>[.1,.6,.3,rp(CANS)],'z');                                 // salgadinhos
  S(7.5,5.5,1.6,1,.5,0x8d6e4a);for(let i=0;i<12;i++)bx_(.2,.2,.2,6.9+(i%4)*.36,.5,5.1+Math.floor(i/4)*.4,rp([0xe67e22,0xc0392b,0xf1c40f]));
  sg('BEBIDAS GELADAS','#fff','#2980b9',256,64,2.2,.45,-6,2.7,-7.55);sg('FRIOS · PÃES · FRUTAS','#fff','#27ae60',384,64,3,.45,-10.7,2.8,0,Math.PI/2)}
 else if(kind=='farm'){                                                           // FARMÁCIA
  line(3,-7.4,12,2.4,()=>[.28,.18,.14,rp([0xffffff,0xdfeaf5,0x7fd1a8,0xffffff])],'x');
  for(const z of[2.5,-1.2])gond(-6,z,7,1.7,(i,lv)=>lv==1?[.12,.3,.12,rp([0xe67e22,0xffffff,0xf1c40f])]:[.3,.2,.14,rp([0xffffff,0xdfeaf5,0x7fd1a8,0x9ad0ff])]);
  sg('+','#fff','#1e9e5a',128,128,1.3,1.3,-10.75,3,0,Math.PI/2);sg('MEDICAMENTOS','#fff','#1e9e5a',256,64,2.4,.45,-6,2.7,-7.55);
  for(let i=0;i<3;i++){bx_(.5,.45,.5,7+i*1.2,0,6,0x2f6fb5);bx_(.5,.5,.08,7+i*1.2,.45,6.22,0x2f6fb5);blk(7+i*1.2,6,.5,.5,.9)}}
 else if(kind=='roupa'){                                                          // BOUTIQUE
  for(const[lx,lz]of[[-8,3.5],[-4.8,3.5],[-8,-.5],[-4.8,-.5]]){bx_(.06,1.7,.06,lx-1.6,0,lz,0xbfc5cc);bx_(.06,1.7,.06,lx+1.6,0,lz,0xbfc5cc);bx_(3.3,.05,.05,lx,1.6,lz,0xbfc5cc);blk(lx,lz,3.3,.5,1.7);
   for(let i=0;i<9;i++)bx_(.3,.9,.1,lx-1.4+i*.35,.65,lz,rp([0xe74c3c,0x3498db,0xf1c40f,0xffffff,0x2c3e50,0x8e44ad,0x27ae60]))}
  S(8,5.5,3,1.5,.8,0x8a6a4a);for(let k=0;k<3;k++)for(let h=0;h<3;h++)bx_(.5,.1,.4,6.9+k*1.1,.8+h*.1,5.5,rp([0xe74c3c,0xffffff,0x3498db,0xf1c40f,0x2c3e50]));
  line(10.3,2,8,2.2,()=>[.35,.14,.22,rp([0xf5f0e6,0xc0392b,0x2c3e50,0xe8c030])],'z');
  for(const q of[-1,1]){bx_(.06,1,.06,q*6,0,6.6,0xe8e0d0);bx_(.42,.7,.24,q*6,1,6.6,rp([0xe84393,0x2980b9,0xf1c40f]));bx_(.18,.2,.18,q*6,1.7,6.6,0xe8e0d0)}
  for(const z of[-5.6,-3.6]){bx_(1.6,2.2,.1,-9,0,z,0x8a4b6a);blk(-9,z,1.6,.2,2.2)}
  sg('PROVADORES','#fff','#8a4b6a',256,64,1.8,.4,-9,2.5,-4.6)}
 else if(kind=='cosm'){                                                           // PERFUMARIA & COSMÉTICOS
  gond(-6,2.5,7,1.8,()=>[.13,.55,.13,rp([0xff7eb6,0xff5fa2,0xffa6c9,0xff8fc0])]);                  // SHAMPOO: retângulos rosas altos e finos
  gond(-6,-1.2,7,1.6,()=>[.32,.12,.22,rp([0xffffff,0xffffff,0xfdf6e3])]);                           // SABONETE: blocos brancos baixos e gordos
  sg('SHAMPOO','#fff','#d6337a',256,64,1.8,.4,-6,2.5,1.9);sg('SHAMPOO','#fff','#d6337a',256,64,1.8,.4,-6,2.5,3.1,ry+Math.PI);
  sg('SABONETE','#d6337a','#fff',256,64,1.8,.4,-6,2.3,-1.8);sg('SABONETE','#d6337a','#fff',256,64,1.8,.4,-6,2.3,-.6,ry+Math.PI);
  line(3,-7.4,12,2.4,(i)=>[.12,.24+.06*(i%3),.12,rp([0xffd1e8,0x9ad0ff,0xf7e07a,0xc9a7ff])],'x');   // parede de perfumes
  S(7,4,3,1.2,.9,0xffffff);for(let i=0;i<14;i++)bx_(.04,.12,.04,5.7+i*.2,.9,4+(i%2)*.3,rp([0xc0392b,0xff5fa2,0x8e1f5a]));
  line(10.3,-1.5,5,2,()=>[.1,.1,.1,rp([0xc0392b,0xff5fa2,0x8e44ad,0x2980b9])],'z');sg('PERFUMES','#fff','#d6337a',256,64,2,.4,3,2.8,-7.55)}
 else if(kind=='arma'){                                                           // ARMAS & CIA
  for(let r=0;r<3;r++)for(let i=0;i<5;i++){const x=-8+i*1.4;bx_(1.1,.1,.06,x,1.4+r*.5,-7.55,0x1c1c1f);bx_(.35,.12,.06,x-.65,1.38+r*.5,-7.55,0x6b4a2b)}
  S(-6,1.5,6,1,1,0x2b2f36);S(-6,1.5,6,1,.5,GLS,1,false);
  for(let i=0;i<6;i++){bx_(.3,.12,.05,-8.2+i*.8,1.0,1.4,0x111111);bx_(.2,.1,.14,-8.2+i*.8,1.0,1.8,rp([0xc0392b,0x27ae60]))}
  line(10.3,2,8,2,()=>[.3,.12,.2,rp([0xc0392b,0x27ae60,0xf1c40f])],'z');
  S(9,-6,2,2,1.4,0x777b80);sg('ALVO','#c0392b','#fff',128,170,1.2,1.6,8,2.2,-7.55);sg('PROIBIDO FIADO','#1a1a1a','#ffd23f',256,64,2,.4,-3,3,-7.55)}
 else if(kind=='joia'){                                                           // JOALHERIA
  NX.ground(2.6,9,fm(0x7a1f1f),X(0),.07,Z(3.5));
  for(const[lx,lz]of[[-7,3],[-4.4,3],[-7,-1],[-4.4,-1],[8,5.5]]){S(lx,lz,2,1,.9,0x2a2530);S(lx,lz,2,1,.5,GLS,.9,false);bx_(1.6,.03,.7,lx,.9,lz,0x8a1c1c);
   for(let i=0;i<5;i++)bx_(.14,.04,.14,lx-.7+i*.34,.93,lz+(i%2?.15:-.15),rp([0xf1c40f,0xdddddd,0xf1c40f]));
   for(let i=0;i<3;i++)bx_(.07,.07,.07,lx-.5+i*.5,.93,lz,rp([0xc0392b,0x2980b9,0xffffff]))}
  bx_(.1,.6,.1,0,3.9,0,0xb08d3c);bx_(1.3,.12,1.3,0,3.8,0,0xf1c40f);for(let i=0;i<4;i++)bx_(.12,.2,.12,(i%2?.6:-.6),3.6,(i<2?.6:-.6),0xfff2cf);
  S(9,-6,2,2,1.4,0x777b80);sg('OURO · PRATA · DIAMANTES','#ffd23f','#2a2530',384,64,3.4,.5,-6,2.7,-7.55)}
 bt.mesh();
 s.W=W;s.D=D}

/* ---------- SUPERMERCADO: ocupa o quarteirão inteiro (substitui os Mercadinhos dos lotes) ---------- */
function superMarket(s){
 const f=s.f,cx=s.x,cz=s.z-f*12;s.rebuilt=1;s.name='Supermercado';
 NX.clear(cx-24,cx+24,cz-24,cz+24);
 for(let i=BL.length-1;i>=0;i--){const b=BL[i];if(!b.k)continue;const bx=(b.x0+b.x1)/2,bz=(b.z0+b.z1)/2;
  if(Math.abs(bx-cx)<24&&Math.abs(bz-cz)<24){if(b.m){scene.remove(b.m);b.m.geometry.dispose()}BL.splice(i,1)}}
 for(const o of scene.children.slice()){if(!o.isMesh||o.isInstancedMesh||o===s.bag||o.position.y>8)continue;
  if(Math.abs(o.position.x-cx)<24&&Math.abs(o.position.z-cz)<24){scene.remove(o);if(o.geometry)o.geometry.dispose()}}
 NX.ground(46,46,fm(0x3a3c40),cx,.03,cz);
 const {X,Z,ry,bt,S,blk,bx_,sg,rp,gond,line}=ctx(cx,cz,f),HH=6.5,wc=fm(0xd9d2c0),RED=0xc62d2d;
 /* casca: fundo, laterais, fachada com portas de vidro (9 m) e pilastras, laje, letreiro, toldo */
 S(0,-22,41,.4,HH,wc);S(-20,-9,.4,26,HH,wc);S(20,-9,.4,26,HH,wc);
 for(const q of[-1,1]){S(q*18.7,4,3.2,.4,HH,wc);S(q*10.75,4,12.5,.4,.8,wc);S(q*10.75,4,12.5,.2,2.8,GLS,.8);S(q*10.75,4,12.5,.4,HH-3.6,wc,3.6,false)}
 S(0,4,9,.4,HH-3,wc,3,false);S(0,-9,41,27,.4,0x4a4d52,HH,false);
 sg('SUPERMERCADO','#fff','#c62d2d',768,96,16,1.6,0,5,4.05);
 for(let i=0;i<19;i++)bx_(2,.14,1.6,-18+i*2,3.4,5.2,i%2?0xffffff:RED);
 NX.ground(40,26,fm(0xe4e1da),X(0),.06,Z(-9));
 for(let i=0;i<5;i++)for(let j=0;j<3;j++){const l=new THREE.Mesh(new THREE.BoxGeometry(2.4,.06,.4),LM);l.position.set(X(-16+i*8),HH-.1,Z(-3-j*6));scene.add(l)}
 /* estacionamento na frente: faixas, postes, carrinhos */
 for(let r=0;r<2;r++)for(let i=0;i<10;i++)bx_(.12,.01,4.5,-18+i*4,.03,r?19:10.5,0xffffff);
 for(const q of[-1,1]){bx_(.15,5,.15,q*19,0,16,0x44474c);bx_(.7,.15,.7,q*19,5,16,0xfff2cf)}
 for(let i=0;i<4;i++){bx_(.6,.4,.9,-9+i*.8,.35,6.8,0x9aa0a6);bx_(.6,.04,.9,-9+i*.8,.15,6.8,0x555a60);blk(-9+i*.8,6.8,.6,.9,.8)}
 /* caixas: 4 lanes (as duas da direita abertas; a da s.cnt é a do atendente/assalto) */
 [-14,-9,9,14].forEach((lx,k)=>{S(lx,0,4,1.2,1,0x6d5a48);S(lx,0,4.2,1.4,.08,0x1c1c1f,1,false);bx_(.5,.35,.45,lx-1.3,1.08,0,0x2c2c2c);bx_(.34,.02,.26,lx-1.3,1.43,0,0x7dff8a);
  bx_(1.4,.05,.5,lx+.4,1.08,-.2,0x333840);sg(String(k+1),'#fff','#c62d2d',64,64,.5,.5,lx,2.7,0.5)});
 /* corredores: cada fileira com um tipo de produto */
 const rows=[[-5.5,'CEREAIS · ENLATADOS',(i,l)=>[.3,.5,.14,rp(CANS)]],[-9.5,'BEBIDAS',(i,l)=>[.14,.55,.14,rp([0xc0392b,0x2980b9,0xf1c40f,0x27ae60])]],
  [-13.5,'SALGADINHOS · DOCES',(i,l)=>[.34,.3,.1,rp(CANS)]],[-17.5,'LIMPEZA · HIGIENE',(i,l)=>[.25,.45,.18,rp([0x2980b9,0xffffff,0x27ae60,0xe84393])]]];
 rows.forEach((r,n)=>{gond(-1,r[0],26,1.7,r[2]);for(const d of[-1,1])sg(r[1],'#fff','#c62d2d',384,64,3.4,.5,-1,2.8,r[0]+d*.1,d>0?ry:ry+Math.PI)});
 line(0,-21.5,36,2.4,(i,lv)=>[.25,.45,.2,rp([0xffffff,0x2980b9,0xf1c40f,0xc0392b])],'x');S(0,-21,36.4,.1,2.4,GLS,0,false);sg('LATICÍNIOS · CARNES','#fff','#2980b9',384,64,3.4,.5,0,2.8,-21.7);
 for(const lz of[-9,-17]){S(16.5,lz,2.4,7,.9,0xe9eef2);S(16.5,lz,2.4,7,.4,GLS,.9,false);for(let a=0;a<6;a++)for(let b=0;b<2;b++)bx_(.3,.12,.3,15.8+b*1.2,.95,lz-2.5+a*1,rp([0x2980b9,0xe84393,0xffffff,0x27ae60]))}
 sg('CONGELADOS','#fff','#2980b9',256,64,2.6,.5,19.7,2.8,-13,-Math.PI/2);
 for(const lz of[-6,-11,-16]){bx_(2.6,.7,2.6,-17.5,0,lz,0x8d6e4a);blk(-17.5,lz,2.6,2.6,.7);for(let a=0;a<4;a++)for(let b=0;b<4;b++)bx_(.28,.28,.28,-18.4+a*.6,.7,lz-.9+b*.6,rp([0xc0392b,0xe67e22,0x27ae60,0xf1c40f]))}
 sg('HORTIFRUTI','#fff','#27ae60',256,64,2.4,.5,-19.7,2.8,-11,Math.PI/2);
 bt.mesh();
 /* ajusta a lógica de assalto/compra para o novo tamanho */
 s.x=cx;s.z=cz-f*9;s.W=40;s.D=26;s.door={x:cx,z:Z(4)};s.cnt={x:X(9),z:Z(0)};s.cash=Math.floor(s.cash*2.2);
 if(s.ck&&s.ck.pos)s.ck.pos.set(X(9),s.ck.pos.y,Z(-1.7));
 if(s.bag)s.bag.position.set(X(10),1.3,Z(0))}

let nSup=0;
for(const s of NX.shops.slice())if(!s.rebuilt){
 if(s.type=='conv'&&Math.abs(s.z)>=48&&nSup<2){nSup++;superMarket(s)}else build(s)}
})();