# GCNM Roadmap

## Current — Preview reconciliation (19 Oct)
- [ ] Fix compilation errors preventing the updated code from validating
- [ ] Reconcile visible brand, repeated empty sections and crowded search filters with the redesign
- [ ] Verify the updated test site, navigation and search without publishing

## Current — Integral visual redesign (18 Oct)
- [x] Audit all existing pages and functional contracts
- [x] Renew shared visual system, navigation and discovery pages
- [x] Apply presentation updates to details, profiles, forms and informational pages
- [x] Validate existing routing test, public navigation, search, registration form toggle and mobile/desktop layouts
- [x] Add persistent mobile quick navigation, mobile search, source-platform labels and accessibility polish; CI tests and production build passed
- [ ] Validate authenticated publication, profile saving and populated detail flows — blocked: no auth users or active session; requesting user must sign in
- [x] Document verified flows and pre-existing limitations in REDESIGN-REPORT.md

## Stage 1 (in progress)
- [x] Design base, header/nav, home, explore
- [x] Auth (email + Google), public profiles, profile editor
- [x] Product publishing form + public product page
- [x] Reviews with moderation/report; affiliate links + click tracking
- [x] Static pages: empresas, freelancers, mapa, mensagens, planos, regras

## Stage 2 — Universal market (user brief 16 Oct)
- [x] External offers: link import with source platform/store/URL attribution, outbound redirect, last-updated date, duplicate detection
- [x] CSV import of external offers (preview, validation, duplicate check, and 100-row limit)
- [x] Purchase requests (RFQ) with supplier proposals, privacy of contact
- [~] Partner portal (dashboard with views/outbound clicks done; verification requests, store pages pending): stores, views/clicks stats, verification request
- [x] Initial explainable matching/ranking for buyer requests (category, city, country, same-currency budget, visible review rating)
- [x] Animated golden globe hero (lightweight, reduced-motion fallback)
- [ ] Sponsored placement labels, premium plans structure

## Later stages
- [ ] Chat (text, voice, files, calls via WebRTC)
- [ ] Currency converter, payments (PayPal/bank/mobile wallets) — need credentials
- [ ] Multilingual UI
- [ ] Map + GPS


## Validation
- [x] GitHub Actions: `bun run test`
- [x] GitHub Actions: `bun run build`
- [ ] Authenticated end-to-end verification against live Supabase data
