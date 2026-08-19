# CampusConnect

CampusConnect is a simple campus collaboration platform where college students can create projects, find teammates, and request to join teams based on their skills.

This is a resume / interview demo project built with the MERN stack and Clerk authentication. It is intentionally small: no chat, webhooks, notifications, file uploads, or AI.

## Features

- **Clerk authentication** — sign up, sign in, sign out, and protected routes
- **Lazy user creation** — the first `GET /api/users/me` after login creates a MongoDB profile if one does not exist (no Clerk webhooks)
- **Student profile** — name, email, college, branch, year, bio, skills, interests, GitHub, LinkedIn
- **Predefined skills only** — skills are selected from clickable pills so matching stays exact
- **Create project** — creator is added as the first member
- **Browse / search** — open projects only, search by title, filter by category
- **Project details** — join button states for owner, member, pending, and non-member
- **Join requests** — owners can accept or reject; a full team auto-closes and remaining pending requests are rejected
- **Simple skill matching** — `(matched / required) * 100`
- **Dashboard** — welcome, metrics, created projects, and application status tracking

## Tech stack

| Layer | Tech |
| --- | --- |
| Frontend | React (Vite), Tailwind CSS, React Router, Axios, Clerk React, Lucide React |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Auth | Clerk |

JavaScript only (no TypeScript).

## Database schema

Three collections.

### Users

```js
{
  _id,
  clerkId,      // unique, from Clerk
  name,
  email,
  college,
  branch,
  year,
  bio,
  skills: [],
  interests: [],
  github,
  linkedin
}
```

Passwords are never stored. Clerk owns authentication.

### Projects

```js
{
  _id,
  title,
  description,
  category,
  requiredSkills: [],
  creatorId,
  members: [],
  teamSize,
  isOpen,       // false when members.length == teamSize
  deadline,
  createdAt
}
```

### Join Requests

```js
{
  _id,
  projectId,
  studentId,
  status,       // "pending" | "accepted" | "rejected"
  createdAt
}
```

## API

All `/api` routes except `/api/health` require a Clerk session token.

### Users

- `GET /api/users/me` — lazy-create + return profile
- `GET /api/users/me/dashboard` — metrics, created projects, applications
- `PUT /api/users/profile` — update profile

### Projects

- `POST /api/projects`
- `GET /api/projects` — open projects (`?q=` title search, `?category=`)
- `GET /api/projects/:id`
- `POST /api/projects/:id/join`
- `GET /api/projects/:id/requests` — owner only

### Join requests

- `PUT /api/join-requests/:id/accept`
- `PUT /api/join-requests/:id/reject`

Accept checks that the team is not full, adds the student to `members`, and if the team is then full sets `isOpen: false` and rejects leftover pending requests.

## Pages

`/sign-in`, `/sign-up`, `/dashboard`, `/profile`, `/profile/edit`, `/projects`, `/projects/create`, `/projects/:id`, `/projects/:id/requests`

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Ishangitt/CampusConnect.git
cd CampusConnect
npm install
npm run install:all
```

### 2. Clerk

1. Create an application at [Clerk](https://dashboard.clerk.com)
2. Copy the **Publishable key** and **Secret key**
3. In Clerk, add `http://localhost:5173` as an allowed origin
4. Paste keys into both env files below

### 3. Environment variables

Copy the examples and fill in real values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`**

```
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/campusconnect?retryWrites=true&w=majority
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxx
CLIENT_ORIGIN=http://localhost:5173
```

**`client/.env`**

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
VITE_API_URL=/api
```

### 4. Run

From the repo root:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

Sign up with Clerk, open the dashboard (this creates your MongoDB user), edit your profile and select skills, then create or join a project.

## Demo flow (interview)

1. Sign up as Student A → complete profile skills (e.g. React, Node.js)
2. Create a project that requires React, Node.js, MongoDB
3. Sign up as Student B in another browser / incognito → request to join
4. As Student A, accept or reject on `/projects/:id/requests`
5. Show skill match % on the project page and application status on the dashboard

## Project structure

```
CampusConnect/
  client/     Vite React app
  server/     Express API
```
