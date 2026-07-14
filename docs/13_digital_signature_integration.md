# 13 — Digital Signature (DSC / USB token) Integration — Design Note

> **Status: design only (2026‑07‑14).** No code yet — this documents *how* to add hardware
> Digital Signature Certificate (DSC) signing to the note‑centric e‑Office. Scope decided with the
> client owner: **hardware DSC tokens only** (the "pendrives"), signing **both** a per‑note
> cryptographic hash (CMS) **and** a PAdES‑signed noting PDF (the legal artifact).
>
> ⚠️ The DSC path **cannot be fully built or tested from this workstation** — it needs a physical
> token, the issuing CA's trust chain, and a per‑PC signing utility. This note is the blueprint;
> a small pilot with 1–2 real tokens is required before rollout.

---

## 1. What the client wants

Each officer holds a **Class‑3 DSC on a USB crypto token** (ePass2003 / ProxKey / mToken /
SafeNet, etc.), issued by a CCA‑India‑licensed CA (eMudhra, Sify, Capricorn, (n)Code, C‑DAC…).
The private key is generated on and **never leaves** the token. They want to **sign notes with it**
instead of the current typed‑name signature.

Legally this matters: under the **IT Act, 2000**, a DSC‑signed document carries the same standing
as a wet‑ink signature. For an e‑Office, the **signed noting sheet** is the artifact of record.

---

## 2. The core constraint (why a browser can't read the token)

Browsers dropped direct smart‑card access years ago (no NPAPI, no Java applets). JavaScript has
**no access to a PKCS#11 device**. So every Indian e‑Office / e‑tender / GST / MCA portal uses the
same pattern: a **local signing utility** installed on each PC bridges the browser and the token.

```
 Browser (our app)          Local signer utility            USB DSC token
                            (localhost service / browser     (private key,
                             extension + native host,        non‑exportable)
     │  1. payload to sign    PKCS#11 / Windows CNG)              │
     ├────────────────────────────▶  2. user picks their cert    │
     │                               & enters TOKEN PIN ─────────▶│ 3. token computes signature
     │  4. PKCS#7 (CMS) / signed PDF ◀────────────────────────────┤    over the hash (on‑device)
     ◀────────────────────────────
     │  5. POST signature → our backend
     ▼
 Backend  6. VERIFY (chain → trusted CA root, revocation, identity, hash) → store → advance step
```

**Non‑negotiable security boundary:** our system **never** sees or collects the **token PIN or
private key**. The PIN is entered into the vendor's trusted local utility only. Our app hands over
a **hash or a PDF** and receives back a **signature**. We are a *relying party*, not a key holder.
(We will never add a PIN field, never store a private key, never proxy the PIN.)

---

## 3. What gets signed (both levels, per the decision)

| Level | What | Why | Output |
|---|---|---|---|
| **A. Per‑note CMS** | A canonical **hash** of the note (content + references + chain‑so‑far + signer + timestamp) | Drives the live on‑screen "digitally signed by …" trail on each `NoteStep` | Detached **PKCS#7 / CMS** blob |
| **B. Signed noting PDF (PAdES)** | The rendered **noting sheet PDF** for the note/file at that step | The exportable, **Adobe‑verifiable** legal artifact auditors expect | **PAdES**‑signed PDF (embedded PKCS#7) |

Canonical payload for (A) must be **deterministic and immutable** — e.g. a UTF‑8 JSON of
`{fileUN, noteNumber, contentSha256, references, priorStepsDigest, signerUserId, roleLabel}` →
SHA‑256. Store the exact bytes hashed so verification is reproducible.

---

## 4. PAdES PDF flow (level B) — the "prepare → sign → embed" dance

The token can't sign a server‑side PDF directly (key is on the user's device), so:

1. **Server** renders the noting PDF (reuse `print.service.ts`) and inserts a **signature
   placeholder**: an empty `/Contents` field + a `/ByteRange`. Libraries: `pdf-lib` +
   `@signpdf/placeholder-pdf-lib`.
2. **Server** computes the hash over the ByteRange and returns it (with the prepared PDF) to the browser.
3. **Browser → local utility** signs (a) the ByteRange hash → **CAdES/PKCS#7 detached**.
4. **Browser → server** posts the signature; **server embeds** it into `/Contents`
   (`@signpdf/signpdf`), producing the final signed PDF.
