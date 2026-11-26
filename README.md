# MoBoxd

MoBoxd is a full-stack, cross-platform movie tracking and social review application built with **React**, **Vite**, **Capacitor** (Android & iOS), and a **Node.js** backend, featuring automated **GitHub Actions** workflows and an **over-the-air (OTA)** update pipeline.

## Key Features

- **Review Management:** Create, update, and manage movie reviews.
- **Social Profiles & Graph:** User profiles with follow/unfollow functionality and followers/following endpoints.
- **Push Notifications:** Integrated push-notification handling for mobile clients.
- **Cross-Platform Mobile Support:** Web client packaged for Android and iOS using Capacitor.
- **Over-the-Air (OTA) Updates:** Versioned OTA update manifest (`ota/latest.json`) and release bundles to deliver updates without full app-store reinstalls.
- **Automated CI/CD:** GitHub Actions workflows (`.github/workflows`) supporting automated builds and versioned releases (`v1.0.19`).

## Repository Structure

```text
MoBoxd/
├── .github/workflows/   # Automated CI/CD and release workflows
├── client/              # React + Vite frontend & Capacitor (Android / iOS)
│   ├── android/         # Native Android project
│   ├── ios/             # Native iOS project
│   ├── public/          # Static public assets
│   ├── src/             # Application source code
│   ├── capacitor.config.json
│   ├── vite.config.js
│   └── package.json
├── ota/                 # Over-the-air update metadata
│   └── latest.json
├── server/              # Node.js backend API
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   ├── server.js
│   └── package.json
└── jsconfig.json
```

## Tech Stack

- **Frontend & Mobile:** React, Vite, JavaScript, PostCSS, Capacitor (Android / iOS)
- **Backend:** Node.js
- **Automation & Delivery:** GitHub Actions, OTA Bundle Manifests

## Getting Started

### Prerequisites

- Node.js (LTS recommended) and npm
- Git
- Android Studio / Xcode (optional, for native mobile builds via Capacitor)

### 1. Clone the repository

```bash
git clone https://github.com/uday-gandhi04/MoBoxd.git
cd MoBoxd
```

### 2. Run the backend server

```bash
cd server
npm install
# Configure required environment variables in server/.env before starting
node server.js
```

### 3. Run the client

```bash
cd ../client
npm install
npm run dev
```

## Releases

MoBoxd is actively maintained with 19 versioned releases (latest: `v1.0.19`).

## Author

**Uday Gandhi**
- GitHub: [@uday-gandhi04](https://github.com/uday-gandhi04)
- Portfolio: [udaygandhi.is-a.dev](https://udaygandhi.is-a.dev)
- LinkedIn: [Uday Gandhi](https://www.linkedin.com/in/uday-gandhi-46314624b/)

## License

All rights reserved. No open-source license has been granted for this repository.
