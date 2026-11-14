'use strict';
/* zonas.js — que tipo de carro aparece em cada região do mapa.
   Carregar DEPOIS do favela.js e ANTES do story.js (o story.js inicia a população no fim).
   - Favela: carros simples e velhos (fusca, saveiro, sedan, pickup, moto, van)
   - Av. Paulista: muito esportivo/luxo (sport, porsche), SUV, táxi
   - Zona industrial / Porto: caminhão, pickup, van
   - Praia / Embu: carros de passeio, fusca, van, SUV
   - Resto da cidade: sedan e SUV; esportivo é raro
   Os pesos são relativos (não precisam somar 100). Mexa à vontade. */
(()=>{
const NX=window.NX;
const W={
 fav:{fusca:24,saveiro:24,sedan:20,pickup:8,van:8,bike:14,suv:2},
 pau:{sport:26,porsche:14,suv:14,sedan:14,taxi:10,bus:6,bike:6,van:2,pickup:2},
 ind:{truck:22,pickup:20,sedan:18,van:14,suv:10,saveiro:6,bus:4,bike:4,sport:1},
 port:{truck:32,pickup:18,sedan:14,van:12,suv:8,bike:4,saveiro:4,bus:2},
 praia:{suv:20,sedan:20,pickup:12,fusca:10,saveiro:10,van:10,bike:10,sport:3,porsche:1},
 embu:{sedan:20,suv:18,van:16,fusca:12,saveiro:12,pickup:10,bike:8,sport:2},
 cid:{sedan:32,suv:22,pickup:12,taxi:6,van:6,bike:6,bus:5,truck:4,saveiro:3,sport:3,fusca:2,porsche:1}};
const COL={
 pau:[0x111111,0x222222,0xeeeeee,0xb22222,0x2f6fb5,0xc9cdd2,0xe0a82e],
 fav:[0xb5651d,0x9c4a32,0x7a7a7a,0xcfc9bd,0x3f6f5b,0x8a8f3a,0x5a3a2a,0xa9a39a]};
function zone(x,z){
 if(NX.favR&&NX.favR(x,z))return'fav';
 if(Math.abs(z)<48)return'pau';                                   // Av. Paulista (z=0) e arredores
 if(x>250&&z>-260&&z<70)return'ind';
 if(z>360&&x>90)return'port';
 if(z>340)return'praia';
 if(Math.hypot(x-160,z+175)<130)return'embu';
 return'cid'}
function pick(z){const o=W[z]||W.cid;let t=0;for(const k in o)t+=o[k];let r=R2()*t;for(const k in o){r-=o[k];if(r<=0)return k}return'sedan'}
function col(t,z){if(t=='taxi'||t=='ambulance'||t=='police')return null;
 if(t=='bus')return pk([0x2e9f6b,0xc0392b,0x2f6fb5,0xe0a82e]);return pk(COL[z]||CC)}
function mk(t,z,x,y,yaw){const o={},c=col(t,z);if(c!=null)o.col=c;return mkCar(t,x,y,yaw,o)}
window.ZN={zone,pick,col,W};

traffic=function(){const l=lane(3.2);if(Math.hypot(l.x-pl.pos.x,l.z-pl.pos.z)<30)return;
 const z=zone(l.x,l.z),t=pick(z),c=mk(t,z,l.x,l.z,Math.atan2(l.d[0],l.d[1]));
 c.ai={pos:c.pos,dir:l.d,sp:0,tv:CT[t].mx*rr(.22,.3),pd:0};pd0(c.ai)};
parked=function(){const l=lane(7),z=zone(l.x,l.z);mk(pick(z),z,l.x,l.z,Math.atan2(l.d[0],l.d[1]))};
})();