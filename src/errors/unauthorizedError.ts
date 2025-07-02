// UnauthorizedError.ts
export class UnauthorizedError extends Error {
    public statusCode: number;
  
    constructor(message: string = "Unauthorized") {
      super(message);
      this.name = "UnauthorizedError";
      this.statusCode = 401;
  
      // Ensure the prototype chain is maintained
      Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
  }
  