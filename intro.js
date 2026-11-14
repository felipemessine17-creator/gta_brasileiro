'use strict';
/* intro.js — tela inicial: aviso legal (o mesmo da aba "I") + escolha de modo (História / Livre).
   Carregar POR ÚLTIMO (depois do story.js). Define window.GAME_MODE = 'story' | 'free'.
   No modo livre o story.js não inicia missões (ver storyTick) e a aba Missões some do menu. */
(()=>{
const SY=window.SY;
const st=document.createElement('style');
st.textContent=`
#intro{position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:#0b0c10;overflow:auto;padding:16px}
#intro .ibox{width:min(820px,95vw);background:#14161c;border-radius:14px;padding:28px 36px}
#intro h1{margin-bottom:14px}
#intro h2{margin:6px 0 12px}
#intro .ibtn{display:flex;justify-content:flex-end;margin-top:18px}
#intro .ibtn button{margin:0;padding:10px 26px;font-size:16px}
#intro .irow{display:flex;gap:22px;justify-content:center;flex-wrap:wrap;margin-top:14px}
#intro .card{width:320px;padding:22px}
#intro .card h3{font-size:22px;margin-bottom:6px}
#intro .card small{font-size:14px;line-height:1.5}
`;
document.head.appendChild(st);

// reaproveita o texto da aba "I" do menu (fica só em um lugar); se não achar, usa o essencial
const src=[...document.querySelectorAll('#pans .pan')].find(p=>p.innerHTML.includes('Natureza Fict'));
const legal=src?src.innerHTML:'<h2>ATENÇÃO:</h2><div class="mrow">Esta obra é uma obra de ficção. Qualquer semelhança com a realidade é mera coincidência.</div>';

const root=document.createElement('div');root.id='intro';
root.innerHTML='<div class="ibox" id="i1"><h1>Nova Santos</h1>'+legal+'<div class="ibtn"><button id="icont">Continuar</button></div></div>'+
 '<div class="ibox" id="i2" style="display:none"><h1>Escolha o modo</h1><div class="irow">'+
 '<div class="card" id="mst" tabindex="0" role="button"><h3>Modo História</h3><small>Prólogo com Henry, Theo e Felipe: missões, cenas, diálogos e escolhas. Seu progresso é salvo.</small></div>'+
 '<div class="card" id="mfr" tabindex="0" role="button"><h3>Modo Livre</h3><small>Sem missões e sem história. Só você, a cidade e o caos: roube carros, fuja da polícia, faça assaltos e explore.</small></div>'+
 '</div></div>';
document.body.appendChild(root);

const $i=id=>document.getElementById(id);
$i('icont').onclick=()=>{$i('i1').style.display='none';$i('i2').style.display='block';$i('mst').focus()};
$i('icont').focus();

function pick(mode){
 window.GAME_MODE=mode;
 if(mode=='free'){
  // some a aba Missões e explica no painel (caso apareça)
  for(const t of document.querySelectorAll('#tabs .tab'))if(t.textContent=='Missões')t.style.display='none';
  SY.renderMissions=pan=>{pan.innerHTML='<div class="mrow"><b>Modo Livre</b> — sem missões. Para jogar a história, recarregue a página e escolha o Modo História.</div>'};
  SY.obj=null;
 }
 root.remove();
}
const bind=(id,m)=>{const e=$i(id);e.onclick=()=>pick(m);e.onkeydown=ev=>{if(ev.code=='Enter'||ev.code=='Space'){ev.preventDefault();pick(m)}}};
bind('mst','story');bind('mfr','free');
})();