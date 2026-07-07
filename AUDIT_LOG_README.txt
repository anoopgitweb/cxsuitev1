Feedback Intelligence Suite - User Management and Audit Logs

User store:
- security/users.json
- Openable in Notepad.
- Passwords are not stored as plain text. They are stored as salted PBKDF2-SHA256 password hashes.
- First launch creates admin / admin123. Change this before UAT or production use.

Audit logs:
- logs/audit/audit_YYYY-MM-DD.log contains all suite-level audit records in JSON Lines format.
- logs/user_logs/username_YYYY-MM-DD.log contains per-user activity logs.
- Admin users can open the in-app Admin Logs panel to review latest logs and manage users.

Typical events captured:
- Server start
- Login success/failure
- File uploads
- Analysis start/completion/failure
- Exports
- Manual override actions
- Important UI clicks from the suite pages

This is a local-only audit system. Logs are written to this folder and are not sent outside the machine.
