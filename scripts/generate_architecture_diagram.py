from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG_OUT = ROOT / "report" / "assets" / "architecture.svg"
PNG_OUT = ROOT / "report" / "assets" / "architecture.png"


def write_svg() -> None:
    SVG_OUT.parent.mkdir(parents=True, exist_ok=True)
    svg = """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">
  <rect width="1200" height="500" fill="#0f172a"/>
  <text x="600" y="40" fill="#f8fafc" font-size="24" font-family="Arial, sans-serif" text-anchor="middle" font-weight="700">DAT Radar — End-to-End Architecture</text>
  <rect x="40" y="250" width="150" height="70" rx="10" fill="#0f766e"/><text x="115" y="290" fill="#fff" font-size="14" text-anchor="middle" font-family="Arial">Yahoo Finance</text>
  <rect x="40" y="150" width="150" height="70" rx="10" fill="#0f766e"/><text x="115" y="190" fill="#fff" font-size="14" text-anchor="middle" font-family="Arial">SEC EDGAR</text>
  <rect x="260" y="190" width="180" height="90" rx="10" fill="#1d4ed8"/><text x="350" y="240" fill="#fff" font-size="14" text-anchor="middle" font-family="Arial">Python ETL pipeline</text>
  <rect x="500" y="190" width="180" height="90" rx="10" fill="#1d4ed8"/><text x="590" y="240" fill="#fff" font-size="14" text-anchor="middle" font-family="Arial">MapReduce analytics</text>
  <rect x="760" y="250" width="150" height="70" rx="10" fill="#7c3aed"/><text x="835" y="290" fill="#fff" font-size="14" text-anchor="middle" font-family="Arial">SQLite / Postgres</text>
  <rect x="760" y="140" width="150" height="70" rx="10" fill="#7c3aed"/><text x="835" y="180" fill="#fff" font-size="14" text-anchor="middle" font-family="Arial">Parquet archive</text>
  <rect x="980" y="250" width="150" height="60" rx="10" fill="#b45309"/><text x="1055" y="285" fill="#fff" font-size="14" text-anchor="middle" font-family="Arial">REST API v1</text>
  <rect x="980" y="170" width="150" height="60" rx="10" fill="#b45309"/><text x="1055" y="205" fill="#fff" font-size="14" text-anchor="middle" font-family="Arial">Embed iframe</text>
  <rect x="980" y="90" width="150" height="60" rx="10" fill="#b45309"/><text x="1055" y="125" fill="#fff" font-size="14" text-anchor="middle" font-family="Arial">Partner demo</text>
  <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8"/></marker></defs>
  <line x1="190" y1="285" x2="260" y2="245" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="190" y1="185" x2="260" y2="225" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="440" y1="235" x2="760" y2="285" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="440" y1="215" x2="760" y2="175" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="680" y1="235" x2="500" y2="235" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="910" y1="285" x2="980" y2="280" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="910" y1="235" x2="980" y2="200" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="910" y1="205" x2="980" y2="120" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
</svg>"""
    SVG_OUT.write_text(svg, encoding="utf-8")
    print(f"Wrote {SVG_OUT}")


def maybe_rasterize() -> None:
    try:
        import cairosvg  # type: ignore

        cairosvg.svg2png(url=str(SVG_OUT), write_to=str(PNG_OUT))
        print(f"Wrote {PNG_OUT}")
    except Exception:
        if not PNG_OUT.exists():
            print("Skipped PNG rasterization (cairosvg unavailable). Use existing architecture.png or open architecture.svg.")


def main() -> None:
    write_svg()
    maybe_rasterize()


if __name__ == "__main__":
    main()
