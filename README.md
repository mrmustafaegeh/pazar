# Türkiye Pazaryeri (Pazar)

**Türkiye Pazaryeri** is a classifieds marketplace for buying and selling in Turkey — vehicles, real estate, electronics, jobs, services, furniture, and more. List an item in minutes, browse by category or search, and connect with buyers and sellers across the country.

Available in **Turkish**, **English**, and **Arabic**, with prices shown in **TRY**, **USD**, or **EUR**.

---

## What you can do

### Browse & search
- Explore listings by category or keyword
- Filter by location, price, and category-specific details
- View featured and promoted listings on the homepage

### Sell
- Post a listing with photos, price, and location
- Choose a category (vehicle, property, electronics, job, service, furniture, etc.)
- Manage your listings from your account

### Buy safely
- Message sellers directly from a listing
- Seller profiles with published listings
- Support and complaint flows if something goes wrong

### Account & trust
- Email registration with optional two-factor authentication (2FA)
- Phone verification for sellers
- Manual review of listings before they go live
- KVKK (personal data protection) tools for privacy requests

---

## Categories

| Category | Examples |
|----------|----------|
| **Vasıta** (Vehicles) | Cars, motorcycles |
| **Emlak** (Real estate) | Apartments, houses for sale or rent |
| **Elektronik** (Electronics) | Phones, laptops, accessories |
| **İş ilanları** (Jobs) | Full-time and part-time roles |
| **Hizmetler** (Services) | Local services |
| **Mobilya & ev** (Furniture & home) | Home goods and furniture |

---

## For sellers & buyers

- **Free listings** — post without a subscription
- **Promoted listings** — optional paid placement for more visibility
- **Multi-language UI** — switch language and display currency anytime
- **Real-time messaging** — chat with buyers or sellers in-app

---

## Platform overview

The site is built as a modern web application with a public marketplace (`apps/web`), an admin dashboard for moderation and operations (`apps/admin`), and a backend API for listings, auth, search, payments, and messaging.

| App | Role |
|-----|------|
| **Web** | Public marketplace — browse, post, message, account |
| **Admin** | Moderation, users, categories, support tickets, analytics |
| **API** | Listings, auth, search, media, notifications, payments |

---

## Running locally (developers)

**Requirements:** Node.js 20+, pnpm 9+, Docker (Postgres, Redis, OpenSearch)

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d
cp apps/api/.env.example apps/api/.env
pnpm --filter @turkiye-pazaryeri/api prisma:generate
pnpm dev
```

| Service | URL / port |
|---------|------------|
| Web | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:4000 |

---

## License

MIT — see [LICENSE](LICENSE).
