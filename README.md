# Cisco Portfolio Navigator

An interactive, single-file HTML tool for exploring the Cisco product portfolio and building customer account plans with augmentation, replacement, and bundle recommendations.

**Live demo:** https://bnarcum.github.io/cisco-portfolio-navigator/

## What it does

- **Four-level drill-down visualization** (new in v2.1):
  - **Overview** — 5 category bubbles (Networking / Security / Collaboration / Computing / Observability) for first-look conversations
  - **Families** — 52 product families *(default)*, the classic D3 force-directed map of how things connect
  - **Composition** — one family pinned in the middle with every specific SKU around it; dashed purple *"replaced by"* arrows show succession chains
  - **All** — every family + every product (~350 nodes) in one dense graph for power users
- **Drill down anywhere**: switch with the topbar segmented control, **double-click** a family bubble, click the bright **"Explore N products →"** button on any family panel, or just **search for a product** — the graph auto-promotes into that product's family. A breadcrumb chip under the topbar always shows where you are.
- **Visualize the portfolio** as an interactive D3 force-directed graph (zoom, drag, click for details, right-click for quick actions)
- **Search any product** — both families (ISE, Meraki, Webex Devices) and **297+ specific models** (Cisco Desk Pro, Catalyst 9300, ASA 5525-X, Catalyst 9178I Wi-Fi 7, UCS C245 M8, …)
- **Filter** by category, use case, industry, EOL/EOS status, or licensing tier
- **Build account plans** — add a customer's existing Cisco stack and get scored recommendations for:
  - **Augment** — complementary products to expand footprint
  - **Replace** — EOL/EOS items with their official successors and migration paths
  - **Bundles** — pre-defined solution bundles the stack partially covers
  - **Coverage** — use cases & industries the current stack addresses
  - **Migrate** — actionable migration plan with dates & successors
  - **Warnings** — compatibility & dependency gaps
- **EOS / EOL Timeline** — Gantt-style view of every product's lifecycle, with zoom (`+` / `-` / `0` / `⌘ + scroll`)
- **Industry starter templates** — one-click stacks for Hospital, K-12, Manufacturing, Retail, etc.
- **Customer profile** — bias recommendations toward cloud-first vs hybrid vs on-prem
- **Compare mode** — pin 2–4 products or families side-by-side; inline ⇆ button on every Recent / Pinned item
- **Reference architectures** — overlay the canonical product stack for any use case
- **Saved plans + shareable URL** — auto-save, name plans, share encoded state via link
- **Multi-format export** — Markdown, CSV, JSON, PDF (print), PPTX, plain text
- **AI Assistant** — bring your own key (OpenRouter, Groq, OpenAI, Anthropic, LM Studio, Ollama) to generate stacks from a scenario, justify recommendations, or explore migrations
- **Last view + focus** persists across reloads in `localStorage`

## Usage

### Online (recommended)

Just visit https://bnarcum.github.io/cisco-portfolio-navigator/ in any modern browser. Nothing to install. Everything is client-side — saved plans and AI keys never leave your browser.

### Offline / local

```bash
git clone https://github.com/bnarcum/cisco-portfolio-navigator.git
cd cisco-portfolio-navigator
# Open the file in your browser (any method works):
open cisco-portfolio-navigator.html
# or serve it locally to enable the AI assistant with local models:
python3 -m http.server 8765
# then visit http://localhost:8765/cisco-portfolio-navigator.html
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| `/` or `⌘K` / `Ctrl+K` | Focus search |
| `p` | Toggle account planner |
| `t` | Toggle EOS/EOL timeline view |
| `a` | Open AI assistant |
| `?` | (Re-)launch the guided tour |
| `←` / `→` / `↑` / `↓` | Walk between connected nodes (when one is selected) |
| `Enter` / `Space` | Open the focused node |
| `Esc` | Close any open panel / dialog / tour |

**Drill-down shortcuts (graph):**
- **Double-click** any family bubble → Composition view for that family
- **Click "Explore N products →"** on a family's detail panel → same drill
- **Search for a product** → graph auto-promotes to that product's family

The view-mode segmented control in the topbar is keyboard-focusable; the breadcrumb chip's `×` returns to Families view.

## AI Assistant setup notes

The assistant works fully client-side via your own API key. It supports any OpenAI-compatible endpoint:

| Provider | Works from web (HTTPS hosted) | Works from `file://` | Notes |
|---|:-:|:-:|---|
| OpenRouter | ✅ | ✅ | Recommended — single key for OpenAI/Anthropic/Llama/etc. |
| Groq | ✅ | ✅ | Fast, free tier |
| OpenAI | ✅ | ❌ (CORS) | Use OpenRouter for browser access |
| Anthropic | ✅ | ❌ (CORS) | Use OpenRouter for browser access |
| LM Studio | ⚠️ * | ✅ | Local server — see notes below |
| Ollama | ⚠️ * | ✅ | Local server — see notes below |

\* When using the hosted version with a **local** model server (Ollama / LM Studio), browsers block the mixed `https://` → `http://localhost` request. Workarounds:
- Use the offline / local instructions above (serve the file via `python3 -m http.server`)
- Or download the HTML file and open it directly (`file://` works once you set `OLLAMA_ORIGINS="*"` and restart Ollama)

## Tech

Single, self-contained HTML file. No build step, no dependencies to install — D3.js is loaded from a CDN. ~460 KB total.

Internally, the four view modes are layered on top of a single D3 force simulation: the global `NODES` (52 families) and `LINKS` (family-to-family adjacencies) are the source of truth, and each mode synthesizes its own `viewNodes` / `viewLinks` arrays (category bubbles for Overview, family + products + successor edges for Composition, the full union for All). A stable link-key function keeps D3 `.join()` happy across rebinds, and per-mode force tuning (charge, collide, link distance) keeps layouts feeling right whether there are 5 nodes or 350.

## License

Personal / educational use. Cisco product names, descriptions, and trademarks are property of Cisco Systems, Inc.
