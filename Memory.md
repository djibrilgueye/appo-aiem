# AIEM Project Context for Claude

> **Last updated**: 2025-01-19
> **Project**: Africa Interactive Energy Map (AIEM)
> **Organization**: APPO (African Petroleum Producers' Organization)

---

## Quick Start

```bash
# Start the application
npm run dev -- -p 3333

# Access URLs
# - App: http://localhost:3333
# - Login: http://localhost:3333/login
# - Admin: http://localhost:3333/admin
# - Import IEA: http://localhost:3333/admin/import
```

---

## Project Overview

### Purpose
Interactive web application displaying oil and gas infrastructure across Africa, including:
- Oil/Gas production data
- Reserves data
- Basins and fields
- Refineries
- Pipelines
- Training centers
- R&D centers

### Tech Stack
| Component | Technology |
|-----------|------------|
| Framework | Next.js 16.1.3 (App Router) |
| Language | TypeScript |
| Database | SQLite (Prisma ORM) |
| Auth | NextAuth.js (Credentials) |
| Maps | Leaflet + React-Leaflet |
| Styling | Tailwind CSS |
| UI Icons | Lucide React |

---

## Project Structure

```
aiem-app/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── dev.db             # SQLite database
├── scripts/
│   └── import-iea.ts      # IEA data import script
├── src/
│   ├── app/
│   │   ├── admin/         # Admin pages
│   │   │   ├── import/    # IEA import UI
│   │   │   └── countries/ # Country management
│   │   ├── api/           # API routes
│   │   │   ├── admin/import-iea/  # Import API
│   │   │   ├── countries/
│   │   │   ├── basins/
│   │   │   ├── refineries/
│   │   │   ├── pipelines/
│   │   │   ├── reserves/
│   │   │   ├── production/
│   │   │   └── auth/[...nextauth]/
│   │   ├── login/
│   │   ├── register/
│   │   └── page.tsx       # Main map page
│   ├── components/
│   │   ├── Map.tsx        # Leaflet map component
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Providers.tsx  # NextAuth provider
│   └── lib/
│       ├── auth.ts        # NextAuth config
│       └── prisma.ts      # Prisma client
└── .env                   # Environment variables
```

---

## Database Schema (Key Models)

```prisma
Country     { id, code, name, region, lat, lon, appoMember }
Basin       { id, basinId, name, countryId, type, lat, lon, areaKm2 }
Reserve     { id, countryId, year, oil (Gbbl), gas (Tcf) }
Production  { id, countryId, year, oil (kb/d), gas (M m³/yr) }
Pipeline    { id, pipelineId, name, countries[], coords[], status, lengthKm }
Refinery    { id, refineryId, name, countryId, lat, lon, capacityKbd, status }
User        { id, email, password, role (admin|editor|user), name }
```

---

## Authentication

### Admin User
- **Email**: dgueye@apposecretariat.org
- **Password**: admin
- **Role**: admin

### User Roles
| Role | Permissions |
|------|-------------|
| admin | Full access, data import, user management |
| editor | CRUD on data, no import |
| user | Read-only |

---

## IEA Data Import

### Source Files Location
```
/Users/macbookpro/Library/CloudStorage/OneDrive-APPOSECRETARIAT/IEA DATABASE/
├── WBES.zip      # World Energy Balances (main data, 29M+ lines)
├── WCONV.zip     # Conversion factors
└── WORLD_BBL.zip # Barrels data
```

### Import Commands
```bash
# Dry run (preview)
npx tsx scripts/import-iea.ts --path="/Users/macbookpro/Library/CloudStorage/OneDrive-APPOSECRETARIAT/IEA DATABASE" --year=2024 --dry-run

# Live import for specific year
npx tsx scripts/import-iea.ts --path="/Users/macbookpro/Library/CloudStorage/OneDrive-APPOSECRETARIAT/IEA DATABASE" --year=2024

# Import all years
npx tsx scripts/import-iea.ts --path="/Users/macbookpro/Library/CloudStorage/OneDrive-APPOSECRETARIAT/IEA DATABASE"
```

### Conversion Factors (IEA ktoe to display units)
```typescript
KTOE_TO_KBD = 7.3 / 365   // ktoe/year → kb/d (crude oil)
KTOE_TO_MCM = 0.024       // ktoe → million m³ (natural gas)
```

### Data Currently Imported
- Years: 2020, 2021, 2022, 2023, 2024
- Countries: 23 African countries
- Records: ~114 production records, ~74 export records, ~37 import records

---

## APPO Member Countries (19)

```
DZA (Algeria), AGO (Angola), BEN (Benin), CMR (Cameroon),
COG (Congo), COD (DR Congo), CIV (Côte d'Ivoire), EGY (Egypt),
GAB (Gabon), GNQ (Equatorial Guinea), GHA (Ghana), LBY (Libya),
MRT (Mauritania), NER (Niger), NGA (Nigeria), SEN (Senegal),
ZAF (South Africa), TCD (Chad), TUN (Tunisia)
```

---

## Environment Variables (.env)

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3333"
```

---

## Known Issues / TODO

### Current Issues
- [ ] Country labels not showing on map (need to verify data loading)
- [ ] Safari browser has caching issues (use Chrome or incognito)

### Future Enhancements
- [ ] Add more data themes (Training, R&D, Storage, Petrochemical)
- [ ] Implement data export functionality
- [ ] Add comparison view between countries/years
- [ ] Multi-language support (FR/EN)

---

## Reference: Original SPA (v14.15)

The original application is located at:
```
/Users/macbookpro/Library/CloudStorage/OneDrive-APPOSECRETARIAT/Interactive Energy Data Map/AIEM_v14.15/
```

Features from original to replicate:
- Draggable legend
- Country multi-select with search
- View/Compare mode
- All data themes visible on map

---

## Useful Commands

```bash
# Database
npx prisma studio              # Open database GUI
npx prisma db push             # Push schema changes
npx prisma generate            # Regenerate client

# Development
npm run dev -- -p 3333         # Start dev server
npm run build                  # Production build
npm run lint                   # Run linter

# Check ports
lsof -ti:3333                  # Check if port in use
lsof -ti:3333 | xargs kill -9  # Kill process on port
```

---

## File Quick Reference

| Need to... | File |
|------------|------|
| Modify map display | `src/components/Map.tsx` |
| Change sidebar filters | `src/components/Sidebar.tsx` |
| Update auth config | `src/lib/auth.ts` |
| Modify database schema | `prisma/schema.prisma` |
| Update IEA import logic | `scripts/import-iea.ts` |
| Add new API endpoint | `src/app/api/[name]/route.ts` |
| Modify admin dashboard | `src/app/admin/page.tsx` |
| Change IEA import UI | `src/app/admin/import/page.tsx` |
