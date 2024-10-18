import "./App.css";
import NotFoundPage from "./not-found";
import QuestionPage from "./pages/Question/page";
import NavBar from "./components/NavBar/navbar";
import LoginPage from "./pages/Login/login";
import SignupPage from "./pages/Signup/signup";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider, } from '@tanstack/react-query'
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="bottom-center"/>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<NotFoundPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            <Route path="/" element={<><NavBar /><QuestionPage /></>} />
          </Routes>
        </BrowserRouter>
      </div>
    </QueryClientProvider>
  );
}

export default App;
