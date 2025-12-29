import { LlmAnalyzer } from '../src/modules/llm-analyzer';
import { logger } from '../src/utils/logger';

// Mock data
const mockMetadata = {
  title: "Test Movie",
  year: 2023,
  plot: "A test movie about testing."
};

const mockSubtitles = [
  { id: '1', startTime: '00:00:10,000', endTime: '00:00:15,000', startTimeMS: 10000, endTimeMS: 15000, text: 'Hello, this is a test dialogue.' },
  { id: '2', startTime: '00:00:20,000', endTime: '00:00:25,000', startTimeMS: 20000, endTimeMS: 25000, text: 'We are checking if the AI can find this.' },
  { id: '3', startTime: '00:01:00,000', endTime: '00:01:05,000', startTimeMS: 60000, endTimeMS: 65000, text: 'This is another scene later in the movie.' },
];

async function verify() {
  logger.info("Starting LlmAnalyzer Verification...");
  
  const analyzer = new LlmAnalyzer();
  const result = await analyzer.analyze(mockMetadata, mockSubtitles);

  if (result) {
    logger.info("✅ Analysis Successful!");
    console.log(JSON.stringify(result, null, 2));
  } else {
    logger.error("❌ Analysis Failed.");
  }
}

verify().catch(console.error);
