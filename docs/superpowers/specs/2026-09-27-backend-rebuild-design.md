# popbop Backend Rebuild — Design

## Context

The popbop frontend (this repo) is a React video-library app that depends on a REST
backend via `REACT_APP_API_URL` for everything except the initial page shell: login,
registration, the video catalog, liked videos, watch-later, watch history, and
playlists.

The original backend lived on Replit at `popbop-backend.snehaamruth.repl.co`. That
domain no longer resolves in DNS — the backend is permanently gone (confirmed with
`dig`/`curl` during this session; old free-tier Replit apps on the deprecated
`*.repl.co` domain scheme are routinely spun down). There is no other copy of the
backend source in this repo, its git history, or its `popbop-PR` branch.

This spec covers rebuilding a replacement backend that satisfies the frontend's
existing API contract exactly, so none of the already-fixed frontend code needs to
change again.

## Goals

- Restore full functionality: login/register, browsing videos, liking, watch-later,
  history, and playlists.
- Match the frontend's existing request/response contract exactly (verified against
  `src/utils/CallRestAPI.jsx` and every consumer: `auth-context.jsx`,
  `playlist-context.jsx`, `Home.jsx`, `VideoDetailPage.jsx`, `Playlists.jsx`,
  `Modal.jsx`).
- Ship on a free hosting tier with minimal setup (personal/demo project, not a
  production service).
- Add basic ownership checks the original backend likely lacked, without changing
  any frontend-visible behavior.

## Non-goals

- No changes to the React frontend's routes, components, or response-shape
  assumptions.
- No production-grade persistence guarantees (data loss on redeploy is accepted,
  see Data store below).
- No admin UI for managing the video catalog — the catalog is seeded once at boot
  from the existing static list in `src/Database.js`.

## Architecture

A single Node.js + Express service in a new `backend/` subfolder of this repo,
using `better-sqlite3` for storage, `bcrypt` for password hashing, and
`jsonwebtoken` for auth tokens. CORS is restricted to the deployed frontend origin
(configurable via env var). Deployed to Render as its own web service with root
directory `backend/`.

```
backend/
  src/
    index.js          # express app, CORS, route mounting, error handling
    db.js              # sqlite connection + schema init + idempotent seed data
    middleware/auth.js # verifies JWT from Authorization header, sets req.userId
    routes/
      users.js         # POST /api/user/login, POST /api/user/register
      videos.js        # GET /api/video, GET /api/video/:videoId
      playlists.js     # /api/playlist, /api/playlist/:playlistId[/:videoId]
      liked.js          # POST|DELETE /api/liked/:videoId
      watchLater.js     # POST|DELETE /api/watch-later/:videoId
      history.js        # POST /api/history/:videoId, GET /api/default
  package.json
  render.yaml          # optional infra-as-code for Render
```

## Data model (SQLite)

```sql
users (
  id TEXT PRIMARY KEY,
  firstName TEXT, lastName TEXT,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt TEXT NOT NULL
)

videos (
  id TEXT PRIMARY KEY,
  title TEXT, channelName TEXT, thumbnail TEXT,
  channelImgUrl TEXT, videoUrl TEXT, viewCount INTEGER
)

playlists (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL
)

playlist_videos (
  id TEXT PRIMARY KEY,
  playlistId TEXT NOT NULL REFERENCES playlists(id),
  videoId TEXT NOT NULL REFERENCES videos(id),
  addedAt TEXT NOT NULL
)

liked_videos (
  userId TEXT NOT NULL REFERENCES users(id),
  videoId TEXT NOT NULL REFERENCES videos(id),
  addedAt TEXT NOT NULL,
  PRIMARY KEY (userId, videoId)
)

watch_later_videos (
  userId TEXT NOT NULL REFERENCES users(id),
  videoId TEXT NOT NULL REFERENCES videos(id),
  addedAt TEXT NOT NULL,
  PRIMARY KEY (userId, videoId)
)

history_videos (
  userId TEXT NOT NULL REFERENCES users(id),
  videoId TEXT NOT NULL REFERENCES videos(id),
  watchedAt TEXT NOT NULL
  -- no unique constraint: rewatches append a new row
)
```

- IDs are UUID strings (via `crypto.randomUUID()`). The frontend never assumes a
  specific `_id` format (it currently uses non-Mongo `react-uuid` values in the
  unused static `Database.js` list already), so a UUID string is a safe match.
