interface ExecuteCodeRequest {
  language: string;
  code: string;
}

interface ExecuteCodeResponse {
  output: string;
  error?: string;
}

interface ExecuteCodeError {
  message: string;
}

export const executeCode = async (
  language: string,
  sourceCode: string
): Promise<ExecuteCodeResponse> => {
  try {
    const response = await fetch(`${process.env.REACT_APP_CODE_EXECUTION_SVC_PORT}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: language,
        code: sourceCode,
      } as ExecuteCodeRequest),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ExecuteCodeError;
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as ExecuteCodeResponse;
    return {
      output: data.output || '',
      error: data.error
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to execute code: ${error.message}`);
    }
    throw new Error('Failed to execute code: Unknown error');
  }
};