# SaksGram

A full-stack, Instagram-inspired social media platform for sharing posts, connecting with people, and chatting in real time.

## Overview

SaksGram is a modern social platform that combines content sharing and communication in one experience.  
Users can create and explore posts, engage through likes and comments, follow other users, manage profiles, and send direct messages. The core idea is to provide an Instagram-like app structure with scalable full-stack architecture and clean developer workflows.

## Features

- Secure authentication (sign up, login, session-based access)
- Post creation and feed viewing
- Like and unlike posts
- Comment creation and deletion
- Direct messaging between users
- User profile management (bio, avatar, etc.)
- Follow/unfollow system
- Conversation and chat UI with message actions
- Media upload support via cloud storage integration

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express
- TypeScript

### Database
- Prisma ORM
- MongoDB or PostgreSQL (based on environment configuration)

### Other Tools & Services
- Cloudinary (media upload/storage)
- JWT (authentication)
- pnpm workspaces (monorepo package management)

## Project Structure

```text
apps/
	backend/
	frontend/
```

## Environment Variables

Create local environment files (example format only).

### Backend `.env`
```env
MONGO_URI=your_database_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Installation

1. Clone the repository
```bash
git clone https://github.com/stevenstank/saks-gram.git
cd saks-gram
```

2. Install dependencies
```bash
pnpm install
```

3. Configure environment variables
- Add backend variables in `apps/backend/.env`
- Add frontend variables in `apps/frontend/.env.local`

4. Run the app (frontend + backend)
```bash
pnpm dev
```

5. Optional: run apps individually
```bash
pnpm dev:backend
pnpm dev:frontend
```

## Deployment

### Backend
- Deploy to Render
- Set backend environment variables in Render dashboard
- Ensure CORS and API base URL are configured correctly
- Production URL: https://saks-gram.onrender.com/

### Frontend
- Deploy to Vercel
- Set `NEXT_PUBLIC_API_URL` to the deployed backend URL
- Trigger production build from main branch
- Production URL: https://saks-gram-frontend.vercel.app/

## Details

- Auth pages
- Feed page
- Post details and comments
- Messaging UI
- Profile and follow views

## Future Improvements

- Realtime messaging with WebSockets
- Notifications system (likes, comments, follows)
- Story/reel-style media support
- Advanced feed ranking and recommendations
- Search and hashtag discovery
- Admin moderation tools
- Automated testing and CI/CD pipelines

## License

This project is licensed under the MIT License (placeholder).