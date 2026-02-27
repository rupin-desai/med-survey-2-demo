# Neon Postgres Database Integration Guide

> For `med-survey-2-demo` — using **Vercel + Neon Postgres** (serverless)

---

## 📦 Overview

Using **Neon Postgres** via Vercel Storage integration. Neon is a serverless Postgres platform that auto-scales and pauses when idle — perfect for survey apps.

| Detail            | Value                                                |
| ----------------- | ---------------------------------------------------- |
| **Resource Name** | `neon-byzantium-flame`                               |
| **Provider**      | Neon (Postgres serverless)                           |
| **Region**        | Washington, D.C., USA (East) — `iad1`                |
| **Auth**          | Disabled                                             |
| **Plan**          | Free (0.5 GB storage, 100 CU-hours, 2 CU / 8 GB RAM) |

### Package to use

| Package                    | Purpose                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| `@neondatabase/serverless` | Neon's official serverless SDK — HTTP-based, works on Vercel edge/serverless |

> **Note:** `@vercel/postgres` is **deprecated** as of 2025. Neon databases created through Vercel now use `@neondatabase/serverless` directly.

> **Why not `@vercel/kv` / `ioredis`?** The previous `med-survey-demo` used Redis (KV). This project uses Neon Postgres instead — a proper relational database with SQL, which is better for structured survey data, analytics queries, and long-term storage.

---

## 🔑 Environment Variables

When you link Neon to your Vercel project, these env vars are **auto-injected** (with `STORAGE` custom prefix):

| Variable                  | Description                               |
| ------------------------- | ----------------------------------------- |
| `STORAGE_URL`             | Pooled connection string (for serverless) |
| `STORAGE_URL_NON_POOLING` | Direct connection (for migrations)        |
| `STORAGE_USER`            | Database user                             |
| `STORAGE_PASSWORD`        | Database password                         |
| `STORAGE_HOST`            | Neon host                                 |
| `STORAGE_DATABASE`        | Database name                             |

> **Custom prefix:** You chose `STORAGE` as the prefix during setup. So env vars are `STORAGE_URL` instead of the default `POSTGRES_URL`.

### For local development

Copy from **Vercel Dashboard → Storage → neon-byzantium-flame → `.env.local` tab**:

```env
STORAGE_URL="postgres://user:pass@ep-xxx.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require"
STORAGE_URL_NON_POOLING="postgres://user:pass@ep-xxx.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require"
STORAGE_USER="user"
STORAGE_HOST="ep-xxx.us-east-1.aws.neon.tech"
STORAGE_PASSWORD="pass"
STORAGE_DATABASE="verceldb"
```

---

## 🗄 Database Schema

### `submissions` table

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_name TEXT NOT NULL,
  answers     JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- `id` — UUID auto-generated
- `doctor_name` — the doctor who submitted
- `answers` — JSONB column storing `{ "q1": "Option A", "q2": ["B","C"], ... }`
- `submitted_at` — timestamp of submission

---

## 🔌 Integration Code

### 1. Install package

```bash
npm install @neondatabase/serverless
```

### 2. Create database helper — `lib/db.ts`

```typescript
import { neon } from "@neondatabase/serverless";

function getSQL() {
  const url =
    process.env.STORAGE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    "";

  if (!url) {
    throw new Error(
      "Database URL not found. Set STORAGE_URL, POSTGRES_URL, or DATABASE_URL.",
    );
  }

  return neon(url);
}

export async function ensureTable() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      doctor_name  TEXT NOT NULL,
      answers      JSONB NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

export { getSQL };
```

### 3. API Routes

**`app/api/submit/route.ts`** — Save a submission

```typescript
import { NextResponse } from "next/server";
import { getSQL, ensureTable } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await ensureTable();
    const { id, doctorName, answers, submittedAt } = await request.json();
    const sql = getSQL();

    await sql`
      INSERT INTO submissions (id, doctor_name, answers, submitted_at)
      VALUES (${id}, ${doctorName}, ${JSON.stringify(answers)}, ${submittedAt})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
