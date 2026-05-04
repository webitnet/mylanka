# Design System — Рідне

## Brand

- **Name:** Рідне (Ridne)
- **Tagline UA:** Handmade · Україна · Сувеніри
- **Tagline EN:** Handmade Ukrainian Souvenirs
- **Tone:** Warm, authentic, handcrafted feel. Not corporate. Not trendy. Timeless.

## Color Palette

```css
:root {
  /* Primary */
  --color-bark:       #3D2B1F;   /* Dark brown — nav, dark backgrounds, text */
  --color-terracotta: #C8593A;   /* Warm red-brown — primary CTAs, accents */
  --color-gold:       #D4A843;   /* Warm gold — secondary accent, highlights */

  /* Secondary */
  --color-sage:       #7A9E7E;   /* Muted green — success, nature accents */
  --color-wheat:      #F2E4C4;   /* Warm beige — card backgrounds */
  --color-cream:      #FAF5EC;   /* Off-white — page background */

  /* Neutrals */
  --color-ink:        #1E1510;   /* Near-black — body text */
  --color-muted:      #8B7D6B;   /* Warm gray — secondary text */
  --color-border:     #E0D5C7;   /* Light warm — borders, dividers */

  /* Semantic */
  --color-error:      #C8593A;
  --color-success:    #7A9E7E;
  --color-warning:    #D4A843;
}
```

## Typography

```css
--font-display: 'Playfair Display', Georgia, serif;    /* Headings */
--font-ui: 'Unbounded', system-ui, sans-serif;          /* Labels, subheadings, UI */
--font-body: 'Martel', Georgia, serif;                   /* Body text */
```

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

## Logo

Two elements:
1. **Emblem:** Circular motif — stylized sunflower/embroidery with 8 petals (4 gold `#D4A843`, 4 terracotta `#C8593A`) inside a dashed circle. Solid gold center.
2. **Wordmark:** "Рідне" in Playfair Display Bold. "не" portion in italic gold.

Three variants:
- Dark bg → gold emblem + wheat wordmark
- Light bg → bark emblem + bark wordmark
- Terracotta bg → cream emblem + cream wordmark

## UI Components

| Element | Spec |
|---------|------|
| **Button (primary)** | `bg-terracotta text-cream` rounded-sm, Unbounded font, uppercase, tracking-wide |
| **Button (secondary)** | `border-bark text-bark` transparent, hover → `bg-bark text-cream` |
| **Card** | `bg-white border-border` hover → shadow-lg + scale-[1.01] |
| **Input** | `bg-cream border-border` focus → `border-terracotta` ring |
| **Badge** | `bg-wheat text-bark` Unbounded, uppercase, text-xs |
| **Product image** | Aspect ratio 4:5, warm overlay on hover |
| **Page background** | `bg-cream` (#FAF5EC) |
| **Navigation** | Sticky top, `bg-bark` with gold/wheat text |

## Decorative

- Embroidery-inspired grid pattern for section dividers
- Dashed circle borders (logo motif) for accents
- Warm grain/noise texture on hero sections
- Ukrainian ornamental dividers between sections
