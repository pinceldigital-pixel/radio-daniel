
const STATIONS = [
  { number: "97.9", name: "NOW", url: "https://ipanel.instream.audio:7002/stream", color: "#ef4444" },      // rojo
  { number: "100.7", name: "BLUE 100.7", url: "https://27693.live.streamtheworld.com/BLUE_FM_100_7AAC.aac", color: "#60a5fa" }, // azul
  { number: "102.3", name: "ASPEN 102.3", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/ASPEN.mp3", color: "#34d399" }, // verde
  { number: "104.9", name: "LN+ 104.9", url: "https://stream.radio.co/s2ed3bec0a/listen", color: "#f59e0b" } // ámbar
];

let index=0, playing=false;
const audio=document.getElementById('audio');
const numberEl=document.getElementById('number');
const nameEl=document.getElementById('name');
const btnPlay=document.getElementById('play');
const btnPrev=document.getElementById('prev');
const btnNext=document.getElementById('next');
const btnPower=document.getElementById('power');
const playIcon=document.getElementById('playIcon');
const pauseIcon=document.getElementById('pauseIcon');
const toast=document.getElementById('toast');

// Install PWA
let deferredPrompt=null; const installBtn=document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt',(e)=>{ e.preventDefault(); deferredPrompt=e; installBtn.style.display='block'; });
installBtn.addEventListener('click', async ()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; installBtn.style.display='none'; });

// Toast
function showToast(msg,ms=1800){ toast.textContent=msg; toast.style.display='block'; clearTimeout(showToast._id); showToast._id=setTimeout(()=>toast.style.display='none',ms); }

// Media Session
if('mediaSession' in navigator){
  navigator.mediaSession.setActionHandler('play', ()=>{ if(!playing) togglePlay(); });
  navigator.mediaSession.setActionHandler('pause', ()=>{ if(playing) togglePlay(); });
  navigator.mediaSession.setActionHandler('previoustrack', ()=> prev());
  navigator.mediaSession.setActionHandler('nexttrack', ()=> next());
}

// Audio analyser
let ctx, analyser;
function setupAnalyser(){
  try{
    if(ctx) return true;
    ctx = new (window.AudioContext||window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser(); analyser.fftSize=512;
    source.connect(analyser); analyser.connect(ctx.destination);
    return true;
  }catch(e){ console.warn('Analyser no dispo', e); return false; }
}

// Station management
function setStation(i){
  index = (i+STATIONS.length)%STATIONS.length;
  const s=STATIONS[index]; numberEl.textContent=s.number; nameEl.textContent=s.name;
  if(window._hls && window._hls.destroy){ try{ window._hls.destroy(); }catch(e){} window._hls=null; }
  const isHls = s.url.toLowerCase().includes('.m3u8');
  if(isHls && window.Hls && window.Hls.isSupported()){
    window._hls = new Hls({maxBufferLength:10}); window._hls.loadSource(s.url); window._hls.attachMedia(audio);
  } else {
    audio.src = s.url + (s.url.includes('?')?'&':'?') + 't=' + Date.now();
  }
  if('mediaSession' in navigator){
    navigator.mediaSession.metadata=new MediaMetadata({title:s.name, artist:s.number, album:'Radio PWA Pro'});
  }
}

async function togglePlay(){
  if(!playing){
    try{ const p=audio.play(); if(p) await p; playing=true; playIcon.style.display='none'; pauseIcon.style.display='block';
      const ok=setupAnalyser(); if(ok && ctx.state==='suspended') await ctx.resume();
    }catch(e){ showToast('Tocá Play de nuevo'); }
  } else { audio.pause(); playing=false; playIcon.style.display='block'; pauseIcon.style.display='none'; }
}
function next(){ setStation(index+1); if(playing){ try{ audio.pause(); audio.load(); audio.play(); }catch(e){} } }
function prev(){ setStation(index-1); if(playing){ try{ audio.pause(); audio.load(); audio.play(); }catch(e){} } }
btnPlay.addEventListener('click', togglePlay); btnNext.addEventListener('click', next); btnPrev.addEventListener('click', prev);

// ---- Visualizador: línea "neón" multicapa + respiración suave cuando no hay audio ----
const canvas=document.getElementById('visualizer'); const ctx2d=canvas.getContext('2d');
let rafId;
function draw(){
  const w=canvas.width=canvas.clientWidth*devicePixelRatio;
  const h=canvas.height=canvas.clientHeight*devicePixelRatio;
  ctx2d.clearRect(0,0,w,h);
  const DPR=Math.min(devicePixelRatio||1,3), t=performance.now()/1000, haveData=analyser && playing;
  let timeData=null; if(haveData){ timeData=new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(timeData); }
  const baseline=h/2;

  // respiración suave (0..1) — lenta
  const breath = (Math.sin(t*0.9)*0.5+0.5);  // lento y suave
  const layers=[
    {blur:16*DPR, width:3*DPR, alpha:.30, shadow:'#6ae3ff'},
    {blur:8*DPR,  width:2*DPR, alpha:.65, shadow:'#9f6bff'},
    {blur:0,      width:1.6*DPR, alpha:1, shadow:'#ffffff'}
  ];
  const grad=ctx2d.createLinearGradient(0,0,w,0);
  grad.addColorStop(0,'#ff3e3e'); grad.addColorStop(0.17,'#ff8c00'); grad.addColorStop(0.34,'#ffd400');
  grad.addColorStop(0.51,'#3be477'); grad.addColorStop(0.68,'#32b1ff'); grad.addColorStop(0.85,'#8a5cff'); grad.addColorStop(1,'#ff3ef7');

  for(const L of layers){
    ctx2d.save();
    ctx2d.globalCompositeOperation='lighter';
    ctx2d.strokeStyle=grad; ctx2d.lineWidth=L.width; ctx2d.shadowBlur=L.blur; ctx2d.shadowColor=L.shadow; ctx2d.globalAlpha=L.alpha;
    ctx2d.beginPath();
    const N=haveData? timeData.length : Math.floor(w/4);
    for(let i=0;i<N;i++){
      const x= haveData ? (i/(N-1))*w : i*4;
      let mod;
      if(haveData){
        mod = ((timeData[i]/255)-0.5)*2; // -1..1
      } else {
        // respiración: onda senoidal muy amortiguada
        mod = Math.sin(x*0.008 + t) * (0.18 * breath);  // amplitud pequeña
      }
      const y = baseline + mod * (h*0.18);
      if(i===0) ctx2d.moveTo(x,y); else ctx2d.lineTo(x,y);
    }
    ctx2d.stroke();
    ctx2d.restore();
  }
  rafId=requestAnimationFrame(draw);
}
rafId=requestAnimationFrame(draw);
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ cancelAnimationFrame(rafId);} else { rafId=requestAnimationFrame(draw);} });

