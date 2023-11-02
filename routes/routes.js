const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const users = require('../models/users');
const fs = require('fs');

// Create a storage engine for Multer
var storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null, './uploads');
    },
    filename:(req,file,cb)=>{
        cb(null,file.fieldname +'_'+ Date.now() + '_' + file.originalname);
    }
});

//like a middleware
var upload = multer({storage:storage}).single('image');

var isAdmin = (req, res, next) => {
    if (req.session.level==='admin'){
        next()
    } else {
        res.redirect('/home');
    }
}

//insert a user into database
router.post('/add',upload,async(req,res)=>{
    const user =new User({
        name:req.body.name,
        email:req.body.email,
        phone:req.body.phone,
        password:req.body.password,
        image:req.file.filename,
        level:req.body.level
    });

    try {
        const savedUser = await user.save();

        req.session.message={
            type:'success',
            message:'User added successfully',
        };
        res.redirect('/panel');

    } catch (err) {
        // Handle error
        res.json({message:err.message , type:'danger'});
    }
});

//login route
router.get('/', (req, res) => {
    if (req.session.email) {
        // MAYBE: say "Already logged in"
        res.redirect('/home');
    } else {
        res.render('login');
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
      
        if (user.password === req.body.password) {
            req.session.email=user.email;
            req.session.level=user.level;
            res.redirect('/home');
        } else {
            res.send('wrong password');
        }
    } catch  {
        //Show error some how
        //res.send('Please signIn');
        res.redirect('/');
    }
});

router.get('/panel', isAdmin, async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render('panel', { title: 'Home Page', users });
    } catch (err) {
        res.json({ message: err.message });
    }
});

router.get('/home', (req, res) => {
    if (req.session.email) {
        // MAYBE: say "Already logged in"
        res.render('index', { title: 'Home Page', users });
    } else {
        res.redirect('/');
    }
})

router.get('/add',isAdmin,(req,res)=>{
    res.render('add_users',{title:'Add user'});
});

router.get('/edit/:id', isAdmin,async (req, res) => {
    if (req.session.email){

        try {
            const id = req.params.id;
            const user = await User.findById(id).exec();
    
            if (!user) {
                return res.redirect('/');
            }
    
            res.render('edit_users', { title: 'Edit User', user });
        } catch (err) {
            res.redirect('/panel');
        }

    }
    
});


// Update user route
router.post('/update/:id', upload, async (req, res) => {
    try {
        let id = req.params.id;
        let new_image = '';

        if (req.file) {
            new_image = req.file.filename;
            try {
                fs.unlinkSync('./uploads/' + req.body.old_image);
            } catch (err) {
                console.log(err);
            }
        } else {
            new_image = req.body.old_image;
        }


        // Handle other data
        const result = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image
        }).exec();


        if (result) {
            req.session.message = {
                type: 'success',
                message: 'User Updated successfully!'
            };
            res.redirect('/panel');
        } else {
            res.json({ message: 'User not found', type: 'danger' });
        }


    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});



//delete user route
router.get('/delete/:id',async (req,res)=>{
    try{
        let id = req.params.id;


        const result=await User.findByIdAndRemove(id).exec();

        if(result.image != ''){
            try{
                fs.unlinkSync('./uploads'+result.image);
            }catch(err){
                console.log(err);
            }
        }

        
        if (result) {
            req.session.message = {
                type: 'danger',
                message: 'User Deleted successfully!'
            };
             res.redirect('/panel');
         }
         else {
             res.json({ message: 'User not found', type:'danger' });
         }


    }catch(err){
        res.json({message:err.message});
    }
});


router.get('/logout', (req, res) => {
    req.session.destroy(()=>{});
    // Say logged out
    res.redirect('/');
  });


module.exports = router;