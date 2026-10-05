---
name: Gemini Stylist
description: A swatch book for your wardrobe - cold neutral shell, square corners, one vermilion accent, and the user's own garment colors as the only saturated thing on screen.
colors:
  accent: "#C73E22"
  accent-dark: "#F0603F"
  accent-ink: "#FFFFFF"
  accent-ink-dark: "#141516"
  paper: "#EEF0F1"
  surface: "#F8F9F9"
  ink: "#16181A"
  ink-soft: "#4F565B"
  line: "#C9CED2"
  paper-dark: "#141516"
  surface-dark: "#1C1D1F"
  ink-dark: "#ECEEEF"
  ink-soft-dark: "#A5ACB1"
  line-dark: "#34383B"
  screen: "#0B0C0D"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw + 0.5rem, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Geist Mono Variable, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    fontFeature: "tabular-nums"
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "24px"
  touch: "44px"
  header: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.none}"
    height: "{spacing.touch}"
    padding: "0 24px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "{spacing.touch}"
    padding: "0 20px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  hang-tag-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px"
  chat-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "48px"
    padding: "0 56px 0 16px"
  suggestion-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  user-message:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
---

# Design System: Gemini Stylist

## Overview

**Creative North Star: "The Swatch Book"**

The wardrobe is a swatch book and the interface is the binder around it. Every garment is a flat block of its own color; everything else is cold-neutral, square-cornered, hairline-ruled and quiet, so the user's colors are the only saturated content on screen. A single vermilion accent marks the one action, the focus, and the highlighted state. The interface reads like a tailor's workshop tag: color on top, a small monospaced data line underneath.

Density is medium: this is a tool used every morning, not a gallery. Layout is asymmetric on the landing (text left, a tall rack of color bands right) and a plain workbench in the app (even grid of swatch cards beside a fixed chat column). Motion is functional only: staggered entry, a scan line while the video is read, a 1px press.

The system rejects the generic AI-tool look: dark gradient landings, glass panels, rounded chat bubbles, glow, and emoji standing in for images.

**Key Characteristics:**
- One theme with automatic dark variant via `prefers-color-scheme`; the same tokens swap, nothing else changes.
- Radius is 0 everywhere. Depth comes from 1px hairlines and tone, never shadows.
- Garment and sample colors are data, not tokens; they are the only saturated fill besides the accent.
- Three families with fixed jobs: display, text, mono for tag data.
- Icons come from Phosphor (regular weight, fill only for the play glyph).

## Colors

A cold gray-white shell with one hot vermilion accent; saturation is reserved for the accent and for the user's garments.

