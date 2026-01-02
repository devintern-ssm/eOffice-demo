# eOffice - Digital N-C File System

A modern React-based frontend application for digitizing the Noting-Correspondence (N-C) File Management System. This is a demo/prototype version with dummy data to showcase the system to clients.

## Features

- **Two-Pane File View**: Maintains the physical file structure with Noting Side (left) and Correspondence Side (right)
- **Dashboard**: Overview with statistics and recent activity
- **File Management**: Create, view, and manage files
- **Note Management**: Add notes with references to correspondence and previous notes
- **Correspondence Management**: Upload and manage supporting documents
- **File Movement**: Track file movements between sections and users
- **Review & Approval**: Review files with approve/reject/return options
- **Search & Filter**: Search files by number, subject, or content
- **Modern UI**: Clean, responsive design with smooth animations

## Technology Stack

- **React 18** - UI framework
- **React Router** - Navigation
- **Vite** - Build tool and dev server
- **React Icons** - Icon library
- **CSS3** - Styling (no CSS framework, pure CSS)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.jsx      # Main layout with header and sidebar
│   ├── AddNoteModal.jsx
│   ├── AddCorrespondenceModal.jsx
│   ├── ForwardFileModal.jsx
│   ├── ReviewModal.jsx
│   └── *.css           # Component styles
├── pages/              # Page components
│   ├── Dashboard.jsx
│   ├── MyFiles.jsx
│   ├── Inbox.jsx
│   ├── PendingApprovals.jsx
│   ├── SentFiles.jsx
│   ├── AllFiles.jsx
│   ├── FileDetail.jsx  # Main file view with two-pane layout
│   ├── CreateFile.jsx
│   └── *.css           # Page styles
├── data/               # Dummy data
│   └── dummyData.js    # Sample files, notes, correspondence
├── App.jsx             # Main app component with routing
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Demo Data

The application comes with pre-loaded dummy data including:
- 4 sample files with different statuses
- Multiple notes with references
- Correspondence documents
- File movement history
- User and section data

You can explore these files to see how the system works.

## Key Screens

### Dashboard
- Overview statistics
- Recent activity feed
- Quick actions

### File Detail (Main Screen)
- **Left Pane**: File information, movement timeline, quick actions
- **Right Pane**: 
  - **Top**: Noting Side (sequential notes)
  - **Bottom**: Correspondence Side (numbered documents C/1, C/2...)

### File Lists
- My Files
- Inbox
- Pending Approvals
- Sent Files
- All Files

### Modals
- Add Note
- Add Correspondence
- Forward File
- Review & Approve

## Features Demonstrated

1. **Sequential Numbering**: Notes (1, 2, 3...) and Correspondence (C/1, C/2, C/3...)
2. **References**: Clickable references between notes and correspondence
3. **File Movement**: Visual timeline of file movements
4. **Two-Pane Layout**: Maintains physical file structure
5. **Author Positioning**: Author names at appropriate margins (as per physical file)
6. **Status Tracking**: Visual status indicators
7. **Search & Filter**: Filter files by status, section, etc.

## Notes

- This is a **frontend-only demo** with no backend integration
- All data is stored in `src/data/dummyData.js`
- Actions show alerts instead of actually saving data
- File uploads are simulated (no actual upload)
- Perfect for client demonstrations and prototyping

## Customization

### Adding More Dummy Data

Edit `src/data/dummyData.js` to add more files, notes, or correspondence.

### Styling

All styles are in CSS files. The color scheme uses:
- Primary: `#667eea` (purple gradient)
- Success: `#48bb78` (green)
- Warning: `#ed8936` (orange)
- Error: `#f56565` (red)

### Routing

Routes are defined in `src/App.jsx`. Add new routes as needed.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This is a demo/prototype application.

## Contact

For questions or feedback about this demo, please contact the development team.

---

**Note**: This is a demonstration version. For production use, backend integration, authentication, and data persistence would be required.
