'use strict';
/* extras.js — carregado depois de script.js. Av. Paulista, texturas, lojas com interior,
   assaltos/contratos, chuva, combustível, favela, porto e mais densidade. */
(()=>{
const AV=0,hudEl=$('hud'),used=new Set(),key=(i,j)=>i+','+j,bc=(i,j)=>[(i-N/2+.5)*B,(j-N/2+.5)*B];
const mkEl=(id,css)=>{const e=document.createElement('div');e.id=id;e.style.cssText=css;hudEl.appendChild(e);return e};
const objEl=mkEl('obj','left:20px;top:46px;font-size:16px;max-width:440px;line-height:1.4'),fuelEl=mkEl('fuel','right:24px;bottom:96px;font-size:16px'),
 robEl=mkEl('rob','left:50%;bottom:130px;width:260px;margin-left:-130px;height:10px;background:#0009;display:none'),robI=document.createElement('i');
robI.style.cssText='display:block;height:100%;width:0;background:#ff5a3c';robEl.appendChild(robI);

/* ---------- helpers ---------- */
const cache={},mat=c=>c.isMaterial?c:cache[c]||(cache[c]=M(c,.85));
function solid(x,z,w,d,h,c,y0=0,wall=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y0+h/2,z);m.castShadow=m.receiveShadow=true;scene.add(m);
 if(wall)BL.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,h:y0+h,m,k:1});return m}
