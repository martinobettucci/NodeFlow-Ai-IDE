# NodeFlow AI IDE

**The visual node-based IDE for AI workflows** — the frontend companion of
[NodeFlow SDK](https://github.com/P2Enjoy/NodeFlow-SDK). Spiritually the
"ComfyUI for business": drag nodes on a canvas, wire them together, and run
AI workflows that **just work**.

> Né d'un défi : reproduire ce type de produit en moins de 24 heures.
> Finalement, la première version n'aura pris que 4 heures.

---

## ✨ Features

### Built-in nodes
- **Text** — static text or AI-generated text (OpenAI)
- **Image** — upload your own, or generate/edit/make variations (DALL·E 2/3, gpt-image-1)
- **Video** — upload your own, or generate from text/image/video (FAL.AI)

### NodeFlow SDK backends 🆕
Register any [NodeFlow SDK](https://github.com/P2Enjoy/NodeFlow-SDK) backend by
URL and its nodes appear in the palette, ready to drag onto the canvas:

- **RSA-authenticated sessions** — the IDE generates an RSA-PSS keypair in the
  browser (WebCrypto), signs the handshake challenge, and talks to the backend
  over a per-session `session-id` header.
- **Dynamic node discovery** — manifests (`GET /nodes`) drive the inputs,
  outputs and parameters rendered on each node. New backend nodes require
  **zero changes** to the IDE.
- **Full run lifecycle** — connected inputs are uploaded to the backend, the
  run is submitted and polled, and outputs are downloaded and previewed
  (text, image, audio, video) right on the node.
- **Interoperable** — backend node outputs feed into built-in nodes and
  vice-versa; each canvas node maps to an isolated backend instance.

### Workbench
- ReactFlow canvas: zoom, pan, minimap, snap-to-grid, resizable nodes
- Type-safe connections (text→text, image→image, …) with colored edges
- Project manager: create, clone, rename, export/import (JSON), delete
- Auto-save to IndexedDB — close the tab, your work is still there
- API keys and backend URLs stored locally in your browser

---

## 🚀 Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

### Connect a NodeFlow SDK backend

```bash
# In the NodeFlow-SDK repository (or any backend created with `nodeflowsdk init`)
pip install -e .
nodeflowsdk serve --port 8765 --nodes scripts/init_template/nodes.py
```

Then in the IDE: **Settings → Backends → add `http://localhost:8765`**.
The backend's nodes (echo, examples, your own…) appear in the palette.

### Optional: direct API providers
Add your OpenAI and/or FAL.AI keys in **Settings → API Keys** to use the
built-in generation nodes. Keys never leave your browser.

---

## 🧪 Quality

```bash
npm run typecheck     # strict TypeScript, zero errors
npm run build         # tsc + vite production build
npm run e2e:backend   # full protocol test against a live backend
```

The end-to-end script exercises the exact client the IDE uses:
handshake → discovery → upload → run → poll → download → session teardown.

---

## 🏗️ Architecture

```text
src/
├── components/
│   ├── NodeEditor.tsx        ReactFlow canvas & orchestration
│   ├── nodes/                TextNode, ImageNode, VideoNode, BackendNode
│   ├── sidebar/              Palette, properties, project selector
│   └── settings/             API keys, Backends, About
├── contexts/                 Projects, API keys, Backends
├── services/
│   ├── apiService.ts         OpenAI / FAL.AI direct calls
│   ├── dbService.ts          IndexedDB persistence
│   └── nodeflow/             NodeFlow SDK protocol
│       ├── client.ts         HTTP client (sessions, runs, outputs)
│       ├── crypto.ts         WebCrypto RSA-PSS handshake
│       ├── executor.ts       Run orchestration for canvas nodes
│       └── types.ts          Wire types (manifests, statuses)
└── utils/                    Node & project factories
```

---

## License

See [LICENSE](LICENSE).
