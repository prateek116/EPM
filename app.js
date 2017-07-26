var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
//var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');


var User = require('./models/user.js');
var Project = require('./models/project');

var sessionUser = null;

mongoose.connect('mongodb://localhost/EPM');


var app = express();

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
  errorFormatter: function(param, msg, value) {
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


/*app.use(function(req,res,next){
  res.locals.sessionUser = req.user || null;
});*/




app.get('/',function(req,res){
  res.render('index');
});

app.post('/users/add',function(req,res){

  req.checkBody('email','Email is required').notEmpty();
  req.checkBody('email','Email is required').isEmail();
  req.checkBody('role','Role is required').notEmpty();
  req.checkBody('password','Password is required').notEmpty();
  req.checkBody('password1','Password not match').equals(req.body.password);
  req.checkBody('web','Email is required').isInt();
  req.checkBody('android','Email is required').isInt();
  req.checkBody('ios','Email is required').isInt();
  req.checkBody('iot','Email is required').isInt();





  var errors = req.validationErrors();



User.find({email:req.body.email},function(err,users){
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
    var newUser = User({
      email: req.body.email,
      role: req.body.role,
      password: req.body.password,
      webSkill: req.body.web,
      androidSkill: req.body.android,
      iosSkill: req.body.ios,
      iotSkill: req.body.iot

  });



  //  console.log('Success');

    //console.log(newUser);

    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(newUser.password, salt, function(err, hash) {
          // Store hash in your password DB. 
          console.log("a");
          newUser.password = hash;
          console.log(newUser);

          newUser.save(function(err){
          console.log('user created');
          res.redirect("/login");
      });

    });

    })

    


    

  }

/*  User.find({}, function(err, users) {
  if (err) throw err;

  // object of all the users
  console.log(users);
});*/


});

  //  res.send("Success");
   


});


/*app.get('/users/skills',function(req,res){
  res.render('index1');
});*/

app.get('/login',function(req,res){

 // console.log(req.session.passport.user +'d');

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
  function(username, password, done) {
    User.findOne({ email: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false);
      }
      else{
        bcrypt.compare(password, user.password, function(err,isMatch){
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

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


app.post('/login',
  passport.authenticate('local',{successRedirect:'/loggedIn',failureRedirect:'/login'}),
  function(req, res) {
    
  });


app.get('/loggedIn',function(req,res){

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





app.get('/options',function(req,res){
  res.render('options');
});





app.get('/developerDetails',function(req,res){

  var projectHistory = [];
  var currentProject = [];
 // console.log("hi");
  Project.find().and([{status: 'completed'},{developerEmail: sessionUser.email}]).exec(function(err,projects){
    projectHistory = projects;
    Project.find().and([{status: 'ongoing'},{developerEmail: sessionUser.email}]).exec(function(err,projects){
      currentProject = projects;
      console.log(projectHistory);
      console.log("a");
      console.log(currentProject);
      res.render('developerDetails',{
        projectHistory: projectHistory,
        currentProject: currentProject,
        developerSkills: sessionUser
      });

    });
  });



});





app.get('/createProject',function(req,res){
  if(sessionUser.role=='manager'){
    res.render('project');
  }
});

app.post('/createProject',function(req,res){


  var newProject = Project({
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

  newProject.save(function(err){
    if(err) throw err;
    console.log('project created');
    res.redirect('/options');
  });


});






app.get('/allProjects',function(req,res){
  var ongoingProjects = [];
  var completedProjects = [];

  Project.find({status: 'ongoing'},function(err,projects){
    ongoingProjects = projects;
    Project.find({status:'completed'},function(err,projects){
      completedProjects = projects;
      res.render('allProjects',{
        ongoingProjects: ongoingProjects,
        completedProjects: completedProjects
      });
    });
  });

});



app.get('/assignProject',function(req,res){
  var freeDevelopers = [];
  var flag = 0;
  User.find({role: 'developer'},function(err,users){
    Project.find({status:'ongoing'}).where('developerEmail').ne(null).select('-_id developerEmail').exec(function(err,projects){

      for(var iterator = 0; iterator<projects.length; iterator++)
      {
        projects[iterator] = projects[iterator].developerEmail;
      }

      freeDevelopers = users.filter(function(developer){
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


app.post('/assignProject',function(req,res){
  var projectName = req.body.name;
  var developerEmail = req.body.email;
  Project.findOne({name: projectName},function(err,project){
    project.developerEmail = developerEmail;
    project.save(function(err){
      if(err) throw err;
      else {
        console.log('project assigned');
        res.redirect('/options');
      }
    });
  });
});





app.get('/logout',function(req,res){
  req.logout();
  res.redirect('/login');
});


app.listen(3000,function(){
  console.log('Server started on port 3000...');
})