const ground=(w,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat(c));m.rotation.x=-PI/2;m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m};
const plane=(w,h,m,x,y,z,ry)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);p.position.set(x,y,z);p.rotation.y=ry||0;scene.add(p);return p};
const sign=(t,c,bg,w,h)=>{w=w||256;h=h||64;return tex(w,h,g=>{g.fillStyle=bg||'#10131a';g.fillRect(0,0,w,h);g.strokeStyle=c;g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);g.fillStyle=c;g.font='bold '+Math.floor(h*.52)+'px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,w/2,h/2+2)})};
const signM=(t,c,bg,w,h)=>new THREE.MeshBasicMaterial({map:sign(t,c,bg,w,h)});
const clear=(x0,x1,z0,z1)=>{for(let i=BL.length-1;i>=0;i--){const b=BL[i];if(b.k)continue;const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;
 if(cx>x0&&cx<x1&&cz>z0&&cz<z1){if(b.m){scene.remove(b.m);b.m.geometry.dispose()}BL.splice(i,1)}}};
const blinkM=[];

/* ---------- texturas mais ricas: fachadas, asfalto, grama ---------- */
const cfg=Array.from({length:4},()=>Array.from({length:4},()=>({v:Math.floor(R2()*4),lit:R2()<.45,warm:R2()<.8})));
const cells=fn=>{for(let i=0;i<4;i++)for(let j=0;j<4;j++)fn(i,j,cfg[i][j],i*128+20,j*128+16,88,96)};
const wallN=tex(512,512,g=>{g.fillStyle='#e9e6df';g.fillRect(0,0,512,512);gn(g,512,512,12000,.07);
 cells((i,j,c,x,y,w,h)=>{g.fillStyle='rgba(0,0,0,.16)';g.fillRect(i*128,j*128+118,128,9);
  g.fillStyle='#2b2f36';g.fillRect(x-4,y-4,w+8,h+8);const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#9dbfdc');gr.addColorStop(.5,'#3e5a74');gr.addColorStop(1,'#1b2835');g.fillStyle=gr;g.fillRect(x,y,w,h);
  g.fillStyle='#2b2f36';g.fillRect(x+w/2-2,y,4,h);g.fillRect(x,y+h*.38,w,3);
  g.fillStyle='rgba(255,255,255,.18)';g.beginPath();g.moveTo(x+8,y+h);g.lineTo(x+34,y);g.lineTo(x+52,y);g.lineTo(x+26,y+h);g.fill();
  g.fillStyle='#bdb8ad';g.fillRect(x-6,y+h+4,w+12,5);
  if(c.v==1){g.fillStyle='#4d5258';for(let k=0;k<3;k++)g.fillRect(x-6,y+h-16+k*6,w+12,2)}
  if(c.v==2){g.fillStyle='#d6d6d6';g.fillRect(x+w-30,y+h+10,28,13);g.fillStyle='#6b6b6b';g.fillRect(x+w-26,y+h+13,20,6)}
  if(c.v==3){g.fillStyle='rgba(235,205,160,.78)';g.fillRect(x+2,y+2,w/2-3,h*.55)}})});
const litN=tex(512,512,g=>{g.fillStyle='#000';g.fillRect(0,0,512,512);
 cells((i,j,c,x,y,w,h)=>{if(!c.lit)return;g.fillStyle=c.warm?'#ffd98a':'#bfe3ff';g.fillRect(x,y,w,h);g.fillStyle='rgba(0,0,0,.65)';g.fillRect(x+w/2-2,y,4,h);g.fillRect(x,y+h*.38,w,3);
  if(c.v==3){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x+2,y+2,w/2-3,h*.55)}})});
const bumpN=tex(512,512,g=>{g.fillStyle='#b4b4b4';g.fillRect(0,0,512,512);gn(g,512,512,6000,.15);
 cells((i,j,c,x,y,w,h)=>{g.fillStyle='#fff';g.fillRect(x-4,y-4,w+8,h+8);g.fillStyle='#303030';g.fillRect(x,y,w,h);g.fillStyle='#fff';g.fillRect(x+w/2-2,y,4,h)})});
bm.map=wallN;bm.emissiveMap=litN;bm.bumpMap=bumpN;bm.bumpScale=1.2;bm.needsUpdate=true;

(()=>{const g=roadT.image.getContext('2d'),w=512,rp=()=>{const a=R2()<.5?rr(0,60):rr(452,512),b=rr(0,512);return R2()<.5?[a,b]:[b,a]};
 g.fillStyle='#2a2c31';g.fillRect(0,0,w,w);
 for(let i=0;i<260;i++){g.fillStyle=`rgba(${R2()<.5?'0,0,0':'255,255,255'},${rr(.015,.05)})`;g.beginPath();g.arc(R2()*w,R2()*w,rr(6,40),0,6.3);g.fill()}
 gn(g,w,w,14000,.1);g.fillStyle='rgba(0,0,0,.13)';for(const o of[18,40,472,494]){g.fillRect(o,0,10,w);g.fillRect(0,o,w,10)}
 for(let i=0;i<16;i++){const[x,y]=rp();g.fillStyle=`rgba(18,18,20,${rr(.3,.6)})`;g.fillRect(x,y,rr(10,40),rr(8,26))}
 g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=1.5;for(let i=0;i<30;i++){let[x,y]=rp();g.beginPath();g.moveTo(x,y);for(let k=0;k<5;k++){x+=rr(-14,14);y+=rr(-14,14);g.lineTo(x,y)}g.stroke()}
 for(let i=0;i<8;i++){const[x,y]=rp();g.fillStyle='#3a3b3f';g.beginPath();g.arc(x,y,7,0,6.3);g.fill();g.strokeStyle='#17171a';g.lineWidth=2;g.stroke()}
 for(let i=0;i<10;i++){const[x,y]=rp();g.fillStyle='rgba(8,8,10,.35)';g.beginPath();g.ellipse(x,y,rr(6,16),rr(4,10),R2()*3,0,6.3);g.fill()}
 g.fillStyle='#9a9ca0';g.fillRect(64,64,384,384);
 for(let x=64;x<448;x+=16)for(let y=64;y<448;y+=16){g.fillStyle=`rgba(${R2()<.5?'0,0,0':'255,255,255'},${rr(0,.07)})`;g.fillRect(x,y,16,16)}
 g.strokeStyle='rgba(0,0,0,.14)';g.lineWidth=1;for(let i=64;i<=448;i+=16){g.beginPath();g.moveTo(i,64);g.lineTo(i,448);g.moveTo(64,i);g.lineTo(448,i);g.stroke()}
 g.strokeStyle='#17181a';g.lineWidth=3;g.strokeRect(60,60,392,392);g.strokeStyle='#d0d2d6';g.lineWidth=4;g.strokeRect(64,64,384,384);
 g.fillStyle='rgba(232,194,46,.9)';for(let i=0;i<512;i+=48){g.fillRect(i,-2,26,4);g.fillRect(-2,i,4,26);g.fillRect(i,510,26,4);g.fillRect(510,i,4,26)}
 g.fillStyle='rgba(235,235,235,.85)';for(let i=84;i<440;i+=24){g.fillRect(i,38,12,20);g.fillRect(i,454,12,20);g.fillRect(38,i,20,12);g.fillRect(454,i,20,12)}
 roadT.needsUpdate=true})();
(()=>{const g=grass.material.map.image.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,128,128);
 for(let i=0;i<60;i++){g.fillStyle=R2()<.5?'rgba(0,0,0,.1)':'rgba(255,255,255,.12)';g.beginPath();g.arc(R2()*128,R2()*128,rr(4,16),0,6.3);g.fill()}
 for(let i=0;i<14;i++){g.fillStyle='rgba(120,90,50,.28)';g.fillRect(R2()*128,R2()*128,rr(2,6),rr(2,5))}
 g.strokeStyle='rgba(0,0,0,.16)';for(let i=0;i<260;i++){const x=R2()*128,y=R2()*128;g.beginPath();g.moveTo(x,y);g.lineTo(x+rr(-2,2),y-rr(2,5));g.stroke()}
 grass.material.map.needsUpdate=true})();

/* ---------- lojas com interior ---------- */
const ST={conv:{n:'Mercadinho',c:0x2e8b57,cash:[700,1200],buy:'E — curativo (R$60)'},farm:{n:'Farmácia',c:0x2e86de,cash:[500,900],buy:'E — curativo (R$60)'},
 roupa:{n:'Boutique',c:0xe84393,cash:[900,1600],buy:'E — roupa nova (R$80)'},arma:{n:'Armas & Cia',c:0xa1662f,cash:[1500,2400],g:1,buy:'E — munição e colete (R$250)'},
 joia:{n:'Joalheria',c:0xf1c40f,cash:[2800,4200],g:1,buy:'Mire no atendente para assaltar'}};