5. For long‑term validity (**PAdES‑LTV / ‑LTA**): add a **DSS** with the cert chain + OCSP/CRL and a
   **document timestamp** from an RFC‑3161 **TSA**. (Optional but recommended for legal retention.)

Some signing utilities can sign a whole PDF in one call (they do the placeholder+embed themselves);
if so, prefer that and skip steps 1/4. **Confirm against the chosen vendor's API.**

---

## 5. Backend verification (the part that gives it legal weight)

On every submitted signature the backend MUST, before accepting the step:

1. **Parse** the PKCS#7 (`pkijs`/`@peculiar/x509`, or `node-forge`).
2. **Chain**: validate the signer cert up to a **trusted root** (CCA India Root + the issuing CA's
   intermediate) held in our server trust store.
3. **Validity window**: cert not expired **at signing time** (use the TSA time if present).
4. **Revocation**: check **CRL** (distribution point in the cert) and/or **OCSP**. Cache sensibly.
5. **Identity binding (critical):** the cert's subject must map to the **logged‑in officer** — so
   Rasika cannot sign with Ravi's token. Do this via **enrollment** (see §6), not name‑guessing.
6. **Hash match**: the CMS message digest equals the hash we asked them to sign (level A) or the
   PDF ByteRange (level B) — proves *this* content was signed.
7. **Store** `verifyStatus` (VALID | INVALID | REVOKED | UNTRUSTED | EXPIRED_AT_SIGNING) + details.

Only a **VALID** verification advances the note step; anything else is rejected with a clear reason.

---

## 6. Enrollment — binding a token to an officer

To make identity binding robust, register each officer's DSC **public certificate once**:

- A one‑time "Register my DSC" action: the local utility returns the user's **public cert**; the
  server stores its **serial + issuer + subject (thumbprint)** against the `User`.
- At signing, the presented cert's thumbprint must match the enrolled one. (Re‑enrol on renewal.)
- Admin can view/revoke enrolments (fits the existing Super Admin user‑management screen).

This is stronger than matching cert CN to a name and prevents cross‑signing and stolen‑token misuse
of the *wrong* account.

---

## 7. Data‑model changes

Keep the existing `NoteStep.signatureName` (display name; for DSC = cert CN). Add a dedicated
**`Signature`** model so one step can carry a typed *or* DSC signature, and files/notes can hold a
signed‑PDF artifact:

```prisma
model Signature {
  id             String   @id @default(uuid())
  noteStepId     String?          // the signed step (level A)
  noteId         String?          // or a note‑level signed PDF (level B)
  fileId         String
  signerUserId   String
  type           String           // TYPED | DSC_CMS | DSC_PDF
  // DSC fields
  pkcs7          Bytes?           // detached CMS / embedded signature
  signedHashAlg  String?          // e.g. SHA-256
  signedHash     String?          // hex of what was signed (reproducible)
  certSerial     String?
  certSubjectCN  String?
  certIssuerCN   String?
  certNotBefore  DateTime?
  certNotAfter   DateTime?
  certPem        String?          // signer public cert (audit)
  tsaTime        DateTime?        // RFC‑3161 timestamp, if used
  signedPdfKey   String?          // storage key of the PAdES PDF (level B)
  verifyStatus   String           // VALID | INVALID | REVOKED | UNTRUSTED | EXPIRED_AT_SIGNING
  verifyDetail   String?
  signedAt       DateTime @default(now())
}
```

Add to `User`: `dscCertSerial`, `dscCertThumbprint`, `dscEnrolledAt` (enrollment, §6).

---

## 8. Where it plugs into the current engine

- **`workflow.service.ts › signNote`** gains a DSC path. Split into:
  - `GET /files/:id/sign/prepare` → returns the canonical **hash** (level A) and/or a **prepared
    placeholder PDF + ByteRange hash** (level B).
  - `POST /files/:id/sign` accepts `{ signatureType: 'dsc', pkcs7, certPem, … }`. Backend **verifies
    (§5)**, embeds PDF if level B, writes a `Signature`, then runs the **existing** step‑advance /
    finalize logic unchanged.
