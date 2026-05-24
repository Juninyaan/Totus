# Fithub Developer Guide

## 1. Product Overview

Fithub is a fitness marketplace and operations platform built around one central idea: put members, trainers, gyms, and platform admins inside the same system so discovery, booking, access management, progress tracking, and venue operations happen in one workflow.

At a product level, the site combines four concepts:

1. A discovery platform for gyms, personal trainers, and group fitness programs.
2. A booking and access platform for training sessions, memberships, day passes, and event-style programs.
3. A lightweight member progress workspace for meal adherence, body measurements, notifications, and booking history.
4. An operator workspace for trainers, gym owners, and admins to manage services, sessions, members, and approvals.

The current implementation is an MVP foundation. It already contains working flows for authentication, service discovery, bookings, group fitness enrollment, ratings, notifications, subscriptions, progress tracking, and admin moderation. A few modules, such as ads and rewards, are still scaffold placeholders rather than full business features.

## 2. Product Aim

The main aim of Fithub is to reduce fragmentation in the local fitness ecosystem.

In many fitness businesses, the experience is split across social media, messaging apps, spreadsheets, and manual follow-up. Fithub tries to centralize that into a single product with these goals:

- Help members discover trainers, gyms, and programs quickly.
- Let members book sessions or access plans without needing separate manual coordination.
- Give trainers a workspace to present services, manage clients, and track simple progress data.
- Give gym owners a workspace to publish venue access offers, manage requests, and maintain storefront-style listings.
- Give admins oversight of users, trainers, shops, and bookings.
- Add retention tools such as notifications, reminders, subscriptions, and ratings.

In short, the platform is not only a fitness directory. It is designed as a fitness operations hub.

## 3. Target User Roles

The system supports these role combinations:

- `user`: base authenticated identity.
- `member`: consumer who books sessions, joins programs, tracks meals and measurements, and receives notifications.
- `trainer`: coach profile owner who can publish training services and manage assigned sessions.
- `shop`: venue operator role used for gym and access-plan ownership.
- `gym_owner`: higher-level venue owner registration path that also creates a shop record.
- `admin`: platform moderator with global visibility and control.

Registration behavior:

- A normal member gets roles `user` and `member`.
- A trainer gets `user`, `member`, and `trainer`, and a trainer profile is created automatically.
- A gym owner gets `user`, `member`, `shop`, and `gym_owner`, and a shop record is created automatically.

## 4. High-Level Architecture

### Frontend

- Framework: Next.js App Router.
- Main UI implementation: one large client-side workspace component that switches between home, auth, discover, manage, and admin modes.
- API access: direct `fetch` wrapper in `frontend/src/lib/api.ts` using `NEXT_PUBLIC_API_URL`.
- Styling: Tailwind CSS with custom design tokens and a sports-brand visual style.

### Backend

- Framework: Express.
- Database: MongoDB via Mongoose.
- Auth: JWT bearer tokens.
- Structure: feature-based modules under `backend/src/modules`.
- Validation: custom request validation middleware.

### Runtime split

- `frontend/` serves the user-facing web application.
- `backend/` exposes `/api/...` endpoints for auth, discovery, booking, progress tracking, moderation, and related workflows.

## 5. Main Frontend Sections

The frontend is organized around a unified workspace pattern instead of many isolated dashboards.

### Home

Home serves two different purposes depending on authentication state.

- For guests, it acts as the landing page and value proposition screen.
- For signed-in users, it becomes a personalized dashboard.

Important behavior:

- Guests see the platform summary and entry points to login and registration.
- Signed-in users see a role-aware home dashboard.
- Users who can operate in multiple roles, such as trainer plus gym owner, can toggle the Home view between member, trainer, and gym-owner perspectives.

### Discover

Discover is the marketplace surface.

Views include:

- Gym discovery.
- Personal trainer discovery.
- Group fitness program discovery.
- A discovery overview page that links to all major discovery categories.

This area is meant to answer: what can I do, where can I train, who can coach me, and what programs are open now?

### Manage

Manage is the operational workspace for authenticated users.

Depending on role, it exposes:

- Member tools.
- Trainer tools.
- Gym owner / shop tools.

This is where the product stops being a discovery site and becomes a day-to-day workflow tool.

### Admin

Admin is a restricted moderation and platform oversight surface.

It shows:

- Aggregate platform counts.
- User activation and deactivation tools.
- Trainer moderation tools.
- Shop verification controls.
- Booking status controls.

### Meal Plans

