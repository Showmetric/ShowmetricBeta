var mongoose = require('mongoose');
var reportList = require('../models/reports');
var exports = module.exports = {};
var User = require('../models/user');
var Widget = require('../models/widgets');
var configAuth=require('../config/auth')
var userPermission = require('../helpers/utility');
var Q = require("q");
var _ = require('lodash');
var getDashboards = require('../middlewares/dashboards');
var dashboardList = require('../models/dashboards');
/**
 Function to get the profiles's details such as name,access token,refresh token..
 @params 1.req contains the app user details i.e. username,email,orgId etc
 2.res have the query response

 */
exports.getReportList = function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({error: 'Authentication required to perform this action'})
    }
    else {
        if(req.user.roleId === configAuth.userRoles.admin)
            var query={orgId:req.user.orgId};
        else
            var query={userId:req.user._id};
        reportList.find(query, function (err, UserCollection) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!UserCollection)
                return res.status(204).json({error: 'No records found'});
            else {
                req.app.result = UserCollection;
                next();
            }
        });

        function getReport(UserCollection) {
            var deferred = Q.defer();
            reportList.findOne({_id: UserCollection}, function (err, report) {
                if (err)
                    deferred.reject(new Error(err));
                else
                    deferred.resolve(report);
            });
            return deferred.promise;
        }
    }
};

/**
 * To get the report details based on report id
 * @param req contains the report id
 */
exports.getReportDetails = function (req, res, next) {
    if (req.user && req.query.reportId===undefined && req.query.customReportId===undefined && String(req.params.reportId) !== String(null)) {
        var reportId = req.params.reportId;
        reportList.findOne({'_id': reportId}, function (err, reportDetails) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!reportDetails)
                return res.status(204).json({error: 'No records found'});
            else {
                var dashboards = reportDetails.dashboards;
                dashboardList.find({_id:  {$in: dashboards}}, function (err, dashboardDetails) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!dashboardDetails||dashboardDetails.length<1) {
                        var _id = new mongoose.Schema.ObjectId(reportId).path;
                        var updated = new Date();
                        var updateData = {};
                        updateData.dashboardDeleted = true;
                        updateData.updated = updated;
                        updateData.isDraft = false;
                        // update the report data
                        reportList.update({_id: _id}, {
                            $set: updateData
                        }, {upsert: true}, function (err, response) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'});
                            else if (response == 0)
                                return res.status(501).json({error: 'Dashboard Deleted Not Updated in Reports Collection'});
                            else
                                return res.status(211).json({error: 'Dashboard linked with this report is missing'});
                        });
                    }
                    else {
                        req.app.result = reportDetails;
                        next();
                    }
                })
            }
        })
    }
    else if(req.query.reportId!==undefined && String(req.params.reportId) === String(null)  && req.query.customReportId===undefined ){
        var reportId = req.query.reportId;
        reportList.findOne({'_id': reportId}, function (err, reportDetails) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!reportDetails)
                return res.status(204).json({error: 'No records found'});
            else {
                var dashboards = reportDetails.dashboards;
                dashboardList.find({_id:  {$in: dashboards}}, function (err, dashboardDetails) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!dashboardDetails||dashboardDetails.length<1) {
                        var _id = new mongoose.Schema.ObjectId(reportId).path;
                        var updated = new Date();
                        var updateData = {};
                        updateData.dashboardDeleted = true;
                        updateData.updated = updated;
                        updateData.isDraft = false;
                        // update the report data
                        reportList.update({_id: _id}, {
                            $set: updateData
                        }, {upsert: true}, function (err, response) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'});
                            else if (response == 0)
                                return res.status(501).json({error: 'Not Updated in Reports Collection'});

                            else
                                return res.status(211).json({error: 'Dashboard linked with this report is missing'});
                        });
                    }
                    else {
                        req.app.result = reportDetails;
                        next();
                    }
                })
            }
        })
    }
    else if (req.user && String(req.params.reportId) === String(null) && req.query.reportId===undefined && req.query.customReportId!==undefined) {
        var customReportId = req.query.customReportId;
        reportList.findOne({'customReportId': customReportId}, function (err, reportDetails) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!reportDetails)
                return res.status(204).json({error: 'No records found'});
            else {
                var dashboards = reportDetails.dashboards;
                var reportId = reportDetails._id;
                dashboardList.find({_id:  {$in: dashboards}}, function (err, dashboardDetails) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!dashboardDetails||dashboardDetails.length<1) {
                        var _id = new mongoose.Schema.ObjectId(reportId).path;
                        var updated = new Date();
                        var updateData = {};
                        updateData.dashboardDeleted = true;
                        updateData.updated = updated;
                        updateData.isDraft = false;
                        // update the report data
                        reportList.update({_id: _id}, {
                            $set: updateData
                        }, {upsert: true}, function (err, response) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'});
                            else if (response == 0)
                                return res.status(501).json({error: 'Not Updated in Reports Collection'});
                            else
                                return res.status(211).json({error: 'Dashboard linked with this report is missing'});
                        });
                    }
                    else {
                        req.app.result = reportDetails;
                        next();
                    }
                })
            }
        })
    }
    else
        return res.status(401).json({error: 'Authentication required to perform this action'})
};

