# Cut Dapper

## Overview

Cut Dapper is a platform designed to help people learn how to cut their own hair and save money on barber visits. Whether you're a DIY enthusiast looking to master self-haircuts or a professional barber seeking tutorial resources, Cut Dapper helps you find the perfect hair tutorials based on:

- **Hair styles** you want to achieve
- **Clippers and tools** used in the haircut
- **Skill level** and technique difficulty

The app aggregates and organizes hair cutting tutorials, making it easy to discover step-by-step guides that match your specific needs and the equipment you have available.

## Technology Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **API Layer**: tRPC
- **Authentication**: Better Auth (Email & Google OAuth)
- **Styling**: Tailwind CSS 4 with Radix UI components
- **AI Integration**: LangChain (OpenAI, Anthropic, Google Gemini support)
- **Data Collection**: Puppeteer for web scraping
- **State Management**: TanStack React Query

## Getting Started

### Prerequisites

- Node.js 20+ (or compatible runtime)
- PostgreSQL database
- npm package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd cut-dapper
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (see Environment Variables section below)

4. Set up the database:

```bash
make db/reset
```

### Running the Development Server

Start the development server:

```bash
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=""

# Auth
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Next server config
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google API Keys
YOUTUBE_API_KEY=""

# App config
ADMINS=""

# AI
AI_PROVIDER="openai"
OPENAI_API_KEY=""
```

### Environment Variable Details

- **DATABASE_URL**: PostgreSQL connection string
- **BETTER_AUTH_SECRET**: Random secret for session encryption (generate with `openssl rand -base64 32`)
- **GOOGLE_CLIENT_ID/SECRET**: OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
- **YOUTUBE_API_KEY**: API key from [Google Cloud Console](https://console.cloud.google.com/) with YouTube Data API v3 enabled
- **ADMINS**: Comma-separated list of admin email addresses
- **AI_PROVIDER**: AI provider to use (`openai`, `anthropic`, or `google`)
- **OPENAI_API_KEY**: API key from [OpenAI Platform](https://platform.openai.com/)

## Project Structure

```
cut-dapper/
├── prisma/          # Database schema and migrations
├── src/
│   ├── app/         # Next.js App Router pages
│   ├── components/  # General/cross-feature React components
│   ├── lib/         # Utilities and configurations
│   └── features/    # Modules to hold trpc routes, react hooks, and react components per features
│   └── trpc/        # TRPC configuration files and logic

└── public/          # Static assets
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Better Auth Documentation](https://better-auth.com)
