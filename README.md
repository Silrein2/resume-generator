# Resume & Blog — Nuxt 3

A quiet, paper-grade résumé and small blog tool. Each editor gets a single public
URL (`/u/your-handle`) to share. Server-rendered so social previews work right out
of the box. Version **0.2.0** — migrated to Nuxt 3.

## Features

- **A4-formatted résumé editor** with a 15% × 15% top-left/sidebar grid layout, paper-grade typography
- **Live preview with zoom controls** — drag the slider, hit ±, or "Fit" to reset (40–120% range, default 75%)
- **Per-user public page** at `/u/your-handle` — server-rendered, so LinkedIn/Slack/etc. show real link previews
- **TipTap-backed blog** with image uploads, code blocks, links — capped at 50 articles per user
- **Draft / Published toggle** on each article
- **PDF export** via html2pdf.js — exports the unscaled A4 page regardless of preview zoom
- **Shareable links + QR codes** for the public page
- **3 roles**: admin, editor, observer (public)
- **Token-gated registration** — admins generate one-shot invite tokens

## Tech stack

- [Nuxt 3](https://nuxt.com) — Vue 3 + Vite + Nitro server, SSR enabled
- [Pinia](https://pinia.vuejs.org) for state (`@pinia/nuxt` module)
- [Firebase](https://firebase.google.com) — Auth, Firestore, Storage
- [TipTap](https://tiptap.dev) — rich blog editor
- [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) — PDF export
- [qrcode.vue](https://www.npmjs.com/package/qrcode.vue) — QR codes

## Project setup

### 1. Install dependencies

```bash
npm install
```

This runs `nuxt prepare` automatically (generates `.nuxt/` type-hints).

### 2. Create a Firebase project

- Go to <https://console.firebase.google.com> and create a project.
- Enable **Authentication → Email/Password** sign-in method.
- Enable **Firestore Database** in production mode.
- Enable **Storage**.

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your Firebase web app config:

```bash
cp .env.example .env
```

```ini
NUXT_PUBLIC_FIREBASE_API_KEY=...
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NUXT_PUBLIC_FIREBASE_APP_ID=...
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NUXT_PUBLIC_SITE_URL` is used to build absolute URLs for OG meta tags on the
public observer pages. In production, set it to your real domain.

### 4. Deploy security rules

Use the Firebase Console (Firestore → Rules and Storage → Rules) or the CLI:

```bash
firebase deploy --only firestore:rules,storage
```

Files: `firestore.rules` and `storage.rules` in the project root.

### 5. Run dev server

```bash
npm run dev
```

Opens at <http://localhost:3000>.

## Bootstrap the first admin

There is no admin self-registration. Procedure:

1. **Manually create a token** in the Firestore console:
   - Collection: `tokens`
   - Document ID: anything memorable (e.g., `bootstrap-001`)
   - Fields: `usedBy: null`, `usedAt: null`, `token: "bootstrap-001"`, `createdAt: <serverTimestamp>`

2. **Register normally** at `/register` using that token. You'll be created as
   role `editor`.

3. **In the Firestore console**, find your user document under `users/{uid}` and
   change `role` from `"editor"` to `"admin"`.

4. Sign back in. The dashboard now shows the **Admin** tab (`/dashboard/admin`),
   where you can mint tokens for other editors.

## Routes

| Path                         | Who              | Notes                                 |
|------------------------------|------------------|---------------------------------------|
| `/`                          | anyone           | Landing page                          |
| `/login`                     | guests only      | Sign in (Firebase Auth)               |
| `/register`                  | guests only      | Token-gated registration              |
| `/dashboard/resume`          | editor + admin   | Edit résumé with live preview & zoom  |
| `/dashboard/blog`            | editor + admin   | Article list                          |
| `/dashboard/blog/:articleId` | editor + admin   | Edit a single article (or `new`)      |
| `/dashboard/settings`        | editor + admin   | Display name, slug, email, password   |
| `/dashboard/admin`           | admin only       | Generate registration tokens          |
| `/u/:slug`                   | anyone (SSR)     | Public résumé + OG meta tags          |
| `/u/:slug/blog`              | anyone (SSR)     | Public article list                   |
| `/u/:slug/blog/:articleId`   | anyone (SSR)     | Public article with OG tags           |

Auth/admin/guest route guards live in `middleware/` and only run client-side
(Firebase Auth has no server-side session).

## Data model

```
users/{uid}                       # role, slug, displayName, email
users/{uid}/articles/{articleId}  # title, content (HTML), published, timestamps
resumes/{uid}                     # profileImageUrl, name, title, sections...
tokens/{tokenId}                  # usedBy, usedAt — registration tokens

Storage:
  profiles/{uid}/*                # profile images
  blog-images/{uid}/{articleId}/* # inline article images
```

Slug uniqueness is enforced in the auth store (queried before write).

## A4 layout notes

The résumé uses a fixed `--a4-width: 794px` (210mm @ 96dpi). The page is a CSS
Grid with rows `15% 1fr` and columns `15% 1fr`:

```
┌────────────┬───────────────────────┐
│ photo 15%  │ name / title / contact │
├────────────┼───────────────────────┤
│ sidebar    │ main sections          │
│ (skills,   │ (Experience, etc.)     │
│ langs)     │                        │
└────────────┴───────────────────────┘
```

If content overflows one A4 page on screen, the page grows downward. The PDF
exporter still paginates at A4 boundaries (configured in `composables/usePdfExport.ts`).

## Preview zoom (new in 0.2.0)

The dashboard résumé editor previously rendered the preview at a fixed `transform: scale(0.62)`. It now exposes:

- A header strip with `−`, slider, `+`, percentage readout, and a **Fit** reset
- Default zoom: **75%** (up from 62%)
- Range: **40% – 120%**, step 5%
- Uses CSS `zoom` (not `transform: scale`) so the scrollable viewport responds
  to the scaled layout naturally — no negative margins required
- The viewport has its own scrollbar; the form column never overlaps the preview
- Stacks vertically below 1100px viewport with a shorter viewport height

PDF export still targets the **unscaled** `pageRef`, so output is unaffected by
preview zoom.

## Deployment

Nuxt's default build produces a Node server, so you need a Node-capable host:

- **Vercel / Netlify / Cloudflare Pages** — auto-detect Nuxt, zero config beyond
  setting the `NUXT_PUBLIC_*` env vars in the dashboard
- **Railway / Fly.io / any Node host** — `npm run build` then `node .output/server/index.mjs`
- **Firebase Hosting** — needs Cloud Functions for SSR; doable but more setup.
  Cheapest path is `npm run generate` for static + client-side fetching, but
  you'd lose the SSR meta tags that justified this migration. Not recommended.

Set `NUXT_PUBLIC_SITE_URL` to your production domain in your host's env vars so
OG meta tags get correct absolute URLs.

## What's new in 0.6.0

**Mobile dashboard:**
- **Hamburger menu** on screens < 760px wide. The sidebar slides in from the left over a dimmed backdrop. Closes on backdrop tap, route change, or Escape.
- **Tabbed mobile editor** for the résumé page. Below 1100px viewport, the Edit form and Preview are no longer stacked — they share a tab switcher at the top and each takes full width when active.
- **Style card density.** Color pickers split into "essentials" (accent, paper, text color) shown by default, and an "advanced" expandable section (header bg, sidebar bg, photo cell bg).
- **Admin token list** reflows on narrow screens — actions stack below the token data.

**Analytics:**
- **View counts** on public résumé pages. Tracked client-side after hydration so bots without JS don't inflate counts. Owner's own visits are excluded automatically.
- **Monthly buckets** — `viewCountsByMonth.{YYYY-MM}` keeps a count per calendar month, used for the "This month" stat.
- **Stats card on the dashboard** shows total views, this month, and last viewed (relative time). Only visible once you've published your résumé.
- **Firestore rule update** — view-tracking fields on published résumés can be incremented by anonymous visitors; all other writes still require ownership.
- **DNT respected** — visitors with Do-Not-Track enabled are not counted.

**Migration:**
- Firestore rules need to be redeployed: `firebase deploy --only firestore:rules` after pulling this version.
- Existing résumés get a `viewCount` of 0 automatically. No data migration needed.

## What's new in 0.5.0

- **Font picker for résumé and articles.** Each résumé chooses its own display font (name, headings) and body font; each article chooses one font. Options are shown in a dropdown where each option name is rendered in the font itself.
- **Color pickers for résumé and articles.** Résumé exposes: accent, paper, header background, sidebar background, photo-cell background, and text. Articles expose: background, text, and accent. Each is a row of preset swatches plus a "custom" tile that opens the native color picker.
- **Font registry at `utils/fonts.ts`.** Single source of truth — to add a font, add an entry there with its Google Fonts URL fragment. The Nuxt config builds the global preload URL from this registry automatically.
- **Underline added to article toolbar.** Sits next to strikethrough. Uses `@tiptap/extension-underline`.
- **Live preview on the article editor.** Below the TipTap editor, a preview pane shows the article rendered with the chosen font and colors applied.

## What's new in 0.4.0

- **Public résumé reader.** The `/u/:slug` page now wraps the résumé in a scrollable viewport with sticky zoom controls. Default zoom auto-fits to viewport width (capped at 100%), so portrait mobile no longer cuts off the left edge. Same control set as the dashboard preview — minus, slider, plus, percentage, and **Fit width** to reset.
- **Shared `ZoomControls` component.** Single source of truth for the zoom UI; used by both the dashboard preview and the public résumé reader. Reduces drift between the two.
- **Mobile-responsive ObserverNav.** The slug indicator is hidden on screens narrower than 600px; tabs and login link get smaller padding. Login link is hidden below 380px to make room for the brand + tabs.
- **Mobile-responsive article page.** Reduced top padding and h1 size on screens narrower than 600px for better readability.

## What's new in 0.3.0

- **Publish / Draft toggle for the résumé.** New users default to **Draft**, meaning their `/u/:slug` page returns 404 to visitors until they explicitly publish. The dashboard shows a banner with the current state and a one-click toggle. Unpublishing hides the résumé *and* the blog from the public side (individual articles' `published` flags still apply once the public page is live).
- **Edit + Delete buttons on the article list.** Previously only the title was clickable; now each row has explicit View / Edit / Delete buttons. Delete confirms before deleting.
- **Newline bug fixed in the sidebar sections textarea.** The editor now uses a string buffer (`itemsText`) bound directly via `v-model`, with cleanup happening only at save time — so pressing Enter works exactly like it should.

## What's new in 0.2.0

- **Migrated to Nuxt 3** — file-based routing, auto-imports, SSR
- **SSR meta tags for `/u/:slug`, `/u/:slug/blog`, `/u/:slug/blog/:articleId`** —
  shared links on LinkedIn / Slack / Twitter now show real titles, descriptions,
  and (where applicable) profile images
- **Preview zoom controls** — 40–120%, defaults to 75%, contained scrollable viewport
- **TypeScript** in stores, middleware, plugins, composables
- **Component auto-import** — `ResumeView`, `ObserverNav`, etc. work without imports
- **Pinia via `@pinia/nuxt` module** — same store API as before
- **Dedicated `error.vue`** — handles 404 and other errors gracefully

## Known limitations

- The preview can grow vertically on screen if your content exceeds one A4 page;
  the PDF still paginates correctly.
- Section reordering on the right column is up/down buttons only — no drag-and-drop.
- Blog images uploaded to Storage are not garbage-collected on article delete.
- First admin must be promoted manually via the Firestore console (see bootstrap above).

## File layout

```
resume-app-nuxt/
├── app.vue                          # root component (NuxtLayout + NuxtPage)
├── error.vue                        # 404/500 handler
├── nuxt.config.ts
├── package.json
├── assets/main.css                  # design tokens + global styles
├── components/                      # auto-imported
│   ├── BlogEditor.vue
│   ├── ObserverNav.vue
│   ├── ResumeView.vue
│   └── VersionBadge.vue
├── composables/
│   └── usePdfExport.ts
├── layouts/
│   ├── default.vue
│   └── dashboard.vue
├── middleware/
│   ├── auth.ts
│   ├── admin.ts
│   └── guest.ts
├── pages/                           # file-based routing
│   ├── index.vue
│   ├── login.vue
│   ├── register.vue
│   ├── dashboard/
│   │   ├── index.vue                # → /dashboard/resume
│   │   ├── resume.vue               # zoom-enabled preview
│   │   ├── settings.vue
│   │   ├── admin.vue
│   │   └── blog/
│   │       ├── index.vue
│   │       └── [articleId].vue
│   └── u/[slug]/
│       ├── index.vue                # SSR public résumé
│       └── blog/
│           ├── index.vue
│           └── [articleId].vue
├── plugins/
│   └── auth-listener.client.ts      # client-only Firebase auth listener
├── stores/
│   └── auth.ts                      # Pinia auth store
├── utils/                           # auto-imported
│   ├── firebase.ts                  # app + Firestore (universal)
│   └── firebase-client.ts           # Auth + Storage (client only)
├── public/
│   └── favicon.svg
├── firestore.rules
└── storage.rules
```
