"use client";

import { useEffect, useState } from "react";
import { getFileIcon } from "./FileIcons";

export interface Tab {
  id: string;
  label: string;
  filePath: string;
}

interface Props {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCloseAllTabs: () => void;
}

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onCloseAllTabs }: Props) {
  const [hoveredClose, setHoveredClose] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!menu) return;

    const closeMenu = () => { setMenu(null); };
    window.addEventListener("click", closeMenu);
    window.addEventListener("blur", closeMenu);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("blur", closeMenu);
    };
  }, [menu]);

  const openMenu = (event: React.MouseEvent) => {
    if (tabs.length === 0) return;
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY });
  };

  const openMenuFromButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (tabs.length === 0) return;
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenu({ x: rect.left, y: rect.bottom + 6 });
  };

  const closeAllTabs = () => {
    onCloseAllTabs();
    setMenu(null);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", width: "100%", height: 44 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "transparent",
            overflowX: "auto",
            overflowY: "hidden",
            flex: 1,
            minWidth: 0,
            height: 44,
            padding: "6px 8px",
            gap: 6,
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  height: 32,
                  paddingLeft: 12,
                  paddingRight: 6,
                  border: `1px solid ${isActive ? "var(--border)" : "transparent"}`,
                  borderRadius: "var(--radius-pill)",
                  background: isActive ? "var(--bg-panel)" : "transparent",
                  cursor: "pointer",
                  fontSize: 12,
                  color: isActive ? "var(--text)" : "var(--text-muted)",
                  whiteSpace: "nowrap",
                  maxWidth: 180,
                  minWidth: 80,
                  flexShrink: 0,
                  userSelect: "none",
                  transition: "background 0.1s, color 0.1s",
                }}
              >
                <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7, display: "flex", alignItems: "center" }}>
                  {getFileIcon(tab.label, 13)}
                </span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flex: 1,
                    fontWeight: isActive ? 600 : 400,
                  }}
                  title={tab.filePath}
                >
                  {tab.label}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
                  onMouseEnter={() => setHoveredClose(tab.id)}
                  onMouseLeave={() => setHoveredClose(null)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 16, height: 16,
                    background: hoveredClose === tab.id ? "var(--bg-hover)" : "transparent",
                    border: "none",
                    borderRadius: "50%",
                    color: hoveredClose === tab.id ? "var(--text)" : "var(--text-dim)",
                    cursor: "pointer",
                    padding: 0,
                    flexShrink: 0,
                    transition: "background 0.1s, color 0.1s",
                  }}
                  title="Close"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="2" y1="2" x2="8" y2="8" />
                    <line x1="8" y1="2" x2="2" y2="8" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
        {tabs.length > 0 && (
          <button
            onClick={openMenuFromButton}
            title="文件标签页操作"
            aria-label="文件标签页操作"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              marginRight: 8,
              padding: 0,
              background: "transparent",
              border: "none",
              borderRadius: "50%",
              color: "var(--text-muted)",
              cursor: "pointer",
              flexShrink: 0
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "var(--bg-hover)";
              event.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "transparent";
              event.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </button>
        )}
      </div>
      {menu && (
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            position: "fixed",
            top: menu.y,
            left: menu.x,
            zIndex: 700,
            minWidth: 156,
            padding: "6px 4px",
            background: "var(--frosted-bg)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
            backdropFilter: "saturate(180%) blur(24px)",
            WebkitBackdropFilter: "saturate(180%) blur(24px)",
            animation: "pi-hovercard-in 0.15s ease-out",
          }}
        >
          {/* Arrow */}
          <div
            style={{
              position: "absolute",
              top: -5,
              left: 14,
              width: 10,
              height: 10,
              background: "var(--frosted-bg)",
              border: "1px solid var(--border)",
              borderRight: "none",
              borderBottom: "none",
              transform: "rotate(45deg)",
              backdropFilter: "saturate(180%) blur(24px)",
            }}
          />
          <button
            onClick={closeAllTabs}
            style={{
              width: "100%",
              height: 30,
              padding: "0 10px",
              background: "transparent",
              border: "none",
              borderRadius: 6,
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 12,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(event) => { event.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            关闭全部标签页
          </button>
        </div>
      )}
    </>
  );
}
