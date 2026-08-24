import mongoose from "mongoose";

function isTransactionUnsupported(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.includes("replica set") ||
    message.includes("Transactions are not supported") ||
    message.includes("not a replica set")
  );
}

export async function runWithOptionalTransaction<T>(
  fn: (session?: mongoose.ClientSession) => Promise<T>,
): Promise<T> {
  let session: mongoose.ClientSession | null = null;

  try {
    session = await mongoose.startSession();
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(session!);
    });
    return result as T;
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      return fn();
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
