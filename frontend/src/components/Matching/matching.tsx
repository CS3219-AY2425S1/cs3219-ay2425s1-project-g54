import { useEffect, useRef, useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import Button from "@mui/material/Button";
import FormControl from '@mui/material/FormControl';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Typography from "@mui/material/Typography";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const complexities = ["Easy", "Medium", "Hard"];
const categories = ["", "Algorithms", "Arrays", "Bit Manipulation", "Brainteaser", "Data Structures", "Databases", "Recursion", "Strings"];
const timeout = 30000;

export default function MatchingDialog({ open, handleMatchScreenClose }: { open: boolean, handleMatchScreenClose: () => void }) {
  const { user, setUser } = useContext(AuthContext);
  const [complexity, setComplexity] = useState("");
  const [category, setCategory] = useState("");
  const [isMatching, setIsMatching] = useState(false);

  const socket = useRef<Socket | undefined>(undefined);
  const intervalReference = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startTime = useRef(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isMatching) {
      socket.current = io(`${process.env.REACT_APP_MATCHING_SVC_PORT}`, {
        auth: {
          userId: user.id,
          username: user.username,
        },
        path: "/matching/socket",
      });

      socket.current.on("connect", () => {
        console.log(`Requesting match for ${category} on ${complexity} difficulty...`);
        socket.current!.emit("request-match", {
          difficultyLevel: complexity,
          category: category || null,
        });
      });

      socket.current.on("connection-error", (error: Error) => {
        toast.error(`Connection error: ${error.message}`);
        setIsMatching(false);
      });

      socket.current.on("match-request-accepted", () => {
        startTime.current = Date.now();
        intervalReference.current = setInterval(() => {
          if (Date.now() - startTime.current > timeout) {
            toast.error("Matching timed out");
            setIsMatching(false);
          }
          setElapsedTime(Date.now() - startTime.current);
        }, 250);
      });

      socket.current.on("match-found", async (match) => {
        console.log(match);
        toast.success(`Matched with ${match.matchedUsername}!`);
        setIsMatching(false);
        setUser(prevUser => ({ ...prevUser, currentRoom: match.uuid }));
        try {
          const response = await axios.get(`${process.env.REACT_APP_QUESTION_SVC_PORT}/api/question/random/${match.match.difficultyLevel}/${match.match.category}`);
          console.log('API response:', response);
          const question = response.data;
          navigate(`/collaboration/${match.uuid}`, { state: { question } });
        } catch (error) {
          toast.error("Failed to create room (Unable to fetch question)");
          console.error(error);
        }
      });

      socket.current.on("match-timeout", () => {
        toast.error("Matching timed out");
        setIsMatching(false);
      });

      socket.current.on("match-request-error", (message: string) => {
        toast.error(`Error requesting match: ${message}`);
        setIsMatching(false);
      });
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }

      clearInterval(intervalReference.current);
      setElapsedTime(0);
    }
  }, [isMatching]);

  const handleClose = () => {
    if (isMatching) {
      toast.error("Cannot close screen while matching!");
      return;
    }
    handleMatchScreenClose();
  }

  const handleChangeComplexity = (event: SelectChangeEvent) => {
    setComplexity(event.target.value);
  }

  const handleChangeCategory = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
  }

  const startMatching = () => {
    setIsMatching(true);
  }

  const stopMatching = () => {
    setIsMatching(false);
  }

  const formatTime = () => {
    const minutes = Math.floor(elapsedTime / 1000 / 60);
    const seconds = Math.floor(elapsedTime / 1000) % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="matching-dialog-title"
      open={open}
    >
      <DialogTitle variant="h4" sx={{ m: 0, p: 2 }} id="matching-dialog-title">
        Find Peer
      </DialogTitle>
      <IconButton
        aria-label="close"
        disabled={isMatching}
        onClick={handleClose}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        <Typography>
          Select the category and difficulty of questions you are interested in doing:
        </Typography>
        <div className="py-8 flex justify-center">
          <FormControl sx={{ m: 1, minWidth: 140 }}>
            <InputLabel id="complexity-select-label">Complexity</InputLabel>
            <Select
              labelId="complexity-select"
              id="complexity-select"
              value={complexity}
              label="Complexity"
              disabled={isMatching}
              onChange={handleChangeComplexity}
            >
              {complexities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl sx={{ m: 1, minWidth: 180 }}>
            <InputLabel id="category-select-label">Category</InputLabel>
            <Select
              labelId="category-select"
              id="category-select"
              value={category}
              label="Category"
              disabled={isMatching}
              onChange={handleChangeCategory}
            >
              {categories.map(c => <MenuItem key={c} value={c}>{c ? c : <em>None</em>}</MenuItem>)}
            </Select>
          </FormControl>
        </div>
        <Typography variant="h6" align="center" sx={{ minHeight: 32 }}>
          {isMatching ? `Finding peer... ${formatTime()}` : ""}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Button
          autoFocus
          variant="contained"
          color={isMatching ? "error" : "primary"}
          disabled={!isMatching && complexity === ""}
          onClick={isMatching ? stopMatching : startMatching}
          sx={{ minWidth: 90 }}
        >
          {isMatching ? "Cancel" : "Match"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
