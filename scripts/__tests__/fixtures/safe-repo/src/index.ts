// A perfectly safe MCP server — no dangerous patterns
const SERVER_NAME = "safe-example";
const SERVER_VERSION = "1.0.0";

interface Tool {
  name: string;
  description: string;
}

const tools: Tool[] = [
  { name: "hello", description: "Says hello" },
  { name: "add", description: "Adds two numbers" },
];

function handleRequest(toolName: string, args: Record<string, unknown>) {
  const tool = tools.find((t) => t.name === toolName);
  if (!tool) {
    return { error: `Unknown tool: ${toolName}` };
  }
  if (toolName === "hello") {
    return { result: "Hello from safe MCP server!" };
  }
  if (toolName === "add") {
    const a = Number(args.a);
    const b = Number(args.b);
    return { result: a + b };
  }
  return { error: "Unhandled tool" };
}

console.log(`${SERVER_NAME} v${SERVER_VERSION} started`);
export { handleRequest, tools };
