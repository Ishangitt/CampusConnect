# CampusConnect

**CampusConnect** is a full-stack campus collaboration platform where college students can create projects, find teammates, and manage join requests — all based on real skill matching.

Built with the **MERN stack** + **Clerk** authentication.

---

## ✨ Features

### 👤 Authentication & Profiles
- Sign up / sign in via **Clerk** (no passwords stored)
- **Lazy user creation** — MongoDB profile auto-created on first login (no webhooks needed)
- Student profile: name, college, branch, year, bio, skills, interests, GitHub, LinkedIn

### 📁 Projects
- Create a project with title, description, category, required skills, team size, deadline, and WhatsApp group
- Declare how many **offline members** you already have (e.g. "I have 4 already, need 2 more")
- **Edit** your project anytime — update any field, toggle open/closed
- **Delete** your project (cascades to all join requests)
- Auto-closes when team is full; auto-reopens if a member leaves
- Expired projects (past deadline) are hidden from browse

### 🔍 Browse & Search
- Search projects by **title or description**
- Filter by **category** (Web Dev, Mobile, AI/ML, etc.)
- **Paginated** results (12 per page, Previous / Next controls)
- Team progress bar on each card: colour-coded (indigo → amber → grey as team fills)

### 📬 Join Requests
- Students can request to join any open project
- Rejected applicants can re-apply
- Members can **leave** a project
- Owners can **accept** or **reject** from the requests page OR directly from the notification bell

### 🔔 Notifications
- Bell icon in the header shows **pending join requests** in real time
- Auto-refreshes every 30 seconds and on window focus
- Accept / reject directly from the dropdown without navigating away

### 📊 Dashboard
- Welcome message and key metrics (projects created, memberships, pending requests)
- Table of your created projects with status and pending count
- List of your applications with status badges
- Rejected applications show a **"View project to re-apply →"** link

### 👤 Profile
- View your profile with stats, skills, GitHub/LinkedIn links
- **My Projects** — all projects you created
- **Teams I'm In** — projects you've been accepted into

### 🎯 Skill Matching
- When viewing a project, see your personal **skill match %**
- Skills are split into "You have" and "Missing" with colour-coded badges
- Match % is also shown per applicant on the Requests page

### 🔒 Security
- All routes protected by Clerk session JWT
- CORS enforced to allowed origins only
- WhatsApp number only visible to team members
- Owner-only guards on edit, delete, and request management

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), Vanilla CSS, React Router v6, Axios |
| **Backend** | Node.js, Express 4 |
| **Database** | MongoDB (Mongoose 8) |
| **Auth** | Clerk (`@clerk/react`, `@clerk/express`) |
| **Icons** | Lucide React |
| **Dev tooling** | Concurrently, node --watch |

> JavaScript only — no TypeScript.

---

## 📂 Project Structure

