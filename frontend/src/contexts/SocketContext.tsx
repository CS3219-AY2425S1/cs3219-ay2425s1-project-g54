import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';
import { Socket } from 'socket.io-client';

export interface SocketContextInterface {
  collabSocket: Socket | null,
  commSocket: Socket | null,
  setCollabSocket: Dispatch<SetStateAction<Socket | null>>,
  setCommSocket: Dispatch<SetStateAction<Socket | null>>
}

export const SocketContext = createContext<SocketContextInterface | null>(null);

type ContextProviderNode = {
  children: ReactNode
};

export const SocketContextProvider = ({ children }: ContextProviderNode) => {
  const [collabSocket, setCollabSocket] = useState<Socket | null>(null);
  const [commSocket, setCommSocket] = useState<Socket | null>(null);

  return (
    <SocketContext.Provider value={{ collabSocket, commSocket, setCollabSocket, setCommSocket }}>
      {children}
    </SocketContext.Provider>
  );

}

export const useSocket = (): SocketContextInterface => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("Socket is null");
  }
  return context;
};
