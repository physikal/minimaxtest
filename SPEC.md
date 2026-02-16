# Home Poker Game Coordinator - Specification

## Project Overview
- **Project name**: Poker Pulse
- **Type**: Single-page web application
- **Core functionality**: Coordinate home poker games with email invites and RSVP tracking
- **Target users**: Home poker game hosts and players

## UI/UX Specification

### Layout Structure
- **Header**: Logo, navigation (Games, Create Game, My Invites)
- **Hero**: Welcome section with quick stats
- **Main content**: Tab-based interface (Upcoming Games, Create Game, My RSVPs)
- **Footer**: Copyright, links

### Responsive Breakpoints
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (two columns)
- Desktop: > 1024px (three columns for games grid)

### Visual Design

#### Color Palette
- **Background**: #0d1117 (deep charcoal)
- **Card background**: #161b22 (dark slate)
- **Primary accent**: #ff6b35 (poker orange)
- **Secondary accent**: #2ecc71 (felt green)
- **Tertiary**: #9b59b6 (royal purple)
- **Text primary**: #f0f6fc (off-white)
- **Text secondary**: #8b949e (muted gray)
- **Border**: #30363d (subtle gray)

#### Typography
- **Headings**: "Bebas Neue", sans-serif (bold, impactful)
- **Body**: "Source Sans 3", sans-serif
- **Logo/Brand**: "Bebas Neue" with letter-spacing

#### Spacing System
- Base unit: 8px
- Card padding: 24px
- Section gaps: 32px
- Element gaps: 16px

#### Visual Effects
- Card hover: translateY(-4px) with box-shadow expansion
- Button hover: brightness increase + slight scale
- Tab transitions: 0.3s ease
- Staggered card reveals on load (animation-delay increments)
- Subtle card inner glow effect

### Components

#### Navigation Bar
- Fixed top, glass-morphism effect (backdrop-filter: blur)
- Logo left, nav links right
- Active state: orange underline

#### Game Card
- Date/time badge (top right corner, accent color)
- Game title (large, bold)
- Host name with avatar placeholder
- Location (address)
- Player count: "X/Y confirmed"
- RSVP status indicator (dot: green=confirmed, yellow=pending, red=declined)
- Action buttons: View Details, RSVP

#### Create Game Form
- Game name input
- Date picker
- Time picker
- Location input (address)
- Max players dropdown (2-20)
- Buy-in amount input
- Game type dropdown (Texas Hold'em, Omaha, Mixed)
- Notes textarea
- Submit button with loading state

#### RSVP Modal
- Player name display
- Status buttons: ✅ Going, ❌ Can't Go, ⏳ Maybe
- Optional message field
- Confirmation message on submit

#### Invite Section (per game)
- Email input field
- Add guest button
- Guest list with status badges
- "Send Invites" button

## Functionality Specification

### Core Features

1. **Game Creation**
   - Form validation (all required fields)
   - Save to localStorage
   - Generate unique game ID

2. **Game Listing**
   - Display all upcoming games sorted by date
   - Show game details on click
   - Filter: All / Hosted by me / Invited to

3. **Email Invites**
   - Add email addresses to guest list
   - Store invites with game
   - Display guest status

4. **RSVP System**
   - Three states: Going, Can't Go, Maybe
   - Update game player count dynamically
   - Persist to localStorage

5. **Data Persistence**
   - All data stored in localStorage
   - Demo data seeded on first load

### User Interactions
- Click game card → expand details / show RSVP modal
- Tab navigation between sections
- Form submission with validation feedback
- Toast notifications for actions

### Edge Cases
- No games: Show empty state with CTA
- Past games: Show in separate "Past Games" section or dimmed
- Max players reached: Disable "Going" RSVP option
- Invalid email format: Show inline error

## Acceptance Criteria
1. ✅ Page loads without errors
2. ✅ Can create a new poker game with all fields
3. ✅ Game appears in listing after creation
4. ✅ Can RSVP to a game (Going/Can't Go/Maybe)
5. ✅ Player count updates based on RSVP
6. ✅ Can add email invites to a game
7. ✅ Data persists across page refreshes
8. ✅ Responsive on mobile/tablet/desktop
9. ✅ Animations are smooth and purposeful
10. ✅ Empty states guide user to action