- On boot, if the `videos` table is empty, seed it with the 13 videos currently
  hardcoded in `src/Database.js` (same titles/thumbnails/urls/view counts, new
  UUIDs). Seeding is idempotent — checked by table emptiness, not run
  unconditionally, so restarts never duplicate rows.
- On boot, if no user with email `testuser@gmail.com` exists, create it with
  password `testuser@12` (bcrypt-hashed like any other registration) so the
  frontend's "Use Guest Credentials" button works immediately for anyone trying
  the deployed demo.

## Auth flow

- **Register** — `POST /api/user/register` `{firstName, lastName, email, password}`.
  Validates all fields are present and email is well-formed (defense in depth;
  frontend already validates this too). Hashes password with bcrypt (10 rounds).
  On duplicate email: `{success: false}`, HTTP 409. On success: creates the user,
  issues a JWT (`{userId}`, signed with `JWT_SECRET`, 7-day expiry), returns
  `{success: true, token, data: {userId, email, username: "<firstName> <lastName>"}}`.
- **Login** — `POST /api/user/login` `{email, password}`. Looks up by email,
  compares password with bcrypt. Wrong email or password: `{success: false}`,
  HTTP 401. On success: same response shape as register.
- **Auth middleware** — reads the `Authorization` header as the raw JWT (no
  `Bearer ` prefix — matches the existing frontend axios interceptor exactly),
  verifies it, sets `req.userId`. Applied to every route except
  `POST /api/user/login`, `POST /api/user/register`, `GET /api/video`, and
  `GET /api/video/:videoId` (those four stay public, matching how the frontend
  calls them regardless of login state). Missing/invalid token on a protected
  route: `{success: false}`, HTTP 401.
- **JWT secret** — read from `process.env.JWT_SECRET` at boot; the process exits
  with a clear error message if it's unset. Never hardcoded. Set as a Render
  environment variable/secret, generated once during setup.

## Route behaviors (exact contract match with the existing frontend)

| Route | Auth | Behavior |
|---|---|---|
| `GET /api/video` | No | `{success:true, data:[video]}` — all videos |
| `GET /api/video/:videoId` | No | `{success:true, data:video}`, or `{success:false}` HTTP 404 if not found |
| `GET /api/default` | Yes | `{success:true, data:{likedVideos, watchLater, historyVideos}}` — each an array of full video objects (joined) for `req.userId` |
| `GET /api/playlist` | Yes | `{success:true, data:[playlist]}` — each playlist includes `playlistVideos:[{_id, video}]` (joined), scoped to `req.userId` |
| `POST /api/playlist/:videoId` body `{name}` | Yes | Creates a playlist named `name` owned by `req.userId`. The `:videoId` URL segment is unused — this matches the current frontend, which calls this route from `Modal.jsx` to create an empty playlist, never to attach a video at creation time. Returns `{success:true, data:newPlaylist}` |
| `DELETE /api/playlist/:playlistId` | Yes | Deletes the playlist and its `playlist_videos` rows. HTTP 403 `{success:false}` if the playlist isn't owned by `req.userId` |
| `POST /api/playlist/:playlistId/:videoId` | Yes | Adds the video to the playlist (ownership-checked, 403 as above). `{success:true}` |
| `DELETE /api/playlist/:playlistId/:videoId` | Yes | Removes the video from the playlist (ownership-checked). `{success:true}` |
| `POST /api/liked/:videoId` | Yes | Adds to `liked_videos` for `req.userId`. `{success:true, data:video}` — the single toggled video, NOT the updated list (see correction below) |
| `DELETE /api/liked/:videoId` | Yes | Removes from `liked_videos`. `{success:true, data:video}` — same single-video shape |
| `POST /api/watch-later/:videoId` | Yes | Adds to `watch_later_videos`. `{success:true, data:video}` — single video, not the updated list |
| `DELETE /api/watch-later/:videoId` | Yes | Removes from `watch_later_videos`. `{success:true, data:video}` — single video |
| `POST /api/history/:videoId` | Yes | Appends a row to `history_videos`. `{success:true, data:video}` — the single video, not an empty body |

