# Local demo data

`demo-data.json` is the saved, editable fixture used when `DATA_SOURCE=demo`.
No database service, migrations, or seed command is required for this mode.

All three fictional accounts use the password **`TaskFlowDemo123!`**:

| Email | Name |
|---|---|
| `demo@taskflow.local` | Alex Morgan |
| `sam@taskflow.local` | Sam Patel |
| `jordan@taskflow.local` | Jordan Lee |

The file contains three users/profiles, two projects, five memberships, six tasks,
three comments, three notifications, three tags, and four task/tag links. Tasks cover
all four statuses and priorities, plus unassigned and overdue examples.

Passwords are stored as bcrypt hashes. The fixture stays outside `public/`; only public
identity fields are returned by authentication and profile queries. These published
credentials are for local demos only.

The foundation currently renders the signed-in user's welcome card. Project and task
records are ready for later feature work; they do not add board screens or CRUD APIs.
Edit this JSON file to change saved demo data. It is read from disk on each server query,
so edits persist across restarts and take effect on refresh. There are no UI write
operations yet. Restore this file from version control to reset the fixture.

Switch to `DATA_SOURCE=postgres`, configure `DATABASE_URL`, and restart the app to use
the existing Prisma backend instead.
