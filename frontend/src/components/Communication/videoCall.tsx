import { useEffect, useRef, useState } from "react";
import SimplePeer, { SignalData } from "simple-peer";
import { useParams } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import Draggable from "react-draggable";
import toast from "react-hot-toast";



export default function VideoCall() {
    const { roomId } = useParams();
    const { commSocket } = useSocket();

    const [isShowVideo, setIsShowVideo] = useState(false);
    const peerInstance = useRef<SimplePeer.Instance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const myVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);


    useEffect(() => {

        if (!commSocket) {
            return;
        }

        commSocket.on("start-video", (isInitiator: boolean) => {
            setIsShowVideo(true);
            setMediaDevices(roomId!, isInitiator);
            if (isInitiator) {
                commSocket.emit("start-video", roomId, false); // emit same msg to the other end user
            }
            console.log("Video started")
        })

        commSocket.on("signal", (signal: SignalData) => {
            console.log("received signal");
            if (!peerInstance.current) {
                commSocket.emit("call-error", roomId);
            } else {
                peerInstance.current.signal(signal);
            }
        })

        commSocket.on("stop-video", () => {
            stopVideo();
        })

        commSocket.on("call-error", () => {
            stopVideo();
            toast.error("Error occured on call. Please try again.");
        })

        return () => {
            stopVideo();
        }

    }, [commSocket])



    const setMediaDevices = (roomId: string, isInitiator: boolean) => {
        peerInstance.current = new SimplePeer({
            initiator: isInitiator,
            trickle: false,
        });
        peerInstance.current.on('signal', (signal) => {
            console.log("emitting signal");
            commSocket!.emit('signal', roomId, signal, peerInstance);
        });
        peerInstance.current.on('stream', (remoteStream) => {
            if (remoteVideo.current) {
                console.log("stream")
                remoteVideo.current.srcObject = remoteStream;
            }
        });
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((mediaStream) => {
                streamRef.current = mediaStream;
                if (myVideo.current) {
                    myVideo.current.srcObject = mediaStream;
                }
                peerInstance.current?.addStream(mediaStream);
            })
            .catch((_err: Error) => {
                stopVideo();
                commSocket?.emit("call-error", roomId);
            });
    }

    const stopVideo = () => {
        setIsShowVideo(false);
        peerInstance.current?.destroy();
        streamRef.current?.getTracks().forEach((track) => {
            if (track.readyState === 'live') {
                track.stop();
            }
        });
    }

    return (
        <Draggable bounds="parent">
            <div className="flex items-center justify-center z-50 absolute">
                {isShowVideo ?
                    <div className="flex justify-center items-center ">
                        <div className="flex max-w-60 max-h-60 justify-center items-center flex-col">
                            <video id="myvid" className="w-60" ref={myVideo} autoPlay muted />
                        </div>
                        <div className="flex max-w-60 max-h-60 justify-center items-center flex-col">
                            <video id="theirvid" className="w-60" ref={remoteVideo} autoPlay />
                        </div>
                    </div>
                    : null}

            </div>
        </Draggable>

    )
}
