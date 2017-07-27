const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
//var flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const multer = require('multer');

import {user as User} from './models/user';
import {Project} from './models/project';
import {Image} from './models/image';

let sessionUser = null;

mongoose.connect('mongodb://localhost/EPM');


const app = express();

app.use( express.static(path.join(__dirname, 'uploads')))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));

app.use(passport.initialize());
app.use(passport.session());


app.use(expressValidator({
  errorFormatter: (param, msg, value) => {
    var namespace = param.split('.')
    , root    = namespace.shift()
    , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));


app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));






app.get('/',(req,res) => {
  res.render('index');
});

app.post('/users/add',(req,res) => {

  req.checkBody('email','Email is required').notEmpty();
  req.checkBody('email','Email is required').isEmail();
  req.checkBody('role','Role is required').notEmpty();
  req.checkBody('password','Password is required').notEmpty();
  req.checkBody('password1','Password not match').equals(req.body.password);
  req.checkBody('web','Email is required').isInt();
  req.checkBody('android','Email is required').isInt();
  req.checkBody('ios','Email is required').isInt();
  req.checkBody('iot','Email is required').isInt();





  let errors = req.validationErrors();



User.find({email:req.body.email},(err,users) => {
  if(err){
    throw err;
  }
  else{
    if(users.length){
      errors = true;
    }
  }

  if(errors)
  {
    console.log('Error');
    res.send("Error"); 
  }
  else
  {
    let newUser = User({
      email: req.body.email,
      role: req.body.role,
      password: req.body.password,
      webSkill: req.body.web,
      androidSkill: req.body.android,
      iosSkill: req.body.ios,
      iotSkill: req.body.iot

  });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        // Store hash in your password DB. 
        console.log("a");
        newUser.password = hash;
        console.log(newUser);

        newUser.save((err) => {
        console.log('user created');
        res.redirect("/login");
      });

    });

    })

  }

});
   
});


app.get('/login',(req,res) => {

  if(!sessionUser){
    res.render('login');
  }  

  else {
    res.send("already logged in");
  }
});


passport.use(new LocalStrategy({
  usernameField: 'email'
},
  (username, password, done) => {
    User.findOne({ email: username }, (err, user) => {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false);
      }
      else{
        bcrypt.compare(password, user.password, (err,isMatch) => {
        if(err) throw err;

        if(isMatch){
          return done(null, user);
        }

        else return done(null,false);
      });

      }
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});


app.post('/login',
  passport.authenticate('local',{successRedirect:'/loggedIn',failureRedirect:'/login'}),
  (req, res) => {
    
  });


app.get('/loggedIn',(req,res) => {

  sessionUser = req.user;
  //console.log(sessionUser);

  if(sessionUser.role === 'manager')
  {
    res.redirect('/options');
  }

  else if(sessionUser.role === 'developer')
  {
    res.redirect('/developerDetails');
  }

});





app.get('/options',(req,res) => {
  res.render('options',{
    user: sessionUser
  });
});





app.get('/developerDetails',(req,res) => {

  let projectHistory = [];
  let currentProject = [];

  Project.find().and([{status: 'completed'},{developerEmail: sessionUser.email}]).exec((err,projects) => {
    projectHistory = projects;
    Project.find().and([{status: 'ongoing'},{developerEmail: sessionUser.email}]).exec((err,projects) => {
      currentProject = projects;
      res.render('developerDetails',{
        projectHistory: projectHistory,
        currentProject: currentProject,
        developerSkills: sessionUser
      });

    });
  });



});





app.get('/createProject',(req,res) => {
  if(sessionUser.role=='manager'){
    res.render('project');
  }
});

app.post('/createProject',(req,res) => {


  let newProject = Project({
    name: req.body.name,
    description: req.body.description,
    startTime: req.body.start_time,
    deadline: req.body.deadline,
    status: req.body.status,
    managerEmail: sessionUser.email,
    skillsNeeded: {
      web: req.body.web,
      android: req.body.android,
      ios: req.body.ios,
      iot: req.body.iot
    }

  });

  newProject.save((err) => {
    if(err) throw err;
    console.log('project created');
    res.redirect('/options');
  });


});






app.get('/allProjects',(req,res) => {
  let ongoingProjects = [];
  let completedProjects = [];

  Project.find({status: 'ongoing'},(err,projects) => {
    ongoingProjects = projects;
    Project.find({status:'completed'},(err,projects) => {
      completedProjects = projects;
      res.render('allProjects',{
        ongoingProjects: ongoingProjects,
        completedProjects: completedProjects
      });
    });
  });

});



app.get('/assignProject',(req,res) => {
  let freeDevelopers = [];
  let flag = 0;
  User.find({role: 'developer'}, (err,users) => {
    Project.find({status:'ongoing'}).where('developerEmail').ne(null).select('-_id developerEmail').exec((err,projects) => {

      for(let iterator = 0; iterator<projects.length; iterator++)
      {
        projects[iterator] = projects[iterator].developerEmail;
      }

      freeDevelopers = users.filter((developer) => {
        flag = 1;
        return (!projects.includes(developer.email));
      });

      if(flag == 1)
      {
        res.render('freeDevelopers',{
          freeDevelopers: freeDevelopers
        });        
      }
    });
  });
  
})


app.post('/assignProject',(req,res) => {
  let projectName = req.body.name;
  let developerEmail = req.body.email;
  Project.findOne({name: projectName},(err,project) => {
    project.developerEmail = developerEmail;
    project.save((err) => {
      if(err) throw err;
      else {
        console.log('project assigned');
        res.redirect('/options');
      }
    });
  });
});




let upload = multer({dest: 'uploads/'});

app.get('/uploadImage',(req,res) => {
  res.render('uploadImage');
});

app.post('/uploadImage',upload.single('myImage'),(req,res) => {
  sessionUser.imageUrl = req.file.filename;
  sessionUser.save((err) => {
    if(err) throw err;
    else console.log("url saved");
    res.send('Image Uploaded')
  });

});

app.get('/logout',(req,res) => {
  req.logout();
  res.redirect('/login');
});


app.listen(3000,() => {
  console.log('Server started on port 3000...');
}) 

