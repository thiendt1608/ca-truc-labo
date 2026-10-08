---
name: Ca Trực Labo
colors:
  surface: '#fff8f4'
  surface-dim: '#e6d7cc'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e7'
  surface-container: '#faebdf'
  surface-container-high: '#f5e6da'
  surface-container-highest: '#efe0d4'
  on-surface: '#211a13'
  on-surface-variant: '#5a413d'
  inverse-surface: '#372f27'
  inverse-on-surface: '#fdeee2'
  outline: '#8e706b'
  outline-variant: '#e2beb9'
  surface-tint: '#b4271d'
  primary: '#b1241a'
  on-primary: '#ffffff'
  primary-container: '#d43e30'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a9'
  secondary: '#0060ac'
  on-secondary: '#ffffff'
  secondary-container: '#68abff'
  on-secondary-container: '#003e73'
  tertiary: '#006a35'
  on-tertiary: '#ffffff'
  tertiary-container: '#008645'
  on-tertiary-container: '#f6fff4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4a9'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#910807'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a4c9ff'
  on-secondary-fixed: '#001c39'
  on-secondary-fixed-variant: '#004883'
  tertiary-fixed: '#7efba4'
  tertiary-fixed-dim: '#61de8a'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005228'
  background: '#fff8f4'
  on-background: '#211a13'
  surface-variant: '#efe0d4'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Quicksand
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.5px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-tablet: 1rem
  margin: 1rem
  margin-tablet: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

This design system crafts a cozy, tactile, and comforting simulation experience for mobile screens, capturing the warm everyday rhythm of a clinical laboratory technician. Drawing inspiration from heartwarming indie simulation titles like _Good Pizza, Great Pizza_, _Two Point Hospital_, and cozy shop managers, the visual direction transforms cold clinical instruments into friendly, squeezable laboratory toys.

The emotional signature is clean, approachable, and soothing—relieving hospital anxiety through creamy surfaces, rounded chunky silhouettes, satisfying tactile bottom-lip bevels on interactive buttons, and soft glowing status lights. Every panel feels like smooth laminated cardstock, an acrylic centrifuge casing, or a warm wood clipboard with brass clips.

The design movement mixes **Tactile/Skeuomorphic Toycore** with soft-edge **Modern Mobile Casual Gaming**:

- Tactile feedback: Chunky pressable components with visible solid shadow depths (simulating depressed rubberized plastic when tapped).
- Friendly clinical atmosphere: Off-white sterilized backgrounds softened with warm butter and oat milk undertones instead of harsh fluorescent blues.
- Delightful clarity: High-contrast department badges, crisp outline accents, and clear visual signaling for time-sensitive diagnostic tests.

## Colors

The palette balances clean clinical legibility with warm, cozy culinary-simulation tones. Rather than cold diagnostic monochromes, surfaces are built upon comforting dairy and paper bases, while vibrant department-specific tones categorize game loops and diagnostic stations.

### Primary Canvas & Base Tones

- **Warm Milk White (`#FAF8F5`)**: Primary canvas, dialogue card faces, and soft modal interiors.
- **Toasted Rice Cream (`#F5EFE6`)**: Container backgrounds, workbench backdrops, and bottom sheets.
- **Lab Countertop Oat (`#EADCC9`)**: Depressed states, slotted test-tube rack wells, and tab borders.
- **Deep Espresso Walnut (`#5D534A`)**: Neutral ink for primary Vietnamese body text, replacing harsh black with a soft, natural organic brown.

### Diagnostic Department Palette

- **Huyết Học (Hematology - Primary `#E74C3C`)**: Strawberry Coral. Used for blood smear analysis, centrifuges, urgent emergency specimens, and critical alerts.
- **Tiếp Nhận & Bệnh Án (Reception & Triage - Secondary `#4A90E2`)**: Periwinkle Sky. Used for patient intake forms, order tickets, transport tubes, and main navigation tabs.
- **Vi Sinh & Ký Sinh Trùng (Microbiology - Tertiary `#27AE60`)**: Matcha Leaf Green. Used for agar plates, culture incubator chambers, success validations, and clean hygiene badges.
- **Hóa Sinh (Biochemistry - Accent `#F39C12`)**: Warm Butter Amber. Used for serum assays, enzyme reagent drops, coin rewards, XP counters, and bonus energy.

