# DesiGuard Hackathon Start Here

## Track 3 Reality Check

You are in Track 3: Unicorn / Open Innovation.

That means:

- Do not optimize for the Track 1 Fireworks task format.
- Do not spend time building a judged Docker agent unless you want it for deployment.
- You must show real AMD compute usage, or the project can be disqualified.
- The most important submission artifacts are the GitHub repo, slide deck PDF, demo video, and preferably a live demo URL.

Fireworks API can be used as a temporary development fallback, but it is not the core story for Track 3. The core story should be:

> DesiGuard runs multilingual AI safety audits at scale using vLLM served on AMD ROCm / MI300X-class compute.

## What You Are Building

DesiGuard is a multilingual AI safety audit platform for South Asian languages.

The product question is:

> A chatbot may refuse harmful requests in English. Does it still refuse them in Urdu, Punjabi Shahmukhi, Pashto, or Sindhi?

The demo should show:

1. Choose a target model.
2. Choose languages and harm categories.
3. Run an audit.
4. See refusal/compliance/risk results.
5. Compare translated prompts vs native-adapted prompts.
6. Export a report.

The dashboard's hero chart should be the Translation vs Native Delta chart, because that proves the product insight.

## Stack Decision

Use this stack unless there is a very strong reason not to:

- Backend: FastAPI + Python 3.11
- Database: SQLite + SQLAlchemy
- Background jobs: FastAPI BackgroundTasks
- Frontend: Next.js + TypeScript + Tailwind
- Charts: Recharts
- Inference: vLLM OpenAI-compatible server on AMD ROCm
- Report export: HTML report first; PDF export only if time allows

Cut first if time is tight:

- RAG target support
- PDF export
- full auth
- Docker Compose
- extra languages beyond the planned four

Do not cut:

- AMD usage proof
- dataset safety notes
- native-adapted prompt track
- dashboard with real metrics
- README section explaining ROCm/vLLM usage

## What ROCm and vLLM Mean

ROCm is AMD's GPU software stack. Think of it as the AMD-side equivalent of the CUDA ecosystem.

vLLM is a high-throughput LLM serving engine. For your app, the nice part is that it can expose an OpenAI-compatible HTTP API, so your backend can call it like a normal model endpoint.

The architecture should be:

```text
Next.js UI
  -> FastAPI backend
  -> DesiGuard audit agents
  -> OpenAI-compatible vLLM endpoint
  -> AMD ROCm GPU instance
```

## AMD Credit Situation

If AMD Developer Cloud credits are approved:

1. Start with vLLM on the AMD instance before building fancy UI.
2. Serve one small/medium instruct model.
3. Prove it with a raw curl request.
4. Save benchmark numbers in `benchmarks.md`.
5. Screenshot terminal output for the slide deck.

If credits are not approved yet:

1. Keep building the app with a provider abstraction.
2. Use a local/mock/OpenAI-compatible fallback for development.
3. Keep `VLLM_BASE_URL` in `.env.example`.
4. Message hackathon organizers and ask for credit status immediately.
5. Ask whether a teammate has approved credits.
6. Do not submit without some real AMD compute evidence if the rules still require it.

Important: a mock AMD path is not enough for Track 3. It can help you keep coding, but the final deck/repo should show real AMD usage.

## First AMD vLLM Smoke Test

On the AMD GPU instance, the simplest target is to run AMD's prebuilt ROCm vLLM Docker image, then serve a small instruct model.

Example shape:

```bash
docker run -it --network=host --group-add=video --ipc=host \
  --cap-add=SYS_PTRACE --security-opt seccomp=unconfined \
  --privileged --device /dev/kfd --device /dev/dri \
  rocm/vllm:latest
```

Inside the container:

```bash
vllm serve Qwen/Qwen2-7B-Instruct
```

From another shell:

```bash
curl http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen2-7B-Instruct",
    "prompt": "Say hello from DesiGuard in one sentence.",
    "max_tokens": 64,
    "temperature": 0.2
  }'
```

Once that works, your backend only needs a configurable OpenAI-compatible client pointed at:

```text
VLLM_BASE_URL=http://your-amd-instance:8000/v1
VLLM_MODEL=Qwen/Qwen2-7B-Instruct
```

## Day 1 Checklist

- Create repo skeleton.
- Add `.env.example`.
- Add backend FastAPI app with `/health`.
- Add SQLite models for targets, prompts, audit runs, audit results, reports.
- Add seed prompt JSON schema.
- Write 20 English sanitized seed prompts.
- Create translated prompt files for Urdu, Punjabi Shahmukhi, Pashto, Sindhi.
- Try AMD/vLLM setup as early as possible.
- Save the first successful curl output and first benchmark numbers.

## Day 2 Checklist

- Build the audit pipeline:
  - prompt builder
  - execution agent
  - judge agent
  - reporting agent
- Add endpoint flow:
  - create audit
  - run audit
  - poll status
  - fetch results
- Hand-write native-adapted prompts with a native speaker if possible.
- Build frontend shell and typed API client.

## Day 3 Checklist

- Wire audit config page.
- Wire live run page.
- Wire results dashboard.
- Make Translation vs Native Delta the most visible chart.
- Generate a simple report page.
- Run the final AMD benchmark.

## Day 4 Checklist

- Seed one polished demo run so the demo is reliable.
- Record demo video.
- Finalize README.
- Add architecture diagram.
- Add benchmark table.
- Add sample report.
- Export slide deck PDF.
- Test the repo from a fresh clone.

## README Must Include

- One-paragraph pitch
- Problem
- Solution
- Architecture diagram
- AMD/ROCm/vLLM usage with benchmark numbers
- Setup instructions
- Demo link/video link
- Dataset and safety note
- API reference
- Roadmap
- Team

## Pitch Deck Must Include

1. Hook: "Your chatbot refuses harmful requests in English. Does it refuse them in Urdu?"
2. Problem: English-centric safety testing misses South Asian language risk.
3. Solution: dual-track audit, translation baseline vs native-adapted prompts.
4. Product demo screenshot.
5. Architecture and agent pipeline.
6. AMD ROCm/vLLM usage and benchmarks.
7. Market/customer story.
8. Dataset depth and validation.
9. Roadmap.
10. Close.

## The Immediate Next Move

Do this first:

1. Scaffold the backend and frontend.
2. Add the OpenAI-compatible inference client abstraction.
3. Build against a local/mock endpoint while waiting for AMD credits.
4. As soon as credits arrive, point the same client at vLLM on ROCm.

That keeps the app moving without losing the AMD story.
