var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var imageSchema = new Schema({
	img: {data: Buffer , contentType: String}
});

var Image = mongoose.model('image',imageSchema );

module.exports = Image;