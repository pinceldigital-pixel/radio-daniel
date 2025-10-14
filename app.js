
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
let ctx, analyser, dataArray;
function setupAnalyser(){
  try{
    if(ctx) return true;
    ctx = new (window.AudioContext||window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser(); analyser.fftSize=512;
    source.connect(analyser); analyser.connect(ctx.destination);
    dataArray = new Uint8Array(analyser.fftSize); return true;
  }catch(e){ console.warn('Analyser no dispo', e); return false; }
}

// Station management (HLS or direct)
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

// ---- Visualizador con modos ----
const canvas=document.getElementById('visualizer'); const ctx2d=canvas.getContext('2d');
let rafId; let VIZ_MODE='bars';

function draw(){
  const w=canvas.width=canvas.clientWidth*devicePixelRatio;
  const h=canvas.height=canvas.clientHeight*devicePixelRatio;
  ctx2d.clearRect(0,0,w,h);
  const DPR=Math.min(devicePixelRatio||1,3), t=performance.now()/1000, haveData=analyser && playing;
  let timeData=null, freqData=null;
  if(haveData){ timeData=new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(timeData);
               freqData=new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(freqData); }
  if(VIZ_MODE==='bars'){
    const MAX_BARS=64, gap=Math.max(2*DPR,2); const barWidth=Math.max((w-gap*(MAX_BARS-1))/MAX_BARS,3);
    for(let i=0;i<MAX_BARS;i++){ const p=i/(MAX_BARS-1); let value;
      if(haveData){ const idx=Math.min(freqData.length-1, Math.floor((p**1.5)*(freqData.length-1))); value=freqData[idx]/255; }
      else { value=(Math.sin(t*1.5+i*0.45)*0.5+0.5)*(0.55+0.45*Math.sin(t*0.7)); }
      const x=i*(barWidth+gap), barH=Math.max(h*0.02, value*(h*0.9)), y=h-barH; const hue=p*360;
      ctx2d.fillStyle=`hsl(${hue} 90% 60%)`; ctx2d.fillRect(x,y,barWidth,barH);
      ctx2d.fillStyle=`hsl(${hue} 90% 75% / 0.35)`; ctx2d.fillRect(x,y,barWidth,Math.min(6*DPR,barH));
    }
  } else if (VIZ_MODE==='dots'){
    const MAX_DOTS=140, step=Math.max(1,Math.floor(w/MAX_DOTS)), DOT_PX=Math.max(5*DPR,4), baseline=h/2;
    for(let x=0;x<w;x+=step){ let y;
      if(haveData){ const idx=Math.floor((x/w)*(timeData.length-1)); y=(timeData[idx]/255)*h; }
      else { const A=h*0.18*(0.75+0.25*Math.sin(t*0.8)); const f=2*Math.PI/(w*0.6); y=baseline+Math.sin(x*f+t)*A; }
      const hue=(x/w)*360, light=55+10*Math.sin(t*2 + x*0.01);
      ctx2d.fillStyle=`hsl(${hue} 100% ${light}%)`; ctx2d.beginPath(); ctx2d.arc(x,y,DOT_PX/2,0,Math.PI*2); ctx2d.fill();
    }
  } else {
    // line
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
  }
  rafId=requestAnimationFrame(draw);
}
rafId=requestAnimationFrame(draw);
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ cancelAnimationFrame(rafId);} else { rafId=requestAnimationFrame(draw);} });

// ---- Timer ----
let timerId=null, timerEndsAt=0;
const lblTimerLeft=document.getElementById('timer-left');
const btnCancelTimer=document.getElementById('timer-cancel');
function startSleep(minutes){
  clearSleep(); const ms=minutes*60*1000; timerEndsAt=Date.now()+ms; btnCancelTimer.style.display='inline-block';
  function tick(){ if(!timerEndsAt){ lblTimerLeft.textContent=''; return; }
    const left=Math.max(0,timerEndsAt-Date.now()); const m=Math.floor(left/60000), s=Math.floor((left%60000)/1000);
    lblTimerLeft.textContent=`· ${m}:${String(s).padStart(2,'0')}`;
    if(left<=0){ clearSleep(); stopPlayback(); showToast('Temporizador: apagado'); return; }
    timerId=setTimeout(tick,1000);
  } tick();
}
function clearSleep(){ if(timerId) clearTimeout(timerId); timerId=null; timerEndsAt=0; lblTimerLeft.textContent=''; btnCancelTimer.style.display='none'; }
function stopPlayback(){ try{ audio.pause(); }catch(e){} playing=false; playIcon.style.display='block'; pauseIcon.style.display='none'; }
document.getElementById('timer-30').addEventListener('click',()=>startSleep(30));
document.getElementById('timer-60').addEventListener('click',()=>startSleep(60));
document.getElementById('timer-90').addEventListener('click',()=>startSleep(90));
btnCancelTimer.addEventListener('click', clearSleep);

// ---- Viz buttons ----
document.getElementById('viz-bars').addEventListener('click',()=>{ VIZ_MODE='bars'; showToast('Vista: Barras'); });
document.getElementById('viz-dots').addEventListener('click',()=>{ VIZ_MODE='dots'; showToast('Vista: Puntos'); });
document.getElementById('viz-line').addEventListener('click',()=>{ VIZ_MODE='line'; showToast('Vista: Línea'); });

// Init
setStation(0);
// Audio events
audio.addEventListener('waiting', ()=>showToast('Conectando…'));
audio.addEventListener('playing', ()=>showToast('Reproduciendo'));
audio.addEventListener('stalled', ()=>showToast('Conexión lenta…'));
audio.addEventListener('error', ()=>showToast('Error de reproducción'));
