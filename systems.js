'use strict';
/* systems.js — carregado depois de extras.js. Realismo, personagens, rádio, menu de pausa com mapa, perfil/XP, banco, radares. */
(()=>{
const NX=window.NX,hudEl=$('hud'),el=(id,css)=>{const e=document.createElement('div');e.id=id;e.style.cssText=css;hudEl.appendChild(e);return e};
const SV=(()=>{try{return JSON.parse(localStorage.getItem('ns2'))}catch(e){return null}})()||{};
SV.xp=SV.xp||0;SV.bank=SV.bank||0;SV.ch=SV.ch||0;SV.done=SV.done||[];SV.st=Object.assign({km:0,kills:0,robs:0,deaths:0,min:0,fines:0},SV.st);
const lvl=()=>Math.floor(Math.sqrt(SV.xp/120))+1,xp=n=>{const a=lvl();SV.xp+=n;if(lvl()>a)msg('Nível '+lvl()+'! Fôlego e pontaria melhoraram')};
const persist=()=>{try{localStorage.setItem('ns2',JSON.stringify(SV))}catch(e){}};setInterval(persist,4000);
const SY=window.SY={SV,xp,lvl,persist,markers:[],next:null};

/* ---------- realismo: tone mapping, reflexos (envMap), tinta metálica, relevo no asfalto ---------- */
R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.15;
const sk=new THREE.Scene(),gt=tex(8,128,g=>{const gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'#5a8fd8');gr.addColorStop(.45,'#cfe3f5');gr.addColorStop(.5,'#8d9096');gr.addColorStop(1,'#3a3c40');g.fillStyle=gr;g.fillRect(0,0,8,128)});
sk.add(new THREE.Mesh(new THREE.SphereGeometry(50,16,12),new THREE.MeshBasicMaterial({map:gt,side:THREE.BackSide})));
const envT=new THREE.PMREMGenerator(R).fromScene(sk,0).texture;
bm.envMap=envT;gl.envMap=envT;city.material.envMap=envT;seaM.envMap=envT;
city.material.bumpMap=tex(512,512,g=>{g.fillStyle='#999';g.fillRect(0,0,512,512);gn(g,512,512,16000,.25);g.strokeStyle='#222';for(let i=0;i<30;i++){let x=R2()*512,y=R2()*512;g.beginPath();g.moveTo(x,y);for(let k=0;k<4;k++){x+=rr(-14,14);y+=rr(-14,14);g.lineTo(x,y)}g.stroke()}},N);city.material.bumpScale=.9;
function paint(c){const o=c.cm,pm=new THREE.MeshPhysicalMaterial({color:o.color.getHex(),metalness:.55,roughness:.32,clearcoat:1,clearcoatRoughness:.08,envMap:envT,envMapIntensity:.8});
 c.bd.children[0].material=pm;c.bd.children.forEach(o=>{if(o.userData.paint)o.material=pm});c.cm=pm;c.base=new THREE.Color(pm.color);const T=c.T,y=c.wr+T.H+T.C;
 if(c.t=='taxi')bx(.9,.22,.35,0xffe27a,0,y+.14,0,c.bd);
 if(c.t=='ambulance'){bx(T.W+.02,.22,T.L*.7,0xd32f2f,0,c.wr+T.H*.45,0,c.bd);bx(.5,.16,.3,0xff2020,-.4,y+.1,0,c.bd);bx(.5,.16,.3,0x2050ff,.4,y+.1,0,c.bd)}}
CT.taxi=Object.assign({},CT.sedan,{col:0xf2c200});CT.ambulance=Object.assign({},CT.suv,{col:0xffffff,hp:150});CT.van=Object.assign({},CT.pickup,{col:0xdddddd,H:1.5,C:.4,hp:160});
TT.push('taxi','taxi','ambulance','van');
const _mk=mkCar;mkCar=function(t,x,z,yaw,o){const c=_mk(t,x,z,yaw,o||{});paint(c);return c};
for(const c of cars)paint(c);for(let i=0;i<10;i++)traffic();

/* ---------- personagens mais detalhados ---------- */
const SK=[0xf1c9a5,0xd9a77f,0xc68642,0x8d5524,0x5c3a21],HR=[0x1a1a1a,0x3b2417,0x6b4423,0xb08d57,0x777777,0x8a2f1f];
const faceM=new THREE.MeshBasicMaterial({transparent:true,map:tex(64,64,g=>{g.fillStyle='#fff';g.beginPath();g.ellipse(20,28,6,4.5,0,0,6.3);g.ellipse(44,28,6,4.5,0,0,6.3);g.fill();g.fillStyle='#222';g.beginPath();g.arc(21,28,3,0,6.3);g.arc(43,28,3,0,6.3);g.fill();
 g.fillStyle='#3a2a1e';g.fillRect(12,18,16,3);g.fillRect(36,18,16,3);g.strokeStyle='#8a4a3a';g.lineWidth=3;g.beginPath();g.moveTo(24,48);g.quadraticCurveTo(32,53,40,48);g.stroke();g.fillStyle='rgba(120,70,50,.5)';g.fillRect(29,32,6,10)})});
function dress(p,o){if(p.det)return;p.det=1;o=o||{};const sk_=o.skin??pk(SK),hr=o.hair??pk(HR),s=M(sk_),h=M(hr),dk=M(0x1d1d1d),
 pt=(w,hh,d,m,x,y,z,par)=>{const b=bx(w,hh,d,m,x,y,z,par);b.castShadow=false;return b};
 p.t.children[1].material.color.setHex(sk_);p.t.children[2].material.color.setHex(hr);
 const f=new THREE.Mesh(new THREE.PlaneGeometry(.22,.22),faceM);f.position.set(0,.8,.126);p.t.add(f);pt(.27,.18,.06,h,0,.85,-.13,p.t);
 for(const a of[p.aL,p.aR])pt(.15,.14,.15,s,0,-.62,0,a);for(const l of[p.lL,p.lR])pt(.21,.11,.3,dk,0,-.85,.06,l);
 if(R2()<.4||o.full)for(const a of[p.aL,p.aR])pt(.155,.28,.155,s,0,-.44,0,a);
 if(R2()<.2)pt(.24,.05,.02,dk,0,.82,.13,p.t);
 if(o.full){pt(.52,.07,.32,M(0x2a2a2a),0,.04,0,p.t);if(R2()<.5)pt(.27,.3,.08,h,0,.72,-.13,p.t);if(o.vest){pt(.55,.5,.35,M(0xff7a00,.6),0,.38,0,p.t);pt(.555,.05,.355,M(0xdddddd),0,.28,0,p.t);pt(.555,.05,.355,M(0xdddddd),0,.5,0,p.t)}}
 else if(R2()<.15)pt(.4,.45,.16,M(pk([0x2c3e50,0x8e44ad,0xd35400])),0,.38,-.24,p.t)}
SY.dress=dress;
const _p=person;person=function(a,b){const p=_p(a,b),o=SY.next;SY.next=null;dress(p,o);return p};
dress(P,{full:1,vest:1,skin:0xc68642,hair:0x1a1a1a});for(const q of peds)dress(q.pp);for(const k of NX.clerks)dress(k.p,{full:1});

/* ---------- vantagens por nível, estatísticas, banco, radares ---------- */
const _kp=killPed;killPed=function(q,by){const w=q.dead;_kp(q,by);if(!w&&q.dead&&by)SV.st.kills++};
const ATM=[],RX=[-192,-64,64,192];let rcd=0,atmA=[];
for(let i=1;i<N;i+=2)for(const sg of[-1,1]){const x=(i-N/2)*B+16;ATM.push([x,.9,sg*11.3]);atmA.push([x,.9,sg*11.3])}
inst(new THREE.BoxGeometry(.8,1.8,.5),M(0x555a60),ATM,true);inst(new THREE.BoxGeometry(.5,.3,.56),new THREE.MeshBasicMaterial({color:0x7dff8a}),ATM.map(a=>[a[0],1.4,a[2]]));
for(const x of RX){bx(.4,6,.4,0x44474c,x,3,-10.4,scene);bx(1.6,.8,.8,0x2a2d31,x,6.2,-10.4,scene);bx(.3,.3,.1,0xff3333,x,6.2,-9.95,scene)}
const flash=el('flash','inset:0;background:#fff;opacity:0;transition:opacity .35s');
function atm(){if(pl.car||pl.dead)return;for(const a of atmA)if(Math.hypot(a[0]-pl.pos.x,a[2]-pl.pos.z)<2.8){
 if(S.money>0){SV.bank+=S.money;msg('Depositado R$'+S.money+' (protegido se você morrer)');S.money=0}else if(SV.bank>0){S.money=SV.bank;msg('Sacado R$'+SV.bank);SV.bank=0}else msg('Conta vazia');bp(700,.12);return}}

/* ---------- rádio nos carros (síntese Web Audio) ---------- */
const radioEl=el('radio','left:50%;top:18px;transform:translateX(-50%);font-size:18px;color:#7fd0ff;opacity:0;transition:opacity .4s');
const rd={i:-1,next:0,step:0,song:0,t0:0,g:null,nb:null,cv:null,vol:.7,t:0};
const fq=n=>440*Math.pow(2,(n-69)/12);
function rinit(){if(!AC)return false;if(rd.g)return true;const c=AC.createDynamicsCompressor();rd.g=AC.createGain();rd.g.gain.value=0;rd.g.connect(c);c.connect(AC.destination);
 rd.nb=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const a=rd.nb.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=R2()*2-1;
 rd.cv=new Float32Array(256);for(let i=0;i<256;i++)rd.cv[i]=Math.tanh((i/128-1)*7);rd.t0=AC.currentTime;return true}
/* --- vozes (síntese) --- */
function tn(t,n,d,ty,v,det){const o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.value=fq(n);if(det)o.detune.value=det;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(g);g.connect(rd.g);o.start(t);o.stop(t+d+.02)}
function vx(t,n,d,ty,v,fc){const o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type=ty;o.frequency.value=fq(n);f.type='lowpass';f.frequency.value=fc;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0008,t+Math.max(.03,d));o.connect(f);f.connect(g);g.connect(rd.g);o.start(t);o.stop(t+d+.03)}
function gtr(t,n,d,v){const g=AC.createGain(),f=AC.createBiquadFilter(),w=AC.createWaveShaper();w.curve=rd.cv;f.type='lowpass';f.frequency.value=2600;
 for(const dt of[-9,9]){const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=fq(n);o.detune.value=dt;o.connect(w);o.start(t);o.stop(t+d+.03)}
 w.connect(f);f.connect(g);g.connect(rd.g);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0008,t+d)}
