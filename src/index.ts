#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Documentation URLs for each technology
const DOCS = {
  typescript: {
    name: "TypeScript",
    baseUrl: "https://www.typescriptlang.org/docs/",
    sections: [
      { id: "handbook", title: "Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" },
      { id: "reference", title: "Reference", url: "https://www.typescriptlang.org/docs/handbook/utility-types.html" },
      { id: "tsconfig", title: "TSConfig Reference", url: "https://www.typescriptlang.org/tsconfig" },
    ],
  },
  zod: {
    name: "Zod",
    baseUrl: "https://zod.dev/",
    sections: [
      { id: "introduction", title: "Introduction", url: "https://zod.dev/" },
      { id: "primitives", title: "Primitives", url: "https://zod.dev/#primitives" },
      { id: "objects", title: "Objects", url: "https://zod.dev/#objects" },
      { id: "arrays", title: "Arrays", url: "https://zod.dev/#arrays" },
      { id: "validation", title: "Validation", url: "https://zod.dev/#refine" },
    ],
  },
  drizzle: {
    name: "Drizzle ORM",
    baseUrl: "https://orm.drizzle.team/docs/",
    sections: [
      { id: "get-started", title: "Get Started", url: "https://orm.drizzle.team/docs/get-started" },
      { id: "schemas", title: "Schemas", url: "https://orm.drizzle.team/docs/sql-schema-declaration" },
      { id: "queries", title: "Queries", url: "https://orm.drizzle.team/docs/crud" },
      { id: "migrations", title: "Migrations", url: "https://orm.drizzle.team/docs/migrations" },
    ],
  },
  vitest: {
    name: "Vitest",
    baseUrl: "https://vitest.dev/",
    sections: [
      { id: "guide", title: "Guide", url: "https://vitest.dev/guide/" },
      { id: "api", title: "API", url: "https://vitest.dev/api/" },
      { id: "config", title: "Config", url: "https://vitest.dev/config/" },
      { id: "mocking", title: "Mocking", url: "https://vitest.dev/guide/mocking.html" },
    ],
  },
  nextjs: {
    name: "Next.js",
    baseUrl: "https://nextjs.org/docs",
    sections: [
      { id: "getting-started", title: "Getting Started", url: "https://nextjs.org/docs/getting-started" },
      { id: "app-router", title: "App Router", url: "https://nextjs.org/docs/app" },
      { id: "pages-router", title: "Pages Router", url: "https://nextjs.org/docs/pages" },
      { id: "api-reference", title: "API Reference", url: "https://nextjs.org/docs/app/api-reference" },
    ],
  },
};