There is also a dedicated meal-plans route. In the current implementation, this page is mostly a structured meal-plan presentation layer with adherence tracking support from the backend. The meal plans themselves are currently static examples, while user adherence is persisted through the meal progress module.

## 6. Main Functional Areas

### 6.1 Authentication and Account Setup

Users can:

- Register.
- Log in.
- Retrieve their current authenticated identity.

Registration also acts as business onboarding:

- Trainer registration creates a trainer profile automatically.
- Gym owner registration creates an initial shop automatically.

This means onboarding is not only about identity creation. It also provisions the first domain record needed for the role.

### 6.2 Member Experience

Members can:

- Browse trainers, venues, and group programs.
- Book services.
- View booking history.
- Track meal adherence.
- Log body measurements.
- Receive notifications.
- View subscriptions and access windows.
- Rate trainers, shops, and services if they have paid access.
- Join group fitness programs.
- Join a waitlist if a program is full.
- Set intention to attend the next group class.

The member side of the product is designed to combine booking plus accountability, not just checkout.

### 6.3 Trainer Experience

Trainers can:

- Maintain a trainer profile.
- Publish and edit services.
- Define specialties, experience, availability, portfolio details, and biography.
- See sessions assigned to them.
- Manage bookings they host.
- Record attendance for sessions and group programs.
- Enter or review body measurements for eligible users.
- Participate in group fitness program management if assigned.

The trainer workflow is built around service publishing plus member follow-through.

### 6.4 Gym Owner / Shop Experience

Gym owners can:

- Maintain a shop profile.
- Publish products.
- Publish venue offers such as memberships, passes, classes, or event access.
- Manage booking requests tied to their shop.
- View active and expiring subscriptions for their venue.
- Operate group fitness programs linked to their venue offers.

The shop model functions as both a business profile and a venue commerce record.

### 6.5 Group Fitness Program Management

This is one of the stronger product concepts in the codebase.

The group fitness module supports:

- Discovery of active teams and programs.
- Program creation by trainers, gym owners, or admins.
- Linking a group program to a bookable service.
- Program activation by members, which creates a booking record.
- Member enrollment and removal.
- Attendance logging.
- Intention tracking for next class planning.
- Measurement logging for cohorts.
- A dashboard with attendance and weight-loss leaderboard summaries.
- A waitlist for full programs.

The code also seeds sample group fitness teams and programs when the collection is empty, so the discovery surface remains populated in early-stage environments.

### 6.6 Booking and Access Lifecycle

Bookings are not treated as simple calendar entries. They are the core transaction record in the system.

Supported booking behaviors:

- Creation of training or venue bookings.
- Acceptance, completion, and cancellation.
- Attendance marking.
- Payment tracking.
- Reschedule requests and counter-proposals.
- Automatic subscription creation for access-oriented services.

Important design point:

Some services are treated as access products rather than one-off appointments. The backend detects this from service text using keywords such as membership, monthly, pass, access, entry, day pass, event, race, challenge, and similar terms.

When a service is identified as one of these types, the system can derive:

- Whether it is a membership, day entry, or event access.
- The access start and end window.
- Whether a subscription record should exist for the booking.

This is how Fithub supports both appointment-style bookings and gym-access commerce using the same service and booking system.

### 6.7 Notifications and Reminders

Notifications are event-driven and reminder-driven.

They are created for events such as:

- Booking accepted.
- Booking cancelled.
- Booking completed.
- Attendance marked.
- Payment due.
- Payment received.
- Reschedule requested.
- Reschedule countered.
- Reschedule approved.
- Reschedule declined.
- Subscription expiring.
- Subscription expired.
- Upcoming accepted booking reminder.

Notification generation happens both during business events and lazily when listing notifications or subscriptions.

### 6.8 Ratings and Trust

Ratings are supported for:

- Trainers.
- Shops.
- Services.

Ratings are intentionally gated. A user must have real paid engagement before rating:

- Service rating requires a paid booking for that service.
- Trainer rating requires a paid booking with that trainer.
- Shop rating requires either an active or expired subscription at that shop, or a paid booking there.

This prevents low-trust anonymous ratings.

### 6.9 Admin Oversight

Admins can:

- See platform metrics.
- View recent users, recent bookings, and recent shops.
- Activate or deactivate users.
- Activate or pause trainers.
- Verify or unverify shops.
- Change booking status.

This is a lightweight operations console for the marketplace.

### 6.10 Placeholder Modules

