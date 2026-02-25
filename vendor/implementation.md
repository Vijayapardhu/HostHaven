# HOSTHAVEN – Vendor Panel
## Phase-wise Implementation Plan (Copilot Guidance)

This document defines the exact development order and expectations for implementing the Vendor Panel frontend using:

- React + Vite
- TypeScript
- TailwindCSS
- shadcn/ui
- Axios
- Context API

All work must strictly follow PRD & TRD.

---

# PHASE 1 — Project Foundation

## Goal
Establish project configuration, environment handling, and base architecture.

## Tasks
- Create `.env.example`
- Configure Axios instance
- Create token storage service
- Setup Tailwind + shadcn
- Verify build runs without errors

## Files

```

src/lib/api.ts
src/services/tokenService.ts
.env.example

```

## Acceptance
- App builds
- API requests use base URL
- Token attaches automatically

---

# PHASE 2 — Authentication System

## Goal
Vendor login & session persistence.

## Tasks
- Create AuthContext
- Create VendorContext
- Create VendorProtectedRoute
- Implement VendorLogin page

## Files

```

src/contexts/AuthContext.tsx
src/contexts/VendorContext.tsx
src/components/guards/VendorProtectedRoute.tsx
src/pages/VendorLogin.tsx

```

## Acceptance
- Vendor logs in
- JWT stored
- Protected routes blocked without token

---

# PHASE 3 — Layout System

## Goal
Reusable vendor dashboard layout.

## Tasks
- Sidebar
- Header
- Footer
- Layout wrapper

## Files

```

src/components/layout/Header.tsx
src/components/layout/Sidebar.tsx
src/components/layout/Footer.tsx
src/pages/vendor/VendorLayout.tsx

```

## Acceptance
- Sidebar navigation works
- Layout wraps all vendor pages

---

# PHASE 4 — API Service Layer

## Goal
Centralize backend calls.

## Tasks
Create service files:

```

src/lib/auth.ts
src/lib/rooms.ts
src/lib/inventory.ts
src/lib/bookings.ts
src/lib/earnings.ts
src/lib/reviews.ts
src/lib/vendor.ts

```

Each file exports CRUD functions.

## Acceptance
- No direct axios usage inside pages

---

# PHASE 5 — Rooms Management

## Goal
Vendor can manage room types.

## Tasks
- List rooms
- Add room
- Edit room
- Delete room

## Files

```

src/pages/vendor/VendorRooms/
index.tsx
AddRoom.tsx
EditRoom.tsx
src/components/forms/RoomForm.tsx

```

## Acceptance
- CRUD works
- Validation present

---

# PHASE 6 — Inventory Calendar

## Goal
Vendor manages availability.

## Tasks
- Calendar UI
- Block dates
- Update availability

## Files

```

src/pages/vendor/VendorCalendar/
index.tsx
BlockDates.tsx
src/lib/inventory.ts

```

## Acceptance
- Blocking reflects backend data

---

# PHASE 7 — Bookings Management

## Goal
Vendor sees and inspects bookings.

## Tasks
- Booking list
- Booking detail view
- Status display

## Files

```

src/pages/vendor/VendorBookings/
index.tsx
BookingDetail.tsx
src/lib/bookings.ts

```

## Acceptance
- Booking list loads
- Detail page opens

---

# PHASE 8 — Reviews

## Goal
Vendor reads customer reviews.

## Tasks
- Fetch reviews
- Display rating + media

## Files

```

src/pages/vendor/VendorReviews.tsx
src/lib/reviews.ts

```

## Acceptance
- Reviews visible

---

# PHASE 9 — Earnings & Payouts

## Goal
Vendor views earnings and payout history.

## Tasks
- Earnings summary
- Payout history table

## Files

```

src/pages/vendor/VendorEarnings/
index.tsx
PayoutHistory.tsx
src/lib/earnings.ts

```

## Acceptance
- Earnings loaded
- Payout history visible

---

# PHASE 10 — Notifications

## Goal
Vendor sees system messages.

## Tasks
- Notification list
- Badge counter

## Files

```

src/pages/vendor/VendorNotifications.tsx
src/lib/notifications.ts

```

## Acceptance
- Notifications load

---

# PHASE 11 — Support Tickets

## Goal
Vendor contacts admin support.

## Tasks
- Create ticket
- List tickets

## Files

```

src/pages/vendor/VendorSupport.tsx
src/lib/support.ts

```

## Acceptance
- Ticket submit works

---

# PHASE 12 — UX & Reliability

## Goal
Polish UI.

## Tasks
- Loading skeletons
- Error toasts
- Confirm dialogs
- Empty states

## Acceptance
- No blank screens

---

# PHASE 13 — Security Hardening

## Goal
Prevent misuse.

## Tasks
- Auto logout on token expiry
- Button disable during submit
- Role validation

## Acceptance
- No unauthorized access

---

# PHASE 14 — Testing

## Goal
Ensure stability.

## Tasks
- Unit tests
- Integration tests

## Acceptance
- Core flows tested

---

# PHASE 15 — Production Build

## Goal
Prepare for deployment.

## Tasks
- Env setup
- Build optimization
- Smoke test

## Acceptance
- Build succeeds
- App deploys

---

END OF DOCUMENT
```