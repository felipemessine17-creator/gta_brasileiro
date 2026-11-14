'use strict';
/* transito2.js — anti-engarrafamento. Carregar POR ÚLTIMO (depois do transito.js e do zonas.js).
   - Carro novo / carro estacionado que nasce em cima de outro carro é descartado (era uma das causas de "carro dentro de carro").
   - Detector de TRAVAMENTO: carro de IA parado há mais de STUCK s (fora sinal vermelho) é considerado preso.
       · O mais antigo de cada grupo "fantasma" por GHOST s: anda devagar atravessando quem o bloqueia, e a fila destrava.
       · Preso há muito tempo e longe do jogador (> FAR m): some.
       · Congestionamento geral (muitos presos): quem está longe do jogador some.
   Ajustes: STUCK, GHOST, FAR (abaixo). */
(()=>{
const STUCK=14,GHOST=5,FAR=60;
const red=a=>{const dx=a.dir[0];return(dx?phase!=0:phase==0)&&a.pd<-7&&a.pd>-18};
const over=c=>{for(const o of cars)if(o!==c&&!o.del&&Math.hypot(o.pos.x-c.pos.x,o.pos.z-c.pos.z)<c.T.L/2+o.T.L/2+2.5)return true;return false};
const _t=traffic;traffic=function(){const n=cars.length;_t();if(cars.length>n){const c=cars[cars.length-1];if(over(c))c.del=true}};
const _p=parked;parked=function(){const n=cars.length;_p();if(cars.length>n){const c=cars[cars.length-1];if(over(c))c.del=true}};
/* carro "fantasma" anda devagar mesmo com carro na frente (nunca fura sinal vermelho) */
const _n=nav;nav=function(e,off,dt,tv){const c=e.c;if(c&&c.gh>0&&!e.fv&&!e.pp&&!red(e))tv=Math.max(tv,Math.min(e.tv||6,6)*.5);return _n(e,off,dt,tv)};
let acc=0;const _u=update;
update=function(dt){_u(dt);
 for(const c of cars){const a=c.ai;if(!a||c.del)continue;if(c.gh>0)c.gh-=dt;
  if(a.sp<.4&&!red(a)&&!a.fv)c.jt=(c.jt||0)+dt;else c.jt=0}
 acc+=dt;if(acc<1)return;acc=0;
 const ai=cars.filter(c=>c.ai&&!c.del&&!c.ai.fv),st=ai.filter(c=>c.jt>STUCK).sort((a,b)=>b.jt-a.jt),dP=c=>Math.hypot(c.pos.x-pl.pos.x,c.pos.z-pl.pos.z);
 for(const c of st){
  if(c.jt>STUCK*2.5&&dP(c)>FAR){c.del=true;continue}
  if(c.gh>0)continue;
  if(!st.some(o=>o!==c&&o.gh>0&&Math.hypot(o.pos.x-c.pos.x,o.pos.z-c.pos.z)<16))c.gh=GHOST}
 const jam=ai.filter(c=>c.jt>8);
 if(jam.length>=8&&jam.length>ai.length*.4)for(const c of jam)if(dP(c)>FAR*.8)c.del=true};
})();