function kk(t,v){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);g.gain.setValueAtTime(v||.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.28);o.connect(g);g.connect(rd.g);o.start(t);o.stop(t+.3)}
function k8(t,n,d,v){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(fq(n+12),t);o.frequency.exponentialRampToValueAtTime(fq(n),t+.06);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(rd.g);o.start(t);o.stop(t+d+.02)}
function nr(t,d,v,f){const s=AC.createBufferSource(),g=AC.createGain(),fl=AC.createBiquadFilter();s.buffer=rd.nb;fl.type='highpass';fl.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(fl);fl.connect(g);g.connect(rd.g);s.start(t);s.stop(t+d+.02)}
const snr=(t,v)=>{nr(t,.14,v,1800);tn(t,55,.1,'triangle',v*.5)},hat=(t,v,o)=>nr(t,o?.2:.04,v,7000),clap=(t,v)=>{nr(t,.09,v,1100);nr(t+.012,.09,v*.8,1100)},
 tom=(t,n,v)=>tn(t,n,.22,'sine',v),crash=(t,v)=>nr(t,1.1,v,3500),bu=(t,n,d,v)=>vx(t,n,d,'triangle',v,900),
 bb=n=>{while(n>47)n-=12;while(n<33)n+=12;return n};
/* --- teoria: acordes (semitons), progressões de 4 compassos, forma intro/verso/refrão/verso/refrão/final, melodia = [passo, semitons da tônica, duração] --- */
const CH={maj:[0,4,7],min:[0,3,7],m7:[0,3,7,10],d7:[0,4,7,10],M7:[0,4,7,11],h7:[0,3,6,10],d79:[0,4,7,10,13],p5:[0,7,12]};
const FRM=[[4,'cx'],[8,'dbc'],[8,'dbcl'],[4,'dbc'],[8,'dbcl'],[4,'cb']];   // c=acordes x=só pratos d=bateria b=baixo l=melodia
const P5=a=>a.map(r=>[r,'p5']);
const RS=[
 {n:'Rádio Rock 99.1',songs:[
  {n:'Estrada Sem Fim',style:'rock',bpm:126,spb:16,key:57,prog:P5([0,8,3,10]),mel:[      // Lá menor: i–VI–III–VII, pentatônica menor
   [[0,12,3],[4,15,3],[8,17,2],[10,15,2],[12,12,4]],[[0,12,3],[4,17,3],[8,15,2],[10,12,2],[12,8,4]],
   [[0,15,3],[4,12,3],[8,15,2],[10,19,2],[12,15,4]],[[0,10,3],[4,14,3],[8,12,2],[10,10,2],[12,7,4]]]},
  {n:'Fogo na Noite',style:'rock',bpm:168,spb:16,key:52,k:[0,6,8,10],prog:P5([0,10,8,10]),mel:[   // Mi eólio: i–VII–VI–VII, punk
   [[0,12,2],[2,15,2],[4,19,4],[8,17,2],[10,15,2],[12,12,4]],[[0,14,2],[2,17,2],[4,22,4],[8,19,2],[10,17,2],[12,14,4]],
   [[0,12,2],[2,15,2],[4,20,4],[8,15,2],[10,12,2],[12,8,4]],[[0,14,2],[2,17,2],[4,22,4],[8,19,2],[10,17,2],[12,19,4]]]},
  {n:'Maré Alta',style:'rock',clean:1,bpm:112,spb:16,key:50,prog:[[0,'maj'],[7,'maj'],[9,'min'],[5,'maj']],mel:[   // Ré maior: I–V–vi–IV
   [[0,16,4],[4,19,2],[6,21,2],[8,19,4],[12,16,4]],[[0,23,4],[4,21,2],[6,19,2],[8,23,4],[12,19,4]],
   [[0,21,4],[4,19,2],[6,16,2],[8,19,4],[12,21,4]],[[0,21,4],[4,24,2],[6,21,2],[8,17,4],[12,19,4]]]}]},
 {n:'Funk do Morro 88.8',songs:[
  {n:'Baile do Morro',style:'funk',bpm:130,spb:16,key:38,prog:[[0,'min'],[10,'maj'],[8,'maj'],[10,'maj']],mel:[   // Ré menor: i–VII–VI–VII
   [[0,31,2],[3,29,2],[6,27,2],[10,24,3],[13,27,3]],[[0,29,2],[3,26,2],[6,29,2],[10,31,3],[13,29,3]],
   [[0,27,2],[3,24,2],[6,27,2],[10,32,3],[13,29,3]],[[0,26,2],[3,29,2],[6,31,2],[10,29,3],[13,26,3]]]},
  {n:'Madrugada',style:'funk',bpm:128,spb:16,key:43,prog:[[0,'min'],[5,'min'],[7,'maj'],[0,'min']],mel:[   // Sol menor harmônico: i–iv–V–i
   [[0,31,3],[4,27,2],[6,24,2],[8,27,3],[12,31,4]],[[0,32,3],[4,29,2],[6,32,2],[8,36,3],[12,32,4]],
   [[0,35,3],[4,31,2],[6,35,2],[8,38,3],[12,35,2],[14,31,2]],[[0,31,6],[8,27,4],[12,24,4]]]},
  {n:'Pancadão',style:'funk',bpm:134,spb:16,key:45,prog:[[0,'min'],[8,'maj'],[3,'maj'],[10,'maj']],mel:[   // Lá menor: i–VI–III–VII
   [[0,31,2],[3,27,2],[6,24,2],[8,27,2],[11,31,2],[14,27,2]],[[0,24,2],[3,27,2],[6,32,2],[8,27,2],[11,24,2],[14,27,2]],
   [[0,27,2],[3,31,2],[6,34,2],[8,31,2],[11,27,2],[14,31,2]],[[0,29,2],[3,26,2],[6,22,2],[8,26,2],[11,29,2],[14,26,2]]]}]},
 {n:'Smooth Jazz 101',songs:[
  {n:'Café Noturno',style:'jazz',bpm:100,spb:12,key:48,prog:[[2,'m7'],[7,'d7'],[0,'M7'],[9,'m7']],mel:[   // Dó: ii–V–I–vi, swing
   [[0,24,2],[3,21,1],[4,17,2],[6,21,3],[9,14,3]],[[0,23,2],[3,26,1],[4,19,2],[6,23,3],[9,17,3]],
   [[0,16,6],[6,19,3],[9,24,3]],[[0,24,3],[3,21,3],[6,19,3],[9,16,3]]]},
  {n:'Lua de Mel',style:'bossa',bpm:120,spb:16,key:41,prog:[[0,'M7'],[9,'m7'],[2,'m7'],[7,'d7']],mel:[   // Fá: I–vi–ii–V, bossa nova
   [[0,28,3],[3,31,3],[6,35,2],[8,31,4],[12,28,4]],[[0,33,3],[3,31,3],[6,28,2],[8,24,4],[12,28,4]],
   [[0,29,3],[3,33,3],[6,36,2],[8,33,4],[12,29,4]],[[0,35,3],[3,31,3],[6,29,2],[8,26,4],[12,23,4]]]},
  {n:'Chuva na Janela',style:'jazz',soft:1,bpm:76,spb:12,key:45,prog:[[0,'m7'],[5,'m7'],[2,'h7'],[7,'d79']],mel:[   // Lá menor: i–iv–iiø–V7(b9)
   [[0,31,5],[6,27,3],[9,24,3]],[[0,29,5],[6,32,3],[9,36,3]],[[0,32,3],[3,29,3],[6,26,3],[9,24,3]],[[0,23,3],[3,26,3],[6,29,3],[9,32,3]]]}]}];
