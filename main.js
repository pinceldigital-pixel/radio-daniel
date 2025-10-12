import React from "https://esm.sh/react@18";
import ReactDOM from "https://esm.sh/react-dom@18";
import App from "./app.js";

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js");
}
