import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./styles.css";

class RenderBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Brain Loop render failed", error);
  }

  render() {
    const error = this.state.error;

    if (error) {
      return (
        <main className="boot-screen boot-screen-error">
          <strong>Brain Loop could not render</strong>
          <span>{error.message}</span>
        </main>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RenderBoundary>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </RenderBoundary>
  </React.StrictMode>,
);
