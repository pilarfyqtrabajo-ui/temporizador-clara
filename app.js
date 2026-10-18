'use strict';
(() => {
 const TOTAL=70*60*1000;
 const MULTA=5*60*1000;
 const CLAVE='clara-temporizador-v1';
 const $=id=>document.getElementById(id);
 const inicial=()=>({
   fase:'preparado',restante:TOTAL,
   limite:null,errores:0
 });
 let datos;
 try {
   const guardado=JSON.parse(localStorage.getItem(CLAVE));
   datos=guardado &&
     ['preparado','activo','pausa','exito','agotado'].includes(guardado.fase) &&
     Number.isFinite(guardado.restante) &&
     guardado.restante>=0 && guardado.restante<=TOTAL &&
     Number.isInteger(guardado.errores) && guardado.errores>=0 &&
     (guardado.fase!=='activo'||Number.isFinite(guardado.limite))
     ? guardado : inicial();
 } catch {datos=inicial()}

 function guardar(){
   try {localStorage.setItem(CLAVE,JSON.stringify(datos))}
   catch {$('mensaje').textContent='No se puede guardar el estado en este navegador.'}
 }
 function tiempo(){
   return datos.fase==='activo'
     ? Math.max(0,datos.limite-Date.now())
     : datos.restante;
 }
 function finalizar(fase,valor){
   datos.restante=valor;
   datos.limite=null;
   datos.fase=fase;
   guardar();
 }
 function actualizar(){
   if(datos.fase==='activo'&&tiempo()<=0)
     finalizar('agotado',0);
   const ms=tiempo();
   const segundos=Math.ceil(ms/1000);
   const m=Math.floor(segundos/60);
   const s=segundos%60;
   $('reloj').textContent=
     String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
   $('reloj').setAttribute('aria-label',
     m+' minutos y '+s+' segundos restantes');
   $('reloj').classList.toggle('alerta',ms<=MULTA);
   $('penalizaciones').textContent='Penalizaciones: '+datos.errores;
   const etiquetas={
     preparado:'PREPARADO PARA COMENZAR',
     activo:'INVESTIGACIÓN EN CURSO',
     pausa:'INVESTIGACIÓN EN PAUSA',
     exito:'INVESTIGACIÓN RESUELTA',
     agotado:'TIEMPO AGOTADO'
   };
   $('estado').textContent=etiquetas[datos.fase];
   const jugando=['activo','pausa'].includes(datos.fase);
   $('iniciar').disabled=datos.fase!=='preparado';
   $('pausar').disabled=!jugando;
   $('pausar').textContent=datos.fase==='pausa'?'Reanudar':'Pausar';
   $('codigo').disabled=!jugando;
   $('comprobar').disabled=!jugando;
   const terminado=['exito','agotado'].includes(datos.fase);
   $('partida').hidden=terminado;
   $('resultado').hidden=!terminado;
   if(datos.fase==='exito'){
     $('tituloResultado').textContent=
       '¡Enhorabuena! ¡Ese era el código correcto!';
     $('textoResultado').textContent=
       'Habéis resuelto el misterio. Pero vuestra investigación aún no ha terminado… Os espera el último enigma.';
   }
   if(datos.fase==='agotado'){
     $('tituloResultado').textContent=
       '¡Manos arriba! ¡Se acabó el tiempo!';
     $('textoResultado').textContent=
       'La investigación ha terminado.';
   }
 }
 $('iniciar').onclick=()=>{
   if(datos.fase!=='preparado')return;
   datos.limite=Date.now()+datos.restante;
   datos.fase='activo';
   guardar();actualizar();
 };
 $('pausar').onclick=()=>{
   actualizar();
   if(datos.fase==='activo'){
     datos.restante=tiempo();
     datos.limite=null;
     datos.fase='pausa';
   }else if(datos.fase==='pausa'){
     datos.limite=Date.now()+datos.restante;
     datos.fase='activo';
   }else return;
   guardar();actualizar();
 };
 function reiniciar(){
   if(!confirm('¿Reiniciar la partida? Se perderán el tiempo y las penalizaciones.'))return;
   datos=inicial();
   $('codigo').value='';
   $('mensaje').textContent='';
   guardar();actualizar();
 }
 $('reiniciar').onclick=reiniciar;
 $('nuevo').onclick=reiniciar;
 $('formulario').onsubmit=e=>{
   e.preventDefault();
   actualizar();
   if(!['activo','pausa'].includes(datos.fase))return;
   const codigo=$('codigo').value.trim()
     .replace(/\s+/gu,' ').toLocaleUpperCase('es');
   if(!codigo)return;
   if(codigo==='NO A LA GUERRA'){
     finalizar('exito',tiempo());
     $('mensaje').textContent='';
     actualizar();
     $('resultado').focus();
     return;
   }
   datos.errores++;
   const restante=Math.max(0,tiempo()-MULTA);
   if(restante===0){
     finalizar('agotado',0);
     $('mensaje').textContent='';
     actualizar();
     $('resultado').focus();
     return;
   }
   datos.restante=restante;
   if(datos.fase==='activo')
     datos.limite=Date.now()+restante;
   guardar();
   $('mensaje').textContent='Código incorrecto';
   $('codigo').value='';
   actualizar();
 };
 $('pantalla').onclick=async()=>{
   try {
     if(document.fullscreenElement)
       await document.exitFullscreen();
     else if(document.documentElement.requestFullscreen)
       await document.documentElement.requestFullscreen();
     else $('mensaje').textContent='Pantalla completa no disponible.';
   }catch{
     $('mensaje').textContent='No se pudo activar la pantalla completa.';
   }
 };
 document.addEventListener('visibilitychange',actualizar);
 window.addEventListener('pageshow',actualizar);
 window.addEventListener('storage',e=>{
   if(e.key!==CLAVE)return;
   try {
     const nuevo=JSON.parse(e.newValue);
     if(nuevo) {datos=nuevo;actualizar()}
   }catch{}
 });
 actualizar();
 setInterval(actualizar,250);
})();
