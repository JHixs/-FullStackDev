const  express =  require("express");
const  session =  require("express-session"); //remembers stuff after page refreshes
const bodyParser =  require('body-parser');
const cors = require("cors");
const mysql = require('mysql') ;
const bcrypt = require('bcrypt') ;
const cookieParser = require('cookie-parser') ;
const app = express();
const saltRounds = 10
const jwt = require ("jsonwebtoken")

app.use(express.json());
app.use(cors({
  origin:["http://localhost:3000"],
  methods:["GET", "POST"],
  credentials:true
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
  key: "userId",
  secret: "supermario",
  resave: false,
  saveUninitialized: false,
  cookie:{
    expires: 60 * 60 *24,
  },
}))

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "luigi",
});




app.get("/api/get", (req,res) => {
  const sqlSelect = "SELECT * FROM data.users";
  pool.query(sqlSelect, (err,result) => {
    res.send(result);  
  });
  
});

app.post("/register", (req,res) => {
  const  email = req.body.email;
  const  username = req.body.username;
  const  password = req.body.password;

  bcrypt.hash(password,saltRounds,(err,hash) => {
    if (err){
      console.log(err)
    }
    const sqlInsert = "INSERT INTO data.users (email,username,password) VALUES (?,?,?);"
    pool.query(sqlInsert ,[email,username,hash],(err,result) => {
    console.log(err);  
  });
  })
  
}); 

const  verifyJWT = (req, res, next) =>{
  const token =  req.headers["x-access-token"];

  if (!token){
    res.send("Yo we need a token");

  }else {
    jwt.verify(token,"jwtSecret", (err,decoded)=> {
      if (err){
        res.json({auth:false, message: "you failed Authentication process"});
      } else {
        req.userId = decoded.id;
        next();
      }
    });
  }
};
app.get("/isUserAuth", verifyJWT,(req, res) => {
  
    res.send(" You are Authenticated ");

});

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false});
  }
});
app.post("/login", (req,res) => {
  const  email = req.body.email;
  const  username = req.body.username;
  const  password = req.body.password;

  pool.query("SELECT * FROM data.users WHERE  email = ? AND username = ? ;" ,[email,username],(err,result) => {//checks database and filters to see if the data received from front end matches with any of the data in the back end
    if (err){
      res.send(err);  
    }
    if (result.length > 0) {  //only operates if anything was found from the filtering
      bcrypt.compare(password, result[0].password, (error, response) => { //compares the encrypted password
        if (response) {//Operates if previous (response = password compare) is true
          
          const id = result[0].id
          const token = jwt.sign({id},"jwtSecret",{
            expiresIn: '1d',
          });
          req.session.user = result;
          res.json({auth: true, token: token, user: result[0]}); //this is sent to frontend
        } else {//Operates if previous (response = password compare) is false
      
          res.json({auth: false, message: "Wrong username/password combination!"});
        }
      });
    } else {//only operates if nothing was found from the filtering
      res.json({auth: false, message: "Invalid user information"});
    }
  }
);
});


app.delete("/api/delete/:username", (req,res) => {
  const  person = req.params.username;
  const sqlDelete = "DELETE FROM data.users WHERE username = ?";
  pool.query(sqlDelete, person, (err,reult) => {
    if (err) console.log(err);
  })
  
});
app.put("/api/update/", (req,res) => {
  
  const  email = req.body.email;
  const  name = req.body.username;
  const  password = req.body.password;
  const sqlUpdate = "Update data.users SET  email = ? WHERE username = ?";//SET email = ?: This updates the value of the email column to the value you provide with respect to the username
 
  pool.query(sqlUpdate, [email,name,password], (err,reult) => {
    if (err) console.log(err);
  })
  
});

app.get('/logout', function (req, res) {
  req.session.destroy()
  return res.json({auth: true})
  //or res.status(401).end() if you don't want to send any message
});


app.listen(3001, () => {
  console.log("Connected to backend.");
});