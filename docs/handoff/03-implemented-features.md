# 03 — Implemented Features (API + Screens)

All endpoints are under `/api/v1` and (except `login`/`register`) require `Authorization: Bearer <jwt>`. File-scoped routes (`/files/:id/...`) additionally pass a **confidential-access gate**.

## Backend API reference

### Auth — `/auth`
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/register` | Create a user (open in dev; lock to ADMIN later) |
| POST | `/auth/login` | Email+password → `{ token, user }` |
| GET | `/auth/me` | Current user from the token |

### Users — `/users`
| GET | `/users` | List active users (recipient/reviewer picker); `?section=` filter |

### Files (collection) — `/files`
| GET | `/files` | List with filters: `section, un, status, search, mine, holder, pending, sent`. Confidential files filtered out for non-involved users. |
| GET | `/files/stats` | Dashboard KPIs (`inboxCount, filesCreated, pendingMyAction, awaitingApproval`) + recent activity |
| POST | `/files` | Create a **DRAFT** (holder = creator); optional `initialNote`, `customFileNumber` |
| GET | `/files/:id` | Full detail: cover + notes (+refs/approvals/comments) + correspondence + movements + steps |
| POST | `/files/:id/submit` | Assign `DEPT/YEAR/SEQ` number, move DRAFT→SUBMITTED |

### Noting & correspondence — `/files/:id/...`
| POST | `/files/:id/notes` | Add next note (holder-only). Body: `content, isDraft?, isSuoMoto?, references{correspondence[],notes[]}` |
| POST | `/files/:id/correspondence` | Multipart upload: **PDF only**, or an `emailReference`. Auto `C/n`. |
| GET | `/files/:id/correspondence/:corrId/file` | Stream the stored PDF (inline) |

### Workflow — `/files/:id/...`
| POST | `/files/:id/forward` | Route DRAFT/SUBMITTED/REVERTED into the chain. Body: `recipients:[{userId,role}], remarks`. Assigns number if needed; resubmit reactivates reverted steps. |
| POST | `/files/:id/action` | Act on the current step. Body: `action: check\|approve\|revert\|reject\|clarify, remarks?, dept?, signatureName?, paragraphs?[]`. Holder+assignee enforced. |
| POST | `/files/:id/steps` | Add a reviewer mid-flow (appended PENDING); re-establishes the holder if needed |
| DELETE | `/files/:id/steps/:stepId` | Remove a pending, non-active reviewer step |

### Approvals extras — `/files/:id/...`
| POST | `/files/:id/md-approval` | Multipart PDF: MD offline-scan approval; approves the current step, stores the scan as correspondence. Involved-user only. |
| POST | `/files/:id/notes/:noteId/comments` | Comment-after-approval (append-only). Blocked on CLOSED files. |

### Lifecycle — `/files/:id/...`
| POST | `/files/:id/route` | APPROVED→ROUTED to an actionable user. Holder/maker/admin only. |
| POST | `/files/:id/return` | ROUTED→RETURNED to the originator. Current holder/admin only. |
| POST | `/files/:id/transfer` | Permanent cross-dept transfer (section changes, **number unchanged**). Holder/maker/admin. |
| POST | `/files/:id/close` | →CLOSED (date+reason, read-only). Holder/maker/admin. |

### Print — `/files/:id/...`
| GET | `/files/:id/print?side=noting\|correspondence` | Self-contained printable HTML (header/footer, confidential watermark, approval-summary table) |

### Reports — `/reports`
| GET | `/reports` | Audit log rows + summary; filters `section, from, to, search` |
| GET | `/reports/export` | CSV of the filtered log (formula-injection-safe) |

## Frontend screens (all live against the API)

| Route / component | Purpose |
|-------------------|---------|
| `Login` | Email/password + quick-login buttons (demo users) |
| `Dashboard` (`/`) | KPI cards + recent-activity feed |
| `MyFiles` (`/my-files`) | Files you created; search/status/sort (last-used/created/number) |
| `Inbox` (`/inbox`) | Files you currently hold; **Inward/Outward** badges |
| `PendingApprovals` (`/pending-approvals`) | Files with a PENDING step assigned to you (real per-approver queue) |
| `SentFiles` (`/sent-files`) | Files you created that have been forwarded |
| `AllFiles` (`/all-files`) | Global registry; section + UN-number filters (confidential hidden if not involved) |
| `CreateFile` (`/create-file`) | Open a file (auto-number on submit; optional custom label) |
| `FileDetail` (`/file/:id`) | The core screen — two-pane Noting/Correspondence, clickable `C/n`/`Note n` refs, **Approval Flow** panel, and all actions (Add Note, Add Correspondence, Forward/Add-Reviewer, Review & Approve, MD Offline Approval, Print Noting/Correspondence, Route, Return, Transfer, Close, per-note Comment) |
| `Reports` (`/reports`) | Live audit log + summary cards + CSV export |
| Modals | `AddNoteModal`, `AddCorrespondenceModal`, `ForwardFileModal` (adaptive: forward vs add-reviewer), `ReviewModal` (actions + paragraph approval + signature), `ActionModal` (generic: route/return/transfer/close/MD) |

## SOW / decisions coverage (what maps to what)

- **Auto DEPT/YEAR/SEQ + UUID + optional custom** → `services/numbering.ts`, create/submit.
- **Maker-Checker-Approver, sequential, add reviewer** → `workflow` module + `WorkflowStep`.
- **Check/Approve/Revert (+variants), date/dept/signature stamp** → `actOnFile`.
- **Inward/Outward inbox (D7 = routed-to-you / reverted)** → `inboxType` in file DTO + Inbox screen.
- **Two-page preview + C/n linking** → `FileDetail` (kept from prototype, now live data).
- **MD offline scan, paragraph approval, comment-after-approval** → `approvals` module.
- **Print with approval summary + header/footer + watermark** → `print` module.
- **Post-approval routing + return** → `lifecycle` route/return.
- **Closure + successor, cross-dept transfer, suo-moto, confidential** → `lifecycle` + `File` fields + access gate.
- **Reports + export** → `reports` module.
- **Login + RBAC** → `auth` module + `AuthContext` + confidential gating.

Deferred (Phase 2) and dropped items: see [`05-next-steps.md`](05-next-steps.md) and `docs/08_requirements_decisions.md`.
