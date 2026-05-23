# HealthMate: Appointment Scheduler

HealthMate is a clinic scheduling system for patients and doctors with reminders. The project is in early setup; the home page currently serves as a pre-launch “coming soon” screen.

## About the project

HealthMate aims to simplify how clinics manage appointments end to end—from patient sign-up through booking, doctor scheduling, and follow-up reminders.

### Planned features

- Patient registration & login
- Appointment booking flow
- Doctor dashboard with schedule view
- Cancellation & rescheduling logic
- SMS/email reminder integration
- Analytics for appointment trends
- UI polish for mobile usability
- Testing appointment conflicts

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) |
| UI | [React](https://react.dev) 19 |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS](https://tailwindcss.com) 4 |
| Linting | [ESLint](https://eslint.org) (Next.js config) |
| Runtime | [Node.js](https://nodejs.org) 24.14.1 |
| Package manager | npm |

## Prerequisites

Before you begin, install:

- **Node.js** 24.14.1
- **npm** (included with Node.js)
- **Git**

Check your versions:

```bash
node -v
npm -v
git --version
```

## Getting started (local setup)

Follow these steps to run the project on your machine.

### 1. Clone the repository

```bash
git clone <repository-url>
cd healthmate
```

Replace `<repository-url>` with your Git remote URL (for example, `https://github.com/your-org/healthmate.git`).

### 2. Install dependencies

From the project root:

```bash
npm install
```

This installs Next.js, React, Tailwind CSS, TypeScript, and other dependencies listed in `package.json`.

### 3. Start the development server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). Open that URL in your browser to view the coming-soon home page.

The dev server reloads automatically when you edit files (for example, `app/page.tsx`).

### 4. (Optional) Production build

To verify a production build locally:

```bash
npm run build
npm run start
```

Then open [http://localhost:3000](http://localhost:3000) again.

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Run the production server (after `build`) |
| `npm run lint` | Run ESLint |

## Project structure (overview)

```
healthmate/
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home / coming-soon page
│   └── globals.css     # Global styles
├── public/             # Static assets
├── package.json
└── README.md
```

## Current status

- Initial Next.js project setup is complete.
- The home page (`app/page.tsx`) is a simple, responsive pre-launch screen describing HealthMate and planned features.
- Authentication, booking, dashboards, and backend integrations are not implemented yet.

## License

This project is for academic/course use unless otherwise specified by the repository owner.
