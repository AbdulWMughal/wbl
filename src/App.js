import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import "./style.scss";
import { AuthContext } from "./context API/AuthContext";
import { useContext } from "react";
import Categorization from "./pages/Categorization";
function App() {
  const { currentUser } = useContext(AuthContext);
  // console.log("From App.js: " + currentUser);

  // If user is not logged in the login page
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }

    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route
            index
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/categorization" element={<Categorization />} />
          <Route />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