### Color Hierarchy Rules

- Never use pure `#000000` for text or outlines. Solid shadows on buttons must use an intentional deep hue shift of the base color (e.g., Coral `#E74C3C` pairs with Bottom Edge `#B82E20`; Cream `#FAF8F5` pairs with `#DFCDB9`).
- Department colors must stay distinct across specimen racks to let players instantly parse sample urgency at a glance.

## Typography

Typography pairs the bouncy, rounded warmth of **Quicksand** for headlines, station signposts, and score summaries with the high-clarity Vietnamese diacritic support of **Be Vietnam Pro** for dialog text, reagent descriptions, patient symptoms, and technician instructions.

### Vietnamese Typographic Optimization

- `Be Vietnam Pro` guarantees balanced diacritical marks (dấu hỏi, ngã, nặng, sắc, huyền) without vertical clipping inside dense card containers or bottom-lip buttons.
- Display and headline levels in `Quicksand` maintain a gentle curvature that evokes friendly medical handbooks and cartoon laboratory manuals.
- Button labels and badge tags always use semibold to bold weights (`600`-`700`) to remain punchy and legible over bright game textures.
- Diacritics on uppercase buttons must retain explicit line height breathing room: all CTA buttons require at least 12px vertical padding to preserve mark aesthetics.

## Layout & Spacing

The game interface operates on a flexible vertical-first mobile viewport (9:16 / 9:19.5 aspect ratios) with responsive tablet expansion. The layout prioritizes an unobstructed central interactive simulation stage (the laboratory bench) while housing two persistent, tactile UI regions:

1. **Top Status Ribbon**: Displays laboratory shift progress (Thanh Thời Gian Ca Trực), coin wallet (Xu), energy (Ly Cà Phê), and lab reputation (Sao Uy Tín).
2. **Bottom Command Rack**: Displays the current active patient ticket queue, quick-access equipment hotkeys, and diagnostic tool selection trays.

### Adaptation Across Viewports

- **Compact Mobile (under 430px)**: Gutter space of `0.75rem` (`12px`) with tight outer margins (`16px`) maximize workspace view. Racks horizontally scroll with snapping pill cards.
- **Foldable & Tablet (600px - 840px)**: The screen reflows into a side-by-side cockpit layout: Patient Orders & Clipboard appear pinned to the left, while the interactive test benches (Centrifuge, Microscope, PCR incubator) occupy the right 60% of the canvas.
- Modals, popups, and clinical test result cards conform to a maximum reading width of 480px, centered with floating cozy drop shadows.

## Elevation & Depth

Depth in this design system avoids photorealistic blur shadows in favor of a playful, tactile **chunky 2.5D physical game toy** appearance. Layering relies on extruded rim bases, thick borders, and soft cream drop glows.

### The Tactile Shadow Layer System

- **Ground Floor (Lab Bench Surface)**: Flat warm oat background (`#F5EFE6`) with a subtle 2px solid downward offset of `#E4D5C1`.
- **Level 1 (Cards, Trays & Acrylic Racks)**: Resting white card stock (`#FAF8F5`) surrounded by an opaque 2px stroke in `#E8DC output` and a solid 4px downward bottom shelf (`box-shadow: 0 4px 0 #DFCDB9`).
- **Level 2 (Interactive Chunky Buttons)**: Primary UI buttons feature an extruded 5px bottom rim in a deeper complementary shade. Upon `active` (press down), the visual button translates down by 4px on the Y-axis while the bottom rim collapses to 1px, providing an instantaneous satisfying physical click feel.
- **Level 3 (Overlay Dialogues & Result Clipboards)**: Modal popups cast a warm, semi-diffuse ambient halo (`box-shadow: 0 12px 28px rgba(93, 83, 74, 0.22), 0 6px 0 #D4C3AE`), accompanied by a soft coffee-tinted scrim (`rgba(93, 83, 74, 0.45)`).

### Chibi Glowing Indicators

