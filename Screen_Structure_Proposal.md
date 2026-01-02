# Digital N-C File System - Screen Structure Proposal

## Overview
This document outlines the proposed screen structure for digitizing the Noting-Correspondence (N-C) File System, maintaining the physical file's two-pane structure while enhancing usability and traceability.

---

## 1. Main Application Layout

### 1.1 Master Layout (Base Template)
- **Header Bar**
  - Application Logo/Name
  - User Profile (Name, Designation, Section)
  - Notifications Icon (File assignments, approvals pending)
  - Search Bar (Global search for files)
  - Logout

- **Left Sidebar Navigation**
  - Dashboard
  - My Files (Files I created)
  - Inbox (Files assigned to me)
  - Pending Approvals
  - Sent Files (Files I've forwarded)
  - All Files (with filters)
  - Reports & Analytics
  - Settings

- **Main Content Area**
  - Dynamic content based on selected screen

---

## 2. Core Screens

### 2.1 Dashboard Screen
**Purpose:** Overview of user's file activities and statistics

**Layout:**
- **Top Section - Quick Stats Cards**
  - Files Pending My Action (count)
  - Files I Created (count)
  - Files Awaiting Approval (count)
  - Overdue Files (count with red indicator)

- **Middle Section - Recent Activity Feed**
  - Timeline view of recent file movements
  - Filters: All, Assigned to Me, Created by Me, Approved by Me

- **Bottom Section - Quick Actions**
  - Create New File (button)
  - Search Files (quick search)
  - View Pending Approvals (button)

---

### 2.2 File List Screen (My Files / Inbox / All Files)
**Purpose:** Display list of files with filtering and search

**Layout:**
- **Top Bar**
  - Screen Title (e.g., "My Files", "Inbox", "All Files")
  - Filter Buttons: Status, Section, Date Range, Priority
  - Search Input (by file number, subject, or content)
  - Sort Options: Date, File Number, Last Action
  - View Toggle: List View / Grid View

- **File List Table/Grid**
  - Columns:
    - File Number (clickable)
    - Subject
    - Section/Department
    - Status (Open, Under Review, Approved, Closed)
    - Last Action Date
    - Current Assignee
    - Priority Indicator
    - Action Buttons (View, Forward, etc.)

- **Pagination** at bottom

---

### 2.3 File Detail Screen (Main File View)
**Purpose:** Core screen showing the N-C file structure - this is the heart of the system

**Layout: Split View (Two-Pane Design)**

#### **Left Pane: File Information Panel**
- **File Cover Section (Collapsible)**
  - File Number (editable only by authorized users)
  - Section/Department
  - Subject
  - Start Period / End Period
  - Status Badge
  - Created By / Created Date
  - Last Modified Date
  - Confidential Indicator (if applicable)

- **File Movement Timeline (Collapsible)**
  - Visual timeline showing file movement history
  - Each entry shows: Date, From, To, Action, Remarks
  - Expandable to see full details

- **Quick Actions Panel**
  - Add Note (button)
  - Add Correspondence (button)
  - Forward File (button)
  - Mark Confidential (if authorized)
  - Close File (if authorized)
  - Print/Export (button)

#### **Right Pane: Main Content Area (Split into Two Sections)**

##### **Top Section: Noting Side (Left Half of Right Pane)**
- **Header: "NOTING SIDE"**
- **Note List (Chronological)**
  - Each note displayed as a card/panel:
    - Note Number (Note 1, Note 2, etc.)
    - Date & Time
    - Author Name & Designation (at right margin, as per physical file)
    - Note Content (formatted text with paragraph support)
    - References to Correspondence (highlighted, clickable links like "Refer C/12")
    - References to Previous Notes (clickable links like "Refer Note 3")
    - Signature/Approval Status
    - Action Buttons: Edit (if originator), Reply, Approve, Reject
    - Approval Markers (if paragraphs are approved individually)
  
  - **Add New Note Button** (floating or at bottom)
  - **Note Editor** (when adding/editing):
    - Rich text editor
    - Reference picker (to select C/1, C/2, or Note 1, Note 2)
    - Proposal/Recommendation section
    - Draft reply/order section
    - Signature pad or digital signature
    - Forward to (recipient selector)

##### **Bottom Section: Correspondence Side (Right Half of Right Pane)**
- **Header: "CORRESPONDENCE SIDE"**
- **Correspondence List (Numbered C/1, C/2, C/3... from right to left visually)**
  - Each correspondence displayed as a card:
    - Correspondence Number (C/1, C/2, etc.)
    - Document Type Icon (Letter, Bill, Order, etc.)
    - Document Title/Description
    - Inward Date & Number (if applicable)
    - Upload Date
    - Uploaded By
    - Preview Thumbnail (if image/PDF)
    - Action Buttons: View, Download, Delete (if authorized)
    - Referenced In (shows which notes reference this correspondence)
  
  - **Add Correspondence Button** (floating or at bottom)
  - **Upload Dialog**:
    - File upload (drag & drop or browse)
    - Document Type selector
    - Inward Date & Number input
    - Description/Title
    - Auto-numbering (next C/X)

- **Visual Indicator**: Correspondence numbers should visually appear to "expand inward" as new documents are added

---

### 2.4 Create New File Screen
**Purpose:** Initialize a new file

**Layout:**
- **Form Fields:**
  - File Number (auto-generated or manual entry)
  - Section/Department (dropdown)
  - Subject (text input, required)
  - Start Period (date picker, optional)
  - File Type (dropdown: Regular, Confidential)
  - Initial Note (optional - can add later)
  - Initial Correspondence (file upload, optional)

- **Action Buttons:**
  - Save as Draft
  - Create File & Add Note
  - Create File & Upload Correspondence
  - Cancel

---

### 2.5 Add Note Screen (Modal/Drawer)
**Purpose:** Add a new note to the file

**Layout:**
- **Note Editor:**
  - Rich text editor with formatting toolbar
  - Paragraph numbering support
  - Background/Summary section
  - Proposal/Recommendation section
  - Draft Reply/Order section (optional)

- **Reference Section:**
  - "Reference Correspondence" - Multi-select dropdown (C/1, C/2, etc.)
  - "Reference Previous Notes" - Multi-select dropdown (Note 1, Note 2, etc.)
  - Selected references appear as clickable links in the note

- **Forward To Section:**
  - Recipient selector (multi-select)
  - Section/Department filter
  - User search
  - Add custom message (optional)

- **Action Buttons:**
  - Save Draft
  - Submit & Forward
  - Cancel

---

### 2.6 Add Correspondence Screen (Modal/Drawer)
**Purpose:** Upload/add correspondence to the file

**Layout:**
- **File Upload Section:**
  - Drag & drop area
  - Browse button
  - Supported formats display
  - Multiple file upload support

- **Document Details:**
  - Document Type (dropdown: Letter, Bill, Voucher, Order, Circular, Report, Court Order, Representation, Other)
  - Title/Description (text input)
  - Inward Date (date picker, optional)
  - Inward Number (text input, optional)
  - Auto-numbering indicator (shows next C/X number)

- **Action Buttons:**
  - Upload
  - Cancel

---

### 2.7 Forward File Screen (Modal/Drawer)
**Purpose:** Forward file to other sections/officers

**Layout:**
- **Recipient Selection:**
  - Section/Department selector
  - User selector (with search)
  - Multiple recipients support
  - Priority selector (Normal, Urgent)

- **Remarks/Instructions:**
  - Text area for forwarding remarks
  - Action required indicator

- **File Movement Flow:**
  - Visual representation of current flow
  - Ability to add/remove recipients
  - Reorder recipients

- **Action Buttons:**
  - Forward
  - Save as Draft
  - Cancel

---

### 2.8 Review/Approval Screen
**Purpose:** Review file and record approval/rejection/remarks

**Layout:**
- **File Preview** (same as File Detail Screen, read-only)
- **Review Panel (Right Sidebar or Bottom Panel):**
  - Current Note being reviewed (highlighted)
  - Action Buttons:
    - Approve (with signature)
    - Approve with Conditions
    - Reject
    - Request Clarification
    - Return to Originator
    - Request Additional Documents
  
  - **Remarks Text Area:**
    - Rich text editor for remarks
    - Reference picker for correspondence/notes
  
  - **Paragraph-Level Approval** (if applicable):
    - List of paragraphs from the note
    - Checkbox for each paragraph
    - Individual approval option
  
  - **Signature Section:**
    - Digital signature pad
    - Or digital certificate selection
  
  - **Forward To Section:**
    - Next recipient selector
    - Or mark as "Final Approval"

- **Action Buttons:**
  - Submit Review
  - Save Draft
  - Cancel

---

### 2.9 File Movement History Screen
**Purpose:** Complete traceability of file movements

**Layout:**
- **Timeline View:**
  - Vertical timeline showing all movements
  - Each entry shows:
    - Date & Time
    - From (User, Section)
    - To (User, Section)
    - Action (Forwarded, Approved, Rejected, Returned)
    - Remarks
    - Documents added (if any)
    - Notes added (if any)
  
  - **Filters:**
    - Date range
    - User/Section
    - Action type

- **Export Options:**
  - Export to PDF
  - Export to Excel

---

### 2.10 File Closure Screen
**Purpose:** Close a file and archive it

**Layout:**
- **Closure Details Form:**
  - Closure Date (date picker)
  - Reason for Closure (dropdown: Full, Unmanageable, Completed, Other)
  - Reference to New File Number (if applicable, text input)
  - Remarks (text area)

- **File Summary:**
  - Total Notes count
  - Total Correspondence count
  - File Duration (start to closure)
  - Final Status

- **Action Buttons:**
  - Close File
  - Cancel

- **Confirmation Dialog:**
  - Warning about permanent closure
  - Archive location information

---

### 2.11 Search & Advanced Search Screen
**Purpose:** Search across all files

**Layout:**
- **Search Bar:**
  - Global search input
  - Filters: File Number, Subject, Content, Date Range, Section, Status

- **Search Results:**
  - List of matching files
  - Highlighted search terms
  - Relevance ranking
  - Quick preview on hover

- **Advanced Search Panel:**
  - Multiple criteria filters
  - Boolean operators (AND, OR, NOT)
  - Search in: Notes, Correspondence, File Details

---

### 2.12 Reports & Analytics Screen
**Purpose:** Generate reports and view analytics

**Layout:**
- **Report Categories:**
  - File Status Reports
  - Pending Approvals Report
  - File Movement Report
  - Section-wise Statistics
  - User Activity Report
  - Overdue Files Report

- **Filters:**
  - Date Range
  - Section/Department
  - User
  - File Status

- **Visualizations:**
  - Charts (bar, line, pie)
  - Tables with export options

---

### 2.13 Settings Screen
**Purpose:** User and system settings

**Layout:**
- **User Profile:**
  - Name, Designation, Section
  - Email, Phone
  - Digital Signature/Certificate management

- **Preferences:**
  - Notification settings
  - Default file settings
  - Display preferences

- **System Settings (Admin only):**
  - User management
  - Section/Department management
  - File numbering rules
  - Workflow configuration

---

## 3. Mobile/Responsive Considerations

### 3.1 Mobile Layout Adaptations
- **File Detail Screen:**
  - Stack Noting and Correspondence vertically instead of side-by-side
  - Tab navigation between Noting and Correspondence
  - Collapsible panels

- **Navigation:**
  - Hamburger menu for sidebar
  - Bottom navigation bar for quick actions

- **Touch Optimizations:**
  - Larger touch targets
  - Swipe gestures for navigation
  - Simplified forms

---

## 4. Key UI/UX Features

### 4.1 Visual Design Principles
- **Two-Pane Metaphor:** Maintain the physical file's left-right structure visually
- **Color Coding:**
  - Different colors for different file statuses
  - Highlight pending actions
  - Distinguish confidential files

- **Typography:**
  - Clear hierarchy
  - Readable font sizes
  - Support for multiple languages

### 4.2 Interactive Features
- **Clickable References:**
  - Clicking "Refer C/12" jumps to that correspondence
  - Clicking "Refer Note 3" jumps to that note
  - Breadcrumb navigation

- **Real-time Updates:**
  - Notifications when file is assigned/updated
  - Live status updates
  - Collaboration indicators

- **Version Control:**
  - View history of note edits
  - Compare versions
  - Audit trail

### 4.3 Accessibility
- **Keyboard Navigation:**
  - Full keyboard support
  - Shortcuts for common actions

- **Screen Reader Support:**
  - Proper ARIA labels
  - Alt text for images
  - Semantic HTML

---

## 5. Workflow Integration Points

### 5.1 Approval Workflow
- Visual workflow diagram
- Status indicators at each stage
- Automatic routing based on rules
- Escalation for overdue approvals

### 5.2 File Movement Rules
- Configurable routing rules
- Section-based routing
- Priority-based routing
- Exception handling (absent officers, urgent cases)

### 5.3 Notification System
- Email notifications
- In-app notifications
- SMS (optional, for urgent)
- Notification preferences

---

## 6. Technical Considerations

### 6.1 Data Structure
- File metadata
- Notes (with versioning)
- Correspondence (with metadata)
- Movement history
- User permissions

### 6.2 Security
- Role-based access control
- Digital signatures
- Audit logging
- Encryption for confidential files
- Secure file storage

### 6.3 Performance
- Lazy loading for large files
- Pagination for notes/correspondence
- Efficient search indexing
- Caching strategies

---

## 7. Screen Priority (Phases)

### Phase 1 (MVP):
1. Dashboard
2. File List Screen
3. File Detail Screen (with Noting & Correspondence)
4. Create New File
5. Add Note
6. Add Correspondence
7. Forward File
8. Review/Approval Screen

### Phase 2:
9. File Movement History
10. File Closure
11. Search & Advanced Search
12. Reports & Analytics

### Phase 3:
13. Mobile optimizations
14. Advanced workflow features
15. Integration with external systems
16. Advanced analytics

---

## 8. Mockup Recommendations

For each screen, create:
- Wireframes (low-fidelity)
- High-fidelity mockups
- Interactive prototypes
- User flow diagrams

---

## Conclusion

This screen structure maintains the core N-C file system principles while providing a modern, intuitive digital interface. The two-pane design (Noting-Correspondence) is preserved, ensuring familiarity for users transitioning from physical files while enhancing efficiency and traceability.

