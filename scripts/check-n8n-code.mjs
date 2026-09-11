import fs from "node:fs";

const files = process.argv.slice(2);
if (!files.length) throw new Error("Pass one or more n8n Code node files");
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  // n8n evaluates Code node snippets inside a function-like context,
  // where a top-level `return` and (for API nodes) `await` are valid.
  // AsyncFunction checks syntax without executing the snippet or requiring
  // n8n globals.
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  new AsyncFunction("$input", "$", source);
  console.log(`syntax: OK ${file}`);
}
