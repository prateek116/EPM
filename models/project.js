var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var projectSchema = new Schema({
	name: String,
	description: String,
	skillsNeeded: {
		web: Number,
		android: Number,
		ios: Number,
		iot: Number
	},
	startTime: Date,
	deadline: Date,
	status: String,
	managerEmail: String,
	developerEmail: String
});

var project = mongoose.model('project',projectSchema);

module.exports = project;