```
CampusConnect/
│
├── package.json              # Root — runs both servers with concurrently
│
├── client/                   # Vite + React frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # Axios instance + Clerk JWT interceptor
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx   # Reusable confirmation dialog
│   │   │   ├── EmptyState.jsx     # Empty list placeholder
│   │   │   ├── Layout.jsx         # App shell (nav + outlet)
│   │   │   ├── Loader.jsx         # Spinner
│   │   │   ├── NotificationBell.jsx  # Dropdown bell with accept/reject
│   │   │   ├── ProjectCard.jsx    # Card with progress bar + spots left
│   │   │   ├── SkillBadges.jsx    # Coloured skill tags
│   │   │   └── SkillPicker.jsx    # Clickable pill skill selector
│   │   ├── constants/
│   │   │   └── skills.js          # PREDEFINED_SKILLS, PROJECT_CATEGORIES, YEAR_OPTIONS
│   │   ├── pages/
│   │   │   ├── CreateProject.jsx  # New project form
│   │   │   ├── Dashboard.jsx      # Home after login
│   │   │   ├── EditProject.jsx    # Edit existing project (owner only)
│   │   │   ├── NotFound.jsx       # 404 page
│   │   │   ├── Profile.jsx        # View profile + projects + memberships
│   │   │   ├── ProfileEdit.jsx    # Edit profile
│   │   │   ├── ProjectDetails.jsx # Full project view + join/leave/delete
│   │   │   ├── ProjectRequests.jsx# Manage join requests (owner only)
│   │   │   ├── Projects.jsx       # Browse + search + paginate
│   │   │   ├── SignInPage.jsx     # Clerk-hosted sign in
│   │   │   └── SignUpPage.jsx     # Clerk-hosted sign up
│   │   ├── utils/
│   │   │   └── skillMatch.js      # getSkillMatch(studentSkills, required)
│   │   ├── App.jsx                # Routes
│   │   ├── index.css              # Global styles
│   │   └── main.jsx               # Entry point + ClerkProvider
│   ├── .env                       # VITE_CLERK_PUBLISHABLE_KEY, VITE_API_URL
│   └── vite.config.js
│
└── server/                   # Express API
    ├── config/
    │   └── db.js                  # Mongoose connection
    ├── constants/
    │   └── skills.js              # Same skill/category lists (server-side validation)
    ├── middleware/
    │   └── requireDbUser.js       # Clerk auth + lazy user creation
    ├── models/
    │   ├── User.js
    │   ├── Project.js
    │   └── JoinRequest.js
    ├── routes/
    │   ├── users.js               # /api/users/*
    │   ├── projects.js            # /api/projects/*
    │   └── joinRequests.js        # /api/join-requests/*
    ├── index.js                   # Express app + CORS + route mounting
    ├── .env                       # Secrets (never committed)
    └── .env.example               # Template
```

---

## 🗄 Database Schema

### `users`
```js
{
  _id,
  clerkId,        // unique — from Clerk JWT
  name,
  email,
  college,
  branch,
  year,           // "1st Year" | "2nd Year" | "3rd Year" | "4th Year" | "Alumni"
  bio,
  skills: [],     // subset of PREDEFINED_SKILLS
  interests: [],
  github,
  linkedin,
  createdAt, updatedAt
}
```
> Passwords are never stored. Clerk owns all authentication.

### `projects`
```js
{
  _id,
  title,
  description,
  category,              // one of PROJECT_CATEGORIES
  requiredSkills: [],    // subset of PREDEFINED_SKILLS
  whatsappNumber,        // only returned to team members
  creatorId,             // ref: User
  members: [],           // ref: User[] — platform-tracked members
  teamSize,              // total slots
  existingMembersCount,  // offline members declared by owner (default 0)
  isOpen,                // false when (existingMembersCount + members.length) >= teamSize
  deadline,
  createdAt, updatedAt
}
```

### `joinrequests`
```js
{
  _id,
  projectId,   // ref: Project
  studentId,   // ref: User
  status,      // "pending" | "accepted" | "rejected"
  createdAt, updatedAt
}
// Compound unique index: { projectId, studentId }
```

---

## 🔌 API Reference

All routes require a Clerk session token in `Authorization: Bearer <token>` except `GET /api/health`.

### Users — `/api/users`

| Method | Path | Description |
|---|---|---|
| `GET` | `/me` | Return current user + project metrics |
| `GET` | `/me/dashboard` | Metrics + created projects + applications |
| `GET` | `/me/notifications` | Pending join requests for projects I own |
| `PUT` | `/profile` | Update profile fields |

### Projects — `/api/projects`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | Any | Create a project |
| `GET` | `/` | Any | List open, non-expired projects (`?q`, `?category`, `?page`, `?limit`) |
| `GET` | `/:id` | Any | Get project detail + my join request |
| `PUT` | `/:id` | Owner | Edit project fields |
| `DELETE` | `/:id` | Owner | Delete project + cascade delete join requests |
| `POST` | `/:id/join` | Non-member | Send join request |
| `DELETE` | `/:id/members/me` | Member | Leave a project |
| `GET` | `/:id/requests` | Owner | List all join requests for a project |

