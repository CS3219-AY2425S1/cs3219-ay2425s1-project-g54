import { useContext, useEffect, useState } from "react";
import { Box, Snackbar } from "@mui/material"
import { LoadingButton } from "@mui/lab";
import Text from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { executeCode } from "../../pages/Collaboration/consoleExecute";
import { useSocket } from "../../contexts/SocketContext";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import axios from "axios";

interface OutputProps {
  editorRef: React.RefObject<any>;
  language: string;
  qid: Number;
}

const Output: React.FC<OutputProps> = ({ editorRef, language, qid }: OutputProps) => {
  const { user } = useContext(AuthContext);
  const { collabSocket } = useSocket();
  const { roomId } = useParams();
  const [output, setOutput] = useState<string>("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!collabSocket) {
      return;
    }

    collabSocket.on("sync-load", (isLoading: boolean) => {
      setLoading(isLoading);
    });

    return () => {
      if (collabSocket && collabSocket.connected) {
        collabSocket.disconnect();
      }
    }
  }, [collabSocket]);

  useEffect(() => {
    collabSocket?.on("sync-console", (consoleResults: string, error: boolean) => {
      setOutput(consoleResults);
      setIsError(error);
      
      if (qid !== 0) {
        const attempt = {
          userId: user.id,
          qid: qid,
          language: language,
          code: editorRef.current.getValue(),
          output: consoleResults,
          error: error,
        };
        // console.log(attempt);
        axios.post(`${process.env.REACT_APP_HISTORY_SVC_PORT}/api/history`, attempt);
      }
    });

    return () => {
      if (collabSocket && collabSocket.connected) {
        collabSocket.off("sync-console");
      }
    }
  }, [collabSocket, qid, language]);

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    try {
      setLoading(true);
      collabSocket?.emit("console-load", roomId, true);

      const result = await executeCode(language, sourceCode);
      let consoleResults = result.output || result.error || "";

      setOutput(consoleResults);
      result.error ? setIsError(true) : setIsError(false);
      collabSocket?.emit("console-change", roomId, consoleResults, result.error ? true : false);
    } catch (error) {
      console.log(error);
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center"}}
        autoHideDuration={5000}
        message="An error occurred."
        />
    } finally {
      collabSocket?.emit("console-load", roomId, false);
      setLoading(false);
    }
  };

  return (
    <Box height="50%" width="100%">
      <Stack direction="row" alignItems={"center"} marginBottom={1} marginTop={1}>
        <Text fontSize="14px" color="white" marginRight={2}>
          Output:
        </Text>
        <LoadingButton
        variant="contained"
        onClick={runCode}
        loading={loading}
        sx={{
          fontSize: "13px",
          color: "white",
          backgroundColor: "grey.800",
          "&:hover": {
            backgroundColor: "grey.700",
          },
        }}
        >
          Run Code
        </LoadingButton>
      </Stack>
      <Box
        bgcolor="black"
        height="30vh"
        maxHeight={"30vh"}
        width="100%"
        p={2}
        color={isError ? "error.light" : "white"}
        border="1px solid"
        borderColor={isError ? "error.main" : "#333"}
        textAlign={"left"}
        overflow={"auto"}
      >
        <Text fontSize={14} fontFamily={"monospace"} sx={{ whiteSpace: "pre-wrap" }}>
          {output.length > 0 ? output : "Click \"Run Code\" to see the output here"}
        </Text>
      </Box>
    </Box>
  );
};
export default Output;
