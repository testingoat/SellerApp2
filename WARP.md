# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

SellerApp2 is a React Native seller management application designed to integrate with the main customer app, server, and delivery app ecosystem. It serves as the seller portal for managing products, orders, and store operations.

**Key Context**: This is currently a frontend-only app with mock data, designed to be systematically integrated with the backend API (staging server: `https://staging.goatgoat.tech/api`).

## Development Commands

### Environment Setup
```bash
# Install dependencies
npm install

# iOS setup (first time or after native dependency changes)
bundle install
bundle exec pod install
```

### Running the App
```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS  
npm run ios
```

### Testing and Code Quality
```bash
# Run tests
npm test

# Run linter
npm run lint

# Run single test file
jest __tests__/App.test.tsx

# Run tests in watch mode
jest --watch
```

### Platform-Specific Commands
```bash
# Force reload on Android
# Press R key twice or Ctrl+M (Windows/Linux) / Cmd+M (macOS) → Reload

# Force reload on iOS
# Press R in iOS Simulator
```

## Architecture Overview

### Technology Stack
- **Framework**: React Native 0.81.4 with TypeScript
- **Navigation**: React Navigation v7 (Stack + Bottom Tabs)
- **State Management**: Zustand for auth state, React Context for theme/network
- **Styling**: Custom theme system with light/dark mode support
- **HTTP Client**: Axios with custom interceptors
- **Key Dependencies**: AsyncStorage, Vector Icons, Gesture Handler, Safe Area Context

### Project Structure
```
src/
├── components/           # Reusable UI components
├── config/              # Configuration and types
├── context/             # React Context providers (Theme, Network)
├── hooks/               # Custom hooks
├── navigation/          # Navigation configuration
├── screens/             # Screen components (20+ screens)
├── services/            # API services and HTTP client
├── state/               # Zustand stores
└── utils/               # Utility functions
```

### Navigation Architecture
```
App → AuthNavigator → MainTabNavigator
                   → Various modal/stack screens

Auth Flow: Splash → Login → OTP → Store Registration → Dashboard
Main Tabs: Dashboard | Products | Orders | Analytics | Profile
```

### State Management Patterns
- **Authentication**: Zustand store (`authStore.ts`) for user session, tokens, temp data
- **Theme**: React Context with system-aware dark/light mode switching
- **Network**: React Context with connectivity monitoring and error handling
- **Local Storage**: Currently using in-memory storage (needs AsyncStorage integration)

### API Integration Status
- **Current**: Mock services with temporary implementations
- **Target**: Integration with `https://staging.goatgoat.tech/api/seller`
- **Authentication**: Phone-based OTP flow
- **HTTP Client**: Configured with interceptors for token management and error handling

## Development Rules and Patterns

### Server Deployment Strategy
**CRITICAL**: Follow the staging-first deployment pattern:
1. Make changes on staging server (`ssh root@147.93.108.121`)
2. Test and confirm changes work
3. Push changes to git
4. Pull changes on production server
5. Apply changes to production
6. **Never make direct changes to production server**

### Code Architecture Patterns
- **Screens**: Each screen is a complete feature with its own logic and state
- **Navigation**: Use typed navigation parameters defined in `navigationTypes.ts`
- **Theming**: Always use `useTheme()` hook for consistent styling
- **Network**: Wrap API calls with network error handling using `useNetworkError` hook
- **Error Handling**: Use `NetworkErrorBoundary` for automatic error catching

### Authentication Flow
```typescript
// Key authentication states to handle:
- isAuthenticated: boolean
- isLoading: boolean  
- isNewUser: boolean
- tempPhone: string | null (for OTP flow)

// Authentication lifecycle:
login() → verifyOtp() → [conditional] storeRegistration → mainApp
```

### Network Error Handling
The app includes comprehensive network error handling:
- `NetworkContext` for connectivity monitoring
- `NetworkErrorBoundary` for automatic error screen display
- `useNetworkError` hook for API call protection
- Custom `NetworkErrorScreen` with retry functionality

### Theme System
```typescript
// Theme structure supports:
- Light/dark mode with system detection
- Consistent color palette
- Responsive to system changes
- Green primary color (#3be340)
```

## Testing Patterns

### File Locations
- Unit tests: `__tests__/` directory
- Test configuration: `jest.config.js`
- Testing utilities in component files

### Key Areas to Test
- Authentication flows (login, OTP, registration)
- Navigation state changes
- API service integration
- Network error scenarios
- Theme switching functionality

## Common Development Tasks

### Adding New Screens
1. Create screen component in `src/screens/`
2. Add navigation types in `config/navigationTypes.ts`
3. Register in appropriate navigator (`AppNavigator.tsx`, `AuthNavigator.tsx`, etc.)
4. Wrap with `NetworkErrorBoundary` for error handling

### API Integration
1. Define endpoints in `src/config/index.ts`
2. Create service methods in appropriate service file
3. Use `httpClient` instance with automatic token handling
4. Implement proper error handling with network checks

### State Management
1. For global state: Extend Zustand stores
2. For UI state: Use React state or Context
3. For persistence: Plan AsyncStorage integration (currently mock)

### Styling Guidelines  
- Use `useTheme()` hook for colors and theme-aware styling
- Support both light and dark modes
- Maintain consistent spacing and typography
- Use React Native StyleSheet for performance

## Backend Integration Context

### Current Status
- Frontend-only implementation with mock data
- Ready for systematic backend integration
- Staging server configured: `https://staging.goatgoat.tech/api`

### Integration Priority
1. **Phase 1**: Authentication (login, OTP, registration)
2. **Phase 2**: Product management (CRUD operations)
3. **Phase 3**: Order management (status updates, timeline)
4. **Phase 4**: Advanced features (analytics, payments, settings)

### Key Integration Points
- Replace mock `authService` with real API calls
- Implement AsyncStorage for token persistence
- Add real-time WebSocket connections for orders
- Integrate push notifications for order updates

## Platform-Specific Notes

### iOS Development
- Requires Xcode and CocoaPods setup
- Run `bundle exec pod install` after dependency changes
- Use `npm run ios` for simulator or device testing

### Android Development  
- Requires Android Studio and SDK setup
- Use `npm run android` for emulator or device testing
- Check Android manifest for permissions

### Windows Development Environment
- Project is currently developed on Windows with PowerShell
- Use forward slashes in paths when scripting
- Be mindful of line ending differences (CRLF vs LF)

This documentation should be updated as the project evolves and backend integration progresses.