### Join Requests — `/api/join-requests`

| Method | Path | Auth | Description |
|---|---|---|---|
| `PUT` | `/:id/accept` | Owner | Accept request, add to members, auto-close if full |
| `PUT` | `/:id/reject` | Owner | Reject request |

---

## 🗺 Pages & Routes

| URL | Page | Access |
|---|---|---|
| `/sign-in` | Sign In | Public |
| `/sign-up` | Sign Up | Public |
| `/dashboard` | Dashboard | Auth |
| `/profile` | View Profile | Auth |
| `/profile/edit` | Edit Profile | Auth |
| `/projects` | Browse Projects | Auth |
| `/projects/create` | Create Project | Auth |
| `/projects/:id` | Project Details | Auth |
| `/projects/:id/edit` | Edit Project | Owner |
| `/projects/:id/requests` | Manage Requests | Owner |
| `*` | 404 Not Found | — |

---

## ⚙️ Local Setup

### 1. Clone and install

```bash
git clone https://github.com/Ishangitt/CampusConnect.git
cd CampusConnect
npm install
npm run install:all
```

### 2. Set up Clerk

1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy your **Publishable key** and **Secret key**
3. Add `http://localhost:5173` as an allowed origin in Clerk settings

### 3. Environment variables

```bash
# Windows
copy server\.env.example server\.env
copy client\.env.example client\.env
```

**`server/.env`**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/campusconnect
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxx
CLIENT_ORIGIN=http://localhost:5173
```

**`client/.env`**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
VITE_API_URL=http://localhost:5000/api
```

### 4. Run

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Health check:** http://localhost:5000/api/health

---

## 🔄 How Authentication Works

```
Browser  ──────── Clerk JWT ────────▶  Express middleware
                                        │
                              requireClerkAuth
                              (resolves userId from Clerk or JWT)
                                        │
                               requireDbUser
                              (finds User in MongoDB or creates one)
                                        │
                              req.dbUser available in all route handlers
```

- First login auto-creates a MongoDB user by calling Clerk API to fetch name + email
- Subsequent requests just look up by `clerkId`
- Passwords are **never** in your database

---

## 🔁 Core User Flows

### Creating a project
1. Go to **Create Project**
2. Fill title, description, category, required skills
3. Set **team size**, optionally enter how many members you **already have offline**
4. Set deadline and (optionally) WhatsApp group number
5. You are automatically the first member

### Joining a project
1. Browse **Open Projects**, search/filter as needed
2. Open a project — see your **skill match %**
3. Click **Request to Join**
4. Track status on your **Dashboard** under "My Applications"

### Managing requests (owner)
- Get notified via the **bell icon** in the header
- Accept or reject directly from the dropdown, or go to the full Requests page
- Accepting a request automatically adds the student to the team
- When the team is full, remaining pending requests are auto-rejected and the project closes

---

## 🧑‍💻 Key Design Decisions

| Decision | Reason |
|---|---|
| No Clerk webhooks | Lazy user creation on first API call is simpler to deploy |
| Skills from predefined list | Ensures skill matching is exact, no typo mismatches |
| `existingMembersCount` field | Lets owners declare offline recruits so available spots are accurate |
| `isOpen` computed from total filled | Accounts for both platform members and offline members |
| Expired projects filtered on server | Clients never need to handle expired-project logic |
| Cascade delete on project | Prevents orphaned join requests in the database |
| Pagination on GET /projects | Prevents unbounded queries as data grows |

---

## 📦 Dependencies

### Server
| Package | Purpose |
|---|---|
| `express` | HTTP framework |
| `mongoose` | MongoDB ODM |
| `@clerk/express` | Clerk server-side auth |
| `cors` | Cross-origin request handling |
| `dotenv` | Environment variable loading |

### Client
| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client |
| `@clerk/clerk-react` | Clerk React components + hooks |
| `lucide-react` | Icon library |
| `vite` | Build tool + dev server |
