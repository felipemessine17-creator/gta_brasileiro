'use strict';
/* transito.js — trânsito de verdade. Carregar POR ÚLTIMO (depois do lojaarmas.js).
   Antes: carros da IA só olhavam o carro da frente; cruzavam o cruzamento ao mesmo tempo, entravam sem ter saída e travavam tudo.
   Agora:
   - CRUZAMENTO COM RESERVA: o carro só entra se (1) o sinal está verde, (2) nenhum carro reservou um caminho que cruza o dele
     (perpendicular, ou contramão quando um dos dois vai virar), (3) tem espaço livre na pista de saída ("não bloqueie o cruzamento").
     Cada um espera a sua vez; forma fila, mas a fila anda.
   - Quebra-travamento: quem esperou mais de 14 s entra mesmo assim (evita deadlock em anel de quarteirões).
   - Carros param para pedestres na frente.
   - PEDESTRES: esperam no meio-fio, só atravessam quando o sinal dos carros fecha (e nenhum carro está chegando),
     atravessam mais rápido, não atravessam a rua em diagonal no meio do cruzamento (seguem em frente) e não se empilham uns nos outros.
   Ajustes: HOLD_MAX (s), PED_WINDOW (s depois que o sinal dos carros fecha em que o pedestre ainda pode sair). */
