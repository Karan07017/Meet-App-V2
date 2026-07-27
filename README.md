# 🎥 MEET — Video Conferencing Web App

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-database-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/NextAuth.js-v4-purple" alt="NextAuth" />
  <img src="https://img.shields.io/badge/Stream-Video%20SDK-005FFF?logo=stream&logoColor=white" alt="Stream Video SDK" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

<p align="center">
  A modern, full-stack <b>Google Meet–style video conferencing app</b> built with Next.js 16, the Stream Video SDK, and NextAuth. Create instant meetings, join with a meeting ID, and manage calls with a polished, real-time UI.
</p>

---

## 📖 About

**MEET** is a full-stack video calling application where authenticated users can instantly start a video meeting or join an existing one via a meeting ID. It combines **NextAuth.js** (Google OAuth + email/password credentials) for authentication, **Prisma + PostgreSQL** for user persistence, and the **Stream Video React SDK** for real-time video/audio infrastructure (call layouts, device controls, participant management, call stats).

---

## ✨ Features

| Category | Details |
|---|---|
| 🔐 **Authentication** | Sign up / log in with email & password, or continue with **Google OAuth**, powered by NextAuth.js (JWT sessions) |
| 🔑 **Secure Passwords** | Passwords hashed with **bcrypt** (12 salt rounds); includes a transparent legacy-plaintext → bcrypt migration path on login |
| ✅ **Input Validation** | Server-side email format and minimum password length (8 chars) validation, with clear inline error messages |
| 🛡️ **Route Protection** | Edge-level route guarding via `proxy.ts` — unauthenticated users are redirected before any protected page renders |
| 🎬 **Instant Meetings** | Create a new meeting with a single click (generates a unique call via the Stream Video SDK) |
| 🔗 **Join by ID** | Join any existing meeting by entering its meeting ID |
| 🧪 **Pre-call Setup** | Camera/mic preview screen with the option to join muted, plus device settings before entering a call |
| 🖥️ **Video Call Room** | Grid layout, speaker (left/right) layout switcher, live participant list, and call statistics |
| 📋 **Share Meeting** | One-click copy of the **Meeting ID** or **Meeting Link** with confirmation dialogs |
| 🛑 **Host Controls** | "End call for everyone" button visible only to the meeting's creator |
| 🔔 **Toast Notifications** | Real-time feedback for actions like meeting creation/failure |
| 👤 **Profile Menu** | Avatar dropdown with sign-out |
| 🎨 **Polished UI** | Glassmorphism-styled UI built with Tailwind CSS, Radix UI primitives, and Lucide icons, with fade/slide animations |

---

## 🛠️ Tech Stack

