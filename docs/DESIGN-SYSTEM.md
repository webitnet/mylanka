# Design System — Миланка

## Brand

- **Name:** Миланка (Mylanka)
- **Tagline UA:** Вишиванки ◆ Сувеніри ◆ Обереги
- **Tagline EN:** Embroidery ◆ Souvenirs ◆ Charms
- **Sub-tagline UA:** Традиції, що живуть у серці
- **Sub-tagline EN:** Traditions that live in the heart
- **Tone:** Warm, traditional, hand-stitched, folk. Not corporate. Not minimalist. Authentic Ukrainian craft.

## Color Palette

The palette is drawn from a Ukrainian craft tag — parchment paper background, red embroidery thread, brass eyelet, ink illustrations of countryside (хата) and viburnum berries (калина).

```css
:root {
  /* Primary brand */
  --color-bark:        #3A2A1C;   /* Dark brown — header bg, brand text, logo wordmark */
  --color-embroidery:  #A8252E;   /* Embroidery red — primary CTAs, accents (formerly "terracotta") */
  --color-berry:       #C7373E;   /* Kalyna berry red — secondary accent, badges */
  --color-olive:       #7A622E;   /* Foliage olive-brown — success, nature accents */
  --color-brass:       #A88B4F;   /* Brass eyelet — gold accent, brand highlights */

  /* Surfaces */
  --color-linen:       #F5EAD2;   /* Linen-warm — card bg, raised surfaces */
  --color-parchment:   #FBF5E5;   /* Parchment — page background */

  /* Neutrals */
  --color-ink:         #1F1812;   /* Deep ink — body text */
  --color-muted:       #8B7853;   /* Warm gray — secondary text */
  --color-border:      #DCCDA8;   /* Soft warm — borders, dividers */

  /* Semantic */
  --color-error:       #A8252E;   /* embroidery */
  --color-success:     #7A622E;   /* olive */
  --color-warning:     #A88B4F;   /* brass */
}
```

## Typography

```css
--font-display: 'Cormorant Garamond', Georgia, serif;   /* Wordmark, headings (italic for brand) */
--font-ui:      'Cormorant SC', Georgia, serif;          /* Small caps — labels, nav, buttons */
--font-body:    'Lora', Georgia, serif;                   /* Body text, paragraphs */
```

All three are loaded via `next/font/google` with Cyrillic + Latin subsets.

**Scale:**
| Token | Size | Use |
|-------|------|-----|
| `text-xs` | 12px | Labels, badges |
| `text-sm` | 14px | Captions, meta |
| `text-base` | 16px | Body |
| `text-lg` | 18px | Lead paragraphs |
| `text-xl` | 24px | H3 |
| `text-2xl` | 32px | H2 |
| `text-3xl` | 40px | H1 |
| `text-4xl` | 56px | Hero |

Wordmark "Миланка" uses **Cormorant Garamond Bold Italic (700)** with cursive feel — replace with custom SVG once the brand artist delivers the final wordmark.

## Logo & Wordmark

Wordmark: **«Миланка»** in Cormorant Garamond Bold Italic (700), warm brown color (`--color-bark`) on light surfaces, brass (`--color-brass`) on dark surfaces.

Optional emblem (future): a small inked illustration of a Ukrainian хата (cottage) flanked by viburnum sprigs, framed by a cross-stitch border. Reserved for the etiquette/print application; web uses just the wordmark for clarity.

Variants:
- Dark bg → wordmark in `--color-brass`
- Light bg → wordmark in `--color-bark`
- Embroidery-red bg → wordmark in `--color-parchment`

## UI Components

| Element | Spec |
|---------|------|
| **Button (primary)** | `bg-embroidery text-parchment` rounded-sm, Cormorant SC, uppercase, tracking-wide |
| **Button (secondary)** | `border-bark text-bark` transparent, hover → `bg-bark text-parchment` |
| **Card** | `bg-linen border-border` hover → shadow-lg + scale-[1.01] |
| **Input** | `bg-parchment border-border` focus → `border-embroidery` ring |
| **Badge (default)** | `bg-linen text-bark` Cormorant SC, uppercase, text-xs |
| **Badge (new)** | `bg-olive text-parchment` |
| **Badge (sale)** | `bg-embroidery text-parchment` |
| **Badge (featured)** | `bg-brass text-bark` |
| **Product image** | Aspect ratio 4:5, warm overlay on hover |
| **Page background** | `bg-parchment` (#FBF5E5) |
| **Navigation** | Sticky top, `bg-bark` with brass/parchment text |

## Decorative / Ornaments

Implemented as inline SVG components in `src/components/ornaments/`:

- **Cross-stitch divider** — horizontal vyshyvka pattern in embroidery-red on parchment, used between hero and content sections, before footer
- **Diamond bullet `◆`** — used in the brand tagline as a separator between words ("Вишиванки ◆ Сувеніри ◆ Обереги"). Color: `--color-embroidery`
- **Heart `♥`** — small embroidery-red heart used in the footer ("Made with ♥ in Ukraine")
- **Cottage silhouette** — minimal line illustration available for About page hero
- **Kalyna sprig** — corner decoration for success pages and order confirmations (red berries on olive stems)
- **Cross-stitch border frame** — wraps hero/about sections, evoking the etiquette tag look

Decorative motifs use `--color-embroidery` and `--color-berry` for red elements, `--color-olive` for foliage, on `--color-parchment` or `--color-linen` background. Avoid placing them on `--color-bark` (low contrast).

## Texture

The page background may carry a subtle parchment grain texture (CSS `background-image` with a low-opacity noise SVG) for the etiquette-paper feel. Skip on mobile to keep performance light.
