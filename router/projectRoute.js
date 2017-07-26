app.get('/developerDetails',function(req,res){

  Project.find({developerEmail: sessionUser.email},function(err,projects){
    res.render('developerDetails',{
      project: project,
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

  });


});
