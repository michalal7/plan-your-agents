// The MCP surface: resources (the KB files, read live from disk), a search tool
// (semantic or lexical — see search.ts), and a setup-agents prompt that mirrors
// the PLAYBOOK flow. The server only retrieves knowledge — all reasoning and
// planning stays in the client model.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listKnowledgeFiles, readKnowledgeFile } from "./kb.js";
import type { Searcher, SearchVariant } from "./search.js";

const RESOURCE_PREFIX = "kb://claude-agents/";

// Both retrieval variants expose the identical MCP surface — same resources,
// same tool name, same output shape, same prompt. Only the server name and the
// retrieval-specific wording differ, so a client can tell which path is running.
const SERVER_NAME: Record<SearchVariant, string> = {
  semantic: "claude-agents-kb",
  lexical: "claude-agents-kb-lexical",
};

function instructions(variant: SearchVariant): string {
  const lookup =
    variant === "lexical"
      ? "Use search_knowledge for keyword lookup (English queries); it retrieves sections, it does not plan."
      : "Use search_knowledge for semantic lookup; it retrieves sections, it does not plan.";
  return [
    "Knowledge base about setting up Claude Code agent systems.",
    "Resources expose the KB files (INDEX, PLAYBOOK, numbered topic files).",
    lookup,
    "Use the setup-agents prompt for a guided setup flow — the reasoning stays with you.",
  ].join(" ");
}

function searchDescription(variant: SearchVariant): string {
  const how =
    variant === "lexical"
      ? "Keyword (BM25) search over the knowledge base about Claude Code agent setups. " +
        "Phrase the query in English — the knowledge base is English and matching is " +
        "lexical, not cross-lingual. Exact tokens (flag names, /commands, env vars) match well. "
      : "Semantic search over the knowledge base about Claude Code agent setups. ";
  return (
    how +
    "Returns the most relevant sections with their source file and heading. " +
    "Retrieval only — the reasoning stays with you."
  );
}

export interface ServerDeps {
  kbDir: string;
  searcher: Searcher;
}

export function createServer({ kbDir, searcher }: ServerDeps): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME[searcher.variant], version: "0.1.0" },
    { instructions: instructions(searcher.variant) },
  );

  // (a) Resources — one per knowledge file, read live from disk so the server
  //     never forks the KB content and always reflects the current markdown.
  for (const name of listKnowledgeFiles(kbDir)) {
    server.registerResource(
      name,
      `${RESOURCE_PREFIX}${name}`,
      {
        title: name,
        description: `claude-agents knowledge base — ${name}`,
        mimeType: "text/markdown",
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: readKnowledgeFile(kbDir, name),
          },
        ],
      }),
    );
  }

  // (b) Tool — search over the KB (semantic or lexical, same contract).
  server.registerTool(
    "search_knowledge",
    {
      title: "Search the claude-agents knowledge base",
      description: searchDescription(searcher.variant),
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe(
            searcher.variant === "lexical"
              ? "Question or keywords, in English"
              : "Natural-language question",
          ),
        topK: z.number().int().min(1).max(20).optional().describe("How many sections to return (default 5)"),
      },
    },
    async ({ query, topK }) => {
      const hits = await searcher.search(query, topK ?? 5);
      if (hits.length === 0) {
        return { content: [{ type: "text", text: "No results." }] };
      }
      const text = hits
        .map((h, i) => {
          const where = h.chunk.heading ? `${h.chunk.file} › ${h.chunk.heading}` : h.chunk.file;
          return (
            `### ${i + 1}. ${where}  (score ${h.score.toFixed(3)})\n` +
            `resource: ${RESOURCE_PREFIX}${h.chunk.file}\n\n` +
            h.chunk.text
          );
        })
        .join("\n\n---\n\n");
      return { content: [{ type: "text", text }] };
    },
  );

  // (c) Prompt — mirrors the PLAYBOOK flow for prompt-capable clients.
  server.registerPrompt(
    "setup-agents",
    {
      title: "Guided Claude Code agent setup",
      description:
        "Guided flow mirroring PLAYBOOK-agent-design.md: choose the orchestration " +
        "level, define the verification loop first, derive a minimal setup — grounded " +
        "in this knowledge base. The reasoning happens in your model.",
      argsSchema: {
        repo: z.string().optional().describe("Path or short description of the target repo"),
        mode: z.enum(["advise", "apply"]).optional().describe("advise (read-only) or apply"),
      },
    },
    ({ repo, mode }) => ({
      messages: [
        {
          role: "user",
          content: { type: "text", text: buildSetupPrompt(repo, mode) },
        },
      ],
    }),
  );

  return server;
}

