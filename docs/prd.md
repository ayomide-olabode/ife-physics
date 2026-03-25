# PRD — Department of Physics Website + Admin Dashboard (Updated Scope)

## Product Overview

- Public-facing website + role-based admin dashboard for the Department of Physics.
- Unless explicitly stated otherwise, all section data is dynamic and fetched from the database.
- Dashboard enables authorized users to create, edit, publish, archive, and manage content by role.

## Core Principles

- SSOT: Public pages render from database records.
- RBAC: Access controlled by roles and scopes.
- Publishing workflow: Draft/Published/Archived where applicable.
- Multi-user collaboration:
  - Multiple users can hold the same role assignment (Editor global; Academic Coordinator scoped).
  - Research Lead is scoped per research group.
- Auditability: Track key edits (who, what, when).

## Roles and Permissions

## SUPER_ADMIN

- Access: full system access.
- Responsibilities:
  - Create/manage users.
  - Assign roles and scopes.
  - Manage leadership transitions (HOD terms).
  - Override, edit, archive, or delete any content.

## EDITOR (Global, multiple allowed)

- Scope: GLOBAL.
- No split between communications and content editors.
- Manages:
  - News (including hero featured flag)
  - Events & Opportunities
  - Spotlight cards
  - Our History timeline
  - Roll of Honour
  - Legacy Gallery
  - Resources

## ACADEMIC_COORDINATOR (Programme + Degree scoped, multiple allowed)

- Scope:
  - `programmeScope`: GENERAL | PHY | EPH | SLT
  - `degreeScope`: GENERAL | UNDERGRADUATE | POSTGRADUATE
- Manages Academics within assigned programme/degree scope:
  - Undergraduate and Postgraduate programme pages (PHY/EPH/SLT)
  - Programme sections:
    - Overview & Prospects
    - Admission Requirements
    - Course Requirements
    - Study Options
    - Curriculum
    - Programme Structure
  - Courses database and mappings:
    - course code, title, description, prerequisites
    - L/T/P/U, Core/Restricted
    - Undergraduate only: year level (Year 1-4)
    - StudyOption ↔ Course mapping
  - Postgraduate requirement accordion blocks:
    - M.Sc., M.Phil., Ph.D. for Admission Requirements and Course Requirements

## RESEARCH_LEAD (Scoped per Research Group; max 2 per group)

- Scope: RESEARCH_GROUP (scopeId = ResearchGroup.id).
- A user can be research lead for multiple groups (multiple scoped assignments).
- Each research group can have up to 2 research leads (enforced in application logic).
- Manages only within assigned groups:
  - Research group page content (overview, focus areas, image)
  - Publications linked to the group
  - Publication featured flag used for homepage featured publications

## STAFF (Self-managed, ownership-based)

- Scope: own records only.
- Manages:
  - Profile content (bio, photo, research interests, room, links)
  - Research outputs
  - Projects
  - Teaching responsibilities
  - Student theses supervised (accordion by year with status)
  - If current HOD: can author/update the HOD address block (title + body)
- States:
  - Visiting faculty: visit start/end; auto-archive after end date
  - Retired: staffStatus = RETIRED
  - Emeritus: staffType = EMERITUS
  - In Memoriam: staffStatus = IN_MEMORIAM

## Public Website Requirements

## Homepage

## Hero (Dynamic)

- Carousel of 4 featured News items.
- Query rule:
  - News where isFeatured = true AND status = PUBLISHED
  - order by date desc
  - limit 4
- Slide fields:
  - image, title, date, short text, link to news post page

## Our Academic Programmes (Hard coded)

- 3 cards: Physics (PHY), Engineering Physics (EPH), Science Laboratory Technology (SLT)
- Each card:
  - image
  - programme name
  - degrees: B.Sc., M.Sc., M.Phil., Ph.D.
- Degree labels link to corresponding degree pages.

## Featured Publications (Dynamic)

- Displays one featured publication from each research group.
- Query rule:
  - For each ResearchGroup, select one Publication where isFeatured = true
- Display fields:
  - title, year, authors (if available), DOI/URL (if available)

## News Updates (Dynamic, Editor-managed)

- Card list of published news posts.
- Card fields:
  - image, date, title, short text, buttonLabel, buttonLink
- News object includes isFeatured boolean used by Hero carousel.

## Events & Opportunities (Dynamic, Editor-managed)

- Card list of event/opportunity entries.
- Card fields:
  - title
  - startDate, endDate (optional)
  - venue (optional)
  - link (optional)
  - deadline (optional)

## In the Spotlight (Dynamic, Editor-managed)

- Spotlight card list (historical spotlight content).
- Card fields:
  - image, date, title, short text

## About Our Department

## Our History (Dynamic, Editor-managed)

- Timeline entries.
- Fields:
  - year, title, short description

## Our Leadership (Dynamic)

- Three sections:
  1. Current HOD
  2. Academic Coordinators
  3. Past HODs

## Current HOD

- Source rule:
  - LeadershipTerm where role = HOD AND endDate IS NULL
- Display:
  - profile image, name, start year
  - address block (title + body) authored by current HOD (Staff)

## Academic Coordinators

- Source rule:
  - LeadershipTerm where role = ACADEMIC_COORDINATOR AND active (endDate NULL or in the future)
- Display:
  - image, name, designation

## Past HODs

- Source rule:
  - LeadershipTerm where role = HOD AND endDate IS NOT NULL
- Display:
  - image, name, start year, end year
