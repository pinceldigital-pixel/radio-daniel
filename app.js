// Estaciones (edita a gusto)
const STATIONS = [
  { number: "97.9", name: "NOW", url: "https://ipanel.instream.audio:7002/stream", color: "#ef4444" },
  { number: "100.7", name: "BLUE 100.7", url: "https://27693.live.streamtheworld.com/BLUE_FM_100_7AAC.aac", color: "#60a5fa" },
  { number: "102.3", name: "ASPEN 102.3", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/ASPEN.mp3", color: "#34d399" },
  { number: "104.9", name: "LN+ 104.9", url: "https://stream.radio.co/s2ed3bec0a/listen", color: "#f59e0b" }
];

let index = 0, playing = false, sleepTimer = null, currentColor = "#e5e7eb";

const audio = document.getElementById("audio"); audio.autoplay = true;
const numberEl = document.getElementById("number");
const nameEl = document.getElementById("name");
const btnPlay = document.getElementById("play");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const sleepBtn = document.getElementById("sleepBtn");
const air = document.querySelector(".air");
const airText = document.getElementById("airText");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");
const toast = document.getElementById("toast");


const canvas = document.getElementById("freqBg");
const ctx = canvas.getContext("2d");

// UI
function showToast(msg){ toast.textContent = msg; toast.style.display = "block"; clearTimeout(showToast._t); showToast._t = setTimeout(()=> toast.style.display="none", 1800); }

function setStation(i){
  index = (i + STATIONS.length) % STATIONS.length;
  const s = STATIONS[index];
  numberEl.textContent = s.number; nameEl.textContent = s.name;
  currentColor = s.color || '#e5e7eb'; document.documentElement.style.setProperty('--station-color', currentColor);
  loadStream(s.url);
}

let hls;
function loadStream(url){
  stop();
  if (window.Hls && Hls.isSupported() && /\.m3u8($|\?)/i.test(url)){
    hls = new Hls(); hls.loadSource(url); hls.attachMedia(audio);
  } else if (/\.m3u8($|\?)/i.test(url) && audio.canPlayType("application/vnd.apple.mpegurl")){
    audio.src = url;
  } else { audio.src = url; }
}

function play(){ audio.play().then(()=>{ playing = true; playIcon.style.display="none"; pauseIcon.style.display="block"; setAir(true); }).catch(()=>{  showToast("Tocar para reproducir"); }); }
function pause(){ try{ audio.pause(); }catch{} playing=false; playIcon.style.display="block"; pauseIcon.style.display="none"; setAir(false); }
function stop(){ pause(); try{ if(hls){ hls.destroy(); hls = null; } }catch{} audio.removeAttribute("src"); audio.load(); }

btnPlay.addEventListener("click", ()=> playing ? pause() : play());
btnPrev.addEventListener("click", ()=>{ setStation(index-1); if(playing) play(); });
btnNext.addEventListener("click", ()=>{ setStation(index+1); if(playing) play(); });

// Temporizador 30m
function toggleSleep(){ if(sleepTimer){ clearTimeout(sleepTimer); sleepTimer=null; sleepBtn.classList.remove("sleep-on"); showToast("Temporizador cancelado"); return; } sleepBtn.classList.add("sleep-on"); showToast("Apaga en 30 min"); sleepTimer=setTimeout(()=>{ pause(); sleepBtn.classList.remove("sleep-on"); showToast("Apagado"); }, 30*60*1000); }
sleepBtn.addEventListener("click", toggleSleep);

// ON AIR
function setAir(on){ if(on){ air.classList.add("on"); air.classList.remove("off"); airText.textContent="ON AIR"; } else { air.classList.remove("on"); air.classList.add("off"); airText.textContent="OFF AIR"; } }
setAir(false);

// Visualizador detrás del número
let audioCtx, analyser, source, dataArray;
function ensureAnalyser(){
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser(); analyser.fftSize = 1024;
  source = audioCtx.createMediaElementSource(audio); source.connect(analyser); analyser.connect(audioCtx.destination);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
}
ensureAnalyser();

function resize(){
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize", resize); new ResizeObserver(resize).observe(canvas); resize();

let t0 = performance.now();
function draw(){
  requestAnimationFrame(draw);
  ctx.clearRect(0,0,canvas.width, canvas.height);
  let hasData = false;
  if (analyser && dataArray){ analyser.getByteFrequencyData(dataArray); hasData = dataArray.some(v=>v>0); }
  const W = canvas.width, H = canvas.height, mid = H/2, time = (performance.now()-t0)/1000;
  ctx.globalCompositeOperation="lighter";
  for(let L=0; L<3; L++){
    const amp = H*(0.10+L*0.06), speed=0.6+L*0.25, offset=time*speed;
    ctx.lineWidth = 1.5 + L*0.6;
    ctx.strokeStyle = L===0? currentColor : (L===1? "rgba(229,231,235,.55)" : "rgba(229,231,235,.28)");
    ctx.beginPath();
    const points=180;
    for(let i=0;i<=points;i++){
      const x=(i/points)*W, base=Math.sin((i/points)*Math.PI*2+offset);
      let mod=1;
      if(hasData){ const bin = Math.min(dataArray.length-1, Math.floor((i/points)*dataArray.length)); mod = 0.8 + (dataArray[bin]/255)*1.6; }
      const y= mid + base*amp*mod;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation="source-over";
}
draw();

// Autoplay con fallback
async function attemptAutoplay(){ try{ await audio.play(); playing=true; playIcon.style.display="none"; pauseIcon.style.display="block"; setAir(true);  } catch{  } }





audio.addEventListener("playing", ()=> setAir(true));
audio.addEventListener("pause", ()=> setAir(false));
audio.addEventListener("error", ()=> showToast("Error de reproducción"));
let _autoplayRetried=false; audio.addEventListener("canplay", ()=>{ if(!_autoplayRetried && !playing){ _autoplayRetried=true; attemptAutoplay(); } });

// Inicio
setStation(0); attemptAutoplay();
