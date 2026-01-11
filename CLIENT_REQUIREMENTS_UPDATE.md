# Client Requirements - Updates to be Incorporated

## 📋 Requirements from Client Meeting

### 1. File Organization & Display
- **UN Number Wise Display**: Files should be organized and displayed by UN number
- **Department Wise Display**: Files should be organized and displayed by department
- **Files Created by User**: Clear indication of where user-created files are shown

### 2. Sorting & Filtering
- **My Files Sorting**: Sort by last used date (most recently used first)
- **Inbox Sorting**: 
  - Inward (Final Approved) - Files that are finally approved
  - Outward (Revision) - Files pending revision/not final
  - This prevents confusion about file status

### 3. Note Management
- **Draft Notes**: Ability to save draft notes until submission to next party
- **Search from Approved Files**: Search existing approved files and paste references into new notes or draft notes
- **Recipient Order**: Recipients can be decided in advance, and the order can be changed by any recipient later

### 4. File Upload & Document Management
- **Multiple File Formats**: Support for PDF, Excel, Word, JPG, and all printable formats
- **Email Integration**: Ability to add email references to correspondence side
- **Hyperlink/Drag-Drop**: 
  - Drag and drop for correspondence
  - If correspondence is on a specific page (e.g., C/36), only that page should be attachable/fetchable
  - Page-specific attachment capability

### 5. Maker-Checker Workflow
- **Maker-Checker Model**:
  - Maker creates file → passes to Checker
  - Checker sees 3 buttons: (1) Check, (2) Approve, (3) Revert
  - Checker can either:
    - Check and forward (to next checker or approver)
    - Approve and return (to maker)
  - Example: Maker: Rutuja → Checker: Rasika → Approved: Ravi Pawar

- **Multiple Checkers**: 
  - If there's one maker and many checkers, after one checker approves, comments can be added
  - Each checker can add their comments

- **Edit Permissions**: 
  - Maker, Checker, and Approver can only edit their own sections
  - Can forward to next person after editing

### 6. Approval Workflow
- **MD Approval Feature**: 
  - If MD approval is taken offline, any maker or checker should be able to upload the physical scanned approval
  - Can close the note after uploading offline approval

- **Digital Signature**: 
  - Digital signature feature (if required/approved by)
  - Shows who approved and when

- **Approval Details in Print**: 
  - Printed document should show:
    - Approval sign
    - Date and time
    - Approved by
    - Location
    - All approvals included (maker, checker, final approver)

### 7. Post-Approval Actions
- **Actionable Department Forwarding**: 
  - After note is approved, actionable department is forwarded the note for implementation and comments
  - Then returned to maker

- **Print Option**: 
  - Print option available after final approval
  - For hardcopy of the file
  - Print page range along with summary page

### 8. Reports & Logs
- **Report Section**: 
  - Report section with logs of files
  - Complete audit trail
  - File activity logs

### 9. DMS Integration
- **DMS Integration**: 
  - DMS (Document Management System) is inbuilt
  - Old files can be fetched from DMS
  - Integration with existing document management

---

## 🎯 Implementation Priority

### Phase 1 - Core Workflow (Must Have)
1. Maker-Checker workflow with Check/Approve/Revert buttons
2. Draft note saving
3. Inbox sorting (Inward/Outward)
4. Edit permissions (own sections only)
5. Multiple checkers with comments

### Phase 2 - Enhanced Features (Should Have)
6. UN number and department-wise display
7. Sorting by last used date
8. Search from approved files
9. Multiple file format support
10. Email integration

### Phase 3 - Advanced Features (Nice to Have)
11. Hyperlink/drag-drop with page-specific attachment
12. MD approval with offline upload
13. Digital signature
14. Print with approval details
15. Report section
16. DMS integration

---

## 📝 Notes for Development Team

- These requirements should be incorporated into the system design
- Some features may require backend integration
- Workflow customization is essential
- Print functionality needs special attention for approval details
- DMS integration will require API development
