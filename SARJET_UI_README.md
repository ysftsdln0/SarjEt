

# File Structure
```
src/
├── components/
│   ├── Header.tsx              # App header with profile
│   ├── SearchBar.tsx           # Search input component
│   ├── SegmentedControl.tsx    # Map/List switcher
│   ├── StationMarker.tsx       # Map marker & callout
│   ├── LoadingScreen.tsx       # Loading state
│   ├── StationList.tsx         # List view component
│   └── ProfileModal.tsx        # User profile modal
├── screens/
│   ├── SarjetMainScreen.tsx    # Main app screen
│   └── StationDetailScreen.tsx # Station detail view
├── navigation/
│   └── AppNavigator.tsx        # Navigation setup
├── services/
│   ├── chargingStationService.ts # OpenChargeMap API
│   └── locationService.ts      # GPS location service
├── data/
│   └── mockData.ts            # Offline fallback data
└── types/
    └── index.ts               # TypeScript definitions
```