- **`print.service.ts`** already renders the per‑note signatory block — extend it to show
  "🔏 Digitally signed by **CN**, serial …, verified ✓" and to offer the **signed PDF** download.
- **Frontend** `ReviewModal` gains a **"Sign with DSC"** button beside the typed sign; it calls a
  small **`dscSigner`** wrapper around the chosen utility's JS API and posts the result.

### Pluggable provider abstraction (recommended shape)
Introduce a `SignatureProvider` interface so today's behaviour is one provider and DSC is another:
`typed` (current, no change) and `dsc` (CMS + PAdES). This lets us ship the plumbing + verification
with a **mock/test‑CA provider** now and swap in the real utility per §9 without touching the engine.

---

## 9. The local signing utility — options

Pick **one** and standardise it across all PCs (this is the biggest rollout decision):

| Utility | Notes |
|---|---|
| **Signer.Digital** (Chartered Information) | Browser **extension + native host**; clean JS promises (`getSelectedCertificate`, `signHash`, `signPdf`, `signXml`). Popular, well‑documented. Strong candidate. |
| **emSigner / emBridge** (eMudhra) | Local service on a localhost port; used by GST/MCA/Income‑Tax portals. |
| **ProxKey web signer** | Ships with ProxKey tokens. |
| **(n)Code / C‑DAC signer** | Government‑oriented options. |

All produce **PKCS#7/CMS** and can sign PDFs. **We must target the exact JS API of whichever is
chosen** — the method names above are indicative; verify against that vendor's current docs.

---

## 10. Rollout reality (this is IT + procurement, not just code)

Per **PC**: token **drivers** installed · issuing **CA root trusted** · the chosen **signing
utility** (and browser extension) installed & running · localhost TLS cert of the utility trusted.
**Server/app:** served over **HTTPS** (staging already is, via Caddy) · a **trust store** of CA
roots/intermediates · optional **TSA** endpoint · storage for PKCS#7 + signed PDFs · CRL/OCSP egress.

---

## 11. Testing strategy (no hardware here)

- **Mock provider + test CA:** a dev‑only signer that mints a test cert and signs, so the whole
  path (prepare → sign → verify → store → embed) is unit/integration‑testable without a token.
- **Golden vectors:** store a known signed sample and assert verification VALID/REVOKED/EXPIRED.
- **Pilot:** validate end‑to‑end with **1–2 real tokens** + the actual CA before any wider rollout.

---

## 12. Phased plan (when we build)

- **A — Foundation (buildable now, no hardware):** `Signature` model + `User` enrolment fields +
  `SignatureProvider` abstraction (typed = current behaviour) + verification library wired to a
  **test CA** + mock signer + tests.
- **B — DSC per‑note (CMS):** integrate the chosen utility on "Sign with DSC"; identity binding;
  store + display verified signature in the chain and print.
- **C — Signed PDF (PAdES):** placeholder→sign→embed; signed‑PDF export; optional LTV (DSS + TSA).
- **D — Pilot & hardening:** real tokens; OCSP/CRL; audit; enrolment admin UI; rollout runbook.

---

## 13. Open questions for the client (needed before Phase B)

1. **Which CA** issued the DSCs, and **which token model**? (Determines trust store + drivers.)
2. Is a **signing utility already standardised/deployed** on their PCs (emSigner? Signer.Digital?),
   or do we choose one? (Determines the JS API we target.)
3. Do they need **timestamping / long‑term validity (TSA, PAdES‑LTV)** for retention, or is a plain
   signed PDF enough for now?
4. **Revocation checking** appetite — OCSP/CRL online at sign time (needs egress), or periodic?
5. Who runs **enrolment** (registering each officer's DSC), and the **retention** policy for signed PDFs?
6. Any **offline / air‑gapped** verification requirement?

---

## 14. What we will explicitly NOT do (security)

- Never collect or transmit the **token PIN**. Never store or handle a **private key**.
- Never build a homegrown PKCS#11/PIN‑prompt in our web page — always delegate to the vetted local
  utility. Our system is a **relying party** that verifies and records signatures only.