**Frontend**
- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS 3](https://tailwindcss.com/) + `tailwindcss-animate`
- [Radix UI](https://www.radix-ui.com/) primitives (Alert Dialog, Dropdown Menu, Toast) via a shadcn/ui-style component layer
- [Lucide React](https://lucide.dev/) icons

**Backend / Server**
- Next.js Route Handlers & Server Actions
- [NextAuth.js v4](https://next-auth.js.org/) — Credentials + Google OAuth providers, JWT sessions
- [Prisma ORM 6](https://www.prisma.io/) with **PostgreSQL**
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) for password hashing

**Real-Time Video**
- [`@stream-io/video-react-sdk`](https://getstream.io/video/docs/react/) — client-side video call UI/state
- [`@stream-io/node-sdk`](https://getstream.io/video/docs/) — server-side token generation

**Tooling**
- ESLint 9 (flat config) + `eslint-config-next`
- TypeScript 5

---

## 🏗️ Project Architecture / Working

```
┌────────────┐    JWT Session    ┌──────────────────┐
│   Client    │ ◄───────────────► │   NextAuth.js     │
│ (Next.js)   │                   │ (Credentials/OAuth)│
└─────┬──────┘                   └─────────┬─────────┘
      │                                     │
      │ Server Actions / Route Handlers     │ Prisma
      ▼                                     ▼
┌────────────┐                     ┌──────────────────┐
│  proxy.ts   │                     │   PostgreSQL DB   │
│(route guard)│                     │  (User accounts)  │
└─────┬──────┘                     └──────────────────┘
      │
      ▼
┌────────────────────┐   generates token   ┌────────────────────┐
│ tokenProvider()      │ ───────────────────► │  Stream Video API   │
│ (Server Action)      │                       │  (calls, signaling) │
└────────┬────────────┘                       └──────────┬──────────┘
         │                                                │
         ▼                                                ▼
┌────────────────────────────────────────────────────────────────┐
│               StreamVideoClient (client-side singleton)          │
│   MeetingSetup → MeetingRoom (grid/speaker layout, controls)     │
└────────────────────────────────────────────────────────────────┘
```

1. A user signs up/logs in via **NextAuth** (Credentials or Google). Sessions are JWT-based.
2. `proxy.ts` guards `/`, `/join/*`, and `/meeting/*` — unauthenticated visitors are redirected to sign in before any protected page is served.
3. Once authenticated, `StreamClientProvider` mints a **Stream video token** via a server action (`tokenProvider`, which independently re-verifies the session server-side) and initializes a `StreamVideoClient` singleton.
4. From the home page, the user either **starts** a new meeting (creates a call with a random UUID via the Stream SDK) or **joins** one by entering a meeting ID.
5. Before joining, `MeetingSetup` shows a device preview screen (camera/mic toggle) and only advances to the call room once `call.join()` resolves successfully.
6. Inside `MeetingRoom`, participants get call controls, a switchable grid/speaker layout, a participant list, call stats, and (for the host) an "End call for everyone" action.

---

## 📁 Folder Structure

```
Meet-App-V2-main/
├── app/
│   ├── api/auth/[...nextauth]/route.ts   # NextAuth route handler
│   ├── join/page.tsx                     # Join-by-ID page
│   ├── login/page.tsx                    # Login / Signup page
│   ├── meeting/[id]/page.tsx             # Dynamic meeting room page
│   ├── layout.tsx                        # Root layout (providers, fonts, toaster)
│   ├── page.tsx                          # Home page
│   └── globals.css
├── actions/
│   └── stream.actions.ts                 # Server action: Stream video token provider
├── components/
│   ├── ui/                               # Radix/shadcn-style primitives
│   ├── CardJoinCreate.tsx
│   ├── StartMeetingBtn.tsx
│   ├── JoinMeetingBtn.tsx
│   ├── MeetingSetup.tsx
│   ├── MeetingRoom.tsx
│   ├── MeetingPage.tsx
│   ├── EndCallButton.tsx
│   ├── NavBar.tsx
│   ├── ProfilePhoto.tsx
│   ├── login-btn.tsx
│   └── Loader.tsx
├── hooks/
│   ├── useGetCallById.ts
│   └── use-toast.ts
├── lib/
│   ├── auth.ts                           # NextAuth options/providers
│   ├── password.ts                       # Hashing & validation helpers
│   ├── prisma.ts                         # Prisma client singleton
│   └── utils.ts
├── providers/
│   ├── providers.tsx                     # SessionProvider wrapper
│   └── StreamClientProvider.tsx          # Stream video client init
├── prisma/
│   ├── schema.prisma                     # User model & datasource
│   └── migrations/
├── proxy.ts                               # Route-protection middleware (Next 16)
├── next-auth.d.ts                         # NextAuth type augmentation
└── public/
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+
- A PostgreSQL database
- A [Stream](https://getstream.io/video/) account (API key + secret)
- A [Google Cloud OAuth](https://console.cloud.google.com/) client (for Google sign-in)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/meet-app.git
cd meet-app

# 2. Install dependencies
npm install

# 3. Configure environment variables (see below)
cp .env.example .env

# 4. Run Prisma migrations
npx prisma migrate deploy
npx prisma generate

# 5. Start the dev server
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root with the following:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `NEXTAUTH_SECRET` | Secret used to sign/encrypt NextAuth JWTs |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret from Google Cloud Console |
| `NEXT_PUBLIC_STREAM_API_KEY` | Public Stream Video API key (client-side) |
| `STREAM_SECRET_KEY` | Stream Video API secret (server-side, used to mint tokens) |

> ⚠️ Never commit your `.env` file. `NEXT_PUBLIC_*` variables are exposed to the browser by design — only the Stream API **key** is public; the secret stays server-side.

---

## ▶️ Running the Project

```bash
# Development (Turbopack)
npm run dev

# Production build (runs `prisma generate` first)
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

The app runs by default at **http://localhost:3000**.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/auth/[...nextauth]` | NextAuth.js catch-all route — handles sign-in, sign-out, session retrieval, CSRF token, and OAuth callback flows for both Credentials and Google providers |

> Video-call data (tokens, call creation/lookup) is handled through **Next.js Server Actions** (`actions/stream.actions.ts`) and the **Stream Video SDK** directly on the client, rather than custom REST endpoints.

| Server Action | Description |
|---|---|
| `tokenProvider()` | Verifies the current server-side session, then generates a short-lived (1 hour) Stream video user token |

---

## 🔄 Application Flow

1. **Landing / Auth** — An unauthenticated user hitting `/`, `/join`, or `/meeting/*` is redirected (via `proxy.ts`) to sign in.
2. **Login / Signup** — On `/login`, the user either signs in with Google or uses the credentials form (with a mode flag distinguishing signup vs. login), which validates email format, password length, and duplicate-account cases server-side.
3. **Home** — Once authenticated, the `StreamClientProvider` requests a video token and initializes the Stream video client. The home page presents two actions:
   - **Start MEET** — creates a new call with a randomly generated ID and redirects to `/meeting/[id]`.
   - **Join MEET** — navigates to `/join`, where the user enters an existing meeting ID.
4. **Meeting Setup** — On the meeting page, `MeetingSetup` shows a live camera preview and lets the user toggle mic/camera before joining; the call room only renders after `call.join()` resolves.
5. **Meeting Room** — Once joined, `MeetingRoom` renders the active call with switchable grid/speaker layouts, a participant list, call stats, and standard call controls (mute, camera, screen share, leave).
6. **Sharing** — Participants can copy the Meeting ID or a shareable Meeting Link at any point via the dialog buttons at the top of the meeting page.
7. **Ending the call** — Any participant can leave; the meeting's creator additionally sees an **"End call for everyone"** control that terminates the call for all participants.

---

## 🐞 Current Limitations

- 🔴 **Meeting Recording** – Recording functionality is not yet implemented. The recording control is included as a placeholder for a future release and currently does not save or provide access to meeting recordings.

> **Note:** Full recording support (cloud storage, playback, and download) is planned for a future update.

---

## 🚀 Future Enhancements

- Meeting scheduling & calendar invites
- Waiting room / host approval before join
- Automated test suite (unit/integration)
- Meeting recording with cloud storage and playback.
- Login/signup rate limiting.
- AI meeting summaries and action items.
- In-meeting chat and file sharing.
- Email invitations and meeting reminders.
- Live captions and speech-to-text.
- Virtual backgrounds and background blur.
- Collaborative whiteboard.
- Enhanced authentication (Email verification, Forgot Password, 2FA).

---

## ☁️ Deployment

This project is built on Next.js and is well-suited for deployment on **[Vercel](https://vercel.com/)**:

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add all environment variables listed above in the Vercel project settings.
4. Ensure your PostgreSQL database (e.g. Neon, Supabase, Railway) is reachable from Vercel, and that `prisma migrate deploy` runs as part of your deployment pipeline.
5. Deploy — Vercel will run `npm run build` (which executes `prisma generate` automatically via the `build` script).

---

## 👤 Author

**Karan Arya**
- GitHub: [@Karan07017](https://github.com/Karan07017)
- LinkedIn: [Karan Arya](https://www.linkedin.com/in/karan-arya1797/)

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

### ☕ Made with sleepless nights, endless debugging, and way too much caffeine.

**Crafted by Karan Arya ❤️**

</div>