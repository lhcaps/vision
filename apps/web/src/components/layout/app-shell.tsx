import type { ReactNode, CSSProperties } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    background: "#F6F8FB",
    color: "#0F172A",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  contentWrap: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  main: {
    padding: 24,
    maxWidth: 1280,
    width: "100%",
    margin: "0 auto",
  },
};

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={styles.shell}>
      <Sidebar />
      <div style={styles.contentWrap}>
        <Topbar />
        <main style={styles.main}>{children}</main>
      </div>
    </div>
  );
}
