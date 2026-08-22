import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

function getConnectionErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("ECONNREFUSED") || message.includes("ReplicaSetNoPrimary")) {
    return "Cannot reach MongoDB. Check that MongoDB is running locally, or update MONGODB_URI in .env.local to a valid Atlas connection string and restart the dev server.";
  }

  if (message.includes("bad auth") || message.includes("Authentication failed")) {
    return "MongoDB authentication failed. Check the username and password in MONGODB_URI.";
  }

  if (MONGODB_URI?.includes("<db_username>")) {
    return "MONGODB_URI still contains the <db_username> placeholder. Replace it with your Atlas database username in .env.local.";
  }

  return "Database connection failed. Verify MONGODB_URI in .env.local and restart the dev server.";
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in your environment variables.");
  }

  if (
    MONGODB_URI.includes("<db_username>") ||
    MONGODB_URI.includes("USER:PASS")
  ) {
    throw new Error(
      "MONGODB_URI still contains placeholder credentials. Replace them with your real MongoDB Atlas username and password.",
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI!, {
        serverSelectionTimeoutMS: 8000,
      })
      .then((mongooseInstance) => mongooseInstance)
      .catch((error) => {
        cached.conn = null;
        cached.promise = null;
        throw new Error(getConnectionErrorMessage(error), { cause: error });
      });
  }

  cached.conn = await cached.promise;

  await Promise.all([
    import("@/lib/models/Config"),
    import("@/lib/models/Team"),
    import("@/lib/models/Participant"),
  ]);

  await mongoose.connection.syncIndexes();

  return cached.conn;
}
