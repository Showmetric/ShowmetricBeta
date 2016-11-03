var async = require("async");
var configAuth = require('../config/auth');
var exports = module.exports = {};
var getDashboards = require('../middlewares/dashboards');
var mongoose = require('mongoose');
var userPermission = require('../helpers/utility');
var widgetsList = require('../models/widgets');
var textWidgetsList = require('../models/textWidgets');
var objectList=require('../models/objects');
/**
 Function to get the widgets's details such as channel id,name,desciption ..
 @params 1.req contains the  user details i.e. username,token,email etc
 2.res have the query response

 */
exports.widgets = function (req, res, next) {

    /**
     * Query to find the widgets list
     * @params req.params.dashboardId channel id from request
     * @params err - error response
     * @params metrics - query response
     * callback next which returns response to controller
     */
    if (req.user && req.query.reportId===undefined) {
        req.dashboardId = req.params.dashboardId;
        userPermission.checkUserAccess(req, res, function (err, response) {
            widgetsList.find({dashboardId: req.params.dashboardId}, function (err, widget) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else if (!widget.length)
                    return res.status(204).json({error: 'No records found'});
                else {
                    req.app.result = widget;
                    next();
                }
            })
        })

    }
    else if (String(req.params.dashboardId) === String(null)) {
        console.log('else if')
        req.reportId = req.query.reportId;
        getDashboards.getDashboardDetailsFromReportId(req,res,function (err,dashboardDetails) {
            console.log('dashboard',req.app.result)
            req.app.result = dashboardDetails
            next();
        });
    }
    else
        res.status(401).json({error: 'Authentication required to perform this action'})

};

exports.widgetDetails = function (req, res, next) {

    /**
     * Query to find the widgets list
     * @params req.params.dashboardId channel id from request
     * @params err - error response
     * @params metrics - query response
     * callback next which returns response to controller
     */
    if (req.user) {
        userPermission.checkUserPermission(req, res, function (err) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else {
                if(req.query.meta){
                    widgetsList.update({'_id': req.params.widgetId}, {
                        $setOnInsert: {updated: new Date(),meta:req.query.meta},
                        $set: {
                            updated: new Date(),
                            meta:req.query.meta
                        }
                    },{upsert: true},  function (err,widget) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'})
                        else if (!widget)
                            return res.status(204).json({error: 'No records found'})
                        else{
                            req.app.result = widget;
                            next();
                        }
                    });
                }
                else {
                    widgetsList.find({_id: req.params.widgetId}, function (err, widget) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'});
                        else if (!widget.length)
                            return res.status(204).json({error: 'No records found'});
                        else {
                            req.app.result = widget;
                            next();
                        }
                    })
                }
            }

        })

    }
    else
        res.status(401).json({error: 'Authentication required to perform this action'})

};