// Create server instance
const server = new Server(
  {
    name: "typescript-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = [];
  
  for (const [key, doc] of Object.entries(DOCS)) {
    for (const section of doc.sections) {
      resources.push({
        uri: `docs://${key}/${section.id}`,
        name: `${doc.name} - ${section.title}`,
        description: `${doc.name} documentation: ${section.title}`,
        mimeType: "text/html",
      });
    }
  }
  
  return { resources };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const match = uri.match(/^docs:\/\/([^\/]+)\/([^\/]+)$/);
  
  if (!match) {
    throw new Error(`Invalid URI format: ${uri}`);
  }
  
  const [, docType, sectionId] = match;
  const doc = DOCS[docType as keyof typeof DOCS];
  
  if (!doc) {
    throw new Error(`Unknown documentation type: ${docType}`);
  }
  
  const section = doc.sections.find((s) => s.id === sectionId);
  
  if (!section) {
    throw new Error(`Unknown section: ${sectionId} for ${docType}`);
  }
  
  return {
    contents: [
      {
        uri,
        mimeType: "text/html",
        text: `# ${doc.name} - ${section.title}\n\nDocumentation URL: ${section.url}\n\nThis resource provides a reference to the ${doc.name} documentation section on ${section.title}. Visit the URL above to access the full documentation.`,
      },
    ],
  };
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_docs_url",
        description: "Get the documentation URL for a specific technology and topic",
        inputSchema: {
          type: "object",
          properties: {
            technology: {
              type: "string",
              enum: ["typescript", "zod", "drizzle", "vitest", "nextjs"],
              description: "The technology to get documentation for",
            },
            section: {
              type: "string",
              description: "Optional specific section ID (e.g., 'handbook', 'primitives', 'queries')",
            },
          },
          required: ["technology"],
        },
      },
      {
        name: "list_all_docs",
        description: "List all available documentation resources with their URLs",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "get_docs_url") {
    const technology = args?.technology as keyof typeof DOCS;
    const sectionId = args?.section as string | undefined;
    
    if (!technology || !DOCS[technology]) {
      throw new Error(`Invalid technology: ${technology}`);
    }
    
    const doc = DOCS[technology];
    
    if (sectionId) {
      const section = doc.sections.find((s) => s.id === sectionId);
      if (!section) {
        throw new Error(`Unknown section: ${sectionId} for ${technology}`);
      }
      
      return {
        content: [
          {
            type: "text",
            text: `${doc.name} - ${section.title}\nURL: ${section.url}`,
          },
        ],
      };
    }
    
    // Return all sections for the technology
    const sectionsList = doc.sections
      .map((s) => `- ${s.title} (${s.id}): ${s.url}`)
      .join("\n");
    
    return {
      content: [
        {
          type: "text",
          text: `${doc.name} Documentation\nBase URL: ${doc.baseUrl}\n\nAvailable sections:\n${sectionsList}`,
        },
      ],
    };
  }
  
  if (name === "list_all_docs") {
    let result = "# Available Documentation\n\n";
    
    for (const [key, doc] of Object.entries(DOCS)) {
      result += `## ${doc.name}\n`;
      result += `Base URL: ${doc.baseUrl}\n\n`;
      result += "Sections:\n";
      for (const section of doc.sections) {
        result += `- ${section.title} (${section.id}): ${section.url}\n`;
      }
      result += "\n";
    }
    
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "typescript_help",
        description: "Get help with TypeScript features and syntax",
        arguments: [
          {
            name: "topic",
            description: "The TypeScript topic to get help with",
            required: false,
          },
        ],
      },
      {
        name: "zod_validation",
        description: "Get help with Zod schema validation",
        arguments: [
          {
            name: "schema_type",
            description: "The type of schema to create (object, array, primitive, etc.)",
            required: false,
          },
        ],
      },
      {
        name: "drizzle_query",
        description: "Get help with Drizzle ORM queries",
        arguments: [
          {
            name: "query_type",
            description: "The type of query (select, insert, update, delete)",
            required: false,
          },
        ],
      },
      {
        name: "vitest_testing",
        description: "Get help with Vitest testing",
        arguments: [
          {
            name: "test_type",
            description: "The type of test (unit, mocking, configuration)",
            required: false,
          },
        ],
      },
      {
        name: "nextjs_routing",
        description: "Get help with Next.js routing and features",
        arguments: [
          {
            name: "router_type",
            description: "The router type (app, pages)",
            required: false,
          },
        ],
      },
    ],
  };
});

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "typescript_help") {
    const topic = args?.topic || "general";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with TypeScript${topic !== "general" ? ` regarding ${topic}` : ""}. Can you provide guidance and point me to relevant documentation?`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: `I'd be happy to help with TypeScript! Here are the main documentation resources:\n\n- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html\n- Reference: https://www.typescriptlang.org/docs/handbook/utility-types.html\n- TSConfig: https://www.typescriptlang.org/tsconfig\n\n${topic !== "general" ? `For ${topic}, I recommend checking the handbook first.` : "What specific aspect of TypeScript would you like to learn about?"}`,
          },
        },
      ],
    };
  }
  
  if (name === "zod_validation") {
    const schemaType = args?.schema_type || "general";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with Zod schema validation${schemaType !== "general" ? ` for ${schemaType}` : ""}. How do I create and use Zod schemas?`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: `Zod is a TypeScript-first schema validation library. Here are the key resources:\n\n- Introduction: https://zod.dev/\n- Primitives: https://zod.dev/#primitives\n- Objects: https://zod.dev/#objects\n- Arrays: https://zod.dev/#arrays\n- Validation: https://zod.dev/#refine\n\n${schemaType !== "general" ? `For ${schemaType} schemas, check the relevant section above.` : "You can start by importing Zod and defining schemas using z.object(), z.string(), etc."}`,
          },
        },
      ],
    };
  }
  
  if (name === "drizzle_query") {
    const queryType = args?.query_type || "general";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with Drizzle ORM${queryType !== "general" ? ` for ${queryType} queries` : ""}. How do I work with Drizzle?`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: `Drizzle is a TypeScript ORM. Here are the documentation resources:\n\n- Get Started: https://orm.drizzle.team/docs/get-started\n- Schemas: https://orm.drizzle.team/docs/sql-schema-declaration\n- Queries (CRUD): https://orm.drizzle.team/docs/crud\n- Migrations: https://orm.drizzle.team/docs/migrations\n\n${queryType !== "general" ? `For ${queryType} operations, check the CRUD documentation.` : "Start by defining your schema, then you can perform queries using the fluent API."}`,
          },
        },
      ],
    };
  }
  
  if (name === "vitest_testing") {
    const testType = args?.test_type || "general";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with Vitest${testType !== "general" ? ` for ${testType}` : ""}. How do I write and run tests?`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: `Vitest is a blazing fast unit test framework. Here are the resources:\n\n- Guide: https://vitest.dev/guide/\n- API: https://vitest.dev/api/\n- Config: https://vitest.dev/config/\n- Mocking: https://vitest.dev/guide/mocking.html\n\n${testType !== "general" ? `For ${testType}, check the relevant section above.` : "You can write tests using describe(), it(), and expect() similar to Jest."}`,
          },
        },
      ],
    };
  }
  
  if (name === "nextjs_routing") {
    const routerType = args?.router_type || "app";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I need help with Next.js${routerType !== "general" ? ` using the ${routerType} router` : ""}. How do I set up routing?`,
          },
        },
        {
          role: "assistant",
          content: {
            type: "text",
            text: `Next.js is a React framework with powerful routing capabilities. Here are the docs:\n\n- Getting Started: https://nextjs.org/docs/getting-started\n- App Router: https://nextjs.org/docs/app\n- Pages Router: https://nextjs.org/docs/pages\n- API Reference: https://nextjs.org/docs/app/api-reference\n\n${routerType === "app" ? "The App Router is the recommended approach for new projects, using the app directory." : routerType === "pages" ? "The Pages Router uses the pages directory for file-based routing." : "Next.js offers two routing solutions: App Router (recommended) and Pages Router."}`,
          },
        },
      ],
    };
  }
  
  throw new Error(`Unknown prompt: ${name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TypeScript MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
