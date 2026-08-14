# Blood Donor Finder — End-to-End Development Plan (MERN)

Based on the flow: Hospital submits requirement → System finds eligible donors → Notifies donors → Donor accepts/rejects → Eligibility test → Hospital contacts donor → Donation → Request closed.

---

## 1. User Roles

| Role | Purpose |
|---|---|
| **Hospital** | Raises blood requests, views donor responses, confirms eligibility, closes requests |
| **Donor** | Registers profile, receives requests, accepts/rejects, tracks donation history |
| **Admin (optional, v2)** | Verifies hospitals, monitors abuse, views system-wide stats |

---

## 2. Page-by-Page Breakdown (React Frontend)

### Public / Auth
- **Landing Page** — what the app does, CTA: "Register as Donor" / "Register as Hospital"
- **Login Page** — role-based login (donor/hospital), JWT-based
- **Register Page (Donor)** — name, blood group, phone, location (lat/lng via browser geolocation or manual pin), age, last donation date, medical eligibility flags (checkbox self-declaration)
- **Register Page (Hospital)** — hospital name, registration ID, address, contact person, phone

### Donor Side
- **Donor Dashboard** — availability toggle (Available/Not Available), current active request (if any), donation history list
- **Incoming Request Page/Modal** — maps to Step 3–4: blood group needed, units, hospital name, distance, urgency; Accept / Reject buttons
- **My Donations Page** — history table: date, hospital, units, status

### Hospital Side
- **Hospital Dashboard** — list of active + past requests, "New Request" button
- **New Blood Request Form** — maps to Step 1: blood group, units required, location, urgency level, notes
- **Request Tracking Page** — maps to Steps 3–9: live status per request (Searching → Donor Found → Awaiting Eligibility → Confirmed → In Progress → Completed/Closed), list of donors who responded, ETA once accepted
- **Donor Eligibility Check Page** — maps to Step 5B: hospital marks donor Eligible/Not Eligible after physical screening
- **Request History Page** — closed requests archive

### Shared
- **Profile/Settings Page**
- **Notifications Page** — in-app log of all alerts sent/received (maps to Step 3)

---

## 3. Core UI Elements Needed

- Status badge component (color-coded: Pending / Searching / Accepted / Rejected / Eligible / Confirmed / Completed) — mirrors your flowchart's color coding (orange/purple/green/red)
- Distance/ETA display card
- Real-time notification toast/bell icon with unread count
- Accept/Reject action buttons with confirmation dialog
- Map view (optional, using Leaflet/Google Maps) showing hospital + nearby donors
- Timeline/stepper component showing request progress (great visual match for your diagram — steps 1→9)

---

## 4. Data Models (MongoDB Collections)

**users** (donors)
```
{ _id, name, phone, email, passwordHash, bloodGroup, location: { type: "Point", coordinates: [lng, lat] },
  isAvailable, lastDonationDate, age, role: "donor", createdAt }
```

**hospitals**
```
{ _id, name, regId, address, location: { type: "Point", coordinates: [lng, lat] }, contactPerson, phone, role: "hospital", verified }
```

**bloodRequests**
```
{ _id, hospitalId, bloodGroup, unitsNeeded, urgency, radiusKm, status: "searching|donor_found|eligibility_pending|confirmed|in_progress|completed|closed",
  matchedDonors: [ { donorId, notifiedAt, response: "pending|accepted|rejected", eligibility: "pending|eligible|not_eligible" } ],
  acceptedDonorId, createdAt, closedAt }
```

**notifications**
```
{ _id, requestId, donorId, message, status: "sent|read|responded", createdAt }
```

Use a **2dsphere geospatial index** on `location` in both `users` and `hospitals` — this is what powers Step 2 ("find eligible donors within 20–30 min radius") via MongoDB's `$geoNear` / `$nearSphere`.

---

## 5. Backend Architecture (Node.js + Express)

```
server/
 ├── models/        (User, Hospital, BloodRequest, Notification)
 ├── routes/
 ├── controllers/
 ├── middleware/    (auth.js - JWT verify, role check)
 ├── services/
 │    ├── matchingService.js   → geospatial donor search logic
 │    └── notifyService.js     → push/socket notifications
 ├── sockets/       (Socket.IO handlers)
 └── server.js
```

