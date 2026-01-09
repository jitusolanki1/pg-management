import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import { initializeSecurity } from "./utils/security"

// Initialize security measures
initializeSecurity()

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
