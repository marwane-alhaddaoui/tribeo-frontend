import { useState } from "react";
import UserManagement from "./UserManagement";
import SessionManagement from "./SessionManagement";
import "../../styles/AdminDashboard.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="admin-dashboard">
      <h1 className="admin-title">⚙️ Admin Dashboard</h1>

      {/* Menu interne */}
      <div className="admin-nav">
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          👤 User Management
        </button>
        <button
          className={activeTab === "sessions" ? "active" : ""}
          onClick={() => setActiveTab("sessions")}
        >
          📅 Session Management
        </button>
      </div>

      {/* Contenu dynamique */}
      <div className="admin-content">
        {activeTab === "users" && <UserManagement />}
        {activeTab === "sessions" && <SessionManagement />}
      </div>
    </div>
  );
}
