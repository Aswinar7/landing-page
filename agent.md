# AgentDNA: product brief

> AgentDNA is the security layer for AI agents. It verifies every agent's identity and delegated authority, enforces context-aware access throughout agentic workflows, and keeps tamper-evident proof of every protected interaction.

This page describes AgentDNA for AI assistants, answer engines and the people using them. It is kept in line with the homepage at https://agentdna.io.

- Website: https://agentdna.io
- Documentation: https://docs.agentdna.io
- Dashboard (sign up for an API key): https://dashboard.agentdna.io
- Python SDK: `pip install agent-dna`

## What AgentDNA is

AI agents now act on people's behalf inside tools, APIs, MCP servers and SaaS apps. Security that checks only the login at the start of a session can't see what an agent does after that. AgentDNA is a security platform that gives organizations visibility, control and trust across their AI agent ecosystem. It operates within the tools, APIs, MCP servers and SaaS apps agents use, so every action is identified, authorized and recorded, wherever it happens.

In short, AgentDNA lets a team:

- **Know every agent.** Who an agent is, who built it, who it acts for and what it's for.
- **Govern every interaction.** What the agent may do, checked at the moment it acts.
- **Prove every decision.** A tamper-evident record of what happened, and why it was allowed or denied.

## Who it's for

- **Security leaders and security teams** (for example CISOs) who are accountable for the risk of AI agents acting inside their organization.
- **AI and platform engineers** who build agents and connect them to tools. They add AgentDNA with the SDK.

## The three pillars

### 1. Evolved Identity (GRADE)

Identity goes beyond an identifier. It covers ownership, inherited roles, delegated authority, historical actions and relationships. GRADE continuously establishes and verifies an agent's identity through its evolving behavior and a live graph of delegation.

### 2. Contextual Access (CBAC)

CBAC enforces zero-trust, short-lived, least-privilege access for each interaction, not per session. It evaluates each request through the intersection of user authority, delegated authority, agent permissions, policies, intent and context. An agent can be granted read access for a task while write access is denied.

### 3. Irrefutable Auditing (Provenance)

AgentDNA creates immutable, tamper-evident records of every interaction, identity shift and authorization decision. That gives accountability, end-to-end traceability and unified evidence across the entire workflow. Security teams get a clear line back to the event that started any action, not a trail of disconnected logs.

## How it works: from user to output

1. **User gives a prompt.** A person asks an agent to do something. AgentDNA notes who asked and what they asked for.
2. **GRADE identifies.** GRADE verifies the user and the agent acting for them, and links both into one signed custody chain.
3. **CBAC check.** Before any tool is reached, CBAC checks what this agent may do for this task. Anything out of scope is blocked.
4. **Actions validated.** Each tool call is matched to the original intent and signed before it reaches the app.
5. **Everything is recorded.** The output and every step behind it are written to the Provenance Layer, ready to audit.

## How security rules change once agents act

| Before agents | With AgentDNA |
|---|---|
| An API key was the identity. | The key is one part; identity also covers who built the agent, who it acts for and what it's for (Identifier ∈ Identity). |
| An agent acting for you got everything you could do. | It gets only the slice of your authority the task needs (Delegated Authority ⊆ User Authority). |
| Rules lived in docs and prompts; agents were trusted to follow them. | Every rule is checked the moment the agent acts (Policies ⇒ Runtime Enforcement). |
| If the permission existed, the action went through. | An action runs only where policy, intent, delegation and the current step all agree. |
| Logs listed what happened, one line at a time. | Every action links back to the prompt that started it, and every link can be proven. |
| An identity was issued once and never changed. | Identity grows with the agent, but only by what has been verified. |

## The dashboard

Security teams use the AgentDNA Dashboard to:

- **Observe** every action: trace each hand-off from prompt to agent to tool in one connected chain.
- **Visualize** every connection: see the agents, applications and capabilities across an environment and how they connect.
- **Investigate** every incident: follow the signed custody chain back to the event that started it.
- **Control** every permission: approve agents before they go live, and check what an agent may do before it reaches a tool, application or data source.

## Getting started (engineers)

1. **Install the SDK.** Run `pip install agent-dna`, then create an AgentDNA instance for each user, agent and tool.
2. **Get an API key.** Sign up at https://dashboard.agentdna.io. The SDK uses the key to register each actor on the Provenance Layer.
3. **Secure your agent.** Verify every incoming workflow, build a signed envelope for each action, and record the result on the Provenance Layer.

```python
from agentdna import AgentDNA

agent = AgentDNA("Assistant", "agent", api_key=API_KEY)

code = agent.verify(workflow)        # GRADE: verify the incoming workflow
wf = agent.build(result, workflow)   # build a signed envelope for the action
card_id, tx = agent.record(wf)       # record it on the Provenance Layer
```

See https://docs.agentdna.io for the full SDK reference.

## Glossary

- **GRADE:** AgentDNA's identity layer. It verifies the user and the agent, and maintains the signed chain of custody and delegation.
- **CBAC (Context Based Access Control):** AgentDNA's access layer. It grants only the scope the situation allows, per interaction.
- **Provenance Layer:** AgentDNA's record of every interaction, identity shift and authorization decision, kept tamper-evident for audit.
- **Custody chain:** the signed link from a user's prompt through each agent and tool to the output.

## Contact

- Book a demo from https://agentdna.io ("Get A Demo").
- Security Health Check: an instant security health score that identifies risks, gaps and control weaknesses across your agentic workflows, available from the homepage.
