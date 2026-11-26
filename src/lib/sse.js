// Splits a buffer of Server-Sent Events into parsed events plus the unfinished rest.
export function parseSse(buffer) {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop();
  const events = blocks
    .filter((block) => block.startsWith("data: "))
    .map((block) => JSON.parse(block.slice(6)));
  return { events, rest };
}