const shopTypes=['conv','roupa','farm','arma','joia'],shops=[],stations=[],clerks=[];
const floorT=tex(64,64,g=>{g.fillStyle='#d9d6cf';g.fillRect(0,0,64,64);g.fillStyle='#a9a69e';g.fillRect(0,0,32,32);g.fillRect(32,32,32,32);gn(g,64,64,300,.1)});floorT.repeat.set(11,8);
const glassM=new THREE.MeshStandardMaterial({color:0x9fd4ff,transparent:true,opacity:.28,roughness:.05}),insideDoor=(s,m)=>Math.abs(pl.pos.x-s.x)<s.W/2+m&&Math.abs(pl.pos.z-s.z)<s.D/2+m;
function npc(x,z,face,sh,pa,role,s){const p=person(sh,pa);p.g.position.set(x,0,z);p.g.rotation.y=face;scene.add(p.g);const k={p,pos:p.g.position,hp:60,alive:true,role,shop:s};clerks.push(k);return k}
function mkShop(type,sx,sz,f){const T=ST[type],W=22,D=16,H=4.5,zf=sz+f*D/2,zb=sz-f*D/2,zl=Math.min(zf,zb),zh=Math.max(zf,zb);
 const wall=new THREE.MeshStandardMaterial({color:0xf0ece4,emissive:T.c,emissiveIntensity:.2,roughness:.85}),w_=(a,b,c,d,h)=>solid((a+b)/2,(c+d)/2,b-a,d-c,h||H,wall);
 const s={type,T,name:T.n,x:sx,z:sz,f,W,D,st:'idle',prog:0,cd:0,door:{x:sx,z:zf},cnt:{x:sx+4,z:sz-f*2.5}};s.cash=Math.floor(rr(T.cash[0],T.cash[1]));
 w_(sx-W/2,sx+W/2,zb-.2,zb+.2);w_(sx-W/2-.2,sx-W/2+.2,zl,zh);w_(sx+W/2-.2,sx+W/2+.2,zl,zh);
 for(const[a,b]of[[sx-W/2,sx-2.2],[sx+2.2,sx+W/2]]){solid((a+b)/2,zf,b-a,.4,1,wall,0,false);solid((a+b)/2,zf,b-a,.4,1.5,wall,3,false);
  const gl_=new THREE.Mesh(new THREE.BoxGeometry(b-a-.2,2,.12),glassM);gl_.position.set((a+b)/2,2,zf);scene.add(gl_);BL.push({x0:a,x1:b,z0:zf-.2,z1:zf+.2,h:H,m:null,k:1})}
 solid(sx,sz,W+.8,D+.8,.4,0x4a4d52,H,false);
 const fc=new THREE.Color(T.c).lerp(new THREE.Color(0xffffff),.7),fl=ground(W-.4,D-.4,new THREE.MeshStandardMaterial({map:floorT,color:fc,emissive:0x2a2a2a,roughness:.5}),sx,.05,sz);
 for(const x of[-6,0,6]){const l=new THREE.Mesh(new THREE.BoxGeometry(1.8,.1,1.8),new THREE.MeshBasicMaterial({color:0xfff6d8}));l.position.set(sx+x,H-.1,sz);scene.add(l)}
 plane(9,1.2,signM(T.n,'#'+T.c.toString(16).padStart(6,'0')),sx,3.75,zf+f*.35,f>0?0:PI);
 solid(s.cnt.x,s.cnt.z,7,1.2,1.1,0x6d5a48);bx(.6,.4,.5,0x222222,s.cnt.x-1.5,1.3,s.cnt.z,scene);
 s.bag=bx(.5,.35,.4,0x2fbf4a,s.cnt.x+1,1.3,s.cnt.z,scene);s.bag.visible=false;
 const cols=[0xe74c3c,0xf1c40f,0x3498db,0x2ecc71,0xffffff];
 for(const zz of[1.5,-3]){solid(sx-5,sz+f*zz,7,1,1.7,0x8d6e4a);for(let k=0;k<5;k++)bx(.5,.5,.5,pk(cols),sx-8+k*1.5,1.95,sz+f*zz,scene)}
 solid(sx-W/2+.9,sz,1,10,2.2,0x8d6e4a);for(let k=0;k<4;k++)bx(.5,.6,.6,pk(cols),sx-W/2+.9,2.5,sz-4+k*2.6,scene);
 if(T.g)solid(sx+9,sz-f*6,2,2,1.4,0x777b80);
 s.ck=npc(sx+4,sz-f*4.2,f>0?0:PI,pk(SH),0x222222,'c',s);
 if(T.g){s.gd=npc(sx-6,sz-f*5.5,f>0?0:PI,0x222a3a,0x222a3a,'g',s);bx(.08,.14,.45,0x111111,0,-.58,.18,s.gd.p.aR);s.gd.p.aR.rotation.x=-1.2}
 shops.push(s);return s}
