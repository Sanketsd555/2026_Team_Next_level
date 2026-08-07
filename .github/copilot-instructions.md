# LoanFlow Dashboards Instructions

This workspace contains a React frontend and Django backend for a role-based loan portal.

Project goals:

- User dashboard: show loan advertisements and let users submit loan applications.
- Bank dashboard: show applications assigned to that bank and let bank staff approve or reject them.
- Admin dashboard: provide separate sections for users and banks.

Implementation notes:

- Backend API lives under `backend/core` and uses Django REST Framework token auth.
- Frontend lives under `frontend/src` and uses React Router for role-specific pages.
- Keep the loan application flow connected end to end between the user and bank dashboards.
- Keep the UI clean and responsive, but do not change the established visual direction without a reason.

Validation notes:

- Use backend compile checks and Django runtime checks for Python changes.
- Use the Vite build for frontend validation.
- Prefer focused edits over broad rewrites when fixing bugs.