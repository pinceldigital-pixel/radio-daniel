
const STATIONS = [
  { number: "97.9", name: "NOW", url: "https://ipanel.instream.audio:7002/stream" },
  { number: "100.7", name: "BLUE 100.7", url: "https://27693.live.streamtheworld.com/BLUE_FM_100_7AAC.aac" },
  { number: "102.3", name: "ASPEN 102.3", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/ASPEN.mp3" },
  { number: "104.9", name: "LN+ 104.9", url: "https://stream.radio.co/s2ed3bec0a/listen" }
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
function showToast(msg,ms=2200){ toast.textContent=msg; toast.style.display='block'; clearTimeout(showToast._id); showToast._id=setTimeout(()=>toast.style.display='none',ms); }

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

// ---- Visualizador: SOLO línea ----
const canvas=document.getElementById('visualizer'); const ctx2d=canvas.getContext('2d');
let rafId;
function draw(){
  const w=canvas.width=canvas.clientWidth*devicePixelRatio;
  const h=canvas.height=canvas.clientHeight*devicePixelRatio;
  ctx2d.clearRect(0,0,w,h);
  const DPR=Math.min(devicePixelRatio||1,3), t=performance.now()/1000, haveData=analyser && playing;
  let timeData=null;
  if(haveData){ timeData=new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(timeData); }
  const baseline=h/2; const A=h*0.18*(0.75+0.25*Math.sin(t*0.8));
  ctx2d.lineWidth=2*DPR; const grad=ctx2d.createLinearGradient(0,0,w,0);
  grad.addColorStop(0,'#ff3e3e'); grad.addColorStop(0.17,'#ff8c00'); grad.addColorStop(0.34,'#ffd400');
  grad.addColorStop(0.51,'#3be477'); grad.addColorStop(0.68,'#32b1ff'); grad.addColorStop(0.85,'#8a5cff'); grad.addColorStop(1,'#ff3ef7');
  ctx2d.strokeStyle=grad; ctx2d.beginPath();
  const N=haveData? timeData.length : Math.floor(w/3);
  for(let i=0;i<N;i++){ const x= haveData ? (i/(N-1))*w : i*3;
    const y= haveData ? (timeData[i]/255)*h : (baseline+Math.sin(x*0.01+t)*A);
    if(i===0) ctx2d.moveTo(x,y); else ctx2d.lineTo(x,y);
  } ctx2d.stroke();
  rafId=requestAnimationFrame(draw);
}
rafId=requestAnimationFrame(draw);
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ cancelAnimationFrame(rafId);} else { rafId=requestAnimationFrame(draw);} });

// ---- Temporizador: botón power = 30 min por defecto ----
let timerId=null, timerEndsAt=0;
const lblTimerLeft=document.getElementById('timer-left');
function startSleep(minutes){
  clearSleep(); const ms=minutes*60*1000; timerEndsAt=Date.now()+ms;
  function tick(){ if(!timerEndsAt){ lblTimerLeft.textContent=''; return; }
    const left=Math.max(0,timerEndsAt-Date.now()); const m=Math.floor(left/60000), s=Math.floor((left%60000)/1000);
    lblTimerLeft.textContent=`${m}:${String(s).padStart(2,'0')}`;
    if(left<=0){ clearSleep(); stopPlayback(); showToast('Temporizador: apagado'); return; }
    timerId=setTimeout(tick,1000);
  } tick();
}
function clearSleep(){ if(timerId) clearTimeout(timerId); timerId=null; timerEndsAt=0; lblTimerLeft.textContent=''; }
function stopPlayback(){ try{ audio.pause(); }catch(e){} playing=false; playIcon.style.display='block'; pauseIcon.style.display='none'; }
btnPower.addEventListener('click', ()=>{ startSleep(30); showToast('Apagado en 30 min'); });

// Init
setStation(0);
audio.addEventListener('waiting', ()=>showToast('Conectando…'));
audio.addEventListener('playing', ()=>showToast('Reproduciendo'));
audio.addEventListener('stalled', ()=>showToast('Conexión lenta…'));
audio.addEventListener('error', ()=>showToast('Error de reproducción'));
