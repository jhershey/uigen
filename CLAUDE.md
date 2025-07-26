# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview capabilities. It uses Claude AI to generate React components based on user prompts and provides real-time preview with hot reload functionality.

## Key Commands

### Development
- `npm run dev` - Start the development server with Turbopack
- `npm run dev:daemon` - Start development server in background with logging to logs.txt
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup` - Initial project setup (installs dependencies, generates Prisma client, runs migrations)

### Database
- `npm run db:reset` - Reset the database (destructive - removes all data)
- `npx prisma migrate dev` - Create new database migrations
- `npx prisma studio` - Open Prisma Studio to view/edit database

### Testing
- `npm run test` - Run tests using Vitest
- `npm run test src/components/chat/__tests__/ChatInterface.test.tsx` - Run a specific test file
- Test files are located in `__tests__` directories alongside components

### Linting
- `npm run lint` - Run ESLint to check code quality

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API routes, Prisma ORM with SQLite
- **AI Integration**: Anthropic Claude via Vercel AI SDK
- **Editor**: Monaco Editor for code editing
- **Testing**: Vitest with React Testing Library

### Key Architectural Patterns

1. **Virtual File System**: The application uses an in-memory file system (`src/lib/file-system.ts`) to manage generated components without writing to disk. The VirtualFileSystem class provides methods for file operations like create, read, update, delete, and rename.

2. **AI Prompt System**: Prompts for Claude are managed in `src/lib/prompts/` with structured templates for generating React components. The system uses streaming responses from the AI.

3. **Real-time Updates**: Uses React Server Components and streaming for real-time AI responses and component updates. The preview system uses Babel Standalone for runtime transpilation.

4. **Authentication**: JWT-based auth system with anonymous and authenticated user support. Auth logic in `src/lib/auth.ts`. Protected routes are defined in `src/middleware.ts`.

5. **Component Preview**: Generated components are transpiled in the browser using Babel Standalone and rendered in an isolated iframe for safe preview.

### Project Structure
```
src/
├── actions/        # Server actions for data mutations
├── app/           # Next.js app router pages and API routes
│   ├── api/       # API endpoints for AI, auth, projects
│   └── (main)/    # Main application routes
├── components/    # React components organized by feature
│   ├── chat/      # Chat interface components
│   ├── editor/    # Code editor and file tree
│   └── preview/   # Component preview system
├── hooks/         # Custom React hooks
├── lib/           # Core utilities and business logic
│   ├── contexts/  # React contexts (auth, project state, file system)
│   ├── prompts/   # AI prompt templates
│   ├── tools/     # Utility functions including file manager
│   └── transform/ # Code transformation utilities (JSX transformer)
└── middleware.ts  # Next.js middleware for auth
```

### Important Considerations

1. **Environment Variables**: The app requires `ANTHROPIC_API_KEY` in `.env` for AI functionality. Without it, static code is returned.

2. **Database**: Uses SQLite with Prisma. Database file is stored at `prisma/dev.db`. Schema includes User, Project, and File models.

3. **Component Generation**: Generated components are stored in the virtual file system and can be persisted to the database for registered users. Components are transpiled on-the-fly using Babel Standalone.

4. **API Routes**: 
   - `/api/ai/stream` - Handles AI streaming responses
   - `/api/auth/*` - Authentication endpoints (login, signup, logout)
   - `/api/projects/*` - Project management (CRUD operations)
   - `/api/filesystem/*` - File system operations

5. **State Management**: Uses React Context for auth (`AuthContext`), project state (`ProjectContext`), and file system (`FileSystemContext`).

6. **Error Handling**: The preview system includes error boundaries to safely handle component rendering errors.

## Coding Guidelines

- Comment sparingly. Only comment on complex code.
- Use TypeScript strict mode - ensure proper typing for all new code
- Follow existing patterns for component structure and file organization
- Use server actions for data mutations when possible
- Ensure all API routes handle errors gracefully