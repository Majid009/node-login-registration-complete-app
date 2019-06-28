const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const ejs = require('ejs');
var cookieParser = require('cookie-parser')

// Importing / Loading User Model
const User = require('./Models/user'); 

const app = express();
const port = process.env.PORT || 3000;

// connecting to MongoDB
mongoose.connect('mongodb://localhost/project', {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', (err)=> console.log('DB Connection Error: '+err) );
db.once('open' , ()=>console.log('connected to Database...') );

// =========== BodyParser Middleware ====================
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

//============= set view engine for node.js  ==================
app.set('view engine', 'ejs')

// ============== Cookie parser setting -==============
app.use(cookieParser());


app.get('/' ,(req,res)=>{
    res.render('index');
});

// Route To display login form
app.get('/login' , (req,res)=>{
    res.render('login');
});

// Route To display Registration form
app.get('/register' , (req,res)=>{
    res.render('register');
});

// Route to Proccess Login Functionality
app.post('/login' , (req, res)=>{
  let username = req.body.username ;
  let password = req.body.password ;

  if(!username){
      return res.render('login',{message:'username is required'}); // bad request
  }

  if(!password){
    return res.render('login',{message:'password is required'}); // bad request
  }

  if(username && password){
      // getting user info from Database
  User.findOne({username:username , password: password} ,(err , user)=>{
     
    if(err)
     return res.json({message: 'something went wrong.'});
   
    if(!user){
        return res.render('login',{message:'incorrect login details...try again'}); // bad request
    }
    if(user){
      // creating token and sending as response
      let paylaod = { username : user.username };
      jwt.sign(paylaod , 'secreteKey' , {expiresIn: '15m'} , (err , token)=>{
       if(!err){
           console.log('Login Successful .... Token is sent to you.');
           res.cookie('token', token, {maxAge: (1000 * 60 * 60 * 24) }); // saving for next use
           res.redirect('/dashboard');
       }
      });

    }
});

  }
 
});

// Dashboard Route which is protected 
app.get('/dashboard' , verifyToken , (req,res)=>{
  jwt.verify(req.token , 'secreteKey' , (err, authData)=>{
      if(err){
          res.redirect('/login'); 
      } else{
          res.render('dashboard' ,{data: authData});
      }
  })
});

// VerifyToken MiddleWare
function verifyToken(req,res , next){
    
    let token = req.cookies.token ; // getting token from cookie
    
    if(typeof token !== 'undefined'){
    // save token for next use
      req.token = token;
      next(); // go to next middleware
    } else{
        res.status(403).render('403') // forbidden Access
    }
}

// processing of  Register a new user
app.post('/register' , (req,res)=>{
   if(!req.body.username){
    return res.status(400).send({message: 'username is required'});
   } 

   if(!req.body.password){
     return res.status(400).send({message: 'password is required'});
   } 

   if(req.body.username && req.body.password){
     
    // check wether username already exists in DB or Not
    User.findOne({username : req.body.username} , (err, user)=>{
     if(user){
        return res.render('register',{message:'Username exists already !'}); // user exists
     } else{
         let newUser = new User();
         newUser.username = req.body.username ,
         newUser.password = req.body.password
         
         newUser.save().then(function(product){
            res.render('register',{message:'New user registered succussuly !'})
         });
     }
    });

   }
});

// Logout Route 
app.get('/logout' , (req,res)=>{
    res.clearCookie('token');
    res.redirect('/login');
 });

app.listen(port , ()=>{console.log('server started at port '+port) });