exports.deleteWidgets = function (req, res, next) {
    if (req.user) {
        var bulk = widgetsList.collection.initializeOrderedBulkOp();
        var bulkExecute;
        userPermission.checkUserPermission(req, res, function (err) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else {
                widgetsList.findOne({_id: req.params.widgetId},function(err,widgetDetail){
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!widgetDetail)
                        return res.status(501).json({error: 'Not implemented'});
                    else{
                        var removal=function(){   widgetsList.remove({_id: req.params.widgetId}, function (err, widget) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'});
                            else if (!widget)
                                return res.status(501).json({error: 'Not implemented'});
                            else {
                                if(widgetDetail.widgetType===configAuth.widgetType.customFusion){
                                    bulkExecute = false;
                                    if(widgetDetail.widgets.length)
                                        bulkExecute = true;

                                    //set the update parameters for query
                                    for (var i = 0; i < widgetDetail.widgets.length; i++) {
                                        var id = mongoose.Types.ObjectId(widgetDetail.widgets[i].widgetId);
                                        //set query condition
                                        var query = {
                                            _id:id
                                        };

                                        //set the values
                                        var update = {
                                            $set: {
                                                visibility:true,
                                                updated: new Date()
                                            }
                                        };
                                        //form the query
                                        bulk.find(query).update(update);
                                    }
                                    if (bulkExecute === true) {

                                        //Doing the bulk update
                                        bulk.execute(function (err, response) {
                                            req.app.result = req.params.widgetId;
                                            next();
                                        });
                                    }
                                    else {
                                        req.app.result = req.params.widgetId;
                                        next();
                                    }
                                }
                                else{
                                    req.app.result = req.params.widgetId;
                                    next();
                                }
                            }
                        })}
                        if(widgetDetail.channelName=='Moz') {
                            var objectid=widgetDetail.charts[0].metrics[0].objectId;
                            var objectlength;
                            //finding object length for removal
                            widgetsList.find({'charts.metrics.objectId': objectid},function(err,objects) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'});
                                else {
                                    objectlength = objects.length;
                                    if(objectlength==1){
                                        //deleting objects for moz
                                       objectList.remove({_id:objectid},function(err){
                                           if (err)
                                               return res.status(500).json({error: 'Internal server error'});
                                       })
                                        removal();
                                    }
                                    else
                                        removal();
                                }
                            })


                        }
                        else
                            removal();
                    }
                })
            }

        })

    }

};
exports.deleteTextWidgets = function (req, res, next) {
    if (req.user) {
        textWidgetsList.findOne({_id: req.params.widgetId},function(err,widgetDetail){
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!widgetDetail)
                        return res.status(501).json({error: 'Not implemented'});
                    else{
                         textWidgetsList.remove({_id: req.params.widgetId}, function (err, widget) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'});
                            else if (!widget)
                                return res.status(501).json({error: 'Not implemented'});
                            else {
                                console.log("Text widgets deleted successfully");
                                    req.app.result = req.params.widgetId;
                                    next();

                            }
                        })
                    }
                })
        }
    else
        res.status(401).json({error: 'Authentication required to perform this action'})
};

