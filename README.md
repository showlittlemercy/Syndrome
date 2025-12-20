# 🎭 Syndrome - Social Media & Chat Platform

A comprehensive, real-time social media and chat platform combining the best features of Instagram and WhatsApp/Threads. Built with cutting-edge technologies for a premium user experience.

**Creator:** Priyanshu ([showlittlemercy@gmail.com](mailto:showlittlemercy@gmail.com))  
**Version:** 1.0.0  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Technical Stack](#technical-stack)
5. [Database Schema](#database-schema)
6. [Row Level Security](#row-level-security)
7. [Installation & Setup](#installation--setup)
8. [Environment Configuration](#environment-configuration)
9. [Project Structure](#project-structure)
10. [API & Database Operations](#api--database-operations)
11. [Deployment](#deployment)
12. [Contributing](#contributing)

---

## 🌟 Overview

**Syndrome** is a next-generation social platform designed to unify social networking and instant messaging in one beautiful, intuitive interface. It provides users with:

- A vibrant feed for sharing moments
- Real-time one-on-one and group messaging
- Interactive engagement through likes and comments
- User discovery and follow system
- Premium UI/UX with smooth animations
- Full offline-ready presence tracking

### Core Vision

Syndrome brings together the visual storytelling of Instagram with the real-time communication of WhatsApp, creating a unified ecosystem where users can seamlessly switch between posting moments and having conversations.

---

## ✨ Features

### 1. **Authentication & Authorization**

- ✅ Email/Password authentication via Supabase Auth
- ✅ OAuth 2.0 integration (Google, GitHub)
- ✅ Secure session management
- ✅ Password reset functionality
- ✅ Email verification
- ✅ Row-Level Security (RLS) for data protection

### 2. **User Profiles**

- ✅ Create and edit profiles (username, full name, bio, avatar)
- ✅ Profile statistics (posts, followers, following)
- ✅ Privacy settings (public/private profiles)
- ✅ Avatar upload to Supabase Storage
- ✅ User discovery via search

### 3. **Social Feed**

- ✅ Create posts with image and caption
- ✅ Infinite scrolling feed
- ✅ Like/unlike posts with real-time counts
- ✅ Comment on posts
- ✅ View posts from followed users
- ✅ Share posts functionality
- ✅ Post metadata (timestamps, user info)

### 4. **Follow System**

- ✅ Follow/unfollow users
- ✅ View follower/following lists
- ✅ Follower count tracking
- ✅ Follow suggestions

### 5. **Messaging & Chat**

- ✅ One-on-one direct messages
- ✅ Group messaging capabilities
- ✅ Real-time message delivery
- ✅ Message read receipts (Sent, Delivered, Seen)
- ✅ Typing indicators
- ✅ Message history
- ✅ User presence status (Online/Offline)
- ✅ Last seen timestamps

### 6. **UI/UX & Animations**

- ✅ Modern dark theme with glassmorphism
- ✅ Framer Motion animations throughout
- ✅ Glowing bottom navigation with active state
- ✅ Smooth page transitions
- ✅ Loading spinners and skeleton screens
- ✅ Hover and tap animations
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Toast notifications for user feedback

### 7. **Real-time Features**

- ✅ Live message updates via Supabase Realtime
- ✅ Presence tracking (online status)
- ✅ Typing indicators
- ✅ Live notifications

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Landing Page │  │ Auth Pages   │  │ Main Application       │ │
│  │              │  │ - Sign Up    │  │ - Home Feed            │ │
│  │ - Hero       │  │ - Sign In    │  │ - Create Post          │ │
│  │ - Features   │  │ - OAuth      │  │ - Messages (1-1/Group) │ │
│  │ - CTA        │  │              │  │ - Profile              │ │
│  └──────────────┘  └──────────────┘  │ - Search               │ │
│                                       │ - Bottom Nav           │ │
│                                       └────────────────────────┘ │
│                                                                   │
│                    UI Framework: React 18 + TypeScript            │
│                    Styling: Tailwind CSS + Framer Motion         │
│                    State: Zustand                                 │
└────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase API Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Auth     │  │ Database │  │ Storage  │  │ Realtime     │   │
│  │          │  │          │  │          │  │              │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
│  ┌──────────┐  ┌────────┐  ┌───────┐  ┌────────────┐  ┌──────┐│
│  │ Profiles │  │ Posts  │  │ Likes │  │ Messages   │  │Follows││
│  └──────────┘  └────────┘  └───────┘  └────────────┘  └──────┘│
│  ┌──────────┐  ┌────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Comments │  │ Groups │  │ Group Members│  │ Presence     │  │
│  └──────────┘  └────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Technical Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework with Hooks |
| **TypeScript** | Type-safe development |
| **Vite** | Lightning-fast build tool |
| **React Router** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Advanced animations |
| **Zustand** | Lightweight state management |
| **Supabase Client** | API & Real-time access |
| **Lucide React** | Beautiful icon library |

### Backend & Database

| Technology | Purpose |
|-----------|---------|
| **Supabase** | Backend-as-a-Service (Auth, DB, Storage, Realtime) |
| **PostgreSQL** | Relational database with extensions |
| **Row Level Security (RLS)** | Granular data access control |
| **Storage Buckets** | Image and file management |
| **Realtime Subscriptions** | WebSocket-based live updates |

### Development Tools

| Technology | Purpose |
|-----------|---------|
| **ESLint** | Code linting |
| **TypeScript** | Type checking |
| **Git** | Version control |
| **Vite Dev Server** | Fast development experience |

---

## 🗄️ Database Schema

### Tables Overview

#### **1. Profiles**
Stores user profile information.

```sql
profiles (
  id UUID (PK) - References auth.users
  username VARCHAR(50) UNIQUE NOT NULL
  full_name VARCHAR(100)
  bio TEXT
  avatar_url TEXT
  is_private BOOLEAN DEFAULT false
  created_at TIMESTAMP DEFAULT NOW()
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### **2. Posts**
Stores user posts with images and captions.

```sql
posts (
  id UUID (PK)
  user_id UUID (FK) - References profiles
  image_url TEXT NOT NULL
  caption TEXT
  likes_count INT DEFAULT 0
  comments_count INT DEFAULT 0
  created_at TIMESTAMP DEFAULT NOW()
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### **3. Likes**
Tracks likes on posts (many-to-many).

```sql
likes (
  id UUID (PK)
  post_id UUID (FK) - References posts
  user_id UUID (FK) - References profiles
  created_at TIMESTAMP DEFAULT NOW()
  UNIQUE(post_id, user_id)
)
```

#### **4. Comments**
Stores comments on posts.

```sql
comments (
  id UUID (PK)
  post_id UUID (FK) - References posts
  user_id UUID (FK) - References profiles
  content TEXT NOT NULL
  created_at TIMESTAMP DEFAULT NOW()
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### **5. Follows**
Tracks user follow relationships.

```sql
follows (
  id UUID (PK)
  follower_id UUID (FK) - References profiles
  following_id UUID (FK) - References profiles
  created_at TIMESTAMP DEFAULT NOW()
  UNIQUE(follower_id, following_id)
  CHECK (follower_id != following_id)
)
```

#### **6. Messages**
Stores messages for both 1-on-1 and group chats.

```sql
messages (
  id UUID (PK)
  sender_id UUID (FK) - References profiles
  receiver_id UUID (FK) - References profiles (NULL for group)
  group_id UUID (FK) - References groups (NULL for 1-on-1)
  content TEXT NOT NULL
  message_type VARCHAR(20) DEFAULT 'text'
  media_url TEXT
  seen_at TIMESTAMP
  delivered_at TIMESTAMP
  created_at TIMESTAMP DEFAULT NOW()
)
```

#### **7. Groups**
Stores group chat information.

```sql
groups (
  id UUID (PK)
  name VARCHAR(100) NOT NULL
  description TEXT
  owner_id UUID (FK) - References profiles
  group_avatar_url TEXT
  created_at TIMESTAMP DEFAULT NOW()
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### **8. Group Members**
Maps users to groups (many-to-many).

```sql
group_members (
  id UUID (PK)
  group_id UUID (FK) - References groups
  user_id UUID (FK) - References profiles
  role VARCHAR(20) DEFAULT 'member'
  joined_at TIMESTAMP DEFAULT NOW()
  UNIQUE(group_id, user_id)
)
```

#### **9. Presence**
Tracks user online status.

```sql
presence (
  id UUID (PK)
  user_id UUID (FK) - References profiles
  status VARCHAR(20) DEFAULT 'offline'
  last_seen_at TIMESTAMP DEFAULT NOW()
  created_at TIMESTAMP DEFAULT NOW()
  UNIQUE(user_id)
)
```

### Database Indexes

Created for optimal query performance:

```sql
idx_profiles_username         -- Fast username lookups
idx_posts_user_id             -- User's posts queries
idx_posts_created_at          -- Feed ordering
idx_likes_post_id             -- Post likes queries
idx_likes_user_id             -- User's likes queries
idx_comments_post_id          -- Post comments queries
idx_comments_user_id          -- User's comments queries
idx_follows_follower_id       -- User's followers
idx_follows_following_id      -- User's following
idx_messages_sender_id        -- Sent messages
idx_messages_receiver_id      -- Received messages
idx_messages_group_id         -- Group messages
idx_messages_created_at       -- Message ordering
idx_groups_owner_id           -- Owner's groups
idx_group_members_group_id    -- Group members
idx_group_members_user_id     -- User's groups
idx_presence_user_id          -- User presence
```

---

## 🔐 Row Level Security (RLS)

### What is RLS?

Row Level Security is a PostgreSQL feature that enables fine-grained access control at the row level. **Every policy defined ensures users can only access data they own or are authorized to see**, preventing unauthorized data access.

### RLS Policies

#### **Profiles**
```
- SELECT: Public profiles viewable by all
- UPDATE: Users can only update their own profile
- INSERT: Users can create their own profile (signup)
- DELETE: Users can delete their own profile
```

#### **Posts**
```
- SELECT: All public posts visible
- INSERT: Users can only create posts for themselves
- UPDATE: Users can only update their own posts
- DELETE: Users can only delete their own posts
```

#### **Likes**
```
- SELECT: All likes visible (for counting)
- INSERT: Users can like posts
- DELETE: Users can only unlike their own likes
```

#### **Comments**
```
- SELECT: All comments visible
- INSERT: Users can comment on posts
- UPDATE: Users can only edit their own comments
- DELETE: Users can only delete their own comments
```

#### **Messages**
```
- SELECT: Users can view:
  - Messages they sent
  - Messages they received
  - Group messages they're part of
- INSERT: Users can only send messages
- UPDATE: Messages can be marked as seen/delivered
- DELETE: Users can only delete their own messages
```

#### **Groups**
```
- SELECT: Users can view groups they're members of
- INSERT: Users can create groups
- UPDATE: Group owners/admins can update group details
- DELETE: Group owners can delete groups
```

#### **Group Members**
```
- SELECT: Users can view members of groups they're in
- INSERT: Admins can add members or users can join
- UPDATE: Admins can change member roles
- DELETE: Users can leave groups or admins can remove members
```

#### **Presence**
```
- SELECT: All presence data is public
- INSERT/UPDATE: Users can only update their own status
- DELETE: Users can only delete their own presence
```

### Why RLS Matters

1. **Security at Database Level**: No data ever escapes the database without proper authorization
2. **No Compromised Tokens**: Even if a token is leaked, the attacker can only access the token owner's data
3. **Compliance**: Meets GDPR and data privacy regulations
4. **Simplified Backend Logic**: Authorization is handled by the database, not application code

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Supabase** account (free tier available at https://supabase.com)
- **Git** for version control

### Step 1: Clone or Extract Project

```bash
cd Syndrome
npm install
```

### Step 2: Create Supabase Project

1. Visit [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details (name, password, region)
4. Click "Create new project"
5. Wait for project initialization (2-5 minutes)

### Step 3: Set Up Database

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `sql/schema.sql`
4. Paste into the SQL editor and click "Run"
5. Wait for completion (should see green checkmarks)

### Step 4: Set Up RLS Policies

1. In SQL Editor, click "New Query"
2. Copy the entire contents of `sql/rls_policies.sql`
3. Paste and click "Run"
4. Verify all policies are created

### Step 5: Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Click "New Bucket"
3. Create bucket named: **posts** (public)
4. Create bucket named: **avatars** (public)

### Step 6: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Get credentials from Supabase:
   - Go to **Settings** → **API**
   - Copy **Project URL** → `VITE_SUPABASE_URL`
   - Copy **anon key** → `VITE_SUPABASE_ANON_KEY`

3. Fill `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Syndrome
VITE_APP_URL=http://localhost:5173
```

### Step 7: Run Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### Step 8: Create Test Account

1. Click "Sign Up"
2. Enter email, password, and username
3. Verify email (check inbox or spam)
4. Start exploring!

---

## ⚙️ Environment Configuration

### `.env.local` Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public API key | `eyJhbGc...` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | (optional) |
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth App ID | (optional) |
| `VITE_APP_NAME` | Application name | `Syndrome` |
| `VITE_APP_URL` | App URL for OAuth redirects | `http://localhost:5173` |

### Supabase OAuth Setup (Optional)

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable **Google+ API**
4. Create OAuth 2.0 credentials (Web Application)
5. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID to `.env.local`

#### GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in app name, homepage URL, and authorization callback URL
4. Copy Client ID and Secret
5. Add to Supabase: Settings → Authentication → GitHub

---

## 📁 Project Structure

```
Syndrome/
├── src/
│   ├── components/
│   │   ├── Landing.tsx           # Landing page with hero section
│   │   ├── SignUp.tsx            # Sign up form
│   │   ├── SignIn.tsx            # Sign in form
│   │   ├── BottomNavigation.tsx  # Main navigation with glow effects
│   │   ├── Layout.tsx            # Main layout wrapper
│   │   └── PostCard.tsx          # Reusable post component
│   ├── pages/
│   │   ├── Home.tsx              # Feed page
│   │   ├── Create.tsx            # Create post page
│   │   ├── Profile.tsx           # User profile page
│   │   ├── Search.tsx            # User search page
│   │   └── Messages.tsx          # Messaging page
│   ├── hooks/
│   │   └── useAuth.ts            # Custom auth hook
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client & helpers
│   │   ├── store.ts              # Zustand state management
│   │   └── database.types.ts     # Generated types
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── styles/
│   │   └── global.css            # Global styles & animations
│   ├── App.tsx                   # Main app component with routing
│   └── main.tsx                  # React DOM render
├── sql/
│   ├── schema.sql                # Database schema
│   └── rls_policies.sql          # RLS policy definitions
├── public/                        # Static assets
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── vite.config.ts                # Vite config
├── tailwind.config.js            # Tailwind config
├── index.html                     # HTML entry point
├── .env.example                   # Environment template
└── README.md                      # This file
```

---

## 📡 API & Database Operations

### Key Database Functions

#### **Authentication**

```typescript
// Sign up new user
const { signUp } = useAuth()
await signUp(email, password, username)

// Sign in existing user
const { signIn } = useAuth()
await signIn(email, password)

// Sign out
const { signOut } = useAuth()
await signOut()
```

#### **Posts**

```typescript
// Create post
await supabase.from('posts').insert([{
  user_id: userId,
  image_url: 'https://...',
  caption: 'Check this out!'
}])

// Get feed posts
const { data: posts } = await supabase
  .from('posts')
  .select('*, user:profiles(*), likes(*)')
  .order('created_at', { ascending: false })
```

#### **Likes**

```typescript
// Like a post
await supabase.from('likes').insert([{
  post_id: postId,
  user_id: userId
}])

// Unlike a post
await supabase
  .from('likes')
  .delete()
  .eq('post_id', postId)
  .eq('user_id', userId)
```

#### **Messages**

```typescript
// Send message
await supabase.from('messages').insert([{
  sender_id: userId,
  receiver_id: recipientId,
  content: 'Hello!'
}])

// Get conversation
const { data: messages } = await supabase
  .from('messages')
  .select('*, sender:profiles(*)')
  .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
  .order('created_at')
```

### Real-time Subscriptions

```typescript
// Subscribe to new messages
supabase
  .from(`messages:receiver_id=eq.${userId}`)
  .on('*', (payload) => {
    console.log('New message:', payload.new)
  })
  .subscribe()

// Subscribe to post likes
supabase
  .from(`likes:post_id=eq.${postId}`)
  .on('INSERT', (payload) => {
    console.log('New like:', payload.new)
  })
  .subscribe()
```

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/syndrome.git
git push -u origin main
```

2. **Connect to Vercel**
   - Go to [https://vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure environment variables
   - Click "Deploy"

### Deploy to Netlify

1. **Build the project**
```bash
npm run build
```

2. **Deploy**
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables
   - Deploy

### Production Checklist

- [ ] Update `VITE_APP_URL` to production domain
- [ ] Enable custom domain in Supabase
- [ ] Set up email templates in Supabase
- [ ] Enable OAuth providers (optional)
- [ ] Configure CORS for Supabase
- [ ] Set up SSL certificates
- [ ] Monitor error logs and analytics
- [ ] Set up backup strategy

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

---

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🤝 Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:** Ensure `.env.local` exists with correct values:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Issue: "Authentication fails"

**Solution:** 
- Verify Supabase URL and key in `.env.local`
- Check email verification in Supabase auth settings
- Clear browser cache and cookies

### Issue: "Images not uploading"

**Solution:**
- Verify storage buckets exist (posts, avatars)
- Check bucket permissions are public
- Verify file size < 5MB

### Issue: "Messages not showing"

**Solution:**
- Check RLS policies are enabled
- Verify message subscribers are active
- Check browser console for errors
- Restart development server

### Issue: "Build fails"

**Solution:**
- Run `npm install` again
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (needs 18+)

---

## 📧 Support & Contact

**Creator:** Priyanshu  
**Email:** [showlittlemercy@gmail.com](mailto:showlittlemercy@gmail.com)  
**Built with ❤️ for the web community**

---

## 🎯 Roadmap

- [ ] Video calling via WebRTC
- [ ] Stories feature
- [ ] Direct message encryption
- [ ] Group admin permissions
- [ ] User blocking functionality
- [ ] Post editing
- [ ] Advanced search filters
- [ ] Dark/Light theme toggle
- [ ] Push notifications
- [ ] Native mobile apps (React Native)

---

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure
- **React** - UI library
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide** - Icons
- **Zustand** - State management

---

**Thank you for using Syndrome! We hope you enjoy building amazing connections.** 🚀

---

**Last Updated:** December 20, 2025  
**Project Status:** ✅ Production Ready  
**Version:** 1.0.0