function mkGas(cx,cz,f){const zc=cz+f*6;ground(44,44,0x34363a,cx,.03,cz);solid(cx,zc,18,10,.6,0xdddddd,5,false);solid(cx,zc,18.2,10.2,.3,0xd32f2f,5.6,false);
 for(const a of[-8,8])for(const b of[-4,4])solid(cx+a,zc+b,.8,.8,5,0xcccccc);
 for(const a of[-3.5,3.5]){solid(cx+a,zc,.9,.9,1.5,0xd32f2f);bx(.6,.4,.1,0x7dff8a,cx+a,1.1,zc+f*.5,scene)}
 solid(cx,cz-f*14,10,6,3.2,0xeeeeee);plane(8,1.2,signM('POSTO','#ffd23f'),cx,5.3,zc+f*5.2,f>0?0:PI);building(cx+14,cz-f*14,10,10,rr(8,16),pk(PS_));
 stations.push({x:cx,z:zc,pumps:[[cx-3.5,zc],[cx+3.5,zc]]})}

/* ---------- Av. Paulista ---------- */
function masp(cx,cz,f){const red=mat(0xc62d2d),zc=cz+f*10,gls=new THREE.MeshStandardMaterial({color:0x7fb0a0,transparent:true,opacity:.5,roughness:.1,metalness:.5});
 ground(44,44,0xcfc9bd,cx,.04,cz);for(const px of[-15,15]){for(const pz of[-7,7])solid(cx+px,zc+pz,1.4,1.4,20,red);solid(cx+px,zc,1.8,16.6,2.4,red,18,false)}
 solid(cx,zc,32,12,8,gls,8,false);solid(cx,zc,33,12.4,.6,0xbdbdbd,7.6,false);solid(cx,zc,33,12.4,.6,0xbdbdbd,16,false);
 plane(10,1.2,signM('MASP','#ffffff','#c62d2d'),cx,12,zc+f*6.1,f>0?0:PI)}
function paulista(){const pal=[0x9bb8d3,0x7f9db8,0xb7c4cf,0x8e99a3,0xcfd6dc,0x6f8aa3,0xa9a39a],ipY=[],ipP=[],ipT=[],lp=[],lb=[],tops=[],boards=[],
  adT=['BANCO','CAFÉ','CINEMA','LIVRARIA','HOTEL','GALERIA'],neon=['#ff4d6d','#4dd2ff','#ffd23f','#7dff8a','#c77dff'],pm=signM('AV. PAULISTA','#ffffff','#14508c',320,64);
 const sw=tex(64,64,g=>{g.fillStyle='#e4e1d8';g.fillRect(0,0,64,64);g.fillStyle='#2a2a2e';for(let y=0;y<64;y+=16)for(let x=0;x<64;x+=16){if(((x+y)/16)%2==0){g.beginPath();g.arc(x+8,y+8,6,0,6.3);g.fill()}else g.fillRect(x+3,y+6,10,4)}});
 sw.repeat.set(24,2);const swM=new THREE.MeshStandardMaterial({map:sw,roughness:.9}),bike=mat(0xb23a34);let sn=0;
 for(const sg of[-1,1])ground(768,1.8,bike,0,.035,AV+sg*5.8);
 for(let i=0;i<N;i++){const cx=(i-N/2+.5)*B;
  for(const sg of[-1,1]){const cz=sg*32,f=-sg;ground(48,4,swM,cx,.045,AV+sg*10);
   for(const dx of[-16,0,16]){ipT.push([cx+dx,1.7,AV+sg*9.4,1,1.2]);(R2()<.6?ipY:ipP).push([cx+dx,4.8,AV+sg*9.4,1.2,1.1])}
   for(const dx of[-9,9]){lp.push([cx+dx,4,AV+sg*8.6]);lb.push([cx+dx,8.2,AV+sg*8.6])}
   used.add(key(i,sg<0?5:6));clear(cx-24,cx+24,cz-24,cz+24);ground(46,46,0x7b7d80,cx,.03,cz);
   if(i==7&&sg>0){masp(cx,cz,f);continue}
   if(i%3==1){mkShop(shopTypes[sn++%5],cx,cz+f*12,f);const h=rr(70,150),tz=cz-f*10;building(cx,tz,36,24,h,pk(pal));tops.push([cx,tz,h]);if(h>90)boards.push([cx,tz,f,12.2])}
   else{building(cx,cz,40,40,rr(8,13),pk(pal));const h=rr(60,175),tx=cx+rr(-3,3),tz=cz+rr(-3,3);building(tx,tz,26,26,h,pk(pal));solid(tx,tz,18,18,h*.07,0x6a7480,h,false);tops.push([tx,tz,h*1.07]);
    if(h>90)boards.push([tx,tz,f,13.2]);plane(30,1.3,signM(pk(adT),pk(neon)),cx,5.2,cz+f*20.15,f>0?0:PI)}}}
 for(let i=0;i<=N;i++)for(const sg of[-1,1]){const x=(i-N/2)*B+9.5;plane(7,1.1,pm,x,5.6,AV+sg*8.9,sg>0?PI:0);lp.push([x,4,AV+sg*9.1])}
 inst(new THREE.CylinderGeometry(.25,.32,3.4,6),mat(0x5b3a22),ipT,true);inst(new THREE.SphereGeometry(2.3,8,6),mat(0xf2c318),ipY,true);inst(new THREE.SphereGeometry(2.3,8,6),mat(0xe66fa5),ipP,true);
 inst(new THREE.CylinderGeometry(.1,.14,8,6),mat(0x44474c),lp);inst(new THREE.SphereGeometry(.5,8,6),lampM,lb);
 const bs=[];for(let i=0;i<N;i+=2)for(const sg of[-1,1])bs.push([(i-N/2+.5)*B+10,1.3,AV+sg*10.4]);inst(new THREE.BoxGeometry(4,2.6,1.4),new THREE.MeshStandardMaterial({color:0x9fd4ff,transparent:true,opacity:.35}),bs);
 for(const[x,z,f,o]of boards.slice(0,8)){const t=tex(256,128,g=>{const gr=g.createLinearGradient(0,0,256,128);gr.addColorStop(0,pk(neon));gr.addColorStop(1,'#10131a');g.fillStyle=gr;g.fillRect(0,0,256,128);g.fillStyle='#fff';g.font='bold 46px system-ui,sans-serif';g.textAlign='center';g.fillText(pk(['PAULISTA','VIVA SP','NOVA SANTOS','FESTIVAL','CAFÉ 24h']),128,76)});
  plane(16,8,new THREE.MeshBasicMaterial({map:t}),x,rr(30,60),z+f*o,f>0?0:PI)}
 tops.sort((a,b)=>b[2]-a[2]);for(const[x,z,h]of tops.slice(0,5)){solid(x,z,.8,.8,30,0xdddddd,h,false);const l=new THREE.Mesh(new THREE.SphereGeometry(.8,8,6),new THREE.MeshBasicMaterial({color:0xff2222}));l.position.set(x,h+30,z);scene.add(l);blinkM.push(l.material)}}

