# Fab Database Dashboard

This project serves a `Flask + Vue 3` dashboard backed directly by SQLite.

## Python Version

- Required interpreter: `Python 3.7.6`
- The local virtual environment is pinned to `3.7.6`
- New environments for this project should also use `3.7.6`

## Architecture

The backend is now organized in an MVC-style enterprise structure:

- `app.py`: entrypoint only
- `fab_app/controllers`: route controllers / API layer
- `fab_app/services`: business logic layer
- `fab_app/repositories`: database access layer
- `fab_app/models`: page definitions and domain constants
- `fab_app/core`: framework and infrastructure helpers
- `templates` + `static`: view layer

Compatibility wrappers are still kept in the project root for `dashboard_data.py`, `export_service.py`, `user_store.py`, and `database.py`.

## Pages

- `Angle`
- `OC Series`
- `Lens Series`

## Data Source

- Dashboard data comes from `C:\Users\18781\Desktop\data.db`
- User login and profile data also come from the `USER` table in the same database
- The app no longer reads dashboard data from Excel files

## Run

```bash
pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

Open:

```text
http://127.0.0.1:5000
```

## Offline Setup For Python 3.7.6

This project already includes all Python runtime packages in `offline_packages/`.

Steps on the offline Windows computer:

1. Install `python-3.7.6-amd64.exe`
2. Create a virtual environment in the project root
3. Install dependencies from the local wheel directory
4. Start the app with `app.py`

Example commands:

```bat
py -3.7 -m venv .venv
.venv\Scripts\python.exe -m pip install --no-index --find-links=offline_packages -r requirements.txt
.venv\Scripts\python.exe app.py
```

Notes:

- `offline_packages` contains the pinned runtime wheels for `Python 3.7.6`
- The frontend assets are local, so `npm install` is not required to run the dashboard
- The SQLite database still needs to exist at `C:\Users\18781\Desktop\data.db`, or you need to update the configured database path

## API

- Dashboard: `/api/dashboard?page=angle|oc|lens`
- Export: `/api/export-excel`
- Health: `/api/health`
- Session: `/api/session`
- Profile: `/api/profile`

## Notes

- Frontend assets are bundled locally in `static/vendor`
- Excel is still used only as an export format, not as the dashboard data source
