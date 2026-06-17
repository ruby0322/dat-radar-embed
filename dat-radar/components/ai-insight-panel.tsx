"use client";

import type { InsightPayload, InsightResponse } from "@/types";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

const insightBodyStyle = {
  fontSize: "14px" as const,
  lineHeight: 1.6,
  color: "var(--text-primary)",
};

interface AiInsightPanelProps {
  payload: InsightPayload;
}

export function AiInsightPanel({ payload }: AiInsightPanelProps) {
  const [open, setOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `Request failed with status ${res.status}`);
      }

      const data = (await res.json()) as InsightResponse;
      setInsight(data.insight);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch insight");
    } finally {
      setLoading(false);
    }
  }, [payload]);

  useEffect(() => {
    if (open && insight === null && !loading) {
      void fetchInsight();
    }
  }, [open, insight, loading, fetchInsight]);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "none",
          border: "none",
          color: "var(--text-primary)",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        <span>AI Insight</span>
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {open ? "▼" : "▶"}
        </span>
      </button>

      {open && (
        <div
          style={{
            padding: "0 16px 16px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                paddingTop: "16px",
                color: "var(--text-secondary)",
                fontSize: "14px",
              }}
            >
              <Spinner />
              <span>Analyzing data...</span>
            </div>
          )}

          {!loading && error && (
            <div style={{ paddingTop: "16px" }}>
              <p style={{ color: "var(--red)", fontSize: "14px", margin: "0 0 8px" }}>
                {error}
              </p>
              <button
                onClick={() => {
                  setInsight(null);
                  void fetchInsight();
                }}
                style={{
                  padding: "4px 12px",
                  background: "var(--border)",
                  border: "none",
                  borderRadius: "4px",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && insight && (
            <div style={{ paddingTop: "16px", ...insightBodyStyle }}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p style={{ ...insightBodyStyle, margin: "0 0 6px" }}>{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul
                      style={{
                        ...insightBodyStyle,
                        margin: "0 0 8px",
                        paddingLeft: "1.25rem",
                        listStyleType: "disc",
                      }}
                    >
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol
                      style={{
                        ...insightBodyStyle,
                        margin: "0 0 8px",
                        paddingLeft: "1.5rem",
                        listStyleType: "decimal",
                      }}
                    >
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ ...insightBodyStyle, marginBottom: "4px" }}>{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: 600 }}>{children}</strong>
                  ),
                }}
              >
                {insight}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="var(--text-secondary)"
        strokeWidth="2"
        strokeDasharray="25 10"
        strokeLinecap="round"
      />
    </svg>
  );
}
