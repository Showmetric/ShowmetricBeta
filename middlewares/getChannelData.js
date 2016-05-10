//"use strict";
var _ = require('lodash');
var async = require("async");
var channels = require('../models/channels');
var FB = require('fb');
var exports = module.exports = {};
var refWidget = require('../models/referenceWidgets');

//To use google api's
var googleapis = require('googleapis');

//Importing the fbgraph module
var graph = require('fbgraph');

//To load up the user model
var profile = require('../models/profiles');

//To load the metrics model
var Metric = require('../models/metrics');

var moment = require('moment');
moment().format();

//To load the data model
var Data = require('../models/data');

//To load the data model
var Object = require('../models/objects');


//Set OAuth
var OAuth2 = googleapis.auth.OAuth2;

//set Twitter module
var Twitter = require('twitter');

//Load the auth file
var configAuth = require('../config/auth');

//set googleAdwords node module
var googleAds = require('../lib/googleAdwords');
var spec = {host: 'https://adwords.google.com/api/adwords/reportdownload/v201601'};
googleAds.GoogleAdwords(spec);

//set credentials in OAuth2
var oauth2Client = new OAuth2(configAuth.googleAuth.clientID, configAuth.googleAuth.clientSecret, configAuth.googleAuth.callbackURL);

// set auth as a global default
var analytics = googleapis.analytics({version: 'v3', auth: oauth2Client});
var Widget = require('../models/widgets');
var client = new Twitter({
    consumer_key: configAuth.twitterAuth.consumerKey,
    consumer_secret: configAuth.twitterAuth.consumerSecret,
    access_token_key: configAuth.twitterAuth.AccessToken,
    access_token_secret: configAuth.twitterAuth.AccessTokenSecret
});