// ---- Temporizador 30m con botón power (sin números visibles) ----
let timerId=null;
function startSleep30(){
  clearSleep(); btnPower.classList.add('power-on');
  const end = Date.now() + 30*60*1000;
  function tick(){ if(Date.now()>=end){ clearSleep(); stopPlayback(); showToast('Apagado'); return; } timerId=setTimeout(tick,1000); }
  tick();
}
function clearSleep(){ if(timerId) clearTimeout(timerId); timerId=null; btnPower.classList.remove('power-on'); }
function stopPlayback(){ try{ audio.pause(); }catch(e){} playing=false; playIcon.style.display='block'; pauseIcon.style.display='none'; }
btnPower.addEventListener('click', ()=>{ if(timerId){ clearSleep(); showToast('Timer cancelado'); } else { startSleep30(); showToast('Apaga en 30 min'); } });

// Init
setStation(0);
audio.addEventListener('waiting', ()=>showToast('Conectando…'));
audio.addEventListener('playing', ()=>showToast('Reproduciendo'));
audio.addEventListener('stalled', ()=>showToast('Conexión lenta…'));
audio.addEventListener('error', ()=>showToast('Error de reproducción'));

// Desbloqueo en primer gesto (móvil)
function unlockAndPlay(){
  try{ if (audioCtx && audioCtx.state === "suspended") audioCtx.resume(); }catch(e){}
  play();
  tapToStart.style.display = "none";
  window.removeEventListener("pointerdown", unlockAndPlay);
  window.removeEventListener("keydown", unlockAndPlay);
}
tapToStart?.addEventListener("click", unlockAndPlay);
window.addEventListener("pointerdown", unlockAndPlay, { once:false });
window.addEventListener("keydown", unlockAndPlay, { once:false });

document.addEventListener("DOMContentLoaded", ()=>{
  attemptAutoplay?.();
});

let _autoplayRetried = false;
audio.addEventListener("canplay", ()=>{
  if (!_autoplayRetried && !playing){
    _autoplayRetried = true;
    attemptAutoplay?.();
  }
},{once:false});
