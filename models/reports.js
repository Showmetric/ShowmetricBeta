// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var ObjectIdSchema = mongoose.Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;
// define the schema for our user model
var reportsSchema = mongoose.Schema({
    name: String,
    userId:String,
    orgId: String,
    dashboards:Array,
    type: String,
    customReportId : {type:ObjectIdSchema, default: function () { return new ObjectId()} },
    widgets : Object,
    pdfLink : String,
    isDraft : Boolean,
    dashboardDeleted:Boolean,
    startDate:Date,
    endDate:Date,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Reports', reportsSchema);

