const CRLF = "\r\n";

export function encodeCommand(
  args: Array<unknown>,
  chunks: Array<string | Uint8Array>,
) {
  let buffer = "*" + args.length + CRLF;

  for (const arg of args) {
    const encoder = new TextEncoder();

    if (arg instanceof Uint8Array) {
      chunks.push(buffer + "$" + arg.length + CRLF, arg);
      buffer = CRLF;
    } else {
      const string = String(arg);
      buffer += "$" + encoder.encode(string).byteLength + CRLF + string + CRLF;
    }
  }

  chunks.push(buffer);

  return chunks;
}
