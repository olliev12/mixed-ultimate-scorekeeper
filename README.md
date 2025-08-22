# Mixed Ultimate Scorekeeper

A web-based scorekeeping application for mixed ultimate frisbee games, featuring game tracking, team management, and tournament organization.

## Core Features

### Game Management

- Track scores, possession, and player rotations
- Manage multiple games within tournaments
- Support for different game formats and rules

### Team Management

- Player roster management
- Line assignments and substitutions
- Player statistics tracking

### Tournament Organization

- Create and manage multiple tournaments
- Track game schedules and results
- View team and player statistics across tournaments

## Implementation Guide for New Features

### Time Tracking and Cap Notifications

#### Data Structure Additions

```javascript
// In game object (game-control.js)
const game = {
    // Existing properties...
    startTime: null,           // Set when game starts
    caps: {
      hard: {
        duration: 0,
        time: null,
        reached: false
      },
      soft: {
        duration: 0,
        time: null,
        reached: false
      },
      half: {
        duration: 0,
        time: null,
        reached: false
      }
    }         // Tracks if cap has been reached
    notifications: {
        hard: {
          fiveMinWarning: false,  // Track if 5-min warning was shown
          capReached: false  // Track if cap notification was shown
        },    
        soft: {
          fiveMinWarning: false,  // Track if 5-min warning was shown
          capReached: false  // Track if cap notification was shown
        },    
        half: {
          fiveMinWarning: false,  // Track if 5-min warning was shown
          capReached: false  // Track if cap notification was shown
        }
    }
};
```

#### Notification System

1. **Permission Handling**

   - Request notification permission on app load
   - Support both Web Notifications API and fallback to alerts

2. **Timer Setup**

   - Set up timers when game starts
   - Handle page refreshes by recalculating remaining time

#### UI Components

1. **Game Settings**

   - Add cap duration setting (default: 0 minutes for all caps to disable)
   - Show countdown to cap in game interface
   - Visual indicators for cap status

2. **Notification Types**

   - 5-minute warning before cap
   - Cap reached notification
   - Visual feedback in the UI for both states

#### Implementation Steps

1. **Game Initialization**

   - Set `startTime` when game begins
   - Calculate `capTime`
   - Call `setupCapTimers()`

2. **Timer Management**

   - Create functions to handle timer setup and cleanup
   - Handle page refreshes by recalculating remaining time

3. **Notification Handlers**

   - System notifications (if permitted)
   - Fallback to browser alerts
   - UI updates to reflect cap status

### Game Settings

- **Tournament-level Settings**
  - Settings that apply to all games in a tournament
  - Allow per-game overrides where applicable

- **Game Time and Date**
  - Track game start and end times
  - Support for scheduling future games
    - Allow games to be scheduled without setting startingRatio or startOn
      - These will need to be set when the game starts

- **Cap Management**
  - Halftime cap
  - Soft cap
  - Hard cap
  - Allow disabling caps by setting to 0

- **Timeout Rules**
  - Timeouts per half (configurable number)
  - Floater timeouts (checkbox)
  - Timeout tracking UI with remaining count
  - Rules for timeouts during caps:
    - Option to disallow timeouts during soft cap
    - Option to disallow timeouts during hard cap

### Line Management

- **Rotation Systems**
  - Even rotation (default, current implementation)
  - Line of play (O/D rotation based on scoring)
  - Custom rotation types (future extensibility)

- **Line Configuration**
  - Custom names for line types (O/D/X/K)
  - Line-specific settings and behaviors

#### Line Implementation Notes

- add line rotation setting
  - "line rotation" dropdown
    - "even rotation" (default, what we have now)
    - "line of play" (D line after we score, O line after they score)

### Game Flow

- **Game Over State**
  - Automatic detection when gameTo score is reached
  - Manual game over option
  - Win/loss tracking with visual indicators (green/red)

#### Game Over Implementation Notes

- add popup with "game over?" message, when gameTo score is reached
  - with "yes" and "no" buttons
  - "yes" should save the game and mark it as complete
  - "no" should just close the popup
- when we save the game manually, prompt with "game over?" message
  - with "yes" and "no" buttons
  - "yes" should save the game and mark it as complete
  - "no" should just save the game as normal

### Substitutions

- **Substitution Tracking**
  - Mark players as substituted in/out
  - Track playing time with partial points for substitutions
  - Visual indicators for substitution events

- **Substitution Rules**
  - Handle mid-point substitutions
  - Track player rotations with substitutions
  
#### Substitution Implementation Notes

- after a line is saved, have some sort of "substitution" checkbox on the playerSelectionModal
  - if checked, the players added/removed will be considered substitutions
    - add a "substitutions" object to the events game data
      - this will contain "original": "subsituted" key/value pairs
      - when calculating play time, these will count for -0.5 and 0.5 points played respectively (for the original and substitute)
  - if not, the players added/removed will be considered normal line changes

### Events System

- **Event Management**
  - View and edit all game events
  - Undo functionality (for the last event)
  - Event-based game state management

- **Event Types**
  - Points scored
  - Timeouts called
  - Halftime

#### Events Implementation Notes

- editing the team that scored will affect next point's possession start
- This should also repopulate the line with the players selected for the event that was just undone

## Technical Implementation Notes

### Data Persistence

- **Storage**
  - All game data stored in localStorage
  - Support for import/export of data
  - Automatic backup of game state

- **Data Structure**
  - Hierarchical organization (Tournament > Games > Events)
  - Efficient querying of game state

### Browser Compatibility

- **Supported Browsers**
  - Modern browsers with ES6+ support
  - Progressive enhancement approach
  - Fallbacks for unsupported features

- **Responsive Design**
  - Mobile-first approach
  - Touch-friendly controls
  - Adaptive layout for different screen sizes

## Future Enhancements

1. **Advanced Statistics**
   - Player performance metrics
   - Team statistics
   - Game analysis tools

2. **Offline Support**
   - Service worker for offline functionality
   - Background sync for data consistency

3. **Sharing and Collaboration**
   - Share game results
   - Multi-device synchronization
   - Team management features
