
# PromptForge 🔐
### LLM Red Teaming & Prompt Injection Research Platform

Built this during my security research at Tensai Ventures 
after realising there was no structured way to test LLM 
guardrail bypass techniques. ← YOUR WORDS

---

## What it does

- Tests LLMs against prompt injection attack patterns
- Classifies prompts as safe / injection / jailbreak
- Maps successful bypasses to OWASP LLM Top 10
- Generates structured red team reports per session

---

## Why I built it

During penetration testing internships I saw SQL injection, 
XSS, IDOR — but nobody was systematically testing AI 
systems the same way. PromptForge applies the same 
structured VAPT methodology to LLMs. ← YOUR WORDS

---

## Architecture



<img width="780" height="786" alt="image" src="https://github.com/user-attachments/assets/63fd6fcd-0836-420b-884a-9452d0455ddf" />


---

## Tech Stack

- Python / TypeScript
- Gemini API (Google AI Studio)
- OWASP LLM Top 10 framework
- Custom attack pattern library

---

## Hardest part building this

Handling multi-turn jailbreak attempts — single turn 
detection was easy, but conversations that gradually 
escalate needed a different approach. 

---
## Getting Started

**Prerequisites:** Node.js, Gemini API key

1. Clone the repo
   git clone https://github.com/priknowsit/PromptForge

2. Install dependencies
   npm install

3. Add your API key
   Create .env.local → add GEMINI_API_KEY=your_key_here

4. Run locally
   npm run dev


[Write 2-3 genuine lines here] ← MUST BE YOUR WORDS
