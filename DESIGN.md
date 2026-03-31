# Design System Strategy: Precision Performance

## 1. Overview & Creative North Star
**Creative North Star: "The Mechanical Redline"**
This design system moves beyond "flat design" to embrace a high-end, editorial aesthetic inspired by technical schematics and premium automotive instrumentation. It rejects the generic "app-like" feel of rounded corners and soft shadows. Instead, it utilizes **Organic Brutalism**: a world of razor-sharp 0px radiuses, high-contrast typography, and intentional asymmetry that mirrors the precision engineering of a motorcycle.

The layout breaks the traditional grid through "Technical Overlays"—where data points and imagery bleed across section boundaries—creating a sense of mechanical movement. By prioritizing a "Black-out" canvas with aggressive Red and Gold accents, we evoke the visceral feeling of a garage at midnight or a dashboard at top speed.

## 2. Colors
Our palette is rooted in a "Deep Chrome" philosophy. While the UI is flat, the color application creates depth through tonal shifts rather than textures.

*   **The Foundation:** The core experience lives on `surface` (#131313). Use `surface_container_lowest` (#0e0e0e) for the most critical background areas to create a "void" that makes Gold and Red details pop.
*   **The "No-Line" Rule:** Standard 1px borders are strictly prohibited. Sectioning must be achieved through background shifts. For example, a telemetry module should use `surface_container` (#1f1f1f) sitting directly against the `surface` (#131313). The boundary is felt, not seen.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of machined parts.
    *   *Level 1 (Chassis):* `surface`
    *   *Level 2 (Engine Block):* `surface_container_low`
    *   *Level 3 (Controls):* `surface_container_high`
*   **The "Glass & Gradient" Rule:** To avoid a "cheap" flat look, use `surface_variant` (#353535) at 40% opacity with a `20px` backdrop blur for floating navigation elements. For primary CTAs, apply a subtle linear gradient from `primary` (#ffb4a8) to `primary_container` (#ff5540) to simulate the glow of an LED tachometer.

## 3. Typography
We utilize a dual-typeface system to balance technical precision with modern legibility.

*   **Display & Headlines (Space Grotesk):** This is our "Machined" font. Its geometric, wide stance should be used for high-impact data (e.g., RPM, Speed, Top Speed). Use `display-lg` for hero stats to create an editorial, "magazine-cover" feel.
*   **Body & Labels (Manrope):** Our "Technical" font. Manrope provides high legibility for maintenance logs and specs.
*   **The Hierarchy Role:** 
    *   **Headlines** capture the aggressive spirit of the brand. 
    *   **Labels** (using `label-md`) should frequently use `secondary` (Gold, #e9c349) in All-Caps with `0.05rem` letter spacing to denote "Premium Status" or "Warning" zones.

## 4. Elevation & Depth
In this system, elevation is not about "height" but about "illumination."

*   **The Layering Principle:** Depth is strictly managed by the surface-container tiers. To lift an element, move up the tier (e.g., a `surface_container_highest` card sitting on a `surface_container_low` track). 
*   **Ambient Shadows:** Traditional drop shadows are forbidden. If an element must float, use a "Light Leak" shadow: a `12px` blur with 4% opacity using the `primary` (Red) token. This mimics the ambient glow of a tail-light rather than a physical shadow.
*   **The "Ghost Border" Fallback:** If a boundary is required for accessibility in input fields, use `outline_variant` at 15% opacity. It should feel like a faint etching on a metal surface.
*   **Asymmetry:** Avoid centered layouts. Align heavy typographic elements to the far left (Spacing `8`) and let imagery or secondary data bleed off the right edge of the screen to suggest speed.

## 5. Components
All components adhere to the **0px Roundedness Scale**. Squares and rectangles only.

*   **Buttons:**
    *   *Primary:* `primary_container` background, `on_primary_container` text. High-contrast, sharp edges.
    *   *Secondary:* `outline` Ghost Border (20% opacity) with `secondary` (Gold) text.
*   **Input Fields:** Use `surface_container_high` as the base. No bottom line; instead, use a `2px` vertical accent of `primary` (Red) on the left edge only when the field is focused.
*   **Cards:** Forbid dividers. Use a `16` (3.5rem) vertical gap between content blocks. Use `surface_container_lowest` for the card body to create a "recessed" look into the dashboard.
*   **Telemetry Chips:** Small, rectangular blocks using `secondary_container` with `on_secondary_container` text for "Performance" metrics.
*   **The "Odometer" List:** For maintenance history, use `surface_container_low` and `surface_container_high` alternating backgrounds instead of divider lines.

## 6. Do's and Don'ts

### Do:
*   **Do** use extreme contrast. A `display-lg` headline should sit comfortably next to a `label-sm` detail.
*   **Do** use Gold (#e9c349) sparingly—only for "Winning" states, premium features, or critical mechanical alerts.
*   **Do** leverage the Spacing Scale `20` and `24` to create "Dead Space." High-end design requires room to breathe.

### Don't:
*   **Don't** use a single pixel of border-radius. Every corner must be a sharp 90-degree angle.
*   **Don't** use standard grey shadows. If it doesn't glow, it doesn't lift.
*   **Don't** use "Safety Blue" or other non-system colors. If it isn't Red, Gold, Black, or White, it doesn't belong on the bike.
*   **Don't** center-align long-form text. Keep it strictly left-aligned to maintain the "technical manual" aesthetic.