exports.saveTextWidgets = function (req, res, next) {
    if (req.user) {
        async.auto({storeAllWidgets: processAllTextWidgets},
            function (err, result) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else {
                    console.log("text widgets",result.storeAllWidgets)
                    req.app.result = result.storeAllWidgets;
                    next();
                }
            }
        );

        function processAllTextWidgets(callback) {
            var textData;
            var colCount;
            var reportId;
            var rowCount;
            var widgetSizeX;
            var widgetSizeY;
            var widgetType;
            var textData;
            var widgetName;
            var widgets = req.body;

            async.concatSeries(widgets, saveAllWidgets, callback);

            function saveAllWidgets(result, callback) {
                req.reportId = result.reportId;
                textData = result.textData;
                colCount = result.col;
                reportId = result.reportId;
                rowCount = result.row;
                widgetSizeX = result.sizeX;
                widgetSizeY = result.sizeY;
                widgetType = result.widgetType;
                widgetName=result.name;
                //To store the widget
                        var createWidget = new textWidgetsList();
                        //To check whether new dashboard or not
                        if (result.widgetId === undefined) {
                            createWidget.reportId = reportId;
                            createWidget.widgetType = widgetType;
                            createWidget.textData = textData;
                            createWidget.name = widgetName;
                            createWidget.row = rowCount;
                            createWidget.col = colCount;
                            createWidget.sizeX = widgetSizeX;
                            createWidget.sizeY = widgetSizeY;
                            createWidget.created = new Date();
                            createWidget.updated = new Date();
                            createWidget.save(function (err, widgetDetail) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'});
                                else if (!widgetDetail)
                                    return res.status(501).json({error: 'Not implemented'})
                                else {
                                        req.app.result = widgetDetail;
                                        callback(null, widgetDetail);
                                }
                            });
                        }

                        //To update already existing database
                        else {
                            var widgetId = result.widgetId;

                            // set all of the user data that we need
                            var textData = req.body.textData == undefined ? '' : textData;
                            var row = rowCount == undefined ? '' : rowCount;
                             var col = colCount == undefined ? '' : colCount;
                            var sizeX = widgetSizeX == undefined ? '' : widgetSizeX;
                            var sizeY = widgetSizeY == undefined ? '' : widgetSizeY;
                            var updated = new Date();
                            // update the dashboard data
                            widgetsList.update({_id: widgetId}, {
                                $set: {
                                    textData: textData,
                                    row: row,
                                    col: col,
                                    sizeX: sizeX,
                                    sizeY: sizeY,
                                    updated: updated
                                }
                            }, {upsert: true}, function (err, widget) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'});
                                else if (widget === 0)
                                    return res.status(501).json({error: 'Not Saved in Widget Collection'});
                                else {
                                    widgetsList.findOne({_id: widgetId}, function (err, widgetDetails) {
                                        if (err)
                                            return res.status(500).json({error: 'Internal server error'});
                                        else if (!widgetDetails)
                                            return res.status(204).json({error: 'No records found'});
                                        else {
                                            req.app.result = widgetId;
                                            callback(null, widgetDetails);
                                        }
                                    })
                                }
                            });
                        }


            }
        }
    }
    else
        res.status(401).json({error: 'Authentication required to perform this action'})


};
exports.saveWidgets = function (req, res, next) {
    var bulk = widgetsList.collection.initializeOrderedBulkOp();
    var bulkExecute;
    if (req.user) {
        async.auto({storeAllWidgets: processAllWidgets},
            function (err, result) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else {
                    req.app.result = result.storeAllWidgets;
                    next();
                }
            }
        );

        function processAllWidgets(callback) {
            var charts;
            var colCount;
            var dashboardId;
            var description;
            var referenceWidgetId;
            var rowCount;
            var widgetColor;
            var widgetMaxSize;
            var widgetMinSize;
            var widgetSize;
            var widgetType;
            var widgetName;
            var widgets = req.body;
            var widgetsForCustomFusion;
            var isAlert;
            var isFusion;
            var channelName;

            async.concatSeries(widgets, saveAllWidgets, callback);

            function saveAllWidgets(result, callback) {
                req.dashboardId = result.dashboardId;
                charts = result.charts;
                colCount = result.col;
                dashboardId = result.dashboardId;
                description = result.description;
                referenceWidgetId = result.referenceWidgetId;
                rowCount = result.row;
                widgetColor = result.color;
                widgetMaxSize = result.maxSize;
                widgetMinSize = result.minSize;
                widgetSize = result.size;
                widgetName = result.name;
                widgetType = result.widgetType;
                isAlert = result.isAlert;
                isFusion=result.isFusion != undefined ?result.isFusion:true;
                channelName = result.channelName;
                userPermission.checkUserAccess(req, res, function (err, response) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else {
                        var createWidget = new widgetsList();
                        if (widgetType === configAuth.widgetType.customFusion){
                            widgetsForCustomFusion = result.widgets;
                            createWidget.widgets = widgetsForCustomFusion;
                        }

                        //To store the widget
                        //To check whether new dashboard or not
                        if (result.widgetId === undefined) {
                            createWidget.dashboardId = dashboardId;
                            createWidget.widgetType = widgetType;
                            createWidget.name = widgetName;
                            createWidget.description = description;
                            createWidget.charts = charts;
                            createWidget.referenceWidgetId = referenceWidgetId;
                            createWidget.row = rowCount;
                            createWidget.col = colCount;
                            createWidget.size = widgetSize;
                            createWidget.minSize = widgetMinSize;
                            createWidget.maxSize = widgetMaxSize;
                            createWidget.color = widgetColor;
                            createWidget.created = new Date();
                            createWidget.updated = new Date();
                            createWidget.visibility = true;
                            createWidget.isAlert = isAlert;
                            createWidget.isFusion = isFusion;
                            createWidget.channelName = channelName;
                            createWidget.save(function (err, widgetDetail) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'});
                                else if (!widgetDetail)
                                    return res.status(501).json({error: 'Not implemented'})
                                else {
                                    if(widgetDetail.widgetType===configAuth.widgetType.customFusion){
                                        bulkExecute = false;
                                        if(widgetDetail.widgets.length)
                                            bulkExecute = true;

                                        //set the update parameters for query
                                        for (var i = 0; i < widgetDetail.widgets.length; i++) {
                                            var id = mongoose.Types.ObjectId(widgetDetail.widgets[i].widgetId);
                                            //set query condition
                                            var query = {
                                                _id:id
                                            };

                                            //set the values
                                            var update = {
                                                $set: {
                                                    visibility:false,
                                                    updated: createWidget.created
                                                }
                                            };
                                            //form the query
                                            bulk.find(query).update(update);
                                        }
                                        if (bulkExecute === true) {

                                            //Doing the bulk update
                                            bulk.execute(function (err, response) {
                                                callback(err, widgetDetail);
                                            });
                                        }
                                        else callback(null, widgetDetail);
                                    }
                                    else{
                                        req.app.result = widgetDetail;
                                        callback(null, widgetDetail);
                                    }
                                }
                            });
                        }

                        //To update already existing database
                        else {
                            var widgetId = result.widgetId;

                            // set all of the user data that we need
                            var name = req.body.name == undefined ? '' : widgetName;
                            //var description = req.body.description == undefined ? '' : req.body.description;
                            var widgetId = widgetId;
                            //var widgetType = req.body.widgetType == undefined ? '' : req.body.widgetType;
                            //var metrics = req.body.metrics == undefined ? '' : req.body.metrics;
                            var row = rowCount == undefined ? '' : rowCount;
                            var col = colCount == undefined ? '' : colCount;
                            var size = widgetSize == undefined ? '' : widgetSize;
                            var minSize = widgetMinSize == undefined ? '' : widgetMinSize;
                            var maxSize = widgetMaxSize == undefined ? '' : widgetMaxSize;
                            var updated = new Date();


                            // update the dashboard data
                            widgetsList.update({_id: widgetId}, {
                                $set: {
                                    //name: name,
                                    //description: description,
                                    //widgetType: widgetType,
                                    row: row,
                                    //metrics: metrics,
                                    col: col,
                                    size: size,
                                    minSize: minSize,
                                    maxSize: maxSize,
                                    //charts: charts,
                                    updated: updated
                                }
                            }, {upsert: true}, function (err, widget) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'});
                                else if (widget === 0)
                                    return res.status(501).json({error: 'Not implemented'});
                                else {
                                    widgetsList.findOne({_id: widgetId}, function (err, widgetDetails) {
                                        if (err)
                                            return res.status(500).json({error: 'Internal server error'});
                                        else if (!widgetDetails)
                                            return res.status(204).json({error: 'No records found'});
                                        else {
                                            req.app.result = widgetId;
                                            callback(null, widgetDetails);
                                        }
                                    })
                                }
                            });
                        }
                    }
                })
            }
        }
    }
    else
        res.status(401).json({error: 'Authentication required to perform this action'})


};

