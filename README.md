# Scan & Smile

> One scan, a lifetime of memories.

Every guest at a celebration gets a table card with their own QR code. They scan it and a page
opens that was written for them alone: a welcome by name, a note from the hosts, a photo, a short
video, and where they're sitting.

Built for weddings, Shengerena, graduations, birthdays, traditional ceremonies, anniversaries and
baby showers.

## Run it

```bash
npm install
cp .env.example .env   # then set ADMIN_PASSWORD to something of your own
npm run setup          # creates the SQLite database and loads a sample wedding
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` for the second step.

| Where | What |
| --- | --- |
| http://localhost:3000 | Public page, with a scannable sample card |
| http://localhost:3000/g/DEMO247 | A guest's page, as a guest sees it |
| http://localhost:3000/admin | Host dashboard — the password is your `ADMIN_PASSWORD` |

There is no default password. If `ADMIN_PASSWORD` is unset the dashboard refuses every login
rather than falling back to a value published in this repo.

## Testing a real scan

`localhost` on a phone means the phone itself, so a QR pointing there won't open. Put your
computer's LAN address in `.env` before generating codes you intend to scan:

```
NEXT_PUBLIC_BASE_URL="http://192.168.1.20:3000"
```

Then run `npm run dev -- -H 0.0.0.0` and scan from a phone on the same network. The URL is baked
into each code at render time, so changing it re-points every card at once — but re-print anything
already on a table.

Test scans count like real ones. Zero the counters once the cards are proven and before guests
arrive:

```bash
npm run db:reset-scans
```

## How the pieces fit

```
src/app/page.tsx                              public page; the hero is a live card
src/app/g/[code]/page.tsx                     what a guest sees after scanning
src/app/api/qr/[code]/route.ts                PNG + SVG codes, any size
src/app/admin/                                dashboard: events, guests, media, print sheet
src/app/admin/events/[id]/cards/page.tsx      four table cards to an A4 sheet
src/lib/events.ts                             occasions and their tibeb thread colours
src/lib/uploads.ts                            where photos and videos land
prisma/schema.prisma                          Event and Guest
```

**Events hold the fallbacks, guests hold the exceptions.** Write one thank-you message on the
event and every guest gets it; write one on a guest and they get theirs instead. Same for video.
That's what makes a 200-guest wedding practical to set up in an evening.

**Codes are unique across every event** (`src/lib/codes.ts`) and avoid look-alike characters, so a
card can be read out loud and never opens the wrong page.

## Design

The guest page is a cotton-white card lying on a dark table, edged with a **tibeb** band — the
woven border of a netela — rendered in CSS from three thread colours. Each occasion is assigned
its own threads in `src/lib/events.ts`, so one stylesheet dresses a wedding and a graduation
differently. The band recurs as the divider between sections; it's the only ornament on the page.

The dashboard is deliberately plain by contrast: hairline rules, mono labels, dense tables. One is
a keepsake, the other is a tool.

## Before this goes live

- [ ] Give each host their own login if more than one client uses the dashboard — today it's a
      single shared `ADMIN_PASSWORD`.
- [ ] Move uploads off local disk. `saveUpload()` in `src/lib/uploads.ts` is the only function that
      touches the filesystem; point it at S3 or Cloudinary and nothing else changes.
- [ ] Move off SQLite to Postgres if events will be created concurrently.
- [ ] Guest pages are unlisted but public — anyone with a code can open one. If a host wants a card
      to stop working after the event, add an expiry check in `src/app/g/[code]/page.tsx`.
