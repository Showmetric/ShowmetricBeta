var exports = module.exports = {};
var widgetsList = require('../models/widgets');
var metrics = require('../models/metrics');
/**
 Function to get the widgets's details such as channel id,name,desciption ..
 @params 1.req contains the  user details i.e. username,token,email etc
 2.res have the query response

 */
exports.widgets = function (req, res, next) {
    //Set object in req to send the query response to controller
    req.showMetric = {};
    /**
     * Query to find the widgets list
     * @params req.params.dashboardId channel id from request
     * @params err - error response
     * @params metrics - query response
     * callback next which returns response to controller
     */
    widgetsList.find({dashboardId: req.params.dashboardId}, function (err, widgets) {
        console.log('widgets', req.params.dashboardId, 'err', err);
        req.showMetric.widgets = widgets;
        next();
    })
};

exports.deleteWidgets = function (req, res, next) {
    console.log('widget id to be removed', req.params.widgetId);
    widgetsList.remove({_id: req.params.widgetId}, function (err, response) {
        if (err) {
            console.log('Error in deleting widget', err);
        }
        else if (response) {
            console.log('response',response);
        }
    })
};

exports.saveWidgets = function (req, res, next) {
            console.log('response');
            var createWidget = new widgetsList();

            //To store the widget
            //To check whether new dashboard or not
            if (req.body.widgetId == undefined) {
                createWidget.dashboardId = req.body.dashboardId;
                createWidget.widgetType = req.body.widgetType;
                createWidget.charts = req.body.charts;
                createWidget.referenceWidgetId = req.body.referenceWidgetId;
                createWidget.order = req.body.order;
                createWidget.offset = req.body.offset;
                createWidget.size = req.body.size;
                createWidget.minSize = req.body.minSize;
                createWidget.maxSize = req.body.maxSize;
                createWidget.created = new Date();
                createWidget.updated = new Date();
                console.log('created',createWidget.created);

                createWidget.save(function (err, widgetDetail) {
                    if (!err)
                        req.app.result = {'status': '200', 'id': widgetDetail};
                    else
                        req.app.result = {'status': '302'};
                    next();
                });
            }

            //To update already existing database
            else {

                // set all of the user data that we need
                var name = req.body.name == undefined ? '' : req.body.name;
                var widgetId = req.body.widgetId;
                var widgetType = req.body.widgetType == undefined ? '' : req.body.widgetType;
                var metrics = req.body.metrics == undefined ? '' : req.body.metrics;
                var order = req.body.order == undefined ? '' : req.body.order;
                var offset = req.body.offset == undefined ? '' : req.body.offset;
                var size = req.body.metrics == undefined ? '' : req.body.size;
                var minSize = req.body.metrics == undefined ? '' : req.body.minSize;
                var maxSize = req.body.metrics == undefined ? '' : req.body.maxSize;
                var chartType = req.body.chartType == undefined ? '' : req.body.chartType;
                var updated = new Date();


                // update the dashboard data
                widgetsList.update({_id: widgetId}, {
                    $set: {
                        name: name,
                        widgetType: widgetType,
                        order: order,
                        metrics: metrics,
                        offset: offset,
                        size: size,
                        minSize: minSize,
                        maxSize: maxSize,
                        chartType: chartType,
                        updated: updated
                    }
                }, {upsert: true}, function (err) {
                    if (!err) {
                        widgetsList.findOne({_id: widgetId}, function (err, widgetDetails) {
                            if (err)
                                req.app.result = {'error': err};
                            else if (widgetDetails)
                                req.app.result = {'status': '200', 'widgetDetails': widgetDetails};
                            else
                                req.app.result = {'status': '301'};
                            next();
                        })
                    }
                    else {
                        req.app.result = {'status': '302'};
                        next();
                    }
                });
            }
};


