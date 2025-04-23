import React, { useContext } from "react";
import { AuthContext } from "../context API/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleNavigate = (section) => {
    if (section === "messages") {
      navigate("/");  // Navigate to the Messages page
    } else if (section === "categorization") {
      navigate("/categorization");  // Navigate to the Categorization page
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);  // Sign out from Firebase
      navigate("/login");   // Navigate to the login page
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="dashboard">
      <h1>Welcome, {currentUser?.displayName || "User"}!</h1>
      <div className="dashboard-container">
        <div
          className="dashboard-box"
          onClick={() => handleNavigate("messages")}
        >
          <h2>Messages</h2>
          <p>View and manage your messages here</p>
        </div>
        <div
          className="dashboard-box"
          onClick={() => handleNavigate("categorization")}
        >
          <h2>Dynamic Categorization</h2>
          <p>Manage and categorize your items here</p>
        </div>
      </div>
      <button onClick={handleLogout} className="logoutButton">
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
