var userDetails = require('../middlewares/user');
var userActivity = require('../helpers/user');
var configAuth = require('../config/auth');
var limitcheck = require('../helpers/pricing')
var getSubscriptionDetails = require('../helpers/utility');
var moment = require('moment');
var request = require('request');
var nodemailer = require('nodemailer');
var User = require('../models/user');
var Subscription = require('../models/subscriptionType')

module.exports = function (app, passport) {
    var codeValue;
    var subscribedAmount;
    var newUser;
    // HOME PAGE (with login links)
    app.get('/', function (req, res) {
        if (req.user) res.redirect('profile');
        else res.render('../public/home.ejs'); // load the index.ejs file
    });


    // LOGIN ===============================

    app.get('/privacy', function (req, res) {
        res.render('../public/privacy.ejs'); // load the Privacy Policy file
    });

    app.get('/pricing', function (req, res) {
        res.render('../public/pricing.ejs');
    });

    app.get('/features', function (req, res) {
        res.render('../public/productfeatures.ejs');
    });

    app.get('/faqs', function (req, res) {
        res.render('../public/faqs.ejs');
    });

    app.get('/integrations', function (req, res) {
        res.render('../public/integrations.ejs');
    });

    // show the login form
    app.get('/api/v1/login', function (req, res) {
        if (req.user && req.user.emailVerified == true) res.redirect('/profile');
        else
        // render the page and pass in any flash data if it exists
            res.render('../public/login.ejs', {message: req.flash('loginMessage')});
    });

    // process the login form - app.post('/login', do all our passport stuff here);
    app.post('/api/v1/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/api/v1/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // SIGNUP - show the signup form
    app.get('/api/v1/signup', function (req, res) {
        codeValue = req.query.code;
        subscribedAmount = req.query.amount
        res.render('../public/signup.ejs', {message: req.flash('signupMessage')});
    })
    // SIGNUP - show the signup form
    app.get('/api/v1/signupWithPayment', function (req, res) {
        res.render('../public/signupWithPayment.ejs', {message: req.flash('signupMessage'), amount: req.query.amount});
    })
    app.post('/api/v1/changePassword', userDetails.getUserPassword, function (req, res) {

    });

//Get the details of logged in user
    app.get('/api/v1/me', userDetails.getUserDetails, function (req, res) {
        res.json({userDetails: req.app.result});
    });

// =====================================
// PROFILE SECTION =====================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', function (req, res) {
        if (req.user) {
            userActivity.saveUserActivity(req, res, function (err, userReponse) {
            });
            res.render('../public/profile.ejs');
        }
        else res.redirect('/api/v1/login');
    });
    app.get('/reports', function (req, res) {
        res.render('../public/reports.ejs');
    });
    app.get('/customReports', function (req, res) {
        res.render('../public/customReports.ejs');
    });

    app.get('/signout', function (req, res) {
        req.logout();
        res.redirect('/');
    });