### Primary
- **Vermilion Tag** (accent, light #C73E22 / dark #F0603F): primary action fill, focus outline, text selection, the active drop target, the scan line, the progress fill, the stylist's side rule in chat, and the highlighted garment border and ring. Light white-on-accent text meets 4.5:1; in dark mode the lighter accent carries near-black text (accent-ink-dark).

### Neutral
- **Cool Paper** (paper, #EEF0F1 / dark #141516): page ground, chat message area, input field fill.
- **Cold Surface** (surface, #F8F9F9 / dark #1C1D1F): cards, dropzone, chat panel, empty state.
- **Workshop Ink** (ink, #16181A / dark #ECEEEF): text, outline-button borders, the user's message block, the hover inversion fill.
- **Soft Ink** (ink-soft, #4F565B / dark #A5ACB1): secondary text, data keys, placeholders.
- **Hairline** (line, #C9CED2 / dark #34383B): every border and divider; also the garment color fallback when a color is unreadable, and the progress track.
- **Screen Black** (screen, #0B0C0D, fixed in both themes): video surfaces only (modal frame and backdrop at 90%, loading video pane). It does not swap with the theme.

### Named Rules
**The Only Saturation Rule.** Saturated color on screen is either the accent or a garment's own color. Never tint chrome, backgrounds or icons with hue.

**The One Voice Rule.** The accent marks the primary action, focus, and the active or highlighted state. A second filled accent button on the same view is wrong.

**The Fixed Screen Rule.** Video surfaces use `screen` in both themes; do not reuse it for ordinary panels.

## Typography

**Display Font:** Bricolage Grotesque Variable (with ui-sans-serif, system-ui)
**Body Font:** Geist Variable (with ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono Variable (with ui-monospace, SFMono-Regular); tabular numerals enforced on `.font-mono`

**Character:** A grotesque with some personality for headings, a neutral workhorse for reading, and a mono face that makes data look like it was stamped on a tag. All three are self-hosted via fontsource.

### Hierarchy
- **Display** (600, 2.25rem / 3rem / 3.75rem at base / sm / lg, 1.05, tracking -0.025em): the landing headline, two lines, balanced.
- **Headline** (600, 2.25rem, tracking tight): wardrobe page title; loading status line steps 1.875rem to 2.25rem.
- **Title** (600, 1.125rem to 1.5rem, 1.25): garment subtype, chat panel title, dropzone label (1.25rem), empty-state line (1.5rem), wordmark (1.25rem, tight).
- **Body** (400, 1rem, relaxed; lead paragraph 1.125rem in ink-soft, capped near 52ch; prose blocks capped 40 to 48ch): chat messages, descriptions.
- **Label** (mono 400, 0.75rem to 0.875rem): garment data lines (Type, Season, Formality as n/10), file names and sizes, percentages, hostnames, piece counts, temperatures, swatch captions. Small UI text in the sans at 0.875rem (buttons, weather description, source titles at weight 500).

### Named Rules
**The Stamped Data Rule.** Numbers, file info, prices, temperatures, hostnames and tag key/values are set in the mono face; prose and headings never are.

**The Weight Not Italic Rule.** Emphasis is weight (500 to 600) within the same family; display weight is always 600.

## Layout

Landing: a 12-column grid on desktop, text and dropzone in 7 columns (left padding aligns to a 1400px centered container on wide screens), a full-height rack of color bands in 5 columns with a hairline separating them. On mobile it collapses to one column with the swatches as a 14rem-tall horizontal strip below. Bands vary in weight (flex-grow 2 to 4) so the rack feels hand-cut, not tiled.

App: a 64px header with a hairline, then a scrolling main area (max width 64rem) beside a fixed chat column (26rem, 30rem at xl). The garment grid is even: 2 columns on mobile, 3 at md, 4 at xl, 12px gaps. Below lg the chat becomes a full-screen sheet slid in from the right, opened by a fixed bottom-right "Ask stylist" button.

Spacing rhythm is Tailwind's 4px base: 12px inside cards and between grid cells, 20px for chat padding, 24px page gutters on mobile, 56px to 48px on desktop. Every tappable control is 44px minimum (h-11); the chat input is 48px.

## Elevation & Depth

Flat. There are no shadows, blurs, gradients or glass. Depth is conveyed by tone (paper vs. surface), 1px hairlines, and the overlay black of the video modal. The highlighted garment is the one raised-looking state: a 2px accent border plus a 2px accent ring and z-index lift, not a shadow.

### Named Rules
**The No Shadow Rule.** If something needs to stand out, change its border or fill; never add a shadow.

## Shapes

Square. Radius is 0 on every control, card, input, message and modal. The only non-rectangular form is the garment swatch, whose top-left corner is cut at 45 degrees (20px clip-path), like a tag corner. Borders are 1px `line`; emphasis borders switch to `ink` (outline buttons, dropzone at rest) or `accent` (drag-over, highlight, error notice). Chat messages have no bubble: the stylist is a block with a 1px accent rule on its left, the user is a solid ink block.

## Components

### Buttons
- **Shape:** square, 44px high (h-11), 24px or 20px horizontal padding, optional 18px trailing icon.
- **Primary:** accent fill with accent-ink text, weight 500 (Analyze, Upload Video in empty state, Ask stylist at 56px, chat send at 40px square).
- **Outline:** transparent with a 1px ink border (Continue with n items, View at store).
- **Hover / Focus:** hover inverts to ink fill with paper text, 200ms color transition; `:active` moves 1px down; focus is a 2px accent outline offset 2px on everything. Disabled send is line fill with ink-soft icon.
- **Text link:** ink-soft, underlined with 4px offset, to ink on hover (Reset, Cancel, Back to Upload).

### Hang-Tag Card (garment)
- **Corner Style:** square card; the swatch has the cut top-left corner.
- **Background:** surface card, swatch fills the top (7rem, 9rem at sm) with the garment's own color and a hairline underneath.
- **Body:** subtype in Title, color name in ink-soft, then a hairline-topped definition list in mono (Type, Season, Formality n/10).
- **Action:** an 44px paper square play button on the swatch's bottom-right, inverts on hover.
- **Highlighted:** border and 2px ring in accent.

### Source Card (shopping)
- Fixed 11rem-wide card, hairline border, a 5rem paper logo band with a 40px contained favicon (Phosphor bag icon fallback), two-line title, mono hostname, full-width outline "View at store". Border goes to ink on hover. Cards scroll horizontally with snap.

### Inputs / Fields
- **Style:** 48px high, 1px line border, paper fill, no radius; send button sits inside at the right.
- **Focus:** border to ink plus the global accent outline; caret is accent.
- **Disabled:** 60% opacity, placeholder changes to "Stylist is thinking...".

### Suggestion Rows
- Bordered rectangular rows (not pills), min 44px, left-aligned text, border to ink on hover; shown only before the first user message.

### Chat Messages
- Stylist: left 1px accent rule with 16px indent, no fill. User: solid ink block with paper text. Sources appear below as a horizontal Source Card strip. Thinking state is two line-colored skeleton bars.

### Dropzone (signature)
- A full-width button up to 36rem: surface fill, 1px ink border, a 48px accent square holding the upload glyph, display-weight label, mono file constraints. Dragging switches the border to accent and fill to paper.

### Swatch Rack (signature)
- Edge-to-edge bands of garment colors (or six sample colors when empty) that unfurl with a clip-path reveal staggered by 90ms. Desktop bands carry a mono caption on a paper chip.

### Wordmark
- Text only: "Gemini Stylist" in Title display type at 1.25rem. A temporary slot until the generated logo lands; it is expected to be replaced, not extended.

### Motion
- Easing `cubic-bezier(0.16, 1, 0.3, 1)`. `rise` (0.7s, 14px upward fade, 70ms stagger) for the hero copy, `unfurl` (0.8s clip reveal) for swatches, `scan` (2.8s linear, infinite) for the line over the loading video, a 300ms transform on the chat sheet and progress bar. `prefers-reduced-motion` collapses all durations to 0.01ms.

## Do's and Don'ts

### Do:
- **Do** keep radius at 0 and separate regions with 1px `line` borders.
- **Do** let the garment color be the largest saturated area on any card or band.
- **Do** use the accent only for the primary action, focus, drag-over, scan/progress and the highlighted garment.
- **Do** set data (counts, seasons, formality, hostnames, temperatures) in the mono face.
- **Do** invert to ink on hover for buttons and give every interactive control a 44px minimum target and the 2px accent focus outline.
- **Do** use Phosphor icons at 18 to 26px with `aria-hidden` when decorative.
- **Do** swap tokens through `prefers-color-scheme` and keep `screen` fixed for video.

### Don't:
- **Don't** add shadows, blur, gradients, glass panels, glow or text gradients.
- **Don't** use rounded bubbles, pills or circular avatars; the world is square.
- **Don't** use emoji or hand-drawn SVG as imagery; the garment color is the image.
- **Don't** introduce a second hue for chrome (no indigo, violet, amber, cream) or pure `#000` and pure `#fff` surfaces.
- **Don't** use scale-on-hover, bounce or looping decorative motion.
- **Don't** set Bricolage in the mono role or mono in headings.

## Not Canonized

Defects and drift the build carries, which are not rules for future surfaces:
- `animate-pulse` on the chat thinking skeleton (infinite pulse contradicts the motion grammar above).
- The "Your colors" / "Sample colors" tag on the swatch rack is a small caption label with its own ink chip; do not reuse it as a kicker or eyebrow.
- Hover and highlight use `ring-2`; the highlight border plus ring is a doubled 2px+2px that goes beyond the 2px direction.
- `alert()` for missing video playback, and the dropzone `border-ink` at rest versus `border-line` elsewhere is an exception specific to the primary action.
- Wordmark is a temporary text placeholder.