/* ---------- favela, industrial, porto, praia ---------- */
function favela(i,j){const[cx,cz]=bc(i,j);used.add(key(i,j));clear(cx-24,cx+24,cz-24,cz+24);ground(46,46,0x6a5a48,cx,.04,cz);
 const cc=[0xe74c3c,0xf39c12,0x27ae60,0x2980b9,0x8e44ad,0xf1c40f,0xe67e22,0x1abc9c,0xd35400,0xecf0f1];
 for(let a=0;a<5;a++)for(let b=0;b<5;b++){if(R2()<.12)continue;const w=rr(5,7.5),d=rr(5,7.5),h=rr(3.5,9),x=cx-19+a*9.5+rr(-1,1),z=cz-19+b*9.5+rr(-1,1);
  building(x,z,w,d,h,pk(cc));solid(x,z,w+.6,d+.6,.35,0x8a4b2d,h,false);if(R2()<.5)building(x+rr(-1,1),z+rr(-1,1),w*.7,d*.7,h+rr(2,4),pk(cc))}}
function industrial(cx,cz){ground(46,46,0x4a4c50,cx,.03,cz);solid(cx,cz,38,34,rr(8,12),0xaab0b6);for(const a of[-12,12])solid(cx+a,cz-8,3,3,rr(22,30),0x8a5a44);
 for(let k=0;k<3;k++)solid(cx-15+k*4.5,cz+19,3.6,3.6,6,0xcfd3d6)}
function port(){const cm=[0xc0392b,0x2980b9,0xf1c40f,0x27ae60,0xecf0f1,0xe67e22],arr=cm.map(()=>[]);ground(260,60,0x6b6e72,220,.02,414);
 for(let x=100;x<=340;x+=14)for(const z of[402,414,426]){if(R2()<.2)continue;const n=1+Math.floor(R2()*3),c=Math.floor(R2()*cm.length);
  for(let k=0;k<n;k++)arr[(c+k)%cm.length].push([x,1.3+k*2.6,z]);BL.push({x0:x-6.2,x1:x+6.2,z0:z-1.3,z1:z+1.3,h:n*2.6,m:null,k:1})}
 cm.forEach((c,i)=>inst(new THREE.BoxGeometry(12,2.5,2.5),M(c,.7,.2),arr[i],true));
 solid(200,392,2,2,26,0xe0a800);solid(240,392,2,2,26,0xe0a800);solid(220,392,46,3,2.5,0xe0a800,26,false);
 for(const[x,z,L]of[[120,540,60],[-220,620,46],[330,700,52]]){bx(L,7,15,M(0x7a1f1f),x,1,z,scene);bx(10,11,12,M(0xeeeeee),x-L/2+9,8,z,scene);for(let k=0;k<5;k++)bx(8,2.6,2.6,M(pk(cm)),x+k*7-10,5.8,z+rr(-3,3),scene)}
 const t=[],c=[],u=[];for(let i=0;i<44;i++){let x=rr(-480,480);if(x>90&&x<350)x-=260;const z=rr(398,438);t.push([x,3,z]);c.push([x,6.3,z]);if(i%4==0)u.push([x+rr(-6,6),2.2,rr(412,436)])}
 inst(new THREE.CylinderGeometry(.25,.35,6,6),mat(0x7a5a3a),t,true);inst(new THREE.ConeGeometry(2.8,1.8,7),mat(0x2f8f46),c,true);inst(new THREE.ConeGeometry(2.2,.9,8),mat(0xe74c3c),u,true);
 solid(-100,412,10,6,3.5,0xf0e6c8);solid(-100,412,11,7,.4,0xb5532b,3.5,false)}
