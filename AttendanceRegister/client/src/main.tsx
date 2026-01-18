import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Main.tsx: Starting app initialization");

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
  document.body.innerHTML = "<h1>Error: Root element not found</h1>";
} else {
  console.log("Root element found, rendering app");
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Error rendering app:", error);
    rootElement.innerHTML = `<h1>Error rendering app</h1><pre>${error}</pre>`;
  }
}
