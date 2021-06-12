import "./Login.css";
import { useAuth } from "../../context/auth-context";
import { useState } from "react";
import Loader from "../Loader/Loader";
import { useLoader } from "../../context/loader-context";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Login() {
    const {isUserLoggedIn, loginUserWithCredentials, registerError,setRegisterError} = useAuth();
    const [credentials, setCredentials] = useState({
        email: "",
        password: ""
    });
    const {isLoading} = useLoader();
    const {state} = useLocation();
    const navigate = useNavigate();

    if(isUserLoggedIn){
        navigate(state?.from? state.from : "/");
    }
     function loginHandler() {  
        loginUserWithCredentials(credentials.email, credentials.password);
    }
    function handleChange(event){
        setRegisterError();
        const {name, value} = event.target;
       
            setCredentials((prevVal) => {
                if(name === "email")
                    return  { 
                    email: value, 
                    password: prevVal.password
                    }
                else if(name === "password")
                    return {
                        email: prevVal.email,
                        password: value
                    }
            });
        }
       
    
    return (
        <> {isLoading && <Loader />}
           {!isLoading && <div className="login-form">
            <h1>Login</h1>
            <div className="error-message">{registerError}</div>
            <label>Email </label>
            <input type="text" name="email" onChange={handleChange} required className="input-box"/>
            <label>Password </label>
            <input type="password" name="password" onChange={handleChange} required className="input-box"/>
            <button type="button" onClick={loginHandler} className="btn btn-primary btn-large">{isUserLoggedIn ? "logout" : "LOG IN"}</button>
            <Link to="/register"><button type="button" className="btn btn-large btn-create">Create Account</button></Link> 
            </div>
}
        </>
    )
}