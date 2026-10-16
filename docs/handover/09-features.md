# 09 — Features & routes

| Route | Page | What it does |
|---|---|---|
| /auth, /auth/update-password | Auth, UpdatePassword | email auth |
| / | Index | landing / redirect |
| /devices | DevicesPage | My Devices: active list + archive section, add device (QR / Device ID) |
| /dashboard?device= | DashboardPage → Dashboard | live sensors, charts, DeviceControls, AI mode |
| /analytics | AnalyticsPage | advanced charts |
| /laboratory | LaboratoryPage | plants grouped by grow box, calculators, timeline |
| /grow-history, /grow-history/:plantId | GrowHistoryPage, GrowArchiveDetails | harvested plants |
| /library, /library/:id | LibraryPage, ArticleDetailPage | strains + knowledge base |
| /remote-control | RemoteControlPage | real devices via useDevices (RemoteControl widget still has placeholder numbers) |
| /device/:id | DeviceDetail | legacy detail |
| /account | Account | profile, notifications, billing (tab via `?tab=`) |
| /admin | AdminPage | admin only: strains, AI importer, articles, users |
| /settings | settings | |

Other: Education/Help mode (global toggle, `HelpModeContext`), Demo simulation panel (fake device for testing alerts), Expert mode toggle hides hysteresis/calibration.