(()=>{
const CAR_ACC=3.2,HOLD_MAX=14,PED_WINDOW=4,CROSS_SPEED=2.2;
const CL=new Map();                                   // chave "ix,iz" -> reservas [{a:ai,key,nx,nz,t,in}]
const roadAt=(x,z)=>Math.abs(x-Math.round(x/B)*B)<8||Math.abs(z-Math.round(z/B)*B)<8;
const pdOf=q=>{const dx=q.dir[0],a=dx?q.pos.x:q.pos.z,m=Math.round(a/B);return Math.abs(m)>N/2?null:(a-m*B)*(dx||q.dir[1])};
const _nav0=nav;                                      // nav do favela.js (peds/carros da favela)
const same=(u,v)=>u[0]==v[0]&&u[1]==v[1];
const claimsAt=k=>{let a=CL.get(k);if(!a){a=[];CL.set(k,a)}return a};
function conflict(d,n,od,on){
 const dot=d[0]*od[0]+d[1]*od[1];
 if(dot>0)return false;                               // mesmo sentido: só fila
 if(dot==0)return true;                               // perpendicular: sempre cruza
 return !same(d,n||d)||!same(od,on||od)}              // contramão: só cruza se um dos dois vira

function nextDir(e,ix,iz){
 const dx=e.dir[0],dz=e.dir[1],o=[[dx,dz],[dz,-dx],[-dz,dx]].filter(v=>Math.abs(ix+v[0])<=N/2&&Math.abs(iz+v[1])<=N/2);
 return(o.some(v=>same(v,e.dir))&&R2()<.6)?[dx,dz]:o.length?pk(o):[-dx,-dz]}

function ctlCar(e,tv,dt){
 const c=e.c;if(!c||e.fv||c.del)return tv;
 const dx=e.dir[0],dz=e.dir[1],p=e.pos,L=c.T.L;let pedHit=0;
 for(const q of peds){if(q.dead)continue;                                  // pedestre na frente: para
  const rx=q.pos.x-p.x,rz=q.pos.z-p.z,ah=rx*dx+rz*dz;
  if(ah>0&&ah<L/2+7&&Math.abs(rx*dz-rz*dx)<2.2){tv=Math.min(tv,ah<L/2+3?0:2.5);
   if(q.sp<.2){e.pw=(e.pw||0)+dt;if(e.pw>1.5)q.free=8}pedHit=1}}                // pedestre parado travando a rua: manda ele andar
 if(!pedHit)e.pw=0;
 const a=dx?p.x:p.z,m=Math.round(a/B);if(Math.abs(m)>N/2)return tv;
 const pd=(a-m*B)*(dx||dz),ix=Math.round(p.x/B),iz=Math.round(p.z/B),key=ix+','+iz;
 if(!(pd>-18&&pd<-6.5)){e.hold=0;return tv}                                // só decide na aproximação
 const arr=claimsAt(key);
 if(arr.some(q=>q.a===e))return tv;                                        // já tem a vez
 if(!e.nd||e.ndk!==key){e.nd=nextDir(e,ix,iz);e.ndk=key}
 if(dx?phase!=0:phase==0)return tv;                                        // sinal vermelho: o updCar já segura o carro
 const nx=ix*B,nz=iz*B;let blocked=false;
 for(const q of arr)if(conflict(e.dir,e.nd,q.a.dir,q.a.nd)){blocked=true;break}
 if(!blocked)for(const o of cars){                                         // jogador/polícia/qualquer carro sem IA se movendo no cruzamento
  if(o===c||o.ai)continue;
  if(Math.abs(o.pos.x-nx)<8&&Math.abs(o.pos.z-nz)<8&&(pl.car===o||o.vel.length()>.8)){blocked=true;break}}
 if(!blocked&&!pl.car&&!pl.dead&&Math.abs(pl.pos.x-nx)<6&&Math.abs(pl.pos.z-nz)<6)blocked=true;
 if(!blocked){                                                             // "não bloqueie o cruzamento": precisa caber na saída
  const ex=e.nd[0],ez=e.nd[1];
  for(const o of cars){if(o===c)continue;
   const rx=o.pos.x-nx,rz=o.pos.z-nz,al=rx*ex+rz*ez,lat=ex?Math.abs(rz-ex*3.2):Math.abs(rx+ez*3.2);
   if(al>5&&al<L+11&&lat<2.6&&o.vel.length()<2.5){blocked=true;break}}}
 if(blocked){e.hold=(e.hold||0)+dt;if(e.hold<HOLD_MAX)return 0}
 e.hold=0;arr.push({a:e,key,nx,nz,t:0,in:false});return tv}

function ctlPed(e,tv,dt){
 if(tv>2)return tv;                                                        // fugindo (pânico): ignora regras
 if(e.free>0){e.free-=dt;return Math.max(tv,1.4)}                          // destravando: anda sem esperar ninguém
 const dx=e.dir[0],dz=e.dir[1],p=e.pos;
 for(const q of peds){if(q===e||q.dead||q.dir[0]!=dx||q.dir[1]!=dz)continue; // não empilhar em quem anda na frente
  const rx=q.pos.x-p.x,rz=q.pos.z-p.z,ah=rx*dx+rz*dz;
  if(ah>0&&ah<1&&Math.abs(rx*dz-rz*dx)<.7){tv=Math.min(tv,.3);break}}
 const a=dx?p.x:p.z,m=Math.round(a/B);if(Math.abs(m)>N/2)return tv;
 const pd=(a-m*B)*(dx||dz);
 if(pd>-9.2&&pd<-7){                                                       // meio-fio: espera o sinal dos carros fechar
  let ok=(dx?phase==0:phase==1)&&clock%10<PED_WINDOW;
  if(ok){for(const c of cars){if(c.vel.length()<1.2)continue;
   const alongX=Math.abs(c.vel.x)>Math.abs(c.vel.z);
   if(alongX===!!dx)continue;                                              // só importa o tráfego que cruza o caminho do pedestre
   const lat=dx?c.pos.x-m*B:c.pos.z-m*B,al=dx?c.pos.z-p.z:c.pos.x-p.x;
   if(Math.abs(lat)<9&&Math.abs(al)<16){ok=false;break}}}
  if(!ok)return 0}
 else if(pd>=-7&&pd<7.5)tv=Math.max(tv,CROSS_SPEED);                       // atravessando: anda mais rápido
 return tv}

/* nav com as regras acima. Carros escolhem a saída antes de entrar (e.nd); pedestres seguem em frente nos cruzamentos. */
nav=function(e,off,dt,tv){
 if(e.fv)return _nav0(e,off,dt,tv);
 const dx=e.dir[0],dz=e.dir[1],p=e.pos;
 tv=e.pp?ctlPed(e,tv,dt):ctlCar(e,tv,dt);
 {const dv=(tv-e.sp)*Math.min(1,dt*3);e.sp+=e.pp?dv:Math.max(-14*dt,Math.min(CAR_ACC*dt,dv))}   // carro acelera devagar (nada de arrancada brusca) e freia mais forte
 p.x+=dx*e.sp*dt;p.z+=dz*e.sp*dt;
 const k=Math.min(1,dt*4);
 if(dx)p.z+=(Math.round(p.z/B)*B+dx*off-p.z)*k;else p.x+=(Math.round(p.x/B)*B-dz*off-p.x)*k;
 const a=dx?p.x:p.z,m=Math.round(a/B),d=(a-m*B)*(dx||dz);
 if(e.pd<0&&d>=0&&Math.abs(m)<=N/2){
  const ix=Math.round(p.x/B),iz=Math.round(p.z/B),
   o=[[dx,dz],[dz,-dx],[-dz,dx]].filter(v=>Math.abs(ix+v[0])<=N/2&&Math.abs(iz+v[1])<=N/2);
  let nd;
  if(e.pp)nd=o.some(v=>v[0]==dx&&v[1]==dz)?[dx,dz]:[-dx,-dz];
  else if(e.nd&&o.some(v=>same(v,e.nd)))nd=e.nd;
  else nd=(o.some(v=>v[0]==dx&&v[1]==dz)&&R2()<.6)?[dx,dz]:o.length?pk(o):[-dx,-dz];
  e.dir=nd;e.nd=null;e.pd=1;return}
 e.pd=d};

/* manutenção: liga a IA ao carro, limpa reservas vencidas, some com carro batido longe do jogador */
const _u=update;
update=function(dt){
 for(const c of cars){if(c.ai){if(c.ai.c!==c)c.ai.c=c;c.wasAI=1}
  else if(c.wasAI&&!c.keep&&!c.mission&&!c.cop&&pl.car!==c&&!c.del){
   c.stT=(c.stT||0)+dt;if(c.stT>25&&Math.hypot(c.pos.x-pl.pos.x,c.pos.z-pl.pos.z)>70)c.del=true}}
 for(const q of peds){if(q.dead||q.fv){q.stk=0;continue}
  if(q.beh&&q.beh!=='walk'){q.stk=0;if(roadAt(q.pos.x,q.pos.z)){q.beh='walk';pd0(q);q.sp=1.4}continue}   // parado no meio da rua: volta a andar
  const pd=pdOf(q);
  if(pd!=null&&pd>-6.5&&pd<8){if(q.sp<.25){q.rs=(q.rs||0)+dt;if(q.rs>1.2){q.free=6;q.rs=0}}else q.rs=0}else q.rs=0;   // parado na rua: anda
  if(q.sp<.15)q.stk=(q.stk||0)+dt;else q.stk=0;if(q.stk>25){q.free=8;q.stk=0}}   // pedestre parado demais: destrava
 for(const[k,arr]of CL){
  for(let i=arr.length-1;i>=0;i--){const q=arr[i],c=q.a.c;q.t+=dt;
   const dist=c?Math.hypot(c.pos.x-q.nx,c.pos.z-q.nz):1e9;
   if(dist<8.5)q.in=true;
   if(!c||c.del||c.ai!==q.a||q.t>25||(q.in&&dist>10))arr.splice(i,1)}
  if(!arr.length)CL.delete(k)}
 _u(dt)};
})();