export function gracefulShutdown(server, signal) {
  console.log(`\n${signal} received. Shutting down...`);
  server?.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Force closing...");
    process.exit(1);
  }, 10000);
}
