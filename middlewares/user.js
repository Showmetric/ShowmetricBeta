var user = require('../models/user');
var profile = require('../models/profiles');
var organizations = require('../models/organizations');
var subscriptionTypes = require('../models/subscriptionType');
var payments = require('../models/payments');
var dashboard = require('../models/dashboards');
var UserActivity = require('../models/userActivity');
var exports = module.exports = {};
var bcrypt = require('bcrypt-nodejs');
// to create a random string
var randomString = require("randomstring");
// to send mail
var configAuth = require('./../config/auth');
var utility = require('../helpers/utility');
var _ = require('lodash');
/**
 Function to get the user's details such as organization id,name ..
 @params 1.req contains the facebook user details i.e. username,token,email etc
 2.res have the query response
 @event pageList is used to send & receive the list of pages result
 */

exports.getUserDetails = function (req, res, next) {

    //To check user is logged in or not
    if (req.user) {
        user.find({_id: req.user._id}, function (err, user) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!user)
                return res.status(204).json({error: 'No records found'});
            else {
                var userResult = user;
                var orgId = user[0].orgId;
                organizations.find({_id: orgId}, {
                    subscriptionTypeId: 1,
                    subscriptionExpiresOn: 1
                }, function (err, result) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!result)
                        return res.status(204).json({error: 'No records found'});
                    else {
                        var subscriptionTypeId = result[0].subscriptionTypeId;
                        var userExpiry = result[0].subscriptionExpiresOn;
                        subscriptionTypes.findOne({_id: subscriptionTypeId}, function (err, type) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'});
                            else if (!type)
                                return res.status(204).json({error: 'No records found'});
                            else {
                                var subscriptionType = type.code;
                                var expiryDate = moment(userExpiry).format("YYYY-MM-DD");
                                var currentDate = moment(new Date).format("YYYY-MM-DD");
                                if (expiryDate >= currentDate) {
                                    var user = {
                                        user: userResult,
                                        subscriptionType: type,
                                        expiryDate: expiryDate,
                                        organization: result
                                    };
                                    req.app.result = user;
                                    next();
                                }
                                else {
                                    var user = {
                                        user: userResult,
                                        subscriptionType: type,
                                        statusCode: 1002,
                                        organization: result
                                    };
                                    req.app.result = user;
                                    next();
                                }
                            }
                        });
                    }
                });
            }
        });
    }
    else
        res.status(401).json({error: 'Authentication required to perform this action'})
};

exports.updateLastDashboardId = function (req, res, next) {
    user.update({'_id': req.user._id}, {
        $set: {
            "lastDashboardId": req.params.id,
            updated: new Date()
        }
    }, {upsert: true}, function (err, user) {
        if (err)
            return res.status(500).json({error: 'Internal server error'})
        else if (user == 0)
            return res.status(501).json({error: 'Not implemented'})
        else {
            dashboard.update({'_id': req.params.id}, {$set: {updated: new Date()}}, {upsert: true}, function (err, user) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'})
                else if (user == 0)
                    return res.status(501).json({error: 'Not implemented'})
                else {
                    req.app.result = {'status': '200', 'dashboardId': req.params.id};
                    next();
                }
            });
        }
    });
};

