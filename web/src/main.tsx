import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>{/* call router or pages */}</StrictMode>,
);