function lots(){const c=[];for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(!park[i][j]&&!used.has(key(i,j)))c.push([i,j]);c.sort(()=>R2()-.5);let n=0;
 for(const[i,j]of c){if(n>=18)break;const[cx,cz]=bc(i,j),f=R2()<.5?1:-1;clear(cx-24,cx+24,cz-24,cz+24);used.add(key(i,j));
  if(n<3)mkGas(cx,cz,f);else if(n<15){ground(46,46,0x3a3c40,cx,.03,cz);mkShop(shopTypes[n%5],cx,cz+f*12,f);building(cx,cz-f*10,38,22,rr(8,26),pk(PS_))}else industrial(cx,cz);n++}}
function detail(){const ac=[],tk=[],bn=[],hy=[],bh=[];
 for(const b of BL){if(b.k||b.h<9||!b.m)continue;const w=b.x1-b.x0,d=b.z1-b.z0,cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;
  for(let n=0;n<1+Math.floor(R2()*3);n++)ac.push([cx+rr(-w/3,w/3),b.h+.5,cz+rr(-d/3,d/3),1.4,1]);if(R2()<.35)tk.push([cx+rr(-w/3,w/3),b.h+1.3,cz+rr(-d/3,d/3),1,1])}
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){const[cx,cz]=bc(i,j);for(const s of[-1,1]){bn.push([cx+rr(-18,18),.5,cz+s*22.6]);if(R2()<.5)hy.push([cx+rr(-18,18),.4,cz+s*22.6]);if(R2()<.5)bh.push([cx+rr(-18,18),.3,cz+s*22.2])}}
 inst(new THREE.BoxGeometry(2,1,2),mat(0x9aa0a6),ac,true);inst(new THREE.CylinderGeometry(1.1,1.1,2.4,8),mat(0x5b6b7a),tk,true);
 inst(new THREE.CylinderGeometry(.28,.28,1,8),mat(0x3d5a45),bn,true);inst(new THREE.CylinderGeometry(.16,.2,.8,8),mat(0xc0392b),hy);inst(new THREE.BoxGeometry(1.7,.6,.5),mat(0x7a5a3a),bh,true)}

/* ---------- assaltos, lojas e contratos ---------- */
function killClerk(k){k.alive=false;k.p.g.rotation.x=-1.5;k.p.g.position.y=.2;const s=k.shop;
 if(k.role=='c'&&s.st!='open'&&s.cd<=0){s.st='open';s.cash=Math.floor(s.cash*.6);s.bag.visible=true}crime(k.role=='c'?2:1)}
function clerkShot(){const W=WP[pl.w],q=V3();for(let t=pl.cdist+.8;t<45;t+=.35){q.copy(cam.position).addScaledVector(dv,t);if(q.y<=0||inB(q.x,q.y,q.z))return;
 for(const k of clerks){if(!k.alive||Math.abs(k.pos.x-q.x)>.5||Math.abs(k.pos.z-q.z)>.5||q.y>1.9)continue;k.hp-=W.dmg;
  for(let i=0;i<4;i++)emit(q,V3(rr(-2,2),rr(0,3),rr(-2,2)),0xaa0000,.3,.5,0,-8);if(k.hp<=0)killClerk(k);return}}}
function reset(s){s.st='idle';s.cash=Math.floor(rr(s.T.cash[0],s.T.cash[1]));s.bag.visible=false;for(const k of[s.ck,s.gd])if(k){k.alive=true;k.hp=60;k.p.g.rotation.x=0;k.p.g.position.y=0}}
function shopTick(dt){let bar=0;
 for(const s of shops){if(s.cd>0){s.cd-=dt;if(s.cd<=0)reset(s)}if(Math.hypot(pl.pos.x-s.x,pl.pos.z-s.z)>45)continue;
  const ck=s.ck,gd=s.gd,aim=MB.r&&pl.w>0&&!pl.car&&!pl.dead,ins=insideDoor(s,2),near=Math.hypot(pl.pos.x-ck.pos.x,pl.pos.z-ck.pos.z)<11;
  if(gd&&gd.alive&&aim&&ins){gd.t=(gd.t||1.2)-dt;if(gd.t<=0){gd.t=1.1;hurt(7);nz(.1,.3,2200);emit(V3(gd.pos.x,1.3,gd.pos.z),V3(),0xffe08a,1.1,.06,0,0)}}
  if(s.st=='idle'&&s.cd<=0&&ck.alive&&aim&&ins&&near){s.st='up';s.prog=0;msg('Mantenha a mira no atendente!')}
  if(s.st=='up'&&ck.alive){s.prog+=aim&&near?dt:-dt*.7;if(s.prog<=0){s.st='idle';s.prog=0}else if(s.prog>=5){s.st='open';s.bag.visible=true;crime(1);bp(300,.6);msg('Caixa aberto! Pegue o dinheiro (E)')}else bar=Math.max(bar,s.prog/5)}
  ck.p.aL.rotation.x=ck.p.aR.rotation.x=(s.st=='up'||s.st=='open')&&ck.alive?-2.9:0}
 robEl.style.display=bar>0?'block':'none';robI.style.width=bar*100+'%'}