//get available dashboards or widgets or alerts
    app.get('/api/v1/subscriptionLimits', function (req, res) {
        if (req.user) {
            limitcheck.checkUserSubscriptionLimit(req, res, function (err, response) {
                res.json(response);
            });
        }
        else res.status(401).json({error: 'Authentication required to perform this action'});
    });
    app.post('/api/v1/signup', function (req, res, next) {
        //codeValue = req.query.code;
        req.body.code = codeValue;
        passport.authenticate('local-signup', function (err, user, info) {
            newUser = user;
            if (err) return next(err);
            // Redirect if it fails
            if (!user) return res.render('../public/signup.ejs', {message: req.flash('signupMessage', 'The email is already taken.')});
            if (codeValue === configAuth.subscriptionType.starterFree || codeValue === undefined) {
                req.orgId = newUser.orgId;
                req.subscriptionId = newUser.subscriptionId;
                req.validity = newUser.validity;
                req.code = codeValue
                getSubscriptionDetails.updateSubscription(req, res, function (updateDetails) {
                    var mailOptionsSubmitter = {
                        from: 'Datapoolt Invites <alerts@datapoolt.co>',
                        to: newUser.email,
                        subject: newUser.name + ', we\'ve received your request for an invite',
                        // HTML Version
                        html: '<p>Hi ' + newUser.name + ',</p>' +
                        '<p> We have received your request for an invite.Click link below to activate your account</p><br><button style="background-color: #1a8bb3;border-radius: 12px;color:#fff;font-size: 24px;"><a style="text-decoration: none;color:#fff" href="' + configAuth.emailVerification.redirectLink + newUser.emailVerification.tokenId + '">Click to Activate</a></button> <p>Thanks for trying us out. Cheers!</p>'
                    };
                    var transporter = nodemailer.createTransport({
                        service: configAuth.emailVerification.service,
                        auth: {
                            user: configAuth.emailVerification.username,
                            pass: configAuth.emailVerification.password
                        }
                    });
                    transporter.sendMail(mailOptionsSubmitter, function (error, info) {
                        if (error) {
                            User.remove({_id: newUser._id}, function (err, result) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'});
                                else if (!result)
                                    return res.status(501).json({error: 'Not implemented'});
                                else
                                    res.render('../public/signup.ejs', {message: req.flash('signupMessage','Failed to send email.Try to signup again')});

                            });
                        }
                        else {
                           // res.render('../public/signup.ejs', {message: req.flash('signupMessage', 'Please check your mail for activation link')});
                           //  res.render('../public/confirmation.ejs');
                             res.redirect('/confirmation')
                        }
                    });
                })
            }
            else return res.redirect('/payment?code=' + req.body.code);
        })(req, res, next);
    });
    app.get('/confirmation',function (req,res) {
        res.render('../public/confirmation.ejs');
    })
    app.get('/payment', function (req, res) {
        Subscription.findOne({code:req.query.code}, function (err, subscription) {
            if (err)
                return res.status(500).json({error: 'Internal Server Error'});
            else if (!subscription)
                return res.status(204).json({error: 'No record found'});
            else
                res.render('../public/razorPay.ejs', {amount: subscription.subscriptionCost*100});
        })
    })
    app.post('/api/v1/savePayments', function (req, res) {
        if(newUser){
            request({
                method: 'POST',
                url: 'https://' + configAuth.razorPayCredentials.apiKey + ':' + configAuth.razorPayCredentials.apiKeySecret + '@api.razorpay.com/v1/payments/' + req.body.paymentId + '/capture',
                form: {
                    amount: req.body.amount / 100
                }
            }, function (error, response, body) {
                var body = JSON.parse(body);
                req.orgId = newUser.orgId;
                req.subscriptionId = newUser.subscriptionId;
                req.validity = newUser.validity;
                req.orderId = body.order_id;
                req.amount = body.amount;
                req.currency = body.currency;
                req.paidOn = moment.unix(body.created_at).format("YYYY-MM-DD HH:mm:ss");
                req.status = body.status;
                req.email = body.email;
                req.contact = body.contact;
                var mailOptionsSubmitter = {
                    from: 'Datapoolt Invites <alerts@datapoolt.co>',
                    to: newUser.email,
                    subject: newUser.name + ', we\'ve received your request for an invite',
                    // HTML Version
                    html: '<p>Hi ' + newUser.name + ',</p>' +
                    '<p> We have received your request for an invite.Click link below to activate your account</p><br><button style="background-color: #1a8bb3;border-radius: 12px;color:#fff;font-size: 24px;"><a style="text-decoration: none;color:#fff" href="' + configAuth.emailVerification.redirectLink + newUser.emailVerification.tokenId + '">Click to Activate</a></button> <p>Thanks for trying us out. Cheers!</p>'
                };
                var transporter = nodemailer.createTransport({
                    service: configAuth.emailVerification.service,
                    auth: {
                        user: configAuth.emailVerification.username,
                        pass: configAuth.emailVerification.password
                    }
                });
                transporter.sendMail(mailOptionsSubmitter, function (error, info) {
                    if (error) {
                        User.remove({_id: newUser._id}, function (err, result) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'});
                            else if (!result)
                                return res.status(501).json({error: 'Not implemented'});
                            else
                                res.render('../public/signup.ejs', {message: req.flash('signupMessage','Failed to send email.Try to signup again')});
                        });
                    }
                    else {
                        getSubscriptionDetails.updateSubscription(req, res, function (updateDetails) {
                            res.render('../public/signup.ejs', {message: req.flash('signupMessage', 'Please check your mail for activation link')});
                        })
                    }
                });

            });
        }
        else res.render('../public/signup.ejs', {message: req.flash('signupMessage', 'Please check your mail for activation link')});
    })
    //capture the payment details
    app.post('/api/v1/payment/capture', function (req, res) {
        if (req.user) {
            request({
                method: 'POST',
                url: 'https://' + configAuth.razorPayCredentials.apiKey + ':' + configAuth.razorPayCredentials.apiKeySecret + '@api.razorpay.com/v1/payments/' + req.body.paymentId + '/capture',
                form: {
                    amount: req.body.amount
                }
            }, function (error, response, body) {
                var body = JSON.parse(body);
                if(response.statusCode===200){
                    req.orgId = req.body.orgId;
                    req.subscriptionId = req.body.subscriptionId;
                    req.validity = req.body.subscription.validity;
                    req.orderId = body.order_id;
                    req.amount = body.amount;
                    req.currency = body.currency;
                    req.paidOn = moment.unix(body.created_at).format("YYYY-MM-DD HH:mm:ss");
                    req.status = body.status;
                    req.email = body.email;
                    req.contact = body.contact;
                    req.paymentId = body.id;
                    getSubscriptionDetails.updateSubscription(req, res, function (updateDetails) {
                        res.json({error:200,data:updateDetails});
                    })
                }
                else res.json({error:response.statusCode})

            });
        }
        else res.status(402).json({error: 'Authentication required to perform this action'});
    })
    app.post('/api/v1/updateUserSubscription', function (req, res) {
        getSubscriptionDetails.getSubscriptionType(req, res, function (err, subscription) {
            if (subscription.response) {
                req.subscriptionId = subscription.orgDetails.subscriptionTypeId;
                req.orgId = subscription.orgDetails.id;
                res.json(subscription)
            }
        })

    });
    app.post('/api/v1/updateFreeSubscription', function (req, res) {
        getSubscriptionDetails.getSubscriptionType(req, res, function (err, subscription) {
            if (subscription.response) {
                req.subscriptionId = subscription.response._id;
                req.orgId = subscription.orgDetails.id;
                req.code = configAuth.subscriptionType.starterFree;
                req.validity = subscription.response.validity;
                getSubscriptionDetails.updateSubscription(req, res, function (updateDetails) {
                    res.json(updateDetails)
                })
            }
        })

    });

    app.post('/api/v1/updateLastDashboardId/:id', userDetails.updateLastDashboardId, function (req, res) {
        res.json(req.app.result);
    });

    app.get('/customDataDocumentation', function (req, res) {
        res.render('../public/customDataDocumentation.ejs'); // load the index.ejs file
    });

    app.get('/forgotPassword', function (req, res) {
        res.render('../public/getEmail.ejs', {message: null})
    });

    /**
     Function to get email from user and check whether it is registered or not,
     if registered redirect to success message page else show error message
     */
    app.get('/checkAlreadyUserExist', function (req, res) {
        userActivity.checkUserExist(req, res, function (err, user) {
            if (err) return res.status(500).json({error: 'Internal Server Error'});
            else if (!user.isExist) res.render('../public/getEmail.ejs', {message: 'Please enter a registered mail id!'});
            else {
                req.userEmail = user.mailId;
                userActivity.generateToken(req, res, function (err, tokenResponse) {
                    res.render('../public/getEmail.ejs', {message: 'Verification link is sent to your email . Please verify to reset your password !'});
                    //res.render('../public/emailSuccessPage.ejs',{mailId:tokenResponse.mailId,message:'Verification link is sent to your email . Please verify to reset your password !'})
                })
            }
        });
    });

    app.get('/verifyUserToken', function (req, res) {
        userActivity.verifyToken(req, res, function (err, tokenUser) {
            if (tokenUser.isTokenValid === true) res.render('../public/passwordRegeneration.ejs', {mailId: tokenUser.user.email});
            else {
                req.logout();
                req.flash('loginMessage', 'Your link is expired !')
                res.redirect('/api/v1/login');
            }
        });
    });
    app.get('/updateNewPassword', function (req, res) {
        userActivity.updateNewPassword(req, res, function (err, updatedUser) {
            req.logout();
            req.login(updatedUser.user, function (err) {
                if (err)  return err;
                res.redirect('/profile');
            });
        })
    })
    app.get('/api/v1/emailVerification', userDetails.emailVerification, function (req, res) {
        req.logout();
        if (req.app.result.status == configAuth.emailVerification.verified) {
            req.session.user = req.app.result.user;
            req.login(req.app.result.user, function (err) {
                if (err)  return err;
                res.redirect('/profile');
            });
        }
        else if (req.app.result.status == configAuth.emailVerification.alreadyVerified) {
            req.flash('loginMessage', 'This account is already verified.Please login to use datapoolt.')
            res.redirect('/api/v1/login');
        }
        else if (req.app.result.status == configAuth.emailVerification.mailResend) {
            req.flash('signupMessage', 'Your activation link has expired.Please check your mail for new activation link')
            res.redirect('/api/v1/signup');
        }
        else if (req.app.result.status == configAuth.emailVerification.inValid) {
            req.flash('signupMessage', 'Your activation link is invalid');
            res.redirect('/api/v1/signup');
        }
    });
    app.get('/api/v1/getSubscriptionFromDashboard/:dashboardId',function (req,res) {
        getSubscriptionDetails.getDashboardDetail(req,res,function (err,dashboard) {
            req.body.orgId = dashboard.orgId;
            getSubscriptionDetails.getSubscriptionType(req,res,function (err,subscription) {
                res.json(subscription);
            })
        })
    })
    app.get('/confirmation',function (req,res) {
        res.render('../public/confirmation.ejs')
    })
    app.get('/api/v1/getPaymentDetails/',userDetails.getPaymentDetails,function (req, res){
        res.json({paymentDetails:req.app.result});
    })
};