for(const s of RS)for(const g of s.songs){g.sd=60/g.bpm/(g.spb/4);g.bars=FRM.reduce((a,f)=>a+f[0],0);g.steps=g.bars*g.spb;g.dur=g.steps*g.sd}
function play(sg,t,gs){
 const spb=sg.spb,sd=sg.sd,bar=Math.floor(gs/spb),s=gs%spb,bt=sd*spb/4;
 let acc=0,F='',sb=0,sn=0;for(const[n,f]of FRM){if(bar<acc+n){F=f;sb=bar-acc;sn=n;break}acc+=n}
 const ch=sg.prog[bar%4],nx=sg.prog[(bar+1)%4],r=sg.key+ch[0],iv=CH[ch[1]],D=F.includes('d'),X=F.includes('x'),B=F.includes('b'),C=F.includes('c'),Lm=F.includes('l'),
  fill=D&&sb==sn-1&&s>=8&&bar<sg.bars-4,st=sg.style,soft=sg.soft?.6:1;
 const lead=(ty,v,fc)=>{for(const[p,sm,du]of sg.mel[bar%4])if(p==s)vx(t,sg.key+sm,du*sd*.95,ty,v,fc)};
 const comp=(steps,dur)=>{if(steps.includes(s))for(const pc of iv.slice(1)){let n=r+pc;while(n<55)n+=12;while(n>72)n-=12;tn(t,n,dur,'sine',.055*soft);tn(t,n+12,dur*.5,'sine',.015*soft)}};
 if(st=='rock'){
  if(D){if(fill){if(s>=8){if(s%2==0)tom(t,[52,50,47,45][(s-8)/2],.5);snr(t,.25)}else{if(s%8==0)kk(t,.8);if(s==4)snr(t,.5)}}
   else{if((sg.k||[0,8]).includes(s))kk(t,.8);if(s==4||s==12)snr(t,.5)}
   if(s==0&&sb==0&&bar>0)crash(t,.25);if(s%2==0&&!(fill&&s>=8))hat(t,.1,s==14&&Lm)}
  else if(X&&s%2==0)hat(t,.08);
  if(B&&s%2==0)vx(t,r-12,bt*.45,'sawtooth',.16,600);
  if(C){if(sg.clean&&!Lm){if(s%2==0)tn(t,r+12+iv[(s/2)%3],.25,'triangle',.09)}
   else if(!Lm){if(s%2==0){gtr(t,r,.14,.07);gtr(t,r+7,.14,.05)}}
   else if(s==0||s==8){for(const k of[0,7,12])gtr(t,r+k,bt*1.9,.06)}}
  if(Lm)lead('sawtooth',.06,3200)}
 else if(st=='funk'){
  if(D){if([0,3,8,11].includes(s))kk(t,.85);if(s==6||s==14)clap(t,.45);if(s==4||s==12)nr(t,.03,.1,5000);if(fill&&s>=8&&s%2==0)clap(t,.3);nr(t,.03,.05+(s%2?.03:0),8000)}
  else if(X&&s%2==0)nr(t,.03,.06,8000);
  if(B&&[0,3,8,11].includes(s))k8(t,r,(s==0||s==8)?bt*1.4:bt*.5,.55);
  if(C&&[0,6,10].includes(s))for(const k of iv)vx(t,r+12+k,bt*.4,'square',.035,1600);
  if(Lm){for(const[p,sm,du]of sg.mel[bar%4])if(p==s){vx(t,sg.key+sm,du*sd*.95,'triangle',.09,4000);vx(t,sg.key+sm+12,du*sd*.6,'sine',.03,5000)}}}
 else if(st=='jazz'){
  if(D||X){if([0,3,5,6,9,11].includes(s))nr(t,.18,(s%3==0?.07:.04)*soft,9000)}
  if(D){if(s==3||s==9)nr(t,.05,.05*soft,5000);if(s==0)kk(t,.14*soft);if(s==8&&bar%2)nr(t,.12,.04,2500)}
  if(B){const rt=bb(r);if(sg.soft){if(s==0)bu(t,rt,bt*1.8,.3);if(s==6)bu(t,rt+7,bt*1.8,.22)}
   else if(s%3==0){const n2=bb(sg.key+nx[0]),l3=rt+iv[2],nt=[rt,rt+iv[1],l3,l3>n2?n2+1:n2-1][s/3];bu(t,nt,bt*.9,.3)}}
  if(C)comp(sg.soft?[0]:[0,5],bt*(s==0?2.2:.8));
  if(Lm)lead('triangle',.1,2600)}
 else{ // bossa nova
  if(D||X){if(s%2==0)nr(t,.03,.05,8000)}
  if(D){if([0,3,6,10,12].includes(s))nr(t,.03,.1,3500);if([0,6,8,14].includes(s))kk(t,.2)}
  if(B&&[0,6,8,14].includes(s)){const rt=bb(r);bu(t,s==6||s==14?rt+7:rt,bt*.8,.3)}
  if(C)comp([0,3,6,10,12],bt*.8);
  if(Lm)lead('triangle',.1,2600)}}
