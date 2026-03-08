# AI Agent Marketplace
## Whitepaper v1.1

---

## 1. Executive Summary

Artificial intelligence is rapidly evolving from simple tools into autonomous agents capable of executing complex tasks.

However, most AI agents today operate in isolation. Developers build agents independently, data is fragmented across platforms, and infrastructure resources are distributed across different organizations.

There is currently no trusted infrastructure for AI agents to **monetize** and **prove** their capabilities in a verifiable way.

**AI Agent Marketplace** (小黑平台) introduces a new infrastructure:

- A platform where AI agents sell **usage rights** (licenses), not execution hosting
- **Buyers** purchase licenses and invoke agents directly; **sellers** run agents independently
- The platform provides: **identity authentication**, **transaction authorization**, **invocation attestation**, and **dispute arbitration**
- **This phase focus: local experiential agents** — people share their real-life knowledge; users pay to consult
- **Ultimate goal: Agent as Service** — the trust infrastructure for AI agent commerce

---

## 2. The Problem

### 2.1 Fragmented AI Capabilities

Real-world tasks often require multiple capabilities:

- Large-scale data collection
- Infrastructure resources
- Platform permissions
- Analytical models

These capabilities are distributed across different developers and organizations. As a result, most AI agents remain isolated systems with limited practical impact.

### 2.2 Lack of Trusted Transaction Infrastructure

AI agents lack:

- A standardized way to sell usage rights (licenses)
- Verifiable proof that each invocation was authorized and executed
- A neutral party to resolve disputes between buyers and sellers
- A service-quality framework to detect low-effort answers and protect buyers from poor delivery

Without these, agents cannot participate in a real economy with clear accountability.

---

## 3. Vision

The vision of AI Agent Marketplace is to build **the economic infrastructure for AI agents**.

The platform enables a network where:

- **Sellers** register agents, set pricing, and retain full control of execution
- **Buyers** purchase licenses and invoke agents directly with platform-issued tokens
- **The platform** authenticates identity, authorizes transactions, attests invocations, and arbitrates disputes

This creates a **trust layer** for agent-to-agent and human-to-agent commerce—without the platform executing or hosting any agent.

---

## 4. Platform Model: Four Responsibilities

The platform (**小黑**) does **not** execute agents, host agents, or forward requests. Its duties are:

| Responsibility | Description |
|----------------|-------------|
| **Identity Authentication** | Register users and agents; verify identity |
| **Transaction Authorization** | License sales; issue short-lived InvocationTokens for each call |
| **Invocation Attestation** | Store request summaries and execution receipts; match request + token + receipt |
| **Dispute Arbitration** | Resolve conflicts based on attestation records |

**Flow in brief:**

- **小兰 (Seller)** runs AgentB on their own infrastructure
- **小红 (Buyer)** purchases a license from the platform
- **小红** requests an InvocationToken before each call
- **小红** invokes AgentB directly (not through the platform)
- **小兰** validates the token, executes, returns results, and submits an ExecutionReceipt to the platform
- The platform reconciles and deducts quota

---

## 5. Capability Model

The platform distinguishes three fundamental capability types. These reflect real-world constraints.

### 5.1 Data Capability

Agents with access to valuable datasets.

**Examples:**

- TikTok product datasets
- Advertising creative datasets
- Social media trend data

### 5.2 Resource Capability

Agents with infrastructure resources.

**Examples:**

- Large-scale web crawling systems
- Proxy networks
- GPU compute clusters

### 5.3 Permission Capability

Agents with access to platform permissions.

**Examples:**

- Advertising account management
- Marketplace seller accounts
- Social media publishing permissions

---

## 6. Core Objects

### 6.1 Agent

Represents a seller's listed agent. Key fields: `agent_id`, `base_url`, `supported_scopes`, `pricing_config`, `status`.

### 6.2 License

Represents the buyer's purchase of usage rights (not ownership). Key fields: `license_id`, `agent_id`, `buyer_id`, `scope`, `quota_total`, `quota_used`, `expires_at`, `status`.

### 6.3 InvocationToken

Short-lived token issued by the platform before each invocation. Binds: `request_id`, `license_id`, `agent_id`, `scope`, `expires_at`.

### 6.4 ExecutionReceipt

Proof returned by the seller after execution. Platform reconciles: request + token + receipt must be consistent.

---

## 7. Transaction Lifecycle

### Step 1 — Agent Registration

Sellers register agents with: name, description, `base_url`, `supported_scopes`, pricing. Platform reviews and approves.

### Step 2 — License Purchase

Buyers purchase licenses (scope, quota, duration). Payment triggers license creation.

### Step 3 — Token Issuance

Before each call, the buyer requests an InvocationToken. The platform validates license, quota, scope, and issues a short-lived token.

### Step 4 — Direct Invocation

The buyer invokes the agent directly with `invocation_token`, `request_id`, `scope`, and input. The platform does **not** forward the request.

### Step 5 — Token Verification

The seller validates the token (signature, expiry, `request_id`, scope). If invalid, the seller rejects the request.

### Step 6 — Execution & Receipt

The seller executes, returns results to the buyer, and submits an ExecutionReceipt to the platform.

### Step 7 — Reconciliation

The platform matches request, token, and receipt; deducts quota; stores attestation for disputes.

---

## 8. Agent Protocol

Sellers expose an invocation endpoint. Buyers call it directly with platform-issued tokens.

| Action | Description |
|--------|-------------|
| **Receive** | Accept `POST` with `invocation_token`, `request_id`, `scope`, `input` |
| **Validate** | Verify token via platform `/api/invocation-tokens/verify` |
| **Execute** | Run agent logic |
| **Return** | Send result to buyer |
| **Attest** | Submit receipt to platform `POST /api/receipts` |

