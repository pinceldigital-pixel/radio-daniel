document.addEventListener("DOMContentLoaded", () => {
  const stations = [
    { name: "Now 97.9",   freq: 97.9, url: "https://ipanel.instream.audio:7002/stream" },
    { name: "Blue 100.7", freq: 100.7, url: "https://27693.live.streamtheworld.com/BLUE_FM_100_7AAC.aac" },
    { name: "Aspen 102.3", freq: 102.3, url: "https://playerservices.streamtheworld.com/api/livestream-redirect/ASPEN.mp3" },
    { name: "LN+ 104.9",  freq: 104.9, url: "https://stream.radio.co/s2ed3bec0a/listen" },
  ];

  const MIN_FREQ = 88;
  const MAX_FREQ = 108;

  const audio = document.getElementById("audio");
  const freqEl = document.getElementById("freq");
  const stationNameEl = document.getElementById("stationName");
  const needle = document.getElementById("needle");
  const ticks = document.getElementById("ticks");
  const btnPrev = document.getElementById("prev");
  const btnNext = document.getElementById("next");
  const btnPower = document.getElementById("power");
  const onair = document.querySelector('.onair');
  const onairDot = onair.querySelector('.dot');
  const onairTxt = onair.querySelector('.txt');

  function setOnAir(state){
    if(state){ onair.classList.remove('off'); onairTxt.textContent='ON AIR'; }
    else { onair.classList.add('off'); onairTxt.textContent='OFF AIR'; }
  }

  let current = 0;
  let poweredOn = true;
  let canAutoplay = false; // habilita autoplay tras primer gesto


  function buildDial() {
    ticks.innerHTML = `
      <div class="left">
        <div class="num">88</div>
        <div class="scale">
          <div class="tick t"></div><div class="tick"></div><div class="tick"></div><div class="tick"></div>
          <div class="num">90</div>
          <div class="tick t"></div><div class="tick"></div><div class="tick"></div><div class="tick"></div>
          <div class="num">96</div>
        </div>
      </div>
      <div class="right">
        <div class="num">96</div>
        <div class="scale">
          <div class="tick t"></div><div class="tick"></div><div class="tick"></div><div class="tick"></div>
          <div class="num">100</div>
          <div class="tick t"></div><div class="tick"></div><div class="tick"></div><div class="tick"></div>
          <div class="num">108</div>
        </div>
      </div>`;
  }

  function pctForFreq(freq) {
    return ((freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ)) * 100;
  }

  function setNeedle(freq) {
    const p = pctForFreq(freq);
    needle.style.left = p + "%";
  }

  function setStation(i) {
    const s = stations[i];
    current = i;
    freqEl.textContent = s.freq.toFixed(1);
    stationNameEl.textContent = s.name;
    setNeedle(s.freq);
    needle.classList.remove('bounce'); void needle.offsetWidth; needle.classList.add('bounce');
    if (poweredOn) { if (canAutoplay) playStream(s.url, s); else { if (audio.src !== s.url) audio.src = s.url; } }
  }

  function playStream(url, meta) {
    if (audio.src !== url) audio.src = url;
    audio.play().catch(()=>{});
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${meta.name} • ${meta.freq.toFixed(1)} FM`,
        artist: "FM Radio",
        album: "PWA",
        artwork: [
          { src: "icons/icon-192.png", sizes:"192x192", type:"image/png" },
          { src: "icons/icon-512.png", sizes:"512x512", type:"image/png" }
        ]
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => switchStation(-1));
      navigator.mediaSession.setActionHandler("nexttrack", () => switchStation(1));
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("stop", () => { audio.pause(); audio.currentTime = 0; });
    }
  }

  function switchStation(dir) {
    const next = (current + dir + stations.length) % stations.length;
    setStation(next);
    if (navigator.vibrate) navigator.vibrate(8);
  }

  btnPrev.addEventListener("click", () => switchStation(-1));
  btnNext.addEventListener("click", () => switchStation(1));
  
  function enableAutoplay() {
    if (!canAutoplay) {
      canAutoplay = true;
      if (poweredOn) { try { audio.play(); } catch(e){} }
    }
  }
  ["click","touchstart","keydown"].forEach(ev => document.addEventListener(ev, enableAutoplay, { once:false }));

  btnPower.addEventListener("click", () => {

  // Tocar a izquierda/derecha del dial cambia estación
  const dial = document.getElementById('dial');
  dial.addEventListener('click', (e) => {
    const rect = dial.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width/2) switchStation(-1); else switchStation(1);
  });

    poweredOn = !poweredOn;
    if (poweredOn) { setOnAir(true); setOnAir(true);
  setStation(current); }
    else { audio.pause(); setOnAir(false); }
  });

  buildDial();
  setOnAir(true);
  setStation(current);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}
