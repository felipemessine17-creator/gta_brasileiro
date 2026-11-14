'use strict';
/* fisica.js — física de carro com "peso". Carregar POR ÚLTIMO (depois do phone.js / lojas.js).
   Substitui a drive() do script.js (só afeta carros dirigidos: jogador, polícia, carros de missão com c.drv; o trânsito da IA não muda).
   O que o jogo fazia: a velocidade era "puxada" devagar para a direção do carro (k = gr*dt) -> parecia gelo/sabão.
   Técnicas usadas (as mesmas de jogos de corrida arcade):
   1) PNEU COM LIMITE DE ADERÊNCIA: a velocidade lateral (derrapagem) é cortada por uma força de pneu F = -G·mu·tanh(slip·5).
      Em curva normal o carro "agarra" no chão; se passar do limite (G·mu) ele escorrega de verdade e perde velocidade (raspa).
   2) MODELO DE BICICLETA: giro = v/entre-eixos · tan(esterço); esterço diminui com a velocidade; giro máximo limitado pela aderência.
   3) CURVA DE TORQUE + CÂMBIO de 5 marchas: arranca forte, perde força com o giro, "corte" curto a cada troca, afina no final.
   4) LIMITE DE TRAÇÃO: se a força passa do que o pneu aguenta (arrancada com carro forte, chão molhado) o pneu patina e solta fumaça.
   5) PEDAIS SUAVES (acelerador/freio sobem e descem em fração de segundo) + arrasto do ar, resistência de rolagem e freio-motor.
   6) FREIO DE MÃO: tira aderência (fica ~1/3), aumenta o giro: dá para derrapar de propósito.
   Ajustes rápidos (em FIS): acel (força), brake (freio), grip (aderência geral), steer (esterço), spin (giro máx. relativo). */
