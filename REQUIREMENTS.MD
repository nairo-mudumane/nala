# Nala — Business Requirements

**Nala** is a strategic job-application management platform, designed to centralize, organize, and optimize the job-hunting process, eliminating manual effort and guaranteeing full control over every professional interaction.

> This document defines the **what** and the **why** (product context). The technical **how** lives in [AGENTS.MD](AGENTS.MD).

## 1. Value Proposition

- **Context Management:** Immediate access to every detail of each application (job description and the CV version that was sent), making interview preparation easier.
- **Strategic Alignment:** Higher success rates through intelligent adaptation of the résumé to each specific role.
- **Interoperability:** Generation of semantically structured documents, guaranteeing maximum readability by automated screening systems (ATS) and easy downstream editing in word processors.

## 2. Core Features (MVP 1)

### 2.1 Application Management

- Creation of a dedicated record for each role of interest.
- Centralized storage of the job description.
- Consolidated history of communications and notes for each hiring process.

### 2.2 Document Optimization and Generation

- Critical analysis of the role to extract requirements and keywords.
- Generation of optimized résumés, prioritizing relevance to the role while preserving professional integrity.
- Automatic creation of tailored cover letters.
- Document export in formats that preserve the logical hierarchy, guaranteeing universal compatibility.

### 2.3 Preparation Hub

- Quick-reference interface ("Chat") bound to each application.
- Instant retrieval of the process history for pre-interview support.
- Direct comparison between the submitted profile and the role's requirements.

### 2.4 Entry Point (Welcome Page)

- Public welcome page (`/`) presenting the value proposition, with a prominent **"Get started"** call to action leading to the entry page (`/get-started`).
- **A single entry page** (`/get-started`) handles both signing in and creating an account. Sign-in is passwordless, by **emailed link**; social providers (Google, Apple) can be turned on later without a code change, since which methods are offered is Clerk configuration rather than application logic.

## 3. Internationalization

- The interface ships **in English only** for now.
- A **language switcher** is planned, with support for **English** and **Portuguese**. All user-facing copy should therefore be written with future extraction to translation files in mind (no strings buried in logic).

## 4. Quality and Output Standards

- **ATS Compatibility:** Documents optimized for reading by any screening AI, with no structural errors.
- **Editability:** Clean, hierarchical layout, allowing direct conversion to editing formats (.docx) without loss of formatting or use of complex elements (text boxes / floating tables).
