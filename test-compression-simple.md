# Compression Testing Guide

## How to Test Compression Handling

### Step 1: Start the Application
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd vantex-affliate && npm run dev`
3. Open admin dashboard: `http://localhost:5173/admin/login`
4. Login with: `admin` / `admin123`

### Step 2: Create Test Hierarchy
1. Click "Reports" button to expand panel
2. Click "🧪 Run Compression Test" button
3. This will automatically create:
   - Ben Thompson (root affiliate)
   - Ganesh Kumar (referred by Ben)
   - Aksshit Sharma (downline under Ganesh)

### Step 3: Verify Initial Structure
1. Go to "Downlines" tab
2. Find Aksshit Sharma
3. Verify hierarchy: Aksshit → Sub1: Ganesh → Sub2: Ben

### Step 4: Test Compression
1. Go to "All Affiliates" tab
2. Find Ganesh Kumar
3. Click the red trash icon (🗑️) next to his name
4. Confirm removal dialog
5. Check the success message showing compressed downlines count

### Step 5: Verify Compression Results
1. Go back to "Downlines" tab
2. Find Aksshit Sharma
3. Verify new hierarchy: Aksshit → Sub1: Ben → Sub2: (null or Ben's referrer)
4. Confirm Ganesh is completely removed from system

### Expected Behavior
✅ **CORRECT**: Aksshit moves up one level (Ben becomes his Sub1)
❌ **WRONG**: Aksshit gets deleted or remains orphaned

### Manual Testing Alternative
If automated test fails, create manually:

1. **Create Ben**: Use affiliate registration form
2. **Approve Ben**: Admin dashboard → Pending Approvals → Approve
3. **Create Ganesh**: Register with Ben's affiliate code as referrer
4. **Approve Ganesh**: Admin dashboard → Pending Approvals → Approve  
5. **Create Aksshit**: Admin dashboard → Reports → Add Downline Manually
   - Select Ganesh as Sub1
6. **Remove Ganesh**: All Affiliates → Delete Ganesh
7. **Verify**: Check Downlines tab to see Aksshit under Ben

### Compression Logic Summary
When affiliate X is removed:
- All downlines where X is Sub1 → move up to X's referrer as new Sub1
- All downlines where X is Sub2 → set Sub2 to null
- Affiliate X is completely deleted from system
- Referral tree maintains integrity without orphans