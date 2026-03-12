# ERA Protocol - Deployment Checklist

## ✅ **Completed - Ready for Deployment**

### SEO & Metadata
- ✅ Updated `app/layout.tsx` with comprehensive metadata
- ✅ Added `metadataBase` for proper OG image URLs
- ✅ Added OpenGraph tags
- ✅ Added Twitter Card metadata
- ✅ Added robots configuration
- ✅ Created `app/sitemap.ts` for dynamic sitemap generation
- ✅ Created `public/robots.txt`

### PWA & Manifest
- ✅ Updated `public/site.webmanifest` with proper branding
- ✅ Icons already in place (192x192, 512x512, favicon, apple-touch-icon)

### Mobile Blocking
- ✅ Multi-layer mobile detection implemented
- ✅ Desktop-only block screen with scramble text animation
- ✅ Professional UX for mobile users

### Configuration
- ✅ Updated `.env.local.example` with production values
- ✅ Backend URL pointing to Railway production

---

## ⚠️ **TODO: Create Before Deployment**

### 1. OG Images (Required for Social Sharing)
Create these two images and place in `/app`:

**File:** `app/opengraph-image.png`
- **Size:** 1200x630px
- **Content:** ERA Protocol branding + "Save 59-96% on Gas Fees" + zkSTARK visual
- **Format:** PNG

**File:** `app/twitter-image.png` (optional, falls back to opengraph-image)
- **Size:** 1200x630px  
- **Content:** Same as above or Twitter-optimized variant
- **Format:** PNG

**Design Tips:**
- Use black background (#0a0a0a)
- ERA logo prominently displayed
- Clear, bold text (readable at small sizes)
- Show "59-96% Gas Savings" stat
- Include "demo.zkera.xyz" subtle in corner

---

## 🚀 **Vercel Deployment Steps**

### 1. Environment Variables
Set these in Vercel dashboard (Settings → Environment Variables):

```env
NEXT_PUBLIC_ERA_API_URL=https://erabackend-production.up.railway.app
NEXT_PUBLIC_ALCHEMY_ID=kxtx5DbjyKV7BVvz8rQmR (your actual key)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=e8d74571469e1040005cf8760bd4038d (your actual ID)
```

### 2. Build Settings
Vercel should auto-detect Next.js. Verify:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (or leave default)
- **Output Directory:** `.next` (or leave default)
- **Install Command:** `npm install` (or leave default)

### 3. Domain Setup
- Connect `demo.zkera.xyz` custom domain in Vercel
- Ensure DNS records point to Vercel

### 4. Deploy
- Push to GitHub main branch
- Vercel auto-deploys on push
- Or manual deploy from Vercel dashboard

---

## 🧪 **Post-Deployment Testing**

### Critical Tests:
1. ✅ Desktop access works (home, send, swap, receive)
2. ✅ Mobile access shows block screen
3. ✅ Wallet connection works (MetaMask, Coinbase Wallet, WalletConnect)
4. ✅ ENS resolution works on send flow
5. ✅ Token selection works
6. ✅ Gas estimates load
7. ✅ Transaction submission works (Sepolia testnet)
8. ✅ Toast notifications work
9. ✅ Footer shows correctly on home page only

### SEO Tests:
1. Check `https://demo.zkera.xyz/sitemap.xml` loads
2. Check `https://demo.zkera.xyz/robots.txt` loads
3. Test Twitter Card preview: https://cards-dev.twitter.com/validator
4. Test OG preview: https://www.opengraph.xyz/
5. Check Google Search Console after 24-48 hours

---

## 📊 **Analytics (Optional - Add Later)**

Consider adding:
- Vercel Analytics (built-in, free)
- Google Analytics 4
- Plausible Analytics (privacy-focused)
- Umami (open-source)

---

## 🔒 **Security Notes**

- ✅ No private keys in repo
- ✅ API keys in Vercel env vars only
- ✅ Mobile block prevents accidental mobile usage
- ✅ Testnet only (Sepolia)
- ✅ Burner wallet warnings in place

---

## 📝 **Notes**

- **Mobile Support:** Currently blocked. Will be enabled in future release after mobile UX improvements.
- **Mainnet:** NOT YET. Deploy to mainnet only after security audit completion.
- **Backend:** Already deployed on Railway (production ready)

---

**Last Updated:** March 12, 2026  
**Status:** Ready for Vercel deployment after OG images created