### Matching Logic (Step 2 in your diagram)
1. Hospital submits request → controller saves it with status `searching`
2. `matchingService` runs a `$geoNear` query on `users` filtered by `bloodGroup` match, `isAvailable: true`, within radius (convert 20–30 min → approx km, e.g. 5–8km depending on locality)
3. Sorted by distance → top N donors selected as `matchedDonors`
4. `notifyService` fires real-time alerts to those donors (Step 3)
5. If a donor rejects or doesn't respond in X minutes (timeout job), system automatically searches the **next** eligible donor — this is your "Repeat until a donor accepts" loop. Implement via a scheduled job (node-cron) or a simple TTL/timeout check.

---

## 6. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register donor/hospital |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/requests` | Hospital creates blood request (Step 1) |
| GET | `/api/requests/:id` | Get request status/details |
| GET | `/api/requests/hospital/:hospitalId` | List hospital's requests |
| POST | `/api/requests/:id/match` | Trigger donor search (Step 2) — usually auto-called internally |
| GET | `/api/donors/:donorId/requests` | Donor's incoming requests |
| POST | `/api/requests/:id/respond` | Donor accepts/rejects (Step 4/5A/5D) — body: `{ donorId, response }` |
| PATCH | `/api/requests/:id/eligibility` | Hospital marks eligibility result (Step 5B/5C) |
| PATCH | `/api/requests/:id/contact` | Hospital confirms contact + ETA (Step 6) |
| PATCH | `/api/requests/:id/complete` | Mark donation completed (Step 8) |
| PATCH | `/api/requests/:id/close` | Close request (Step 9) |
| GET | `/api/notifications/:donorId` | Donor's notification log |

All protected routes use JWT middleware; role-based guards (`requireRole('hospital')` / `requireRole('donor')`) enforce who can call what.

---

## 7. Real-Time / "Live Call" Setup

The notification loop (Steps 3→4→5D→repeat) needs to be live, not polling-based, for a good UX.

**Recommended: Socket.IO**
- Server maintains a map of connected donor sockets (`donorId → socket.id`) on login/connect
- When `matchingService` selects donors, backend emits `io.to(socket.id).emit("new_blood_request", payload)`
- Donor client listens: `socket.on("new_blood_request", cb)` → shows modal
- Donor's accept/reject emits back `socket.emit("respond_request", {...})` or via REST call, then server broadcasts status update to hospital's socket room: `io.to(hospitalSocketId).emit("request_updated", payload)`
- Hospital dashboard listens for `request_updated` to refresh the tracking page live without reload

**Fallback for offline donors:** integrate a push notification service (Firebase Cloud Messaging) or SMS (Twilio) so donors not actively in-app still get alerted — important for a real blood-request use case where speed matters.

**Connection flow:**
1. Frontend connects socket on login: `io(SERVER_URL, { auth: { token } })`
2. Server middleware in Socket.IO verifies JWT before allowing connection, attaches `userId`/`role` to socket
3. Donor auto-joins room `donor_<id>`, hospital auto-joins `hospital_<id>`
4. All targeted emits use these rooms, not raw socket ids (more reliable on reconnect)

---

## 8. Tracking Mechanism (Request Lifecycle)

Maintain a single `status` field on `bloodRequests` plus a `statusHistory` array for audit/timeline display:
```
statusHistory: [ { status, timestamp, note } ]
```
This directly powers the stepper UI on the Hospital's "Request Tracking Page" and gives you an activity log for debugging the matching/timeout logic later.

Status transitions map exactly to your diagram:
`searching → donor_found → eligibility_pending → confirmed → in_progress → completed → closed`
(with a branch back to `searching` whenever a donor rejects/times out)

---

## 9. Suggested Build Order (fits your 30-day MERN plan)

1. Auth (donor + hospital register/login, JWT)
2. Data models + basic CRUD for requests (no matching yet)
3. Static donor dashboard + hospital dashboard (dummy data)
4. Geospatial matching service (core logic — this is the heart of the app)
5. Socket.IO live notifications + accept/reject flow
6. Eligibility → contact → complete → close flow (status transitions)
7. Notification history + polish UI (status badges, stepper, toasts)
8. (Optional) Map view, SMS/FCM fallback, admin panel

Want me to start with the data models + auth setup as actual code, or would you rather I walk you through the geospatial matching logic in more depth first since that's the trickiest part?