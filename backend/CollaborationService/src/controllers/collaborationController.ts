import { Socket } from "socket.io";


export const handleConnection = (socket: Socket) : void => {
  const userId = socket.handshake.auth.userId;
  const username = socket.handshake.auth.username;
  if (!userId) {
    socket.emit("connection-error", { message: "User ID is required" });
    socket.disconnect(true);
    return;
  }
  if (!username) {
    socket.emit("connection-error", { message: "Username is required" });
    socket.disconnect(true);
    return;
  }
  socket.data.userId = userId;
  socket.data.username = username;
}

// verify whether socket can join the room
export const verifyRoomJoinPermission = (socket: Socket, roomID: string) : boolean => {
  return !socket.rooms.has(roomID);
}

