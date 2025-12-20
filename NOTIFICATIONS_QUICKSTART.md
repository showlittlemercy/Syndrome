# 🚀 Quick Setup - Notifications System

## Step 1: Run Migration (REQUIRED)

1. **Open Supabase Dashboard**
2. **Go to:** SQL Editor → New Query
3. **Copy & Paste:** Entire contents of `sql/migration_add_notifications.sql`
4. **Click:** RUN button
5. **Verify:** No red errors appear

## Step 2: Test Immediately

### Test 1: Like Notification
1. Open app in **two browser windows** (or incognito)
2. **Window 1:** Sign in as User A
3. **Window 2:** Sign in as User B
4. **Window 1:** Like one of User B's posts
5. **Window 2:** Check notifications bell icon
6. ✅ Badge should show "1"
7. ✅ Click bell → see "User A liked your post"

### Test 2: Comment Notification
1. **Window 1 (User A):** Comment on User B's post
2. **Window 2 (User B):** Check bell icon
3. ✅ Badge updates to "2" (if you did test 1)
4. ✅ Click bell → see comment with preview text

### Test 3: Follow Notification
1. **Window 1 (User A):** Go to User B's profile
2. **Window 1:** Click Follow button
3. **Window 2 (User B):** Check bell icon
4. ✅ Badge increments
5. ✅ See "User A started following you"

## Expected Behavior

### Notifications Page (`/notifications`)
- Shows all notifications (likes, comments, follows)
- Unread notifications have blue border + glow
- Read notifications appear dimmed
- Click notification → navigates to relevant page
- "Mark all as read" button at top

### Bell Icon (Bottom Navigation)
- Shows unread count badge
- Badge is pink/purple with white number
- Displays "9+" for 10 or more unread
- Badge animates in when new notification arrives
- Updates in real-time without refresh

### Auto-Created Notifications
```
✅ Like post → Post owner notified
✅ Unlike post → Notification removed
✅ Comment on post → Post owner notified
✅ Follow user → User notified
✅ Unfollow user → Notification removed
❌ Self-actions → No notification
```

## Visual Indicators

### Unread Notification
```
┌─────────────────────────────────────┐
│ 👤 [Avatar]  🔴                    │ <- Blue dot
│                                     │
│ username liked your post            │
│ 2m ago                              │
└─────────────────────────────────────┘
   ↑ Blue border/glow
```

### Read Notification
```
┌─────────────────────────────────────┐
│ 👤 [Avatar]                         │
│                                     │
│ username commented: "Nice!"         │
│ 5h ago                              │
└─────────────────────────────────────┘
   ↑ Gray border, dimmed
```

## Troubleshooting

### "Badge not updating"
**Fix:** Refresh page once after running migration

### "No notifications appearing"
**Check:**
```sql
-- In Supabase SQL Editor, verify triggers exist:
SELECT COUNT(*) FROM pg_trigger 
WHERE tgname LIKE '%notification%';
```
Should return: **5 triggers**

### "Getting notified for own actions"
**This is a bug if it happens!** 
Migration includes check to prevent this.
Re-run migration if this occurs.

### "Notifications not clickable"
**Fix:** Make sure you're on `/notifications` page

## Key Features

✅ **Real-Time Updates** - No refresh needed
✅ **Smart Badge** - Shows exact unread count
✅ **Auto-Cleanup** - Unlike/unfollow removes notifications
✅ **Time Stamps** - "just now", "5m ago", "2h ago", etc.
✅ **Click to Navigate** - Go directly to post/profile
✅ **Mark as Read** - Individual or all at once

## Files Modified Summary

**New Files:**
- `sql/migration_add_notifications.sql` - Database setup
- `src/pages/Notifications.tsx` - Notifications page
- `NOTIFICATIONS_GUIDE.md` - Full documentation

**Modified Files:**
- `src/components/BottomNavigation.tsx` - Added bell icon + badge
- `src/App.tsx` - Added `/notifications` route
- `src/types/index.ts` - Added Notification interface

## Quick Commands

### Check notifications table
```sql
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

### Count unread
```sql
SELECT COUNT(*) FROM notifications 
WHERE user_id = 'YOUR_USER_ID' 
AND read = false;
```

### Mark all as read (manual)
```sql
UPDATE notifications 
SET read = true 
WHERE user_id = 'YOUR_USER_ID';
```

### Delete all notifications (reset)
```sql
DELETE FROM notifications 
WHERE user_id = 'YOUR_USER_ID';
```

## Success Criteria

After running migration, you should have:
- [x] Bell icon in bottom navigation
- [x] Badge showing "0" initially
- [x] Notifications page accessible
- [x] Likes create notifications
- [x] Comments create notifications
- [x] Follows create notifications
- [x] Badge updates in real-time
- [x] Click to navigate works

---

**Status:** ✅ Ready to Deploy
**Next:** Run migration → Test → Enjoy notifications!