Two modules are scaffolded but not fully implemented:

- Ads.
- Rewards.

These currently expose placeholder endpoints only. They are conceptually intended for monetization, promotions, retention, or loyalty, but the full business logic is not yet present.

## 7. Backend API Modules

The API root is `/api`.

### Implemented modules

- `/auth`: register, login, current-user lookup.
- `/users`: profile retrieval, list, detail, patch.
- `/trainers`: create, list, detail, patch.
- `/services`: create, list, detail, patch, delete.
- `/group-fitness`: discovery and management of teams/programs.
- `/bookings`: create, list, role-scoped retrieval, update, reschedule, delete.
- `/shops`: create, list, detail, patch, delete, product management.
- `/notifications`: list by user, mark read.
- `/subscriptions`: list by user or by shop.
- `/body-measurements`: list and upsert.
- `/meal-progress`: list and upsert.
- `/ratings`: submit, summary, bulk summary, check existing user rating.
- `/admin`: dashboard metrics and moderation data.

### Scaffold-only modules

- `/ads`.
- `/rewards`.

## 8. Core Business Flows

### Flow A: Member books a trainer or service

1. User registers or logs in.
2. User discovers a trainer, gym offer, or group program.
3. User creates a booking.
4. Host accepts the booking.
5. If the service has a price, payment may become due.
6. Once marked paid, access can activate and a subscription may be created.
7. Attendance can be recorded later.
8. Completion and notifications follow.

### Flow B: Gym owner sells access using service records

1. Gym owner creates a shop profile.
2. Gym owner creates services that describe memberships, day entry, or events.
3. Member books the service.
4. Once the booking is accepted and paid, a subscription record is generated.
5. The subscription later triggers expiring and expired reminders.

### Flow C: Group fitness enrollment

1. Member opens group fitness discovery.
2. Member activates a program.
3. The system creates a booking against the linked service.
4. The member is added to the program roster.
5. Trainers or venue operators manage attendance and measurement entries.
6. The dashboard can show attendance ranking and weight-loss progress.
7. If the program is full, the user can join the waitlist.

### Flow D: Rating after real usage

1. User completes a paid interaction.
2. The user submits a rating.
3. The system verifies they have booking or subscription eligibility.
4. One rating per user per target is enforced.
5. Aggregate summaries can be shown publicly.

## 9. Database Design

Fithub uses MongoDB, so these are technically collections rather than SQL tables. However, if someone is preparing a developer or product specification, it is reasonable to describe them as platform data tables.

Below is the implemented data model.

### 9.1 `users`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `name` | String | Yes | Display name |
| `email` | String | Yes | Unique, lowercased |
| `passwordHash` | String | Yes | Stored hashed password |
| `roles` | String[] | Yes | One or more of `user`, `member`, `trainer`, `shop`, `gym_owner`, `admin` |
| `phone` | String | No | Contact number |
| `dateOfBirth` | String | No | Stored as string in current implementation |
| `address` | String | No | Member address |
| `emergencyContactName` | String | No | Safety/contact field |
| `emergencyContactPhone` | String | No | Safety/contact field |
| `allergies` | String | No | Health note |
| `medicalConditions` | String | No | Health note |
| `medications` | String | No | Health note |
| `medicalNotes` | String | No | Freeform medical note |
| `profileImage` | String | No | URL or path |
| `isActive` | Boolean | Yes | Soft account enable/disable |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Identity and access control.
- Shared profile data for all user types.
- Holds health and emergency data used for onboarding and fitness operations.

### 9.2 `trainers`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `userId` | ObjectId | Yes | Unique ref to `users` |
| `specialties` | String[] | No | Training domains |
| `experienceYears` | Number | No | Non-negative |
| `rating` | Number | No | 0 to 5 cached value field |
| `bio` | String | No | Public description |
| `availability` | Array | No | Embedded day/start/end schedule |
| `portfolio.headline` | String | No | Branding line |
| `portfolio.coachingStyle` | String | No | Coaching philosophy |
| `portfolio.certifications` | String[] | No | Credentials |
| `portfolio.achievements` | String[] | No | Proof points |
| `isActive` | Boolean | Yes | Trainer availability flag |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Specialized profile layer on top of the base user record.
- Enables discovery, service ownership, and session assignment.