const lbl=()=>rd.i<0?'📻 Rádio desligado':'📻 '+RS[rd.i].n+' — '+RS[rd.i].songs[rd.song].n;
/* cada rádio "toca" o tempo todo (relógio do áudio): ao sintonizar você entra no meio da música certa; acabou uma, começa a próxima, em loop */
function tune(){const st=RS[rd.i],now=AC.currentTime;let p=(now-rd.t0)%st.songs.reduce((a,s)=>a+s.dur,0);
 for(let k=0;k<st.songs.length;k++){const sg=st.songs[k];if(p<sg.dur){rd.song=k;rd.step=Math.floor(p/sg.sd);rd.next=now+.1;return}p-=sg.dur}
 rd.song=0;rd.step=0;rd.next=now+.1}
setInterval(()=>{if(!AC||rd.i<0||!rd.g)return;const st=RS[rd.i];if(rd.next<AC.currentTime-1)tune();
 while(rd.next<AC.currentTime+.18){const sg=st.songs[rd.song];play(sg,rd.next,rd.step);rd.next+=sg.sd;rd.step++;
  if(rd.step>=sg.steps){rd.step=0;rd.song=(rd.song+1)%st.songs.length;rd.t=3.5;radioEl.textContent=lbl()}}},40);
function radioNext(){if(!pl.car)return;if(!rinit()){msg('Clique em Jogar para ativar o áudio');return}rd.i=rd.i>=RS.length-1?-1:rd.i+1;if(rd.i>=0)tune();
 radioEl.textContent=lbl();rd.t=3.5}

