# Music Player

A cross-platform music player app built with React Native and Expo, featuring a modern UI, persistent playback state, and integration with JioSaavn API for music discovery.

## Features

- **Music Streaming** – Browse and stream songs from JioSaavn API
- **Cross-Platform** – Native iOS, Android, and Web support via Expo
- **Playback Controls** – Play, pause, skip, shuffle, and repeat modes
- **Progress Control** – Seek through tracks with slider
- **Queue Management** – View and manage upcoming songs
- **Persistent State** – Queue and playback state saved to device storage
- **Theme Support** – Light/dark mode ready architecture
- **Modern UI** – Action sheets, skeleton loaders, mini player component

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React Native (0.81.5) |
| **Build/Runtime** | Expo (54.0.30) |
| **Language** | TypeScript (5.9.2) |
| **State Management** | Zustand (5.0.9) with Persistence |
| **Navigation** | React Navigation (Native Stack) |
| **Audio Engine** | Expo AV |
| **API Client** | Axios (1.13.2) |
| **Storage** | AsyncStorage |
| **Icons** | Expo Vector Icons |

## Project Architecture

```
src/
├── api/
│   └── saavn.ts                 # JioSaavn API integration, song fetching
├── components/
│   ├── ActionSheet.tsx          # Reusable action sheet component
│   ├── MiniPlayer.tsx           # Mini player overlay component
│   └── Skeleton.tsx             # Loading skeleton UI
├── navigation/
│   └── nav.ts                   # Navigation configuration
├── player/
│   └── audio.ts                 # Audio playback logic & controls
├── screens/
│   ├── Home.tsx                 # Browse & search songs
│   ├── Player.tsx               # Full player UI
│   ├── Queue.tsx                # Queue management
│   └── Album.tsx                # Album details view
├── store/
│   └── playerStore.ts           # Zustand store: queue, playback, playlist state
├── theme/
│   ├── index.ts                 # Design tokens (colors, spacing, fonts)
│   ├── ThemeProvider.tsx        # Theme context setup
│   └── tokens.ts                # Token definitions
└── utils/
    └── time.ts                  # Time formatting utilities
```

### Key Architectural Patterns

#### 1. **State Management with Zustand**
- Centralized player state in `playerStore.ts`
- Persistent storage middleware for queue and playback position
- Clean separation between UI and state logic
- Supports repeat modes (off, one, all) and shuffle

#### 2. **API Abstraction Layer**
- `api/saavn.ts` encapsulates all JioSaavn API calls
- Handles multiple URL format variations from different API wrappers
- Type-safe responses with `SaavnSong` interface
- 20-second timeout for reliability

#### 3. **Component-Based UI**
- Modular, reusable components (MiniPlayer, ActionSheet, Skeleton)
- Screens organized by user flow (Home → Album → Player → Queue)
- Theme provider for consistent styling

#### 4. **Navigation**
- Stack-based navigation with React Navigation
- Integrated mini player across all screens
- Deep linking ready

## Setup & Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (for iOS builds)
- Android: Android Studio (for Android builds)

### Installation Steps

```bash
# Clone the repository
git clone <repo-url>
cd MusicPlayer

# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platform
npm run android   # Android emulator
npm run ios       # iOS simulator
npm run web       # Web browser
```

## Configuration

### App Metadata
- Edit [app.json](app.json) to customize app name, version, and platform-specific settings
- Android: Configure package name under `android.package`
- iOS: Adjust `supportsTablet` and other iOS-specific settings
- All platforms use the same icon: `assets/icon.png`

### API Integration
- JioSaavn API base URL: `https://saavn.sumit.co`
- Adjust timeout in [src/api/saavn.ts](src/api/saavn.ts) if needed
- API responses are normalized to the `Song` type for consistency

## Key Design Decisions & Tradeoffs

### 1. **Zustand over Redux**
- **Chosen**: Lighter bundle size, simpler boilerplate, fewer dependencies
- **Tradeoff**: Smaller ecosystem compared to Redux, less middleware support

### 2. **JioSaavn Wrapper API**
- **Chosen**: Free, no authentication needed, good song selection
- **Tradeoff**: Unreliable third-party service, API format inconsistencies, URL variations
- **Mitigation**: `pickLastUrl()` function handles multiple URL formats

### 3. **AsyncStorage for Persistence**
- **Chosen**: Simple key-value storage, works across platforms
- **Tradeoff**: Not optimized for large datasets (e.g., 1000+ songs)
- **Use Case**: Works well for queue persistence in typical music app scenarios

### 4. **Expo over Bare React Native**
- **Chosen**: Faster development, OTA updates, zero native code setup
- **Tradeoff**: Larger app bundle, limited native module access
- **Benefit**: Streamlined build pipeline with EAS Build

### 5. **Song Type Flexibility**
- **Chosen**: `Song` interface allows extra props (`[key: string]: any`)
- **Tradeoff**: Less type safety, potential for undefined field access
- **Reason**: Different API wrappers return varying song object structures

### 6. **Global Theme Provider**
- **Chosen**: Single source of truth for colors, spacing, typography
- **Tradeoff**: Extra context provider overhead
- **Benefit**: Consistent UI, easy dark mode support

## Development Workflow

### Adding a New Feature

1. **Create API endpoint** in `src/api/saavn.ts`
2. **Update store** in `src/store/playerStore.ts` if needed
3. **Build UI component** in `src/components/` or screen in `src/screens/`
4. **Add navigation route** in `src/navigation/nav.ts`
5. **Test** on target platform: `npm run android|ios|web`

### Code Organization Tips

- **Utils**: Helper functions (`time.ts`)
- **Theme**: All design tokens in one place (`theme/tokens.ts`)
- **Store**: Single file for player state (easier than slices)
- **API**: One API file per service

## Build & Deployment

### Local Build
```bash
expo build:android   # APK/AAB for Android
expo build:ios       # IPA for iOS
```

### EAS Build (Recommended)
```bash
eas build --platform android
eas build --platform ios
eas build --platform web
```

- Configured via [eas.json](eas.json)
- No local Xcode/Android Studio needed
- Faster builds on managed servers

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API calls timing out | Increase timeout in `src/api/saavn.ts` from 20s to 30s+ |
| Songs not playing | Check audio URL extraction in `pickLastUrl()` function |
| AsyncStorage not persisting | Ensure app has storage permissions on device |
| Build failures | Run `expo doctor` and follow recommendations |

## Future Improvements

- [ ] Local database (SQLite) for better persistence at scale
- [ ] Offline mode with cached songs
- [ ] User authentication & playlists
- [ ] Audio equalizer
- [ ] Lyrics integration
- [ ] Web API for better web support

## License

MIT

## Contributing

Pull requests welcome! Please follow the existing code style and add tests for new features.