### 9.3 `shops`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `shopName` | String | Yes | Venue or business name |
| `ownerId` | ObjectId | Yes | Ref to `users` |
| `categories` | String[] | No | Gym, supplements, apparel, etc. |
| `location` | String | No | Human-readable location |
| `description` | String | No | Business description |
| `logoUrl` | String | No | Brand asset |
| `isVerified` | Boolean | Yes | Admin moderation flag |
| `websiteLink` | String | No | External website |
| `peakHoursBusy` | String | No | Busy time guidance |
| `peakHoursQuiet` | String | No | Quiet time guidance |
| `peakHoursNotes` | String | No | Scheduling guidance |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Represents a physical or operational venue.
- Used for gym discovery, venue offers, subscription ownership, and storefront management.

### 9.4 `products`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `shopId` | ObjectId | Yes | Ref to `shops` |
| `name` | String | Yes | Product name |
| `price` | Number | Yes | Non-negative |
| `currency` | String | Yes | Default `MVR` |
| `imageUrl` | String | No | Catalog image |
| `description` | String | No | Product copy |
| `externalLink` | String | No | External purchase URL |
| `availability` | Boolean | Yes | In stock or not |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Gives venue owners a simple storefront/catalog layer separate from bookable services.

### 9.5 `services`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `category` | String | Yes | High-level grouping |
| `type` | String | Yes | Specific service type |
| `title` | String | Yes | Public listing title |
| `description` | String | No | Listing copy |
| `audience` | String | Yes | `all` or `ladies` |
| `price` | Number | Yes | Commercial price |
| `currency` | String | Yes | Default `MVR` |
| `trainerId` | ObjectId | No | Ref to primary trainer |
| `assignedTrainerIds` | ObjectId[] | No | Multiple trainer assignments |
| `shopId` | ObjectId | No | Ref to venue |
| `location.name` | String | No | Venue or place label |
| `location.address` | String | No | Address |
| `location.city` | String | No | City |
| `schedule[]` | Array | No | Day, startTime, endTime |
| `deliveryOptions[]` | Array | No | `in_person`, `online`, `outdoor` with labels/details |
| `capacity` | Number | Yes | Minimum 1 |
| `groupProgramMeta.nextClassDate` | Date | No | Group-program support |
| `groupProgramMeta.nextClassStartTime` | String | No | Group-program support |
| `groupProgramMeta.nextClassEndTime` | String | No | Group-program support |
| `groupProgramMeta.bringNote` | String | No | Group-program support |
| `groupProgramMeta.eventDayTitle` | String | No | Event support |
| `groupProgramMeta.eventDayDate` | Date | No | Event support |
| `groupProgramMeta.eventDayNote` | String | No | Event support |
| `isActive` | Boolean | Yes | Listing state |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Core commercial listing model.
- Used for PT sessions, classes, memberships, passes, events, and linked group-program booking records.

### 9.6 `bookings`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `userId` | ObjectId | Yes | Booking customer |
| `serviceId` | ObjectId | Yes | Ref to `services` |
| `groupProgramId` | ObjectId | No | Ref to `groupFitnessPrograms` |
| `trainerId` | ObjectId | No | Ref to `trainers` |
| `shopId` | ObjectId | No | Ref to `shops` |
| `bookingDate` | Date | Yes | Scheduled date |
| `timeSlot` | String | Yes | Stored display slot |
| `sessionMode` | String | No | `in_person`, `online`, `outdoor` |
| `sessionLocation` | String | No | Human-readable location |
| `status` | String | Yes | `requested`, `accepted`, `completed`, `cancelled` |
| `paymentStatus` | String | Yes | `not_due`, `awaiting_payment`, `paid`, `refunded` |
| `paymentMethod` | String | No | Payment method enum |
| `paymentReference` | String | No | External transaction reference |
| `paidAt` | Date | No | Payment confirmation time |
| `accessStartDate` | Date | No | Derived access window start |
| `accessEndDate` | Date | No | Derived access window end |
| `notes` | String | No | Freeform notes |
| `attendanceStatus` | String | Yes | `pending`, `attended`, `missed`, `excused` |
| `attendanceNote` | String | No | Attendance explanation |
| `attendanceMarkedAt` | Date | No | Audit field |
| `attendanceMarkedBy` | ObjectId | No | Ref to `users` |
| `rescheduleStatus` | String | Yes | Multi-step reschedule state |
| `rescheduleRequestedBy` | String | No | Actor role |
| `rescheduleReason` | String | No | Reason text |
| `proposedBookingDate` | Date | No | Proposed new date |
| `proposedTimeSlot` | String | No | Proposed new time |
| `proposedSlots[]` | Array | No | Host can offer multiple options |
| `rescheduleUpdatedAt` | Date | No | Audit field |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Central transaction and workflow record.
- Connects users, services, trainers, shops, attendance, payment, rescheduling, and access activation.

