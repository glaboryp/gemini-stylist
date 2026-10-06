#!/usr/bin/env bash
set -euo pipefail

base="${1:?usage: smoke-backend.sh <backend-url>}"
base="${base%/}"

curl -fsS --retry 5 --retry-delay 5 --retry-connrefused -m 30 "$base/" > /dev/null
health="$(curl -fsS --retry 3 --retry-delay 10 -m 180 "$base/health/models")"

python3 - "$health" <<'PY'
import json
import sys

data = json.loads(sys.argv[1])
keys, models = data["keys"], data["models"]
failed = False

print(f"keys: {keys['valid']} valid, {keys['invalid']} invalid, {keys['total']} total")
if keys["total"] == 0 or keys["invalid"] > 0:
    print("::error::The service has no API keys or at least one key is invalid")
    failed = True
elif keys["valid"] == 0:
    print("::warning::No key could be verified right now (temporary error or quota)")

for name, status in models.items():
    print(f"model {name}: {status}")
    if status in ("not_found", "invalid"):
        print(f"::error::Model {name} is not usable ({status})")
        failed = True
    elif status in ("error", "unchecked"):
        print(f"::warning::Model {name} could not be checked ({status})")

sys.exit(1 if failed else 0)
PY
