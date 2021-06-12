import "./SignUp.css";
import { useState } from "react";
import { useAuth } from "../../context/auth-context";

export default function SignUp(){
    const { loginError, setLoginError, registerUser } = useAuth();

    const [accountDetails, setAccountDetails] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: ""
    })

    const handleCreate = () => {
        const regexExp = /^\S+@\S+$/;
        if(accountDetails.firstName === "" || accountDetails.lastName === "" || accountDetails.email === "" || accountDetails.password === "" ){
            setLoginError("Please enter all the details");
            return;
        }

        if(!regexExp.test(accountDetails.email)){
            setLoginError("Incorrect email");
            return;
        }
        
        registerUser(accountDetails.firstName, accountDetails.lastName, accountDetails.email, accountDetails.password);
    }
    const handleChange = (event) => {
        const { name, value } = event.target;
        setLoginError();
        setAccountDetails((prevVal) => {
            if(name === "firstName")
                return {
                    firstName: value,
                    lastName: prevVal.lastName,
                    email: prevVal.email,
                    password: prevVal.password
                }
            else if(name === "lastName")
                return {
                    firstName: prevVal.firstName,
                    lastName: value,
                    email: prevVal.email,
                    password: prevVal.password
                }
            else if(name === "email"){
                return {
                    firstName: prevVal.firstName,
                    lastName: prevVal.lastName,
                    email: value,
                    password: prevVal.password
                }
            }
            else if(name === "password")
                return {
                    firstName: prevVal.firstName,
                    lastName: prevVal.lastName,
                    email: prevVal.email,
                    password: value
                }
        });
    }
    return(
    <div className="signup-form">
    <h1>Create Account</h1>
    <div className="error-message">{loginError}</div>
    <input type="text" name="firstName" onChange={handleChange}  required className="input-box" placeholder="First Name"/>
    <input type="text" name="lastName" onChange={handleChange} required className="input-box" placeholder="Last Name"/>
    <input type="text" name="email" onChange={handleChange}  required className="input-box" placeholder="Email"/>
    <input type="password" name="password" onChange={handleChange} required className="input-box" placeholder="Password"/>       
    <button type="button" onClick={handleCreate} className="btn btn-large">Create</button>
    </div>
    )
}