- If past HOD has an address on record:
  - clicking card opens modal showing the address

## HOD Transition Rule (SuperAdmin)

- Create a new HOD leadership term for successor.
- Set predecessor endDate.
- Current vs Past HOD sections update automatically from term dates.

## Roll of Honour (Dynamic, Editor-managed)

- Card grid fields:
  - image, name, registration number, programme, CGPA, graduating year

## Legacy Gallery (Dynamic, Editor-managed)

- Card grid fields:
  - media, title, biographical text, dates, year

## Academics (Dynamic, Academic Coordinator-managed)

## Undergraduate

- Tabs: PHY, EPH, SLT
- Each programme page sections:
  - Overview & Prospects
  - Admission Requirements
  - Course Requirements
  - Study Options
  - Curriculum
  - Programme Structure
  - Course Descriptions table

## Course Descriptions Table Fields

- courseCode
- title
- description
- prerequisites
- L, T, P, U
- yearLevel (undergraduate only; 1-4)
- status: Core or Restricted
- studyOptions[] mapping

## Postgraduate

- Tabs: PHY, EPH, SLT
- Same sections as undergraduate.
- Additional rule:
  - Admission Requirements and Course Requirements are accordion blocks per degree:
    - M.Sc., M.Phil., Ph.D.

## Research (Dynamic)

## Research Landing Page

- Two sections:
  - Research Groups grid
  - All Publications list

## Research Groups Grid

- Card fields:
  - name, abbreviation, image
- Each card opens the research group page.

## Research Group Page

- Displays:
  - overview
  - focus areas (managed as an ordered add/remove list of items)
  - members
  - all associated publications
- Homepage Featured Publications are sourced from featured publications in each group.

## People (Dynamic, Staff Self-managed)

## People Categories

- Academic Faculty
- Visiting Faculty
- Emeritus
- Retired Faculty
- Technical Staff
- Support Staff
- In Memoriam

## People Listing Cards

- Faculty (Academic/Visiting/Emeritus/Retired):
  - name, rank, designation, research area, email, profile image
- Technical/Support:
  - name, rank, operational unit, email, profile image

## Staff Profile Pages

- Faculty profile page:
  - name, academic rank, designation
  - research group affiliation
  - optional secondary affiliation
  - profile image
  - academic link
  - institutional email
  - room number
  - tabbed sections:
    - bio
    - education
    - research interests
    - membership of professional organizations
    - research output[] (typed)
    - projects
    - teaching responsibilities
    - student theses (accordion per year, with status)
- Technical/Support modal:
  - name, rank, email, profile image
  - operational unit
  - area of expertise
- In Memoriam page:
  - legacy, contributions, years of service, brief biography

## People Data Source Rule

- All People data comes from staff submissions via their self-managed dashboard.

## Resources (Dynamic, Editor-managed)

- Grid of tools/docs/links:
  - timetable app
  - academic calendar
  - departmental handbook
  - newsletter
  - other links

## Dashboard Modules (Navigation)

## Common (All authenticated staff)

- Profile (self-managed staff profile)

## Editor Module (EDITOR or SUPER_ADMIN)

- News
- Events & Opportunities
- Spotlight
- History Timeline
- Roll of Honour
- Legacy Gallery
- Resources

## Academics Module (ACADEMIC_COORDINATOR or SUPER_ADMIN)

- Programmes (UG/PG per PHY/EPH/SLT)
- Study Options
- Courses
- Requirement Blocks (PG accordions)

## Research Module (RESEARCH_LEAD for any group or SUPER_ADMIN)

- Research Groups (only assigned groups)
- Publications (only within assigned groups)
- Featured publication flags (within assigned groups)

## Admin Module (SUPER_ADMIN only)

- Users
- Role Assignments (global + per research group)
- Leadership Terms (HOD and Academic Coordinator tags)

## Key Business Rules (Non-negotiable)

## Auth Onboarding and Password Reset

- No open public signup.
- Account onboarding is invite-based via expiring email links.
- Token validity:
  - INVITE: 60 minutes
  - PASSWORD_RESET: 30 minutes
- Resend throttling:
  - a new invite/reset email may be sent only after 5 minutes from last send.

## Featured News → Hero Carousel

- Show up to 4 slides.
- Only status = PUBLISHED appears publicly.

## Featured Publication per Research Group

- Display 1 featured publication per group.
- Fallback behavior if none featured:
  - either show none for that group
  - or fallback to latest (implementation decision)

## Research Lead Scoping

- Research leads can only manage groups they are assigned to.
- Max 2 research leads per group (application enforcement).

## Visiting Faculty Auto-Archive

- If visitEndDate < today:
  - do not show in active visiting listing.

## Leadership Rendering

- Current HOD:
  - LeadershipTerm(role=HOD, endDate IS NULL)
- Past HODs:
  - LeadershipTerm(role=HOD, endDate IS NOT NULL)
- Transitions controlled by SuperAdmin by setting dates.

## Non-functional Requirements

- Responsive, mobile-first UI.
- Accessible UI (semantic markup, keyboard support).
- Validation and error handling for dashboard forms.
- Safe operations:
  - soft delete
  - confirmation dialogs for destructive actions
- Audit logging for key updates:
  - role assignments
  - publish/unpublish/archive actions
  - leadership term changes

## Out of Scope (For Now)

- Public user accounts (students/alumni login).
- Payments/donations/membership portals.
- Automated external publication imports.
- Multi-language support.