/* ---------- menu de pausa: abas, mapa completo, missões, perfil, controles, opções ---------- */
const box=document.querySelector('#menu .box'),ul=box.querySelector('ul'),lab=box.querySelector('label'),go=$('go');
box.innerHTML='<h1>Nova Santos</h1><div id="tabs"></div><div id="pans"></div><div id="mfoot"></div>';
const pans={},tabs=$('tabs');let started=false,activeTab='map';
const mkPan=(id,name)=>{const t=document.createElement('button');t.className='tab';t.textContent=name;t.onclick=()=>show(id);tabs.appendChild(t);const p=document.createElement('div');p.className='pan';$('pans').appendChild(p);pans[id]={t,p}};
function show(id){activeTab=id;for(const k in pans){pans[k].t.classList.toggle('on',k==id);pans[k].p.classList.toggle('on',k==id)}refresh()}
mkPan('map','Mapa');mkPan('mis','Missões');mkPan('perfil','Perfil');mkPan('ctl','Controles');mkPan('opt','Opções');mkPan('info','I');pans.info.t.title='Informações';pans.info.t.setAttribute('aria-label','Informações');
pans.info.p.innerHTML='<h2 style="margin-bottom:10px">ATENÇÃO:</h2><div class="mrow">Esta obra é uma obra de ficção. Os eventos, locais, nomes e personagens retratados em Nova Santos são produtos da imaginação dos autores e colaboradores.</div>'+
 '<div class="mrow"><b>Natureza Fictícia:</b> Qualquer semelhança com a realidade, com pessoas reais (vivas ou mortas), com empresas, organizações, instituições, comunidades, estabelecimentos comerciais ou órgãos públicos existentes é mera coincidência.</div>'+
 '<div class="mrow"><b>Conteúdo Temático:</b> A narrativa contém representações de atos ilícitos, conflitos urbanos, criminalidade e situações de perigo estritamente para fins de entretenimento e expressão artística, não constituindo apologia, incentivo, instrução ou encorajamento a qualquer tipo de atividade criminosa, violência ou ilegalidade na vida real.</div>'+
 '<div class="mrow"><b>Direitos e Responsabilidades:</b> O uso de referências geográficas e culturais inspiradas no território brasileiro serve apenas para composição de cenário estético e narrativo, sem vínculo factual com a realidade institucional ou social dos locais mencionados.</div>';
