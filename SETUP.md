# 🚀 Syndrome Platform - Quick Start Guide

## 5-Minute Setup

### Step 1: Copy Environment File
```bash
cp .env.example .env.local
```

### Step 2: Add Supabase Credentials
Edit `.env.local` and add:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Get these from Supabase:**
1. Go to Dashboard
2. Click Settings → API
3. Copy "Project URL" and "anon key"

### Step 3: Install & Run
```bash
npm install
npm run dev
```

### Step 4: Access Application
Open: http://localhost:5173

---

## Database Setup (One-Time)

### Option A: Using SQL Editor (Recommended)

1. **In Supabase Dashboard:**
   - Click "SQL Editor"
   - Click "New Query"

2. **Run Schema:**
   - Copy contents of `sql/schema.sql`
   - Paste into SQL editor
   - Click "Run"

3. **Run RLS Policies:**
   - Copy contents of `sql/rls_policies.sql`
   - Paste into SQL editor
   - Click "Run"

### Option B: Using psql CLI

```bash
# Download SQL files
curl -O https://raw.githubusercontent.com/yourusername/syndrome/main/sql/schema.sql
curl -O https://raw.githubusercontent.com/yourusername/syndrome/main/sql/rls_policies.sql

# Connect to Supabase PostgreSQL
psql postgresql://postgres:password@db.supabase.co:5432/postgres

# Run schema
\i sql/schema.sql

# Run RLS policies
\i sql/rls_policies.sql
```

---

## Storage Setup

### Create Buckets in Supabase

1. Go to **Storage** → **Buckets**
2. Click **New Bucket**
3. Create **posts** (Mark as public)
4. Create **avatars** (Mark as public)

---

## First User Test

1. **Open app:** http://localhost:5173
2. **Click:** Sign Up
3. **Fill form:** Email, password, username
4. **Verify:** Check your email
5. **Login:** Use email and password
6. **Explore:** Create posts, message, search users

---

## Key Features to Try

### 🏠 Home Feed
- See posts from users you follow
- Like, comment, and interact
- Infinite scroll for more posts

### ✍️ Create Post
- Upload image
- Add caption
- Post to your feed

### 💬 Messages
- Search and chat with users
- Real-time message delivery
- See read receipts

### 🔍 Search
- Find users by username
- Start conversations

### 👤 Profile
- Edit bio and avatar
- View your stats
- See your posts

---

## Troubleshooting

### Error: "Supabase environment variables missing"
```
Solution: Check .env.local file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### Error: "Cannot POST /auth/signup"
```
Solution: RLS policies not applied. Run sql/rls_policies.sql
```

### Error: "Storage bucket not found"
```
Solution: Create storage buckets (posts, avatars) in Supabase Dashboard
```

### Images not uploading
```
Solution: Check bucket permissions are set to "public"
```

---

## Environment Variables Explained

| Variable | Where to find | Example |
|----------|---------------|---------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → Anon key | `eyJhbGc...` |

---

## Production Deployment

### Vercel (One-Click Deploy)

1. Push code to GitHub
2. Go to vercel.com
3. Click "Import Project"
4. Select your repo
5. Add environment variables
6. Click "Deploy"

### Environment Variables for Production

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_URL=https://your-domain.com
```

---

## Performance Tips

1. **Image Optimization:** Compress images before uploading
2. **Lazy Loading:** Feed uses infinite scroll
3. **RLS Security:** All queries are automatically filtered
4. **Caching:** Supabase caches queries automatically

---

## Support

📧 **Email:** showlittlemercy@gmail.com  
👤 **Creator:** Priyanshu  
📚 **Docs:** See README.md for detailed documentation

---

## Next Steps

- [ ] Complete database setup
- [ ] Configure environment variables
- [ ] Create first user account
- [ ] Upload profile picture
- [ ] Create first post
- [ ] Test messaging feature
- [ ] Invite friends to test
- [ ] Deploy to production

---

**Happy Building! 🎭**
