---
version: 1
slug: "frontend-src-views-uploadview-vue"
primary_target: "frontend/src/views/UploadView.vue"
related_targets: ["frontend/src/views/WardrobeView.vue"]
---

# Surface brief: Upload + Wardrobe

Scope: UploadView (Persuade/first-run) and WardrobeView with ChatPanel, WardrobeItemCard, ShoppingCard, VideoModal (Operate). Redesign: product truth, flow, routes and data fields are kept; the visual world is replaced. Chosen direction is pinned by the user-approved `.claude/worktrees/frontend-redesign/direction.md` (concept: "etiqueta de taller", swatches + hang tags).

Audience and job: a person who dresses daily uploads one short video of their wardrobe, then returns each morning to ask the stylist what to wear. Action on Upload: choose a video and start the scan (or reopen the existing wardrobe). Task on Wardrobe: scan the garments, ask the stylist, open a garment in the video.

Constraints: no photo per garment (color, type, subtype, season, formality only); UI in English; no invented customers or claims; "For Judges" button removed; logo is a temporary slot until the new one is generated; only presentation changes (no backend, no store logic).

Open decisions: logo and any editorial imagery (generated later from a prompt the user will receive).

## Direction contract

THESIS: the wardrobe is a swatch book. The user's own garment colors are the only saturated thing on screen; everything else is cold-neutral, square-cornered and quiet. Refuses the dark gradient AI landing, glass panels, rounded bubbles and emoji-as-image.

OWN-WORLD: cool paper ground #EEF0F1, surface #F8F9F9, ink #16181A, hairlines #C9CED2, single vermilion accent #D9482B used only for primary action, focus and the active/highlighted state; dark variant under prefers-color-scheme. Bricolage Grotesque display, Geist text, Geist Mono for tag data (formality, temperature, price, file info). Radius 0 everywhere, 1px hairlines, no shadows, no blur, no gradients. Hang-tag cards: a flat block of the garment's color over a mono data line.

STORY: the visitor understands in one glance that one video becomes a rack of their own colors, believes the stylist knows their clothes and the weather, and does one thing: upload the video (or open the wardrobe they already have).

FIRST VIEWPORT: asymmetric 12-col grid on desktop. Left (about 6 cols): headline max two lines, one sentence of 20 words or fewer, the dropzone as the primary action, secondary "Open wardrobe" text link when an inventory exists. Right (about 5 cols): a tall vertical rack of color swatches, using the saved inventory colors or a fixed sample palette when empty, entering in a staggered sequence. Nav-free; the logo slot sits top-left at small size. Mobile: single column, swatches as a horizontal strip under the headline, dropzone above the fold.

FORM: pinned by user-approved direction file, no concept roll run (a pinned direction beats the roll); position on the ordered list: n/a; seed key: none.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
