var limits = require('../helpers/utility');
var config = require('../config/auth');
var exports = module.exports = {};
var moment = require('moment');
exports.checkUserSubscriptionLimit = function (req, res, done) {

    limits.getSubscriptionType(req, res, function (err, subscriptionResponse) {
        var maxLimits = subscriptionResponse.response.limits;
        if (req.query.requestType == config.limitRequestType.dashboards || req.query.requestType == config.limitRequestType.basic || req.query.requestType == config.limitRequestType.alert || req.query.requestType == config.limitRequestType.fusion) {
            limits.dashboardList(req, res, function (err, response) {
                if (req.query.requestType == config.limitRequestType.basic || req.query.requestType == config.limitRequestType.alert || req.query.requestType == config.limitRequestType.fusion) {
                    req.dashboards = response;
                    limits.widgetsList(req, res, function (err, response) {
                        if (req.query.requestType == config.limitRequestType.alert) {
                            req.widgets = response;
                            limits.alertsList(req, res, function (err, response) {
                                if (String(maxLimits.alerts) === 'unlimited') var availableAlerts = 1000000;
                                else var availableAlerts = maxLimits.alerts - response.length;
                                req.app.result = {
                                    availablealerts: availableAlerts,
                                    isExpired: moment(subscriptionResponse.orgDetails.subscriptionExpiresOn).format('YYYY-MM-DD') < moment(new Date()).format('YYYY-MM-DD')
                                }
                                done(null, req.app.result)
                            })
                        }
                        else {
                            if (req.query.requestType == config.limitRequestType.basic) {
                                if (String(maxLimits.widgets) === 'unlimited') var availableWidgets = 10000;
                                else var availableWidgets = maxLimits.widgets - response.length;
                            }
                            else {
                                if (String(maxLimits.fusions) === 'unlimited') var availableWidgets = 10000;
                                else var availableWidgets = maxLimits.fusions - response.length;

                            }
                            req.app.result = {
                                availableWidgets: availableWidgets,
                                isExpired: moment(subscriptionResponse.orgDetails.subscriptionExpiresOn).format('YYYY-MM-DD') < moment(new Date()).format('YYYY-MM-DD')
                            }
                            done(null, req.app.result)
                        }
                    })
                }
                else {
                    if (String(maxLimits.dashboards) === 'unlimited') var availableDashboards = 1000000;
                    else var availableDashboards = maxLimits.dashboards - response.length;
                    req.app.result = {
                        availableDashboards: availableDashboards,
                        isExpired: moment(subscriptionResponse.orgDetails.subscriptionExpiresOn).format('YYYY-MM-DD') < moment(new Date()).format('YYYY-MM-DD')
                    }
                    done(null, req.app.result)
                }
            })
        }
        else {
            return res.status(400).json({error: 'Invalid  Request'});
        }
    })

}