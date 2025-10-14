
// --- Estado básico y estaciones de ejemplo (reemplaza URLs por las tuyas) ---
const stations = [
  { freq: '98.7', name: 'RADIO FUTURA', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_fourlw_online_nonuk' },
  { freq: '101.3', name: 'ELECTRO FM', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one' },
  { freq: '87.5', name: 'CLÁSICA', url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_three' }
];
let current = 0;
let isPlaying = false;

// Elements
const audio = document.getElementById('audio');
const bigFreq = document.getElementById('bigFreq');
const stationName = document.getElementById('stationName');
const subFreq = document.getElementById('subFreq');
const prev = document.getElementById('prev');
const next = document.getElementById('next');
const toggle = document.getElementById('toggle');
const toggleIcon = document.getElementById('toggleIcon');
const stopBtn = document.getElementById('stop');
const rewBtn = document.getElementById('rew');
const ffBtn = document.getElementById('ff');
const muteBtn = document.getElementById('mute');
const volume = document.getElementById('volume');
const air = document.getElementById('air');
const airDot = document.getElementById('airDot');
const airText = document.getElementById('airText');
const sleepBtn = document.getElementById('sleepBtn');
const sleepLabel = document.getElementById('sleepLabel');

// Init UI
function setStation(i){
  current = (i + stations.length) % stations.length;
  const s = stations[current];
  bigFreq.textContent = s.freq;
  stationName.textContent = s.name;
  if(audio.src !== s.url){ audio.src = s.url; }
}
setStation(0);

// ON AIR / OFF AIR
function updateAir(){
  if(isPlaying){
    air.classList.add('on');
    airText.textContent = 'ON AIR';
  } else {
    air.classList.remove('on');
    airText.textContent = 'OFF AIR';
  }
}

// Play/Pause
async function play(){
  try{
    await audio.play();
    isPlaying = true;
    toggleIcon.setAttribute('d','M8 5v14l11-7z'.replace('8 5v14l11-7z','M7 5h4v14H7zM13 5h4v14h-4z')); // cambia a "pause"
    subFreq.hidden = false;
    subFreq.textContent = 'En vivo';
    updateAir();
  }catch(e){
    console.warn(e);
  }
}
function pause(){
  audio.pause();
  isPlaying = false;
  toggleIcon.setAttribute('d','M8 5v14l11-7z'); // play
  subFreq.hidden = true;
  updateAir();
}

toggle.addEventListener('click', ()=> isPlaying ? pause() : play());
prev.addEventListener('click', ()=>{ setStation(current-1); if(isPlaying) play(); });
next.addEventListener('click', ()=>{ setStation(current+1); if(isPlaying) play(); });
stopBtn.addEventListener('click', ()=>{ pause(); audio.currentTime = 0; });
rewBtn.addEventListener('click', ()=>{ audio.currentTime = Math.max(0, audio.currentTime - 15); });
ffBtn.addEventListener('click', ()=>{ audio.currentTime += 15; });
muteBtn.addEventListener('click', ()=>{ audio.muted = !audio.muted; });
volume.addEventListener('input', ()=>{ audio.volume = Number(volume.value); });

audio.addEventListener('playing', ()=>{ isPlaying = true; updateAir(); });
audio.addEventListener('pause',   ()=>{ isPlaying = false; updateAir(); });

// --- Temporizador 30' (sleep) ---
let sleepLeft = 0;
let sleepTimer = null;
function format(mmss){
  const m = Math.floor(mmss/60).toString().padStart(2,'0');
  const s = Math.floor(mmss%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}
function startSleep(minutes=30){
  sleepLeft = minutes*60;
  sleepLabel.textContent = format(sleepLeft);
  if(sleepTimer) clearInterval(sleepTimer);
  sleepTimer = setInterval(()=>{
    sleepLeft--;
    sleepLabel.textContent = format(sleepLeft);
    if(sleepLeft<=0){
      clearInterval(sleepTimer);
      sleepTimer = null;
      pause();
      sleepLabel.textContent = '30:00';
    }
  },1000);
}
sleepBtn.addEventListener('click', ()=>{
  if(sleepTimer){
    clearInterval(sleepTimer);
    sleepTimer = null;
    sleepLabel.textContent = '30:00';
  }else{
    startSleep(30);
  }
});

// --- Ondas nuevas (sin WebAudio, animación generativa) ---
const canvas = document.getElementById('wave');
const ctx = canvas.getContext('2d');
let W, H, t = 0;
function resize(){
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
resize(); addEventListener('resize', resize);

function draw(){
  t += 0.015;
  ctx.clearRect(0,0,W,H);

  // fondo sutil
  ctx.globalAlpha = 0.6;
  const grad = ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,'rgba(255,255,255,0.05)');
  grad.addColorStop(1,'rgba(255,255,255,0.00)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  // múltiples ondas "neón"
  const lines = 4;
  for(let i=0;i<lines;i++){
    const amp = 18 + i*6;
    const speed = 0.6 + i*0.12;
    const yBase = H*0.5;
    ctx.beginPath();
    for(let x=0; x<=W; x+=2){
      const y = yBase + Math.sin((x*0.018)+(t*speed))*amp * Math.cos((x*0.004)-(t*0.9));
      if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.lineWidth = 2 + i*0.6;
    // brillo alterna según ON AIR
    const alpha = isPlaying ? 0.9 : 0.35;
    ctx.strokeStyle = `rgba(255,154,31,${alpha - i*0.12})`; // usa el acento, pero en degradé
    ctx.shadowColor = 'rgba(255,154,31,0.3)';
    ctx.shadowBlur = isPlaying ? 14 : 4;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  requestAnimationFrame(draw);
}
draw();