Electronic medical machinery (Microscope lamp, Hematology counter, Incubator timer) utilizes high-vibrancy inner light rims (`box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.8), 0 0 10px rgba(department_color, 0.5)`).

## Shapes

The shape system adopts fully rounded, pill-shaped geometries (`level 3`) to convey softness, safety, and cozy toy aesthetics. Sharp corners are strictly prohibited; laboratory equipment, test-tube vials, slide trays, and dialog boxes all feature plush, curved corners.

### Key Corner Radii

- **Full Pill (`9999px`)**: Interactive buttons, status chips, timer progress tracks, specimen tube caps, and navigation tags.
- **Rounded-XL (`24px / 1.5rem`)**: Equipment housings (centrifuge, incubator), main order sheets, dialog speech bubbles, and pop-up modal boards.
- **Rounded-LG (`16px / 1rem`)**: Specimen rack slots, microscope slide observation viewports, and inventory grid tiles.
- **Speech Bubble Tail**: Dialogue bubbles from the Senior Lab Mentor (Bác Sĩ Trưởng Khoa) feature rounded triangular nocks that blend smoothly into the speaker card.

## Components

### 1. Chunky 3D Pill Buttons

- **Default State**: Pill-shaped container (`height: 48px` to `56px`), colored in Department Primary (e.g., `#E74C3C` for Emergency Centrifuge action), featuring an internal top highlight shine (`inset 0 2px 0 rgba(255, 255, 255, 0.4)`) and a bold 5px bottom ledge (`box-shadow: 0 5px 0 #B82E20`).
- **Active / Pressed State**: `transform: translateY(4px)`; bottom ledge reduces to `0 1px 0 #B82E20`.
- **Disabled State**: Soft desaturated stone cream (`#DDD3C7`), flat 2px bottom ledge, no specular highlight.

### 2. Clipboard Medical Dialogues (Phiếu Y Lệnh)

- **Visual Container**: Styled like a miniature wooden clipboard with a rounded silver-gray acrylic clamp at the top.
- **Content Panel**: Cream paper card stock (`#FAF8F5`) with rounded corners (`16px`), faint dotted specimen divider lines, and patient avatar stamp.
- **Status Rubber Stamps**: Rotated angled stamp badges (`+12deg` or `-8deg`) in Hematology Red ("KHẨN CẤP" - STAT) or Microbiology Green ("ĐÃ CẤY" - Cultured) using high-contrast uppercase labels.

### 3. Tactile Specimen Test Tube Racks (Giá Đựng Ống Nghiệm)

- **Structure**: Slotted container with recessed oval wells (`#E5D9CB`) that feature an inset drop shadow (`box-shadow: inset 0 3px 3px rgba(93, 83, 74, 0.25)`).
- **Test Tubes**: Translucent pill vessels filled with liquid gradients matching department tints, capped with rubberized colorful stoppers (Lavender cap for Hematology, Amber cap for Biochemistry, Blue cap for Citrate/Reception).

### 4. High-Contrast Department Chips & Badges

- **Style**: Ultra-pill shaped (`height: 26px`), uppercase bold labels with clear emoji/micro-icons (e.g., `🩸 Huyết Học`, `🧪 Hóa Sinh`, `🧫 Vi Sinh`).
- **Coloring**: Saturated department background with high-contrast pure white text, framed by a soft tone-on-tone 1.5px boundary.

### 5. Glowing Chibi Equipment Indicators

- Small round status orbs (`12px * 12px`) embedded directly on instrument housings:
  - Ready / Sẵn sàng: Gentle pulsing matcha green light (`#27AE60`) with a faint aura.
  - In Progress / Đang ly tâm: Rotating warm butter amber chime (`#F39C12`).
  - Error / Cảnh báo: Playful bobbing coral alert (`#E74C3C`).

### 6. Tactile Checkboxes & Toggle Switches

- Checkbox elements resemble small rounded stamp squares (`24px * 24px`) that sink inward when selected, marked by a cheerful chunky teal checkmark.
- Toggles resemble tactile pill-shaped rocker switches with bouncy rubber knobs that slide with an audible toy 'thump'.