exports.saveCustomWidgets = function (req, res, next) {
    var createCustomWidget = new widgetsList();

    createCustomWidget.dashboardId = req.body.dashboardId;
    createCustomWidget.widgetType = req.body.widgetType;
    createCustomWidget.channelId = req.body.channelId;
    createCustomWidget.visibility = true;
    createCustomWidget.isAlert = false;
    createCustomWidget.channelName = req.body.channelName;
    createCustomWidget.created = new Date();
    createCustomWidget.updated = new Date();
    createCustomWidget.save(function (err, customWidgetDetail) {
        if (err)
            return res.status(500).json({error: err});
        else if (!customWidgetDetail)
            return res.status(204).json({error: 'No records found'});
        else {
            req.app.result = {'status': '200', 'id': customWidgetDetail};
            next();
        }

    });

};

exports.updateNameOfWidgets = function (req, res, next) {
    if (req.user) {
        async.auto({storeAllWidgets: processAllWidgets},
            function (err, result) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else {
                    req.app.result = result.storeAllWidgets;
                    next();
                }
            })
        function processAllWidgets(callback) {
            var widgetName;
            var widgets = req.body;
            async.concatSeries(widgets, saveAllWidgets, callback);

            function saveAllWidgets(result, callback) {
                req.dashboardId = result.dashboardId;
                widgetName = result.name;
                userPermission.checkUserAccess(req, res, function (err, response) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else {
                        var widgetId = result.widgetId;
                        // update the dashboard data
                        if (result.name != undefined) {
                            widgetsList.update({_id: widgetId}, {
                                $set: {
                                    name: widgetName,
                                }
                            }, function (err, widget) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'});
                                else if (widget === 0)
                                    return res.status(501).json({error: 'Not implemented'});
                                else {
                                    widgetsList.findOne({_id: widgetId}, function (err, widgetDetails) {
                                        if (err)
                                            return res.status(500).json({error: 'Internal server error'});
                                        else if (!widgetDetails)
                                            return res.status(204).json({error: 'No records found'});
                                        else {
                                            req.app.result = widgetId;
                                            callback(null, widgetDetails);
                                        }
                                    })
                                }
                            });
                        }
                    }
                })
            }
        }
    }
    else
        res.status(401).json({error: 'Authentication required to perform this action'})


};
