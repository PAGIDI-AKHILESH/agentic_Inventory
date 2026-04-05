# Agentic AI Inventory Management (MSME Autopilot)

An intelligent, full-stack inventory management platform designed specifically for Micro, Small, and Medium Enterprises (MSMEs). This application leverages advanced Agentic Generative AI to automate tedious stock management tasks, provide predictive insights, and manage interactions via a Telegram Bot.

## ✨ Features

- **📊 Intelligent Web Dashboard**: Comprehensive real-time view of your inventory, powered by a Next.js App Router frontend with beautiful, interactive charts (Recharts) and animations (Framer Motion).
- **🤖 Agentic AI Engine**: Utilizes Google Gemini 3.1 Pro (with Groq AI fallback) for:
  - **Predictive Insights**: Hourly/Daily analysis of sales velocity and lead times to proactively anticipate stockouts.
  - **Automated Purchase Orders**: Generates PO drafts requiring human approval.
  - **RAG-Powered Chat**: Combines live business data with LLM reasoning to answer complex business queries.
- **📱 Telegram Bot Integration**: A mobile-first interface built with `telegraf` that allows MSME owners to check stock, approve POs, and query the AI directly from Telegram.
- **📁 Robust File Handling**: Supports comprehensive data ingestion through both CSV and Excel (`.xls`, `.xlsx`) file uploads for seamless inventory updates.
- **🔒 Enterprise-Grade Security & Governance**: Features multi-tenant isolation, JWT-based authentication, and full audit logging of critical actions.
- **⚡ Resilient Architecture**: Includes enterprise-grade rate limiting, intelligent fallback mechanisms between AI providers (Gemini -> Groq), and graceful error handling.

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion, Recharts, Lucide React
- **Backend**: Custom Node.js Server (`server.ts` powered by `tsx`), Next.js API Routes, Node-Cron for scheduled background tasks
- **Database**: Prisma ORM
- **AI Integration**: Google GenAI SDK (`@google/genai`), Groq SDK (`groq-sdk`)
- **Integrations**: Telegram Bot API (`telegraf`)
- **Utilities**: Zod (validation), PapaParse/XLSX (file parsing), bcryptjs & jsonwebtoken (Auth)

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- A Google Gemini API Key
- A Groq API Key (for fallback functionality)
- A Telegram Bot Token (from BotFather)

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd agentic-ai-inventory-management
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory (you can use `.env.example` as a template) and add your configured keys:
   ```env
   # Database connection string
   DATABASE_URL="your_database_url_here"

   # AI API Keys
   GEMINI_API_KEY="your_gemini_api_key"
   GROQ_API_KEY="your_groq_api_key"

   # Telegram Bot configuration
   TELEGRAM_BOT_TOKEN="your_telegram_bot_token"

   # Authentication Secret
   JWT_SECRET="your_jwt_secret"
   ```

4. **Database Initialization**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   *Note: This utilizes `tsx server.ts` to spin up the custom server encompassing both Next.js and the background Cron/Telegram instances.*

6. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture

The platform uses a unified Next.js architecture alongside a custom Node.js server. 
- **Next.js** handles the core user interface, interactive dashboard elements, and RESTful APIs.
- The **Custom Node Server** is required to run persistent background services like cron jobs for predictive stock analysis and continuous polling/webhooks for the Telegram bot.

For a deep dive into the system's structural design, data layer, and intelligence engine, please read our [ARCHITECTURE.md](./ARCHITECTURE.md).

## ☁️ Deployment

This project is configured for deployment on Vercel. 
- Ensure your Vercel project's Build Command is set to `npm run build` (which triggers `prisma generate && next build`).
- Make sure all environment variables are properly mapped in your Vercel project settings.