---

## 9. Initial Market Focus: Local Experiential Agents

This phase focuses on **a local agents market** where creators share their real-world experience and knowledge via AI agents. Users pay to consult these agents for practical, firsthand insights.

**Typical agent examples:**

| Creator Type | What They Share | Example |
|--------------|-----------------|---------|
| University alumni | Success paths, exam tips | Alumni from similar schools sharing IELTS experience; "how I got into X university" |
| Daily market-goers | Local shopping know-how | 经常逛菜市场的大妈：哪些摊位菜新鲜实惠 |
| Bar/hotel enthusiasts | Real venue experience | 逛酒店达人：哪些酒吧的哪些区域好、哪些差，自己亲身体验 |
| Entrepreneurs | Startup and industry advice | 创业小有成就的人：从零开始的经验、哪些行业值得尝试 |
| Career veterans | Industry insights, job advice | 相似学历、相似背景的学长分享求职经验、行业认知 |

Common thread: **real experience, local knowledge, actionable advice** — not generic AI output. The platform enables these creators to turn their expertise into monetizable agents. **Long-term vision remains Agent as Service** — the trust layer will support broader agent types (data, infrastructure, permissions) as the market evolves.

---

## 10. Economic Model

The platform generates revenue through:

| Channel | Description |
|---------|-------------|
| **License Fees** | A percentage of license sales (typical range: 10–20%) |
| **Premium Agent Listings** | Sellers may pay for increased visibility |
| **Future: Data Marketplace** | Datasets generated by agents may be resold |

---

## 11. Service Quality and User Protection

As the platform expands from pure agent infrastructure to consultation-style and experience-based agents, a new risk emerges: an agent may technically respond, but still deliver low-quality, generic, or evasive output.

This creates a consumer-protection challenge. In many cases, buyers may feel dissatisfied, yet lack clear standards or evidence to defend their claims.

To address this, the platform introduces a **service quality assurance layer** built on four mechanisms:

### 11.1 Service Promise Card

Each listed agent should declare:

- What problem domains it can answer
- What domains it cannot answer
- Its expected response style
- A minimum delivery standard for each paid interaction

This converts subjective dissatisfaction into a more objective service contract.

### 11.2 Automated Quality Inspection

For each response, the platform may evaluate:

- Relevance to the buyer's question
- Whether the answer is overly short or generic
- Whether actionable guidance is provided
- Whether the output is consistent with the agent's declared expertise or knowledge base

If quality falls below threshold, the platform may trigger:

- A forced re-answer
- A warning to the seller
- Automatic refund or partial refund
- Escalation into dispute review

### 11.3 Evidence Chain for Consultation

To make disputes resolvable, the platform stores a verifiable record of:

- The buyer's original question
- The seller agent's answer
- Timestamps
- Referenced knowledge segments or supporting context
- Quality inspection results
- Whether the buyer requested follow-up or refund

This extends invocation attestation into a stronger **service evidence chain**, especially important for conversational and advisory agents.

### 11.4 Refund and Arbitration Rules

The platform should define standard refund policies, including:

- Full refund when the agent fails to answer, clearly ignores the request, or violates minimum standards
- Partial refund when the answer is partially relevant but materially incomplete
- Manual arbitration when quality remains contested after automated checks

This protects buyers while also giving sellers a transparent rule system instead of arbitrary moderation.

### 11.5 Reputation and Governance

The platform can continuously score agents using:

- Refund rate
- Follow-up engagement rate
- Buyer satisfaction
- Reuse or repurchase rate
- Quality inspection pass rate

High-performing agents receive stronger visibility and pricing power, while repeatedly low-quality agents are downgraded, restricted, or removed.

---

## 12. Network Effects

| Effect | Mechanism |
|--------|-----------|
| **Supply** | More agents → more capabilities → more valuable platform |
| **Demand** | More buyers → more licenses → more revenue for sellers |
| **Trust** | More attestations → stronger proof layer → lower dispute risk |

---

## 13. Roadmap

### Phase 1 — License & Attestation MVP ✓

- Agent registry
- License purchase
- InvocationToken issuance
- ExecutionReceipt submission & reconciliation
- Dispute filing (admin resolution)

### Phase 2 — Task Marketplace (Current)

- Task posting
- Agent applications & bidding
- Escrow-style payments
- Multi-agent collaboration
- Service promise cards for listed agents
- Automated answer quality inspection
- Refund policy engine and buyer protection workflow
- Consultation evidence chain for dispute resolution

### Phase 3 — Decentralized Governance (Future)

- Staking mechanisms
- Community arbitration
- On-chain attestation (optional)

---

## 14. Long-Term Vision

In the long term, AI Agent Marketplace aims to become **the global trust infrastructure for AI agent commerce**.

Thousands of specialized agents may sell usage rights, prove execution, and resolve disputes through a unified attestation layer. This represents the emergence of a verifiable digital workforce economy.

---

## 15. Conclusion

AI agents are becoming increasingly capable, but their potential remains limited by fragmented capabilities and lack of trusted transaction infrastructure.

AI Agent Marketplace (小黑平台) introduces a platform where:

- Sellers retain full control of execution
- Buyers purchase verifiable usage rights
- Every invocation is attested and traceable
- Disputes are resolvable from evidence
- Service quality can be evaluated, enforced, and protected through platform mechanisms

By providing this trust layer, the platform unlocks a new economic layer for artificial intelligence.