```

**`app/api/submissions/route.ts`** — Fetch all / Delete one / Clear all

```typescript
import { NextResponse } from "next/server";
import { getSQL, ensureTable } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureTable();
    const sql = getSQL();

    const rows = await sql`
      SELECT
        id,
        doctor_name  AS "doctorName",
        answers,
        submitted_at AS "submittedAt"
      FROM submissions
      ORDER BY submitted_at DESC
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureTable();
    const { id, clearAll } = await request.json();
    const sql = getSQL();

    if (clearAll) {
      await sql`DELETE FROM submissions`;
    } else if (id) {
      await sql`DELETE FROM submissions WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
```

---

## 🔄 Frontend Changes Needed

### Survey page (`app/page.tsx`)

Change `handleSubmit` from localStorage to API call:

```typescript
// BEFORE (localStorage):
const raw = localStorage.getItem("sema_survey_submissions");
// ...
localStorage.setItem(
  "sema_survey_submissions",
  JSON.stringify([...existing, submission]),
);

// AFTER (API):
const res = await fetch("/api/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    id: crypto.randomUUID(),
    doctorName,
    answers,
    submittedAt: new Date().toISOString(),
  }),
});
const result = await res.json();
if (result.success) router.push("/thank-you");
```

### Admin page (`app/admin/page.tsx`)

Change data loading from localStorage to API:

```typescript
// BEFORE (localStorage):
const raw = localStorage.getItem("sema_survey_submissions");
setSubmissions(raw ? JSON.parse(raw) : []);

// AFTER (API):
const res = await fetch("/api/submissions");
const data = await res.json();
setSubmissions(Array.isArray(data) ? data : []);
```

Change delete handler:

```typescript
// BEFORE (localStorage):
localStorage.setItem("sema_survey_submissions", JSON.stringify(updated));

// AFTER (API):
await fetch("/api/submissions", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: submissionId }),
});
```

Change clear all handler:

```typescript
// BEFORE (localStorage):
localStorage.removeItem("sema_survey_submissions");

// AFTER (API):
await fetch("/api/submissions", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ clearAll: true }),
});
```

---

## 🆚 Redis (med-survey-demo) vs Postgres (med-survey-2-demo)

| Aspect       | Redis (KV)           | Postgres (Neon)                          |
| ------------ | -------------------- | ---------------------------------------- |
| Storage      | List of JSON strings | Relational table with JSONB              |
| Querying     | Full scan (`LRANGE`) | SQL with `WHERE`, `ORDER BY`, aggregates |
| Delete by ID | Scan list + `LREM`   | `DELETE WHERE id = ?`                    |
| Analytics    | Client-side only     | Can do server-side `GROUP BY`, `COUNT`   |
| Schema       | Schema-less          | Structured with types                    |
| Free tier    | 256 MB, 30K req/day  | 0.5 GB, 100 CU-hours                     |
| Best for     | Caching, simple KV   | Structured data, queries                 |

---

## 📁 File Structure After Integration

```
med-survey-2-demo/
├── lib/
│   └── db.ts                  ← Shared sql + ensureTable()
├── app/
│   ├── api/
│   │   ├── submit/
│   │   │   └── route.ts       ← POST: save submission
│   │   └── submissions/
│   │       └── route.ts       ← GET: list all, DELETE: remove
│   ├── page.tsx                ← Survey form (→ POST /api/submit)
│   └── admin/
│       └── page.tsx            ← Admin dashboard (→ GET /api/submissions)
├── .env.local                  ← Postgres credentials (git-ignored)
└── package.json                ← @neondatabase/serverless
```

---

## 🚀 Deployment Checklist

1. ✅ Create Neon store on Vercel (`neon-byzantium-flame`)
2. ✅ Install `@neondatabase/serverless`
3. ✅ Create `lib/db.ts`
4. ✅ Create `app/api/submit/route.ts`
5. ✅ Create `app/api/submissions/route.ts`
6. ✅ Update `app/page.tsx` — POST to API instead of localStorage
7. ✅ Update `app/admin/page.tsx` — GET/DELETE via API instead of localStorage
8. ⬜ Copy `.env.local` from Vercel dashboard for local dev
9. ⬜ Deploy to Vercel — env vars auto-injected
