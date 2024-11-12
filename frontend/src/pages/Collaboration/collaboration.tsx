import { FC, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import PeopleIcon from "@mui/icons-material/People";
import CodeEditor from "../../components/Collaboration/codeEditor";
import CallIcon from '@mui/icons-material/Call';
import { Question } from "../Question/question";
import LeaveRoomModal from "./leaveRoomModal";
import QuestionSelectModal from "./questionSelectModal";
import ChatCard from "./chatCard";
import { io } from "socket.io-client";
import { AuthContext } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { blue } from "@mui/material/colors";
import { LoadingButton } from "@mui/lab";
import CallNotification from "../../components/Communication/callNotification";
import VideoCall from "../../components/Communication/videoCall";
import toast from "react-hot-toast";
import "../../App.css";

type Caller = {
  username: string,
  avatar: string
}

export type CallNotificationState = {
  caller: Caller,
  isOpen: boolean
}

const CollaborationPage: FC = () => {
  const navigate = useNavigate();
  const { collabSocket, commSocket, setCollabSocket, setCommSocket } = useSocket();
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();
  const { roomId } = useParams();
  const {
    userId = user.id,
    userName = user.username,
    question = {
      title: "Placeholder Question Title",
      description: "This is a placeholder description for testing.",
      complexity: "Medium",
    },
  } = location.state || {};
  const [isLeaveRoomModalOpen, setIsLeaveRoomModalOpen] =
    useState<boolean>(false);
  const [isChangeQuestionModalOpen, setIsChangeQuestionModalOpen] =
    useState(false);
  const [isAwaitingCallResponse, setIsAwaitingCallResponse] = useState(false);
  const [notification, setNotification] = useState<CallNotificationState>({
    caller: {
      username: "",
      avatar: ""
    },
    isOpen: false
  })
  const [isInCall, setIsInCall] = useState(false);
  const [callTimeout, setCallTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleOpenLeaveRoomModal = () => {
    setIsLeaveRoomModalOpen(true);
  };

  const handleCloseLeaveRoomModal = () => {
    setIsLeaveRoomModalOpen(false);
  };

  const alertUser = (event: Event) => {
    event.preventDefault();
    return event.returnValue = true;
  }

  useEffect(() => {
    window.addEventListener("beforeunload", alertUser);

    return () => {
      window.removeEventListener("beforeunload", alertUser);
    }
  });

  const handleLeaveRoom = () => {
    onLeaveRoom();
  };
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    question
  );
  const onLeaveRoom = () => {
    setUser(oldUser => ({ ...oldUser, currentRoom: "" }));
    navigate("/");
    collabSocket?.emit("leave-room", roomId);
    collabSocket?.disconnect();
    commSocket?.disconnect();
  };
  const handleQuestionChangeClick = () => setIsChangeQuestionModalOpen(true);
  const handleChangeQuestionModalClose = () =>
    setIsChangeQuestionModalOpen(false);
  const handleQuestionSelect = (question: Question) => {
    collabSocket?.emit("question-change", roomId, question);
    setSelectedQuestion(question);
    setIsChangeQuestionModalOpen(false); // Close the modal after selection
  };
  const handleCallButtonClick = () => {
    commSocket!.emit("initiate-call", roomId, { username: user.username, avatar: user.avatar });
    setIsAwaitingCallResponse(true);
    const timeout = setTimeout(() => {
      setIsAwaitingCallResponse(false);
      commSocket?.emit("call-timeout", roomId);
    }, 15000);
    setCallTimeout(timeout);
  }
  const handleCallResponse = (isAnswer: boolean) => {
    setNotification(oldNotification => ({ ...oldNotification, isOpen: false }));
    commSocket?.emit("call-response", isAnswer, roomId);
    if (isAnswer) {
      commSocket?.emit("start-video", roomId, true);
    }
    setIsInCall(isAnswer);
  }

  const handleStopVideo = () => {
    commSocket?.emit("stop-video", roomId);
    setIsInCall(false);
  }

  useEffect(() => {
    if (user.currentRoom !== roomId) {
      navigate("/");
      toast.dismiss();
      toast.error("User has no permission to join this room.")
      return;
    }
    setCollabSocket(io(`${process.env.REACT_APP_COLLAB_SVC_PORT}`, {
      auth: {
        userId: user.id,
        username: user.username
      },
      path: "/collaboration/socket",
    }));
    setCommSocket(io(`${process.env.REACT_APP_COMM_SVC_PORT}`, {
      auth: {
        userId: user.id,
        username: user.username
      },
      path: "/communication/socket",
    }));

  }, [user])

  useEffect(() => {
    if (!collabSocket) {
      return;
    }
    if (!commSocket) {
      return;
    }
    collabSocket.on("connect", () => {
      collabSocket?.emit("join-room", roomId);
    });

    commSocket.on("connect", () => {
      commSocket?.emit("join-room", roomId);
    });

    collabSocket.on("connect_error", (err: Error) => {
      setUser(oldUser => ({ ...oldUser, currentRoom: "" }));
      console.log(`Error: ${err.message}`);
      navigate("/");
    });

    commSocket.on("connect_error", (err: Error) => {
      setUser(oldUser => ({ ...oldUser, currentRoom: "" }));
      console.log(`Error ${err.message}`);
      navigate("/");
    });

    collabSocket.on("user-left", (user: string) => {
      toast.error(`${user} has left the room.`)
    });

    collabSocket.on("sync-question", (question: Question) => {
      console.log(`question sync ${question.title}`);
      setSelectedQuestion(question);
    });

    commSocket.on("incoming-call", (caller: Caller) => {
      setNotification({
        caller: caller,
        isOpen: true
      });
    });

    commSocket.on("call-response", (isAnswer: boolean) => {
      if (callTimeout) {
        clearTimeout(callTimeout);
        setCallTimeout(null);
      }
      setIsAwaitingCallResponse(false);
      if (isAnswer) {
        commSocket.emit("start-video");
        setIsInCall(true);
      } else {
        toast.error("Peer has declined the call.");
      }

    });

    commSocket.on("call-timeout", () => {
      setNotification(oldNotification => ({ ...oldNotification, isOpen: false }));
    })

    commSocket.on("call-error", () => {
      console.log("button")
      setIsInCall(false);
      setIsAwaitingCallResponse(false);
    })

    commSocket.on("stop-video", () => {
      setIsInCall(false);
    })

    return () => {
      if (collabSocket?.connected && commSocket?.connected) {
        setUser(oldUser => ({ ...oldUser, currentRoom: "" }));
      }

      if (collabSocket && collabSocket.connected) {
        collabSocket.disconnect();
      }

      if (commSocket && commSocket.connected) {
        commSocket.disconnect();
      }
    };
  }, [collabSocket, commSocket])

  const tagColour = (selected: Question | null, initial: Question): string => {
    const colour = (val: string): string => {
      switch (val) {
        case "Easy":
          return "bg-green-600"
        case "Medium":
          return "bg-orange-600"
        case "Hard":
          return "bg-red-600"
        default:
          return ""
      }
    }

    if (selected) {
      return colour(selected.complexity);
    } else {
      return colour(initial.complexity);
    }

  }

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <VideoCall />

      <Box>
        <AppBar
          position="static"
          sx={{ width: "100vw", backgroundColor: "#262928" }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              <img
                className="h-12 mr-6"
                alt="peerprep logo"
                src="/logo-with-text.svg"
              />
              {/* Flexible space to push buttons to the right */}
              <Box sx={{ flexGrow: 1 }} />
              {isInCall ?
                <Button
                  variant="contained"
                  onClick={handleStopVideo}
                  startIcon={<PeopleIcon />}
                  sx={{ mx: 3 }}
                  className="px-4 py-2 rounded hover:bg-red-700 transition-colors">
                  Stop Video
                </Button>
                :
                <LoadingButton
                  variant="contained"
                  onClick={handleCallButtonClick}
                  startIcon={<CallIcon />}
                  sx={{
                    mx: 3,
                    ":disabled": {
                      backgroundColor: blue[900]
                    }
                  }}
                  className="px-4 py-2 rounded hover:bg-green-500 transition-colors"
                  loading={isAwaitingCallResponse}>
                  Call Peer
                </LoadingButton>
              }

              <Button
                variant="contained"
                onClick={handleQuestionChangeClick}
                startIcon={<PeopleIcon />}
                sx={{ mx: 3 }}
                className="px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Change Question
              </Button>
              <Button
                variant="contained"
                onClick={handleOpenLeaveRoomModal}
                startIcon={<PeopleIcon />}
                sx={{ mx: 3 }}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Leave Room
              </Button>
            </Toolbar>
          </Container>
        </AppBar>
      </Box>
      <LeaveRoomModal
        open={isLeaveRoomModalOpen}
        onClose={handleCloseLeaveRoomModal}
        onConfirm={handleLeaveRoom} // Confirm action
      />

      <QuestionSelectModal
        open={isChangeQuestionModalOpen}
        onClose={handleChangeQuestionModalClose}
        onQuestionSelect={handleQuestionSelect}
      />
      <div className="grid grid-cols-2 gap-4 p-4">
        {/* Left Panel - Question and Chat */}
        <div className="flex flex-col gap-4" style={
          { maxHeight: "100%" }
        }>
          {/* Question */}
          <Card className="border-gray-700 text-white flex flex-col h-full">
            <CardContent
              className="p-6 bg-gray-800 flex-grow"
              style={{ maxHeight: "86vh" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-white">
                  {selectedQuestion?.title || question.title}{" "}
                </h2>
                <span className={`px-2 py-1 ${tagColour(selectedQuestion, question)} text-white rounded text-sm`}>
                  {selectedQuestion?.complexity || question.complexity}
                </span>
              </div>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose prose-markdown overflow-auto text-left markdown-content"
              >
                {selectedQuestion?.description || question.description}
              </ReactMarkdown>
            </CardContent>
          </Card>
          {/* Chat Card */}
          <div className="flex-grow">
            <ChatCard roomId={roomId!} username={userName} userId={userId} />
          </div>
        </div>

        {/* Right Panel - Monaco Editor & Console */}
        <div className="flex flex-col gap-4">
          <Card className="border-gray-700 text-white flex flex-col h-full">
            <CardContent className="p-6 bg-gray-800 flex-grow">
              <CodeEditor qid={selectedQuestion?.qid || 0} />
            </CardContent>
          </Card>
        </div>
      </div>
      <CallNotification notification={notification} handleCallResponse={handleCallResponse} />
    </div>
  );
};

export default CollaborationPage;
