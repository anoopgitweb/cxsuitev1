import os
import subprocess
import sys
from pathlib import Path


def main() -> int:
    app_dir = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    # When running as a one-file PyInstaller executable, the real app folder is
    # next to the executable, not inside _MEIPASS.
    real_app_dir = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else app_dir
    suite_root = real_app_dir.parents[1]
    python_exe = suite_root / "portable_python" / "python.exe"
    app_py = real_app_dir / "app.py"
    if not python_exe.exists():
        raise SystemExit(f"Bundled Python not found: {python_exe}")
    if not app_py.exists():
        raise SystemExit(f"Training app not found: {app_py}")
    env = os.environ.copy()
    package_path = str(suite_root / "python_packages")
    env["PYTHONPATH"] = package_path + (os.pathsep + env.get("PYTHONPATH", "") if env.get("PYTHONPATH") else "")
    subprocess.Popen([str(python_exe), str(app_py)], cwd=str(real_app_dir), env=env)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
