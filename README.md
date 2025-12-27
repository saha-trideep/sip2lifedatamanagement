# SIP2LIFE Plant Management System

A comprehensive web application for SIP2LIFE Distilleries Pvt. Ltd. featuring document management and excise register tracking.

## Features

- 📄 **Document Management**: Upload, organize, and search documents with metadata
- 📊 **Excise Registers**: Manage live Zoho Sheet links
- 🔐 **Authentication**: Secure JWT-based login
- 🗂️ **Folder System**: Organize documents by department and custom folders
- 🔍 **Advanced Search**: Full-text search with filters and sorting
- ☁️ **Cloud Storage**: Supabase integration for file storage

## 🚀 Register Engine Implementation (In Progress)

We are implementing a complete **Excise Register Management System** with 7 registers:

1. ✅ **Reg-74** - Vat Operations Register (Complete)
2. ⚠️ **Reg-76** - Spirit Receipt Register (In Progress)
3. ⚠️ **Reg-A** - Production & Bottling Register (In Progress)
4. 📋 **Reg-B** - Issue of Country Liquor in Bottles (Planned)
5. 📋 **Excise Duty** - Personal Ledger Account (Planned)
6. 📋 **Reg-78** - Account of Spirit / Master Ledger (Planned)
7. 📋 **Daily Handbook** - Consolidated Daily Report (Planned)

**📚 Project Documentation:**
- 📋 **[TODO.md](./TODO.md)** - Complete task list and implementation plan
- 📖 **[HOW_TO_CONTINUE.md](./HOW_TO_CONTINUE.md)** - Instructions for future sessions
- 📊 **[.agent/REGISTER_STATUS_MATRIX.md](./.agent/REGISTER_STATUS_MATRIX.md)** - Current status
- 📖 **[.agent/QUICK_START_GUIDE.md](./.agent/QUICK_START_GUIDE.md)** - Code examples

**🔗 Reference:**
- [Streamlit Prototype Demo](https://excise-parallel-register-system-msne7jvz35aflmgvkmefwb.streamlit.app/)
- [Source Code](https://github.com/saha-trideep/excise-parallel-register-system)

**To continue work:** See [HOW_TO_CONTINUE.md](./HOW_TO_CONTINUE.md)

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
