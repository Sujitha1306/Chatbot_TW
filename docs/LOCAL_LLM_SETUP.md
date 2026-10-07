# Running the Chatbot on a Local LLM (Qwen3 + vLLM)

Migration guide for moving the TrackerWave Porter & Asset chatbot off Azure
OpenAI and onto a self-hosted model running on your own Ubuntu server.

**Status:** planning / pre-implementation
**Target:** Tier 2 build — one GPU, ~20–25 concurrent users (Phase 1)

---

## Contents

1. [Which models, and what each does](#1-which-models-and-what-each-does)
2. [Server requirements](#2-server-requirements)
3. [Installation, step by step](#3-installation-step-by-step)
4. [Token limits — is it really "unlimited"?](#4-token-limits--is-it-really-unlimited)
5. [Troubleshooting](#5-troubleshooting)
6. [Do this before you benchmark](#6-do-this-before-you-benchmark)
7. [Split deployment: model server on a separate machine](#7-split-deployment-model-server-on-a-separate-machine)

> **Running the model on a separate box?** That is the expected setup. Read
> **section 7 first** — it covers who does what, the five values the server team
> must hand over, firewall rules, and how to verify the connection before
> touching application code.

---

## 1. Which models, and what each does

Run **two models side by side on the same GPU**. Think of it as hiring a senior
engineer and a junior assistant, instead of paying senior rates for everything.

| | **Qwen3-32B** (FP8) | **Qwen3-8B** (FP8) |
|---|---|---|
| Nickname | the "brain" | the "helper" |
| Size on disk | ~33 GB | ~9 GB |
| Jobs it does | `plan_analysis`, `generate_sql`, `fix_sql` | routing, summary, suggestions, follow-ups |
| Why this one | Correct ClickHouse SQL means obeying 30+ rules — request grain, IST timezone, pool-code rules. Big dense models follow long rule-lists; small ones drift. | Easy jobs: classify a message, write 3 sentences from numbers you hand it. A small model does them ~4× faster. |
| If it gets it wrong | Wrong numbers reach a hospital manager | Slightly clumsy wording |

**Why not one model for everything?**
About 60% of the LLM calls are the easy jobs. Running those on the 32B wastes
roughly half the GPU. Splitting them is free performance.

**Why not a small model for everything?**
SQL correctness is the whole product. That is where every bug fixed in this
codebase lived.

### Two things that make this safe

- **Qwen3 is Apache 2.0** — free for commercial use, no restrictions.
  (Llama's licence has conditions; avoid it for a product you sell.)
- **`backend/app/core/sql_guard.py` is the safety net.** It deterministically
  catches wrong grain, missing timezone, bad pool joins, invalid status codes,
  `groupArray` blobs and non-equi joins — with no model involved. That is what
  makes a local model viable. The guard does not care whether GPT-4.1 or Qwen
  wrote the query.

> **Before downloading:** check HuggingFace for a newer Qwen release. Qwen 3.5 /
> 3.6 exist and may be better. Nothing in this guide changes except the model
> name.

---

## 2. Server requirements

| | Minimum (works) | Recommended (Tier 2) |
|---|---|---|
| GPU | 1× 48 GB (L40S) | **1× RTX PRO 6000 Blackwell 96 GB** |
| CPU | 8 cores | EPYC 9124 (16 cores) |
| RAM | 64 GB | **256 GB ECC** |
| Disk | 1 TB NVMe | **2× 2 TB NVMe (mirrored)** |
| OS | **Ubuntu 24.04 LTS** | same |
| Power | 1000 W | 2× 2000 W redundant |
| Network | 1 GbE | 10 GbE |

**Why 96 GB when the models total only 42 GB?**
The leftover ~50 GB becomes **KV cache** — the model's short-term memory for
in-flight conversations. More KV cache = more simultaneous users. That is what
turns 5 concurrent users into 25.

**Rule of thumb:** system RAM should be at least 1.5× VRAM, so models load and
stage without swapping.

---

## 3. Installation, step by step

### Step 0 — Prepare Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl wget htop nvme-cli
sudo reboot
```

### Step 1 — Install the NVIDIA driver

The GPU will not work until Linux has the right driver. Use NVIDIA's own
repository, not the one bundled with Ubuntu.

```bash
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt update
sudo apt install -y nvidia-open        # open kernel modules — REQUIRED for Blackwell
sudo reboot
```

> **Warning:** Blackwell cards (RTX PRO 6000) need the `nvidia-open` package and
> driver **570 or newer**. The older `nvidia-driver-xxx` packages will not work.
> This is the most common failure point in the whole setup.

### Step 2 — Confirm the GPU is alive

```bash
nvidia-smi
```

You should see the card name, 96 GB memory and the driver version.
**If this fails, stop — nothing else will work.**

### Step 3 — Set up storage for the models

Models are large; keep them off the OS disk.

```bash
sudo mkdir -p /srv/models /srv/hf-cache
sudo chown -R $USER:$USER /srv/models /srv/hf-cache
echo 'export HF_HOME=/srv/hf-cache' >> ~/.bashrc
source ~/.bashrc
```

### Step 4 — Install Python and vLLM

**vLLM** is the server that runs the model and exposes it as an API. It speaks
the **same API format as OpenAI**, which is why the existing application code
barely changes.

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh      # fast Python installer
source ~/.bashrc

uv venv --python 3.12 /srv/vllm-env
source /srv/vllm-env/bin/activate
uv pip install vllm
```

Verify it can see the GPU:

```bash
python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
```

Must print `True` and the GPU name. If `False`, the PyTorch build does not match
the driver — reinstall vLLM with a CUDA 12.8+ build.

### Step 5 — Download the models

```bash
uv pip install "huggingface_hub[cli]"

hf download Qwen/Qwen3-32B-FP8 --local-dir /srv/models/qwen3-32b-fp8
hf download Qwen/Qwen3-8B-FP8  --local-dir /srv/models/qwen3-8b-fp8
```

~42 GB total. On a 100 Mbps line, expect about an hour.
*(Older `huggingface_hub` versions use `huggingface-cli download`.)*

### Step 6 — Test-run the big model by hand

Before making it a service, check that it starts.

```bash
vllm serve /srv/models/qwen3-32b-fp8 \
  --served-model-name qwen3-sql \
  --port 8001 \
  --gpu-memory-utilization 0.60 \
  --max-model-len 32768 \
  --enable-prefix-caching
```

Wait for `Application startup complete`, then from another terminal:

```bash
curl http://localhost:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3-sql","messages":[{"role":"user","content":"Say OK"}],"max_tokens":10}'
```

If JSON comes back, **the local LLM works.** Press `Ctrl+C` to stop.

#### What those settings mean

| Setting | Plain meaning |
|---|---|
| `--gpu-memory-utilization 0.60` | Use 60% of the card, leaving room for the second model |
| `--max-model-len 32768` | Longest conversation accepted — the SQL prompt alone is ~8,700 tokens |
| `--enable-prefix-caching` | **The important one.** Remembers the repeated 8,700-token schema instead of re-reading it every call — 3–5× more throughput, free |

### Step 7 — Run both models as services

So they start automatically on boot.

**First create the shared secret.** systemd does NOT inherit variables from your
shell, so the API key must live in a file the units read:

```bash
sudo mkdir -p /etc/vllm
printf 'VLLM_KEY=%s\n' "$(openssl rand -hex 32)" | sudo tee /etc/vllm/vllm.env
sudo chmod 600 /etc/vllm/vllm.env
sudo cat /etc/vllm/vllm.env          # note this key — the app server needs it
```

```bash
sudo tee /etc/systemd/system/vllm-sql.service > /dev/null <<'EOF'
[Unit]
Description=vLLM Qwen3-32B (SQL + planning)
After=network-online.target

[Service]
User=ubuntu
Environment="HF_HOME=/srv/hf-cache"
EnvironmentFile=/etc/vllm/vllm.env
ExecStart=/srv/vllm-env/bin/vllm serve /srv/models/qwen3-32b-fp8 \
  --served-model-name qwen3-sql --host 0.0.0.0 --port 8001 \
  --gpu-memory-utilization 0.60 --max-model-len 32768 \
  --max-num-seqs 48 --kv-cache-dtype fp8 \
  --enable-prefix-caching --api-key ${VLLM_KEY}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

```bash
sudo tee /etc/systemd/system/vllm-fast.service > /dev/null <<'EOF'
[Unit]
Description=vLLM Qwen3-8B (routing, summaries)
After=vllm-sql.service

[Service]
User=ubuntu
Environment="HF_HOME=/srv/hf-cache"
EnvironmentFile=/etc/vllm/vllm.env
ExecStart=/srv/vllm-env/bin/vllm serve /srv/models/qwen3-8b-fp8 \
  --served-model-name qwen3-fast --host 0.0.0.0 --port 8002 \
  --gpu-memory-utilization 0.22 --max-model-len 16384 \
  --max-num-seqs 128 --enable-prefix-caching --api-key ${VLLM_KEY}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

> `--host 0.0.0.0` makes the service reachable from the application server.
> Without it vLLM may bind to localhost only and refuse every remote call.
> Pair it with the firewall rules in [section 7](#7-split-deployment-model-server-on-a-separate-machine)
> — `0.0.0.0` means "any interface", so the firewall is what keeps it private.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now vllm-sql vllm-fast
sudo systemctl status vllm-sql vllm-fast
```

> **Warning:** the two `gpu-memory-utilization` values **must sum to less than
> 1.0** (0.60 + 0.22 = 0.82). Exceed it and the second service dies with
> out-of-memory.

### Step 8 — Point the application at it

Only the connection settings change; the pipeline logic stays as it is.

```python
# backend/config/settings.py
# Use 127.0.0.1 only if the app runs ON the GPU box. For a separate model
# server, use its LAN IP — see section 7.
llm_base_url:      str = "http://10.0.10.10:8001/v1"
llm_fast_base_url: str = "http://10.0.10.10:8002/v1"
llm_model:         str = "qwen3-sql"
llm_fast_model:    str = "qwen3-fast"
llm_api_key:       str = ""      # from /etc/vllm/vllm.env on the model server
```

Put the real values in `.env`, not in source:

```bash
LLM_BASE_URL=http://10.0.10.10:8001/v1
LLM_FAST_BASE_URL=http://10.0.10.10:8002/v1
LLM_MODEL=qwen3-sql
LLM_FAST_MODEL=qwen3-fast
LLM_API_KEY=<the key from /etc/vllm/vllm.env>
```

```python
# backend/app/core/sql_pipeline.py
from openai import OpenAI

self.client = OpenAI(base_url=settings.llm_base_url,
                     api_key=settings.llm_api_key, timeout=60.0, max_retries=2)
self.fast   = OpenAI(base_url=settings.llm_fast_base_url,
                     api_key=settings.llm_api_key, timeout=30.0)
```

`temperature=0.0` and `seed=42` behave identically on vLLM.

**Which calls go where:**

| Use `self.client` (32B) | Use `self.fast` (8B) |
|---|---|
| `plan_analysis` | `route_message` |
| `generate_sql` | `resolve_memory_scope` |
| `fix_sql` | streaming summary |
| | `generate_suggestions` |
| | `generate_followups` |

### Step 9 — Prove it before switching over

```bash
.venv/bin/python -m pytest tests/ -q --ignore=tests/test_chatbot.py
.venv/bin/python scratchpad/e2e.py       # all 10 scenarios
```

Compare the generated SQL against Azure's output question by question.
**Do not cut over until the 10 scenarios pass** — that is what stops the grain
and timezone bugs returning with a new model.

### Step 10 — Basic monitoring

```bash
watch -n1 nvidia-smi                    # GPU use and temperature
sudo journalctl -u vllm-sql -f          # live logs
curl http://localhost:8001/metrics      # Prometheus metrics
```

---

## 4. Token limits — is it really "unlimited"?

There is **no token bill and no vendor quota**, but "unlimited" is not quite the
right word. You stop paying *per token* and start paying *per second of GPU
time*. Three real ceilings replace the billing one.

### What actually changes

| | Azure (now) | Your server |
|---|---|---|
| Cost per token | ~₹170 per million input tokens | **~₹3 per million** (electricity) |
| Monthly quota | Yes | None |
| Rate limits (429 errors) | Yes | None |
| Per-request token cap | Vendor-set | **You set it** |
| Data leaves your building | Yes | No |

Roughly **₹16/hour of electricity** produces on the order of 5 million tokens —
about **50× cheaper per token**. Practically: run the pipeline as often as you
like, retry freely, let the guard trigger `fix_sql` without worrying about cost.

### The three real limits

1. **Context length — the hard one.** `--max-model-len 32768`. Any single
   request longer than that is **rejected**, not truncated.
2. **Throughput.** Finite tokens/second. Going over does not bill you —
   requests **queue**. Users see slowness, not errors.
3. **Concurrent conversations (KV cache).** Every in-flight request holds
   short-term memory in VRAM. The ~48 GB of leftover VRAM caps simultaneous
   users.

### The trade-off you control

Context length and concurrency come from the same memory pool:

| `--max-model-len` | Approx. concurrent users | Good for |
|---|---|---|
| 8,192 | ~45 | Short questions only — too tight for this schema |
| 16,384 | ~25 | Tight but workable |
| **32,768** | **~20–25** | **Recommended** — fits the prompt with headroom |
| 65,536 | ~10 | Only if the schema grows a lot |

*Estimated from Qwen3-32B's architecture with FP8 KV cache — validate under real
load with `nvidia-smi`.*

Doubling context roughly halves concurrent users. This is the main knob to tune.

**Bonus:** with `--enable-prefix-caching`, the shared 8,700-token schema is
stored **once**, not once per user. 25 users asking different questions share a
single copy.

### Do not remove the `max_tokens` limits

```python
max_tokens=2000   # generate_sql       — keep it
max_tokens=2500   # generate_followups — actually LOWER this
```

Those caps stop one runaway generation from occupying the GPU that 24 other
users are waiting on. Tokens are free *in rupees*; they are not free *in
capacity*.

**The mental shift: you are no longer optimising a bill, you are optimising a
queue.**

---

## 5. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `nvidia-smi` not found | Driver not installed | Redo Step 1, reboot |
| `torch.cuda.is_available() = False` | Driver / PyTorch mismatch | Reinstall vLLM with CUDA 12.8+ |
| Second service won't start, OOM | Memory fractions sum > 1.0 | Lower `--gpu-memory-utilization` |
| Very slow, GPU at 100% | Prefix caching off | Add `--enable-prefix-caching` |
| Model gives poor SQL | Expected on first try | Check `sql_guard` violations in the logs first |
| GPU throttling at ~85 °C | Room too warm | Check the AC — this is why there are two |

**Split deployment (app on a different machine):**

| Symptom | Cause | Fix |
|---|---|---|
| `Connection refused` from app server | vLLM bound to localhost | Add `--host 0.0.0.0`, restart service |
| `Connection timed out` | Firewall blocking | `sudo ufw allow from <app-ip> to any port 8001` |
| `401 Unauthorized` | Wrong or empty API key | Compare app `.env` against `/etc/vllm/vllm.env` |
| API key seems ignored | `${VLLM_KEY}` undefined in systemd | Add `EnvironmentFile=/etc/vllm/vllm.env` to the unit |
| Works via `curl`, fails from app | Wrong `base_url` — missing `/v1` | Must end in `/v1` |
| Random mid-conversation failures | No retries on network blips | Set `max_retries=2` on the client |
| `400` on long questions | Prompt exceeds `--max-model-len` | Raise it on the server, or trim the prompt |

---

## 6. Do this before you benchmark

These are code changes, not server changes. Benchmarks taken before them will
badly understate the hardware.

### 6.1 Move the freshness note to the END of the schema prompt — **required**

In `backend/config/schema.py`, `get_llm_schema_prompt()` currently injects the
per-facility data-coverage note at **character 28** of a 31 KB prompt:

```
## DATABASE: ClickHouse
### DATA COVERAGE (Asia/Kolkata)      ← changes per facility, every 10 min
This facility has data from X to Y...
#### RULE 0 — TABLE GRAIN...           ← 31 KB of identical text, uncacheable
```

vLLM caches on a shared **prefix**. One volatile line at the front invalidates
all 8,700 tokens behind it, for every facility. Moving that block to the end
makes the whole schema cacheable — worth roughly **3–5× throughput**.

### 6.2 Fix the response cache — **security fix, do regardless**

`backend/app/core/cache.py` has two problems:

- It is only wired into `chatbot.py` (`/chat/query`). The frontend uses
  `/chat/stream`, which never calls it — **nothing is cached today**.
- `_make_cache_key()` omits `facility_id`. Since every query is facility-scoped
  by `_build_facility_mandatory_filter()`, enabling the cache as-is would serve
  **one hospital's data to another** — a cross-tenant leak, reportable under the
  DPDP Act 2023.

Fix: add `facility_id` to the key, skip caching when
`plan["had_implicit_reference"]` is true (context-dependent follow-ups such as
"what about last month?" would otherwise collide across users), and wire the
lookup into the streaming path.

### 6.3 Reduce the LLM calls per turn — for latency

Currently 7 sequential calls per turn, 4–5 of them before the user sees a single
character:

| Change | Effect |
|---|---|
| Merge `resolve_memory_scope` + `route_message` into one call | −1 round trip before first token |
| Replace `generate_followups` with a static map per `response_format` | −1 call entirely |
| Run `generate_suggestions` in parallel with the summary stream | −1 call from the critical path |
| `asyncio.gather` the pre-summary COUNT query and pandas work | −0.3–1 s |

Result: **7–8 calls → 4**, and **4–5 → 2** before first token. Estimated
time-to-first-token drops from ~8–12 s to ~3–5 s.

**Do not** merge `plan_analysis` into `generate_sql`. The two-stage split is why
the SQL is correct — the planner resolves grain, timezone and grouping before
anything writes SQL.

---

## 7. Split deployment: model server on a separate machine

This is the expected setup — the infrastructure team builds and runs the GPU
box; the application connects to it over the LAN.

### Who does what

| Steps | Owner | Output |
|---|---|---|
| 0–7, 10 | **Server / infra team** | A GPU box serving two models on ports 8001 and 8002 |
| 8–9 | **Application team** | Chatbot pointed at those ports, 10 scenarios passing |
| 6 | **Application team** | Prompt, cache and call-count fixes |

The two halves are independent. The server team never needs the application
repo, and the app team never needs GPU access.

### Handover checklist

The server team must supply these five values. Nothing else is needed:

| Value | Example | Where it comes from |
|---|---|---|
| Model server IP | `10.0.10.10` | `ip addr` on the GPU box |
| SQL model port | `8001` | Step 7 |
| Fast model port | `8002` | Step 7 |
| API key | `a3f9…` | `/etc/vllm/vllm.env` |
| Model names | `qwen3-sql`, `qwen3-fast` | `--served-model-name` in Step 7 |

Also confirm `--max-model-len` (32768) — the app must not send prompts longer
than the server accepts, or requests are rejected outright.

### Firewall — do not skip this

`--host 0.0.0.0` exposes the model on every interface. vLLM's API key is a thin
check, not a security boundary. **Restrict access to the application server:**

```bash
# On the MODEL server
sudo ufw default deny incoming
sudo ufw allow from 10.0.10.20 to any port 8001 proto tcp   # app server only
sudo ufw allow from 10.0.10.20 to any port 8002 proto tcp
sudo ufw allow from 10.0.10.0/24 to any port 22 proto tcp   # admin SSH
sudo ufw enable
sudo ufw status numbered
```

Never expose 8001/8002 to the internet or to a general user VLAN. Anyone who
reaches those ports can run unlimited inference on your GPU, and prompts sent to
this service contain hospital operational data.

If the two machines are not on the same trusted LAN, terminate TLS with Caddy or
nginx in front of vLLM and use `https://` in the app config.

### Verify connectivity from the application server

Run these **from the app box**, not the GPU box:

```bash
# 1. Port reachable?
nc -zv 10.0.10.10 8001

# 2. Model listed, and the key accepted?
curl -s http://10.0.10.10:8001/v1/models \
  -H "Authorization: Bearer $LLM_API_KEY" | python3 -m json.tool

# 3. End-to-end generation
curl -s http://10.0.10.10:8001/v1/chat/completions \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3-sql","messages":[{"role":"user","content":"Say OK"}],"max_tokens":10}'

# 4. Repeat all three for the fast model on port 8002
```

All four must pass before touching application code. If step 1 fails it is the
firewall or `--host`; if step 2 returns 401 the key is wrong; if step 3 fails
the model did not load — check `journalctl -u vllm-sql` on the GPU box.

### Client settings for a network hop

Local calls never fail; network calls do. Set explicit timeouts and retries:

```python
self.client = OpenAI(
    base_url=settings.llm_base_url,
    api_key=settings.llm_api_key,
    timeout=60.0,      # SQL generation on a loaded server can be slow
    max_retries=2,     # ride out brief blips
)
self.fast = OpenAI(
    base_url=settings.llm_fast_base_url,
    api_key=settings.llm_api_key,
    timeout=30.0,
    max_retries=2,
)
```

On a LAN the added latency is ~1 ms per call — irrelevant next to model time.
Over a WAN or VPN it is not; keep both machines in the same rack if you can.

### Fail loudly at startup

Add a health check so a misconfigured endpoint surfaces on deploy rather than in
front of a user:

```python
# backend/app/main.py — on startup
try:
    get_pipeline().client.models.list()
    logger.info("LLM server reachable at %s", settings.llm_base_url)
except Exception as e:
    logger.error("LLM SERVER UNREACHABLE at %s: %s", settings.llm_base_url, e)
```

Also extend `/health` to report both endpoints, so monitoring catches a model
server that dies at 3 a.m.

### What breaks when the model server goes down

Every data question fails; conversation history, login and the facility filter
keep working because they use MySQL and ClickHouse directly. The user-facing
message is already handled — `event_generator()` catches the exception and sends
the friendly error, with the real cause going to the console via
`log_sql_failure()`. Worth testing deliberately: stop `vllm-sql` and confirm the
UI degrades cleanly instead of hanging.

---

## Reference: scaling beyond Tier 2

Tier 2 handles ~20–25 concurrent users. For the 500-concurrent production
target:

| | Tier 2 (this guide) | 500-user production |
|---|---|---|
| GPUs | 1× RTX PRO 6000 96 GB | 3–4× RTX PRO 6000 96 GB |
| Capital cost (all-in, INR) | ~₹30 L | ~₹69 L |
| Concurrent turns | 20–25 | ~80 in-flight (500 sessions) |

Buying the 4U chassis, redundant 2000 W PSUs, a 4-slot board, 256 GB RAM and a
6 kVA UPS at Tier 2 means the upgrade is +3 GPUs, not a new platform.

The optimisations in section 6 are worth roughly **₹50 L of hardware** — do them
before buying more GPUs.
