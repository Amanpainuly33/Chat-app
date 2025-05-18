import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

let SOCKET_URL;
if (import.meta.env.MODE === "development") {
 
  SOCKET_URL = "http://localhost:3001";  
} else {
  SOCKET_URL = import.meta.env.VITE_API_URL;  
}


const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let newSocket;
    if (user) {
      newSocket = io(SOCKET_URL, {
        withCredentials: true,
        auth: { token: user.token },
        // transports: ["polling", "websocket"],
      });

      // helpful debug
      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
      });
      newSocket.on("connect_error", (err) => {
        console.error("Socket connect_error:", err.message);
      });
      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      setSocket(newSocket);
    }

    return () => {
      // cleanup on unmount or user change
      if (newSocket) newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