**Correction (found during final implementation review, fixed in commit `be2873b`):**
the original version of this table specified `data:updatedLikedList` / `data:updatedList` for
the liked/watch-later toggle routes, and no `data` field at all for the history route. That
was wrong — it did not match the frontend's actual contract. `src/context/playlist-context.jsx`'s
`handleToggle` dispatches `payload: data` directly, and `src/context/playlistReducer.jsx`'s
`ADD_TO_LIKED`/`ADD_TO_WATCH_LATER`/`ADD_TO_HISTORY` do `[...list, action.payload]` (expecting
one video object), while the `REMOVE_FROM_*` actions do `.filter(v => v._id !== action.payload._id)`
(also expecting one object, not a list). Returning the full list or omitting `data` corrupted
client state after every like/watch-later/history action. All five routes now return the single
toggled video's DTO in `data`, with a 404 if the video id doesn't exist.

Ownership checks on playlist mutation routes are a deliberate addition beyond
whatever the original backend did — they close an obvious gap (any authenticated
user could otherwise mutate another user's playlist by guessing its ID) without
changing any frontend-visible behavior for the legitimate case.

## Error handling

- Every route handler is wrapped in try/catch. Unexpected errors are logged
  server-side (never leak stack traces to the client) and return
  `{success: false}` with HTTP 500.
- Validation failures (missing fields, malformed email) return `{success: false}`
  with HTTP 400.
- This preserves the frontend's existing `if (success) {...} else {...}` branches
  everywhere, unchanged — the frontend never inspects HTTP status text, only the
  `success` boolean in the JSON body (per `CallRestAPI.jsx`'s existing behavior,
  already fixed this session to always return `{success, data}` on the client
  side even when a request throws).

## CORS

`cors` middleware allowlisting exactly one origin, read from
`process.env.ALLOWED_ORIGIN` (set to `https://popbop.netlify.app` in Render, and
`http://localhost:3000` added for local dev via a second allowed value or a
dev-only env override).

## Deployment (Render)

- New Render web service, root directory `backend/`, build command `npm install`,
  start command `node src/index.js`.
- Env vars set in the Render dashboard: `JWT_SECRET` (generated secret),
  `ALLOWED_ORIGIN=https://popbop.netlify.app`.
- The SQLite file lives on Render's ephemeral disk for the free tier — it resets
  on every redeploy. Seed data (13 videos + guest user) re-runs automatically on
  each boot, so the app is always left in a working demo state after any deploy;
  the tradeoff is that user-created accounts/playlists/likes do not survive a
  redeploy. This was an explicit, accepted tradeoff when choosing SQLite over a
  managed database for this personal/demo project.
- After the backend is deployed and its URL is known, `REACT_APP_API_URL` must be
  set in the **Netlify** dashboard for the frontend site (a Netlify config change,
  not a repo change) to point at the new Render service URL, then the Netlify
  site redeployed/rebuilt to pick it up.

## Testing Requirements

- Given valid register fields, `POST /api/user/register` creates a user and
  returns a token.
- Given a duplicate email, `POST /api/user/register` returns `{success:false}`
  with HTTP 409.
- Given the seeded guest credentials (`testuser@gmail.com` / `testuser@12`),
  `POST /api/user/login` returns `{success:true, token, data}`.
- Given an incorrect password for an existing email, `POST /api/user/login`
  returns `{success:false}` with HTTP 401.
- Given no `Authorization` header, a protected route (e.g. `GET /api/playlist`)
  returns `{success:false}` with HTTP 401.
- Given a valid token, `GET /api/video` and `GET /api/default` both succeed and
  return seeded data.
- Given user A's valid token, `DELETE` on user B's playlist ID returns
  `{success:false}` with HTTP 403 and does not delete the playlist.
- Given a video is liked via `POST /api/liked/:videoId` and then unliked via
  `DELETE /api/liked/:videoId`, a subsequent `GET /api/default` reflects both
  the addition and the removal.
- Given `POST /api/liked/:videoId` (or `DELETE`, or `POST /api/watch-later/:videoId`,
  or `POST /api/history/:videoId`) succeeds, the response's `data` field is the
  single toggled video object (matching `_id` to the requested `videoId`), never
  an array and never absent — this is what the frontend's reducer dispatches
  directly into its state.
- Given the server restarts against an empty database, boot seeds exactly 13
  videos and 1 guest user; given it restarts again against a non-empty database,
  no duplicate rows are inserted.
- Given a request from an origin other than `ALLOWED_ORIGIN`, the response lacks
  CORS headers permitting it (browser blocks the request).

## Out of scope / explicitly deferred

- Persistent storage across redeploys (would require a managed DB — deferred per
  the SQLite tradeoff above).
- Rate limiting / brute-force protection on login (acceptable for a personal demo
  project; would be a follow-up if this became a real service).
- Any frontend code changes — this spec is backend-only by design.
