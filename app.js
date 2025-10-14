
const STATIONS = [
  { number: "97.9", name: "NOW", url: "https://ipanel.instream.audio:7002/stream" },
  { number: "100.7", name: "BLUE 100.7", url: "https://27693.live.streamtheworld.com/BLUE_FM_100_7AAC.aac" },
  { number: "102.3", name: "ASPEN 102.3", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/ASPEN.mp3" },
  { number: "104.9", name: "LN+ 104.9", url: "https://stream.radio.co/s2ed3bec0a/listen" },
];

let index = 0;
let playing = false;

const audio = document.getElementById('audio');
const numberEl = document.getElementById('number');
const nameEl = document.getElementById('name');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const installBtn = document.getElementById('installBtn');
const splash = document.getElementById('splash');

// Splash fade-out after load
window.addEventListener('load', () => setTimeout(() => splash.classList.add('splash--hide'), 500));

// Install button (beforeinstallprompt)
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add('hidden');
  // optional toast/log
  console.log('Instalación:', outcome);
});
window.addEventListener('appinstalled', () => {
  installBtn.classList.add('hidden');
});

// Init AudioContext + Analyser
let ctx, analyser, dataArray;
function setupAnalyser(){
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const source = ctx.createMediaElementSource(audio);
  analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  analyser.connect(ctx.destination);
  dataArray = new Uint8Array(analyser.fftSize);
}
function setStation(i){
  index = (i + STATIONS.length) % STATIONS.length;
  const s = STATIONS[index];
  numberEl.textContent = s.number;
  nameEl.textContent = s.name;
  audio.src = s.url;

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: s.name,
      artist: s.number,
      album: 'Radio PWA',
      artwork: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    });
  }
}
function updatePlayUI(){
  if (playing){
    playIcon.classList.add('hidden'); pauseIcon.classList.remove('hidden');
  } else {
    pauseIcon.classList.add('hidden'); playIcon.classList.remove('hidden');
  }
}
async function togglePlay(){
  if (!playing){
    try {
      setupAnalyser();
      if (ctx.state === 'suspended') await ctx.resume();
      await audio.play();
      playing = true;
    } catch(e){ console.warn('No se pudo reproducir:', e); }
  } else { audio.pause(); playing = false; }
  updatePlayUI();
}
function next(){ setStation(index+1); if (playing) audio.play().catch(()=>{}); }
function prev(){ setStation(index-1); if (playing) audio.play().catch(()=>{}); }

playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', next);
prevBtn.addEventListener('click', prev);

setStation(0); updatePlayUI();

// Media Session action handlers
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', async () => { if(!playing){ await togglePlay(); }});
  navigator.mediaSession.setActionHandler('pause', async () => { if(playing){ await togglePlay(); }});
  navigator.mediaSession.setActionHandler('previoustrack', () => prev());
  navigator.mediaSession.setActionHandler('nexttrack', () => next());
}


// Canvas waveform with idle animation
const canvas = document.getElementById('wave');
const ctx2d = canvas.getContext('2d');
let rafId;
let idleT = 0;

function draw(){
  const w = canvas.width = canvas.clientWidth * devicePixelRatio;
  const h = canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx2d.clearRect(0,0,w,h);

  // gradient
  const grad = ctx2d.createLinearGradient(0,0,w,0);
  grad.addColorStop(0, '#ff3e3e'); grad.addColorStop(0.17, '#ff8c00');
  grad.addColorStop(0.34, '#ffd400'); grad.addColorStop(0.51, '#3be477');
  grad.addColorStop(0.68, '#32b1ff'); grad.addColorStop(0.85, '#8a5cff');
  grad.addColorStop(1, '#ff3ef7');
  ctx2d.lineWidth = 2 * devicePixelRatio;
  ctx2d.strokeStyle = grad;
  ctx2d.beginPath();

  if (analyser && playing) {
    analyser.getByteTimeDomainData(dataArray);
    for (let i=0;i<dataArray.length;i++){
      const x = (i/(dataArray.length-1))*w;
      const y = (dataArray[i]/255)*h;
      if(i===0) ctx2d.moveTo(x,y); else ctx2d.lineTo(x,y);
    }
  } else {
    // Idle sine/breathing animation
    idleT += 0.02;
    const A = h*0.18 * (0.75 + 0.25*Math.sin(idleT*0.8)); // amplitud respira
    const baseline = h/2;
    const freq = 2*Math.PI / (w*0.6);
    for (let i=0;i<w;i++){
      const x = i;
      const y = baseline + Math.sin(i*freq + idleT) * A;
      if(i===0) ctx2d.moveTo(x,y); else ctx2d.lineTo(x,y);
    }
  }
  ctx2d.stroke();

  rafId = requestAnimationFrame(draw);
}
rafId = requestAnimationFrame(draw);
