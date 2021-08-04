/* eslint-disable camelcase */

interface PodbeanErrorInfo {
  error: string;
  error_description: string;
}

class PodbeanError extends Error {
  constructor({ error, error_description }: PodbeanErrorInfo) {
    super(error_description);
    this.name = `PodbeanError - ${error}`;
  }
}

export default PodbeanError;
