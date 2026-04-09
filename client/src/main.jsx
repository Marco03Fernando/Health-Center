import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";

createRoot(document.getElementById("root")).render(
  <AdminAuthProvider>
    <App />
  </AdminAuthProvider>
);