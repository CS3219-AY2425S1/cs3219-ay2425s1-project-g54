import { useContext, useEffect, useState } from "react";
import { Box, Snackbar } from "@mui/material"
import { LoadingButton } from '@mui/lab';
import Text from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
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

const Output: React.FC<OutputProps> = ({ editorRef, language, qid }) => {
  const { user } = useContext(AuthContext);
  const { collabSocket } = useSocket();
  const { roomId } = useParams();
  const [output, setOutput] = useState<Array<string>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!collabSocket) {
      return;
    }

    // if (!collabSocket.connected) {
    //   collabSocket = io(`http://localhost:${process.env.REACT_APP_COLLAB_SVC_PORT}`);
    // }
    
    collabSocket.on("sync-console", (qid: Number, consoleResults: Array<string>) => {
      setOutput(consoleResults);
      if (qid !== 0) {
        const attempt = { userId: user.id, qid: qid };
        // console.log(attempt);
        axios.post(`http://localhost:${process.env.REACT_APP_HISTORY_SVC_PORT}/api/history`, attempt);
      }
    });

    collabSocket.on("sync-load", (isLoading: boolean) => {
      setLoading(isLoading);
    });

    return () => {
      if (collabSocket && collabSocket.connected) {
        collabSocket.removeAllListeners();
        collabSocket.disconnect();
      }  
    }
  }, [collabSocket])

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    try {
      setLoading(true);
      collabSocket?.emit("console-load", roomId, true);
      const { run: result } = await executeCode(language, sourceCode);
      const consoleResults = result.output.split("\n");
      setOutput(consoleResults);
      collabSocket?.emit("console-change", roomId, qid, consoleResults);
      result.stderr ? setIsError(true) : setIsError(false);
    } catch (error) {
      console.log(error);
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center'}}
        autoHideDuration={5000}
        message="An error occurred."
        />
    } finally {
      collabSocket?.emit("console-load", roomId, false);
      setLoading(false);
    }
  };

  return (
    <Box height="100%" width="100%">
      <Stack direction='row' alignItems={'center'} marginBottom={1} marginTop={1}>
        <Text fontSize="14px" color='white' marginRight={2}>
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
          '&:hover': {
              backgroundColor: "grey.700",
          },
        }}
        >
            Run Code
        </LoadingButton>
      </Stack>
      <Box
        bgcolor='black'
        height="30vh"
        maxHeight={'30vh'}
        width="100%"
        p={2}
        color={isError ? "red.400" : "white"}
        border="1px solid"
        borderColor={isError ? "red.400" : "#333"}
        textAlign={"left"}
        overflow={"auto"}
      >
        {output.length!=0
          ? output.map((line, i) => <Text fontSize={14} fontFamily={"monospace"} color='white' key={i}>{line}</Text>)
          : <Text fontSize={14} color='white'>Click "Run Code" to see the output here</Text>}
      </Box>
    </Box>
  );
};
export default Output;
