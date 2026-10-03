import { useApp } from "./context/AppContext";
import "./BannedScreen.css";

export default function BannedScreen() {
  const { logout } = useApp();

  return (
    <div className="banned-container">
      <h1 className="banned-title">You Have Been Banned!</h1>
      <button type="button" className="banned-logout-btn" onClick={logout}>
        Log Out
      </button>
    </div>
  );
}