exports.getUserPassword = function (req, res, next) {

    if (req.user) {
        user.findOne({_id: req.user._id}, function (err, user) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!user)
                return res.status(204).json({error: 'No records found'});
            else {
                if (bcrypt.compareSync(req.body.currentPassword, user.pwdHash)) {
                    user.pwdHash = bcrypt.hashSync(req.body.newPassword, bcrypt.genSaltSync(8), null);
                    user.save(function (err) {
                        if (!err) {
                            return res.status(200).json({});
                        }
                    });
                }
                else {
                    return res.status(204).json({error: 'No records found'});

                }
            }
        });
    }
    else
        res.status(401).json({error: 'Authentication required to perform this action'})
};
exports.emailVerification = function (req, res, next) {
    var userResult = {};
    if (req.query.token) {
        user.findOne({'emailVerification.tokenId': req.query.token}, function (err, userDetail) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!userDetail) {
                userResult = {
                    status: configAuth.emailVerification.inValid
                };
                req.app.result = userResult;
                next();
            }
            else {
                if (userDetail.emailVerified == false) {
                    if (new Date().getTime() <= userDetail.emailVerification.expires.getTime()) {
                        var now = new Date();
                        user.update({
                            '_id': userDetail._id,
                            'emailVerification.tokenId': req.query.token
                        }, {
                            $setOnInsert: {created: now},
                            $set: {
                                updated: now,
                                emailVerified: true
                            }
                        }, {upsert: true}, function (err, success) {
                            if (err)
                                return res.status(500).json({
                                    error: 'Internal server error'
                                })
                            else if (!success)
                                return res.status(501).json({error: 'Not implemented'});
                            else {
                                user.findOne({_id: userDetail._id}, function (err, verifiedUser) {
                                    if (err)
                                        return res.status(500).json({error: 'Internal server error'});
                                    else if (!verifiedUser)
                                        return res.status(204).json({error: 'No records found'});
                                    else {
                                        userResult = {
                                            user: verifiedUser,
                                            status: configAuth.emailVerification.verified
                                        };
                                        req.app.result = userResult;
                                        next();
                                    }
                                })

                            }
                        })
                    }
                    else {
                        var tokenId = userDetail.orgId + new Date().getTime() + randomString.generate({
                                length: configAuth.emailVerification.length,
                                charset: configAuth.emailVerification.charSet
                            }) + new Date().getMilliseconds();
                        var tokenExpiry = new Date().getTime() + configAuth.emailVerification.validity;
                        var now = new Date();
                        user.update({
                            '_id': userDetail._id,
                            'emailVerification.tokenId': req.query.token
                        }, {
                            $setOnInsert: {created: now},
                            $set: {
                                updated: now,
                                'emailVerification.tokenId': tokenId,
                                'emailVerification.expires': tokenExpiry
                            }
                        }, {upsert: true}, function (err, success) {
                            if (err)
                                return res.status(500).json({
                                    error: 'Internal server error'
                                })
                            else if (!success)
                                return res.status(501).json({error: 'Not implemented'});
                            else {
                                user.findOne({_id: userDetail._id}, function (err, unVerifiedUser) {
                                    if (err)
                                        return res.status(500).json({error: 'Internal server error'});
                                    else if (!unVerifiedUser)
                                        return res.status(204).json({error: 'No records found'});
                                    else {
                                        userDetail.html =
                                            '<p><img alt="" src="https://www.datapoolt.co/wp-content/uploads/2016/10/Logo@3x.png" width=150 height=50/></p>'+ '<p>Hi ' + unVerifiedUser.name + ',</p>' +
                                            '<p>Welcome to Datapoolt!</p>'+
                                            '<p> We are glad to on-board you with Datapoolt. Please activate your Datapoolt account by clicking the verification link below:</p><a href="' + configAuth.emailVerification.redirectLink + unVerifiedUser.emailVerification.tokenId + '">Click Here</a><br>' +
                                            '<p>Here is a short video to help you set up your account and explore what Datapoolt can do for you and your team.</p>'+
                                            '<p>Our team is here to assist you with any questions you may have. </p>'+
                                            "<p>Simply reply to this email if you'd like to get in touch.</p>"
                                            +' <p>Cheers,</p><br><p>Datapoolt Team</p>';
                                        utility.sendConfirmationMail(userDetail, function (err) {
                                            if (err) next(err,null);
                                            else
                                                userResult = {
                                                    user: unVerifiedUser,
                                                    status: configAuth.emailVerification.mailResend
                                                };
                                            req.app.result = userResult;
                                            next();
                                        })
                                    }
                                })
                            }
                        })
                    }
                }
                else {
                    user.findOne({_id: userDetail._id}, function (err, verifiedUser) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'});
                        else if (!verifiedUser)
                            return res.status(204).json({error: 'No records found'});
                        else {
                            userResult = {
                                user: verifiedUser,
                                status: configAuth.emailVerification.alreadyVerified
                            };
                            req.app.result = userResult;
                            next();
                        }
                    })
                }
            }
        })
    }
    else {
        return res.status(500).json({error: 'Internal server error'});
    }
};

exports.getPaymentDetails = function (req, res, next) {
    payments.find({'orgId': req.user.orgId}, function (err, paymentDetails) {
        if (err)
            return res.status(500).json({error: 'Internal server error'});
        else if (!paymentDetails)
            return res.status(204).json({error: 'No records found'});
        else {
            subscriptionTypes.find(function (err, type) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else if (!type)
                    return res.status(204).json({error: 'No records found'});
                else {
                    var subscriptionDetails = []
                    for (var i = 0; i < paymentDetails.length; i++) {
                        var subsciptionType = _.findIndex(type, function (o) {
                            return o._id == paymentDetails[i].subscriptionTypeId;
                        });
                        paymentDetails[i].subscriptionTypeId = type[subsciptionType].name;
                    }
                    req.app.result = paymentDetails;
                    next();
                }
            });
        }
    });
};
exports.fetchUserActivityDetails = function (req, res, next) {
    if(req.user) {
        UserActivity.find({'userId': req.user._id}, function (err, UserActivityDetails) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!UserActivityDetails.length || !UserActivityDetails)
                return res.status(204).json({error: 'No records found'});
            else{
                if(UserActivityDetails.length==1)
                    req.app.result = true;
                else
                    req.app.result = false;
                next();
            }
        })
    }
    else
        res.status(401).json({error: 'Authentication required to perform this action'});
}