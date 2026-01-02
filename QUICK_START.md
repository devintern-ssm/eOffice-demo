# Quick Start Guide

## For Client Demo

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Application
```bash
npm run dev
```

### Step 3: Open in Browser
The application will automatically open at `http://localhost:3000`

## What to Show the Client

### 1. Dashboard
- Show statistics cards
- Recent activity feed
- Quick actions

### 2. File Detail (Main Feature)
Navigate to any file (e.g., click on "ADMIN/2024/001" from My Files)

**Key Points to Highlight:**
- **Two-Pane Layout**: Explain how it maintains the physical file structure
  - Left pane: File info, movement timeline
  - Right pane top: Noting Side (decision-making)
  - Right pane bottom: Correspondence Side (supporting documents)

- **Sequential Numbering**: 
  - Notes are numbered 1, 2, 3...
  - Correspondence is numbered C/1, C/2, C/3...

- **Clickable References**: 
  - Click on "Refer C/1" or "Refer Note 2" in any note
  - Show how it navigates to the referenced item

- **Author Positioning**: 
  - Note 1 author on right margin
  - Subsequent notes have authors on left margin
  - (Matches physical file structure)

### 3. Add Note
- Click "Add Note" button
- Show the note editor
- Show reference selection (correspondence and previous notes)
- Show forward options

### 4. Add Correspondence
- Click "Add Correspondence" button
- Show document upload
- Show auto-numbering (next C/X)

### 5. Forward File
- Click "Forward File" button
- Show recipient selection
- Show section-based filtering
- Show priority selection

### 6. Review & Approve
- Click "Review & Approve" button
- Show different action options (Approve, Reject, Return, etc.)
- Show paragraph-level approval option
- Show remarks section

### 7. File Lists
- Show different views (My Files, Inbox, Pending Approvals)
- Demonstrate search and filter functionality
- Show status badges and priority indicators

### 8. Create New File
- Navigate to "Create New File"
- Show the form
- Explain file numbering, section selection, etc.

## Demo Flow Suggestion

1. **Start at Dashboard** - Show overview
2. **Navigate to "My Files"** - Show file list
3. **Click on a file** - Show File Detail (main feature)
4. **Demonstrate references** - Click on "Refer C/1" in a note
5. **Add a new note** - Show the process
6. **Add correspondence** - Show document upload
7. **Forward file** - Show workflow
8. **Review & Approve** - Show approval process
9. **Show file movement timeline** - Expand the movement section

## Key Selling Points

1. **Maintains Physical File Structure**: Two-pane layout familiar to users
2. **Complete Traceability**: Every action is logged and visible
3. **Sequential Numbering**: Just like physical files
4. **Clickable References**: Easy navigation between notes and documents
5. **Modern UI**: Clean, intuitive interface
6. **Mobile Responsive**: Works on tablets and phones
7. **Search & Filter**: Easy to find files
8. **Workflow Management**: Clear approval process

## Sample Files to Show

1. **ADMIN/2024/001** - Purchase of Office Equipment
   - Has 2 notes
   - Has 2 correspondence
   - Shows file movement
   - Good example of complete workflow

2. **LEGAL/2024/001** - Court Order
   - Marked as Confidential
   - Shows confidential file handling

3. **ACCOUNTS/2024/015** - Payment Voucher
   - Shows accounts workflow
   - Multiple correspondence

## Troubleshooting

### Port Already in Use
If port 3000 is busy, Vite will automatically use the next available port. Check the terminal output.

### Dependencies Not Installing
Make sure you have Node.js v16 or higher installed. Check with:
```bash
node --version
```

### Application Not Loading
1. Clear browser cache
2. Check browser console for errors
3. Make sure all dependencies are installed

## Next Steps After Demo

If the client is interested:
1. Discuss backend requirements
2. Discuss authentication and user management
3. Discuss file storage and document management
4. Discuss integration with existing systems
5. Discuss deployment options

---

**Remember**: This is a frontend demo. All actions show alerts instead of actually saving data. This is intentional for demonstration purposes.
