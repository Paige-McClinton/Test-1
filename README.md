# Travel Planner

A mobile travel planning app built with [Expo](https://expo.dev) and React Native. Plan each trip in one place:

- **Itinerary** — every day of the trip laid out, with times, places and notes for each plan
- **Budget** — set a budget, log expenses by category, and see what's left (it turns red if you go over)
- **Packing list** — check items off as you pack, grouped by category, with a one-tap essentials list
- **Destination guide** — an overview of the place plus notes for must-sees, food, getting around and tips

Everything is saved on your phone, so it works offline.

## Run it on your phone

1. Install [Node.js](https://nodejs.org) (the LTS version).
2. Install the **Expo Go** app on your phone (App Store or Google Play).
3. In a terminal, from this folder:

   ```bash
   npm install
   npx expo install --fix   # lines up package versions with your Expo SDK
   npx expo start
   ```

4. Scan the QR code that appears — with the Camera app on iPhone, or from inside Expo Go on Android.

You can also press `i` (iOS simulator, Mac only) or `a` (Android emulator) in the terminal.

## Project layout

```
App.tsx                      app entry: simple screen navigation
src/
  types.ts                   data model (Trip, ItineraryItem, Expense, …)
  utils.ts                   date, time and money helpers
  theme.ts                   colours, spacing and text styles
  state/TripsContext.tsx     trips state, saved with AsyncStorage
  components/ui.tsx          shared buttons, inputs, cards, form sheet
  components/TripFormModal.tsx
  screens/TripListScreen.tsx
  screens/TripDetailScreen.tsx
  screens/tabs/              Itinerary, Budget, Packing and Guide tabs
```

## Tips

- Dates are typed as `YYYY-MM-DD` (e.g. `2026-07-14`); times as `9:30` or `14:00`.
- Tap any plan, expense or guide note to edit or delete it.
- On the packing list, tap to check an item off and press and hold to remove it.
- `npm run typecheck` checks the TypeScript.

## Ideas for next steps

- Calendar date pickers instead of typed dates
- Photos and maps for guide entries
- Sharing a trip with travel companions
- Currency conversion for expenses
