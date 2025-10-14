
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
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const toast = document.getElementById('toast');

// Toast
function showToast(msg, ms=2000){ toast.textContent = msg; toast.style.display = 'block'; clearTimeout(showToast._id); showToast._id = setTimeout(()=>toast.style.display='none', ms); }

// Audio analyser
let ctx, analyser, dataArray;
function setupAnalyser(){
  try{
    if (ctx) return true;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    dataArray = new Uint8Array(analyser.fftSize);
    return true;
  }catch(e){ return false; }
}

// HLS / direct
function setStation(i){
  index = (i + STATIONS.length) % STATIONS.length;
  const s = STATIONS[index];
  numberEl.textContent = s.number;
  nameEl.textContent = s.name;

  if (window._hls && window._hls.destroy) { try { window._hls.destroy(); } catch(e){} window._hls=null; }
  const isHls = s.url.toLowerCase().includes('.m3u8');
  if (isHls && window.Hls && window.Hls.isSupported()){
    window._hls = new Hls({maxBufferLength:10});
    window._hls.loadSource(s.url);
    window._hls.attachMedia(audio);
    window._hls.on(Hls.Events.ERROR, (e,d)=>console.warn('HLS error', d));
  } else {
    audio.src = s.url + (s.url.includes('?')?'&':'?') + 't=' + Date.now();
  }

  if ('mediaSession' in navigator){
    navigator.mediaSession.metadata = new MediaMetadata({title:s.name, artist:s.number, album:'Radio PWA'});
  }
}

async function togglePlay(){
  if (!playing){
    try{
      const p = audio.play(); if (p) await p;
      playing = true;
      const ok = setupAnalyser(); if (ok && ctx.state==='suspended') await ctx.resume();
      playIcon.style.display='none'; pauseIcon.style.display='block';
    }catch(e){ showToast('No se pudo reproducir. Tocá de nuevo.'); }
  } else {
    audio.pause(); playing=false; playIcon.style.display='block'; pauseIcon.style.display='none';
  }
}
function next(){ setStation(index+1); if (playing) { try{ audio.pause(); audio.load(); audio.play(); }catch(e){} } }
function prev(){ setStation(index-1); if (playing) { try{ audio.pause(); audio.load(); audio.play(); }catch(e){} } }

playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', next);
prevBtn.addEventListener('click', prev);

// Init
setStation(0);

// Dots visualization
const canvas = document.getElementById('wave');
const ctx2d = canvas.getContext('2d');
let rafId;
function draw(){
  const w = canvas.width = canvas.clientWidth * devicePixelRatio;
  const h = canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx2d.clearRect(0,0,w,h);

  const DPR = Math.min(devicePixelRatio||1,3);
  const MAX_DOTS = 140;
  const DOT_PX = Math.max(5*DPR,4);
  const baseline = h/2;
  const t = performance.now()/1000;

  let array = null;
  if (analyser && playing){
    array = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(array);
  }

  const step = Math.max(1, Math.floor(w / MAX_DOTS));
  for (let x=0; x<w; x+=step){
    let y;
    if (array){
      const idx = Math.floor((x/w)*(array.length-1));
      y = (array[idx]/255)*h;
    } else {
      const A = h*0.18*(0.75+0.25*Math.sin(t*0.8));
      const freq = 2*Math.PI/(w*0.6);
      y = baseline + Math.sin(x*freq + t)*A;
    }
    const hue = (x/w)*360, light = 55 + 10*Math.sin(t*2 + x*0.01);
    ctx2d.fillStyle = `hsl(${hue} 100% ${light}%)`;
    ctx2d.beginPath(); ctx2d.arc(x,y,DOT_PX/2,0,Math.PI*2); ctx2d.fill();
  }
  rafId = requestAnimationFrame(draw);
}
rafId = requestAnimationFrame(draw);

// battery/perf
document.addEventListener('visibilitychange', ()=>{
  if (document.hidden){ cancelAnimationFrame(rafId); }
  else { rafId = requestAnimationFrame(draw); }
});
