import PostgresDataSource from "../data-source";
import subscriptionService from "../services/subscription.service";

async function main() {
  try {
    // Initialize database connection
    await PostgresDataSource.initialize();
    console.log("Database connection initialized");

    // Create initial plans
    await subscriptionService.createInitialPlans();

    // Close database connection
    await PostgresDataSource.destroy();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main(); 