(()=>{
const FIS={acel:.27,brake:.2,grip:1,lat:1.8,steer:.7,spin:1.05,gears:5};   // lat = aderência lateral "arcade" (maior = curva mais fácil)
const G=9.81;
const MU={sport:1.25,porsche:1.3,sedan:1,suv:.95,pickup:.9,truck:.8,bus:.75,bike:1.1,fusca:.9,saveiro:.95,van:.85,taxi:1,police:1.15,ambulance:.85};
const kOf=T=>{if(T._k)return T._k;for(const k in CT)if(CT[k]===T)return T._k=k;return T._k='sedan'};

drive=function(c,thr,sT,hb,dt){
 const T=c.T;if(!T)return;
 dt=Math.min(dt,.05);
 if(T._g0==null)T._g0=T.gr||1;
 if(c.dead){thr=0;sT=0;hb=true}
 const v0=c.vel.x*Math.sin(c.yaw)+c.vel.z*Math.cos(c.yaw),
  burn=pl.car===c&&!c.dead&&K.KeyW&&K.KeyS&&Math.abs(v0)<T.mx*.4;   // acelerar + frear juntos = cantar pneu (burnout)
 if(burn){thr=1;hb=false}
 const mx=T.mx,mu=(MU[kOf(T)]||1)*FIS.grip*cl((T.gr||1)/T._g0,.55,1);   // chuva reduz T.gr (extras.js) -> reduz aderência
 const A=Math.min(T.ac*FIS.acel,13),BR=Math.min(15,T.br*FIS.brake);

 /* ---- esterço e giro (usa a velocidade do quadro anterior) ---- */
 let fx=Math.sin(c.yaw),fz=Math.cos(c.yaw),vf=c.vel.x*fx+c.vel.z*fz;
 c.st+=(sT-c.st)*Math.min(1,dt*(sT?5.5/(1+Math.abs(vf)/25):9));
 const delta=c.st*FIS.steer/(1+vf*vf/600),Lw=T.L*.6;
 let w=vf/Lw*Math.tan(delta);
 const wmax=G*mu*FIS.lat*FIS.spin*(hb?1.8:burn?2.4:1)/Math.pow(Math.max(Math.abs(vf),3),.8);   // expoente .8: curva fecha melhor em velocidade média
 if((hb&&Math.abs(vf)>6)||(burn&&Math.abs(vf)>1.5))w*=burn?2.2:1.6;                                    // freio de mão: traseira solta, carro gira
 w=cl(w,-wmax,wmax);
 c.yv=(c.yv||0)+(w-(c.yv||0))*Math.min(1,dt*10);                  // inércia de giro
 c.yaw+=c.yv*dt;

 /* ---- decompõe a velocidade no referencial do carro (já com o novo yaw) ---- */
 fx=Math.sin(c.yaw);fz=Math.cos(c.yaw);const rx=fz,rz=-fx;
 vf=c.vel.x*fx+c.vel.z*fz;let vl=c.vel.x*rx+c.vel.z*rz;

 /* ---- longitudinal: pedais, câmbio, tração, freio, arrasto ---- */
 const tg=Math.max(thr,0),brk=thr<0&&vf>.6?1:0,rev=thr<0&&vf<=.6;
 c.th=(c.th||0)+(tg-(c.th||0))*Math.min(1,dt*(tg>(c.th||0)?6:10));
 c.bk=(c.bk||0)+(brk-(c.bk||0))*Math.min(1,dt*12);
 const f=cl(Math.max(vf,0)/mx,0,1),nG=FIS.gears,gp=f*nG*.98,g=Math.min(nG-1,Math.floor(gp)),rp=cl(gp-g,0,1);
 if(c.gear==null)c.gear=0;if(g>c.gear)c.sh=.14;c.gear=g;c.sh=Math.max(0,(c.sh||0)-dt);
 const tq=(1.25-.4*rp)*(1+.08*(nG-1-g))*(c.sh>0?.2:1),taper=1-Math.pow(f,2.4),tr=mu*G*.95;
 let a=0,spin=false;
 if(rev)a=-A*.5*(1-cl(-vf/(mx*.15),0,1));
 else if(c.th>.01){a=A*tq*taper*c.th;if(a>tr){a=tr*.9;spin=true}}
 if(burn){a=a*.3-Math.sign(vf)*Math.min(Math.abs(vf)*2.5,5);spin=true}   // freio segura a frente, pneu de trás patina
 const sg=Math.sign(vf);
 a-=sg*(.25+.0008*vf*vf);                                          // rolagem + arrasto do ar
 if(thr===0&&!hb)a-=sg*1.6*(vf>1?1:Math.abs(vf));                  // freio-motor
 a-=sg*BR*c.bk*(.55+.45*cl(Math.abs(vf)/12,0,1));                  // freio (mais firme em velocidade)
 if(hb)a-=sg*5;
 let nvf=vf+a*dt;
 if(sg&&Math.sign(nvf)!==sg&&(c.bk>.05||thr===0||hb))nvf=0;        // freio/arrasto nunca passam do zero
 nvf=cl(nvf,-mx*.15,mx*1.02);

 /* ---- lateral: força de pneu com limite de aderência ---- */
 const Gl=G*mu*FIS.lat*(hb?.32:burn?.3:1)*(spin&&!burn?.8:1),s=vl/Math.max(3,Math.abs(nvf)),F=-Gl*Math.tanh(s*5);
 let nvl=vl+F*dt;if(vl*nvl<0)nvl=0;
 nvl*=1-Math.min(1,dt*2);
 nvf-=Math.sign(nvf)*Math.abs(F)*Math.abs(s)*dt*.4;                // raspar o pneu tira velocidade
 if(Math.sign(nvf)!==Math.sign(vf)&&Math.abs(vf)<.3&&!rev&&!c.th)nvf=0;

 c.vel.x=fx*nvf+rx*nvl;c.vel.z=fz*nvf+rz*nvl;
 c.pos.x+=c.vel.x*dt;c.pos.z+=c.vel.z*dt;
 c.vl=nvl;c.rpm=burn?.97:Math.abs(nvf)<.5&&!c.th?.2:.25+.7*rp*.85+.1*(c.th||0);

 /* fumaça: derrapando, patinando ou travando o pneu */
 if(c.vel.length()>6&&(Math.abs(nvl)>3||(c.bk>.6&&vf>15&&R2()<.5))&&R2()<.6||spin&&R2()<.6)
  emit(c.pos.clone().add(V3(rr(-1,1),.3,rr(-1,1))),V3(0,.6,0),0xcccccc,1.2,.8,2,.3);
 if(burn){                                                         // fumaça grossa nas rodas de trás + chiado
  for(const q of[-1,1])emit(c.pos.clone().add(V3(-fx*T.L*.35+rx*q*T.W*.4,.2,-fz*T.L*.35+rz*q*T.W*.4)),V3(rr(-.6,.6),1,rr(-.6,.6)),0xdddddd,1.8,1.1,2,.3);
  c.sq=(c.sq||0)-dt;if(c.sq<=0){c.sq=.18;try{nz(.03,.08,160)}catch(e){}}}};

/* som do motor acompanha o giro/câmbio (o updCar original usa só a velocidade) */
const _uc=updCar;
updCar=function(c,dt){_uc(c,dt);
 if(pl.car===c&&typeof eng!='undefined'&&eng&&c.rpm!=null)eng.frequency.value=40+c.rpm*130};
window.FIS=FIS;
})();