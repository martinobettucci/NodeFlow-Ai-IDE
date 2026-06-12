# NodeFlow AI IDE

**The visual node-based IDE for AI workflows** — the frontend of
[NodeFlow SDK](https://github.com/P2Enjoy/NodeFlow-SDK). Spiritually the
"ComfyUI for business": drag nodes on a canvas, wire them together, and run
AI workflows that **just work**.

> Né d'un défi : reproduire ce type de produit en moins de 24 heures.
> Finalement, la première version n'aura pris que 4 heures.

---

## 🧠 Philosophy: backends do the work

The IDE is a **pure NodeFlow SDK client**. It ships only *input* nodes
(text, image, audio, video) — every processing node comes from a backend:

- **No API keys in the browser.** Backends keep their own credentials;
  the IDE only ever talks the NodeFlow protocol.
- **Zero-code extensibility.** Connect a backend and its nodes appear in
  the palette, rendered entirely from their manifests (typed inputs/outputs,
  checkbox/combobox/textbox/number parameters).
- **Thin wrappers for SaaS APIs.** Want OpenAI or FAL.AI? Serve the
  ready-made wrapper backends from the SDK repo
  (`scripts/examples/openai_backend`, `scripts/examples/falai_backend`).

```text
[ IDE (browser) ] ──RSA session──▶ [ NodeFlow SDK backend(s) ]
   text/image/                        echo, whisper, OpenAI,
   audio/video inputs                 FAL.AI, your own nodes...
```

---

## ✨ Features

- **Canvas** — ReactFlow: zoom, pan, minimap, snap-to-grid, resizable nodes,
  type-safe colored connections (text, image, mask, audio, video, JSON)
- **Backend nodes** — dynamic rendering from manifests, per-node Run button,
  inline previews (text/image/audio/video), parameter editing on the node
  and in the properties panel
- **Run Workflow** — executes every backend node of the canvas in
  topological order, streaming each node's results to its downstream nodes
- **Sessions** — RSA-PSS handshake (WebCrypto), automatic reconnection and
  session renewal; each canvas node maps to an isolated backend instance
- **Projects** — create, clone, rename, export/import (JSON), delete;
  auto-saved to IndexedDB

---

## 🚀 Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

### Connect a backend

```bash
# In the NodeFlow-SDK repository (or any backend created with `nodeflowsdk init`)
pip install -e .
nodeflowsdk serve --port 8765 --nodes scripts/init_template/nodes.py
```

Then in the IDE: **Settings → Backends → add `http://localhost:8765`**.

### OpenAI / FAL.AI via wrapper backends

```bash
# OpenAI (text + image)
cd scripts/examples/openai_backend
export OPENAI_API_KEY=sk-...
nodeflowsdk serve --port 8801 --nodes openai_nodes.py

# FAL.AI (FLUX image + framepack video)
cd scripts/examples/falai_backend
export FAL_KEY=key_id:key_secret
nodeflowsdk serve --port 8802 --nodes falai_nodes.py
```

Add `http://localhost:8801` and `http://localhost:8802` as backends, and the
OpenAI/FAL nodes appear in the palette — keys never leave the servers.

---

## 🧪 Quality

```bash
npm run typecheck     # strict TypeScript, zero errors
npm run build         # tsc + vite production build
npm run e2e:backend   # full protocol test against a live backend
npm run e2e:workflow  # chained workflow execution test
```

Both e2e scripts exercise the exact client code the IDE uses:
handshake → discovery → upload → run → poll → download → teardown.

---

## 🏗️ Architecture

```text
src/
├── components/
│   ├── NodeEditor.tsx        ReactFlow canvas, Run Workflow toolbar
│   ├── nodes/                TextNode, ImageNode, AudioNode, VideoNode,
│   │                         BackendNode, MediaUpload
│   ├── sidebar/              Palette, properties, project selector
│   └── settings/             Backends, About
├── contexts/                 Projects, Backends
├── services/
│   ├── dbService.ts          IndexedDB persistence
│   └── nodeflow/             NodeFlow SDK protocol
│       ├── client.ts         HTTP client (sessions, runs, outputs)
│       ├── crypto.ts         WebCrypto RSA-PSS handshake
│       ├── executor.ts       Single-node run orchestration
│       ├── workflow.ts       Whole-graph topological execution
│       └── types.ts          Wire types (manifests, statuses)
└── utils/                    Node & project factories
```

---

## License

See [LICENSE](LICENSE).
