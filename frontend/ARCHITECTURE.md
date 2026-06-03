# Architecture

## Core Structure
The app follows a domain-driven architectural approach optimized for offline-first React Native apps.

### Directory Breakdown
- `src/assets`: Images, fonts, and other static assets.
- `src/components/ui`: Highly reusable dumb components (Buttons, Typography).
- `src/components/domain`: Feature-specific components.
- `src/config`: Environment and global config.
- `src/core/store`: Zustand stores for reactive state.
- `src/core/ml`: Abstractions around TensorFlow Lite / MediaPipe logic.
- `src/core/db`: Abstractions around SQLite storage.
- `src/navigation`: React Navigation setup.
- `src/screens`: App screens directly rendered by the navigator.
- `src/types`: TypeScript interfaces and type definitions.
- `src/utils`: Helper functions and hooks.

## State Management
Zustand is used for global state management. It provides a lightweight mechanism to subscribe to state changes compared to Redux, avoiding boilerplate.
- For persistence, Zustand's `persist` middleware can be combined with MMKV or SQLite in the future.

## Offline-First Design
- **Read Path**: The app strictly reads data from the local SQLite DB or local state.
- **Write Path**: Writes are stored locally first. A sync queue will manage pushing events to a cloud backend when connectivity is restored.
- **ML Models**: All TFLite and MediaPipe models are bundled with the app to avoid dynamic downloading, ensuring guaranteed offline availability.
