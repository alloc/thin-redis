import { Socket } from "@arrowood.dev/socket";
import { getConnectFn } from "../src/utils/get-connect-fn";

test("connect fn", async () => {
  await expect(getConnectFn()).resolves.not.toThrowError();

  const fn = () => {
    return new Socket({
      hostname: "localhost",
      port: 6379,
    });
  };

  expect(await getConnectFn(fn)).toEqual(fn);
});