//To get the channel data
exports.getChannelData = function (req, res, next) {

    //Function to format the date
    function formatDate(d) {
        month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        var startDate = [year, month, day].join('-');
        return startDate;
    }

    function getDaysDifference(startDate, endDate) {
        var storeStartDate = new Date(startDate);
        var storeEndDate = new Date(endDate);
        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays;
    }

    //async's one of the method to run tasks ,one task may or may not depend on the other
    async.auto({
        widget: getWidget,
        data: ['widget', getData],
        metric: ['widget', 'data', getMetric],
        object: ['widget', 'metric', getObject],
        get_profile: ['object', getProfile],
        get_channel: ['get_profile', 'metric', getChannel],
        get_channel_data_remote: ['get_channel', getChannelDataRemote],
        store_final_data: ['get_channel_data_remote', storeFinalData],
        get_channel_objects_db: ['store_final_data', 'get_channel_data_remote', getChannelDataDB]
    }, function (err, results) {
        if (err) {
            return res.status(500).json({});
        }
        req.app.result = results.get_channel_objects_db;
        next();
    });

    //Function to handle all queries result here
    function checkNullObject(callback) {
        return function (err, object) {

            if (err)
                callback('Database error: ' + err, null);
            else if (!object)
                callback('No record found', '');
            else
                callback(null, object);
        }
    }

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

    //Function to get the data in data collection
    function getData(results, callback) {

        async.concatSeries(results.widget.charts, getEachData, callback);
    }

    function getEachData(results, callback) {
        var wholeData = {}
        Data.findOne({
            'objectId': results.metrics[0].objectId,
            'metricId': results.metrics[0].metricId
        }, function (err, data) {
            wholeData = {data: data, metricId: results.metrics[0].metricId}
            checkNullData(callback(null, wholeData))
        });
    }


    //Function to get the data in metric collection
    function getMetric(results, callback) {
        async.concatSeries(results.widget.charts, findEachMetrics, callback);

    }

    //Function to get each metric details
    function findEachMetrics(results, callback) {
        Metric.find({
            _id: results.metrics[0].metricId,
            objectTypes: {$elemMatch: {objectTypeId: results.metrics[0].objectTypeId}}
        }, checkNullObject(callback))
    }


    //Function to get the data in widget collection
    function getWidget(callback) {
        Widget.findOne({'_id': req.params.widgetId}, {charts: 1, widgetType: 1}, checkNullObject(callback));
    }

    //Function to get the data in object collection
    function getObject(results, callback) {
        async.concatSeries(results.widget.charts, getEachObject, callback);
    }

    //Function to get each object details
    function getEachObject(results, callback) {
        Object.find({'_id': results.metrics[0].objectId}, {
            profileId: 1,
            channelObjectId: 1,
            objectTypeId: 1
        }, checkNullObject(callback));
    }

    //Function to get the data in profile collection
    function getProfile(results, callback) {
        async.concatSeries(results.object, getEachProfile, callback)
    }

    //Function to get all profile details
    function getEachProfile(results, callback) {
        profile.findOne({'_id': results.profileId}, {
            accessToken: 1,
            refreshToken: 1,
            channelId: 1,
            userId: 1,
            email: 1,
            name: 1
        }, checkNullObject(callback));
    }

    //Function to get the data in channel collection
    function getChannel(results, callback) {
        async.concatSeries(results.get_profile, getEachChannel, callback);
    }

    //Function to get all channels detail
    function getEachChannel(results, callback) {
        channels.findOne({'_id': results.channelId}, {code: 1}, checkNullObject(callback));
    }

    //Get the unique channel list
    function getUniqueChannel(channel, uniqueChannelArray) {
        uniqueChannelArray = _.uniqBy(channel,'code');
        return uniqueChannelArray;
    }

    //To call the respective function based on channel
    function getChannelDataRemote(initialResults, callback) {
        async.auto({
            get_each_channel_data: getEachChannelData,

        }, function (err, results) {
            // console.log('err = ', err);
            // console.log('get data rem = ', results);
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
        function getEachChannelData(callback) {
            var uniqueChannelArray = [];
            if (initialResults.widget.widgetType == 'fusion') {
                var channel = initialResults.get_channel;
                //  console.log('channel', channel, uniqueChannelArray);
                var uniqueChannel = getUniqueChannel(channel, uniqueChannelArray);
                 console.log('uunique',uniqueChannel)
                async.concatSeries(uniqueChannel, dataForEachChannel, callback);
            }
            else {
                console.log('Inside ELSE statement of geteachchanneldata');
                var newChannelArray = [];
                newChannelArray.push(initialResults.get_channel[0]);
                async.concatSeries(newChannelArray, dataForEachChannel, callback);

            }

        }

        function dataForEachChannel(results, callback) {
            console.log('channel details', results);
            // console.log('Inside DATAFOREACHCHANNEL',results);
            //To check the channel
            switch (results.code) {
                case configAuth.channels.googleAnalytics:
                    setDataBasedChannelCode(results, function (err, result) {
                        console.log('inside googleanalytics')
                        initializeGa(result, callback);
                    });

                    break;
                case configAuth.channels.facebook:
                    setDataBasedChannelCode(results, function (err, result) {
                        //  console.log('fbfusion', result)
                        getFBPageData(result, callback);
                    });

                    break;
                case configAuth.channels.facebookAds:
                    setDataBasedChannelCode(results, function (err, result) {
                        console.log('inside fbads')
                        getFBadsinsightsData(result, callback);
                    });

                    break;
                case configAuth.channels.twitter:
                    getTweetData(initialResults);
                    break;
                case configAuth.channels.googleAdwords:
                    setDataBasedChannelCode(results, function (err, result) {
                        selectAdwordsObjectType(result, callback);
                    });
                    break;
                default:
                    console.log('No channel selected')
            }
        }

        //Group data based on channel
        function setDataBasedChannelCode(results, callback) {
            //  console.log('setDataBasedChannelCode', results);
            var wholeObject = {};
            async.auto({
                group_profile: groupProfile,
                group_channel_objects: ['group_profile', groupChannelObjects],
                group_metrics: ['group_channel_objects', groupMetrics],
                group_data: ['group_metrics', groupData],
                group_charts: ['group_data', groupCharts]

            }, function (err, results) {

                // console.log('err = ', err);
                //console.log('get data channel = ', results);
                if (err) {
                    return callback(err, null);
                }
                console.log('Inside IF statement of geteachchanneldata');
                wholeObject = {
                    widget: results.group_charts,
                    data: results.group_data,
                    metric: results.group_metrics,
                    object: results.group_channel_objects,
                    get_profile: results.group_profile,
                    channels: results
                };
                callback(null, wholeObject);
            });
            //function to group profiles based on channel id
            function groupProfile(callback) {
                var profile = [];
                var profilesList = initialResults.get_profile;
                for (var i = 0; i < profilesList.length; i++) {
                    if (results._id == profilesList[i].channelId)
                        profile.push(profilesList[i]);
                }
                callback(null, profile);

            }

            /*   function getProfilesForChannel(channels, callback) {
             var profile = [];
             console.log('getProfilesForChannel', channels)
             var profilesList = initialResults.get_profile;
             for (var i = 0; i < profilesList.length; i++) {
             console.log('for', channels._id, typeof channels._id, profilesList[i].channelId, typeof profilesList[i].channelId)
             if (channels._id == profilesList[i].channelId)
             profile.push(profilesList[i]);
             }
             callback(null, profile);
             }*/

            //function to group the channel objects based on profile id
            function groupChannelObjects(results, callback) {

                var channelObjects = [];
                var objects = initialResults.object;
                //   console.log('resultss', objects.length,results,results.group_profile[0]._id,typeof results.group_profile[0]._id,objects[1].profileId,typeof objects[0].profileId);
                for (var i = 0; i < objects.length; i++) {
                    //console.log('obj', objects.length, results.group_profile[0]._id, typeof results.group_profile[0]._id, objects[i].profileId, typeof objects[i].profileId)
                    if (String(results.group_profile[0]._id) === String(objects[i].profileId)) {
                        channelObjects.push(objects[i]);

                    }
                }
                callback(null, channelObjects)

            }

            //function to group metrics based on channel id
            function groupMetrics(objects, callback) {
                var channelMetrics = [];
                var metrics = initialResults.metric;

                for (var i = 0; i < metrics.length; i++) {
                    if (results._id == metrics[i].channelId) {
                        channelMetrics.push(metrics[i]);
                    }
                }
                callback(null, channelMetrics);
            }

            //function to group data based on metric
            function groupData(metrics, callback) {

                var channelData = [];
                var metricList = metrics.group_metrics;
                var data = initialResults.data;
                for (var i = 0; i < data.length; i++) {
                    for (var j = 0; j < metricList.length; j++) {

                        if (String(metricList[j]._id) === String(data[i].metricId)) {

                            channelData.push(data[i]);
                        }
                    }

                }

                callback(null, channelData);

            }

            //function to group charts inside widgets based on channel id
            function groupCharts(data, callback) {
                //console.log('data', data);
                var chartsArray = [];
                var widgetArray = [];
                var charts = initialResults.widget.charts;
                for (var i = 0; i < charts.length; i++) {
                 //   console.log('charts', typeof results._id, typeof charts[0].channelId)
                    if (String(results._id) === String(charts[i].channelId)) {
                        chartsArray.push(charts[i]);

                    }
                }
                widgetArray.push({
                    _id: initialResults.widget._id,
                    widgetType: initialResults.widget.widgetType,
                    charts: chartsArray
                })
                //console.log('chartsArray', widgetArray)
                callback(null, widgetArray)
            }
        }

    }


    //Function to get facebook data
    function getFBPageData(initialResults, callback) {
        graph.setAccessToken(initialResults.get_profile[0].accessToken);
        async.auto({
            get_start_end_dates: getDates,
            get_object_list: ['get_start_end_dates', passQueryToGraphApi]

        }, function (err, results) {
            // console.log('err = ', err);
            // console.log('result in switch = ', results);
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_object_list);
        });


        //Function to format the date to yyyy-mm-dd
        function formatDate(d) {
            month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();
            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;
            var startDate = [year, month, day].join('-');
            return startDate;
        }

        //To get the start date ,end date required for query
        function getDates(callback) {
            console.log('getdates')
            work(initialResults.data, initialResults.metric, callback);
            function work(data, metric, done) {
                async.times(Math.min(data.length, metric.length), function (j, next) {
                    var d = new Date();
                    var queryObject = {};

                    //check already there is one year data in db
                    if (data[j].data != null) {
                        data[j].data.updated.setDate(data[j].data.updated.getDate());
                        d.setDate(d.getDate());
                        var updated = formatDate(data[j].data.updated);
                        var now = formatDate(new Date());
                        if (updated < now) {

                            //for(var i=0;i<)
                            var query = initialResults.object[0].channelObjectId + "/insights/" + metric[j].objectTypes[0].meta.fbMetricName + "?since=" + updated + "&until=" + now;
                            queryObject = {query: query, metricId: metric[j]._id};
                            next(null, queryObject);
                        }
                        else {
                            queryObject = {query: 'DataFromDb', metricId: metric[j]._id};
                            next(null, queryObject);
                        }

                    }

                    //To four queries to get one year data
                    else {
                        var d = new Date();
                        async.concatSeries([93, 93, 93, 86], setStartEndDate, function (err, query) {

                            next(null, query);
                        });

                    }


                    //To form query based on start end date for getting one year data
                    function setStartEndDate(n, callback) {
                        d.setDate(d.getDate());
                        var endDate = formatDate(d);
                        d.setDate(d.getDate() - n);
                        var startDate = formatDate(d);
                        var query = initialResults.object[0].channelObjectId + "/insights/" + metric[j].objectTypes[0].meta.fbMetricName + "?since=" + startDate + "&until=" + endDate;
                        queryObject = {query: query, metricId: metric[j]._id};
                        callback('', queryObject);
                    }
                }, done);

            }

            //async.concat(initialResults.data, getDatesForAllMetrics, callback);
        }


        //To pass the query to graph api
        function passQueryToGraphApi(results, callback) {
           // console.log('results.get_start_end_dates', results.get_start_end_dates)
            async.concatSeries(results.get_start_end_dates, getDataForEachQuery, callback);
        }

        //To get facebook data
        function getDataForEachQuery(query, callback) {
           // console.log('geteachdata query', query)
            if (typeof query.query == 'string')
                async.map([query], getDataForAllQuery, callback);
            else
                async.map(query, getDataForAllQuery, callback);

        }

        function getDataForAllQuery(query, callback) {
            var queryResponse = {};
            if (query.query == 'DataFromDb') {
                queryResponse = {
                    res: 'DataFromDb',
                    metricId: query.metricId,
                    queryResults: initialResults,
                    channelId: initialResults.metric[0].channelId
                }
                callback(null, queryResponse);
            }

            else {
                graph.get(query.query, function (err, res) {
                    queryResponse = {
                        res: res,
                        metricId: query.metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }

                    callback('', queryResponse);
                })
            }

        }


    }

    //To store the final result in db
    function storeFinalData(results, callback) {
        var uniqueChannelArray = [];
        var uniqueChannelDetails = [];
        var channelWithCode = [];
        var groupAllChannelData;
        var allChannels = results.get_channel;
        var wholeQueryResult = results.get_channel_data_remote.get_each_channel_data;
        var uniqueChannelFromDb = getUniqueChannel(allChannels, uniqueChannelArray);
        console.log('wholeQueryResultwholeQueryResult',  wholeQueryResult, 'uniqueChannelFromDb',uniqueChannelFromDb)
        console.log('pairs',_.groupBy(wholeQueryResult, 'channelId'));
        groupAllChannelData = _.groupBy(wholeQueryResult, 'channelId');
        if (results.widget.widgetType == 'fusion') {
            uniqueChannelDetails= _.uniqBy(wholeQueryResult,'channelId');

            uniqueChannelDetails.forEach(function(value,index){
                console.log('lodash38',uniqueChannelDetails[index].channelId,'channelId',uniqueChannelFromDb[index]._id,typeof uniqueChannelDetails[index].channelId,'fromdb',uniqueChannelFromDb[index]._id,typeof uniqueChannelFromDb[index]._id,uniqueChannelDetails);
                if(String(uniqueChannelFromDb[index]._id)===String(uniqueChannelDetails[index].channelId) ){
                    channelWithCode.push({channel:uniqueChannelFromDb[index],allData: uniqueChannelDetails[index].queryResults});
                }
            })
            console.log('lodashunique',channelWithCode)

        }
        else{
            channelWithCode.push({channel:uniqueChannelFromDb[0],allData: wholeQueryResult[0].queryResults});
        }

        console.log('storefinaldataunique', channelWithCode, channelWithCode.length);


        async.concatSeries(channelWithCode, storeEachChannelData, callback);
        function storeEachChannelData(allQueryResult, callback) {
console.log('eachdataall',groupAllChannelData[allQueryResult.channel._id])
            console.log('results.ga', groupAllChannelData[allQueryResult.channel.id],allQueryResult, allQueryResult.allData.widget)
            if (allQueryResult.channel.code == configAuth.channels.googleAnalytics) {
                function storeDataForGA(dataFromRemote, dataFromDb, widget, done) {
                    console.log('widget',widget);
                    console.log('dataFromRemote38GA', dataFromDb,dataFromRemote)
                    async.times(dataFromDb.length, function (j, next) {
                        console.log('dataFromRemote', dataFromRemote[j])
                        if (dataFromRemote[j].data === 'DataFromDb')
                            next(null, 'DataFromDb');
                        else {
                            var storeGoogleData = [];
                            var dimensionList = [];
                            var dimension;
                            if (req.body.dimensionList != undefined) {
                                dimensionList = req.body.dimensionList;
                                dimension = results.get_channel_data_remote.get_each_channel_data.get_dimension;
                            }
                            else {
                                dimensionList.push({'name': 'ga:date'});
                                dimension = results.get_channel_data_remote.get_each_channel_data.get_dimension;
                            }

                            //google analytics
                            //calculating the result length
                            var resultLength = dataFromRemote[j].data.rows.length;
                            var resultCount = dataFromRemote[j].data.rows[0].length - 1;
                            console.log('resultLength', resultLength, resultCount, dimensionList)
                            //loop to store the entire result into an array
                            for (var i = 0; i < resultLength; i++) {
                                var obj = {};

                                //loop generate array dynamically based on given dimension list
                                for (var m = 0; m < dimensionList.length; m++) {
                                    if (m == 0) {

                                        //date value is coming in the format of 20160301 so splitting like yyyy-mm--dd format
                                        var year = dataFromRemote[j].data.rows[i][0].substring(0, 4);
                                        var month = dataFromRemote[j].data.rows[i][0].substring(4, 6);
                                        var date = dataFromRemote[j].data.rows[i][0].substring(6, 8);
                                        obj[dimensionList[m].name.substr(3)] = [year, month, date].join('-');
                                        //obj['metricName'] = metricName;
                                        obj['total'] = dataFromRemote[j].data.rows[i][resultCount];
                                    }
                                    else {
                                        obj[dimensionList[m].name.substr(3)] = dataFromRemote[j].data.rows[i][m];
                                        //obj['metricName'] = metricName;
                                        obj['total'] = dataFromRemote[j].data.rows[i][resultCount];
                                    }
                                }
                                storeGoogleData.push(obj);

                            }
                            console.log('storeGoogleData', storeGoogleData.length)
                            // callback(null, storeGoogleData);

                            var now = new Date();
                            console.log(dataFromRemote[j].metricId, dataFromDb[j], 'dadadb', 'dadafrom');
                            var wholeResponse = [];
                            if (dataFromDb[j].data != null) {
                                var metricId;
                                metricId = dataFromDb[j].metricId;

                                var finalData = [];
                                for (var r = 0; r < dataFromDb[j].data.data.length; r++) {
                                    if (dataFromRemote[j].metricId === dataFromDb[j].metricId) {
                                        //console.log('ifremote', dataFromRemote[j].metricId, dataFromDb[metricIndex].metricId)
                                        //merge old data with new one
                                        storeGoogleData.push(dataFromDb[j].data.data[r]);
                                    }
                                    //merge old data with new one
                                    //wholeResponse.push(dataFromDb[j].data.data[r]);
                                }

                                console.log('wholeResponselen', wholeResponse.length)
                            }

                            /*else {
                             console.log('elsedataa',storeGoogleData)
                             storeGoogleData.forEach (function(value,index){
                             wholeResponse.push(storeGoogleData[index]);
                             metricId = dataFromDb[j].metricId;
                             })


                             }*/

                            var now = new Date();

                            //Updating the old data with new one
                            Data.update({
                                'objectId': widget[j].metrics[0].objectId,
                                'metricId': dataFromRemote[j].metricId
                            }, {
                                $setOnInsert: {created: now},
                                $set: {data: storeGoogleData, updated: now}
                            }, {upsert: true}, function (err) {
                                if (err) console.log("User not saved");
                                else {
                                    console.log('updatequery',widget[j].metrics[0].objectId,  'storeGoogleData', typeof storeGoogleData,storeGoogleData.length)
                                    next(null, 'success')
                                }
                            })
                        }


                    }, done);
                }
                storeDataForGA(groupAllChannelData[allQueryResult.channel._id][0].results.call_get_analytic_data, allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, callback);


            }

            else if (allQueryResult.channel.code == configAuth.channels.facebook) {
                console.log('res1', results.data.length, results.widget.charts.length, 'widgetdata', results.get_channel_data_remote.get_each_channel_data.length, 'data1', results.get_channel_data_remote.get_each_channel_data[0])
                storeDataForFB(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForFB(dataFromRemote, dataFromDb, widget, metric, done) {
                    console.log('worksfb', widget,metric)
                    async.times(Math.min(widget.length, dataFromDb.length), function (j, next) {
                        console.log('dataFromRemote[j]', j, dataFromRemote.length, dataFromRemote)

                        //Array to hold the final result
                        var finalData = [];
                        for (var key in dataFromRemote) {
                            if (String(dataFromRemote[key].channelId) === String(metric[0].channelId)) {
                                  console.log('fbdatafromremote', dataFromRemote[key].channelId)
                                if (dataFromRemote[key].res === 'DataFromDb'){
                                    console.log('fbdatafromdb')
                                }
                                else {
                                    console.log('elllse', dataFromRemote[key].res)
                                    for (var index in dataFromRemote[key].res.data[0].values) {
                                        var value = {};
                                        value = {
                                            total: dataFromRemote[key].res.data[0].values[index].value,
                                            date: dataFromRemote[key].res.data[0].values[index].end_time.substr(0, 10)
                                        };

//                                console.log('metricc',metric[j].objectTypes[0].meta.fbMetricName, dataFromRemote.res[key].data[0].name,dataFromRemote[key]);
                                        //if (metric[j].objectTypes[0].meta.fbMetricName == dataFromRemote[key].data[0].name)
                                        if (metric[j]._id == dataFromRemote[key].metricId) {
                                            console.log('remote metric check', metric[j]._id, dataFromRemote[key].metricId)
                                            finalData.push(value);
                                        }

                                    }

                                }
                            }

                        }

                        console.log(finalData.length, 'fbdatadb')
                        if (dataFromRemote[j].res != 'DataFromDb') {
                            if (dataFromDb[j].data != null) {
                                if (metric[j]._id == dataFromRemote[j].metricId) {

                                    //merge the old data with new one and update it in db
                                    for (var key = 0; key < dataFromDb[j].data.data.length; key++) {
                                        finalData.push(dataFromDb[j].data.data[key]);
                                    }
                                    var metricId = metric._id;
                                }


                            }
                            //  console.log('finalDatafinalData', metricId)
                            var now = new Date();
                            console.log('widget', widget[j].metrics[0].objectId)

                            //Updating the old data with new one
                            Data.update({
                                'objectId': widget[j].metrics[0].objectId,
                                'metricId': metric[j]._id
                            }, {
                                $setOnInsert: {created: now},
                                $set: {data: finalData, updated: now}
                            }, {upsert: true}, function (err) {
                                if (err) console.log("User not saved");
                                else
                                    next(null, 'success')
                            });
                        }
                        else
                            next(null, 'success')
                    }, done);


                }

            }
            else if (allQueryResult.channel.code == configAuth.channels.facebookAds) {
                console.log('fbads results', results);

                storeDataForFBAds(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data,allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForFBAds(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.timesSeries(dataFromDb.length, function (j, next) {
                        var finalData = [];
                        console.log('dataFromRemotefbads', dataFromRemote, dataFromRemote.length)

                        for (var index = 0; index < dataFromRemote.length; index++) {
                            if (dataFromRemote[index].data === 'DataFromDb'){}
                            else {
                                console.log('else datad', metric[j]._id, dataFromRemote[index].metricId)
                                for (var data in dataFromRemote[index].data) {
                                    if (metric[j]._id == dataFromRemote[index].metricId)
                                        finalData.push(dataFromRemote[index].data[data]);
                                }
                            }
                        }
                        console.log('finalData', finalData.length)

                        if (dataFromRemote[index] != 'DataFromDb') {
                            if (dataFromDb[j].data != null) {
                                for (var r = 0; r < dataFromDb[j].data.data.length; r++) {

                                    //merge old data with new one
                                    finalData.push(dataFromDb[j].data.data[r]);
                                }
                            }

                            console.log('fbads data', finalData)
                            var now = new Date();


                            //Updating the old data with new one
                            Data.update({
                                'objectId': widget[j].metrics[0].objectId,
                                'metricId': metric[j]._id
                            }, {
                                $setOnInsert: {created: now}, $set: {data: finalData, updated: now}
                            }, {upsert: true}, function (err) {
                                if (err) console.log("User not saved");
                                else
                                    next(null, 'success');

                            });

                        }
                        else
                            next(null, 'success')
                    }, done);
                }
            }
            else if (allQueryResult.channel.code == configAuth.channels.googleAdwords) {

               storeDataForAdwords(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data,allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForAdwords(dataFromRemote, dataFromDb, widget, metric, done) {
                    console.log('works', widget, 'dataFromDb', dataFromDb, metric.length);
                    async.times(metric.length, function (j, next) {
                        var finalData = [];
                        console.log('dataFromRemote[jk]', metric,dataFromRemote.length, dataFromRemote);

                        //Array to hold the final result
                        for (var key in dataFromRemote) {
                                if (dataFromRemote[key].apiResponse === 'DataFromDb') {
                                   // console.log('place ofDB', dataFromRemote[key].get_google_adsword_data_from_remote[i]);
                                    //finalData.push();
                                }
                                else {
                                    console.log('dataFromRemote[key]',  dataFromRemote[key])
                                    //console.log('remote metric check', metric[j]._id, dataFromRemote[key].metricId)
                                    if (String(metric[j]._id) == String(dataFromRemote[key].metricId)) {
                                        console.log('remote metric check', typeof metric[j]._id,metric[j]._id,typeof dataFromRemote[key].metricId,dataFromRemote[key].metricId,dataFromRemote[key].apiResponse)
                                        finalData = dataFromRemote[key].apiResponse;
                                    }
                                }
                        }
                        console.log('dbDataLength', finalData.length,'j',j, 'metricId', metricId);
                        if (dataFromRemote[j].apiResponse != 'DataFromDb') {
                            console.log('hello', dataFromDb[j].data);
                            if (dataFromDb[j].data != null) {
                                if (dataFromRemote[j].metricId == dataFromDb[j].metricId) {
                                    console.log('nullOfDataFromDB', dataFromDb[j].data.data);
                                    //merge the old data with new one and update it in db
                                    for (var key = 0; key < dataFromDb[j].data.data.length; key++) {
                                        finalData.push(dataFromDb[j].data.data[key]);
                                    }
                                    var metricId = metric._id;
                                }

                            }
                            console.log('widget[j].metrics[0].objectId',finalData.length)
                            var now = new Date();

                            //Updating the old data with new one
                            Data.update({
                                'objectId': widget[j].metrics[0].objectId,
                                'metricId': metric[j]._id
                            }, {
                                $setOnInsert: {created: now},
                                $set: {data: finalData, updated: now}
                            }, {upsert: true}, function (err) {
                                if (err) console.log("User not saved");
                                else
                                    next(null, 'success')
                            });
                        }

                        else
                            next(null, 'success')

                    }, done);


                }

            }
        }
    }

    //Get the data from db
    function getChannelDataDB(results, callback) {
        // work(results.widget.charts, callback);
        console.log('results.widget.charts', results.widget.charts.length)
        async.concatSeries(results.widget.charts, getEachDataFromDb, callback);
        /*function work(widget, done) {
         async.times(widget.length, function (j, next) {
         console.log('work', widget[j].metrics[0].objectId,'metricid',widget[j].metrics[0].metricId)


         }, done);
         }*/
    }

    //Get data from db
    function getEachDataFromDb(widget, callback) {
        console.log('getdata')
        Data.aggregate([
                // Unwind the array to denormalize
                {"$unwind": "$data"},
                // Match specific array elements
                {
                    "$match": {
                        $and: [{"data.date": {$gte: req.body.startDate}}, {"data.date": {$lte: req.body.endDate}},
                            {"objectId": widget.metrics[0].objectId},
                            {"metricId": widget.metrics[0].metricId}]
                    }
                },
                // Group back to array form
                {
                    "$group": {
                        "_id": "$_id",
                        "data": {"$push": "$data"},
                        "metricId": {"$first": "$metricId"},
                        "objectId": {"$first": "$objectId"},
                        "updated": {"$first": "$updated"},
                        "created": {"$first": "$created"}

                    }
                }]
            , function (err, response) {
                console.log('err', err, 'resposne', response);
                callback(null, response)
            })
    }

    //set oauth credentials and get object type details
    function initializeGa(results, callback) {
        console.log('ga', results);
        oauth2Client.setCredentials({
            access_token: results.get_profile[0].accessToken,
            refresh_token: results.get_profile[0].refreshToken
        });

        googleDataEntireFunction(results, callback);
    }

    //to get google analtic data
    function googleDataEntireFunction(results, callback) {

        var allDataObject = {};
        async.auto({
            get_dimension: getDimension,
            check_data_exist: ['get_dimension', checkDataExist],
            call_get_analytic_data: ['check_data_exist', analyticData]
        }, function (err, results) {
            // console.log('err = ', err);
            console.log('result in ssswitch = ', results.call_get_analytic_data);
            if (err) {
                return callback(err, null);
            }
            allDataObject = {
                results: results,
                queryResults: results.call_get_analytic_data[0].queryResults,
                channelId: results.call_get_analytic_data[0].channelId
            }
            callback(null, allDataObject);
        });

        function getDimension(callback) {
            var dimension;
            var dimensionArray = [];
            var dimensionList = [];

            //Array to hold the final google data
            var storeGoogleData = [];
            if (req.body.dimensionList != undefined) {
                dimensionList = req.body.dimensionList;

                //This is for testing now hard coded
                // dimensionList.push({'name': 'ga:date'}, {'name': 'ga:year'}, {'name': 'ga:month'}, {'name': 'ga:day'}, {'name': 'ga:year'}, {'name': 'ga:week'});
                var getDimension = dimensionList[0].name;
                var dimensionListLength = dimensionList.length;

                //Dynamically form the dimension object like {ga:}
                for (var k = 1; k < dimensionListLength; k++) {
                    getDimension = getDimension + ',' + dimensionList[k].name;
                    dimensionArray.push({'dimension': getDimension});
                }
                dimension = dimensionArray[dimensionArray.length - 1].dimension;
                callback(null, dimension);
            }

            //if user didn't specify any dimension
            else {
                dimensionList.push({'name': 'ga:date'});
                dimension = 'ga:date';
            }
            callback(null, dimension);
        }

        function checkDataExist(dimension, callback) {
            var data = results.data;
            var metric = results.metric;
            var object = results.object;
            var widget = results.widget.charts;
            oauth2Client.refreshAccessToken(function (err, tokens) {
                console.log('tokens', tokens)
                profile.token = tokens.access_token;
                oauth2Client.setCredentials({
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token
                });
                console.log('oauth2Client', results);
                work(data, metric, object, widget, callback);
                function work(data, metric, object, widget, done) {
                    var allObjects = {};
                    async.times(metric.length, function (i, next) {

                        // var metricName = results.metric[0].objectTypes[0].meta.gaMetricName;
                        console.log('data[i] != ', data[i])
                        var d = new Date();

                        if (data[i].data != null) {
                            console.log('metricdataa', metric[i], i, widget, metric)
                            console.log('ifdd', data[i])
                            var startDate = formatDate(data[i].data.updated);
                            var endDate = formatDate(d);
                            console.log('startdates', startDate, 'end.', endDate);
                            if (startDate < endDate) {
                                console.log('if data', data[i].metricId, startDate, endDate)
                                //async.concat(results.metric, setEachMetric, callback);
                                // function setEachMetric(metric, callback) {
                                allObjects = {
                                    oauth2Client: oauth2Client,
                                    object: object[i],
                                    dimension: dimension,
                                    metricName: metric[i].objectTypes[0].meta.gaMetricName,
                                    startDate: startDate,
                                    endDate: endDate,
                                    response: results.response,
                                    data: results.data,
                                    results: results,
                                    metricId: data[i].metricId
                                };
                                //var dataResultDetails = analyticData(oauth2Client, results.object, dimension.get_dimension, metric.objectTypes[0].meta.gaMetricName, startDate, endDate, results.response, results.data, results);
                                next(null, allObjects);
                            }
                            else {
                                allObjects = {metricId: data[i].metricId, data: 'DataFromDb'}
                                next(null, allObjects);
                            }

                        }
                        else {
                            console.log('elsedd', metric[i]._id)
                            //call google api
                            d.setDate(d.getDate() - 365);
                            var startDate = formatDate(d);
                            var endDate = formatDate(new Date());
                            // async.concat(results.metric, setEachMetric, callback);
                            // function setEachMetric(metric, callback) {

                            allObjects = {
                                oauth2Client: oauth2Client,
                                object: object[i],
                                dimension: dimension,
                                metricName: metric[i].objectTypes[0].meta.gaMetricName,
                                startDate: startDate,
                                endDate: endDate,
                                response: results.response,
                                data: data[i],
                                results: results,
                                metricId: data[i].metricId
                            };
                            next(null, allObjects);

                        }
                    }, done);
                }
            });
            console.log('oauth2Client1', oauth2Client)


        }

        //to get the final google analytic data
        function analyticData(allObjects, callback) {
            console.log('pass query', allObjects);
            console.log('allobjects array', allObjects)
            async.concatSeries(allObjects.check_data_exist, getAllMetricData, callback);

        }

        function getAllMetricData(allObjects, callback) {
            var finalData = {};
            console.log('queryresults', results);
            if (allObjects.data === 'DataFromDb') {
                finalData = {
                    metricId: allObjects.metricId,
                    data: 'DataFromDb',
                    queryResults: results,
                    channelId: results.metric[0].channelId
                };
                callback(null, finalData);
            }

            else {
                var dimensionList;
                var dimension;
                if (req.body.dimensionList != undefined) {
                    dimensionList = req.body.dimensionList;
                    dimension = allObjects.dimension;
                }
                else {
                    dimensionList = allObjects.dimension;
                    dimension = 'ga:date';
                }

                /**Method to call the google api
                 * @param oauth2Client - set credentials
                 */
                analytics.data.ga.get({
                        'auth': allObjects.oauth2Client,
                        'ids': 'ga:' + allObjects.object.channelObjectId,
                        'start-date': allObjects.startDate,
                        'end-date': allObjects.endDate,
                        'dimensions': dimension,
                        'metrics': allObjects.metricName,
                        prettyPrint: true
                    }, function (err, result) {
                        if (err) {
                            console.log('if error', err);
                            googleDataEntireFunction(allObjects.results, callback);

                        }
                        else {

                            finalData = {
                                metricId: allObjects.metricId,
                                data: result,
                                queryResults: results,
                                channelId: results.metric[0].channelId
                            };
                            console.log('else api', finalData);
                            callback(null, finalData);
                        }
                    }
                );
            }
        }

    }

    //Function to format the date
    function calculateDate(d) {
        month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        var startDate = [year, month, day].join('-');
        return startDate;
    }

    //To get FacebookAds Insights Data
    function getFBadsinsightsData(initialResults, callback) {
        async.auto({
            call_fb_ads_data: callFetchFBadsData,
            get_fb_ads_data_from_remote: ['call_fb_ads_data', fetchFBadsData],
        }, function (err, results) {
            console.log('err = ', err);
            console.log('get data rem = ', results.get_fb_ads_data_from_remote);
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_fb_ads_data_from_remote);
        });
        function callFetchFBadsData(callback) {
            work(initialResults.data, initialResults.object, initialResults.metric, callback);
            function work(data, object, metric, done) {

                async.timesSeries(object.length, function (j, next) {
                    console.log('work', j, metric[j])
                    var adAccountId = initialResults.object[j].channelObjectId;
                    d = new Date();
                    var allObjects = {};

                    //to form query based on start end date
                    function setStartEndDate(n, callback) {
                        d.setDate(d.getDate() + 1);
                        var endDate = calculateDate(d);
                        d.setDate(d.getDate() - n);
                        var startDate = calculateDate(d);

                        var query = "v2.5/" + adAccountId + "/insights?limit=365&time_increment=1&fields=" + initialResults.metric[0].objectTypes[0].meta.fbAdsMetricName + '&time_range[since]=' + startDate + '&time_range[until]=' + endDate;
                        //var query = pageId + "/insights/" + response.meta.fbAdsMetricName + "?since=" + startDate + "&until=" + endDate;
                        allObjects = {
                            profile: initialResults.get_profile[j],
                            query: query,
                            widget: metric[j],
                            dataResult: data[j],
                            startDate: startDate,
                            endDate: endDate,
                            metricId: metric[j]._id
                        }
                        callback(null, allObjects);
                        //fetchFBadsData(initialResults.get_profile[0], query, initialResults, initialResults.data, startDate, endDate);
                    }

                    if (data[j].data != null) {
                        console.log('data no empty data')
                        var updated = calculateDate(data[j].data.updated);
                        var currentDate = calculateDate(new Date());
                        d.setDate(d.getDate() + 1);
                        var startDate = calculateDate(d);
                        var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                        if (updated < currentDate) {
                            var query = "v2.5/" + adAccountId + "/insights?limit=365&time_increment=1&fields=" + initialResults.metric[0].objectTypes[0].meta.fbAdsMetricName + '&time_range[since]=' + updated + '&time_range[until]=' + startDate;
                            //var query = pageId + "/insights/" + response.meta.fbMetricName + "?since=" + updated + "&until=" + endDate;
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: data[j].data,
                                startDate: updated,
                                endDate: currentDate,
                                metricId: metric[j]._id
                            }
                            next(null, [allObjects]);
                            //fetchFBadsData(initialResults.get_profile[0], query, initialResults, initialResults.data, updated, currentDate);
                        }
                        else
                            next(null, 'DataFromDb');
                    }
                    else {
                        //setStartEndDate(365);
                        var d = new Date();
                        async.map([93, 93, 93, 86], setStartEndDate, function (err, query) {
console.log('queryfbads',query)
                            next(null, query);
                        });
                    }

                }, done)
            }
        }

// This Function executed to get insights data like(impression,clicks)
        function fetchFBadsData(allObjects, callback) {
            if (allObjects.call_fb_ads_data === 'DataFromDb')
                callback(null, 'DataFromDb');
            else {
                console.log('async starts ', allObjects.call_fb_ads_data)
                async.concatSeries(allObjects.call_fb_ads_data, getFbAdsForAllMetrics, callback);

            }
        }

        function getFbAdsForAllMetrics(results, callback) {
            console.log('all metrics', results);
            if (results === 'DataFromDb')
                callback(null, 'DataFromDb');
            else {
                async.concatSeries(results, getFbAdsForEachMetric, callback);
            }
        }

        function getFbAdsForEachMetric(results, callback) {
            var queryResponse = {};
            console.log('each metric', results, 'ree');
            var storeDefaultValues = [];
            FB.setAccessToken(results.profile.accessToken);
            var tot_metric = [];
            var finalData = {};
            var query = results.query;
            console.log('queryy', query)
            Adsinsights(query);
            function Adsinsights(query) {
                var metricId = results.metricId;
                console.log('count')
                FB.api(query, function (res) {
                    console.log('ress', res);
                    if (res.error) {
                        console.log('error')
                    }
                    else {
                        var wholeData = [];

                        var storeMetricName = results.widget.objectTypes[0].meta.fbAdsMetricName;
                        var storeStartDate = new Date(results.startDate);
                        var storeEndDate = new Date(results.endDate);
                        console.log('startdate', storeStartDate)
                        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                        //controlled pagination Data
                        if (res.data.length != 0) {
                            if (res.paging && res.paging.next) {
                                for (var key in res.data)
                                    tot_metric.push({
                                        total: res.data[key][storeMetricName],
                                        date: res.data[key].date_start
                                    });
                                var nextPage = res.paging.next;
                                var str = nextPage;
                                var recallApi = str.replace("https://graph.facebook.com/", " ").trim();
                                Adsinsights(recallApi);
                            }
                            else {

                                for (var key in res.data)
                                    tot_metric.push({
                                        total: res.data[key][storeMetricName],
                                        date: res.data[key].date_start
                                    });

                                var obj_metric = tot_metric.length;
                                for (var j = 0; j < obj_metric; j++) {
                                    //console.log('data', wholeData)
                                    wholeData.push({date: tot_metric[j].date, total: tot_metric[j].total});
                                }
                                if (results.dataResult != 'No data')   console.log('after if');

                                for (var i = 0; i < diffDays; i++) {
                                    var finalDate = calculateDate(storeStartDate);
                                    //console.log('finaldate',finalDate,storeStartDate)
                                    storeDefaultValues.push({date: finalDate, total: 0});
                                    storeStartDate.setDate(storeStartDate.getDate() + 1);
                                }
                                // console.log('storeDefaultValues',storeDefaultValues)


                                //To replace the missing dates in whole data with empty values
                                var validData = wholeData.length;
                                for (var j = 0; j < validData; j++) {
                                    for (var k = 0; k < storeDefaultValues.length; k++) {
                                        //console.log('wholeData[j].date',wholeData[j].date,'storeDefaultValues[k].date',storeDefaultValues[k].date)
                                        if (wholeData[j].date === storeDefaultValues[k].date)
                                            storeDefaultValues[k].total = wholeData[j].total;
                                    }

                                }
                            }
                        }
                        else {
                            for (var i = 0; i < diffDays; i++) {
                                var finalDate = calculateDate(storeStartDate);
                                //console.log('finaldate',finalDate,storeStartDate)
                                storeDefaultValues.push({date: finalDate, total: 0});
                                storeStartDate.setDate(storeStartDate.getDate() + 1);
                            }
                        }

                    }
                    finalData = {
                        metricId: metricId,
                        data: storeDefaultValues
                    };
                    queryResponse = {
                        data: storeDefaultValues,
                        metricId: metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    console.log('finalDatametricname', queryResponse)
                    callback(null, queryResponse);

                })
            }
        }


    }

    function selectAdwordsObjectType(initialResults, callback) {
        async.auto({
            call_adword_data: fetchAdwordsQuery,
            get_google_adsword_data_from_remote: ['call_adword_data', fetchGoogleAdwordsData]
        }, function (err, results) {
            console.log('err = ', err);
            console.log('get data rem = ', results);
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_google_adsword_data_from_remote);
        });
        function fetchAdwordsQuery(callback) {
            work(initialResults.data, initialResults.object, initialResults.metric, callback);
            function work(data, object, metric, done) {
                async.timesSeries(metric.length, function (j, next) {
                    console.log('work', j, metric[j])
                    var adAccountId = initialResults.object[j].channelObjectId;
                    d = new Date();
                    var allObjects = {};
                    if (data[j].data != null) {
                        console.log('data no empty data')
                        var updated = calculateDate(data[j].data.updated);
                        var newStartDate = updated.replace(/-/g, "");
                        updated = newStartDate;

                        var currentDate = calculateDate(new Date());
                        console.log('adstart',updated,currentDate)
                        d.setDate(d.getDate() + 1);
                        var startDate = calculateDate(d);
                        var newEndDate = startDate.replace(/-/g, "");
                        startDate = newEndDate;
                        var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                        if (calculateDate(data[j].data.updated) < currentDate) {
                            var query = 'Date,' + initialResults.metric[0].objectTypes[0].meta.gAdsMetricName;
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: data[j].data,
                                startDate: updated,
                                objects: object[j].channelObjectId,
                                endDate: startDate,
                                metricId: metric[j]._id,
                                metricCode: metric[j].code
                            }
                            console.log('GoogleAuthAllObjectIfData', allObjects);
                            next(null, allObjects);
                        }
                        else
                            next(null, 'DataFromDb');
                    }
                    else {
                        console.log('elsedd', metric[j]._id)
                        //call google api
                        d.setDate(d.getDate() - 365);
                        var startDate = formatDate(d);
                        var newStr = startDate.replace(/-/g, "");
                        startDate = newStr;
                        var endDate = formatDate(new Date());
                        var newEndDate = endDate.replace(/-/g, "");
                        var endDate = newEndDate;
                        var query = 'Date,' + initialResults.metric[0].objectTypes[0].meta.gAdsMetricName;
                        // async.concat(results.metric, setEachMetric, callback);
                        allObjects = {
                            profile: initialResults.get_profile[j],
                            query: query,
                            widget: metric[j],
                            dataResult: data[j].data,
                            objects: object[j].channelObjectId,
                            startDate: startDate,
                            endDate: endDate,
                            metricId: metric[j]._id,
                            metricCode: metric[j].code
                        };
                        console.log('GoogleAuthAllObjectElse', allObjects);
                        next(null, allObjects);

                    }

                }, done)
            }
        }

        // This Function executed to get insights data like(impression,clicks)
        function fetchGoogleAdwordsData(allObjects, callback) {
            console.log('fetchGoogleAdworsData', allObjects);
            var count = 0;
            var actualFinalApiData={};
            async.concatSeries(allObjects.call_adword_data, checkDbData, callback);
            function checkDbData(result, callback) {
                count++;
                console.log('countres', count,result);
                if (result == 'DataFromDb'){
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                       // metricId: results.metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null,actualFinalApiData);
                }

                else {
                    console.log('async starts ', result);
                    getAdwordsDataForEachMetric(result, callback);

                }
            }
        }

        function getAdwordsDataForEachMetric(results, callback) {
            var during = results.startDate + ',' + results.endDate;
            console.log('during', results);
            googleAds.use({
                clientID: configAuth.googleAdwordsAuth.clientID,
                clientSecret: configAuth.googleAdwordsAuth.clientSecret,
                developerToken: configAuth.googleAdwordsAuth.developerToken
            });
            googleAds.use({
                accessToken: results.profile.accessToken,
                //tokenExpires: 1424716834341, // Integer: Unix Timestamp of expiration time
                refreshToken: results.profile.refreshToken,
                clientCustomerID: results.objects
            });
            googleAds.awql()
                .select(results.query)
                .from('ACCOUNT_PERFORMANCE_REPORT')
                .during(during)
                .send().then(function (response) {
                    storeAdwordsFinalData(results, response.data);
                })
                .catch(function (error) {
                    console.log('Error', error);
                    callback(error, null);

                });
            //To store the final result in db
            function storeAdwordsFinalData(results, data) {
                var actualFinalApiData = {};
                if (data.error) {
                    console.log('error')
                }
                console.log('storeAdwordsFinalData', results.metricCode);
                //Array to hold the final result
                var param = [];
                if (results.metricCode === configAuth.googleAdwordsMetric.clicks) {
                    param.push('clicks');
                }
                else if (results.metricCode === configAuth.googleAdwordsMetric.cost) {
                    param.push('cost');
                }
                else if (results.metricCode === configAuth.googleAdwordsMetric.conversionrate) {
                    param.push('conv. rate');
                }
                else if (results.metricCode === configAuth.googleAdwordsMetric.conversions) {
                    param.push('conversions');
                }
                else if (results.metricCode === configAuth.googleAdwordsMetric.impressions) {
                    param.push('impressions');
                }
                else if (results.metricCode === configAuth.googleAdwordsMetric.clickThroughRate) {
                    param.push('ctr')
                }
                else if (results.metricCode === configAuth.googleAdwordsMetric.costperclick) {
                    param.push('avg. cpc');
                }
                else if (results.metricCode === configAuth.googleAdwordsMetric.costperthousandImpressions) {
                    param.push('avg. cpm');
                }
                else {
                    param.push('cost / conv.');
                }
                console.log('param', param);
                var finalData = [];
                for (var prop = 0; prop < data.length; prop++) {
                    console.log('gad data', data[0])
                    var value = {};
                    value = {
                        total: parseInt(data[prop][param]),
                        date: data[prop].day
                    };
                    finalData.push(value);
                }

                if (results.dataResult != null) {
                    //merge the old data with new one and update it in db
                    for (var key = 0; key < results.dataResult.length; key++) {
                        finalData.push(results.dataResult[key]);
                    }
                    actualFinalApiData = {
                        apiResponse: finalData,
                        metricId: results.metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    //actualFinalApiData = {apiResponse : finalData , metricId : results.metricId}
                    console.log('finalData', finalData);
                    callback(null, actualFinalApiData);

                }
                else {
                    console.log('finalDataElse', finalData);
                    actualFinalApiData = {
                        apiResponse: finalData,
                        metricId: results.metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    // actualFinalApiData = {apiResponse: finalData, metricId: results.metricId}
                    callback(null, actualFinalApiData);
                }

            }

        }
    }


    function selectTweetObjectType(intialResults) {
        //select object type

        if (err)
            req.app.result = {error: err, message: 'Database error'};
        else if (!profile)
            req.app.result = {status: 302, message: 'No record found'};
        else {

            //To select which object type
            switch (objectType.type) {
                case configAuth.objectType.twitter:
                    getTweetData(profile, channelDetails, widget, object, results);
                    break;

            }
        }

    }

    function getTweetData(results) {
        console.log('resullts', results.widget.charts[0].metrics);
        var dataResult = results.data;

        //To Get the Metrice Type throught widgetDetails
        //and get metricid and object id from object
        Metric.find({
            _id: results.widget.charts[0].metrics[0].metricId,
            objectTypes: {$elemMatch: {objectTypeId: results.widget.charts[0].metrics[0].objectTypeId}}
        }, function (err, response) {
            //console.log('responsee', response)
            if (!err) {

                //Function to format the date
                function calculateDate(d) {
                    month = '' + (d.getMonth() + 1),
                        day = '' + d.getDate(),
                        year = d.getFullYear();
                    if (month.length < 2) month = '0' + month;
                    if (day.length < 2) day = '0' + day;
                    var startDate = [year, month, day].join('-');
                    return startDate;
                }

                d = new Date();
                var metricType = response[0].name;
                if (dataResult != 'No data') {
                    var updated = calculateDate(dataResult.updated);
                    var currentDate = calculateDate(new Date());
                    d.setDate(d.getDate() + 1);
                    var endDate = calculateDate(d);
                    //if (updated < currentDate) {
                    var query = response[0].objectTypes[0].meta.TweetMetricName;
                    console.log('queryyy', metricType);
                    fetchTweetData(results.get_profile[0], metricType, query, results.widget, dataResult, response, results);
                    // }
                    /* else
                     sendFinalData(dataResult, response);*/
                }
                else {
                    console.log('metricTypemetricType', metricType)
                    var query = response[0].objectTypes[0].meta.TweetMetricName;
                    fetchTweetData(results.get_profile[0], metricType, query, results.widget, dataResult, response, results);
                }

            }
        });
    }

    //Fetch twitter data based on metrics
    function fetchTweetData(profile, metricType, query, widget, dataResult, metric, results) {
        // console.log('fetchdata', results)
        var wholetweetData = [];
        var dataResult = results.data;
        if (dataResult != 'No data') {

            var createdAt = new Date(Date.parse(dataResult.data[dataResult.data.length - 1].created_at.replace(/( +)/, ' UTC$1')));
            console.log('createdat', createdAt, new Date(req.body.startDate));
            var totalCount = getDaysDifference(calculateDate(createdAt), calculateDate(new Date(req.body.startDate)));
            var startDateFromClient = new Date(req.body.startDate);
            console.log('if caltweetapi result', totalCount, createdAt, new Date(req.body.startDate));
            if (startDateFromClient > createdAt) {
                console.log('total', totalCount)
                callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, dataResult, results, '', '', '', metricType, '', '');
            }

            else
                sendFinalData(dataResult, metric)
            //callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, dataResult, results, metricType);
        }
        else {
            var initialCount = 200;
            //console.log('else data', results)
            callTweetApi(query, profile, initialCount, wholetweetData, widget, metric, dataResult, results, '', '', '', metricType, '', '');
        }

        updated = new Date();

    }

    //Updating the old data with new one
    function storeTweetData(wholetweetData, results, metric, noTweet, data) {
        console.log('wholetweetData[wholetweetData.length-1].created_at', wholetweetData[0].created_at, wholetweetData[wholetweetData.length - 1].created_at, 'noTweet', noTweet)
        var storeDefaultValues = [];
        var defaultTweetValues = {};
        var defaultTweetDataArray = [];
        // console.log('results storeTweetData', wholetweetData);

        if (metric[0].name == configAuth.twitterMetric.Keywordmentions) {
            var storeStartDate = new Date(Date.parse(wholetweetData.statuses[0].created_at.replace(/( +)/, ' UTC$1')));
            var storeEndDate = new Date(req.body.startDate);
            if (storeStartDate > storeEndDate) {
                console.log('date')
                var storeStartDate = new Date(Date.parse(wholetweetData.statuses[wholetweetData.statuses.length - 1].created_at.replace(/( +)/, ' UTC$1')));

            }
            else {
                var storeStartDate = new Date(Date.parse(wholetweetData.statuses[0].created_at.replace(/( +)/, ' UTC$1')));

            }
            var storeEndDate = new Date(req.body.startDate);
            storeEndDate.setDate(storeEndDate.getDate() + 1);
        }
        else {
            var storeStartDate = new Date(Date.parse(wholetweetData[0].created_at.replace(/( +)/, ' UTC$1')));
            var storeEndDate = new Date(req.body.startDate);
            if (storeStartDate > storeEndDate) {
                console.log('datee')
                var storeStartDate = new Date(Date.parse(wholetweetData[wholetweetData.length - 1].created_at.replace(/( +)/, ' UTC$1')));

            }
            else {
                var storeStartDate = new Date(Date.parse(wholetweetData[0].created_at.replace(/( +)/, ' UTC$1')));

            }


            storeEndDate.setDate(storeEndDate.getDate() + 1);
        }


        //var storeStartDate = new Date(Date.parse(dataResult.data[dataResult.data.length - 1].created_at.replace(/( +)/, ' UTC$1')));
        //var storeEndDate = new Date(endDate);

        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        // var d = new Date(day, month, date, hours, minutes, seconds, year);
        //  console.log('dd',d);

        console.log('start date', storeStartDate, storeStartDate, 'diff', diffDays, 'end date', storeEndDate);

        var d = new Date();
        var customFormat = d.toString().slice(0, 7) + ' ' +              //Day and Month
            d.getDate() + ' ' +                          //Day number
            d.toTimeString().slice(0, 8) + ' ' +          //HH:MM:SS
            /\(.*\)/g.exec(d.toString())[0].slice(1, -1)  //TimeZone
            + ' ' + d.getFullYear();                    //Year
        //console.log('d', customFormat);

        defaultTweetDataArray.push(defaultTweetValues);
        //console.log('default', defaultTweetDataArray)
        for (var i = 0; i < diffDays; i++) {

            var finalDate = calculateDate(storeStartDate);
            defaultTweetValues = {
                created_at: finalDate,
                text: 'No data for this date',
                user: {statuses_count: 0, friends_count: 0, listed_count: 0, followers_count: 0, favourites_count: 0},
                retweet_count: 0,
                favorite_count: 0
            }
            storeDefaultValues.push(defaultTweetValues);
            //storeDefaultValues.push(defaultTweetDataArray);
            storeStartDate.setDate(storeStartDate.getDate() + 1);
        }

        // console.log('storeDefaultValues',storeDefaultValues,' wholetweetData.length', wholetweetData.length)
        //To replace the missing dates in whole data with empty values
        var validData = wholetweetData.length;
        //console.log('validta',validData,'storeDefaultValues.length',storeDefaultValues)
        for (var j = 0; j < validData; j++) {
            for (var k = 0; k < storeDefaultValues.length; k++) {

                if (metric[0].name == configAuth.twitterMetric.Keywordmentions)
                    var tweetCreatedAt = calculateDate(new Date(Date.parse(wholetweetData.statuses[j].created_at.replace(/( +)/, ' UTC$1'))));
                else
                    var tweetCreatedAt = calculateDate(new Date(Date.parse(wholetweetData[j].created_at.replace(/( +)/, ' UTC$1'))));
                //console.log('tweetcreatedatt',tweetCreatedAt,storeDefaultValues[k].created_at)
                if (tweetCreatedAt === storeDefaultValues[k].created_at) {
                    storeDefaultValues[k] = wholetweetData[j];
                    // console.log('data store default values',storeDefaultValues[k],wholetweetData[j])
                }

            }

        }
        console.log('storeDefaultValues1', storeDefaultValues[0]);

        var now = new Date();
        Data.update({
            'objectId': results.widget.charts[0].metrics[0].objectId,
            'metricId': results.widget.charts[0].metrics[0].metricId
        }, {
            $set: {data: storeDefaultValues, updated: now}
        }, {upsert: true}, function (err) {
            if (err) console.log("User not saved");
            else {
                console.log('update');
                Data.findOne({
                    'objectId': results.widget.charts[0].metrics[0].objectId,
                    'metricId': results.widget.charts[0].metrics[0].metricId
                }, function (err, response) {
                    if (!err) {
                        sendFinalData(response, metric);
                    }

                    else if (!response.length)
                        return res.status(500).json({});
                    else
                        return res.status(302).json({});

                })
            }
        });
    }

    function checkMentionsInClientInput(until, count, tweets, mentionsProfile) {
        console.log('until', until)

        //To check whether the metric is mention or not
        if (req.body.mentions != undefined) {
            if (tweets != undefined && tweets != '') {
                if (until == 1)
                    var inputs = {screen_name: mentionsProfile, count: count, since_id: tweets[0].id};
                else
                    var inputs = {screen_name: mentionsProfile, count: count};
            }
            else {
                if (until == 1)
                    var inputs = {screen_name: mentionsProfile, count: count, since_id: tweets[0].id};
                else
                    var inputs = {screen_name: mentionsProfile, count: count};
            }


        }
        else {
            if (until == 1)
                var inputs = {count: count, since_id: tweets[0].id};
            else
                var inputs = {count: count};
        }
        return inputs;
    }

    //To get user timeline,tweets based on date range
    function callTweetApi(query, profile, count, wholetweetData, widget, metric, data, results, until, tweets, tempCount, metricType, i) {
        console.log('dataquery1', tweets[0])
        if (data != undefined && data != 'No data') {

            // console.log('data reslt', data)
            for (var index = 0; index < data.data.length; index++)
                wholetweetData.push(data.data[index])
        }
        console.log('noo data');
        if (metric[0].name === configAuth.twitterMetric.Keywordmentions) {
            if (tweets != undefined && tweets != '') {
                if (until == 1)
                    var inputs = {
                        q: '%23' + profile.name,
                        count: count,
                        since_id: tweets.statuses[0].id
                    };
                else
                    var inputs = {q: '%23' + profile.name, count: count};
            }
            /* else
             return res.status(500).json({error: 'Error'});*/

        }
        else if (metric[0].name === configAuth.twitterMetric.Mentions || metricType === configAuth.twitterMetric.HighEngagementtweets) {
            console.log('else mentions');
            if (tweets != undefined && tweets != '') {
                var inputs = checkMentionsInClientInput(until, count, tweets)

            }
            //To check whether the metric is mention or not
            if (req.body.mentions != undefined) {

                var inputs = checkMentionsInClientInput(until, count, tweets, req.body.mentions)
            }
            else {
                var inputs = checkMentionsInClientInput(until, count, tweets)
            }
        }
        else
            var inputs = checkMentionsInClientInput(until, count, tweets, profile.name)


        if (data != 'No data' || tweets != '') {
            console.log('no data', results);
            if (tweets != undefined && tweets != '') {
                var TweetObject;
                for (var i = 0; i < tweets.length; i++) {
                    TweetObject = tweets[i];
                    wholetweetData.push(TweetObject);

                }
                console.log('tweets length', wholetweetData.length);
                var createdAt = new Date(Date.parse(tweets[0].created_at.replace(/( +)/, ' UTC$1')));
                // console.log('store results', results);
                //   storeTweetData(wholetweetData, results, metric, tempCount);
            }
            else {

                var createdAt = new Date(Date.parse(data.data[data.data.length - 1].created_at.replace(/( +)/, ' UTC$1')));
                console.log('else', createdAt)
            }
            console.log('temp count', tempCount)
            if (tempCount - 1 == i || tempCount == undefined || tempCount == '') {
                console.log('temp count', createdAt, new Date(req.body.startDate), tempCount, 'i', i)
                if (new Date(req.body.startDate) > createdAt) {
                    var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                    console.log('total count', totalCount, createdAt, new Date(req.body.startDate))
                    callTweetApiBasedCondition(query, profile, totalCount, wholetweetData, widget, metric, data, results, until, tweets, createdAt, inputs);
                }

                else
                //call data from db
                    sendFinalData(data, metric);
            }


        }
        else {
            // console.log('dataquery elsee', results)
            //var createdAt = new Date(Date.parse(tweets[tweets.length - 1].created_at.replace(/( +)/, ' UTC$1')));
            callTweetApiBasedCondition(query, profile, 200, wholetweetData, widget, metric, data, results, until, tweets, '', inputs)
        }

    }

    function callTweetApiBasedCondition(query, profile, totalCount, wholetweetData, widget, metric, data, results, until, tweets, createdAt, inputs) {
        console.log('query', query, 'inputs', wholetweetData.length)
        client.get(query, inputs, function (error, tweets, response) {
            console.log('total tweets for high ', query, tweets)


            if (error)
                return res.status(500).json({});
            else if (tweets.length == 0) {
                console.log('tweets', tweets.length, 'else if')
                storeTweetData(wholetweetData, results, metric, 1);
            }


            // return res.status(500).json({});
            else {
                if (data == 'No data') {
                    if (metric[0].name == configAuth.twitterMetric.Keywordmentions) {
                        var createdAt = new Date(Date.parse(tweets.statuses[0].created_at.replace(/( +)/, ' UTC$1')));
                    }
                    else
                        var createdAt = new Date(Date.parse(tweets[0].created_at.replace(/( +)/, ' UTC$1')));

//                var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                }
                else {

                    var createdAt = data.updated;

//                var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                }
                console.log('new Date(req.body.startDate) > createdAt', new Date(req.body.startDate), createdAt);
                if (new Date(req.body.startDate) > createdAt && createdAt.setDate(createdAt.getDate() + 1) != new Date()) {

                    console.log('tweet if', totalCount, req.body.startDate, createdAt)
                    var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                    if (new Date(req.body.startDate) > createdAt) {
                        if (totalCount < 200)
                            callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, data, results, 1, tweets);
                        else {
                            console.log('looping else');
                            var count = totalCount % 200;
                            //if (count == 0) {
                            var tempCount = totalCount / 200;
                            console.log('temp count', tempCount);
                            if (tempCount > 0) {
                                for (var i = 0; i < tempCount; i++) {
                                    console.log('i count', i, tweets.length)
                                    callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, data, results, 1, tweets, tempCount, i);
                                }

                            }
                            // }
                            /* else
                             callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, data, results, 1, tweets);*/
                        }
                    }

                }
                var TweetObject;
                for (var i = 0; i < tweets.length; i++) {
                    TweetObject = tweets[i];
                    wholetweetData.push(TweetObject);

                }

                storeTweetData(wholetweetData, results, metric, data);
                //console.log('storersult',wholetweetData.length,'tweets.length',tweets.length,wholetweetData[0].created_at);

            }

        });
    }

    //To send format the data from db and send to client
    function sendFinalData(response, metric) {
        console.log('send final data')
        var param = [];
        var finaldataArray = [];
        var finalTweetResult = [];
        var storeTweetDetails = [];
        if (metric[0].code == configAuth.twitterMetric.tweets)
            param.push('statuses_count');
        else if (metric[0].name == 'Following')
            param.push('friends_count');
        else if (metric[0].name == 'Listed')
            param.push('listed_count');
        else if (metric[0].name == 'Followers')
            param.push('followers_count');
        else if (metric[0].name == 'Favourites')
            param.push('favourites_count');
        else if (metric[0].name == 'Retweets of your tweets')
            param.push('retweet_count');
        else if (metric[0].name == 'Mentions' || 'Keyword mentions')
            param.push('retweet_count', 'favorite_count');
        else
            param.push('retweet_count', 'favorite_count');
        if (response.data.length != 0) {

            for (var key = 0; key < response.data.length; key++) {
                var totalArray = [];

                //To format twitter date
                var createdAt = new Date(Date.parse(response.data[key].created_at.replace(/( +)/, ' UTC$1')));
                var date = formatDate(createdAt);

                for (var index = 0; index < param.length; index++) {
                    if (param.length > 1) {

                        var total = response.data[key][param[index]];
                        var text = response.data[key].text;
                        totalArray.push(total);

                        if (totalArray.length > 1) {
                            var title = param[index];
                            var finalDate = (date >= req.body.startDate && date <= req.body.endDate) ? storeTweetDetails.push({
                                date: date,
                                text: text,
                                retweet_count: totalArray[0],
                                favourite_count: totalArray[1]
                            }) : false;
                        }
                    }
                    else {
                        var total = response.data[key].user[param[index]];
                        totalArray.push({total: total, date: date});

                        //Get the required data based on date range
                        var finalDate = (date >= req.body.startDate && date <= req.body.endDate) ? storeTweetDetails.push({
                                total: total,
                                date: date
                            }
                        ) : false;
                    }
                }
            }
            if (metric[0].code == configAuth.twitterMetric.tweets)
                getTotalTweetsPerDay(storeTweetDetails, response);

            else {
                finaldataArray.push({metricId: response.metricId, objectId: response.objectId});
                finalTweetResult.push({
                    metricId: response.metricId,
                    objectId: response.objectId,
                    data: storeTweetDetails
                });
                console.log('finalTweetResult', finalTweetResult)
                req.app.result = finalTweetResult;
                next();
            }

        }
        else {
            req.app.result = {Error: '500'};
            next();
        }

    }

    //To get tweet counts
    function getTotalTweetsPerDay(storeTweetDetails, response) {
        var result = {};
        var finalTweetCount = [];
        var finalTweetData = [];

        //To find the number of tweets
        for (var i = 0; i < storeTweetDetails.length; ++i) {
            if (!result[storeTweetDetails[i].date])
                result[storeTweetDetails[i].date] = 0;
            ++result[storeTweetDetails[i].date];
        }

        //Push the final tweet details in array
        for (var key in result) {
            var date = key;
            var total = result[key];
            finalTweetCount.push({date: date, total: total})
        }
        finalTweetData.push({metricId: response.metricId, objectId: response.objectId, data: finalTweetCount})
        req.app.result = finalTweetData;
        next();
    }
};