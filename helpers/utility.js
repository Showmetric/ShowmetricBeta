var _ = require('lodash');
var Alert = require('../models/alert');
var channelHelper = require('../helpers/getChannelDetails');
var objectList = require('../models/objects');
var configAuth = require('../config/auth');
var subscription = require('../models/subscriptionType');
var organization = require('../models/organizations');
var Payment = require('../models/payments');
var Dashboard = require('../models/dashboards')
// to create a random string
var randomString = require("randomstring");
var sg = require('sendgrid')(configAuth.sendGridDetails.apiKey);
var request = require('request');
var User = require('../models/user');
var Widget = require('../models/widgets');
var dashboards = require('../models/dashboards')

//To check whether the user has required permission to get the widget data
var self = module.exports = {
    checkUserPermission: function (req, res, done) {
        Widget.findOne({_id: req.params.widgetId}, {
            dashboardId: 1,
            charts: 1,
            widgetType: 1
        }, function (err, response) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!response)
                return res.status(204).json({error: 'No records found'});
            else {
                req.dashboardId = response.dashboardId;
                if (req.user)
                    self.checkUserAccess(req, res, done);
                else
                    return res.status(401).json({error: 'User must be logged in'});

            }


        });
    },
    checkUserAccess: function (req, res, done) {
        User.findOne({
            _id: req.user._id
            // dashboards: {$elemMatch: {dashboardId: req.dashboardId}}
        }, function (err, user) {
            if (err)
                return res.status(500).json({error: 'Internal Server Error'});
            else if (!user)
                return res.status(401).json({error: 'Authentication required to perform this action'});
            else
                done(null, user);
        })
    },
    checkUserReportAccess: function (req, res, done) {
        User.findOne({
            _id: req.user._id,
            // dashboards: {$elemMatch: {dashboardId: {$in: req.dashboards}}}
        }, function (err, user) {
            if (err)
                return res.status(500).json({error: 'Internal Server Error'});
            else if (!user)
                return res.status(401).json({error: 'Authentication required to perform this action'});
            else
                done(null, user);
        })
    },
    findObjectsForProfile: function (req, res, done) {
        if (req.query.metaCondition === undefined && req.query.objectTypeId != undefined) {
            var condition = {profileId: req.params.profileID, objectTypeId: req.query.objectTypeId};
        }
        else if (req.query.metaCondition != undefined) {
            var condition = {profileId: req.params.profileID, meta: req.query.metaCondition};
        }
        else {
            var condition = {profileId: req.params.profileID};
        }
        objectList.find(condition, function (err, objects) {
            if (err) done(err);
            else if (objects != null && objects.length > 0) {
                req.profileId = objects[0].profileId;
                channelHelper.getChannelDetails(req, res, function (err, channel) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else {
                        if (channel.code === configAuth.channels.googleAnalytics) {
                            var result = _.chain(objects)
                                .groupBy("meta.webPropertyName")
                                .toPairs()
                                .map(function (currentItem) {
                                    return _.zipObject(["webPropertyName", "metricDetails"], currentItem);
                                })
                                .value();
                            req.app.objects = result;
                            done(null, result);
                        }
                        else {
                            req.app.objects = objects;
                            done(null, objects);
                        }
                    }
                })
            } else {
                req.app.objects = [];
                done(null, []);
            }
        })
    },
    sendEmail: function (mailOptions, alertId, done) {
        var request = sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: {
                personalizations: [
                    {
                        to: [
                            {
                                email: mailOptions.to,
                            },
                        ],
                        subject: mailOptions.subject,
                    },
                ],
                from: {
                    email: configAuth.emailVerification.username,
                    name:'Datapoolt',
                },
                content: [
                    {
                        type: 'text/html',
                        value: mailOptions.html
                    },
                ],
            },
        });
        //With callback
        sg.API(request, function(error, response) {
            if (error) done(null, 'success')
            else {
                Alert.update({_id: alertId}, {$set: {lastEvaluatedTime: new Date()}}, function (err, alertUpdate) {

                    done(null, 'success')
                })
            }
        });
    },
    dashboardList: function (req, res, done) {
        dashboards.find({orgId: req.user.orgId}, {
            _id: 1
        }, function (err, dashboards) {
            if (err)
                return res.status(500).json({error: 'Internal Server Error'});
            else if (!dashboards)
                return res.status(204).json({error: 'No record found'});
            else {
                //the array only the dashboards ids
                var dashboardsArray = [];
                for (var i = 0; i < dashboards.length; i++) {
                    dashboardsArray.push(dashboards[i]._id)
                }
                done(null, dashboardsArray)
            }
        })
    },
    widgetsList: function (req, res, done) {
        if (req.query.requestType !== configAuth.limitRequestType.alert) {
            var query = {dashboardId: {$in: req.dashboards}, widgetType: req.query.requestType }
        }
        else {
            var query = {dashboardId: {$in: req.dashboards}}
        }
        Widget.find(query, {
            _id: 1
        }, function (err, widgets) {
            if (err)
                return res.status(500).json({error: 'Internal Server Error'});
            else if (!widgets)
                return res.status(204).json({error: 'No record found'});
            else {
                var widgetsArray = [];
                for (var i = 0; i < widgets.length; i++) {
                    widgetsArray.push(widgets[i]._id)
                }
                done(null, widgetsArray)
            }
        })
    },
    alertsList: function (req, res, done) {
        Alert.find({widgetId: {$in: req.widgets}},
            {
                _id: 1
            }, function (err, alerts) {
                if (err)
                    return res.status(500).json({error: 'Internal Server Error'});
                else if (!alerts)
                    return res.status(204).json({error: 'No record found'});
                else {
                    done(null, alerts)
                }
            })
    },
    getSubscriptionType: function (req, res, done) {
        if(req.body.orgId && req.body.orgId !='undefined') var user = {_id:req.body.orgId};
        else var user = {_id: req.user.orgId}
        organization.findOne(user, function (err, subscriptionType) {
            if (err)
                return res.status(500).json({error: 'Internal Server Error'});
            else if (!subscriptionType)
                return res.status(204).json({error: 'No record found'});
            else {
                if (req.body.code) var query = {code:req.body.code};
                else var query = {_id:subscriptionType.subscriptionTypeId};
                subscription.findOne(query, function (err, response) {
                    if (err)
                        return res.status(500).json({error: 'Internal Server Error'});
                    else if (!response)
                        return res.status(204).json({error: 'No record found'});
                    else
                        done(null, {response:response,orgDetails:subscriptionType,apiKey:configAuth.razorPayCredentials.apiKey})
                })
            }
        })
    },
    getSubscriptionDetails:function (req,res,done) {
        subscription.findOne({code:req.query.code}, function (err, response) {
            if (err)
                return res.status(500).json({error: 'Internal Server Error'});
            else if (!response)
                return res.status(204).json({error: 'No record found'});
            else
                done(null, {response:response,apiKey:configAuth.razorPayCredentials.apiKey})
        })
    },
    updateSubscription:function (req,res,done) {
        var validity  = req.body.expDate?(new Date(req.body.expDate)):new Date();
        validity.setDate(validity.getDate() + req.validity);
        organization.update({'_id': req.orgId},{$set: {updated: new Date(),subscriptionTypeId:req.subscriptionId,subscriptionExpiresOn:validity}},function (err,user) {
            if (err)
                return res.status(500).json({error: 'Internal server error'})
            else if (!user)
                return res.status(501).json({error: 'Not implemented'})
            else{
                //var result = {'status': '200', 'orgId': req.orgId};
                if (req.code!=configAuth.subscriptionType.starterFree){
                    self.storePayment(req, res, function (err,storedDetail) {
                        done(null,storedDetail);
                    });
                }
                else done(null,req.subscriptions);

            }
        });
    },
    storePayment:function(req,res,done){
        var paymentObject = new Payment();
        paymentObject.orgId = req.orgId;
        paymentObject.paymentId = req.paymentId;
        paymentObject.invoiceNumber = req.orderId;
        paymentObject.amount = req.amount/100;
        paymentObject.currency = req.currency;
        paymentObject.paidOn = req.paidOn;
        paymentObject.subscriptionTypeId = req.subscriptionId;
        paymentObject.status = req.status;
        paymentObject.email = req.email;
        paymentObject.contact = req.contact;
        paymentObject.created = new Date();
        paymentObject.updated = new Date();
        paymentObject.save(function(err,payment){
            if (err)
                return res.status(500).json({});
            else if(!payment) return res.status(501).json({});
            else done(null,payment);
        });
    },
    sendVerificationMail: function (mailOptions, done) {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) done(error)
            else {
                done(null, 'success')
            }
        });
    },
    saveUser:function(req,res,done){
        User.findOne({'email': req.body.email}, function (err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            }
            else {
                // if there is no user with that email create the organization
                var newOrganization = new organization();
                newOrganization.name = req.body.organization, newOrganization.country = req.body.country;
                newOrganization.created = new Date();
                newOrganization.updated = new Date();
                // save the Organization
                newOrganization.save(function (err, response) {
                    if (err)
                        return done(err);
                    else {
                        //create token and expiry
                        var tokenId=response._id+new Date().getTime()+randomString.generate({length: configAuth.emailVerification.length, charset: configAuth.emailVerification.charSet})+new Date().getMilliseconds();
                        var tokenExpiry=new Date().getTime()+configAuth.emailVerification.validity;
                        // create the user
                        var newUser = new User();
                        // set the user's local credentials
                        newUser.email = req.body.email;
                        newUser.name = req.body.name;
                        newUser.pwdHash = newUser.generateHash(req.body.password);
                        newUser.phoneNo = newUser.phone;
                        newUser.orgId = response._id;
                        newUser.emailVerified=false;
                        newUser.emailVerification.expires=tokenExpiry;
                        newUser.emailVerification.tokenId=tokenId;
                        newUser.created = new Date();
                        newUser.updated = new Date();

                        // save the user
                        newUser.save(function (err, user) {
                            if (err)
                                return done(err);
                            else {
                                // HTML Version
                                newUser.html= '<p>Hi ' + user.name + ',</p>' +
                                    '<p> We have received your request for an invite.Click link below to activate your account</p><br><button style="background-color: #1a8bb3;border-radius: 12px;color:#fff;font-size: 24px;"><a style="text-decoration: none;color:#fff" href="'+configAuth.emailVerification.redirectLink+user.emailVerification.tokenId+'">Click to Activate</a></button> <p>Thanks for trying us out. Cheers!</p>'
                                self.sendConfirmationMail(newUser,function(err){
                                    if(err){
                                        User.remove({_id: user._id}, function (err,result){
                                            if (err)
                                                return res.status(500).json({error: 'Internal server error'});
                                            else if (!result)
                                                return res.status(501).json({error: 'Not implemented'});
                                            else
                                                return done(null, false, req.flash('signupMessage', 'Failed to send email.Try to signup again'));
                                        });
                                    }
                                    else
                                        return done(null, newUser,req.flash('signupMessage','Please check your mail for activation link'));
                                })
                            }
                        });
                    }
                    //return done(null, newUser);
                });
            }

        });
    },
    getObjectsBasedAccountId: function (req, res, done) {
        objectList.findOne({profileId: req.profileId, channelObjectId: req.getObjectId}, function (err, object) {
            if (err) return res.status(500).json({error: err});
            else if (!object) return res.status(204).json({error: 'No records found'});
            else done(null, object)
        });
    },
    getDashboardDetail:function(req,res,done){
        var dashboardId = req.params.dashboardId;
        if(dashboardId !='undefined') {
            Dashboard.findOne({'_id': dashboardId}, function (err, dashboardDetails) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else if (!dashboardDetails)
                    return res.status(204).json({error: 'No records found'});
                else done(null, dashboardDetails);
            })
        }
        else{
            done(null, []);
        }
    },
    sendConfirmationMail:function (user,done) {
        var request = sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: {
                personalizations: [
                    {
                        to: [
                            {
                                email: user.email,
                                name:user.name
                            },
                        ],
                        subject: 'Welcome to Datapoolt!',
                    },
                ],
                from: {
                    email: configAuth.emailVerification.username,
                    name:'Datapoolt',
                },
                content: [
                    {
                        type: 'text/html',
                        value: user.html
                    },
                ],
            },
        });
        //With callback
        sg.API(request, function(error, response) {
            if(error) done(error,null)
            else done(null,response)
        });
    }
};

