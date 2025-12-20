# 👨‍💻 SYNDROME - Developer's Guide

**For:** Priyanshu & Development Team  
**Created:** December 20, 2025  
**Version:** 1.0.0

---

## 🎯 Welcome to Syndrome Development

This guide will help you understand, modify, and extend the Syndrome platform.

### Quick Links
- **Setup:** See [SETUP.md](./SETUP.md)
- **Docs:** See [README.md](./README.md)
- **Files:** See [FILE_STRUCTURE.md](./FILE_STRUCTURE.md)
- **Project:** See [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

---

## 🚀 Development Workflow

### 1. Initial Setup (First Time)
```bash
# Clone project
cd Syndrome

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### 2. During Development
```bash
# Watch for changes (auto-reload)
npm run dev

# Check for errors
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### 3. Before Committing
```bash
# Run linter
npm run lint

# Build to ensure no errors
npm run build

# Test in preview mode
npm run preview

# Create commit
git add .
git commit -m "Your message"

# Push to GitHub
git push
```

---

## 📝 Code Standards

### TypeScript
- Always use TypeScript for new files (.ts, .tsx)
- Enable strict mode
- Use proper type definitions
- Avoid `any` type (use `unknown` if necessary)

### React
- Use functional components with hooks
- Keep components small and focused
- Use custom hooks for reusable logic
- Memoize expensive operations with `useMemo`

### Naming Conventions
```typescript
// Components: PascalCase
const UserProfile = () => { }

// Functions: camelCase
const fetchUserData = () => { }

// Constants: UPPER_SNAKE_CASE
const API_TIMEOUT = 5000

// Variables: camelCase
const isLoading = true

// Interfaces: PascalCase with I prefix (optional)
interface IUser {
  id: string
  username: string
}

// Files: Use same case as what they export
// Component files: UserProfile.tsx
// Utility files: utils.ts
// Hook files: useAuth.ts
```

### File Organization
```
component/
├── ComponentName.tsx      # Main component
├── ComponentName.test.tsx # Tests (if needed)
└── index.ts              # Export (optional)
```

### Comments
```typescript
/**
 * Brief description of what this function does
 * @param userId - The user's unique ID
 * @returns The user's profile data
 */
export const fetchProfile = (userId: string) => {
  // Implementation
}
```

---

## 🗄️ Database Operations

### Creating a New Table

1. **Add to schema.sql:**
```sql
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_my_table_user_id ON my_table(user_id);
```

2. **Add RLS policies to rls_policies.sql:**
```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own"
ON my_table FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert"
ON my_table FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

3. **Update types in database.types.ts:**
```typescript
my_table: {
  Row: {
    id: string
    user_id: string
    content: string | null
    created_at: string
  }
  Insert: { ... }
  Update: { ... }
}
```

4. **Use in components:**
```typescript
const { data } = await supabase
  .from('my_table')
  .select('*')
  .eq('user_id', userId)
```

---

## 🧩 Adding a New Component

### Step 1: Create Component File
```typescript
// src/components/MyComponent.tsx
import React from 'react'
import { motion } from 'framer-motion'

interface MyComponentProps {
  title: string
  onAction?: () => void
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 rounded-lg bg-dark-800"
    >
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {/* Content */}
    </motion.div>
  )
}

export default MyComponent
```

### Step 2: Use Component
```typescript
import MyComponent from '@/components/MyComponent'

export const MyPage = () => {
  return <MyComponent title="Hello" onAction={() => {}} />
}
```

---

## 🎣 Creating Custom Hooks

### Pattern
```typescript
// src/hooks/useMyHook.ts
import { useState, useEffect } from 'react'

/**
 * Hook description
 * @param param - Parameter description
 * @returns Object with hook data
 */
export const useMyHook = (param: string) => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        // Logic here
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
      } finally {
        setIsLoading(false)
      }
    }

    fetch()
  }, [param])

  return { data, isLoading, error }
}
```

### Usage
```typescript
const { data, isLoading, error } = useMyHook('param')
```

---

## 🔐 Authentication & Authorization

### Check if User is Authenticated
```typescript
import { useAuthStore } from '@/lib/store'

const MyComponent = () => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" />
  }

  return <div>Welcome, {user?.email}</div>
}
```

### Use Auth Actions
```typescript
const { signUp, signIn, signOut } = useAuth()

// Sign up
await signUp(email, password, username)

// Sign in
await signIn(email, password)

// Sign out
await signOut()
```

### Protect Routes
```typescript
const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/auth/signin" />
  }

  return <>{children}</>
}

// In App.tsx
<Route path="/protected" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
```

---

## 🎨 Working with Tailwind CSS

### Custom Classes in Syndrome
```html
<!-- Glassmorphism -->
<div class="glass-effect p-8 rounded-2xl border border-dark-700">

<!-- Glow Effect -->
<button class="glow-effect hover:glow-lg">

<!-- Gradient Text -->
<h1 class="gradient-text">Syndrome</h1>

<!-- Custom Colors -->
<div class="bg-syndrome-primary text-white">
<div class="from-syndrome-primary to-syndrome-secondary">
```

### Adding Custom Utilities
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      brand: '#667eea',
    },
    animation: {
      float: 'float 3s ease-in-out infinite',
    },
  },
}
```

