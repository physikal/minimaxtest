# Poker Pulse - Technical Specification

## Project Overview
- **Project name**: Poker Pulse
- **Type**: Full-stack web application (Docker containerized)
- **Core functionality**: Coordinate home poker games with email invites and RSVP tracking
- **Target users**: Home poker game hosts and players
- **Stack**: Fastify (Node.js), PostgreSQL, nginx, Docker

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │   Frontend  │  │  API Server │  │  PostgreSQL   │   │
│  │   (nginx)   │◄─►│  (Fastify)  │◄─►│   Database    │   │
│  └─────────────┘  └─────────────┘  └───────────────┘   │
│         │                │                               │
│         │         ┌──────┴──────┐                       │
│         │         │  JWT Auth   │                       │
│         │         │  Email Svc  │                       │
│         │         │  WebSocket  │                       │
│         │         └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

### Authentication (POST /api/auth)
- `POST /auth/register` - Create account
- `POST /auth/login` - Get JWT token
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh token

### Games (GET/POST/PUT/DELETE /api/games)
- `GET /games` - List games
- `GET /games/my` - Games user is hosting
- `GET /games/:id` - Get game details
- `POST /games` - Create new game
- `PUT /games/:id` - Update game
- `DELETE /games/:id` - Cancel game

### RSVP (GET/POST /api/games/:id)
- `GET /games/:id/rsvps` - List all RSVPs
- `POST /games/:id/rsvp` - Submit RSVP
- `GET /games/:id/rsvp/me` - Current user's RSVP

### Invites (POST/GET /api/invites)
- `POST /games/:id/invites` - Send invites
- `GET /invites/token/:token` - Get invite details
- `POST /invites/token/:token/respond` - Accept/decline

### Users (GET/PUT /api/users)
- `GET /users/me` - Get profile
- `PUT /users/me` - Update profile
- `GET /users/me/games` - Games user is attending

## Database Schema

### Users
- id (UUID), email, password_hash, display_name, avatar_url, created_at, updated_at

### Games
- id (UUID), host_id (FK), name, date, time, location, max_players, buy_in, game_type, notes, is_public, status, created_at, updated_at

### RSVPs
- id (UUID), game_id (FK), user_id (FK), status, message, created_at, updated_at

### Invites
- id (UUID), game_id (FK), host_id (FK), email, token, status, created_at, expires_at

### Waitlist
- id (UUID), game_id (FK), user_id (FK), position, created_at

## UI/UX Specification

### Layout Structure
- **Header**: Logo, navigation (Games, Create Game, My Invites)
- **Hero**: Welcome section with quick stats
- **Main content**: Tab-based interface (Upcoming Games, Create Game, My RSVPs)
- **Footer**: Copyright, links

### Color Palette
- **Background**: #0d1117 (deep charcoal)
- **Card background**: #161b22 (dark slate)
- **Primary accent**: #ff6b35 (poker orange)
- **Secondary accent**: #2ecc71 (felt green)
- **Tertiary**: #9b59b6 (royal purple)
- **Text primary**: #f0f6fc (off-white)
- **Text secondary**: #8b949e (muted gray)
- **Border**: #30363d (subtle gray)

### Typography
- **Headings**: "Bebas Neue", sans-serif
- **Body**: "Source Sans 3", sans-serif
- **Logo/Brand**: "Bebas Neue" with letter-spacing

### Components
- Navigation Bar with glass-morphism
- Game Card with date badge, host info, player count
- Create Game Form with validation
- RSVP Modal with Going/Can't Go/Maybe buttons
- Auth Modal for login/register
- Toast notifications

## Functionality

### Authentication
- JWT-based authentication
- Secure password hashing with bcrypt
- Token stored in localStorage
- Protected routes on frontend

### Game Management
- Create, read, update, delete games
- Host-only modifications
- Public/private game visibility

### RSVP System
- Three states: going, pending, can't-go
- Real-time updates via WebSocket
- Max player enforcement

### Email Invites
- Nodemailer integration
- Configurable SMTP
- Unique invite tokens
- 7-day expiration

### Real-time Updates
- WebSocket connection
- Events: game:created, game:updated, game:cancelled, rsvp:updated
- Toast notifications for updates

## Environment Variables
- DATABASE_URL
- JWT_SECRET
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- EMAIL_FROM
- NODE_ENV
- PORT
- FRONTEND_URL

## Acceptance Criteria
1. Docker compose starts all services
2. Can register and login
3. Can create, view, update, cancel games
4. Can RSVP to games
5. Can send email invites
6. Real-time updates work
7. Responsive on mobile/tablet/desktop
8. Animations are smooth