pans.map.p.innerHTML='<canvas id="bigmap" width="900" height="760"></canvas><div class="mrow">Norte para cima. <b>Amarelo</b>: lojas · <b>Azul</b>: postos · <b>Azul claro M</b>: missão · <b>Vermelho</b>: evento · seta branca: você</div>';
ul.innerHTML='<li><b>WASD</b> andar · <b>Shift</b> correr · <b>Espaço</b> pular / freio de mão · <b>C</b> agachar</li><li><b>F</b> entrar/sair do veículo (mire num carro em movimento para abordar) · <b>Q</b> rádio · <b>G</b> garagem</li><li><b>T</b> trocar de personagem · <b>X</b> habilidade (Reflexo de Rua / Foco Turbo / Mente Estratégica)</li><li><b>Botão esq.</b> atirar (nas cenas: pular) · <b>Botão dir.</b> mirar · <b>R</b> recarregar · <b>1 2 3</b> armas</li><li><b>E</b> lojas, caixa, bomba de gasolina, ATM · <b>J</b> contrato de assalto</li><li><b>V</b> roupa · <b>P</b> primeira pessoa · <b>Roda</b> zoom · <b>M</b> som · <b>Esc</b> pausa</li><li>Entre no marcador azul para iniciar uma missão da história.</li>';
pans.ctl.p.appendChild(ul);
const rv=document.createElement('input');rv.type='range';rv.min=0;rv.max=100;rv.value=70;rv.oninput=()=>{rd.vol=rv.value/100};
const rs=document.createElement('button');rs.className='tab';rs.textContent='Apagar progresso da história';rs.onclick=()=>{if(confirm('Apagar progresso, XP e banco?')){localStorage.removeItem('ns2');SV.xp=SV.bank=SV.ch=0;SV.done=[];location.reload()}};
pans.opt.p.append(lab,document.createElement('br'),document.createTextNode('Volume do rádio '),rv,document.createElement('br'),document.createElement('br'),rs);
$('mfoot').appendChild(go);
SY.gunIcon=(g,x,y,k,col)=>{g.save();g.translate(x,y);g.scale(k,k);g.fillStyle=col||'#ffb02e';g.strokeStyle='#000';g.lineWidth=1.6;g.lineJoin='round';
 g.beginPath();g.moveTo(-9,-4);g.lineTo(8,-4);g.lineTo(8,0);g.lineTo(2,0);g.lineTo(2,1.5);g.lineTo(-.5,1.5);g.lineTo(-3,8);g.lineTo(-7,8);g.lineTo(-5,0);g.lineTo(-9,0);g.closePath();g.fill();g.stroke();g.restore()};
