# DhanTrack — Personal Finance Manager (Android)

A 100% offline-first, private personal finance manager built with Flutter, Dart, and Drift (SQLite).

## Features
- **Strictly Offline-First**: No cloud servers, no account registration, no telemetry.
- **Accurate Financial Math**: All amounts stored in integer **paise** (₹1 = 100 paise) to prevent floating-point rounding bugs.
- **SQLite with Drift**: Fast, ACID-compliant local database with schema migrations.
- **Multi-Account Tracking**: Cash, Main Bank, Savings, with atomic account transfers.
- **Independent Categories**: Fully customizable income and expense categories.
- **Lending & Repayment**: Friends ledger with partial repayments and separate accounting from spending reports.
- **Budgeting Engine**: Monthly limits with 80% amber and 100% red visual indicators.
- **Biometric Security**: Fingerprint and device lock via `local_auth`.
- **Manual Backup & Restore**: Export consistent SQLite `.db` snapshots to Google Drive via Android file picker or share sheet.

## Building and Running
```bash
# 1. Install dependencies
flutter pub get

# 2. Run Drift code generator
flutter pub run build_runner build --delete-conflicting-outputs

# 3. Run automated tests
flutter test

# 4. Run on Android device or emulator
flutter run
```
