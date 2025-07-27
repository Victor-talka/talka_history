import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChatHistoryViewer from '@/components/ChatHistoryViewer';
import LoginForm from '@/components/LoginForm';
import AdminPanel from '@/components/AdminPanel';

const queryClient = new QueryClient();

interface User {
  id: number;
  username: string;
  user_type: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Verificar se há sessão ativa
    const savedAuth = localStorage.getItem('talkahistory_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setCurrentUser(authData.user);
    }
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        setIsAuthenticated(true);
        setCurrentUser(user);
        localStorage.setItem('talkahistory_auth', JSON.stringify({
          user,
          timestamp: Date.now()
        }));
        return;
      } else {
        throw new Error('Credenciais inválidas');
      }
    } catch (error) {
      throw new Error('Credenciais inválidas');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('talkahistory_auth');
  };

  const isAdmin = currentUser?.user_type === 'admin';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <div className="App">
            <Routes>
              {/* Rota de login */}
              <Route 
                path="/login" 
                element={
                  !isAuthenticated ? (
                    <LoginForm onLogin={handleLogin} />
                  ) : (
                    <Navigate to={isAdmin ? "/admin" : "/"} replace />
                  )
                } 
              />
              
              {/* Rota do admin */}
              <Route 
                path="/admin" 
                element={
                  isAuthenticated && isAdmin ? (
                    <AdminPanel onLogout={handleLogout} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />
              
              {/* Rota principal */}
              <Route 
                path="/" 
                element={
                  isAuthenticated && !isAdmin && currentUser ? (
                    <ChatHistoryViewer 
                      onLogout={handleLogout} 
                      currentUser={currentUser.username}
                      userId={currentUser.id}
                    />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />
              
              {/* Rota padrão */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

