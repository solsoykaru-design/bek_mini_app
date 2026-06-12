import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Обработка редиректа с 404.html (GitHub Pages)
const hash = window.location.hash;
if (hash && hash.startsWith('#r=')) {
  const path = atob(hash.slice(3));
  window.history.replaceState(null, '', path);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
