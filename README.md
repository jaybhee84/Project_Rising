# IECES Website — ieces126001.com

**Tech Stack:** Next.js 15 · Tailwind CSS · Supabase · Recharts  
**Deploy target:** Vercel (free tier)

---

## Local Development

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys
npm run dev                   # http://localhost:3000
```

---

## Project Structure

```
app/
  page.tsx                  → Homepage (About, Mission/Vision, module cards)
  nutritional-status/       → BMI/NS aggregated data (public, no PII)
  enrollment/               → Enrollment data (connect Enrollment App later)
  org-chart/                → Staff directory & org chart
  mooe/                     → MOOE Expenses & Liquidation
  teachers/                 → Teachers portal (NS view + ID Generator)

lib/
  supabase.ts               → Supabase client (uses env keys)
  mockData.ts               → PLACEHOLDER DATA — replace with Supabase queries

components/
  Navbar.tsx
  Footer.tsx
```

---

## Wiring Nutritional Status to Supabase

When ready to connect the real BMI app data:

1. Open `lib/mockData.ts` — the comment at the top shows the query pattern
2. In `app/nutritional-status/page.tsx`, replace mock data import with a Supabase query:

```ts
// Remove 'use client' — make it a Server Component
import { supabase } from '@/lib/supabase'

const { data } = await supabase
  .from('bmi_records')                         // <-- your actual table name
  .select('grade_level, nutritional_status')
  .eq('school_year', '2024-2025')

// Then aggregate: group by grade_level + nutritional_status
```

3. RLS policy — allow anon read only:
```sql
CREATE POLICY "Public read NS"
ON bmi_records FOR SELECT TO anon USING (true);
```

---

## Deployment (Vercel)

```bash
git init && git add . && git commit -m "init"
gh repo create ieces-website --public --push
# Then: vercel.com → New Project → import → add env vars → add domain
```

---

## Module Status

| Module             | Status         | Notes                              |
|--------------------|----------------|------------------------------------|
| Home / About       | Done           | Mission, vision, module cards      |
| Nutritional Status | Done (mock)    | Wire to Supabase when schema ready |
| Enrollment         | Placeholder    | Build after Enrollment App         |
| Org Chart          | Placeholder    | Static data or Supabase table      |
| MOOE               | Placeholder    | Upload reports or link PDFs        |
| Teachers App       | Placeholder    | NS viewer + ID Generator           |
