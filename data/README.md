# Local demo data

`demo-data.json` is the starting fixture used when `DATA_SOURCE=demo`.
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

Sign-up, profile edits and password changes save to **`.cache/demo-data.json`** on the
first write. Subsequent reads and writes use that runtime file, and changes survive a
server restart. The original fixture and its published credentials stay unchanged.
`DEMO_DATA_FILE` can override the runtime path. Files are saved with owner-only permissions
using serialized, atomic replacement. Run one app process per runtime file; this local
storage is not a substitute for a database in multi-process or hosted deployments.

To reset local changes, stop the app, back up `.cache/demo-data.json` if wanted, then delete
only that runtime file and restart. This removes accounts and edits created locally.
Edits to the starting fixture apply when no runtime file exists. Browser tests use their
own `.cache/e2e-demo.json`, recreated for each run, so they do not change your demo login.

Fixture version 2 stores bcrypt hashes on `users[].password` and avatar color indices on
profiles. The loader also accepts version 1, migrating legacy profile hashes on first write.
Project and task records are ready for later feature work; board screens are not built yet.

Switch to `DATA_SOURCE=postgres`, configure `DATABASE_URL`, and restart the app to use
the existing Prisma backend instead.
