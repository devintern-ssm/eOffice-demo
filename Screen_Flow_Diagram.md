# Digital N-C File System - Screen Flow Diagram

## Main User Flows

### Flow 1: Create and Process a New File

```
Dashboard
    ↓
[Create New File Button]
    ↓
Create New File Screen
    ↓
[Enter File Details]
    ↓
File Detail Screen (New File)
    ↓
[Add Initial Note] OR [Add Initial Correspondence]
    ↓
Add Note Screen / Add Correspondence Screen
    ↓
File Detail Screen (with content)
    ↓
[Forward File]
    ↓
Forward File Screen
    ↓
File Detail Screen (Forwarded)
    ↓
[Recipient receives notification]
    ↓
Inbox / Dashboard
    ↓
[Click on File]
    ↓
File Detail Screen
    ↓
[Review & Approve/Reject]
    ↓
Review/Approval Screen
    ↓
File Detail Screen (Updated)
    ↓
[Continue workflow until final approval]
    ↓
[Close File]
    ↓
File Closure Screen
    ↓
Archived Files
```

### Flow 2: Review and Approve Assigned File

```
Dashboard / Inbox
    ↓
[View Pending Approvals]
    ↓
File List Screen (Pending Approvals)
    ↓
[Click on File]
    ↓
File Detail Screen
    ↓
[Review Note & Correspondence]
    ↓
[Click Approve/Reject/Request Clarification]
    ↓
Review/Approval Screen
    ↓
[Add Remarks & Signature]
    ↓
[Forward to Next Recipient]
    ↓
File Detail Screen (Updated with new note)
    ↓
[File moves to next recipient]
```

### Flow 3: Add Content to Existing File

```
File List Screen / Dashboard
    ↓
[Click on File]
    ↓
File Detail Screen
    ↓
[Add Note Button] OR [Add Correspondence Button]
    ↓
Add Note Screen / Add Correspondence Screen
    ↓
[Enter Content & Upload]
    ↓
File Detail Screen (Updated)
    ↓
[Forward if needed]
```

### Flow 4: Search and View File

```
Dashboard / Any Screen
    ↓
[Global Search]
    ↓
Search & Advanced Search Screen
    ↓
[Enter Search Criteria]
    ↓
Search Results
    ↓
[Click on File]
    ↓
File Detail Screen
    ↓
[View File Movement History]
    ↓
File Movement History Screen
```

---

## Screen Relationships

### Core Screens (Always Accessible)
- **Dashboard** - Entry point, overview
- **File List Screen** - Browse files (My Files, Inbox, All Files)
- **File Detail Screen** - Main working screen

### Action Screens (Modal/Drawer)
- **Add Note Screen** - Opens from File Detail Screen
- **Add Correspondence Screen** - Opens from File Detail Screen
- **Forward File Screen** - Opens from File Detail Screen
- **Review/Approval Screen** - Opens from File Detail Screen
- **File Closure Screen** - Opens from File Detail Screen

### Supporting Screens
- **Create New File Screen** - Standalone screen
- **File Movement History Screen** - Opens from File Detail Screen
- **Search & Advanced Search Screen** - Standalone screen
- **Reports & Analytics Screen** - Standalone screen
- **Settings Screen** - Standalone screen

---

## Navigation Structure

```
┌─────────────────────────────────────┐
│         Header Bar                   │
│  [Logo] [Search] [Notifications] [Profile] │
└─────────────────────────────────────┘
┌──────┬──────────────────────────────┐
│      │                              │
│ Side │    Main Content Area         │
│ Bar  │    (Dynamic based on         │
│      │     selected screen)         │
│ -    │                              │
│ Dash │                              │
│ -    │                              │
│ My   │                              │
│ Files│                              │
│ -    │                              │
│ Inbox│                              │
│ -    │                              │
│ etc. │                              │
│      │                              │
└──────┴──────────────────────────────┘
```

---

## File Detail Screen Layout (Key Screen)

