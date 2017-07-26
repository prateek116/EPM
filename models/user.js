var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var skill = new Schema({name: Number});

var userSchema = new Schema({
	email: {type: String},
	role: String,
	password: String,
	webSkill: Number,
  androidSkill: Number,
  iosSkill: Number,
  iotSkill: Number,
  imageUrl: String 
});

/*userSchema.pre('save', function(next,done) {
  // get the current date
  var self = this;
  mongoose.models["user"].findOne({email: self.email},function(err,results){
  	if(err){
  		done(err);
  	}
  	else if(results){
  		self.invalidate("email","email must be unique");
  		done(new Error("email must be unique"));
  	}else{
  		done();
  	}
  });

  next();
});*/

var user = mongoose.model('user',userSchema);
module.exports = user;