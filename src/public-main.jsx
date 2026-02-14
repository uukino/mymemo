import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import PublicMemos from "./PublicMemos.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PublicMemos />
  </StrictMode>,
);
