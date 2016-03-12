// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var widgetsSchema = mongoose.Schema({
    name: String,
    description: String,
    dashboardId: String,
    chartType: String,
    order: Number,
    offSet: Number,
    size: Object,
    minSize: Object,
    maxSize: Object,
    widgetType: String,
    metrics: Array,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Widgets', widgetsSchema);

