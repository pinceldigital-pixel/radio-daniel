
const STATIONS = [
  { name:'Now 97.9',  freq:97.9, url:'https://ipanel.instream.audio:7002/stream' },
  { name:'Blue 100.7',freq:100.7,url:'https://27693.live.streamtheworld.com/BLUE_FM_100_7AAC.aac' },
  { name:'Aspen 102.3',freq:102.3,url:'https://playerservices.streamtheworld.com/api/livestream-redirect/ASPEN.mp3' },
  { name:'LN+ 104.9', freq:104.9,url:'https://stream.radio.co/s2ed3bec0a/listen' },
];
const RANGE = { min:90, max:106 };
const $ = (id) => document.getElementById(id);
const el = {
  freq: $('freq'), song: $('song'), ticks: $('ticks'), labels: $('labels'), needle: $('needle'),
  playBtn: $('play'), playIcon: $('playIcon'), prev: $('prev'), next: $('next'), grid: $('cards'),
  pill: $('pill'), pillTitle: $('pillTitle'), pillToggle: $('pillToggle'), pillIcon: $('pillIcon'),
  pillPrev: $('pillPrev'), pillNext: $('pillNext'), pillStop: $('pillStop'),
  audio: $('player')
};

(function buildDial(){
  const bigs=[]; for(let f=RANGE.min; f<=RANGE.max; f+=2){bigs.push(f)}
  const smalls=[]; for(let f=RANGE.min; f<RANGE.max; f+=1){smalls.push(f)}
  el.ticks.innerHTML = smalls.map(f=>`<div class="tick ${f%2? 'small':'big'}"></div>`).join('');
  el.labels.innerHTML = bigs.map(f=>`<span>${f}</span>`).join('');
})();

function moveNeedle(f){
  const pct = (f - RANGE.min)/(RANGE.max - RANGE.min);
  el.needle.style.left = `calc(${pct*100}% + 12px)`;
}

el.grid.innerHTML = STATIONS.map((s,i)=>`<div class="card" data-i="${i}">${s.freq}<small>${s.name}</small></div>`).join('');

let currentIndex = -1;

function select(i){
  document.querySelectorAll('.card').forEach(c=>c.classList.remove('active'));
  const card = document.querySelector(`.card[data-i="${i}"]`);
  if(card) card.classList.add('active');
  const s = STATIONS[i];
  el.freq.textContent = s.freq.toFixed(1);
  el.song.textContent = s.name;
  moveNeedle(s.freq);
}

function setPlaySVG(isPlaying, target){
  const svg = target || el.playIcon;
  svg.innerHTML = isPlaying ? '<path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z"/>' : '<path d="M8 5v14l11-7L8 5z"/>';
}

function showPill(title){
  el.pillTitle.textContent = title;
  el.pill.style.display = 'flex';
}

function hidePill(){ el.pill.style.display='none'; }

function play(i=currentIndex){
  if(i<0) i=0;
  const s = STATIONS[i];
  if(!s) return;
  if(currentIndex!==i){ el.audio.src = s.url; }
  currentIndex = i; select(i);
  el.audio.play().then(()=>{
    setPlaySVG(true);
    showPill(s.name);
    setPlaySVG(true, el.pillIcon);
    updateMediaSession(s);
  }).catch(e=>console.warn('Autoplay bloqueado:', e));
}

function stop(){ el.audio.pause(); el.audio.currentTime=0; setPlaySVG(false); setPlaySVG(false, el.pillIcon); hidePill(); }

el.grid.addEventListener('click', e=>{ const card = e.target.closest('.card'); if(!card) return; play(+card.dataset.i); });
el.playBtn.addEventListener('click', ()=>{ if(currentIndex<0){ play(0); return; } if(el.audio.paused){ play(currentIndex); } else { el.audio.pause(); setPlaySVG(false); setPlaySVG(false, el.pillIcon); } });
el.prev.addEventListener('click', ()=>{ if(currentIndex<0){select(0);return;} play((currentIndex-1+STATIONS.length)%STATIONS.length); });
el.next.addEventListener('click', ()=>{ if(currentIndex<0){select(0);return;} play((currentIndex+1)%STATIONS.length); });

// Pill controls
el.pillToggle.addEventListener('click', ()=>{ if(el.audio.paused) play(currentIndex); else { el.audio.pause(); setPlaySVG(false); setPlaySVG(false, el.pillIcon); } });
el.pillPrev.addEventListener('click', ()=>{ if(currentIndex<0){select(0);return;} play((currentIndex-1+STATIONS.length)%STATIONS.length); });
el.pillNext.addEventListener('click', ()=>{ if(currentIndex<0){select(0);return;} play((currentIndex+1)%STATIONS.length); });
el.pillStop.addEventListener('click', stop);

function updateMediaSession(s){
  if('mediaSession' in navigator){
    navigator.mediaSession.metadata = new MediaMetadata({ title: s.name, artist: 'Radio Daniel' });
    navigator.mediaSession.setActionHandler('previoustrack', ()=>el.pillPrev.click());
    navigator.mediaSession.setActionHandler('nexttrack', ()=>el.pillNext.click());
    navigator.mediaSession.setActionHandler('play', ()=>{ if(el.audio.paused) play(currentIndex); });
    navigator.mediaSession.setActionHandler('pause', ()=>{ el.audio.pause(); setPlaySVG(false); setPlaySVG(false, el.pillIcon); });
    navigator.mediaSession.setActionHandler('stop', stop);
  }
}
if ('serviceWorker' in navigator) window.addEventListener('load', ()=>navigator.serviceWorker.register('./sw.js'));
