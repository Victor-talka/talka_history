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
  id: string;
  username: string;
  password: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    // Verificar se há sessão ativa
    const savedAuth = localStorage.getItem('talkahistory_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setIsAdmin(authData.isAdmin);
      setCurrentUser(authData.username);
    }
  }, []);

  const handleLogin = (username: string, password: string) => {
    // Verificar se é acesso admin
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      setIsAdmin(true);
      setCurrentUser(username);
      localStorage.setItem('talkahistory_auth', JSON.stringify({
        username,
        isAdmin: true,
        timestamp: Date.now()
      }));
      return;
    }

    // Verificar usuários regulares
    const savedUsers = localStorage.getItem('talkahistory_users');
    if (savedUsers) {
      const users: User[] = JSON.parse(savedUsers);
      const user = users.find(u => u.username === username && u.password === password && u.status === 'active');
      
      if (user) {
        setIsAuthenticated(true);
        setIsAdmin(false);
        setCurrentUser(username);
        localStorage.setItem('talkahistory_auth', JSON.stringify({
          username,
          isAdmin: false,
          timestamp: Date.now()
        }));
        return;
      }
    }

    // Login inválido
    throw new Error('Credenciais inválidas');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentUser('');
    localStorage.removeItem('talkahistory_auth');
  };

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
                  isAuthenticated && !isAdmin ? (
                    <ChatHistoryViewer onLogout={handleLogout} currentUser={currentUser} />
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

