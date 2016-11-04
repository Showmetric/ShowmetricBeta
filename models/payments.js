var mongoose = require('mongoose');

// define the collection for our organization model
var paymentSchema = mongoose.Schema({
    orgId:String,
    paymentId:String,
    invoiceNumber: String,
    amount:Number,
    contact:String,
    currency:String,
    email:String,
    paidOn:Date,
    subscriptionTypeId:String,
    status:String,
    validityFrom:Date,
    validityTo:Date,
    created: Date,
    updated: Date,
    deleted: Date
});
// create the model for organization and expose it to our app
module.exports = mongoose.model('Payment', paymentSchema);
