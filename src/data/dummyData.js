// Dummy data for demonstration

export const currentUser = {
  id: 'user1',
  name: 'Rajesh Kumar',
  designation: 'Section Officer',
  section: 'Administration',
  email: 'rajesh.kumar@example.com'
}

export const sections = [
  'Administration',
  'Accounts',
  'Legal',
  'Audit',
  'Finance',
  'Engineering'
]

export const users = [
  { id: 'user1', name: 'Rajesh Kumar', designation: 'Section Officer', section: 'Administration' },
  { id: 'user2', name: 'Priya Sharma', designation: 'Deputy Director', section: 'Administration' },
  { id: 'user3', name: 'Amit Patel', designation: 'Director', section: 'Administration' },
  { id: 'user4', name: 'Sneha Reddy', designation: 'Accountant', section: 'Accounts' },
  { id: 'user5', name: 'Vikram Singh', designation: 'Legal Advisor', section: 'Legal' },
  { id: 'user6', name: 'Anjali Mehta', designation: 'Audit Officer', section: 'Audit' }
]

export const files = [
  {
    id: 'file1',
    fileNumber: 'ADMIN/2024/001',
    subject: 'Purchase of Office Equipment - AMC Renewal',
    section: 'Administration',
    status: 'Under Review',
    priority: 'Normal',
    createdBy: 'user1',
    createdDate: '2024-01-15',
    lastModified: '2024-01-20',
    currentAssignee: 'user2',
    confidential: false,
    startPeriod: '2024-01-01',
    endPeriod: null,
    notes: [
      {
        id: 'note1',
        noteNumber: 1,
        content: `Subject: Purchase of Office Equipment - AMC Renewal

Background:
The annual maintenance contract (AMC) for office equipment including printers, scanners, and photocopiers is due for renewal on 31st January 2024. The current vendor has submitted a quotation for the renewal.

Reference: Quotation at C/1

Proposal:
1. Approve the AMC renewal for office equipment as per quotation C/1
2. Authorize payment of ₹2,50,000/- for the annual maintenance contract
3. Forward to Accounts Section for payment processing

Draft Order:
The AMC for office equipment is hereby renewed for the period 01.02.2024 to 31.01.2025 as per terms and conditions mentioned in the quotation.`,
        author: {
          id: 'user1',
          name: 'Rajesh Kumar',
          designation: 'Section Officer'
        },
        date: '2024-01-15T10:30:00',
        status: 'Submitted',
        references: {
          correspondence: ['C/1'],
          notes: []
        },
        approvals: []
      },
      {
        id: 'note2',
        noteNumber: 2,
        content: `Reviewed the proposal. The quotation appears reasonable compared to market rates.

However, I suggest:
1. Verify if any additional equipment has been added during the year
2. Confirm warranty terms for new equipment

Please refer to the inventory list at C/2 for verification.

Recommendation: Approve after verification.`,
        author: {
          id: 'user2',
          name: 'Priya Sharma',
          designation: 'Deputy Director'
        },
        date: '2024-01-18T14:20:00',
        status: 'Approved',
        references: {
          correspondence: ['C/2'],
          notes: ['Note 1']
        },
        approvals: [
          { paragraph: 'A', approvedBy: 'user2', date: '2024-01-18T14:20:00' }
        ]
      }
    ],
    correspondence: [
      {
        id: 'corr1',
        number: 'C/1',
        type: 'Quotation',
        title: 'AMC Quotation for Office Equipment',
        inwardDate: '2024-01-10',
        inwardNumber: 'IN/2024/045',
        uploadedBy: 'user1',
        uploadDate: '2024-01-15T09:00:00',
        fileUrl: '#',
        referencedIn: ['Note 1']
      },
      {
        id: 'corr2',
        number: 'C/2',
        type: 'Report',
        title: 'Office Equipment Inventory List',
        inwardDate: '2024-01-17',
        inwardNumber: 'IN/2024/052',
        uploadedBy: 'user1',
        uploadDate: '2024-01-17T11:00:00',
        fileUrl: '#',
        referencedIn: ['Note 2']
      }
    ],
    movements: [
      {
        id: 'mov1',
        from: { id: 'user1', name: 'Rajesh Kumar', section: 'Administration' },
        to: { id: 'user2', name: 'Priya Sharma', section: 'Administration' },
        date: '2024-01-15T10:35:00',
        action: 'Forwarded',
        remarks: 'For review and approval'
      },
      {
        id: 'mov2',
        from: { id: 'user2', name: 'Priya Sharma', section: 'Administration' },
        to: { id: 'user3', name: 'Amit Patel', section: 'Administration' },
        date: '2024-01-18T14:25:00',
        action: 'Forwarded',
        remarks: 'For final approval'
      }
    ]
  },
  {
    id: 'file2',
    fileNumber: 'ADMIN/2024/002',
    subject: 'Compliance with Audit Observations',
    section: 'Administration',
    status: 'Open',
    priority: 'Urgent',
    createdBy: 'user1',
    createdDate: '2024-01-12',
    lastModified: '2024-01-19',
    currentAssignee: 'user1',
    confidential: false,
    startPeriod: '2024-01-01',
    endPeriod: null,
    notes: [
      {
        id: 'note3',
        noteNumber: 1,
        content: `Subject: Compliance with Audit Observations

Background:
The audit team has raised certain observations regarding procurement procedures. We need to address these observations and submit a compliance report.

Reference: Audit Report at C/1

Proposal:
1. Review all audit observations
2. Prepare action plan for compliance
3. Submit compliance report within 30 days`,
        author: {
          id: 'user1',
          name: 'Rajesh Kumar',
          designation: 'Section Officer'
        },
        date: '2024-01-12T09:15:00',
        status: 'Submitted',
        references: {
          correspondence: ['C/1'],
          notes: []
        },
        approvals: []
      }
    ],
    correspondence: [
      {
        id: 'corr3',
        number: 'C/1',
        type: 'Report',
        title: 'Audit Report - Procurement Procedures',
        inwardDate: '2024-01-10',
        inwardNumber: 'AUDIT/2024/012',
        uploadedBy: 'user1',
        uploadDate: '2024-01-12T09:00:00',
        fileUrl: '#',
        referencedIn: ['Note 1']
      }
    ],
    movements: []
  },
  {
    id: 'file3',
    fileNumber: 'LEGAL/2024/001',
    subject: 'Court Order - Stay on Land Acquisition',
    section: 'Legal',
    status: 'Approved',
    priority: 'Urgent',
    createdBy: 'user5',
    createdDate: '2024-01-08',
    lastModified: '2024-01-16',
    currentAssignee: null,
    confidential: true,
    startPeriod: '2024-01-01',
    endPeriod: null,
    notes: [
      {
        id: 'note4',
        noteNumber: 1,
        content: `Subject: Court Order - Stay on Land Acquisition

A stay order has been received from the High Court regarding the land acquisition process. Immediate action required.

Reference: Court Order at C/1

Proposal:
1. Comply with court order
2. Suspend all land acquisition activities
3. Prepare response for legal department`,
        author: {
          id: 'user5',
          name: 'Vikram Singh',
          designation: 'Legal Advisor'
        },
        date: '2024-01-08T11:00:00',
        status: 'Approved',
        references: {
          correspondence: ['C/1'],
          notes: []
        },
        approvals: []
      }
    ],
    correspondence: [
      {
        id: 'corr4',
        number: 'C/1',
        type: 'Court Order',
        title: 'High Court Stay Order - Land Acquisition',
        inwardDate: '2024-01-08',
        inwardNumber: 'COURT/2024/003',
        uploadedBy: 'user5',
        uploadDate: '2024-01-08T10:30:00',
        fileUrl: '#',
        referencedIn: ['Note 1']
      }
    ],
    movements: []
  },
  {
    id: 'file4',
    fileNumber: 'ACCOUNTS/2024/015',
    subject: 'Payment Voucher - Contractor Bill',
    section: 'Accounts',
    status: 'Under Review',
    priority: 'Normal',
    createdBy: 'user4',
    createdDate: '2024-01-19',
    lastModified: '2024-01-20',
    currentAssignee: 'user2',
    confidential: false,
    startPeriod: '2024-01-01',
    endPeriod: null,
    notes: [
      {
        id: 'note5',
        noteNumber: 1,
        content: `Subject: Payment Voucher - Contractor Bill

Bill received from contractor for construction work completed in December 2023.

Reference: Bill at C/1, Work Order at C/2

Proposal:
Approve payment of ₹5,75,000/- as per bill C/1`,
        author: {
          id: 'user4',
          name: 'Sneha Reddy',
          designation: 'Accountant'
        },
        date: '2024-01-19T10:00:00',
        status: 'Submitted',
        references: {
          correspondence: ['C/1', 'C/2'],
          notes: []
        },
        approvals: []
      }
    ],
    correspondence: [
      {
        id: 'corr5',
        number: 'C/1',
        type: 'Bill',
        title: 'Contractor Bill - December 2023',
        inwardDate: '2024-01-18',
        inwardNumber: 'IN/2024/055',
        uploadedBy: 'user4',
        uploadDate: '2024-01-19T09:30:00',
        fileUrl: '#',
        referencedIn: ['Note 1']
      },
      {
        id: 'corr6',
        number: 'C/2',
        type: 'Order',
        title: 'Work Order - Construction Work',
        inwardDate: '2023-11-15',
        inwardNumber: 'WO/2023/089',
        uploadedBy: 'user4',
        uploadDate: '2024-01-19T09:35:00',
        fileUrl: '#',
        referencedIn: ['Note 1']
      }
    ],
    movements: [
      {
        id: 'mov3',
        from: { id: 'user4', name: 'Sneha Reddy', section: 'Accounts' },
        to: { id: 'user2', name: 'Priya Sharma', section: 'Administration' },
        date: '2024-01-19T10:05:00',
        action: 'Forwarded',
        remarks: 'For approval'
      }
    ]
  }
]

export const getFileById = (fileId) => {
  return files.find(f => f.id === fileId)
}

export const getFilesByStatus = (status) => {
  return files.filter(f => f.status === status)
}

export const getFilesByAssignee = (userId) => {
  return files.filter(f => f.currentAssignee === userId)
}

export const getFilesByCreator = (userId) => {
  return files.filter(f => f.createdBy === userId)
}
