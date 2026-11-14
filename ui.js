'use strict';
/* ui.js — ESC em camadas. Carregar logo DEPOIS do script.js (antes de armas.js, lojaarmas.js, game.js, phone.js).
   Regra: se tem algo aberto (celular, roda de armas, Armaria, troca de personagem...), o ESC fecha SÓ isso e o jogo continua.
   O menu de pausa só abre com ESC quando não há nada aberto.
   Como usar em outro painel novo:  UI.add(()=>estaAberto, ()=>fechar(), prioridade);   (prioridade maior fecha primeiro)
   Obs.: com o mouse travado o navegador "come" o ESC e só avisa que o cursor foi solto; por isso o tratamento é no pointerlockchange. */
(()=>{
const L=[];let closedAt=-1e9;
const any=()=>L.some(x=>x.o());
function closeTop(){const t=L.filter(x=>x.o()).sort((a,b)=>b.p-a.p)[0];if(!t)return false;t.c();closedAt=performance.now();return true}
window.UI={add(o,c,p){L.push({o,c,p:p||0})},any,closeTop};
const relock=()=>{try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}};
const paused=()=>$('menu').style.display!='none';

/* cursor foi solto (ESC com mouse travado): se tinha algo aberto, fecha e NÃO pausa */
document.addEventListener('pointerlockchange',e=>{
 if(document.pointerLockElement)return;
 if(!document.hasFocus())return;                                   // alt-tab / perdeu foco: pausa normal
 if(!(any()||performance.now()-closedAt<500))return;               // nada aberto: segue para o menu de pausa
 e.stopImmediatePropagation();
 closeTop();
 run=true;$('menu').style.display='none';                          // continua jogando (sem o menu)
 relock()},{capture:true});

/* ESC com o cursor livre (ou navegador que entrega a tecla): fecha o de cima; se não há nada, abre a pausa */
addEventListener('keydown',e=>{
 if(e.code!='Escape'||e.repeat)return;
 if(any()){e.preventDefault();e.stopImmediatePropagation();closeTop();if(!document.pointerLockElement&&!paused())run=true;return}
 if(run&&!document.pointerLockElement&&!paused()&&!(performance.now()-closedAt<500)){run=false;$('menu').style.display='grid';for(const k in K)K[k]=false;MB.l=MB.r=0}
},true);

/* depois de fechar algo e o cursor ficar livre, o clique volta a travar o mouse */
addEventListener('mousedown',e=>{if(e.button==0&&run&&!document.pointerLockElement&&!any()&&!paused())relock()},true);
})();