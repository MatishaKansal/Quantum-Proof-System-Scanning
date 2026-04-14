import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

console.log("App initializing...");

const root = document.getElementById("root");
if (!root) {
  console.error("Root element not found!");
  throw new Error("Root element not found!");
}

createRoot(root).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

console.log("App rendered successfully");
