# SIP2LIFE Plant Management System

A comprehensive web application for SIP2LIFE Distilleries Pvt. Ltd. featuring document management and excise register tracking.

## Features

- 📄 **Document Management**: Upload, organize, and search documents with metadata
- 📊 **Excise Registers**: Manage live Zoho Sheet links
- 🔐 **Authentication**: Secure JWT-based login
- 🗂️ **Folder System**: Organize documents by department and custom folders
- 🔍 **Advanced Search**: Full-text search with filters and sorting
- ☁️ **Cloud Storage**: Supabase integration for file storage

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Prisma
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Deployment**: Vercel (Frontend) + Render (Backend)

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

3. Set up environment variables (see `.env.example`)

4. Run migrations:
   ```bash
   cd server
   npx prisma migrate dev
   ```

5. Start development servers:
   ```bash
   # Terminal 1 - Backend
   cd server && node index.js
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

6. Open http://localhost:5173

## Deployment

See deployment guide in `/docs/DEPLOYMENT.md`

## License

Proprietary - SIP2LIFE Distilleries Pvt. Ltd.
