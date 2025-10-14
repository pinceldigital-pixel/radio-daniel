// --- Lista de estaciones (con color de onda) ---
const STATIONS = [
  { number: "97.9",  name: "NOW",         url: "https://ipanel.instream.audio:7002/stream",                                                        color: "#ef4444" }, // rojo
  { number: "100.7", name: "BLUE 100.7",  url: "https://27693.live.streamtheworld.com/BLUE_FM_100_7AAC.aac",                                       color: "#60a5fa" }, // azul
  { number: "102.3", name: "ASPEN 102.3", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/ASPEN.mp3",                      color: "#34d399" }, // verde
  { number: "104.9", name: "LN+ 104.9",   url: "https://stream.radio.co/s2ed3bec0a/listen",                                                         color: "#f59e0b" }  // ámbar
];

let index = 0;
let playing = false;
let sleepTimer = null;
let currentColor = "#e5e7eb";

const audio    = document.getElementById("audio");
const numberEl = document.getElementById("number");
const nameEl   = document.getElementById("name");
const btnPlay  = document.getElementById("play");
const btnPrev  = document.getElementById("prev");
const btnNext  = document.getElementById("next");
const sleepBtn = document.getElementById("sleepBtn");
const air      = document.querySelector(".air");
const airText  = document.getElementById("airText");
const playIcon = document.getElementById("playIcon");
const pauseIcon= document.getElementById("pauseIcon");
const toast    = document.getElementById("toast");

// ---------- Instalación PWA ----------
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault(); deferredPrompt = e;
  const btn = document.getElementById("installBtn");
  btn.style.display = "block";
  btn.onclick = async ()=>{ deferredPrompt.prompt(); btn.style.display="none"; };
});

// ---------- UI ----------
function showToast(msg){
  toast.textContent = msg;
  toast.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toast.style.display="none", 1800);
}

function setStation(i){
  index = (i + STATIONS.length) % STATIONS.length;
  const s = STATIONS[index];
  numberEl.textContent = s.number;
  nameEl.textContent   = s.name;
  currentColor         = s.color || "#e5e7eb";
  // Cargar stream
  loadStream(s.url);
}

function loadStream(url){
  stop();
  if (window.Hls && Hls.isSupported() && /\.m3u8($|\?)/i.test(url)){
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(audio);
  } else if (/\.m3u8($|\?)/i.test(url) && audio.canPlayType("application/vnd.apple.mpegurl")){
    audio.src = url;
  } else {
    audio.src = url;
  }
}

function play(){
  audio.play().then(()=>{
    playing = true;
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
    setAir(true);
  }).catch(()=> showToast("No se pudo reproducir"));
}
function pause(){
  try{ audio.pause(); }catch(e){}
  playing = false;
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
  setAir(false);
}
function stop(){
  try{ audio.pause(); }catch(e){}
  audio.removeAttribute("src");
  audio.load();
  playing = false;
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
}

// ---------- Botones ----------
btnPlay.addEventListener("click", ()=> playing ? pause() : play());
btnPrev.addEventListener("click", ()=>{ setStation(index-1); if(playing) play(); else showToast(`↤ ${STATIONS[index].name}`); });
btnNext.addEventListener("click", ()=>{ setStation(index+1); if(playing) play(); else showToast(`${STATIONS[index].name} ↦`); });

// ---------- Temporizador (30 min) ----------
function toggleSleep(){
  if (sleepTimer){
    clearTimeout(sleepTimer);
    sleepTimer = null;
    sleepBtn.classList.remove("sleep-on");
    showToast("Temporizador cancelado");
    return;
  }
  sleepBtn.classList.add("sleep-on");
  showToast("Apaga en 30 min");
  sleepTimer = setTimeout(()=>{
    pause();
    sleepBtn.classList.remove("sleep-on");
    showToast("Apagado");
  }, 30*60*1000);
}
sleepBtn.addEventListener("click", toggleSleep);

// ---------- ON AIR ----------
function setAir(on){
  if (on){
    air.classList.add("on"); air.classList.remove("off");
    airText.textContent = "ON AIR";
  }else{
    air.classList.remove("on"); air.classList.add("off");
    airText.textContent = "OFF AIR";
  }
}
setAir(false);

// Eventos del <audio>
audio.addEventListener("waiting", ()=> showToast("Conectando…"));
audio.addEventListener("playing", ()=> { showToast("Reproduciendo"); setAir(true); });
audio.addEventListener("pause",   ()=> setAir(false));
audio.addEventListener("stalled", ()=> showToast("Conexión lenta…"));
audio.addEventListener("error",   ()=> showToast("Error de reproducción"));

// ---------- Visualizador (ondas más altas y color por emisora) ----------
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
let audioCtx, analyser, source, dataArray;

function resize(){
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize", resize); resize();

function ensureAnalyser(){
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
}
ensureAnalyser();

function draw(){
  requestAnimationFrame(draw);
  if (!ctx) return;
  ctx.clearRect(0,0,canvas.width, canvas.height);

  if (!analyser || !dataArray) {
    // Fallback "latido"
    const mid = canvas.height / 2;
    const ampIdle = canvas.height * 0.12;
    const slice = canvas.width / 200;
    let x = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = currentColor || "#e5e7eb";
    ctx.beginPath();
    const t = Date.now() / 600;
    for (let i=0;i<200;i++){
      const y = mid + Math.sin((i/200)*Math.PI*4 + t) * ampIdle;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      x += slice;
    }
    ctx.stroke();
    return;
  }

  analyser.getByteTimeDomainData(dataArray);

  // Escala para "ondas más altas"
  const amp = canvas.height * 0.35;
  const mid = canvas.height / 2;

  ctx.lineWidth = 2;
  ctx.strokeStyle = currentColor;
  ctx.beginPath();

  const slice = canvas.width / dataArray.length;
  let x = 0;
  for (let i=0;i<dataArray.length;i++){
    const v = (dataArray[i]-128)/128; // -1..1
    const y = mid + v * amp * 1.35;
    if (i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    x += slice;
  }
  ctx.stroke();
}
draw();

// --------- Inicio ---------
setStation(0);
play();

// Reproducir al tocar (habilita AudioContext en iOS)
document.body.addEventListener("touchstart", ()=>{
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
},{passive:true});
