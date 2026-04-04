Dridoud website built with [Next.js](https://nextjs.org) (Arabic RTL landing site).

## Getting Started

1) Install dependencies:

```bash
npm install
```

2) Create your env file (placeholders are provided):

```bash
copy .env.example .env.local
```

3) Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase (optional)

- Add your real values to `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Client helper lives in `src/lib/supabase/client.js`.

## Notes

- Uses `next/font` to load an Arabic font (Cairo).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Android APK (TWA)

This project is ready for APK packaging via Trusted Web Activity (TWA).

### Files added

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/.well-known/assetlinks.json`
- `mobile/twa/twa-manifest.template.json`

### Quick setup

1. Replace all `YOUR_DOMAIN.com` placeholders in:
   - `mobile/twa/twa-manifest.template.json`
   - `package.json` script `twa:init`
2. Ensure your domain is HTTPS and serves:
   - `/manifest.webmanifest`
   - `/.well-known/assetlinks.json`
3. Run TWA checks:

```bash
npm run twa:doctor
```

4. Initialize Android project (once):

```bash
npm run twa:init
```

5. Build APK:

```bash
npm run twa:build
```

Output APK/AAB will be generated in the Android project created by Bubblewrap.
