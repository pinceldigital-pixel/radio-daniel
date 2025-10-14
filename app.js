// --- LÓGICA DEL DIAL RADIAL ---
// Añade este bloque de código a tu 'app.js'

(function() {
  const needle = document.getElementById('needle');
  // Asegúrate de que el código no se rompa si el elemento no existe
  if (!needle) return;

  const startFreq = 88.0;
  const endFreq = 108.0;

  // Rango de movimiento de la aguja en grados.
  // -135 grados = 88MHz (izquierda)
  //  135 grados = 108MHz (derecha)
  const minAngle = -135;
  const maxAngle = 135;
  const angleRange = maxAngle - minAngle;

  function setNeedleFor(freq) {
    const frequency = parseFloat(freq);

    // Evitar cálculos con valores fuera de rango
    if (frequency < startFreq || frequency > endFreq) {
      return;
    }

    // Normalizar la frecuencia a un valor entre 0 y 1
    const normalized = (frequency - startFreq) / (endFreq - startFreq);
    
    // Calcular el ángulo correspondiente
    const angle = minAngle + (normalized * angleRange);

    // Aplicar la rotación a la aguja
    needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  }

  // Hacer la función accesible globalmente para que el resto de tu app la pueda llamar
  // cuando cambie de estación.
  window.__setNeedleFor = setNeedleFor;

  // --- Ejemplo de uso ---
  // Llama a esta función cuando cargues una estación, por ejemplo:
  // __setNeedleFor('97.9');
})();

// ... aquí va el resto de tu código de app.js (manejo de audio, HLS, estaciones, etc.)