### 9.7 `subscriptions`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `userId` | ObjectId | Yes | Subscription holder |
| `bookingId` | ObjectId | Yes | Unique ref to booking |
| `serviceId` | ObjectId | Yes | Source service |
| `shopId` | ObjectId | No | Venue owner |
| `title` | String | Yes | Usually copied from service title |
| `kind` | String | Yes | `day_entry`, `membership`, `event_access` |
| `status` | String | Yes | `pending_payment`, `active`, `expired`, `cancelled` |
| `startDate` | Date | Yes | Access window start |
| `endDate` | Date | Yes | Access window end |
| `activatedAt` | Date | No | Activation time |
| `cancelledAt` | Date | No | Cancellation time |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Separates access rights from raw booking records.
- Enables membership-style lifecycle management and reminders.

### 9.8 `groupFitnessTeams`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `name` | String | Yes | Unique team or program brand |
| `location` | String | Yes | Team location |
| `focus` | String | Yes | Fitness specialization |
| `description` | String | Yes | Team summary |
| `isActive` | Boolean | Yes | Discovery state |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Organizes group programs under a branded team or program family.

### 9.9 `groupFitnessPrograms`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `teamId` | ObjectId | Yes | Ref to `groupFitnessTeams` |
| `title` | String | Yes | Program title |
| `subtitle` | String | Yes | Program subtitle |
| `description` | String | Yes | Full program summary |
| `price` | Number | Yes | Program price |
| `currency` | String | Yes | Default `MVR` |
| `venue` | String | Yes | Program venue |
| `coach` | String | Yes | Coach label |
| `days` | String[] | No | Operating days |
| `startTime` | String | Yes | Session start |
| `endTime` | String | Yes | Session end |
| `startDate` | Date | Yes | Cohort start |
| `endDate` | Date | Yes | Cohort end |
| `totalSlots` | Number | Yes | Max capacity |
| `bookedSlots` | Number | Yes | Used capacity |
| `linkedServiceId` | ObjectId | No | Bookable service link |
| `assignedTrainerIds` | ObjectId[] | No | Program operators |
| `memberIds` | ObjectId[] | No | Enrolled users |
| `nextClass.classDate` | Date | No | Next scheduled class |
| `nextClass.startTime` | String | No | Next scheduled class |
| `nextClass.endTime` | String | No | Next scheduled class |
| `nextClass.bringNote` | String | No | Preparation note |
| `eventDay.title` | String | No | Special event title |
| `eventDay.eventDate` | Date | No | Event date |
| `eventDay.note` | String | No | Event note |
| `attendance[]` | Array | No | userId, classDate, status, note, markedBy, markedAt |
| `intentions[]` | Array | No | next-class intent per user/date |
| `serviceMatchTerms` | String[] | No | Used to auto-link services |
| `waitlist[]` | Array | No | userId and joinedAt |
| `isActive` | Boolean | Yes | Discovery state |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Represents structured cohorts or seasonal programs.
- Bridges discovery, enrollment, attendance, performance tracking, and commercial booking.

### 9.10 `bodyMeasurements`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `userId` | ObjectId | Yes | Member being measured |
| `measuredAt` | String | Yes | Date label in current implementation |
| `weightKg` | Number | No | Weight |
| `bodyFatPercent` | Number | No | Body fat |
| `chestCm` | Number | No | Chest circumference |
| `waistCm` | Number | No | Waist circumference |
| `hipsCm` | Number | No | Hips circumference |
| `thighCm` | Number | No | Thigh circumference |
| `armCm` | Number | No | Arm circumference |
| `note` | String | No | Coach/member note |
| `updatedBy` | ObjectId | Yes | Ref to `users` |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Progress-tracking record for members and group-program cohorts.

### 9.11 `mealProgress`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `userId` | ObjectId | Yes | Member owner |
| `date` | String | Yes | Tracked day |
| `status` | String | Yes | `followed`, `partial`, `missed` |
| `completedMeals.breakfast` | Boolean | Yes | Adherence detail |
| `completedMeals.lunch` | Boolean | Yes | Adherence detail |
| `completedMeals.snack` | Boolean | Yes | Adherence detail |
| `completedMeals.dinner` | Boolean | Yes | Adherence detail |
| `note` | String | No | Daily comment |
| `updatedBy` | ObjectId | Yes | Ref to `users` |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Daily adherence tracking rather than full nutrition planning.

