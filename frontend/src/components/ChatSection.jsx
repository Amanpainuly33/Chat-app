import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function ChatSection() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const socket = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  let API_URL;
  if (import.meta.env.MODE === "development") {
    API_URL = "http://localhost:3001";
  } else {
    API_URL = import.meta.env.VITE_API_URL;
  }
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/users`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();

    // if (user) {
    //   const interval = setInterval(fetchUsers, 5000);
    //   return () => clearInterval(interval);
    // }
    //[user] was there
  }, []);

  useEffect(() => {
    if (socket && selectedUser) {
      socket.emit("getMessageHistory", { otherUser: selectedUser.username });
    }
  }, [socket, selectedUser]);

  useEffect(() => {
    if (socket) {
      const handlePrivateMessage = (message) => {
        if (
          (message.sender === selectedUser?.username &&
            message.receiver === user.username) ||
          (message.receiver === selectedUser?.username &&
            message.sender === user.username)
        ) {
          setMessages((prevMessages) => [...prevMessages, message]);
          // Update chat history
          setChatHistory((prev) => {
            const existingChat = prev.find(
              (chat) =>
                chat.username === message.sender ||
                chat.username === message.receiver
            );
            if (existingChat) {
              return prev.map((chat) =>
                chat.username === existingChat.username
                  ? {
                      ...chat,
                      lastMessage: message.text,
                      timestamp: message.timestamp,
                    }
                  : chat
              );
            }
            return [
              ...prev,
              {
                username:
                  message.sender === user.username
                    ? message.receiver
                    : message.sender,
                lastMessage: message.text,
                timestamp: message.timestamp,
              },
            ];
          });
        }
      };

      const handleMessageHistory = (history) => {
        setMessages(history);
        if (history.length > 0) {
          const lastMessage = history[history.length - 1];
          setChatHistory((prev) => {
            const existingChat = prev.find(
              (chat) => chat.username === selectedUser.username
            );
            if (!existingChat) {
              return [
                ...prev,
                {
                  username: selectedUser.username,
                  lastMessage: lastMessage.text,
                  timestamp: lastMessage.timestamp,
                },
              ];
            }
            return prev;
          });
        }
      };

      socket.on("privateMessage", handlePrivateMessage);
      socket.on("messageHistory", handleMessageHistory);

      return () => {
        socket.off("privateMessage", handlePrivateMessage);
        socket.off("messageHistory", handleMessageHistory);
      };
    }
  }, [socket, selectedUser, user]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = () => {
    const text = message.trim();
    if (!text || !socket || !selectedUser) return;

    socket.emit("privateMessage", {
      text,
      receiver: selectedUser.username,
      timestamp: new Date().toISOString(),
    });
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username !== user.username &&
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineUsers = users.filter(
    (u) => u.online && u.username !== user.username
  );
  const offlineUsers = users.filter(
    (u) => !u.online && u.username !== user.username
  );

  return (
    <div className="flex h-screen bg-[#111b21] overflow-hidden">
      {/* Left Column - Chat History */}

      <div className="w-1/4 bg-[#202c33] border-r border-[#374045] flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-[#374045]">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-[#2a3942] text-white rounded focus:outline-none"
          />
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="ml-2 p-2 text-gray-400 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        {showUserSearch ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-[#374045]">
              <h3 className="text-white font-medium mb-2">Search Users</h3>
              {filteredUsers.map((u) => (
                <div
                  key={u.username}
                  onClick={() => {
                    setSelectedUser(u);
                    setShowUserSearch(false);
                  }}
                  className="p-2 cursor-pointer hover:bg-[#2a3942] rounded"
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-white">{u.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {chatHistory.map((chat) => (
              <div
                key={chat.username}
                onClick={() =>
                  setSelectedUser(
                    users.find((u) => u.username === chat.username)
                  )
                }
                className={`p-4 cursor-pointer hover:bg-[#2a3942] ${
                  selectedUser?.username === chat.username ? "bg-[#2a3942]" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-600 mr-3"></div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{chat.username}</h3>
                    <p className="text-gray-400 text-sm truncate">
                      {/* {chat.lastMessage} */}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(chat.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Middle Column - Active Chat */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#202c33] p-3 flex items-center justify-between border-b border-[#374045]">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-600 mr-3"></div>
                <div>
                  <h2 className="text-white font-medium">
                    {selectedUser.username}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {selectedUser.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#0b141a]">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-4">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === user.username
                        ? "justify-end"
                        : "justify-start"
                    } mb-4`}
                  >
                    <div
                      className={`max-w-[65%] rounded-lg p-2  ${
                        msg.sender === user.username
                          ? "bg-[#005c4b] text-white"
                          : "bg-[#202c33] text-white"
                      }`}
                    >
                      {msg.text}
                      <div className="text-xs text-gray-300 mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#202c33] p-3 flex items-center">
              <div className="flex items-center w-full">
                <input
                  type="text"
                  value={message}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-[#2a3942] text-white rounded-lg px-4 py-2 mx-2 focus:outline-none"
                  placeholder="Type a message"
                />
                <button
                  onClick={handleSendMessage}
                  className="text-gray-400 mx-2 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a user to start chatting
          </div>
        )}
      </div>

      {/* Right Column - Online Users */}

      {/*
      <div className="w-1/4 bg-[#202c33] border-l border-[#374045]">
        <div className="p-4 border-b border-[#374045]">
          <h2 className="text-white font-medium">Online Users</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          {onlineUsers.map((u) => (
            <div
              key={u.username}
              className="p-4 flex items-center cursor-pointer hover:bg-[#2a3942]"
              onClick={() => setSelectedUser(u)}
            >
              <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
              <div>
                <h3 className="text-white font-medium">{u.username}</h3>
                <p className="text-gray-400 text-sm">Online</p>
              </div>
            </div>
          ))}
          <div className="p-4 border-t border-[#374045]">
            <h2 className="text-white font-medium">Offline Users</h2>
          </div>
          {offlineUsers.map((u) => (
            <div
              key={u.username}
              className="p-4 flex items-center cursor-pointer hover:bg-[#2a3942]"
              onClick={() => setSelectedUser(u)}
            >
              <div className="w-3 h-3 rounded-full bg-gray-500 mr-3"></div>
              <div>
                <h3 className="text-white font-medium">{u.username}</h3>
                <p className="text-gray-400 text-sm">
                  Last seen: {new Date(u.lastSeen).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      */}
    </div>
  );
}

export default ChatSection;
