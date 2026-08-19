import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey || publishableKey.includes("replace_me")) {
  console.warn("Set VITE_CLERK_PUBLISHABLE_KEY in client/.env");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider
        publishableKey={publishableKey}
        afterSignOutUrl="/sign-in"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      >
      <App />
    </ClerkProvider>
  </StrictMode>
);
