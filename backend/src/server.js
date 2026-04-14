const app = require("./app");
const { port } = require("./config");
const { initializeDatabase } = require("./data/repository");

async function bootstrap() {
  await initializeDatabase();

  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
