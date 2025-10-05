# TypeScript MCP Server

An MCP (Model Context Protocol) server that provides easy access to documentation for TypeScript, Zod, Drizzle ORM, Vitest, and Next.js.

## Features

This MCP server provides:

- **Resources**: Direct access to documentation sections for all five technologies
- **Tools**: Utilities to retrieve documentation URLs and list all available docs
- **Prompts**: Pre-configured prompts to help with common tasks in each technology

### Supported Technologies

1. **TypeScript** - The typed superset of JavaScript
   - Handbook, Reference, TSConfig documentation

2. **Zod** - TypeScript-first schema validation
   - Introduction, Primitives, Objects, Arrays, Validation

3. **Drizzle ORM** - TypeScript ORM for SQL databases
   - Get Started, Schemas, Queries, Migrations

4. **Vitest** - Fast unit testing framework
   - Guide, API, Config, Mocking

5. **Next.js** - The React Framework
   - Getting Started, App Router, Pages Router, API Reference

## Installation

```bash
npm install
npm run build
```

## Usage

### As a standalone MCP server

The server runs on stdio and can be integrated with any MCP client:

```bash
node build/index.js
```

### With Claude Desktop

Add this to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "typescript-docs": {
      "command": "node",
      "args": ["/absolute/path/to/typescript-mcp/build/index.js"]
    }
  }
}
```

## Available Resources

Resources are accessed via URIs in the format: `docs://{technology}/{section}`

Examples:
- `docs://typescript/handbook` - TypeScript Handbook
- `docs://zod/primitives` - Zod Primitives documentation
- `docs://drizzle/queries` - Drizzle ORM queries
- `docs://vitest/guide` - Vitest guide
- `docs://nextjs/app-router` - Next.js App Router

## Available Tools

### get_docs_url

Get the documentation URL for a specific technology and optional section.

```json
{
  "technology": "typescript",
  "section": "handbook"
}
```

### list_all_docs

List all available documentation resources with their URLs.

```json
{}
```

## Available Prompts

- **typescript_help**: Get help with TypeScript features and syntax
- **zod_validation**: Get help with Zod schema validation
- **drizzle_query**: Get help with Drizzle ORM queries
- **vitest_testing**: Get help with Vitest testing
- **nextjs_routing**: Get help with Next.js routing and features

Each prompt accepts optional arguments to provide more specific guidance.

## Development

### Build

```bash
npm run build
```

### Watch mode

```bash
npm run watch
```

## License

MIT