/**
 * To store the report details in database
 * @param req - user details
 * @param res
 * @param next - callback
 */
exports.storeReports = function (req, res, next) {
    var getReports;
    var storeAllReports = [];
    var reportObjects = {};
    if (!req.user) {
        return res.status(401).json({error: 'Authentication required to perform this action'})
    }
    else {
        var createReport = new reportList();
        //To check whether new report or not
        if (req.body.reportId == undefined) {
            createReport.created = new Date();
            createReport.updated = new Date();
            createReport.userId = req.user._id;
            createReport.orgId = req.user.orgId;
            createReport.dashboards = req.body.dashboards;
            createReport.name = req.body.name;
            createReport.startDate=req.body.startDate;
            createReport.endDate=req.body.endDate;
            createReport.pdfLink=null;
            createReport.isDraft=true;
            createReport.type='fresh';
            createReport.dashboardDeleted=false;
            createReport.widgets = [];
            req.dashboards = req.body.dashboards;
            userPermission.checkUserReportAccess(req, res, function (err, response) {
                Widget.find({dashboardId:  {$in: req.body.dashboards}}, function (err, widget) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!widget.length)
                        createReport.save(function (err, report) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'});
                            else if (!report)
                                return res.status(204).json({error: 'No records found'});
                            else {
                                req.app.result = report._id;
                                next();
                            }
                        });
                    else {
                        for(var widgetId in widget){
                            createReport.widgets[widgetId] = {
                                widgetId:widget[widgetId]._id,
                                dashboardId:widget[widgetId].dashboardId,
                                name: widget[widgetId].name,
                                sizeY : widget[widgetId].size.h,
                                widgetType:widget[widgetId].widgetType,
                                row:widget[widgetId].row,
                                col:widget[widgetId].col,
                                pageNumber : null
                            }
                        }
                        createReport.save(function (err, report) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'});
                            else if (!report)
                                return res.status(204).json({error: 'No records found'});
                            else {
                                req.app.result = report.customReportId;
                                next();
                            }
                        });
                    }
                })
            })
        }

        //To update already existing database
        else {
            // set all of the user data that we need
            var updated = new Date();
            var updateData = {};
            if(req.body.name!=undefined) {
                var name = req.body.name == undefined ? '' : req.body.name;
                updateData.name = name;
                updateData.updated = updated;
                updateData.isDraft = true;
                updateData.type = 'edited';

            }
            if(req.body.pdfLink!=undefined) {
                updateData.pdfLink = req.body.pdfLink;
                updateData.updated = updated;
                updateData.isDraft = false;
                updateData.type = 'edited';
            }
            else if(req.body.startDate!=undefined&&req.body.endDate!=undefined){
                var startDate= req.body.startDate;
                var endDate=req.body.endDate;
                updateData.startDate = startDate;
                updateData.endDate = endDate;
                updateData.updated = updated;
                updateData.isDraft = true;
                updateData.type = 'edited';
            }
            else if(req.body.widgets!=undefined){
                var widgets= req.body.widgets;
                updateData.widgets = widgets;
                updateData.updated = updated;
                updateData.isDraft = true;
                updateData.type = 'edited';
            }

            var _id = new mongoose.Schema.ObjectId(req.body.reportId).path;

            // update the report data
            reportList.update({_id: _id}, {
                $set: updateData
            }, {upsert: true}, function (err, response) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else if (response == 0)
                    return res.status(501).json({error: 'Not Updated in Reports Collection'});
                else {
                    req.app.result = _id;
                    next();
                }
            });
        }
    }
};
exports.removeReportFromUser = function (req, res, next) {
    var reportId = req.params.reportId;
    if (req.user) {
        reportList.findOne({_id: reportId}, function (err, reportDetails) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!reportDetails)
                return res.status(204).json({error: 'No records found'});
            else{
                if(req.user.roleId === configAuth.userRoles.admin)
                    var condition=(req.user.orgId == reportDetails.orgId);
                else
                    var condition=(req.user._id == reportDetails.userId);
                if(condition){
                    Widget.remove({'reportId': req.params.reportId}, function (err, widget) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'})

                        else
                            removeReport();
                    })
                }
                else return res.status(501).json({error: 'User doesnot have access to delete this report'});
            }
        })

        function removeReport() {
            reportList.remove({'_id': req.params.reportId}, function (err, report) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else if (report != 1)
                    return res.status(501).json({error: 'Report Not Removed From Report Collection'});
                else {
                    req.app.result = req.params.reportId;
                    next();
                }
            })
        }
    }
    else return res.status(401).json({error: 'Authentication required to perform this action'});
};

//To get report details based on reportid
exports.getReportWidgetDetails = function (req, res, next) {
    Widget.find({_id:  {$in: req.body.widgets}}, function (err, widget) {
        if (err)
            return res.status(500).json({error: 'Internal server error'});
        else if (!widget.length)
            return res.status(206).json({error: 'No records found in dashboard Widget'});
        else {
            req.app.result = widget;
            next();
        }
    })
};