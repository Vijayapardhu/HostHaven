# HOSTHAVEN Vendor – Execution Plan from Current Codebase

Generated: 2026-02-25

## Inputs Reviewed
- `vendor/implementation.md`
- `prd.txt`
- `trd.txt`
- Current vendor source structure and core files (`src/App.tsx`, `src/lib/api.ts`, `src/contexts/VendorContext.tsx`, vendor pages)

## Current Status Summary
- Foundation is **partially implemented** (Vite, Tailwind, shadcn, API layer, vendor pages exist).
- Vendor panel routes are present in `src/App.tsx`.
- Vendor context and login flow exist.
- Major remaining work is **architecture cleanup + hardening + tests** to align with Implementation/PRD/TRD.

## Phase Gap Matrix (Implementation.md vs Current)

### Phase 1 — Foundation
- ✅ Present: `src/lib/api.ts`
- ❌ Missing: `.env.example`
- ❌ Missing: `src/services/tokenService.ts`
- ⚠️ Mismatch: API layer uses `fetch` service style, while stack says Axios

### Phase 2 — Authentication
- ✅ Present: `src/contexts/VendorContext.tsx`, `src/pages/VendorLogin.tsx`
- ❌ Missing: `src/contexts/AuthContext.tsx`
- ❌ Missing: `src/components/guards/VendorProtectedRoute.tsx`
- ⚠️ Risk: `/vendor/*` routes are not guarded in router

### Phase 3 — Layout
- ✅ Present: `src/pages/vendor/VendorLayout.tsx`
- ❌ Missing (as separate files): `src/components/layout/Header.tsx`, `Sidebar.tsx`, `Footer.tsx`
- ⚠️ Recommendation: keep current single layout unless explicit need to split

### Phase 4 — Service Layer
- ❌ Missing module split files:
  - `src/lib/auth.ts`
  - `src/lib/rooms.ts`
  - `src/lib/inventory.ts`
  - `src/lib/bookings.ts`
  - `src/lib/earnings.ts`
  - `src/lib/reviews.ts`
  - `src/lib/vendor.ts`
- ⚠️ Current state: large monolithic `src/lib/api.ts`

### Phases 5–11 — Feature Modules
- ✅ Vendor pages exist for rooms, bookings, calendar, reviews, earnings, notifications, support
- ⚠️ Mismatch vs target foldering in implementation doc (currently flat page files)
- ⚠️ Need to verify each page uses backend service layer and real data states
- ❌ Missing utility service files: `src/lib/notifications.ts`, `src/lib/support.ts`

### Phase 12 — UX Reliability
- ⚠️ Partially present (toasts exist)
- ❌ Need systematic loading/empty/error/confirm patterns across all vendor pages

### Phase 13 — Security
- ⚠️ Partial (token usage exists)
- ❌ Missing explicit token-expiry auto logout strategy
- ❌ Missing route-level role guard enforcement

### Phase 14 — Testing
- ❌ No vendor-focused unit/integration test setup found

### Phase 15 — Production Build
- ⚠️ Build scripts exist
- ❌ Need env contract + smoke checklist + release readiness checklist

## Recommended Execution Order (Concrete)

### Sprint A — Security + Auth Integrity (highest priority)
1. Add `.env.example` with required vendor keys
2. Create `src/services/tokenService.ts` and centralize token read/write/clear/expiry parse
3. Add `src/components/guards/VendorProtectedRoute.tsx`
4. Apply guard to `/vendor/*` routes in `src/App.tsx`
5. Implement auto-logout on 401/expired token in API layer

**Exit Criteria**
- No unauthenticated access to vendor routes
- Expired token always logs out and redirects to `/vendor/login`

### Sprint B — API Layer Refactor
1. Keep current behavior, split `src/lib/api.ts` by domain modules (`auth`, `vendor`, `rooms`, `inventory`, etc.)
2. Ensure pages never call raw fetch/axios directly
3. Add shared error mapper + typed response interfaces

**Exit Criteria**
- Domain-specific files exist and are used by pages
- API errors produce consistent user-friendly toasts

### Sprint C — Core Feature Hardening
1. Rooms CRUD validation and submission states
2. Inventory calendar block/unblock with backend sync
3. Bookings list/detail states and status mapping
4. Earnings + payout history consistency
5. Notifications and support API module integration

**Exit Criteria**
- All vendor core flows return live data and handle empty/loading/error states

### Sprint D — UX Reliability Pass
1. Add skeletons for list/detail pages
2. Add destructive-action confirm dialogs
3. Add empty-state components per module
4. Standardize submit button loading/disable behavior

**Exit Criteria**
- No blank or confusing failure state on any vendor route

### Sprint E — Testing + Release
1. Add unit tests for context, guard, token service, API mappers
2. Add integration tests for login → protected route → logout flow
3. Build + smoke checklist for all critical routes

**Exit Criteria**
- Core auth and vendor workflows are test-covered
- Production build and smoke pass

## MVP Guardrails from PRD/TRD (Must Enforce)
- Vendor role can only access own hotel data
- City scope for MVP data: Vijayawada, Nandiyala, Vetlapalem
- No vendor access to admin-only modules (homes/services/temples management)
- Inventory locking behavior must prevent double booking during payment window

## Next Action (Immediate)
Start with Sprint A and implement these four files/changes first:
- `.env.example`
- `src/services/tokenService.ts`
- `src/components/guards/VendorProtectedRoute.tsx`
- `src/App.tsx` route guard wiring
