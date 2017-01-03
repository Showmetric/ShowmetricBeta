var async = require("async");

//To load the model
var ObjectDb = require('../models/objects');
var mongoose = require('mongoose');
var Data = require('../models/data');
var Profile = require('../models/profiles');
var Widget = require('../models/widgets');
var Alert = require('../models/alert')

var exports = module.exports = {};

exports.removeProfile = function (req, res, next) {
    var responseData;
    var bulk = Widget.collection.initializeOrderedBulkOp();
    var bulkExecute;
    async.series(
        [
            function (callback) {
                var objectResults = [];
                ObjectDb.find({profileId: req.params.profileId}, function (err, response) {
                    responseData = response;
                    if (err)
                        callback('error', null);
                    else if (!responseData.length)
                        callback(null, {Object: {data: 'No data'}, result: 1});
                    else {
                        for (var i = 0; i < responseData.length; i++)
                            objectResults.push(responseData[i]._id);
                        dataRemove(objectResults,callback)
                        function dataRemove(objectResults, callback) {
                                    Data.find({objectId: {$in: objectResults}}, function (err, data) {
                                        if (err)
                                            callback('error', null);
                                        else if (data === 0)
                                            callback('error', null);
                                        else {
                                            if(data.length){
                                                Data.remove({objectId: {$in: objectResults}}, function (err, dbdata) {
                                                    if (err)
                                                        callback('error', null);
                                                    else if (dbdata === 0)
                                                        callback('error', null);
                                                    else {

                                                        var finalData = {Data: data, result: data};
                                                        checkNullData(callback(null, finalData))
                                                    }
                                                })
                                            }
                                            else{
                                                var finalData = {Data: data, result: data};
                                                checkNullData(callback(null, finalData))
                                            }
                                        }
                                    });
                        }
                    }
                });
            },
            function (callback) {
                if (responseData.length) {
                    ObjectDb.remove({profileId: req.params.profileId}, function (err, object) {
                        if (err)
                            callback('error', null);
                        else if (object == 0)
                            callback('error', null);
                        else {
                            var finalData = {Object: responseData, result: object};
                            checkNullData(callback(null, finalData));
                        }
                    });
                }
                else
                    callback(null, {Object: {data: 'No data'}, result: 1});

            },
            function (callback) {
                Profile.find({_id: req.params.profileId}, function (err, profile) {
                    if (err)
                        callback('error', null);
                    else if (!profile.length)
                        callback('error', null);
                    else {
                        Profile.remove({_id: req.params.profileId}, function (err, profileRemove) {
                            if (err)
                                callback('error', null);
                            else if (profileRemove === 0)
                                callback('error', null);
                            else {
                                var finalData = {Profile: profile, result: profileRemove};
                                checkNullData(callback(null, finalData))
                            }
                        });
                    }
                });
            },
            function (callback) {
                var objectResults = [];
                for (var i = 0; i < responseData.length; i++)
                    objectResults.push(responseData[i].id);
                if (objectResults.length)
                    alertsRemove( objectResults,callback);
                else
                    callback(null, {Object: {data: 'No data'}, result: 1});
                function alertsRemove(responseData, callback) {
                    Alert.find({objectId: {$in: responseData}}, function (err, alertData) {
                        if (err)
                            callback('error', null);
                        else if (!alertData.length)
                            callback(null, {Alert: {data: 'No data'}, result: 1});
                        else {
                            Alert.remove({
                                objectId :{$in: responseData}
                            }, function (err, alert) {
                                if (err)
                                    callback('error', null);
                                else if (alert == 0)
                                    callback('error', null);
                                else {
                                    var finalData = {Alert: alertData, result: alert};
                                    checkNullData(callback(null, finalData));
                                }
                            });
                        }
                    });
                }
            },
            function (callback) {
                var objectResults = [];
                for (var i = 0; i < responseData.length; i++)
                    objectResults.push(responseData[i].id);
                if (objectResults.length)
                    widgetRemove( objectResults,callback);
                else
                    callback(null, {Object: {data: 'No data'}, result: 1});
                function widgetRemove(responseData, callback) {
                    Widget.find({'charts.metrics.objectId': {$in: responseData}}, function (err, widgetData) {
                        if (err)
                            callback('error', null);
                        else if (!widgetData.length)
                            callback(null, {Widget: {data: 'No data'}, result: 1});
                        else {
                            var widgetList=[];
                            for(var k=0;k<widgetData.length;k++)
                                widgetList.push(widgetData[k]._id)
                            async.map(widgetList, removeCustomFustion, function (err, dataArray) {
                               if(err)
                                callback(null, dataArray);
                                else{
                                   Widget.remove({
                                       'charts.metrics.objectId': {$in: responseData}
                                   }, function (err, object) {
                                       if (err)
                                           callback('error', null);
                                       else if (object == 0)
                                           callback('error', null);
                                       else {
                                           var finalData = {Widget: widgetData, result: object};
                                           checkNullData(callback(null, finalData));
                                       }
                                   });
                               }

                            });
                            function removeCustomFustion(objectResults, callback) {
                                Widget.findOne({'widgets.widgetId':String(objectResults) }, function (err, widgetDetail) {
                                    if (err)
                                        callback('error', null);
                                    else if (!widgetDetail)
                                        callback(null, {CustomWidget: {data: 'No data'}, result: 1});
                                    else {
                                        if(widgetDetail.widgets.length) {
                                            bulkExecute = false;
                                            if (widgetDetail.widgets.length) {
                                                bulkExecute = true;
                                            }

                                            //set the update parameters for query
                                            for (var i = 0; i < widgetDetail.widgets.length; i++) {
                                                var id = mongoose.Types.ObjectId(widgetDetail.widgets[i].widgetId);
                                                //set query condition
                                                var query = {
                                                    _id: id
                                                };

                                                //set the values
                                                var update = {
                                                    $set: {
                                                        visibility: true,
                                                        updated: new Date()
                                                    }
                                                };
                                                //form the query
                                                bulk.find(query).update(update);
                                            }
                                            if (bulkExecute === true) {
                                                //Doing the bulk update
                                                bulk.execute(function (err, response) {
                                                    Widget.remove({_id: widgetDetail._id}, function (err, object) {
                                                        if (err)
                                                            callback('error', null);
                                                        else if (object == 0)
                                                            callback(null, {
                                                                CustomWidget: {data: 'No data'},
                                                                result: 1
                                                            });
                                                        else {
                                                            var finalData = {
                                                                CustomWidget: widgetDetail,
                                                                result: object
                                                            };
                                                            checkNullData(callback(null, finalData));
                                                        }
                                                    });

                                                });
                                            }
                                        }
                                    }

                                })

                            }

                        }
                    });
                }
            }
        ],
        function (errs, results) {
            if (results[0] != null || results[0] != undefined) {
                if (errs) {
                    async.each(results, rollback, function (err, res) {
                        req.app.result = {status: 200};
                        next();
                    });
                }
                else {
                    async.each(results, rollback, function (err, res) {
                        req.app.result = {status: 200};
                        next();
                    });
                }
            }
            else
                return res.status(500).json({error: 'Internal server error'});
        }
    );

    //Function to handle the data query results
    function checkNullData(callback) {
        return function (err, object) {
            if (err)
                callback('Database error: ' + err, null);
            else if (!object)
                callback('', 'No data');
            else
                callback(null, object);
        }
    }

    function rollback(doc, callback) {
        if (doc != null || doc != undefined) {
            var key = Object.keys(doc);
            if (doc.result === 0) {
                async.mapSeries(doc[key[0]], saveAllData, callback);
                function saveAllData(allData, callback) {
                    if (doc.result === 0) {
                        if (key[0] === 'Object') {
                            ObjectDb.update({id: allData._id}, {$set: allData}, {upsert: true}, function (err, savedObject) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'})
                                else if (savedObject == 0)
                                    return res.status(501).json({error: 'Not implemented'})
                                else callback(null, 'success')
                            });
                        }
                        else if (key[0] === 'Data') {
                            if (allData.data != 'No data') {
                                Data.update({_id: allData._id}, {$set: allData}, {upsert: true}, function (err, savedObject) {
                                    if (err)
                                        return res.status(500).json({error: 'Internal server error'})
                                    else if (savedObject == 0)
                                        return res.status(501).json({error: 'Not implemented'})
                                    else callback(null, 'success')
                                });
                            }
                            else callback(null, 'success');
                        }
                        else if (key[0] === 'Profile') {
                            Profile.update({id: allData._id}, {$set: allData}, {upsert: true}, function (err, savedObject) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'})
                                else if (savedObject == 0)
                                    return res.status(501).json({error: 'Not implemented'})
                                else callback(null, 'success')
                            });
                        }
                        else if (key[0] === 'Alert') {
                            Alert.update({id: allData._id}, {$set: allData}, {upsert: true}, function (err, savedObject) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'})
                                else if (savedObject == 0)
                                    return res.status(501).json({error: 'Not implemented'})
                                else callback(null, 'success')
                            });
                        }
                       /* else if (key[0] === 'CustomWidget') {
                            Widget.update({id: allData._id}, {$set: allData}, {upsert: true}, function (err, savedObject) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'});
                                else if (savedObject == 0)
                                    return res.status(501).json({error: 'Not implemented'});
                                else
                                {
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
                                    if(bulkExecute === true){
                                        bulk.execute(function (err, response) {
                                            callback(null, 'success')
                                        });
                                    }
                                }

                            });
                        }*/
                        else {
                            if (allData.data != 'No data') {
                                Widget.update({id: allData._id}, {$set: allData}, {upsert: true}, function (err, savedObject) {
                                    if (err)
                                        return res.status(500).json({error: 'Internal server error'});
                                    else if (savedObject == 0)
                                        return res.status(501).json({error: 'Not implemented'});
                                    else
                                        callback(null, 'success')
                                });
                            }
                            else callback(null, 'success')
                        }
                    }
                    else callback(null, 'success')
                }
            }
            else callback(null, 'success')
        }
        else callback(null, 'success')
    }
};