const X_=x=>(x+900)*.5,Z_=z=>(z+900)*.5;let base=null;
function drawBase(){const c=document.createElement('canvas');c.width=900;c.height=760;const g=c.getContext('2d'),r=(x0,z0,x1,z1,col)=>{g.fillStyle=col;g.fillRect(X_(x0),Z_(z0),(x1-x0)*.5,(z1-z0)*.5)};
 r(-900,-900,900,620,'#5b7a43');r(430,-600,900,100,'#d9b66f');r(-850,-800,-430,300,'#3f6b3a');g.fillStyle='#2a86b8';g.beginPath();g.arc(X_(-650),Z_(-300),65,0,6.3);g.fill();
 r(-900,395,900,465,'#e3d3a1');r(-900,455,900,620,'#2a86b8');r(-384,-384,384,384,'#2c2e33');r(100,390,340,440,'#6b6e72');
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){const cx=(i-N/2+.5)*B,cz=(j-N/2+.5)*B;r(cx-24,cz-24,cx+24,cz+24,park[i][j]?'#4c8a3c':'#8f9296')}
 for(const b of BL){if(b.k){if(!b.m&&b.z0>380)r(b.x0,b.z0,b.x1,b.z1,'#c0392b');continue}
  r(b.x0,b.z0,b.x1,b.z1,b.x1<-190&&b.z1<-190?['#e74c3c','#f39c12','#27ae60','#2980b9','#f1c40f'][Math.abs(b.x0*7|0)&3]:b.h>100?'#3d5a78':b.h>50?'#5d7a96':b.h>20?'#7f8c98':'#b4b0a6')}
 g.strokeStyle='#b23a34';g.lineWidth=4;g.beginPath();g.moveTo(X_(-384),Z_(0));g.lineTo(X_(384),Z_(0));g.stroke();
 g.font='bold 15px system-ui,sans-serif';g.textAlign='center';g.lineWidth=3;
 for(const[t,x,z]of[['Av. Paulista',0,-18],['Embu das Artes',160,-175],['Favela',-320,-390],['Porto',220,380],['Praia',-300,430],['Mar',0,520],['Floresta',-640,-80],['Lago',-650,-300],['Deserto',680,-250],['Serra',0,-780]]){g.strokeStyle='#000';g.strokeText(t,X_(x),Z_(z));g.fillStyle='#fff';g.fillText(t,X_(x),Z_(z))}
 return c}
function drawMap(){const cv=$('bigmap');if(!cv)return;if(!base)base=drawBase();const g=cv.getContext('2d');g.drawImage(base,0,0);
 const dot=(x,z,c,s)=>{g.fillStyle=c;g.fillRect(X_(x)-s,Z_(z)-s,s*2,s*2)};
 for(const s of NX.shops)dot(s.x,s.z,s.cd>0?'#777':'#ffd23f',4);for(const s of NX.stations)dot(s.x,s.z,'#4aa3ff',4);dot(-100,424,'#fff',4);for(const a of atmA)dot(a[0],a[2],'#7dff8a',2);
 for(const m of SY.markers){if(m.l=='gun'){SY.gunIcon(g,X_(m.x),Z_(m.z),1.25,m.c);continue}g.fillStyle=m.c;g.beginPath();g.arc(X_(m.x),Z_(m.z),8,0,6.3);g.fill();g.fillStyle='#000';g.font='bold 11px system-ui';g.textAlign='center';g.fillText(m.l,X_(m.x),Z_(m.z)+4)}
 g.save();g.translate(X_(pl.pos.x),Z_(pl.pos.z));g.rotate(PI-pl.ry);g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=2;g.beginPath();g.moveTo(0,-11);g.lineTo(8,9);g.lineTo(-8,9);g.closePath();g.fill();g.stroke();g.restore()}
