import React from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { App } from "./src/components/App";

const root = createRoot(document.getElementById("root")!);
root.render(
  <>
    <App />
    <Analytics />
  </>
);
