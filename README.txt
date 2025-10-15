Arreglo: radios que no sonaban
---------------------------------
¿Qué cambié?
1) Service Worker ya no intercepta ni cachea streams (audio) ni peticiones cross-origin.
   Resultado: los streams remotos vuelven a cargar sin bloqueos.
2) Visualizer se inicia solo si el stream permite CORS.
3) Misma UI y diseño, 100% intacto.

Cómo probar
-----------
- Serví la carpeta por HTTPS (GitHub Pages/Netlify).
- Apretá play: las estaciones deben reproducir.
- Doble tap en "FM RADIO" para instalar la PWA (fullscreen).
