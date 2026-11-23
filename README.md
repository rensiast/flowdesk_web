# FlowDesk — Creative Agency Service Management System

FlowDesk is a web app that manages a creative agency's work from the moment a client asks for something until the final files are handed over. Clients submit requests, managers assign them to staff, staff upload versioned deliverables, and clients approve the work or ask for revisions, all in one place.

It is built with **plain HTML, CSS and JavaScript only**: no frameworks, no libraries, no build step, no server and no database. Download it, open `index.html`, and it runs.

```
Client Request → Review → Assignment → In Progress → Client Review → Revision → Approval → Delivery
```

> **About this project:** FlowDesk is our final project for **IT 314 — Web Systems and Technologies**. The course requirement was to build the system using only HTML, CSS and JavaScript files, so the app has **no database and no back end**. All data is stored in your own browser (see [How data is stored](#how-data-is-stored)).

## Contents

- [Try it](#try-it)
- [Demo accounts](#demo-accounts)
- [Features](#features)
- [How it works](#how-it-works)
- [How data is stored](#how-data-is-stored)
- [Project structure](#project-structure)
- [Scope and limitations](#scope-and-limitations)
- [Credits](#credits)
- [License](#license)

## Try it

1. Download the project: click **Code → Download ZIP** on this page and unzip it, or clone it:
   ```
   git clone https://github.com/rensiast/flowdesk_web.git
   ```
2. Open `index.html` in a modern browser (Chrome, Edge or Firefox).
3. Sign in with one of the [demo accounts](#demo-accounts).

That's it. There is nothing to install. An internet connection is only used to load the font; without it, the app falls back to your system font and still works.

## Demo accounts

Every account uses the password **`demo123`**.

| Role                   | Email                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Agency Manager (admin) | admin@flowdesk.test                                                                    |
| Agency Staff           | carlo@flowdesk.test, bea@flowdesk.test, josh@flowdesk.test, lia@flowdesk.test          |
| Client                 | client@brewhaus.test, sofia@northpeak.test, paolo@lumendental.test, nina@kasahome.test |

To see the app from another role, sign out and sign in with a different account. To start over with fresh sample data, open the user menu and choose **Reset demo data**.

The sample projects are dated relative to today, so whenever you open the demo there are overdue projects, upcoming deadlines and recently finished work to explore.

## Features

**Agency Manager**
- Analytics dashboard with KPI tiles, charts and a 0–100 **Service Health Score** (on-time delivery, client satisfaction, revision count and overdue risk).
- Service alerts for overdue projects, close deadlines and projects stuck in repeated revisions.
- Reviews incoming requests, then accepts and assigns them or declines them with a reason.
- **Smart assignment:** recommends a staff member based on skill match and current workload.
- List and Kanban board views of all projects, with search and filters.
- Manages clients, the service catalog and the team.
- Performance reports that can be exported as CSV or printed.

**Agency Staff**
- A work queue sorted by urgency, with a suggested next action for each project.
- Progress updates, and versioned deliverable uploads with drag-and-drop.
- Responds to itemized client revision requests.

**Client**
- A portal to submit service requests and follow their review status.
- A lifecycle tracker showing exactly where each project is.
- Reviews each deliverable version, then approves it or requests a revision with a list of changes.
- Rates the service after delivery.

**Everyone**
- Notifications, global search (**Ctrl + K**), dark mode, a responsive layout for phones and tablets, and a full activity log and revision history for every project.

## How it works

FlowDesk is a **single-page application**: the browser loads `index.html` once, and JavaScript builds every screen inside it.

- **Routing:** each page has its own address after the `#` (for example `#/project/p_9`), so the Back button and links work without reloading the page.
- **Roles:** a permission table decides which pages each role can open, and every list is filtered so clients only see their own projects and staff only see their assignments.
- **Lifecycle rules:** every status change goes through one file (`workflow.js`), and buttons only appear when the current status allows that step, so stages can't be skipped.
- **Rendering:** after every action, the app updates the data, saves it, and redraws the page from that data.
- **No libraries:** icons and charts are hand-drawn SVG, and dark mode is a set of CSS variables.

## How data is stored

Because the course required HTML, CSS and JavaScript only, there is **no database or server**. Instead, all data is kept in the browser's built-in `localStorage`:

- The first time you open the app, it creates sample data (agency staff, clients, services, projects, deliverables and revisions).
- Every change is saved immediately as JSON text, so your changes stay after you refresh or close the browser.
- Your data stays on your computer and is never sent anywhere.
- Each browser has its own separate copy. Changes you make won't appear for other people or on other devices.
- Uploaded images up to 2 MB are stored so they can be previewed. Other files are recorded by name and size only, because browser storage is limited to about 5 MB.

## Project structure

```
index.html        App entry point: an empty page that loads the CSS and scripts
css/styles.css    Colours, layout, components, dark mode, phone layout, print styles
js/store.js       The browser "database": sample data, saving and loading, analytics
js/workflow.js    Service-lifecycle business rules (request → delivery)
js/ui.js          Icons, badges, pop-up forms, notifications, SVG charts
js/views.js       The pages for each role
js/app.js         Sign-in, page switching, top bar, search, notifications, button actions
```

The scripts load in this order on purpose: data → rules → UI building blocks → pages → app controller.

## Scope and limitations

FlowDesk is a working prototype for a class project, not a production system.

- It serves a single agency. Payments, invoicing, video calls and a public marketplace are out of scope.
- **Sign-in is for demonstration only.** Passwords are stored as plain text in the browser and access rules run in the browser, so do not use a real password.
- Data is per browser, as described above, so it is not a multi-user system.

A real deployment would add a server and database, hashed passwords, server-side permission checks and proper file storage.

## Credits

- Icons are from [Feather](https://feathericons.com) by Cole Bemis, used under the [MIT License](https://github.com/feathericons/feather/blob/main/LICENSE) (Copyright (c) 2013-2023 Cole Bemis). A few icons were lightly modified.
- Font: [Poppins](https://fonts.google.com/specimen/Poppins), loaded from Google Fonts.

## License

Copyright (c) 2026 rensiast. All rights reserved. You are welcome to view the code and try the demo, but it may not be copied, modified or redistributed without permission. See [LICENSE](LICENSE).

The Feather icons in `js/ui.js` remain under their own MIT License, as listed in [Credits](#credits).
