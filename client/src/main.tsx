import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/theme-context";
import { ErrorBoundary } from "./error-boundary";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found</div>';
} else {
  createRoot(root).render(
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
