# Tip Root

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Backend: Go](https://img.shields.io/badge/Backend-Go-00ADD8?logo=go&logoColor=white)](#)
[![Frontend: Next.js](https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js&logoColor=white)](#)
[![Mobile: Flutter](https://img.shields.io/badge/Mobile-Flutter-02569B?logo=flutter&logoColor=white)](#)

**Tip Root** is a comprehensive, self-hosted donation and tipping platform built for creators. Designed as a privacy-first alternative to centralized tipping services, Tip Root eliminates platform fees, giving you 100% of your earnings and complete autonomy over your data.

## ✨ Features

* **Zero Platform Fees:** Keep everything your supporters send. No middlemen taking a cut.
* **Data Autonomy:** You own the database, the logs, and the ledgers.
* **Real-Time OBS Alerts:** Built-in Server-Sent Events (SSE) engine pushes instant tip alerts directly to your stream overlays.
* **Discord Integration:** Automatically route tip notifications and alerts to your Discord server via webhooks.
* **High-Performance Architecture:** Powered by a Go backend and a NATS event bus to handle high-concurrency event ingestion without breaking a sweat.
* **Cross-Platform Mobile App:** Companion Flutter app with local SQLite storage and QR code scanning for fast tipping and session management.

## 🏗️ Architecture & Project Structure

tip-root is divided into four main components, each housed in its respective directory:

* `👉 /backend`
  * The core engine written in **Go**. Features a multi-worker architecture (`auth`, `ingestion`, `moderation`, `obs-engine`, `stats-worker`) connected via **NATS** for real-time event broadcasting.
* `👉 /tip-root-admin-ui`
  * The creator's control center. A **Next.js** application (managed via **Bun**) to view ledgers, configure OBS alerts, and manage account settings.
* `👉 /tip-root-ui`
  * The public-facing supporter interface. A fast, responsive **Next.js** application where your community can send tips and view your profile.
* `👉 /root_pay_app`
  * A companion mobile application built with **Flutter** (Android, iOS, Linux, macOS, Windows) featuring local database capabilities and quick-scan QR integration.

## 🚀 Quick Start (Self-Hosting)

The easiest way to get tip-root running is via Docker. 

### Prerequisites
* Docker & Docker Compose
* Bun (for local UI development)
* Go 1.21+ (for local backend development)

### Deployment

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/tip-root.git](https://github.com/yourusername/tip-root.git)
   cd tip-root