# Acquisition Timeline Final Fix Report

## Commit

- Implementation: `9ccb166` (`fix acquisition timeline review findings`)
- This report is committed separately in the commit containing this file.

## Changed Files

- Timeline behavior and accessibility: `assets/cpn-acquisitions-timeline.js`, `assets/cpn-acquisitions-timeline.css`
- Data ingestion and logo pipeline: `scripts/build-acquisitions.mjs`, `scripts/fetch-acq-logos.mjs`, `package.json`
- Offline regression coverage: `scripts/test-acquisitions-data.mjs`, `scripts/test-acquisitions-timeline.mjs`, `scripts/fixtures/wikipedia-acquisitions-table.html`
- Regenerated canonical data/provenance: `assets/cpn-acquisitions.json`, `assets/cpn-acquisitions-data.js`, `assets/acq-logos/manifest.json`
- New canonical fallback tiles: `assets/acq-logos/galileo.svg`, `assets/acq-logos/internet-engineering.svg`

## Findings Resolved

- FIT now clears focused/expanded state, hides and inerts the focus panel, restores the left-aligned overview viewport, and renders without overlaps.
- Clearing focus hides/inerts all panel controls and restores focus to the originating card or timeline region.
- Canonical deduplication applies legal suffix removal iteratively and resolves explicit aliases such as WebEx Communications → WebEx. Cisco date/summary precedence and Wikipedia country/value retention remain intact.
- Wikipedia parsing uses discovered headers, propagates rowspans, decodes named/numeric entities, and identifies country/value semantically. Offline fixtures cover Linksys, entities, missing values, and rowspans.
- `build:acquisitions` now runs provisional build → logo fetch → final build, allowing new identities before the manifest exists and embedding final provenance afterward.
- Guessed favicon promotion was removed. Newly fetched Wikipedia images are unverified candidates and retain name tiles until reviewed; only the existing provenance allowlist can render a verified logo.
- The minimap is a labeled keyboard slider with Arrow/Home/End support and live value metadata.
- The acquisition search combobox supports ArrowUp/Down, Home/End, Enter, Escape, selected-option state, and `aria-activedescendant`.
- Dead cluster/filter-chip CSS and unused scroll-velocity state were removed.

## Verification

- `npm run build:acquisitions` — PASS; 233 Wikipedia rows + 225 Cisco rows → 265 canonical acquisitions; final manifest persisted and final data rebuilt.
- `npm run test:acquisitions-data` — PASS; `OK test-acquisitions-data (265 acquisitions)`.
- `npm run test:acquisitions-timeline` — PASS; `OK test-acquisitions-timeline`.
- `npm run test:shortcuts` — PASS; `OK test-shortcuts-modal`.
- `npm test` — PASS; all 24 chained repository test scripts exited 0.
- `git diff --check` — PASS.
- IDE lint diagnostics for all edited JS/CSS/test files — no errors.

TDD red evidence: the new data tests first failed on Linksys semantics, entity/rowspan handling, alias pairs, and normalized duplicates; the new FIT regression first timed out waiting for overview because focused state was retained. Both suites passed after implementation.

## Data and Dedup Evidence

- Canonical count changed from 282 to 265 by merging 17 normalized alias/suffix duplicates.
- Normalized-name/date duplicates: 0.
- Dual-source canonical records: 193.
- Monetary strings parsed as country: 0.
- Linksys: one `linksys` record, `2003-03-20`, `United States`, `$500,000,000`, sources `wikipedia` + `cisco`.
- WebEx: one `webex` record with both sources.
- Jasper: one `jasper` record with both sources.
- Timeline coverage tests confirm every canonical record remains represented by overview year counts and reachable through Explore/overflow expansion.

## Self-Review and Concerns

- Reviewed focus lifecycle, keyboard event propagation, generated identity policy, canonical merge precedence, and regenerated manifest/data consistency.
- Tests do not use live network; only the explicit build command does.
- The Wikipedia parser intentionally avoids a dependency, so a major upstream table/schema redesign may require fixture and parser updates. Semantic validation now fails fast instead of silently shifting monetary data into country.
- Existing four reviewed Wikipedia logos remain verified. Automated candidates are never promoted without review.
- No credentials, certificates, cryptographic material, or new third-party dependencies were introduced.
