# 01 — Product overview

**Agro Hogwards** is a SaaS for home and professional growers. One user owns one or more physical grow boxes (ESP8266 controllers with sensors and relays).

## Users
- Hobby growers, market gardeners, greenhouse operators, florists.
- Admins/developers (role in `user_roles`) manage the strain library, articles, users.

## Core scenarios
1. Register → pair a device (QR setup or manual Device ID).
2. See live telemetry on the Dashboard (`/dashboard?device=<uuid>`).
3. Control light / climate / pump / ventilation manually, or enable **AI mode** which derives targets from the Master Plant's strain.
4. Add plants, assign strains, track lifecycle stages automatically by age (Laboratory).
5. Receive alerts (dry soil, temperature/humidity out of range, offline, pump dry lock) in the bell and Telegram.
6. Archive harvested plants (Grow History) and retired devices (archive section on My Devices).

## UI languages
Ukrainian (primary), English, Russian.
