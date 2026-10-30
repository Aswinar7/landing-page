# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: security leaders (CISOs and security teams) who are accountable for the risk of AI agents acting inside their organisation, deciding whether to trust and adopt a control layer for those agents.

Secondary: the AI / platform engineers who implement it (install the SDK, wire agents to tools). The landing page serves them, but its argument is aimed at the security buyer.

## Product Purpose

AgentDNA is a security layer for AI agents. It gives every agent a verifiable identity, enforces what the agent can access, and records every action, so teams can deploy autonomous AI with confidence.

Success on the website means a security leader understands what AgentDNA checks between a user's prompt and an agent's output, and starts the Free Security Health Check.

## Positioning

AgentDNA checks every hand-off in an agent's work, not just the login at the start: user → agent → tool → SaaS app → output. Three layers carry that:

- **CoCA (Chain of Custody Authentication)**: identifies the user and the intent, matches the request to a registered agent, and creates a signed custody chain that follows the work. It re-checks that each action still matches the original intent.
- **CBAC (Context Based Access Control)**: checks controls and permissions before an agent reaches a tool, application or data source, granting only the scope the situation allows (e.g. read granted, write denied).
- **Provenance**: records the output and the full chain as evidence, so security teams can trace any action back to the event that started it.

## Operating Context

- Agents act across tools, APIs, MCP servers and SaaS apps; AgentDNA sits on every one of those connections.
- Engineers integrate it by installing the AgentDNA SDK, authenticating with an API key and organisation ID, and wrapping the agent's inference calls with AgentDNA middleware.
- Security teams work in an AgentDNA dashboard with six areas: Discover, Observe, Identify, Control, Detect, Investigate.
- The landing page's source of truth is the Figma file **AgentDNA_LandingPage** (file key `RanhjCICdcwhA9MLC9Xa4O`), including the "section 3 bit" frames that define the prompt → output walkthrough.

## Capabilities and Constraints

- Generally available.
- Primary call to action: **Free Security Health Check** (an instant security health score that identifies risks, gaps and control weaknesses across a company's AI agents; it takes 5 minutes to complete and produces a customised report). Secondary: **Get A Demo**. The SDK quick-start supports the engineer audience but is not the main conversion.
- Navigation and footer link labels are not fixed: sensible guesses or placeholders are acceptable until real pages exist (currently "Item 1–5", "Sub 1 / Page 1").

## Brand Commitments

- Name: **AgentDNA**. Logo: the navy hexagon emblem with a white three-part DNA helix (`assets/logo-emblem.png`, `assets/logo-mark.svg`).
- Product terms used as written: CoCA, CBAC, Provenance; the walkthrough steps "User Gives a prompt", "CoCA Identifies", "CBAC Check", "Actions Validated", "Everything is recorded".
- Binding visual constraint from the owner: use only the fonts and colours from the Figma file, and keep the site in light mode (dark mode was explicitly rejected).

## Evidence on Hand

- None confirmed. No customer names or logos, no certifications, no confirmed metrics.
- Every number currently on the page is a placeholder, not a claim: "Secure your Agentic in <1 Min", the dashboard figures (34 agents, 22 apps, 98.39% reliability, 120 threats), and demo data in the walkthrough (users, sessions, chain IDs, timings).
- Future work must not invent testimonials, customer logos, compliance badges or performance numbers.

## Product Principles

1. Show the mechanism, not adjectives: prove trust by showing what is checked at each hand-off.
2. Write for the accountable security leader: traceability, control and evidence come before developer convenience.
3. Every action has a chain: identity, permission and record stay connected from prompt to output.
4. Deny visibly: blocked actions (out-of-scope access) are part of the story, not hidden.
5. No fabricated proof: until real evidence exists, demonstrate the product instead of claiming results.