function collect(s){S.money+=s.cash;msg('+R$'+s.cash+' — fuja!');bp(520,.25);s.bag.visible=false;s.st='idle';s.cd=240;if(ms&&ms.shop===s){ms.stage=2;ms.got=s.cash}}
function buy(s){const t=s.type;
 if(t=='conv'||t=='farm'){if(pl.hp>=100)return msg('Você já está com a vida cheia');if(S.money<60)return msg('Dinheiro insuficiente');S.money-=60;pl.hp=100;msg('Curativo −R$60')}
 else if(t=='roupa'){if(S.money<80)return msg('Dinheiro insuficiente');S.money-=80;P.sm.color.setHex(pk(SH));P.pm.color.setHex(pk(PA));msg('Visual novo −R$80')}
 else if(t=='arma'){if(S.money<250)return msg('Dinheiro insuficiente');S.money-=250;pl.am[1]+=36;pl.am[2]+=90;pl.ar=100;msg('Munição e colete −R$250')}
 else msg('A joalheria só atende quem pode pagar…');bp(660,.12)}
function interact(){if(pl.dead)return;
 if(!pl.car){for(const s of shops){if(!insideDoor(s,4)||Math.hypot(pl.pos.x-s.cnt.x,pl.pos.z-s.cnt.z)>4.5)continue;if(s.st=='open'){collect(s);return}if(s.st=='idle'&&s.cd<=0&&s.ck.alive){buy(s);return}}}
 else{const c=pl.car;for(const g of stations)if(Math.hypot(c.pos.x-g.x,c.pos.z-g.z)<12){const need=100-(c.fuel??50),cost=need*.5;if(need<1)return msg('Tanque cheio');
   if(S.money>=cost){S.money-=cost;c.fuel=100;c.low=0;msg('Abastecido −R$'+Math.round(cost))}else{c.fuel=(c.fuel??0)+S.money/.5;S.money=0;msg('Abastecimento parcial')}bp(440,.2);return}}}
function promptTick(){let t='';
 if(!pl.car&&!pl.dead){for(const s of shops){if(!insideDoor(s,4)||Math.hypot(pl.pos.x-s.cnt.x,pl.pos.z-s.cnt.z)>4.5)continue;t=s.st=='open'?'E — pegar o dinheiro':s.st=='up'?'':s.cd>0?'Loja fechada':s.ck.alive?s.T.buy:'';break}}
 else if(pl.car){const c=pl.car;for(const g of stations)if(Math.hypot(c.pos.x-g.x,c.pos.z-g.z)<12){t='E — abastecer';break}}
 if(t)$('pr').textContent=t}
let ms=null;const hide={x:-100,z:424},bcn=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,80,16,1,true),new THREE.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false,fog:false}));
bcn.visible=false;scene.add(bcn);
const dist=a=>Math.hypot(a.x-pl.pos.x,a.z-pl.pos.z);
function endMission(t){ms=null;bcn.visible=false;objEl.textContent='';if(t)msg(t)}
function startMission(){if(pl.dead)return;if(ms){endMission('Contrato cancelado');return}
 const av=shops.filter(s=>s.cd<=0&&s.ck.alive).sort((a,b)=>dist(a)-dist(b)).slice(0,5);if(!av.length){msg('Nenhum alvo disponível agora');return}
 ms={shop:pk(av),stage:0,got:0};msg('Contrato aceito: assalte '+ms.shop.name)}
function missionTick(){if(!ms)return;if(pl.dead){endMission('Contrato falhou');return}const s=ms.shop,tg=ms.stage<2?s.door:hide;bcn.position.set(tg.x,40,tg.z);bcn.visible=true;
 if(ms.stage==0){objEl.textContent='Contrato: vá até '+s.name+' ('+Math.round(dist(s))+' m)';if(dist(s.door)<14)ms.stage=1}
 else if(ms.stage==1)objEl.textContent=s.st=='open'?'Pegue o dinheiro no balcão (E)':'Entre na loja e mire (botão dir.) no atendente por 5 s';
 else{objEl.textContent=wanted?'Fuja da polícia! Procurado: '+wanted+' ★':'Vá até a barraca na praia (marcador amarelo)';
  if(!wanted&&dist(hide)<12){const pay=Math.floor(ms.got*.5+400);S.money+=pay;endMission('Contrato cumprido! Bônus +R$'+pay)}}}
function markers(){const s=.42,px=pl.pos.x,pz=pl.pos.z,sy=Math.sin(cy),co=Math.cos(cy),pt=(x,z)=>{const dx=x-px,dz=z-pz;return[85+(-dx*co+dz*sy)*s,85-(dx*sy+dz*co)*s]};
 for(const sh of shops){const q=pt(sh.x,sh.z);if(Math.hypot(q[0]-85,q[1]-85)>78)continue;mm.fillStyle=sh.cd>0?'#777':'#ffd23f';mm.fillRect(q[0]-3,q[1]-3,6,6)}
 for(const g of stations){const q=pt(g.x,g.z);if(Math.hypot(q[0]-85,q[1]-85)>78)continue;mm.fillStyle='#4aa3ff';mm.fillRect(q[0]-3,q[1]-3,6,6)}
 if(ms){const t=ms.stage<2?ms.shop.door:hide;let q=pt(t.x,t.z);const dx=q[0]-85,dy=q[1]-85,d=Math.hypot(dx,dy);if(d>76)q=[85+dx/d*76,85+dy/d*76];
  mm.fillStyle=Math.floor(clock*3)%2?'#ff5a3c':'#fff';mm.beginPath();mm.arc(q[0],q[1],5,0,6.3);mm.fill()}
 if(window.SY&&SY.markers)for(const m of SY.markers){if(m.l=='gun'||m.l=='!')continue;let q=pt(m.x,m.z);const dx=q[0]-85,dy=q[1]-85,d=Math.hypot(dx,dy);if(d>76){if(!m.edge)continue;q=[85+dx/d*72,85+dy/d*72]}
  mm.fillStyle=m.c;mm.beginPath();mm.arc(q[0],q[1],7,0,6.3);mm.fill();mm.fillStyle='#000';mm.font='bold 9px system-ui';mm.textAlign='center';mm.fillText(m.l,q[0],q[1]+3)}}

