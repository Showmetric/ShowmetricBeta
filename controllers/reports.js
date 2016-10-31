var getReports = require('../middlewares/reports');

/**
 * This is the middleware to get the list of reports based on orgId
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..
 * @callback report - result from db call
 */
module.exports = function (app) {
    app.get('/api/v1/get/reportList', getReports.getReportList, function (req, res) {
        res.json({reportList: req.app.result});
    });

    //Create/update a report
    app.post('/api/v1/create/reports', getReports.storeReports, function (req, res) {
        res.json(req.app.result);
    });

    //To get dashboard details based on report id
    app.get('/api/v1/get/report/:reportId', getReports.getReportDetails, function (req, res) {
        res.json(req.app.result);

    });

    //To delete the report
    app.post('/api/v1/delete/userReports/:reportId', getReports.removeReportFromUser, function (req, res) {
        res.json(req.app.result);
    });
    //To get all widget details present in report based on report id
    app.post('/api/v1/get/reportWidgets/', getReports.getReportWidgetDetails, function (req, res) {
        res.json(req.app.result);

    });

};