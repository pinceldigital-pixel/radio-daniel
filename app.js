
// Estaciones
const STATIONS = [
  { number: "97.9", name: "NOW", url: "https://ipanel.instream.audio:7002/stream" },
  { number: "100.7", name: "BLUE 100.7", url: "https://27693.live.streamtheworld.com/BLUE_FM_100_7AAC.aac" },
  { number: "102.3", name: "ASPEN 102.3", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/ASPEN.mp3" },
  { number: "104.9", name: "LN+ 104.9", url: "https://stream.radio.co/s2ed3bec0a/listen" }
];

let index = 0, playing = false;
const audio = document.getElementById('audio');
const numberEl = document.getElementById('number');
const nameEl = document.getElementById('name');
const btnPlay = document.getElementById('play');
const btnPrev = document.getElementById('prev');
const btnNext = document.getElementById('next');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const toast = document.getElementById('toast');

// Install button
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault(); deferredPrompt = e; installBtn.style.display='block';
});
installBtn.addEventListener('click', async ()=>{
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice; installBtn.style.display='none';
});

// Toast
function showToast(msg, ms=2200){ toast.textContent = msg; toast.style.display = 'block'; clearTimeout(showToast._id); showToast._id = setTimeout(()=>toast.style.display='none', ms); }

// Media Session handlers
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', ()=>{ if(!playing) togglePlay(); });
  navigator.mediaSession.setActionHandler('pause', ()=>{ if(playing) togglePlay(); });
  navigator.mediaSession.setActionHandler('previoustrack', ()=> prev());
  navigator.mediaSession.setActionHandler('nexttrack', ()=> next());
}

let ctx, analyser, dataArray;
function setupAnalyser(){
  try{
    if (ctx) return true;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser); analyser.connect(ctx.destination);
    dataArray = new Uint8Array(analyser.fftSize);
    return true;
  } catch(e){ console.warn('Analyser no disponible (CORS?)', e); return false; }
}

// HLS o directo
function setStation(i){
  index = (i + STATIONS.length) % STATIONS.length;
  const s = STATIONS[index];
  numberEl.textContent = s.number;
  nameEl.textContent = s.name;

  if (window._hls && window._hls.destroy) { try { window._hls.destroy(); } catch(e){} window._hls=null; }
  const isHls = s.url.toLowerCase().includes('.m3u8');
  if (isHls && window.Hls && window.Hls.isSupported()) {
    window._hls = new Hls({maxBufferLength: 10});
    window._hls.loadSource(s.url); window._hls.attachMedia(audio);
  } else {
    audio.src = s.url + (s.url.includes('?')?'&':'?') + 't=' + Date.now();
  }

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: s.name, artist: s.number, album: 'Radio PWA',
      artwork: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }]
    });
  }
}

// Controles
async function togglePlay(){
  if (!playing){
    try {
      const p = audio.play(); if (p) await p;
      playing = true; playIcon.style.display='none'; pauseIcon.style.display='block';
      const ok = setupAnalyser(); if (ok && ctx.state==='suspended') await ctx.resume();
    } catch(e){ showToast('Tocá Play nuevamente para iniciar'); }
  } else {
    audio.pause(); playing = false; playIcon.style.display='block'; pauseIcon.style.display='none';
  }
}
function next(){ setStation(index+1); if (playing) { try { audio.pause(); audio.load(); audio.play(); } catch(e){} } }
function prev(){ setStation(index-1); if (playing) { try { audio.pause(); audio.load(); audio.play(); } catch(e){} } }
btnPlay.addEventListener('click', togglePlay);
btnNext.addEventListener('click', next);
btnPrev.addEventListener('click', prev);


// Visualizador: barras (tipo ecualizador)
const canvas = document.getElementById('visualizer');
const ctx2d = canvas.getContext('2d');
let rafId;
function draw(){
  const w = canvas.width = canvas.clientWidth * devicePixelRatio;
  const h = canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx2d.clearRect(0,0,w,h);

  // Config de barras: número máximo + separación
  const MAX_BARS = 64;                // suficiente para un look limpio
  const gap = Math.max(2 * (devicePixelRatio||1), 2);
  const barWidth = Math.max((w - gap*(MAX_BARS-1)) / MAX_BARS, 3);

  // Si tenemos analyser y está reproduciendo, usamos el espectro; sino animación idle
  let useData = analyser && playing;
  let data = null;
  if (useData){
    // usar frecuencia para efecto 'barras'
    data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
  }

  for (let i=0;i<MAX_BARS;i++){
    // índice correspondiente en el array de frecuencias (log-like mapping)
    let idx = 0;
    if (useData){
      const p = i / (MAX_BARS-1);
      idx = Math.min(data.length-1, Math.floor((p**1.5) * (data.length-1))); // más detalle en graves
    }

    // Altura
    let value;
    if (useData){
      value = data[idx] / 255; // 0..1
    } else {
      // animación 'latido': barras suben/bajan suavemente
      const t = performance.now()/1000;
      value = (Math.sin(t*1.5 + i*0.45)*0.5 + 0.5) * (0.55 + 0.45*Math.sin(t*0.7));
    }

    const x = i*(barWidth+gap);
    const barH = Math.max(h*0.02, value * (h*0.9));
    const y = h - barH;

    // Gradiente simple por barra (arcoíris sutil)
    const hue = (i / MAX_BARS) * 360;
    ctx2d.fillStyle = `hsl(${hue} 90% 60%)`;
    ctx2d.fillRect(x, y, barWidth, barH);
    // brillo superior
    ctx2d.fillStyle = `hsl(${hue} 90% 75% / 0.35)`;
    ctx2d.fillRect(x, y, barWidth, Math.min(6*devicePixelRatio, barH));
  }

  rafId = requestAnimationFrame(draw);
}
rafId = requestAnimationFrame(draw);
document.addEventListener('visibilitychange', ()=>{ if (document.hidden){ cancelAnimationFrame(rafId);} else { rafId = requestAnimationFrame(draw);} });
// Init
setStation(0);

// Audio events -> toasts
audio.addEventListener('waiting', ()=>showToast('Conectando…'));
audio.addEventListener('playing', ()=>showToast('Reproduciendo'));
audio.addEventListener('stalled', ()=>showToast('Conexión lenta…'));
audio.addEventListener('error', ()=>showToast('Error de reproducción'));