/* ---------- chuva dinâmica ---------- */
const RN=1400,rpos=new Float32Array(RN*3);for(let i=0;i<RN;i++){rpos[i*3]=rr(-30,30);rpos[i*3+1]=rr(0,30);rpos[i*3+2]=rr(-30,30)}
const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rpos,3));
const rainP=new THREE.Points(rg,new THREE.PointsMaterial({color:0xb8d0ea,size:.22,transparent:true,opacity:.6,depthWrite:false}));rainP.frustumCulled=false;rainP.visible=false;scene.add(rainP);
let rain=0,rtgt=0,rt=rr(50,110);const g0={};
function rainTick(dt){rt-=dt;if(rt<=0){rtgt=rtgt?0:1;rt=rtgt?rr(50,110):rr(120,260);msg(rtgt?'Começou a chover — pista escorregadia':'A chuva parou')}
 rain+=(rtgt-rain)*Math.min(1,dt*.3);rainP.visible=rain>.04;
 if(rainP.visible){const a=rg.attributes.position.array;for(let i=0;i<RN;i++){a[i*3+1]-=40*dt;if(a[i*3+1]<0)a[i*3+1]+=30}rg.attributes.position.needsUpdate=true;
  rainP.position.set(cam.position.x,cam.position.y-12,cam.position.z);rainP.material.opacity=.6*rain}
 col.multiplyScalar(1-.4*rain);scene.fog.color.copy(col);scene.fog.near=60-40*rain;hemi.intensity*=1-.3*rain;sun.intensity*=1-.6*rain;
 city.material.roughness=.92-.5*rain;for(const t in CT){const T=CT[t];if(g0[t]==null)g0[t]=T.gr;T.gr=g0[t]*(1-.35*rain)}}

/* ---------- população e montagem ---------- */
used.add('8,3');for(let i=0;i<3;i++)for(let j=0;j<3;j++)favela(i,j);paulista();lots();port();detail();
for(const c of cars.slice())if(!c.ai&&!c.cop&&Math.abs(c.pos.z-AV)<10){scene.remove(c.g);cars.splice(cars.indexOf(c),1)}
for(let i=0;i<14;i++)traffic();for(let i=0;i<8;i++)parked();for(let i=0;i<24;i++)mkPed();
for(let i=0;i<14;i++){const s=R2()<.5?1:-1,t=i%3==0?'bus':pk(TT),c=mkCar(t,rr(-H+20,H-20),AV+s*3.2,Math.atan2(s,0),{col:t=='bus'?0x2e9f6b:pk(CC)});
 c.ai={pos:c.pos,dir:[s,0],sp:0,tv:CT[t].mx*rr(.22,.3),pd:0};pd0(c.ai)}
for(let i=0;i<26;i++){mkPed();const q=peds[peds.length-1],s=R2()<.5?1:-1;q.pos.set(rr(-H+20,H-20),0,AV+s*9.5);q.dir=[s,0];pd0(q)}
applyQ();

const _u=update,_s=shoot;
update=function(dt){const c=pl.car;if(c){if(c.fuel==null)c.fuel=rr(40,90);if(c.fuel<=0){K.KeyW=false;if(c.vel.x*Math.sin(c.yaw)+c.vel.z*Math.cos(c.yaw)<1)K.KeyS=false}}_u(dt);
 if(c&&c===pl.car&&c.fuel>0){c.fuel=Math.max(0,c.fuel-dt*(.04+c.vel.length()*.005));if(c.fuel<15&&!c.low){c.low=1;msg('Combustível baixo! Procure um posto')}if(c.fuel<=0)msg('Sem combustível!')}
 fuelEl.textContent=pl.car?'⛽ '+Math.round(pl.car.fuel??0)+'%':'';
 shopTick(dt);missionTick();rainTick(dt);markers();promptTick();const on=Math.floor(clock*1.2)%2;for(const m of blinkM)m.color.setHex(on?0xff2222:0x330000)};
shoot=function(){const m0=pl.mg[pl.w];_s();if(pl.w&&pl.mg[pl.w]<m0)clerkShot()};
addEventListener('keydown',e=>{if(!run||e.repeat)return;if(e.code=='KeyE')interact();if(e.code=='KeyJ')startMission()});
window.NX={shops,stations,clerks,solid,ground,plane,signM,sign,mat,clear,hide};
})();