import React, {useState,useEffect} from "react";
import "./App.css";
import Axios from "axios";

function App(){
  const [email, setEmail] = useState("");
  const [name, setUsername] = useState("");
  const [pass, setPassword] = useState("");
  const [loginStatus, getLoginStatus] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginResponse, getLoginResponse] = useState("");
  const [userList, getUsers] = useState([]);
  const [updateEmail, setupdateName] = useState("");
  const [state, setButton] = useState(false);
  
  const isClicked = () => {
    
    setButton(true)
  };
  const test = () => {
    const myElement = document.getElementsByName("test")[0];
    let x = myElement.textContent;
    alert(x);
  }
  
  Axios.defaults.withCredentials = true;

  useEffect (() =>{
    Axios.get('http://localhost:3001/api/get').then((response) => {
      getUsers(response.data);  
    });
 }, []);

  const submitRegister = () =>{

    Axios.post("http://localhost:3001/register",{
      email:email,
      username:name,
      password:pass,
    })
    getUsers([...userList,{email:email,username:name,password:pass},]); //this shows the updated list automatically
  
  };

  const submitLogin = () =>{
    
    Axios.post("http://localhost:3001/login",{
      email:email,
      username:name,
      password:pass,
    }).then((response) => {
      if (!response.data.auth){
        getLoginStatus(false)
        getLoginResponse(response.data.message)//must call this here because this is exact;y when the json message is being created, cannot try to call elsewhere because the message only exist here
        console.log(response.data.message)//contains the login status of the user, with their details
      }else{
        console.log(response.data)
        localStorage.setItem("token", response.data.token)
        getLoginStatus(true)
        Axios.get('http://localhost:3001/login').then((response) => {
        if (response.data.loggedIn === true) {
          setLoginUser(response.data.user[0].username);
        } else {
          console.log(response.data);
        }
      });
    }
  });
};


 const deleteUser = (user) => {
  Axios.delete(`http://localhost:3001/api/delete/${user}`);
 };

 const updateUser = (user) => {
  Axios.put("http://localhost:3001/api/update/",{
    email:updateEmail,
    username:user,
    password:pass,
  });
  setupdateName("");
 };
 const isAuth = () =>{

  Axios.get("http://localhost:3001/isUserAuth",{
    headers: {
      "x-access-token": localStorage.getItem("token"),
    },

    }).then((response) => {
      console.log(response);
    });
    
};
const logoutUser = () => {
  Axios.get('http://localhost:3001/logout').then(response => {
    if(response.data.auth){
      window.location.reload();
    }else{
      alert("error");
    }
  }).catch(err => console.log(err))
};


  return(
    <div className="App">
      <div className="RegisterForm">  
          <h2>Register Below</h2>
          <label >Email:</label>
          <input type="text" name= "email" onChange={(e) => {setEmail(e.target.value);}}/>
          <label >Username:</label>
          <input type="text" name= "name" onChange={(e) => {setUsername(e.target.value);}}/>
          <label >Password:</label>
          <input type="text" name= "pass" onChange={(e) => {setPassword(e.target.value);}}/>
          <button onClick={submitRegister}> Register</button>
          {userList.map((val, index) => {
  return (
    <div className="card" key={index}>
      <h4>Username: {val.username}</h4>
      <p name ="test">Email: {val.email}</p>
      <button onClick={() => { deleteUser(val.username) }}>Delete</button>
      <button onClick={()=> updateUser( val.username)}>Update</button>
      <input type="text" onChange={(e) => { setupdateName(e.target.value); }} />
    </div>
  );
})}

      </div>
      <div className="LoginForm">  
          <h2>Login Below</h2>
          <label >Email:</label>
          <input type="text" name= "email" onChange={(e) => {setEmail(e.target.value);}}/>
          <label >Username:</label>
          <input type="text" name= "name" onChange={(e) => {setUsername(e.target.value);}}/>
          <label >Password:</label>
          <input type="text" name= "pass" onChange={(e) => {setPassword(e.target.value);}}/>
          {!loginStatus && (<button  onClick={() => {submitLogin();isClicked()}} > Login</button> )}          
      </div>
       
      
      <button onClick={test}>java test</button>

      {loginStatus ? (
      <>
        <button onClick={isAuth}>Check Auth</button>
        <button onClick={logoutUser}>Logout</button>
        <h1>Welcome {loginUser}</h1>
      </>
      ) : (state === true && loginStatus !== true) && (//we are getting the state from the "isClicked" function
        <p>{loginResponse}</p>
      )}

    </div>

  );
}

export default App;