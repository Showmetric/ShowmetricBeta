// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var widgetsSchema = mongoose.Schema({
    name: String,
    textData: String,
    reportId: String,
    row: Number,
    col: Number,
    sizeX: Number,
    sizeY: Number,
    widgetType: String,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('textWidgets', widgetsSchema);

