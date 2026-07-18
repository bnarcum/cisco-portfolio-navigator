# Acquisition Timeline Polish Design

## Goal

Make Acquisition History calm and legible on first open while preserving access to every acquisition. Replace unreliable guessed logos with verified marks or intentionally styled company-name tiles.

## Initial Experience

The timeline opens in an overview state spanning 1993 through the latest acquisition year.

- Six strategy-era bands remain visible as quiet background chapters.
- The timeline spine and year labels provide one predictable left-to-right path.
- Each year renders a compact count marker rather than every acquisition card.
- Acquisitions marked `featured: true` show logos in overview only when the logo is verified.
- Adjacent year markers use collision-aware spacing and never overlap.
- The minimap shows the full history and current viewport.

The overview is not a curated data subset. Every acquisition remains represented in its year count and becomes individually accessible through drill-down.

## Progressive Disclosure

The interface has three semantic zoom levels:

1. **Overview:** year counts plus verified marquee logos.
2. **Explore:** selecting a year or zooming in reveals every acquisition for the visible years in collision-free lanes.
3. **Focus:** selecting an acquisition opens its detail panel and visually emphasizes only that card.

Zoom transitions preserve the user's temporal anchor. Selecting a year centers it before expanding. Returning to overview restores the prior viewport instead of jumping to the beginning.

## Navigation

- Search by company name, business description, or year.
- Sticky current-year or current-decade label updates while scrolling.
- Previous and next controls move between acquisitions in chronological order.
- Clicking the minimap jumps to a date.
- `FIT` returns to overview.
- Filters remain available but move into a compact filter menu to reduce header clutter.
- Existing keyboard access and portfolio deep links remain supported.

## Logo Trust Policy

Logo states are explicit:

- **Verified:** sourced from an identifiable Wikipedia/Wikimedia page, official company/Cisco source, or manually reviewed asset.
- **Name tile:** generated typographic treatment used when no verified logo exists.

Guessed first-word-domain favicons are not treated as verified and are not shown as company logos. The manifest records source type, source URL when known, and verification status. The UI does not burden users with confidence badges on every card, but the detail panel exposes the logo source.

No acquisition is omitted because its historical logo cannot be verified.

## Visual and Motion Design

- Remove continuous bobbing from all cards.
- Keep subtle scroll-linked parallax on background era bands and ambient particles.
- Apply motion only to entry transitions, selected cards, and hover/focus states.
- Use one consistent card size in Explore view; marquee status is expressed through a restrained accent, not larger geometry.
- Reduce glass blur, shadows, and competing glow effects.
- Respect `prefers-reduced-motion` by disabling parallax and animated transitions.

## Layout and Collision Handling

Overview markers are laid out by year with minimum horizontal spacing. Explore cards use deterministic lanes calculated per visible time bucket. Cards never rely on item index alone for placement.

When density exceeds available space:

- Keep cards grouped under their correct year.
- Increase lane count within the viewport.
- If lanes are exhausted, use a local overflow indicator that expands that year.

The renderer mounts only visible years plus an overscan buffer, avoiding hundreds of continuously animated off-screen elements.

## Data Quality

- Normalize legal suffixes and known aliases before deduplication.
- Preserve both source records when Wikipedia and Cisco descriptions differ, while presenting one acquisition.
- Prefer Cisco's announced date and summary when available.
- Preserve Wikipedia value and country fields when Cisco omits them.
- Add automated checks for duplicate normalized names, invalid dates, missing visual identity, and logo manifest mismatches.

## Accessibility

- Every marker and card is keyboard reachable.
- Search and filters have visible labels.
- Focus remains in the timeline when changing zoom levels.
- Cards expose company, date, business, and value through accessible names.
- Motion reduction is honored.
- Logos are decorative when the company name is visible; generated name tiles do not duplicate screen-reader output.

## Verification

- Test overview at desktop, tablet, and narrow mobile widths for overlap.
- Assert all acquisitions are represented by year counts.
- Assert all acquisitions are reachable in Explore view.
- Assert no unverified favicon is rendered as a verified logo.
- Test search, year expansion, minimap jumps, zoom anchor preservation, keyboard navigation, light/dark themes, and reduced motion.
- Run the existing repository test suite and production/preview deployment verification.

## Scope

This change polishes the existing acquisition timeline. It does not redesign the portfolio graph, replace the acquisition sources, or manually recover every defunct company's historic logo.
