class UserError extends Error {
  suggestion?: string;
  info?: string;

  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args);
    this.name = `UserError`;
  }
}

export default UserError;
