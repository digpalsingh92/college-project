import { trainPredictionModel } from "./trainer.js";

const run = async () => {
  const datasetPath = process.argv[2];
  const result = await trainPredictionModel(datasetPath);

  console.log("Training complete");
  console.log(`modelVersion=${result.version}`);
  console.log(`trainedAt=${result.trainedAt}`);
  console.log(`datasetRecords=${result.datasetRecords}`);
  console.log(`llmInsightsGenerated=${result.llmInsights.generated}`);
};

run().catch((error) => {
  console.error("Training failed", error);
  process.exit(1);
});
