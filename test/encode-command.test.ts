import { encodeCommand } from "../src/utils/encode-command";

test("encode command", async () => {
  const buffer: string[] = [];
  encodeCommand(["SET", "key", "value"], buffer);
  expect(buffer).toEqual(["*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n"]);
});
