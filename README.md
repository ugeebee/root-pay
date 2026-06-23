# Tip Root

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Backend: Go](https://img.shields.io/badge/Backend-Go-00ADD8?logo=go&logoColor=white)](#)
[![Frontend: Next.js](https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js&logoColor=white)](#)
[![Mobile: Flutter](https://img.shields.io/badge/Mobile-Flutter-02569B?logo=flutter&logoColor=white)](#)

**Tip Root** is a comprehensive, self-hosted donation and tipping platform built for creators. Designed as a privacy-first alternative to centralized tipping services, Tip Root eliminates platform fees, giving you 100% of your earnings and complete autonomy over your data.

## Features

* **Zero Platform Fees:** Keep everything your supporters send. No middlemen taking a cut.
* **Data Autonomy:** You own the database, the logs, and the ledgers.
* **Real-Time OBS Alerts:** Built-in Server-Sent Events (SSE) engine pushes instant tip alerts directly to your stream overlays.
* **Discord Integration:** Automatically route tip notifications and alerts to your Discord server via webhooks.
* **High-Performance Architecture:** Powered by a Go backend and a NATS event bus to handle high-concurrency event ingestion without breaking a sweat.
* **Cross-Platform Mobile App:** Companion Flutter app with local SQLite storage and QR code scanning for fast tipping and session management.

## Architecture & Project Structure

Tip Root is divided into four main components, each housed in its respective directory:

* `/backend`
  * The core engine written in **Go**. Features a multi-worker architecture (`auth`, `ingestion`, `moderation`, `obs-engine`, `stats-worker`) connected via **NATS** for real-time event broadcasting.
* `/tip-root-admin-ui`
  * The creator's control center. A **Next.js** application (managed via **Bun**) to view ledgers, configure OBS alerts, and manage account settings.
* `/tip-root-ui`
  * The public-facing supporter interface. A fast, responsive **Next.js** application where your community can send tips and view your profile.
* `/root_pay_app`
  * A companion mobile application built with **Flutter** (Android, iOS, Linux, macOS, Windows) featuring local database capabilities and quick-scan QR integration.

## Quick Start (Self-Hosting)
> **Video Tutorial:** Prefer a visual guide? Watch the [Complete Tip Root Server Setup Guide on YouTube](https://www.youtube.com/watch?v=YOUR_SETUP_VIDEO_ID) below.
> 
> [![Tip Root Setup Guide](https://img.youtube.com/vi/YOUR_SETUP_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUR_SETUP_VIDEO_ID)

This guide covers deploying Tip Root directly to a Linux server using PM2 and Bun.

### Prerequisites
* Go 1.21+
* Bun (JavaScript runtime)
* PM2 (Process Manager)
* NATS Server (running locally or accessible remotely)
* PostgreSQL 15+

### Deployment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ugeebee/tip-root.git
   cd tip-root

2. **Compile the Go Backend**
    : Build the standalone executables for the microservices:

    ```bash
    cd backend
    mkdir -p bin

    go build -o bin/auth ./cmd/auth/main.go
    go build -o bin/ingestion ./cmd/ingestion/main.go
    go build -o bin/moderation ./cmd/moderation/main.go
    go build -o bin/obs-engine ./cmd/obs-engine/main.go
    go build -o bin/stats-worker ./cmd/stats-worker/main.go
    go build -o bin/frontend-sse ./cmd/frontend-sse/main.go
    go build -o bin/dash-updates ./cmd/dashUpdates/main.go
    cd ..

3. **Build the Next.js Frontends**
   : Use Bun to install dependencies and build the production assets:
    ```bash
    cd tip-root-ui
    bun install
    bun run build
    cd ..

    cd tip-root-admin-ui
    bun install
    bun run build
    cd ..

4. **Configure & Start PM2**
    : First, install the dotenv helper at the root of your project so PM2 can parse your environment variables dynamically:
    ```bash
    bun add dotenv
    ```
    Next, create an ecosystem.config.js file at the root of the project. It automatically pulls the environment variables from your /backend/.env file and passes them seamlessly to the Go workers:
    ```bash
    const path = require('path');
    const dotenv = require('dotenv');

    // Dynamically load all environment variables from /backend/.env
    const envPath = path.join(__dirname, 'backend', '.env');
    const parsedEnv = dotenv.config({ path: envPath }).parsed;

    // Fallback to an empty object if .env configuration is missing
    const goEnv = parsedEnv || {};

    module.exports = {
    apps: [
        // --- Go Backend Services ---
        { name: "auth-service", script: "./backend/bin/auth", env: goEnv },
        { name: "ingestion-service", script: "./backend/bin/ingestion", env: goEnv },
        { name: "moderation", script: "./backend/bin/moderation", env: goEnv },
        { name: "obs-engine", script: "./backend/bin/obs-engine", env: goEnv },
        { name: "frontend-sse", script: "./backend/bin/frontend-sse", env: goEnv },
        { name: "stats-worker", script: "./backend/bin/stats-worker", env: goEnv },
        { name: "dash-updates", script: "./backend/bin/dash-updates", env: goEnv },
        
        // --- Next.js Frontends ---
        {
        name: "tip-root-ui",
        cwd: "./tip-root-ui",
        script: "bun",
        args: "--bun next start",
        env: { 
            PORT: 3000, 
            PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}` 
        }
        },
        {
        name: "tip-root-admin-ui",
        cwd: "./tip-root-admin-ui",
        script: "bun",
        args: "--bun next start",
        env: { 
            PORT: 3001, 
            PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}` 
        }
        }
    ]
    };
    ```
    Start the entire platform under PM2 daemon control:
    ```bash
    pm2 start ecosystem.config.js --update-env
    pm2 save
    pm2 startup
    ```
    **Note on Logs**: It is highly recommended to install pm2-logrotate (pm2 install pm2-logrotate) to prevent high-frequency engine logs from filling up your storage drive.

## Contributing
> **Video Tutorial:** Want to understand the codebase architecture before diving in? Watch the Tip Root Architecture & Contributor Guide on YouTube(https://www.youtube.com/watch?v=YOUR_SETUP_VIDEO_ID) below.
> 
> [![Tip Root Setup Guide](https://img.youtube.com/vi/YOUR_SETUP_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUR_SETUP_VIDEO_ID)

Contributions, issues, and feature requests are welcome! Feel free to check the issues page. If you are developing locally, refer to the individual directory structures for specific service setups.

## License
This project is licensed under the GNU Affero General Public License v3.0 (AGPLv3).

Copyright (C) 2026 Utkarsh Gopal Bhartariya.

By using the AGPLv3, Tip Root ensures that any modifications made to this software and deployed over a network must be released back to the open-source community. This guarantees the platform remains decentralized and protects creators from corporate capture. See the LICENSE file for full details.