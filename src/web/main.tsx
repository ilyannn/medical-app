import { App } from "@/web/app";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/web/styles/app.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Unable to find root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
