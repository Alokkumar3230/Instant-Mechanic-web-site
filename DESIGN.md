# Design Brief

## Direction

Pit Lane — a premium, data-dense vehicle service operations console with a motorsport pit-wall telemetry feel.

## Tone

Industrial/utilitarian precision: dark-first warm charcoal console with a vivid safety-orange accent — confident, high-signal, race-team energy, never generic blue tech.

## Differentiation

The safety-orange accent (motorsport hazard energy) against warm charcoal neutrals plus JetBrains Mono telemetry readouts for IDs and live metrics makes the console feel like a real-time pit-wall telemetry station.

## Color Palette

| Token      | OKLCH (dark) | Role                              |
| ---------- | ------------ | --------------------------------- |
| background | 0.13 0.015 45 | deep warm charcoal canvas         |
| foreground | 0.94 0.015 60 | primary text                      |
| card       | 0.17 0.018 45 | surface panels                    |
| primary    | 0.72 0.18 45 | safety-orange accent / CTAs       |
| accent     | 0.68 0.16 200 | cool teal secondary highlight     |
| muted      | 0.21 0.02 45 | subdued surfaces                  |
| success    | 0.64 0.16 150 | completed / available             |
| warning    | 0.74 0.15 85 | pending / on-the-way              |

## Typography

- Display: Space Grotesk — headings, page titles, KPI numerals
- Body: DM Sans — UI labels, paragraphs, table text
- Mono: JetBrains Mono — booking IDs, timestamps, metric readouts
- Scale: hero `text-3xl md:text-4xl font-bold tracking-tight`, h2 `text-xl font-semibold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm`

## Elevation & Depth

Layered surfaces with subtle borders and restrained shadows (`shadow-subtle` / `shadow-elevated`) — depth from stacked panels and hairlines, not glow.

## Structural Zones

| Zone    | Background  | Border   | Notes                              |
| ------- | ----------- | -------- | ---------------------------------- |
| Sidebar | sidebar     | sidebar-border | fixed rail, active item orange     |
| Topbar  | card        | border-b | page title + dark toggle + user    |
| Content | background  | —        | KPI cards on card, alternating muted |
| Footer  | muted/40    | border-t | status line, subtle                |

## Spacing & Rhythm

Section gaps `gap-6`, card padding `p-5`, dense data tables `py-2.5`, consistent 4px spacing scale for a tight operations layout.

## Component Patterns

- Buttons: rounded-md, primary safety-orange, hover brighten, secondary bordered
- Cards: rounded-md, card background, shadow-subtle, hairline border
- Badges: rounded-full pills, tinted by status (success/warning/destructive/muted)

## Motion

- Entrance: `fade-in-up` 0.3s on view load
- Hover: 0.3s transition-smooth lift on interactive rows/cards
- Decorative: `pulse-dot` on live mechanic status indicators

## Constraints

- Dark mode is primary; light mode tuned for AA+ contrast
- Token-only styling — no raw hex or arbitrary color classes in components
- 3–5 core colors; accent used sparingly for highlights and active states
- Data-dense and restrained — no decorative gradients in production UI

## Signature Detail

JetBrains Mono telemetry readouts (booking IDs, live KPIs, timestamps) paired with the safety-orange accent give the console a live pit-wall telemetry identity.
