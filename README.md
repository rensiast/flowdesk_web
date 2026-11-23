# FlowDesk — Creative Agency Service Management System

A web-based system for managing a creative agency's service lifecycle. It is built with **HTML, CSS and JavaScript only**: no frameworks, no build step and no server.

```
Client Request → Review → Assignment → In Progress → Client Review → Revision → Approval → Delivery
```

## How to run

Open `index.html` in any modern browser (Chrome, Edge or Firefox). Everything runs in the browser. Data is saved in `localStorage`, so changes stay after you refresh.

## Demo accounts (password: `demo123`)

| Role                   | Email                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Agency Manager / Admin | admin@flowdesk.test                                                                    |
| Agency Staff           | carlo@flowdesk.test, bea@flowdesk.test, josh@flowdesk.test, lia@flowdesk.test          |
| Client                 | client@brewhaus.test, sofia@northpeak.test, paolo@lumendental.test, nina@kasahome.test |

Sign in by typing one of the emails above and the password. To change roles, sign out and sign in with another account. Use **user menu → Reset demo data** to restore the original sample data.

## Features by role

- **Agency Manager:** analytics dashboard with a Service Health Score, service alerts and charts. Can review requests, then accept and assign them using skill and workload recommendations, or decline them. Has list and Kanban views of projects, plus pages for clients, services and the team's workload. Reports can be exported as CSV or printed.
- **Agency Staff:** a work queue sorted by urgency, with a suggested next action for each project. Staff can update progress, upload versioned deliverables (drag-and-drop) and respond to revision feedback.
- **Client:** a portal to submit service requests, track progress on a lifecycle tracker, review each deliverable version, approve it or request a revision with itemized changes, and rate the service.
- **Everyone:** notifications, global search (Ctrl + K), dark mode, a responsive layout and a full activity log and revision history for each project.

## Project structure

```
index.html        App entry point
css/styles.css    Design system, layout, components, dark mode, print styles
js/store.js       localStorage database, seed data, metrics/analytics
js/workflow.js    Service-lifecycle business rules (request → delivery)
js/ui.js          Icons, components, modal, toasts, SVG charts
js/views.js       Page views for each role
js/app.js         Routing, authentication, shell, notifications, search, actions
```

## Scope notes (per the project paper)

The system serves one agency. It has no payments, invoicing, video conferencing or public marketplace. File handling is kept to what the demo needs: images up to 2 MB are stored so they can be previewed, and other files are recorded by name and size.
