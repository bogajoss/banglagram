import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: VITE_SUPABASE_URL and a Supabase Key (Service Role or Anon) are required in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSqlFile(filePath: string) {
  console.log(`Reading ${filePath}...`);
  let sqlContent = fs.readFileSync(filePath, "utf8");

  // Basic cleanup: remove single-line comments
  sqlContent = sqlContent.replace(/--.*$/gm, "");

  // Split by semicolon, but ignore semicolons inside $$ blocks
  const statements: string[] = [];
  let currentStatement = "";
  let inDollarBlock = false;

  const lines = sqlContent.split("\n");
  for (const line of lines) {
    if (line.includes("$$")) {
      // Toggle dollar block
      inDollarBlock = !inDollarBlock;
    }

    if (line.trim().endsWith(";") && !inDollarBlock) {
      currentStatement += " " + line;
      statements.push(currentStatement.trim());
      currentStatement = "";
    } else {
      currentStatement += " " + line;
    }
  }
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  console.log(
    `Found ${statements.length} statements in ${path.basename(filePath)}. Executing...`,
  );

  for (let i = 0; i < statements.length; i++) {
    let stmt = statements[i];
    if (!stmt) continue;

    // Remove trailing semicolon for EXECUTE
    if (stmt.endsWith(";")) {
      stmt = stmt.slice(0, -1);
    }

    const { error } = await supabase.rpc("exec_sql", { query: stmt });

    if (error) {
      // If error is "already exists", permission, or duplicate key, we might want to continue
      if (
        error.message.includes("already exists") ||
        error.message.includes("must be owner") ||
        error.message.includes("duplicate key") ||
        error.message.includes("already a policy")
      ) {
        console.log(
          `Statement ${i + 1} skipped (expected conflict): ${error.message.substring(0, 50)}...`,
        );
        continue;
      }

      console.error(`Error in statement ${i + 1}:`);
      console.error(`Statement: ${stmt.substring(0, 100)}...`);
      console.error(`Message: ${error.message}`);
      return false;
    }
  }

  console.log(`Success: ${filePath} executed.`);
  return true;
}

async function main() {
  // Test RPC connection
  console.log(`Testing RPC connection...`);
  const testDdl = await supabase.rpc("exec_sql", { query: "SELECT 1" });
  if (testDdl.error) {
    console.error(
      'RPC Test failed. Ensure "exec_sql" function exists in Supabase:',
      testDdl.error.message,
    );
    process.exit(1);
  }
  console.log("RPC Test successful.");

  const schemaPath = path.resolve(process.cwd(), "supabase_schema.sql");
  const storagePath = path.resolve(process.cwd(), "storage_setup.sql");
  const triggersPath = path.resolve(
    process.cwd(),
    "notifications_triggers.sql",
  );
  const reelsUpdatePath = path.resolve(
    process.cwd(),
    "update_schema_reels.sql",
  );
  const missingFeaturesPath = path.resolve(
    process.cwd(),
    "missing_features_schema.sql",
  );
  const optimizationPath = path.resolve(
    process.cwd(),
    "optimization_schema.sql",
  );
  const messagesBucketPath = path.resolve(
    process.cwd(),
    "update_messages_bucket_public.sql",
  );
  const voiceCommentsPath = path.resolve(
    process.cwd(),
    "update_schema_voice_comments.sql",
  );

  if (!(await runSqlFile(schemaPath))) process.exit(1);
  if (!(await runSqlFile(storagePath))) process.exit(1);
  if (!(await runSqlFile(triggersPath))) process.exit(1);
  if (!(await runSqlFile(reelsUpdatePath))) process.exit(1);
  if (!(await runSqlFile(missingFeaturesPath))) process.exit(1);
  if (!(await runSqlFile(optimizationPath))) process.exit(1);
  if (!(await runSqlFile(messagesBucketPath))) process.exit(1);
  if (!(await runSqlFile(voiceCommentsPath))) process.exit(1);

  console.log("All migrations completed.");
}

main();
