# Roster Mobile App

React Native mobile application for the Norwegian Labor Law Compliant Roster SaaS.

## Features

### Employee Features
- **View Schedule**: See upcoming shifts at a glance
- **Shift Marketplace**: Claim available shifts
- **Shift Swaps**: Request to swap shifts with colleagues
- **Time-Off Requests**: Submit vacation and sick leave requests
- **Push Notifications**: Get notified of schedule changes
- **Compliance Indicators**: See color-coded compliance status
- **Accrual Balances**: Track vacation and sick time balances

### Manager Features (In Addition)
- **Approve Requests**: Approve/reject time-off and shift swaps
- **Dashboard**: View KPIs and metrics on-the-go
- **Quick Actions**: Publish rosters, approve shifts

## Setup

### Prerequisites
- Node.js 18+
- React Native development environment
- For iOS: Xcode 15+, CocoaPods
- For Android: Android Studio, JDK 17+

### Installation

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# iOS: Install CocoaPods
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
mobile/
├── src/
│   ├── screens/           # Screen components
│   │   ├── auth/          # Login, register
│   │   ├── schedule/      # Schedule view, shift details
│   │   ├── marketplace/   # Shift marketplace
│   │   ├── timeoff/       # Time-off requests
│   │   └── profile/       # User profile, settings
│   ├── components/        # Reusable components
│   │   ├── ShiftCard.tsx
│   │   ├── ComplianceBadge.tsx
│   │   └── NotificationBell.tsx
│   ├── navigation/        # Navigation config
│   ├── services/          # API services
│   │   └── api.ts
│   ├── context/           # React context (auth, theme)
│   ├── hooks/             # Custom hooks
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities, i18n
├── android/               # Android native code
├── ios/                   # iOS native code
├── package.json
└── README.md
```

## Configuration

### API Endpoint

Edit `src/services/api.ts`:

```typescript
const API_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://api.roster-saas.com/api';
```

### Push Notifications

1. **iOS**: Configure APNs in Apple Developer Portal
2. **Android**: Configure FCM in Firebase Console
3. Update `src/services/pushNotifications.ts` with credentials

## Building for Production

### iOS

```bash
cd ios
xcodebuild -workspace RosterMobile.xcworkspace \
  -scheme RosterMobile \
  -configuration Release \
  -archivePath build/RosterMobile.xcarchive \
  archive
```

### Android

```bash
cd android
./gradlew assembleRelease

# APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

## Key Features Implementation

### 1. Schedule View
- Calendar view with daily/weekly/monthly modes
- Color-coded compliance indicators (green/yellow/red)
- Pull-to-refresh
- Offline support with local cache

### 2. Push Notifications
- New schedule published
- Shift changed
- Shift swap request
- Time-off approved/rejected
- Upcoming shift reminder (1 hour before)

### 3. Shift Marketplace
- Browse available shifts
- Filter by date, department, role
- One-tap claim
- Real-time availability status

### 4. Offline Support
- Cache schedule locally
- Queue actions when offline
- Sync when back online

## Localization

Supports Norwegian (Bokmål) and English:

```typescript
import { useTranslation } from '../utils/i18n';

const { t } = useTranslation();

// Usage
<Text>{t('schedule.title')}</Text>
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Deployment

### TestFlight (iOS)

1. Archive app in Xcode
2. Upload to App Store Connect
3. Add to TestFlight
4. Invite testers

### Google Play Internal Testing (Android)

1. Build signed APK/AAB
2. Upload to Google Play Console
3. Create internal testing track
4. Invite testers

## Troubleshooting

### iOS Build Issues

```bash
# Clean build
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Android Build Issues

```bash
# Clean gradle
cd android
./gradlew clean
cd ..
```

### Metro Bundler Issues

```bash
# Clear cache
npm start -- --reset-cache
```

## Contributing

See main repository CONTRIBUTING.md

## License

MIT - See LICENSE file