---

## ✨ Framer Motion Tips

### Page Transitions
```typescript
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

<motion.div variants={pageVariants} initial="hidden" animate="visible">
  {/* Content */}
</motion.div>
```

### Hover Effects
```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click Me
</motion.button>
```

### Stagger Children
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

<motion.div variants={containerVariants}>
  {items.map((item) => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

---

## 🗂️ State Management with Zustand

### Creating a Store
```typescript
import { create } from 'zustand'

interface MyStore {
  count: number
  increment: () => void
  decrement: () => void
}

export const useMyStore = create<MyStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

### Using the Store
```typescript
const { count, increment, decrement } = useMyStore()

return (
  <div>
    <p>Count: {count}</p>
    <button onClick={increment}>+</button>
    <button onClick={decrement}>-</button>
  </div>
)
```

---

## 📡 API Calls with Supabase

### Basic Query
```typescript
// Read
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', userId)

// Create
const { data, error } = await supabase
  .from('posts')
  .insert([{ user_id: userId, caption: 'Hello' }])

// Update
const { data, error } = await supabase
  .from('posts')
  .update({ caption: 'Updated' })
  .eq('id', postId)

// Delete
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
```

### With Relations
```typescript
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    user:profiles(username, avatar_url),
    likes(user_id),
    comments(*)
  `)
```

### Real-time Subscriptions
```typescript
supabase
  .from(`messages:receiver_id=eq.${userId}`)
  .on('INSERT', (payload) => {
    console.log('New message:', payload.new)
  })
  .subscribe()
```

---

## 🖼️ Image Upload

### Upload Image
```typescript
import { uploadImage } from '@/lib/supabase'

const handleImageUpload = async (file: File) => {
  try {
    const path = `posts/${userId}/${Date.now()}-${file.name}`
    const publicUrl = await uploadImage('posts', path, file)
    console.log('Image uploaded:', publicUrl)
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### Use Uploaded URL
```typescript
<img src={publicUrl} alt="Uploaded" className="w-full rounded-lg" />
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Sign up with new email
- [ ] Verify email
- [ ] Sign in
- [ ] Create post with image
- [ ] Like/unlike post
- [ ] Comment on post
- [ ] Send direct message
- [ ] Search for user
- [ ] Follow/unfollow user
- [ ] Edit profile
- [ ] Test on mobile

### Error Testing
- [ ] Invalid credentials
- [ ] Network error
- [ ] Storage quota exceeded
- [ ] Unauthorized access
- [ ] Invalid image format

---

## 🐛 Debugging

### Browser DevTools
```javascript
// In console
// Check auth state
localStorage.getItem('supabase.auth.token')

// Check store state
useAuthStore.getState()

// Network tab - check API calls
// Look at Response tab for errors
```

### Console Logging
```typescript
// Good logging
console.log('User profile:', { userId, username })

// Avoid
console.log(largeObject) // Hard to read
```

### React DevTools
- Install React DevTools browser extension
- Check component props and state
- Track renders with Profiler

---

## 🚀 Performance Optimization

### Image Optimization
```typescript
// Compress before upload
const compressed = await compressImage(file)
await uploadImage('posts', path, compressed)
```

### Code Splitting
```typescript
// Lazy load components
const HeavyComponent = React.lazy(() => 
  import('./HeavyComponent')
)
```

### Memoization
```typescript
// Memoize expensive calculations
const memoizedValue = useMemo(() => {
  return expensiveCalculation(a, b)
}, [a, b])
```

---

## 📚 Resources

### Documentation
- [React Hooks](https://react.dev/reference/react)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Supabase](https://supabase.com/docs)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Tailwind IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

---

## 🤝 Git Workflow

### Branch Names
```bash
feature/new-feature          # New feature
bugfix/issue-name            # Bug fix
docs/update-readme           # Documentation
```

### Commit Messages
```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update README"
git commit -m "style: format code"
```

### Pull Request Template
```
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation

## Testing
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] No console errors

## Related Issues
Closes #123
```

---

## 🎯 Common Tasks

### Add New Page
1. Create file in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation link in `BottomNavigation.tsx`
4. Create component

### Add New Feature
1. Design database schema
2. Create database table
3. Create RLS policies
4. Create types
5. Create hook/service
6. Create UI component
7. Test thoroughly

### Fix Bug
1. Reproduce issue
2. Debug in DevTools
3. Write fix
4. Test fix
5. Commit with message
6. Verify no regression

---

## 📞 Getting Help

**Need Help?**
- Check README.md for detailed docs
- Look at similar files for patterns
- Check console for errors
- Search Supabase docs
- Email: showlittlemercy@gmail.com

---

## ✅ Deployment Checklist

- [ ] All TypeScript errors fixed
- [ ] ESLint passes
- [ ] Build succeeds: `npm run build`
- [ ] No console errors
- [ ] Tested on mobile
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] Backup created

---

## 🎉 Happy Coding!

This codebase is well-structured and documented. Feel free to extend it and make it your own.

**Remember:**
- Keep components small
- Write clear code
- Test before committing
- Document your changes
- Ask questions when stuck

---

**Last Updated:** December 20, 2025  
**By:** Priyanshu  
**Contact:** showlittlemercy@gmail.com

Happy developing! 🚀
