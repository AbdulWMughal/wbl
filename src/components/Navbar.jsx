import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context API/AuthContext";
import Logout from "../images/logout.png";

const Navbar = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate("/dashboard");  // Navigate back to the dashboard
  };

  return (
    <div className="navbar">
      <span className="logo">HighField Park Trust</span>
      <div className="user">
        <img src={currentUser.photoURL} alt="" />
        <span>{currentUser.displayName}</span>
        <button onClick={handleGoToDashboard}>
          <img src={Logout} alt="Go to dashboard" />
        </button>
      </div>
    </div>
  );
};

export default Navbar;
