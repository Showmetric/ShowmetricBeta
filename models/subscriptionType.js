var mongoose = require('mongoose');

// define the collection for our organization model
var subscriptionTypeSchema = mongoose.Schema({
    name: String,
    code: String,
    limits: Object,
    subscriptionCost:Number,
    currencyType:String,
    validity:Number,
    reportBuilder:Boolean,
    created: Date,
    updated: Date,
    deleted: Date


});

// create the model for organization and expose it to our app
module.exports = mongoose.model('subscriptionType', subscriptionTypeSchema);
