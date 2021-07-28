import { useAuth } from "../../context/auth-context";
import "./Account.css";
import { useEffect, useState } from "react";

export default function Account(){
    const { isUserLoggedIn, logoutUser } = useAuth();
    const [userName, setUserName] = useState("");

    useEffect(() => {
        setUserName(JSON.parse(localStorage?.getItem("user")).name);
    }, [])
    
    return (
        <div className="account-container">
        <h1 className="account-header">Hello, {userName}</h1>
        <h2>Welcome to popbop</h2>
        <button onClick={() => {logoutUser()}}  className="btn btn-small">{isUserLoggedIn ? "logout" : "login"}</button>
        </div>
    )
}