```
┌─────────────────────────────────────────────────────────────────┐
│ File Detail Screen                                               │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│ LEFT PANE    │           RIGHT PANE                              │
│ (Fixed)      │           (Main Content)                           │
│              │                                                   │
│ ┌──────────┐ │  ┌──────────────────┬──────────────────────────┐ │
│ │File Cover│ │  │  NOTING SIDE     │  CORRESPONDENCE SIDE     │ │
│ │          │ │  │  (Left Half)     │  (Right Half)            │ │
│ │- Number  │ │  │                  │                          │ │
│ │- Subject │ │  │  Note 1          │  C/1  C/2  C/3          │ │
│ │- Section │ │  │  [Note Card]     │  [Doc] [Doc] [Doc]      │ │
│ │- Status  │ │  │                  │                          │ │
│ └──────────┘ │  │  Note 2          │  C/4  C/5                │ │
│              │  │  [Note Card]     │  [Doc] [Doc]            │ │
│ ┌──────────┐ │  │                  │                          │ │
│ │Movement  │ │  │  [+ Add Note]    │  [+ Add Correspondence] │ │
│ │Timeline  │ │  │                  │                          │ │
│ └──────────┘ │  └──────────────────┴──────────────────────────┘ │
│              │                                                   │
│ ┌──────────┐ │                                                   │
│ │Quick     │ │                                                   │
│ │Actions   │ │                                                   │
│ │          │ │                                                   │
│ │[Forward] │ │                                                   │
│ │[Close]   │ │                                                   │
│ │[Print]   │ │                                                   │
│ └──────────┘ │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## State Transitions

### File States
- **Draft** → **Open** → **Under Review** → **Approved** / **Rejected** → **Closed**
- **Under Review** → **Returned for Correction** → **Open** (cycle back)

### Note States
- **Draft** → **Submitted** → **Under Review** → **Approved** / **Rejected** / **Returned**

### User Actions Triggering State Changes
- Create File → Draft
- Submit Note → Open/Under Review
- Approve → Approved
- Reject → Returned for Correction
- Close File → Closed

---

## Key Interactions

1. **Click File Number** → Opens File Detail Screen
2. **Click "Refer C/X"** → Scrolls to Correspondence C/X
3. **Click "Refer Note X"** → Scrolls to Note X
4. **Click Note Card** → Expands to show full content
5. **Click Correspondence Card** → Opens document viewer
6. **Hover over Note** → Shows quick actions (Approve, Reject, etc.)
7. **Click Forward** → Opens Forward File Screen
8. **Click Add Note** → Opens Add Note Screen (modal)
9. **Click Add Correspondence** → Opens Add Correspondence Screen (modal)

---

## Responsive Breakpoints

### Desktop (> 1024px)
- Full two-pane layout
- Sidebar always visible
- All features accessible

### Tablet (768px - 1024px)
- Collapsible sidebar
- Two-pane layout maintained
- Touch-optimized buttons

### Mobile (< 768px)
- Hamburger menu for sidebar
- Stacked layout (Noting above Correspondence)
- Tab navigation between Noting and Correspondence
- Simplified forms
- Bottom navigation bar

---

## Notification Triggers

1. **File Assigned** → Notification to recipient
2. **File Approved** → Notification to originator
3. **File Rejected** → Notification to originator
4. **File Returned** → Notification to originator
5. **New Note Added** → Notification to all file participants
6. **New Correspondence Added** → Notification to all file participants
7. **File Overdue** → Notification to current assignee and originator
8. **File Closed** → Notification to all participants

---

## Access Control Points

- **Create File** → Any authorized user
- **Edit Note** → Only originator (before approval)
- **Add Correspondence** → File participants
- **Approve/Reject** → Assigned reviewers/approvers
- **Forward File** → Current assignee
- **Close File** → Authorized users (configurable)
- **View Confidential Files** → Restricted users only
- **View All Files** → Based on role and section

