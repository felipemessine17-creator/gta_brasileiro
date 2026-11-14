'use strict';
/* fps.js — opção "Mostrar FPS" na aba Opções. A escolha fica salva no navegador. Carregar depois do systems.js. */
(()=>{
const KEY='ns_fps';
let on=false;try{on=localStorage.getItem(KEY)==='1'}catch(e){}
const el=document.createElement('div');el.id='fps';
el.style.cssText='left:20px;top:44px;font-size:16px;color:#7dff8a;display:none';
document.getElementById('hud').appendChild(el);

let raf=0,frames=0,t0=0;
function tick(t){
 frames++;
 if(t-t0>=500){const f=Math.round(frames*1000/(t-t0));el.textContent=f+' FPS';el.style.color=f>=50?'#7dff8a':f>=30?'#ffd23f':'#ff5252';frames=0;t0=t}
 raf=requestAnimationFrame(tick)}
function set(v){
 on=v;try{localStorage.setItem(KEY,v?'1':'0')}catch(e){}
 el.style.display=v?'block':'none';
 cancelAnimationFrame(raf);
 if(v){frames=0;t0=performance.now();raf=requestAnimationFrame(tick)}}

const q=document.getElementById('q'),lab=q&&q.closest('label');
const row=document.createElement('label');row.style.cssText='display:block;margin-top:14px;cursor:pointer';
const cb=document.createElement('input');cb.type='checkbox';cb.checked=on;cb.style.marginRight='8px';
cb.onchange=()=>set(cb.checked);
row.append(cb,document.createTextNode('Mostrar FPS'));
if(lab)lab.after(row);else document.getElementById('pans').appendChild(row);
set(on);
})();