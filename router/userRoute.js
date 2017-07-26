


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

  });

});




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
  res.render('chooseManager');

});




app.post('/loggedIn',function(req,res){
  var email = req.body.email;
  sessionUser.manager = email;
  sessionUser.save(function(err){
    if (err) throw err;
    else console.log('manager updated');
    if(sessionUser.role=='manager'){
      res.redirect('/options');
    }
    else if(sessionUser.role=='developer'){
      res.redirect('/developerDeatils');
    }
  });
});



app.get('/logout',function(req,res){
  req.logout();
  res.redirect('/login');
});




app.get('/options',function(req,res){
  res.render('options');
});