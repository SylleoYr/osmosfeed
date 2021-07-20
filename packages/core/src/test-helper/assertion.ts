import assert from "assert/strict";

interface ExpectContext {
  actual: any;
}

export function expect(actual: any) {
  const expectContext: ExpectContext = {
    actual,
  };

  return {
    toThrow: chainToThrow.bind(expectContext),
    toEqual: chainToEqual.bind(expectContext),
  };
}

async function chainToThrow(this: ExpectContext, expectedError?: any) {
  try {
    await this.actual();
    throw new ExpectedErrorNotThrown();
  } catch (e) {
    if (e instanceof ExpectedErrorNotThrown) {
      throw e;
    }
    if (expectedError && !(e instanceof expectedError)) {
      throw new WrongErrorThrow();
    }
  }
}

class ExpectedErrorNotThrown extends Error {
  constructor() {
    super();
    this.message = "An expected error was not thrown.";
  }
}

class WrongErrorThrow extends Error {
  constructor() {
    super();
    this.message = "The wrong type of error was thrown.";
  }
}

async function chainToEqual(this: ExpectContext, expectedValue: any) {
  try {
    assert.deepEqual(this.actual, expectedValue);
  } catch {
    throw new NotEqualError(JSON.stringify(expectedValue), JSON.stringify(this.actual));
  }
}

class NotEqualError extends Error {
  constructor(expected: string, actual: string) {
    super();
    this.message = `Not equal. \nExpected=${expected}\nActual=${actual}`;
  }
}