function buildSetupPrompt(repo?: string, mode?: "advise" | "apply"): string {
  const target = repo?.trim() || "the current repository";
  const applyMode = mode === "apply";
  return `You advise on the Claude Code agent setup for ${target}, relying EXCLUSIVELY on the "claude-agents" knowledge base this MCP server provides. Invent nothing; where the KB leaves something open, say so. The reasoning is yours — the server only supplies knowledge.

Mode: ${applyMode ? "apply — after explicit confirmation, create files (do NOT overwrite existing ones without asking)." : "advise (read-only) — only recommend, write no files."}

Flow:
1. Load the KB: first read the resource ${RESOURCE_PREFIX}PLAYBOOK-agent-design.md (decision tree §1, verification loops §2, minimal setup §3, patterns §4, anti-patterns §5). For details, use the search_knowledge tool and read the relevant resources (${RESOURCE_PREFIX}00-…, 10-…, …). Claim nothing from memory about flags/settings/modes — the KB is authoritative.
2. Scan the repo (read-only): language/stack, test/build/lint commands, existing .claude/, repo size/monorepo, domain (backend/frontend/mobile/data/non-code).
3. Decide (PLAYBOOK §1+§2): orchestration level via the decision tree (single agent → subagents → Agent View → worktrees → Agent Teams → dynamic workflow; the first matching row wins). State the two guiding questions: Do workers need to talk? Should the orchestration be repeatable? — And fix the verification loop FIRST (the most important lever), matched to the domain. No loop, no recommendation.
4. Derive the minimal setup (§3, context minimalism): propose concretely and for each point say what deliberately should NOT go in (§5): CLAUDE.md (build/test/lint, hard conventions, grounding rule), .claude/settings.json (allowlist + 1–2 sensible hooks), .claude/agents/ only for recurring roles, .claude/commands/ only for >1×/day.
5. Output: **the verdict first** — one sentence on what to do (including "nothing needs changing" when that is the honest result) plus an effort class (minutes/hours/days) as a declared estimate, before any reasoning. Then the compact, directive recommendation: orchestration level + rationale, the verification loop, the minimal setup with concrete file contents. Close with a sweep of the §5 anti-patterns that attach to the recommendation as a whole rather than to a single item — **run that sweep even when the verdict is "nothing needs changing"**, since a recommendation to change nothing still has to show it checked.${applyMode ? "\n6. Apply (only after confirmation): create missing files; then name what was created and what still needs checking." : ""}

Every number and every attribution ("file X says Y") must come from something you read in this run, not from recall — this covers counts and versions, not just flags and settings. A precise-sounding figure you did not verify is worse than none, because the reader cannot tell it apart from a checked one. Declared estimates (the effort class) are exempt; label them as estimates.

Plan-file formatting — the section skeleton, the length cap, the plain-language companion lines — lives in the setup-dev-agents / setup-task-agents skills, which write a plan file. It is deliberately not repeated here: you may not be writing a file at all.

Heed ⚠️ markings (uncertain items) and 90-deprecated.md. Recognize non-code repos (doc/knowledge vault): don't force a code setup on them — then the verification loop = source fidelity, and the setup is usually just CLAUDE.md conventions.`;
}
