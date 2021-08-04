class UserError extends Error {
  suggestion?: string;
  info?: string;

  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args);
    this.name = `UserError`;
  }

  // Ensures that the JSON-ified error that the client receives has all properties
  toJSON(): Record<string, unknown> {
    const errorJson = {} as ReturnType<UserError["toJSON"]>;
    const props = Object.getOwnPropertyNames(this) as Array<keyof UserError>;
    props.forEach((p) => (errorJson[p] = this[p]));
    return errorJson;
  }
}

export default UserError;
