import { toMatchInlineSnapshot } from "jest-snapshot";
import { UserError } from "../server/models/errors";

expect.extend({
  toThrowWithError(received, expected) {
    // Constants
    const passErrorToUser = (err: unknown): jest.CustomMatcherResult => {
      expected(err);
      return { pass: true, message: () => "" };
    };

    /* -------------------- Handle Promise Modifiers -------------------- */
    if (this.promise === "resolves")
      return {
        pass: false,
        message: () =>
          this.utils.matcherErrorMessage(
            this.utils.matcherHint("toThrowWithError", undefined, undefined, {
              promise: this.promise,
            }),
            `"${this.promise}" is an invalid modifier for "toThrowWithError"`,
            ""
          ),
      };

    // Jest already takes care of validating `rejects`. We just need to pass the error along.
    if (this.promise === "rejects") return passErrorToUser(received);

    /* -------------------- Argument Validation -------------------- */
    if (typeof received !== "function")
      return {
        pass: false,
        message: () =>
          this.utils.matcherErrorMessage(
            this.utils.matcherHint("toThrowWithError"),
            `${this.utils.RECEIVED_COLOR("received")} value must be a function`,
            `Received has value: ${this.utils.RECEIVED_COLOR(typeof received)}`
          ),
      };

    if (typeof expected !== "function")
      return {
        pass: false,
        message: () =>
          this.utils.matcherErrorMessage(
            this.utils.matcherHint("toThrowWithError"),
            `${this.utils.EXPECTED_COLOR("expected")} value must be a function`,
            `Expected has value: ${this.utils.EXPECTED_COLOR(typeof expected)}`
          ),
      };

    /* -------------------- Matcher Logic -------------------- */
    try {
      received();
      const errorMessage = "Received function did not throw" as const; // copied from Jest's `toThrow` matcher.

      return {
        pass: false,
        message: () =>
          `${this.utils.matcherHint("toThrowWithError", undefined, undefined)}\n\n${errorMessage}`,
      };
    } catch (err) {
      return passErrorToUser(err);
    }
  },
  toMatchInlineUserErrorSnapshot(received, ...rest) {
    if (!(received instanceof UserError)) {
      return {
        pass: false,
        message: () =>
          this.utils.matcherErrorMessage(
            this.utils.matcherHint("toMatchInlineUserErrorSnapshot"),
            `${this.utils.RECEIVED_COLOR("received")} value must be an instance of ${
              UserError.name
            }`,
            `Received is an instance of: ${this.utils.RECEIVED_COLOR(received?.constructor.name)}`
          ),
      };
    }

    const { message, info, suggestion } = received;
    const snapshot = `message: ${message}\ninfo: ${info ?? ""}\nsuggestion: ${suggestion ?? ""}`;

    // @ts-expect-error This is a problem with Jest's exported types
    return toMatchInlineSnapshot.call(this, snapshot, ...rest);
  },
});
