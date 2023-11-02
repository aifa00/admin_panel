//imports
require('dotenv').config(); 
const express=require('express');
const mongoose=require('mongoose');
const session=require('express-session');


const app=express();
const PORT=process.env.PORT || 4000;


//database connection 
mongoose.connect(process.env.DB_URI,{ useNewUrlParser:true,useUnifiedTopology: true });
const db= mongoose.connection;
db.on('error',(error)=>console.log(error));
db.once('open',()=>console.log('connected to the database!'));


//middlewares
app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(session({
    secret:'anystrongsecretkey',
    resave:false,
    saveUninitialized:true
}));
 
app.use((req , res, next)=>{
    res.locals.message = req.session.message;
    delete req.session.message;
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();
});

//set static
app.use(express.static('uploads'));

//set template engine
app.set('view engine','ejs');   

//route prefix
app.use('',require('./routes/routes'));

app.listen(PORT,()=>{
    console.log(`server is running on http://localhost:${PORT}`);
});