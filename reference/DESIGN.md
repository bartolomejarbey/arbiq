# Design System Document: The Noir Dossier

## 1. Overview & Creative North Star
**Creative North Star: The Investigative Editor**

This design system is not a standard software interface; it is a living dossier. It rejects the sterile, symmetrical "SaaS" aesthetic in favor of a 1940s film noir editorial experience. We are building a digital environment that feels hand-crafted, tactile, and heavy with narrative weight.

The system breaks the "template" look through **intentional asymmetry**, **overlapping physical layers**, and **high-contrast typography**. We treat the screen as a desk covered in evidence—each element is placed with purpose, occasionally rotated, and textured to feel like physical media. We move away from the "perfect grid" to create an experience that feels discovered, not just navigated.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the "Sepia Detective" aesthetic—deep, roasted tones punctuated by the glow of moonlight and the warmth of aged parchment.

### The Palette
*   **Background (Surface):** `#18120e` (Espresso) - The deep shadow of the office.
*   **Secondary/Cards (Surface-Container):** `#241B14` (Dark Coffee) - For nested information.
*   **Primary Accent:** `#C9986A` (Caramel) - Used for critical actions and discovery.
*   **Headlines:** `#D8DDE5` (Moonlight Off-white) - High contrast, ethereal.
*   **Body:** `#C4B59A` (Sepia Cream) - Low strain, vintage readability.
*   **Parchment Section:** `#EDE2CC` (Light Section BG) - For high-focus reading or "evidence" highlights.

### The "No-Line" Rule
Prohibit the use of 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background provides all the definition needed. If an element needs to stand out, use a **Tonal Transition** rather than a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of cardstock. 
- **Base Level:** `surface` (#18120e)
- **Nested Content:** Use `surface-container` tiers to create depth. A "case file" (card) should sit at `surface-container-high` to feel physically closer to the viewer than the desk it rests upon.

### The "Glass & Grain" Rule
To avoid a flat digital look, floating elements (modals, dropdowns) must use **Glassmorphism**. Apply semi-transparent surface colors with a heavy `backdrop-blur` (12px-20px) and a subtle **Paper Grain Overlay**. This makes the interface feel like translucent vellum rather than plastic.

---

## 3. Typography
The typography scale is designed to mimic a high-end vintage periodical. It balances the dramatic flair of a detective novel with the technical precision of a typewriter.

*   **Display & Headlines (Playfair Display, 900, Italic):** These must be huge and dramatic. Use `display-lg` (3.5rem) for main titles. The heavy weight and italic slant provide the "Noir" authority.
*   **Body (Inter, 300-400):** Provides a modern, highly legible counterpoint to the headlines. Keep line heights generous (1.6) to maintain an editorial feel.
*   **Labels (IBM Plex Mono, Uppercase, Wide Spacing):** Used for metadata, stamps, and "Case File" numbering. The monospaced nature suggests typewriter input. Use `letter-spacing: 0.15em`.

---

## 4. Elevation & Depth
In this system, depth is achieved through **Tonal Layering** and **Physical Displacement**, not standard drop shadows.

*   **The Layering Principle:** Stack `surface-container` tiers. Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural "lift."
*   **Ambient Shadows:** For floating "Evidence" (modals), use extra-diffused shadows. 
    *   *Spec:* `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);`
    *   Shadows should never be pure black; they should be a deeper tint of the `background` color.
*   **Asymmetric Rotation:** To break the digital grid, apply a subtle rotation to secondary cards or images (`rotate: 1deg` or `-1.5deg`). This mimics the way photos are tossed onto a desk.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at 15% opacity. Never use 100% opaque, high-contrast strokes.

---

## 5. Components

### Buttons (The "Wax Seal" & "Stamp")
*   **Primary:** Solid `primary` (#C9986A) with `on-primary` text. No rounded corners (`0px`). On hover, transition to `primary-container`.
*   **Secondary:** A "Marker Underline" style. Transparent background, `primary` text, with a 4px `primary` underline that looks hand-drawn using a CSS `mask-image` or a subtle SVG brush stroke.

### Input Fields (The "Typewriter" Field)
*   **Style:** No background box. Only a bottom border using `outline-variant`.
*   **Label:** `label-sm` (IBM Plex Mono) sitting above the line.
*   **Focus State:** The bottom border transforms into a `primary` color "marker" stroke.

### Cards & Lists (The "Dossier" Stack)
*   **Rule:** Forbid divider lines. Use vertical whitespace or a subtle background shift (`surface-container-low` vs `surface-container-highest`).
*   **Interactions:** On hover, a card should not "glow"; it should subtly shift its rotation by 1 degree, as if being adjusted by hand.

### Unique Components
*   **The Vintage Stamp:** A status indicator (e.g., "RESOLVED", "URGENT") styled as a red (`rust-red`) ink stamp, slightly faded and rotated.
*   **The Case Folder:** A container with a "tab" at the top-left, using `surface-container-high`, acting as a grouping mechanism for related data.

---

## 6. Do's and Don'ts

### Do:
*   **Do** embrace asymmetry. If you have a three-column layout, make one column slightly wider or offset its vertical starting point.
*   **Do** use "Moonlight" (#D8DDE5) sparingly for headlines to create a focal point against the dark "Espresso" background.
*   **Do** apply a global "Film Grain" texture at 3% opacity over the entire UI to kill the "flat pixel" look.

### Don't:
*   **Don't** use border-radius. This system is built on hard, sharp edges (0px) to mimic cut paper and folders.
*   **Don't** use standard "Bento Grids." Avoid perfectly aligned boxes of equal size. Overlap elements where possible.
*   **Don't** use pure white or pure black. Every color must feel aged, tinted by tobacco smoke or moonlight.