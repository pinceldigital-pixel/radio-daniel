
import React from "https://esm.sh/react@18";

const h = React.createElement;

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const fmt = (n) => n.toFixed(1);

const STATIONS = [
  { freq: 97.9, name: "NOW", url: "https://ipanel.instream.audio:7002/stream" },
  { freq: 100.7, name: "BLUE", url: "https://27693.live.streamtheworld.com/BLUE_FM_100_7AAC.aac" },
  { freq: 102.3, name: "ASPEN", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/ASPEN.mp3" },
  { freq: 104.9, name: "LN+", url: "https://stream.radio.co/s2ed3bec0a/listen" },
];

const FMIN = 88;
const FMAX = 108;

export default function App() {
  const [i, setI] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(0.8);
  const audioRef = React.useRef(null);
  const st = STATIONS[i];

  const posPct = React.useMemo(() => {
    const pct = (st.freq - FMIN) / (FMAX - FMIN);
    return clamp(pct, 0, 1) * 100;
  }, [st.freq]);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = st.url;
    a.volume = volume;
    a.muted = muted;
    if (playing) a.play().catch(() => {}); else a.pause();
  }, [st, playing, muted, volume]);

  const header = h("div", { style: { padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontFamily: "LouisGeorge, system-ui, sans-serif" } }, 
    h("div", null,
      h("div", { style: { display: "flex", alignItems: "flex-end", gap: 8 }},
        h("span", { style: { fontSize: 72, fontWeight: 700, color: "#fff", lineHeight: 1 } }, fmt(st.freq)),
        h("span", { style: { fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 } }, "MHz"),
      ),
      h("div", { style: { marginTop: 8, fontSize: 28, fontWeight: 700, color: "#fff" } }, st.name)
    ),
    h("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 12 }},
      h("span", { style: { width: 10, height: 10, background: "#ef4444", borderRadius: 9999, boxShadow: "0 0 10px rgba(239,68,68,.9)" } }),
      h("span", { style: { color: "#ef4444", fontWeight: 700 } }, "ON AIR")
    )
  );

  const ticksMinor = [];
  for (let f = FMIN; f <= FMAX; f++) {
    ticksMinor.push(h("div", { key: "m"+f, style: { width: 1, height: f % 4 === 0 ? 26 : 10, background: "#666" } }));
  }
  const labels = [];
  for (let f = FMIN; f <= FMAX; f += 4) {
    labels.push(h("div", { key: "l"+f, style: { width: 0, transform: "translateX(-50%)", color: "#d1d5db", fontSize: 12 } }, String(f)));
  }

  const dial = h("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" } },
    h("div", { style: { width: "90%", height: 140, position: "relative" } },
      h("div", { style: { position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: 2, background: "rgba(120,120,120,.7)" } }),
      h("div", { style: { position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", display: "flex", justifyContent: "space-between" } }, ticksMinor),
      h("div", { style: { position: "absolute", left: 0, right: 0, top: "62%", display: "flex", justifyContent: "space-between" } }, labels),
      // Needle
      h("div", { style: { position: "absolute", left: posPct + "%", top: 0, bottom: 0, transform: "translateX(-50%)", transition: "left .35s cubic-bezier(.2,.9,.2,1.2)" } },
        h("div", { style: { position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 40, height: 80, width: 3, background: "#ef4444", borderRadius: 6, boxShadow: "0 0 12px rgba(239,68,68,.8)" } }),
        h("div", { style: { position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 28, height: 18, width: 18, border: "2px solid #ef4444", borderRadius: 9999 } })
      )
    )
  );

  const controls = h("div", { style: { padding: 20, background: "rgba(20,20,20,.9)", borderTop: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "LouisGeorge, system-ui, sans-serif" } },
    h("button", { onClick: () => setI((x)=>clamp(x-1,0,STATIONS.length-1)), style: circleBtn() }, "◀"),
    h("button", { onClick: () => setPlaying(p=>!p), style: playBtn() }, playing ? "❚❚" : "▶"),
    h("button", { onClick: () => setI((x)=>clamp(x+1,0,STATIONS.length-1)), style: circleBtn() }, "▶")
  );

  const audio = h("audio", { ref: audioRef, crossOrigin: "anonymous", preload: "none", style: { display: "none" } });

  return h("div", { style: { height: "100vh", width: "100vw", background: "#000", color: "#fff", display: "flex", flexDirection: "column" } },
    h("style", null, `
      @font-face { font-family: 'LouisGeorge'; src: url('./LouisGeorge-Light.ttf') format('truetype'); font-weight: 300; }
      @font-face { font-family: 'LouisGeorge'; src: url('./LouisGeorge-Bold.ttf') format('truetype'); font-weight: 700; }
      *{ box-sizing: border-box; } body { margin:0; }
    `),
    header, dial, controls, audio
  );
}

function circleBtn(){
  return { height:56, width:56, borderRadius:9999, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", color:"#fff", fontSize:18 };
}
function playBtn(){
  return { height:64, width:64, borderRadius:9999, background:"#fff", color:"#000", fontSize:22, fontWeight:700 };
}
