import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();

// Configuration
const JUDGE0_API_URL = 'http://judge0:2358';
const PORT = process.env.CODE_EXECUTION_SVC_PORT || 3000;

interface CodeExecutionRequest {
  language: string;
  code: string;
  stdin?: string;
}

interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
}

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  memory: number;
  time: string;
  token: string;
}

// Language mapping
const LANGUAGE_MAP: Record<string, number> = {
  'python': 71,    // Python (3.8.1)
  'javascript': 63,// Node.js (12.14.0)
  'java': 62,      // Java (OpenJDK 13.0.1)
  'cpp': 54,       // C++ (GCC 9.2.0)
  'php': 68,       // PHP (7.4.1)
  'ruby': 72,      // Ruby (2.7.0)
  'R': 80,         // R (4.0.0)
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(cors());
app.use(express.json());
app.use(limiter);


async function createSubmission(submission: Judge0Submission): Promise<string> {
  try {
    const response = await axios.post(
        `${JUDGE0_API_URL}/submissions`,
        submission,
        {
          headers: {
            "Content-Type": "application/json",
          },
          params: { base64_encoded: "false" },
        }
      );
    return response.data.token;
  } catch (error) {
    console.error('Error creating submission:', error);
    throw new Error('Failed to create submission');
  }
}

async function getSubmissionResult(token: string): Promise<Judge0Response> {
  try {
    const response = await axios.get(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`);
    return response.data;
  } catch (error) {
    console.error('Error getting submission result:', error);
    throw new Error('Failed to get submission result');
  }
}


app.post('/execute', async (req: Request<{}, {}, CodeExecutionRequest>, res: Response) => {
  try {
    const { language, code, stdin } = req.body;

    if (!language || !code) {
      return res.status(400).json({ error: 'Language and code are required' });
    }

    const languageId = LANGUAGE_MAP[language.toLowerCase()];
    if (!languageId) {
      return res.status(400).json({ error: 'Unsupported programming language' });
    }

    // Create submission
    const submission: Judge0Submission = {
      source_code: code,
      language_id: languageId,
      stdin: stdin
    };

    // Get submission token
    const token = await createSubmission(submission);

    // Poll for results
    let result: Judge0Response;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
      result = await getSubmissionResult(token);
      attempts++;
    } while (result.status.id <= 2 && attempts < maxAttempts); // Status 2 or lower means still processing

    // Prepare response
    let output = '';
    let error = null;

    if (result.status.id === 3) { // Accepted
      output = result.stdout || '';
    } else if (result.compile_output) { // Compilation error
      error = result.compile_output;
    } else if (result.stderr) { // Runtime error
      error = result.stderr;
    } else {
      error = `Execution error: ${result.status.description}`;
    }

    // Send response
    res.json({
      output,
      error,
      executionTime: result.time,
      memory: result.memory,
      statusId: result.status.id,
      statusDescription: result.status.description
    });

  } catch (error) {
    console.error('Error in /execute:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});


app.listen(PORT, () => {
  console.log(`Code execution service listening on port ${PORT}`);
});

export default app;