### 9.12 `notifications`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `userId` | ObjectId | Yes | Recipient |
| `type` | String | Yes | Notification category enum |
| `title` | String | Yes | Short headline |
| `message` | String | Yes | Full message |
| `bookingId` | ObjectId | No | Ref to related booking |
| `subscriptionId` | ObjectId | No | Ref to related subscription |
| `readAt` | Date | No | Read marker |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Unified communication log for workflow events and reminders.

### 9.13 `ratings`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Primary key |
| `userId` | ObjectId | Yes | Reviewer |
| `targetType` | String | Yes | `trainer`, `shop`, or `service` |
| `targetId` | ObjectId | Yes | Target record id |
| `score` | Number | Yes | 1 to 5 |
| `comment` | String | No | Up to 400 chars |
| `createdAt` | Date | Yes | Auto timestamp |
| `updatedAt` | Date | Yes | Auto timestamp |

Purpose:

- Trust and quality signal for trainers, venues, and services.

## 10. Relationship Summary

Key relationships in the data model:

- One `user` can own one trainer profile.
- One `user` can own one or more shops.
- One `shop` can have many products.
- One `trainer` can own or be assigned to many services.
- One `shop` can host many services.
- One `user` can create many bookings.
- One booking belongs to one service and may optionally belong to one trainer, one shop, and one group program.
- One booking may create one subscription.
- One group fitness program belongs to one team and can include many members and assigned trainers.
- One user can have many body measurements, meal-progress entries, notifications, subscriptions, and ratings.

## 11. Important Business Rules

These rules are important for anyone extending the project.

- JWT authentication is required for protected actions.
- Inactive users are blocked even if they still have a valid token.
- Members can only create bookings for themselves unless admin.
- Members can only cancel their own bookings and confirm payment in limited states.
- Hosts cannot directly mark payment as paid through the standard host path.
- Attendance can only be marked by hosts or admins.
- Reschedule requests must happen at least 3 hours before a session starts.
- A rating is allowed only after verified paid engagement.
- One rating per user per target is enforced.
- Group programs cannot exceed capacity.
- Waitlist is only available when the program is full.
- Subscriptions are auto-derived from qualifying service text and booking lifecycle state.

## 12. Current Strengths of the Concept

From a product-design perspective, the strongest parts of the current concept are:

- Reusing one service model for trainers, venues, access plans, and group-program booking.
- Using bookings as the center of the operational lifecycle.
- Treating subscriptions as derived access rights rather than a disconnected billing-only object.
- Combining fitness operations with member progress tracking.
- Supporting multiple operator roles in one frontend workspace.

## 13. Current Gaps and MVP Limitations

The codebase is functional, but some parts are still early-stage.

- Ads and rewards are placeholders only.
- Meal plans are mostly static presentation content; persistence currently tracks adherence, not dynamic plan authoring.
- There is no payment gateway integration yet; payment is tracked as booking state.
- Role boundaries are practical but not yet enterprise-grade.
- Some date fields are stored as strings rather than native dates.
- The frontend relies heavily on one large workspace component, which is workable for MVP speed but may become hard to scale.

## 14. Recommended Future Expansion

Natural next steps for the platform would be:

1. Real payment integration and invoice history.
2. Proper membership plan templates instead of keyword-derived access typing.
3. More structured nutrition planning and coach-assigned meal plans.
4. Richer trainer CRM features such as notes, progress plans, and recurring sessions.
5. More formal gym operations such as check-in, capacity monitoring, and staff roles.
6. Completion of ads and rewards as monetization and retention modules.

## 15. Environment and Runtime Notes

Important runtime configuration:

- Backend port defaults to `5001`.
- Frontend expects backend API at `http://localhost:5001/api` unless overridden.
- JWT secret is read from environment configuration.
- MongoDB is optional during scaffold stages; the backend can start without a Mongo connection if not configured.

## 16. Short Summary for a New Developer

If you need to explain Fithub in one paragraph:

Fithub is a fitness operations platform that combines discovery, booking, gym access, trainer services, group programs, member progress tracking, notifications, subscriptions, and admin moderation in one system. Members use it to find and book fitness experiences. Trainers and gym owners use it to publish and manage those experiences. Admins use it to moderate the marketplace. The database is centered around users, trainers, shops, services, bookings, subscriptions, group fitness programs, progress logs, notifications, and ratings.