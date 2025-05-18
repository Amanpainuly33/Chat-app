import { SocketProvider } from './context/SocketContext';
import ChatSection from './components/ChatSection';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import { useAuth } from './context/AuthContext';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <SocketProvider>
      <ChatSection />
    </SocketProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
