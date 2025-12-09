
# SpoFreeFy Changelog

## [2.1.0] - The "Tweaks" Update (Current)

### ✨ New Features
#### 🎧 Player & Audio
- **Expanded Full Screen Player**: A complete overhaul of the mobile and desktop full-screen player experience with blurred background art.
- **Lyrics Integration**: Added a dedicated Lyrics view (Sidebar on Desktop, Full Screen on Mobile) with placeholder styling for future real-time lyric syncing.
- **Queue Management**: Added a "Next Up" queue sidebar/view with options to Shuffle, Clear Queue, and Save Queue as a new Playlist.
- **Sleep Timer**: Added a configurable sleep timer (15, 30, 45, 60 min, or custom) in Settings.
- **Visualizer**: Added an optional audio spectrum visualizer (Canvas-based) that reacts to music frequency.
- **Media Session API**: Integrated lock-screen and control center support (Play/Pause/Next/Prev/Seek) for mobile and desktop.
- **Audio Quality Selector**: Added ability to switch between Low, High, Lossless, and Hi-Res audio qualities.

#### 📚 Library & Organization
- **Library Tabs**: Organized library into Playlists, Liked Songs, Saved Albums, and Followed Artists.
- **Import Playlist**: Added a powerful modal to import playlists via Text (Artist - Title) or CSV file upload.
- **Export Options**: 
    - **Export to CSV**: Export tracklists from Albums, Playlists, or Liked Songs to CSV.
    - **Download ZIP**: Download full albums/playlists as a ZIP file containing audio tracks.
- **Liked Songs**: Dedicated "Liked Songs" playlist functionality.

#### 🎨 Customization (Tweaks)
- **Accent Color**: Users can now select a custom accent color that themes the player, sliders, and active elements.
- **Appearance Modes**:
    - **Compact Mode**: Denser list view for tracks.
    - **Square Avatars**: Option to toggle between circle and square artist images.
    - **Grayscale Mode**: A monochrome accessibility/aesthetic mode.
    - **Disable Glow**: Performance option to remove the background blur glow in the player.
- **High Performance Mode**: Disables heavy blur effects and animations for slower devices.
- **Reduced Motion**: Disables specific UI animations.
- **Dynamic Title**: Browser tab title now updates to show the currently playing song.

### 📱 Mobile & Responsive Improvements
- **Mobile Navigation**: Added a persistent bottom navigation bar for mobile users.
- **Mini Player Optimization**: 
    - Docked the mini-player above the mobile navigation bar.
    - Added Safe Area support (iPhone X+ notches).
    - Simplified mobile mini-player controls (hid Volume, Queue, and Lyrics buttons to save space).
- **Touch Interactions**: Improved touch targets and z-indexing for mobile usage.

### 🛠 Fixes & Improvements
- **iOS Audio Fixes**: Implemented specific logic to handle iOS Safari AudioContext limitations (bypassing Visualizer on iOS to ensure background playback works).
- **Audio Context Management**: Fixed issues where audio would stop or loop when pausing/playing or switching visualizer modes.
- **Keyboard Shortcuts**: Added a modal listing available keyboard shortcuts (Space to play, Arrows to seek, M to mute, etc.).
- **Search History**: Added local storage persistance for recent searches.

---

## [2.0.0] - The "Reforged" Update
*Initial React/TypeScript Rewrite*

- **Architecture Rewrite**: Completely migrated codebase from Vanilla JS to React 18 + TypeScript.
- **UI Overhaul**: Implemented Tailwind CSS for a modern, responsive, Spotify-inspired interface.
- **Hifi API Integration**: Integrated reverse-engineered API wrappers for robust stream resolution.
- **Lossless Audio**: Added native support for FLAC streaming in the browser.
- **Local Storage**: Implemented `storageService` to persist playlists and liked songs without a backend.
- **Routing**: Implemented a state-based navigation system (Home, Search, Library, Details).

---

## [1.5.0] - High Fidelity Beta
- **Audio Engine**: Switched audio source to higher quality endpoints (320kbps AAC).
- **Album Art**: Added support for high-resolution 640x640 album covers.
- **Volume Control**: Added logarithmic volume slider.
- **Bug Fixes**: Fixed issue where skipping tracks would cause buffering loops.

---

## [1.2.0] - Library Update
- **Playlists**: Added basic support for creating local playlists.
- **Search**: Improved search algorithm to include Albums and Artists, not just tracks.
- **Recent Searches**: Added a simple list of recently searched terms.

---

## [1.1.0] - Mobile Update
- **Responsive Design**: Added basic media queries for mobile devices.
- **Touch Events**: Added touch support for the seeker bar.
- **Performance**: Optimized image loading for cellular data.

---

## [1.0.0] - Initial Release
- **Core Player**: Basic HTML5 Audio implementation.
- **Search**: Simple keyword search for tracks.
- **Playback Controls**: Play, Pause, Next, Previous.
- **Theme**: Basic Dark Mode implementation.

---

## [1.0 Beta]
- **UI**: Added the first iteration of the sidebar navigation.
- **Queue**: Implemented a basic "Next Up" array in memory.
- **Shuffle**: Added Fisher-Yates shuffle algorithm.

---

## [1.0 Alpha]
- **Prototype**: Proof of concept using hardcoded audio streams.
- **Layout**: Simple single-page application with no routing.
- **Controls**: Native browser audio controls only.
