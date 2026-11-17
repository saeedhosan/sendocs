import os
import subprocess


def command(*args):
    return subprocess.check_output(args, text=True).strip()


def write_env(env_file, name, value):
    cleaned = str(value).replace("\r", " ").replace("\n", " ")
    env_file.write(f"{name}={cleaned}\n")


os_release = {}
with open("/etc/os-release", encoding="utf-8") as handle:
    for line in handle:
        if "=" in line:
            key, value = line.strip().split("=", 1)
            os_release[key] = value.strip('"')

cpu_model = "Unknown"
for line in command("lscpu").splitlines():
    if line.startswith("Model name:"):
        cpu_model = line.split(":", 1)[1].strip()
        break

meminfo = {}
with open("/proc/meminfo", encoding="utf-8") as handle:
    for line in handle:
        if ":" in line:
            key, value = line.split(":", 1)
            meminfo[key] = value.strip()

memory_kib = float(meminfo.get("MemTotal", "0 kB").split()[0])

with open(os.environ["GITHUB_ENV"], "a", encoding="utf-8") as env_file:
    write_env(env_file, "RUN_STARTED_AT", command("date", "-u", "+%Y-%m-%dT%H:%M:%SZ"))
    write_env(env_file, "RUNNER_OS_NAME", os_release.get("PRETTY_NAME", os_release.get("NAME", "Unknown")))
    write_env(env_file, "RUNNER_ARCH", command("uname", "-m"))
    write_env(env_file, "RUNNER_CPU_MODEL", cpu_model)
    write_env(env_file, "RUNNER_CPU_COUNT", command("nproc"))
    write_env(env_file, "RUNNER_MEMORY_GIB", f"{memory_kib / 1024 / 1024:.1f}")