function renderProfile(){const l=lvl(),a=120*(l-1)*(l-1),b=120*l*l,st=SV.st;
 pans.perfil.p.innerHTML='<div class="mrow"><b>'+(SY.PR?SY.PR.CHR[SY.PR.cur].n+', '+SY.PR.CHR[SY.PR.cur].age+' anos':'Protagonista')+'</b> · '+(SY.PR?SY.PR.CHR[SY.PR.cur].hab:'')+'<br>Nível <b>'+l+'</b> — '+SV.xp+' XP<div class="bar"><i style="width:'+Math.min(100,(SV.xp-a)/(b-a)*100)+'%"></i></div>Cada nível melhora o fôlego e a pontaria.</div>'+
 '<div class="mrow">Dinheiro: <b>R$'+S.money+'</b> · Banco: <b>R$'+SV.bank+'</b> (use os ATMs da Paulista com E)</div>'+
 (SV.acc&&SY.PR?'<div class="mrow">'+Object.keys(SV.acc).map(k=>'<b>'+SY.PR.CHR[k].n+'</b>: carteira R$'+Math.floor(SV.acc[k].m)+' · banco R$'+Math.floor(SV.acc[k].b)).join('<br>')+'</div>':'')+
 '<div class="mrow">Distância dirigida: '+st.km.toFixed(1)+' km · Tempo de jogo: '+Math.floor(st.min)+' min · Inimigos abatidos: '+st.kills+' · Assaltos: '+st.robs+' · Mortes: '+st.deaths+' · Multas: '+st.fines+'</div>'}
function refresh(){if(activeTab=='map')drawMap();else if(activeTab=='perfil')renderProfile();else if(activeTab=='mis'&&SY.renderMissions)SY.renderMissions(pans.mis.p)}
SY.refresh=refresh;show('map');
new MutationObserver(()=>{if($('menu').style.display!='none')refresh()}).observe($('menu'),{attributes:true,attributeFilter:['style']});
setInterval(()=>{if(run)started=true;go.textContent=started?'Continuar':'Jogar';if($('menu').style.display!='none'&&activeTab=='map')drawMap()},400);

/* ---------- laço dos sistemas ---------- */
let pcar=null,wasDead=false;
const _u=update;update=function(dt){
 if(!pl.car&&!pl.dead&&!K.ShiftLeft)pl.st=Math.min(100,pl.st+dt*(lvl()-1)*1.5);
 WP[1].sp=.008*Math.max(.3,1-.1*(lvl()-1));WP[2].sp=.03*Math.max(.3,1-.1*(lvl()-1));
 _u(dt);
 SV.st.min+=dt/60;if(pl.car)SV.st.km+=pl.car.vel.length()*dt/1000;if(pl.dead&&!wasDead)SV.st.deaths++;wasDead=pl.dead;
 for(const s of NX.shops){if(s.cd>235&&!s.xg){s.xg=1;SV.st.robs++;xp(80)}if(s.cd<=0)s.xg=0}
 const d=cl(Math.sin((TD-6)/12*PI)*4+.35,0,1),ev=.1+.9*d;bm.envMapIntensity=.45*ev;gl.envMapIntensity=ev;seaM.envMapIntensity=.9*ev;city.material.envMapIntensity=.9*ev*Math.min(1,(.92-city.material.roughness)*2.5);
 for(const c of cars)if(c.cm.envMapIntensity!=null)c.cm.envMapIntensity=.8*ev;
 if(pl.car!==pcar){pcar=pl.car;if(pcar){rd.t=3;radioEl.textContent=rd.i<0?'📻 Q: ligar rádio':lbl()}}
 rd.t=Math.max(0,rd.t-dt);radioEl.style.opacity=rd.t>0?1:0;if(rd.g)rd.g.gain.value=pl.car&&rd.i>=0&&!mute?.5*rd.vol:0;
 rcd-=dt;if(pl.car&&rcd<=0&&pl.car.vel.length()>55)for(const x of RX)if(Math.abs(pl.car.pos.x-x)<5&&Math.abs(pl.car.pos.z)<9){rcd=6;flash.style.opacity=.9;setTimeout(()=>flash.style.opacity=0,90);
  const f=Math.min(200,S.money);S.money-=f;SV.st.fines++;msg('Radar! Multa −R$'+f+' (limite 80 km/h)')}
 if(!pl.car&&!pl.dead)for(const a of atmA)if(Math.hypot(a[0]-pl.pos.x,a[2]-pl.pos.z)<2.8){$('pr').textContent='E — ATM: '+(S.money>0?'depositar':'sacar')}};
addEventListener('keydown',e=>{if(!run||e.repeat)return;if(e.code=='KeyQ')radioNext();if(e.code=='KeyE')atm()});
applyQ();
})();