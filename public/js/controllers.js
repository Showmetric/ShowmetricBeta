var showMetricApp = angular.module('inspinia');

showMetricApp.service('createWidgets', function ($http, $q) {

    this.widgetHandler = function (widget, dateRange, isPublic) {
        var months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ];
        var deferredWidget = $q.defer();
        var tempWidget = JSON.parse(JSON.stringify(widget));
        if (widget.widgetType == 'customFusion') {
            var sourceWidgetList = [], dataLoadedWidgetArray = [], widgetChartsArray = [];
            sourceWidgetList.push(fetchCustomFusionWidgets(widget));
            $q.all(sourceWidgetList).then(
                function successCallback(sourceWidgetList) {
                    var widgetList = sourceWidgetList[0];
                    for (var subWidgets in widgetList) {
                        if (widgetList[subWidgets].widgetType == 'basic' || widgetList[subWidgets].widgetType == 'adv' || widgetList[subWidgets].widgetType == 'fusion')
                            dataLoadedWidgetArray.push(getRegularWidgetElements(widgetList[subWidgets], dateRange, isPublic));
                        else if (widgetList[subWidgets].widgetType == 'custom')
                            dataLoadedWidgetArray.push(getCustomWidgetElements(widgetList[subWidgets], dateRange));
                    }
                    $q.all(dataLoadedWidgetArray).then(
                        function successCallback(dataLoadedWidgetArray) {
                            for (var dataLoadedWidgets in dataLoadedWidgetArray) {
                                if (dataLoadedWidgetArray[dataLoadedWidgets].widgetType == 'basic' || dataLoadedWidgetArray[dataLoadedWidgets].widgetType == 'adv' || dataLoadedWidgetArray[dataLoadedWidgets].widgetType == 'fusion')
                                    widgetChartsArray.push(formulateRegularWidgetGraphs(dataLoadedWidgetArray[dataLoadedWidgets]));
                                else if (dataLoadedWidgetArray[dataLoadedWidgets].widgetType == 'custom')
                                    widgetChartsArray.push(formulateCustomWidgetGraphs(dataLoadedWidgetArray[dataLoadedWidgets]));
                            }
                            $q.all(widgetChartsArray).then(
                                function successCallback(widgetChartsArray) {
                                    var consolidatedChartsArray = [];
                                    for (var arrayObjects in widgetChartsArray) {
                                        for (var subObjects in widgetChartsArray[arrayObjects])
                                            consolidatedChartsArray.push(widgetChartsArray[arrayObjects][subObjects])
                                    }
                                    var widgetData = createWidgetData(tempWidget, consolidatedChartsArray);
                                    widgetData.then(
                                        function successCallback(widgetData) {
                                            deferredWidget.resolve(widgetData);
                                        },
                                        function errorCallback(error) {
                                            deferredWidget.reject(error);
                                        }
                                    );
                                },
                                function errorCallback(error) {
                                    deferredWidget.reject(error);
                                }
                            );
                        },
                        function errorCallback(err) {
                            deferredWidget.reject(err);
                        }
                    );
                },
                function errorCallback(err) {
                    deferredWidget.reject(err);
                }
            );
        }
        else if (widget.widgetType == 'basic' || widget.widgetType == 'adv' || widget.widgetType == 'fusion') {
            var dataLoadedWidget = getRegularWidgetElements(tempWidget, dateRange, isPublic);
            dataLoadedWidget.then(
                function successCallback(dataLoadedWidget) {
                    var widgetCharts = formulateRegularWidgetGraphs(dataLoadedWidget, dateRange);
                    widgetCharts.then(
                        function successCallback(widgetCharts) {
                            var widgetData = createWidgetData(widget, widgetCharts);
                            widgetData.then(
                                function successCallback(widgetData) {
                                    deferredWidget.resolve(widgetData);
                                },
                                function errorCallback(error) {
                                    deferredWidget.reject(error);
                                }
                            );
                        },
                        function errorCallback(error) {
                            deferredWidget.reject(error);
                        }
                    );
                },
                function errorCallback(error) {
                    deferredWidget.reject(error);
                }
            );
        }
        else if (widget.widgetType == 'custom') {
            var dataLoadedWidget = getCustomWidgetElements(tempWidget, dateRange);
            dataLoadedWidget.then(
                function successCallback(dataLoadedWidget) {
                    var widgetCharts = formulateCustomWidgetGraphs(dataLoadedWidget);
                    widgetCharts.then(
                        function successCallback(widgetCharts) {
                            var widgetData = createWidgetData(widget, widgetCharts, dateRange);
                            widgetData.then(
                                function successCallback(widgetData) {
                                    deferredWidget.resolve(widgetData);
                                },
                                function errorCallback(error) {
                                    deferredWidget.reject(error);
                                }
                            );
                        },
                        function errorCallback(error) {
                            deferredWidget.reject(error);
                        }
                    );
                },
                function errorCallback(error) {
                    deferredWidget.reject(error);
                }
            );

        }
        return deferredWidget.promise;

        function fetchCustomFusionWidgets(widget) {
            var deferred = $q.defer();
            var sourceWidgetList = [];
            var finalWidgetList = [];

            for (var widgetReferences in widget.widgets) {
                var widgetType = widget.widgets[widgetReferences].widgetType;
                if (widgetType == 'basic' || widgetType == 'adv' || widgetType == 'fusion' || widgetType == 'custom')
                    sourceWidgetList.push(getWidgetData(widget.widgets[widgetReferences].widgetId));
            }
            $q.all(sourceWidgetList).then(
                function successCallback(sourceWidgetList) {
                    deferred.resolve(sourceWidgetList);
                },
                function errorCallback(err) {
                    deferred.reject(err);
                }
            );
            return deferred.promise;

            function getWidgetData(widgetId) {
                var data = $q.defer();
                $http({
                    method: 'GET',
                    url: '/api/v1/widget/' + widgetId
                }).then(
                    function successCallback(response) {
                        data.resolve(response.data[0]);
                    },
                    function errorCallback(err) {
                        data.resolve(err);
                    }
                );
                return data.promise;
            }
        }

        function getCustomWidgetElements(widget, dateRange) {
            var deferred = $q.defer();
            var updatedCharts = [];
            var countCustomData = 0;

            $http({
                method: 'POST',
                url: '/api/v1/customWidget/data/' + widget._id,
                data: {
                    "startDate": dateRange.startDate,
                    "endDate": dateRange.endDate
                }
            }).then(
                function successCallback(response) {
                    var formattedCharts = [];
                    countCustomData++;
                    for (var getData in response.data) {
                        if (response.data[getData].widgetId == widget._id) {
                            updatedCharts.push({
                                _id: response.data[getData]._id,
                                chartName: "Custom Data " + countCustomData,
                                chartType: response.data[getData].chartType,
                                widgetId: response.data[getData].widgetId,
                                chartData: response.data[getData].data,
                                intervalType: response.data[getData].intervalType,
                                metricsCount: response.data[getData].metricsCount
                            });
                        }
                    }
                    widget.charts = updatedCharts;
                    deferred.resolve(widget);
                },
                function errorCallback(error) {
                    deferred.reject(error);
                }
            );
            return deferred.promise;
        }

        function formulateCustomWidgetGraphs(widget) {
            var deferred = $q.defer();
            var widgetCharts = [];

            for (var charts in widget.charts) {
                var valuesArr = [], formattedChartData = [];
                if (widget.charts[charts].chartType == 'line' || widget.charts[charts].chartType == 'bar' || widget.charts[charts].chartType == 'column' || widget.charts[charts].chartType == 'area') {
                    for (var dataObjects in widget.charts[charts].chartData) {
                        var IsAlreadyExist = 0;
                        for (var getData in widgetCharts) {
                            if (widgetCharts[getData].key == widget.charts[charts].chartData[dataObjects].name) {
                                valuesArr = widgetCharts[getData].values;
                                var dataValues = {
                                    'x': moment(widget.charts[charts].chartData[dataObjects].date),
                                    'y': widget.charts[charts].chartData[dataObjects].values
                                };
                                valuesArr.push(dataValues);
                                valuesArr.sort(function (a, b) {
                                    var c = new Date(a.x);
                                    var d = new Date(b.x);
                                    return c - d;
                                });
                                widgetCharts[getData].values = valuesArr;
                                IsAlreadyExist = 1;
                            }
                        }
                        if (IsAlreadyExist != 1) {
                            valuesArr = [];
                            var dataValues = {
                                'x': moment(widget.charts[charts].chartData[dataObjects].date),
                                'y': widget.charts[charts].chartData[dataObjects].values
                            };
                            valuesArr.push(dataValues);
                            valuesArr.sort(function (a, b) {
                                var c = new Date(a.x);
                                var d = new Date(b.x);
                                return c - d;
                            });
                            widgetCharts.push({
                                type: widget.charts[charts].chartType,
                                values: valuesArr,
                                key: widget.charts[charts].chartData[dataObjects].name,
                                color: null
                            });
                        }
                    }
                }
                else if (widget.charts[charts].chartType == 'pie') {
                    for (var dataObjects in widget.charts[charts].chartData) {
                        var IsAlreadyExist = 0;
                        for (getData in widgetCharts) {
                            var yValue = 0;
                            if (widgetCharts[getData].key == widget.charts[charts].chartData[dataObjects].name) {
                                yValue = parseInt(widgetCharts[getData].y);
                                widgetCharts[getData].y = parseInt(yValue) + parseInt(widget.charts[charts].chartData[dataObjects].values);
                                IsAlreadyExist = 1;
                            }
                        }
                        if (IsAlreadyExist != 1) {
                            widgetCharts.push({
                                type: widget.charts[charts].chartType,
                                y: parseInt(widget.charts[charts].chartData[dataObjects].values),
                                key: widget.charts[charts].chartData[dataObjects].name,
                                color: null
                            });
                        }
                    }
                }
            }

            deferred.resolve(widgetCharts);
            return deferred.promise;
        }

        function getRegularWidgetElements(widget, dateRange) {
            var deferred = $q.defer();
            var updatedCharts;
            updatedCharts = getRegularWidgetData(widget, dateRange, isPublic);
            updatedCharts.then(
                function successCallback(updatedCharts) {
                    widget.charts = updatedCharts;
                    var metricDetails = [];
                    for (var charts in widget.charts)
                        metricDetails.push(fetchMetricDetails(widget.charts[charts]));
                    $q.all(metricDetails).then(
                        function successCallback(metricDetails) {
                            for (charts in widget.charts)
                                widget.charts[charts].metricDetails = metricDetails[charts];
                            deferred.resolve(widget);
                        },
                        function errorCallback(error) {
                            deferred.reject(error);
                        }
                    );
                },
                function errorCallback(error) {
                    deferred.reject(error);
                }
            );
            return deferred.promise;
        }

        function getRegularWidgetData(widget, dateRange, isPublic) {
            var deferred = $q.defer();
            var updatedCharts = [];
            if (isPublic) {
                var dataUrl = {
                    method: 'POST',
                    url: '/api/v1/widgets/data/' + widget._id,
                    data: {
                        "startDate": dateRange.startDate,
                        "endDate": dateRange.endDate,
                        "params": 'public'
                    }
                };
            }
            else {
                var dataUrl = {
                    method: 'POST',
                    url: '/api/v1/widgets/data/' + widget._id,
                    data: {
                        "startDate": dateRange.startDate,
                        "endDate": dateRange.endDate,
                    }
                }
            }
            $http(dataUrl).then(
                function successCallback(response) {
                    for (var chartObjects in widget.charts) {
                        for (var datas in response.data) {
                            if (String(widget.charts[chartObjects].metrics[0].metricId) === String(response.data[datas].metricId)) {
                                updatedCharts.push({
                                    channelId: widget.charts[chartObjects].channelId,
                                    chartType: typeof widget.charts[chartObjects].metrics[0].chartType != 'undefined' ? widget.charts[chartObjects].metrics[0].chartType : '',
                                    chartSubType: widget.charts[chartObjects].metrics[0].subChartType != undefined ? widget.charts[chartObjects].metrics[0].subChartType : '',
                                    chartName: widget.charts[chartObjects].name,
                                    chartColour: widget.charts[chartObjects].metrics[0].color,
                                    chartOptions: widget.charts[chartObjects].metrics[0].chartOptions,
                                    chartMetricId: response.data[datas].metricId,
                                    chartObjectId: response.data[datas].objectId,
                                    chartObjectTypeId: widget.charts[chartObjects].metrics[0].objectTypeId,
                                    chartObjectName: widget.charts[chartObjects].objectName,
                                    chartData: response.data[datas].data
                                });

                            }
                        }
                    }
                    deferred.resolve(updatedCharts);
                },
                function errorCallback(error) {
                    if (tempWidget.widgets.length > 0) {

                        k = tempWidget.widgets.map(function (e) {
                            return e._id;
                        }).indexOf(error._id);
                        if (k !== -1) {
                            error.data.id = tempWidget._id;
                        }
                        deferred.reject(error);
                    }
                    else
                        deferred.reject(error);
                }
            );
            return deferred.promise;
        }

        function fetchMetricDetails(chart) {

            var deferred = $q.defer();

            if (chart.chartMetricId == undefined) {
                deferred.reject("error");
            }
            else {
                $http({
                    method: 'GET',
                    url: '/api/v1/get/metricDetails/' + chart.chartMetricId
                }).then(
                    function successCallback(response) {
                        deferred.resolve(response.data.metricsList[0]);
                    },
                    function errorCallback(error) {
                        deferred.reject(error);
                    }
                );
            }
            return deferred.promise;
        }

        function formulateRegularWidgetGraphs(widget, dateRange) {
            var deferred = $q.defer();
            var widgetCharts = [];
            var totalNonZeroPoints = -1;
            var summaryValueinChart = 0;
            if (widget.charts.length > 0) {
                for (var charts in widget.charts) {
                    var chartType = widget.charts[charts].chartType;
                    if (chartType == "bounceRateArea") {
                        var changeArray = []
                        if (typeof widget.charts[charts].chartData[0].total == 'object') {
                            for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                                var bounces = parseFloat(widget.charts[charts].chartData[i].total[0].bounces)
                                var sessions = parseFloat(widget.charts[charts].chartData[i].total[0].sessions)
                                if (sessions === 0)
                                    var bouncesRate = bounces;
                                else
                                    var bouncesRate = ((bounces / sessions) * 100).toFixed(2);
                                changeArray.push({
                                    x: moment(widget.charts[charts].chartData[i].date),
                                    y: bouncesRate,
                                    bounces: bounces,
                                    sessions: Math.round(sessions * 100) / 100
                                })

                            }
                        }
                        widget.charts[charts].chartData = changeArray;
                    }
                    else if (chartType == "costPerClick" || chartType == "costPerThosuandImpressions" || chartType == "clickThroughRate" || chartType == "ConversionRate" || chartType == "costPerConversion"){
                        var changeArray=[];
                        if(chartType == "costPerClick" ){
                            var dividendKeyWord='Cost'
                            var divisorKeyWord='Clicks'
                        }else if(chartType == "costPerThosuandImpressions"){
                            var dividendKeyWord='Cost'
                            var divisorKeyWord='Impressions'
                        }else if(chartType == "clickThroughRate"){
                            var dividendKeyWord='Clicks'
                            var divisorKeyWord='Impressions'
                        }else if(chartType == "ConversionRate"){
                            var dividendKeyWord='Conversions'
                            var divisorKeyWord='Clicks'
                        }else if(chartType == "costPerConversion"){
                            var dividendKeyWord='Cost'
                            var divisorKeyWord='Conversions'
                        }
                        for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                            var dividend=0;
                            var divisor=0;
                            if (typeof widget.charts[charts].chartData[i].total[0] == 'object') {
                                if(dividendKeyWord ==='Cost')
                                    dividend=parseFloat(widget.charts[charts].chartData[i].total[0][dividendKeyWord]/1000000).toFixed(2);
                                else
                                    dividend=parseFloat(widget.charts[charts].chartData[i].total[0][dividendKeyWord])
                                divisor=parseFloat(widget.charts[charts].chartData[i].total[0][divisorKeyWord])
                            }
                            if (dividend  === 0 )
                                var yvalue  = dividend ;
                            else{
                                if(chartType == "costPerThosuandImpressions")
                                    var yvalue   = (dividend  / divisor  * 1000).toFixed(2);
                                else if(chartType == "clickThroughRate" ||chartType == "clickThroughRate" || chartType == "costPerConversion" )
                                    var yvalue   = (dividend  / divisor * 100).toFixed(2)==='Infinity'?0:(dividend  / divisor * 100).toFixed(2)
                                else var yvalue   = (dividend  / divisor).toFixed(2);
                            }

                            changeArray.push({
                                x: moment(widget.charts[charts].chartData[i].date),
                                y: yvalue,
                                dividend: dividend,
                                divisor: divisor
                            })
                        }
                        widget.charts[charts].chartData = changeArray;
                    }
                    else if (chartType == "line" || chartType == "area" || chartType == "bar" || chartType == "column" || chartType == "stackcolumn" || chartType == "mozoverview" || chartType == 'negativeBar' ) {
                        if (typeof widget.charts[charts].chartData[0].total == 'object') {
                            var chartCode = widget.charts[charts].chartCode;
                            var endpoint;
                            for (objectTypes in widget.charts[charts].metricDetails.objectTypes) {
                                if (widget.charts[charts].metricDetails.objectTypes[objectTypes].objectTypeId == widget.charts[charts].chartObjectTypeId) {
                                    endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint;
                                    widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpointDisplay != undefined ? widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpointDisplay : widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint
                                }
                            }

                            var formattedChartDataArray = [];
                            if (endpoint.length != 0) {
                                for (items in endpoint) {
                                    var currentItem = endpoint[items];
                                    var formattedChartData = [];
                                    for (datas in widget.charts[charts].chartData) {
                                        var yValue = 0, endpointArray;
                                        if (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0)) {
                                            for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                                if (keyValuePairs.search('/') > -1) {
                                                    endpointArray = keyValuePairs.split('/');
                                                    for (var splittedValues in endpointArray) {
                                                        if (endpointArray[splittedValues] == currentItem)
                                                            yValue += parseFloat(widget.charts[charts].chartData[datas].total[keyValuePairs]);
                                                    }
                                                }
                                                else if (keyValuePairs == currentItem)
                                                    yValue = widget.charts[charts].chartData[datas].total[currentItem];
                                            }
                                        }
                                        formattedChartData.push({
                                            x: moment(widget.charts[charts].chartData[datas].date),
                                            y: Math.round(yValue * 100) / 100
                                        });
                                    }
                                    formattedChartDataArray.push(formattedChartData);
                                }
                            }
                            else {
                                var formattedChartData = [];
                                for (datas in widget.charts[charts].chartData) {
                                    var yValue = 0, xValue, endpointArray;
                                    var total = widget.charts[charts].chartData[datas].total
                                    if (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total).length != 0) {
                                        for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                            if (keyValuePairs.search('/') > -1) {
                                                endpointArray = keyValuePairs.split('/');
                                                for (var splittedValues in endpointArray) {
                                                    yValue += parseFloat(widget.charts[charts].chartData[datas].total[keyValuePairs]);
                                                    xValue = keyValuePairs;
                                                }
                                            }
                                            else
                                                yValue = widget.charts[charts].chartData[datas].total[currentItem];
                                            xValue = keyValuePairs;
                                        }
                                        formattedChartData.push({
                                            x: xValue,
                                            y: Math.round(yValue * 100) / 100
                                        });
                                    }
                                }
                                formattedChartDataArray.push(formattedChartData);
                            }
                            var temp = [];
                            if (chartCode == 'userinteractions_clicks' && widget.channelName == 'Facebook') {
                                for (var i = 0; i < formattedChartDataArray.length; i++) {
                                    for (var j = 0; j < formattedChartDataArray[i].length; j++) {
                                        if (!temp[j]) {
                                            temp[j] = {x: 0, y: 0}
                                        }
                                        temp[j].x = formattedChartDataArray[0][j].x
                                        temp[j].y += formattedChartDataArray[i][j].y
                                    }
                                }
                                formattedChartDataArray = temp;
                            }
                            widget.charts[charts].chartData = formattedChartDataArray;
                        }
                        else {
                            var formattedChartData = [];
                            for (var datas in widget.charts[charts].chartData) {
                                formattedChartData.push({
                                    x: moment(widget.charts[charts].chartData[datas].date),
                                    y: widget.charts[charts].chartData[datas].total != null ?Math.round(widget.charts[charts].chartData[datas].total * 100) / 100 : 0
                                });
                            }
                            widget.charts[charts].chartData = formattedChartData;
                        }
                        if (widget.charts[charts].chartSubType === 'fbTopReferringDomain') {
                            var sortDomains = _.sortBy(formattedChartData, 'y').reverse();
                            var sortedArray = [];
                            if (formattedChartData.length < 10) var sortingLength = formattedChartData.length - 1;
                            else var sortingLength = 9;
                            for (var k = 0; k <= sortingLength; k++) {
                                sortedArray.push({x: sortDomains[k].x, y: sortDomains[k].y})
                            }
                            widget.charts[charts].chartData = sortedArray;
                        }
                    }
                    else if (chartType == "reachVsImpressions" || chartType == "engagedUsersReach") {
                        if (widget.charts[charts].chartName == 'Total Impressions' || widget.charts[charts].chartName == 'Engaged Users') {
                            var imp = []
                            var reach = []
                            for (var i = 0; i < widget.charts.length; i++) {
                                if (widget.charts[i].chartName == 'Total Impressions' || widget.charts[i].chartName == 'Engaged Users') {
                                    imp = widget.charts[i].chartData;
                                }
                                if (widget.charts[i].chartName == 'Total Reach')
                                    reach = widget.charts[i].chartData;
                            }
                            var percentage = [];
                            for (var data in imp) {
                                var value = (imp[data].total / reach[data].total) * 100;
                                if (isNaN(value))
                                    value = 0;
                                percentage.push({
                                    x: moment(imp[data].date),
                                    y: parseFloat(value).toFixed(2),
                                    imp: imp[data].total,
                                    rea: reach[data].total
                                })
                            }
                            widget.charts[charts].chartData = percentage;
                        }
                        else {
                            var formattedChartData = [];
                            for (var datas in widget.charts[charts].chartData) {
                                formattedChartData.push({
                                    x: moment(widget.charts[charts].chartData[datas].date),
                                    y: widget.charts[charts].chartData[datas].total != null ? widget.charts[charts].chartData[datas].total : 0
                                });
                            }
                            widget.charts[charts].chartData = formattedChartData;
                        }
                    }
                    else if (chartType == "trafficSourcesBrkdwnLine") {
                        if (typeof widget.charts[charts].chartData[0].total == 'object') {
                            var endpoint;
                            for (objectTypes in widget.charts[charts].metricDetails.objectTypes) {
                                if (widget.charts[charts].metricDetails.objectTypes[objectTypes].objectTypeId == widget.charts[charts].chartObjectTypeId)
                                    endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint;
                            }
                            var formattedChartDataArray = [];

                            for (datas in widget.charts[charts].chartData) {
                                var yValue = 0, endpointArray;
                                if (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0)) {
                                    for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                        typeof (widget.charts[charts].chartData[datas].total['social/Yes']) != 'undefined' ? Number(widget.charts[charts].chartData[datas].total['social/Yes']) : 0;
                                        if (keyValuePairs.search('/') > -1) {
                                            endpointArray = keyValuePairs.split('/');
                                            if (endpointArray[1] == 'Yes') {
                                                widget.charts[charts].chartData[datas].total['social/Yes'] = Number(widget.charts[charts].chartData[datas].total[keyValuePairs]);
                                                widget.charts[charts].chartData[datas].total[keyValuePairs] = 0;
                                            }
                                        }
                                    }
                                }
                            }

                            for (items in endpoint) {
                                var currentItem = endpoint[items];
                                var formattedChartData = [];
                                for (datas in widget.charts[charts].chartData) {
                                    var yValue = 0, endpointArray;
                                    if (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0)) {
                                        for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                            if (keyValuePairs.search('/') > -1) {
                                                endpointArray = keyValuePairs.split('/');
                                                for (var splittedValues in endpointArray) {
                                                    if (endpointArray[splittedValues] == currentItem)
                                                        yValue += parseFloat(widget.charts[charts].chartData[datas].total[keyValuePairs]);
                                                }
                                            }
                                            else if (keyValuePairs == currentItem)
                                                yValue = widget.charts[charts].chartData[datas].total[currentItem];
                                        }
                                    }
                                    formattedChartData.push({
                                        x: moment(widget.charts[charts].chartData[datas].date),
                                        y: Math.round(yValue * 100) / 100
                                    });
                                }
                                formattedChartDataArray.push(formattedChartData);
                            }
                            widget.charts[charts].chartData = formattedChartDataArray;
                        }
                        else {
                            var formattedChartData = [];
                            for (var datas in widget.charts[charts].chartData) {
                                formattedChartData.push({
                                    x: moment(widget.charts[charts].chartData[datas].date),
                                    y: widget.charts[charts].chartData[datas].total != null ?Math.round( widget.charts[charts].chartData[datas].total * 100) / 100 : 0
                                });
                            }
                            widget.charts[charts].chartData = formattedChartData;
                        }
                    }
                    else if (chartType == "pie") {
                        if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                            var endpoint = [];
                            for (var objectTypes in widget.charts[charts].metricDetails.objectTypes) {
                                if (widget.charts[charts].metricDetails.objectTypes[objectTypes].objectTypeId == widget.charts[charts].chartObjectTypeId)
                                    endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint;
                            }
                            var formattedChartDataArray = [];
                            for (items in endpoint) {
                                var currentItem = endpoint[items];
                                formattedChartData = [];
                                var yValue = 0;
                                for (datas in widget.charts[charts].chartData) {
                                    if (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0)) {
                                        for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                            if (keyValuePairs.search('/') > -1) {
                                                endpointArray = keyValuePairs.split('/');
                                                for (var splittedValues in endpointArray) {
                                                    if (endpointArray[splittedValues] == currentItem)
                                                        yValue += parseFloat(widget.charts[charts].chartData[datas].total[keyValuePairs]);
                                                }
                                            }
                                            else if (keyValuePairs == currentItem)
                                                yValue += parseFloat(widget.charts[charts].chartData[datas].total[currentItem]);
                                        }
                                    }
                                }
                                formattedChartData.push({
                                    y: (parseFloat(yValue).toFixed(2) % Math.floor(parseFloat(yValue).toFixed(2))) > 0 ? parseFloat(yValue).toFixed(2) : parseFloat(yValue).toFixed(2) > 1 ? parseInt(yValue) : parseFloat(yValue) > 0 ? parseFloat(yValue).toFixed(2) : parseInt(yValue)
                                });
                                formattedChartDataArray.push(formattedChartData);
                            }
                            widget.charts[charts].chartData = formattedChartDataArray;
                        }
                        else {
                            var yValue = 0;
                            for (datas in widget.charts[charts].chartData) {
                                yValue += parseFloat(widget.charts[charts].chartData[datas].total);
                            }
                            formattedChartData.push({
                                y: (parseFloat(yValue).toFixed(2) % Math.floor(parseFloat(yValue).toFixed(2))) > 0 ? parseFloat(yValue).toFixed(2) : parseFloat(yValue).toFixed(2) > 1 ? parseInt(yValue) : parseFloat(yValue) > 0 ? parseFloat(yValue).toFixed(2) : parseInt(yValue)
                            });
                            widget.charts[charts].chartData = formattedChartData;
                        }
                    }
                    else if (chartType == "trafficSourcesBrkdwnPie") {
                        if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                            var endpoint = [];
                            for (objectTypes in widget.charts[charts].metricDetails.objectTypes) {
                                if (widget.charts[charts].metricDetails.objectTypes[objectTypes].objectTypeId == widget.charts[charts].chartObjectTypeId)
                                    endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint;
                            }
                            var formattedChartDataArray = [];
                            for (datas in widget.charts[charts].chartData) {
                                var yValue = 0, endpointArray;
                                if (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0)) {
                                    for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                        typeof (widget.charts[charts].chartData[datas].total['social/Yes']) != 'undefined' ? Number(widget.charts[charts].chartData[datas].total['social/Yes']) : 0;
                                        if (keyValuePairs.search('/') > -1) {
                                            endpointArray = keyValuePairs.split('/');
                                            if (endpointArray[1] == 'Yes') {
                                                widget.charts[charts].chartData[datas].total['social/Yes'] = Number(widget.charts[charts].chartData[datas].total[keyValuePairs]);
                                                widget.charts[charts].chartData[datas].total[keyValuePairs] = 0;
                                            }
                                        }
                                    }
                                }
                            }
                            for (items in endpoint) {
                                var currentItem = endpoint[items];
                                formattedChartData = [];
                                var yValue = 0;
                                for (datas in widget.charts[charts].chartData) {
                                    if (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0)) {
                                        for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                            if (keyValuePairs.search('/') > -1) {
                                                endpointArray = keyValuePairs.split('/');
                                                for (var splittedValues in endpointArray) {
                                                    if (endpointArray[splittedValues] == currentItem)
                                                        yValue += parseFloat(widget.charts[charts].chartData[datas].total[keyValuePairs]);
                                                }
                                            }
                                            else if (keyValuePairs == currentItem)
                                                yValue += widget.charts[charts].chartData[datas].total[currentItem];
                                        }
                                    }
                                }
                                formattedChartData.push({
                                    y: Math.round(yValue * 100) / 100
                                });
                                formattedChartDataArray.push(formattedChartData);
                            }
                            widget.charts[charts].chartData = formattedChartDataArray;
                        }
                        else {
                            var yValue = 0;
                            for (datas in widget.charts[charts].chartData) {
                                yValue += parseInt(widget.charts[charts].chartData[datas].total);
                            }
                            formattedChartData.push({
                                y: Math.round(yValue * 100) / 100
                            });
                            widget.charts[charts].chartData = formattedChartData;
                        }
                    }
                    else if (chartType == "instagramPosts") {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var images = 'images';
                                var thumbnail = 'thumbnail';
                                var likes = 'likes';
                                var comments = 'comments'
                                var count = 'count';
                                var caption = 'caption';
                                var post = 'text';
                                var link = 'link';
                                var url = 'url';
                                var formattedChartDataArray = [];
                                for (datas in widget.charts[charts].chartData) {
                                    var formattedChartData = {
                                        date: widget.charts[charts].chartData[datas].date,
                                        image: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[images] != null ?
                                                (widget.charts[charts].chartData[datas].total[images][thumbnail] != null ?
                                                    (typeof widget.charts[charts].chartData[datas].total[images][thumbnail][url] != 'undefined' ? widget.charts[charts].chartData[datas].total[images][thumbnail][url] : '') : '') : '') : ''),

                                        postComment: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[caption] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[caption][post] != 'undefined' ?
                                                    widget.charts[charts].chartData[datas].total[caption][post] : '') : '') : ''),
                                        likes: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[likes] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[likes][count] != 'undefined' ? widget.charts[charts].chartData[datas].total[likes][count] : 0) : 0) : 0),

                                        comments: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[comments] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[comments][count] != 'undefined' ? widget.charts[charts].chartData[datas].total[comments][count] : 0) : 0) : 0),
                                        links: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (typeof widget.charts[charts].chartData[datas].total[link] != 'undefined' ? widget.charts[charts].chartData[datas].total[link] : '') : ''),
                                    };
                                    formattedChartDataArray.push(formattedChartData);
                                }
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                    }
                    else if (chartType == "instagramEngagements") {
                        var subType = widget.charts[charts].chartSubType;
                        if (subType === "instagramPostFrequency" || subType === "instagramPostTypes" || subType === "instagramPostEngagement") {
                            var postFrequency = 0;
                            var likes = 'likes';
                            var comments = 'comments'
                            var postType = [];
                            if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                                for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                                    postFrequency++;
                                    var like = widget.charts[charts].chartData[i].total[likes].count;
                                    var comment = widget.charts[charts].chartData[i].total[comments].count
                                    var engagement = (like + comment)
                                    var key = widget.charts[charts].chartData[i].total.type
                                    postType.push({
                                        "type": key,
                                        "engagement": engagement
                                    })
                                }
                            }
                            var postTypeCount = {};
                            var PostTypeEngagement = {}
                            for (var k = 0; k < postType.length; k++) {
                                if (postTypeCount.hasOwnProperty(postType[k].type)) {
                                    var key = postType[k].type
                                    postTypeCount[key] += 1;
                                } else {
                                    var key = postType[k].type
                                    postTypeCount[key] = 1;
                                }
                                if (PostTypeEngagement.hasOwnProperty(postType[k].type)) {
                                    var keys = postType[k].type
                                    PostTypeEngagement[keys] += postType[k].engagement;
                                } else {
                                    var keys = postType[k].type
                                    PostTypeEngagement[keys] = postType[k].engagement;
                                }
                            }
                        }
                        if (subType === "instagramPostFrequency") {
                            widget.charts[charts].chartData = postFrequency;
                        }
                        else if (subType === "instagramPostEngagement") {
                            widget.charts[charts].chartData = PostTypeEngagement
                        }
                        else if (subType === "instagramPostTypes") {
                            widget.charts[charts].chartData = postTypeCount
                        }
                    }
                    else if (chartType == "highEngagementTweets") {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var likes = 'favorite_count';
                                var reTweet = 'retweet_count'
                                var entities = 'entities';
                                var media = 'media';
                                var post = 'text';
                                var link = 'expanded_url';

                                var formattedChartDataArray = [];
                                for (datas in widget.charts[charts].chartData) {
                                    var formattedChartData = {
                                        date: widget.charts[charts].chartData[datas].date,
                                        likes: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ? (typeof widget.charts[charts].chartData[datas].total[likes] != 'undefined' ? widget.charts[charts].chartData[datas].total[likes] : 0) : 0),
                                        reTweet: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ? (typeof widget.charts[charts].chartData[datas].total[reTweet] != 'undefined' ? widget.charts[charts].chartData[datas].total[reTweet] : 0) : 0),
                                        postComment: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ? (typeof widget.charts[charts].chartData[datas].total[post] != 'undefined' ? widget.charts[charts].chartData[datas].total[post] : 0) : 0),
                                        links: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ? (typeof widget.charts[charts].chartData[datas].total.entities != 'undefined' ? widget.charts[charts].chartData[datas].total.entities : 0) : 0),
                                    };
                                    formattedChartDataArray.push(formattedChartData);
                                }
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                    }
                    else if (chartType == "highestEngagementLinkedIn") {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var likes = 'likes';
                                var clicks = 'clicks';
                                var impressions = 'impressions';
                                var shares = 'shares';
                                var comments = 'comments'
                                var post = 'text';
                                var url = 'url';

                                var formattedChartDataArray = [];
                                for (datas in widget.charts[charts].chartData) {
                                    var formattedChartData = {
                                        date: widget.charts[charts].chartData[datas].date,
                                        link: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[url] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[url] != 'undefined' ? widget.charts[charts].chartData[datas].total[url] : '') : '') : ''),

                                        postComment: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[post] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[post] != 'undefined' ? widget.charts[charts].chartData[datas].total[post] : '') : '') : ''),

                                        impressions: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[impressions] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[impressions] != 'undefined' ? widget.charts[charts].chartData[datas].total[impressions] : 0) : 0) : 0),

                                        shares: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[shares] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[shares] != 'undefined' ?
                                                    widget.charts[charts].chartData[datas].total[shares] : 0) : 0) : 0),
                                        likes: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[likes] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[likes] != 'undefined' ? widget.charts[charts].chartData[datas].total[likes] : 0) : 0) : 0),

                                        comments: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[comments] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[comments] != 'undefined' ? widget.charts[charts].chartData[datas].total[comments] : 0) : 0) : 0),
                                        clicks: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[clicks] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[clicks] != 'undefined' ? widget.charts[charts].chartData[datas].total[clicks] : 0) : 0) : 0),

                                        /*links: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                         (typeof widget.charts[charts].chartData[datas].total[link] != 'undefined' ? widget.charts[charts].chartData[datas].total[link] : '') : ''),*/
                                    };
                                    formattedChartDataArray.push(formattedChartData);
                                }
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                    }
                    else if (chartType == "gaTopPagesByVisit") {
                        var topPages = {};
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    var sampleArray = $.map(widget.charts[charts].chartData[k].total, function (value, index) {
                                        return [value];
                                    });
                                    groupedArray = groupedArray.concat(sampleArray)
                                }
                                var pageTitle = 'pageTitle';

                                var formattedChartDataArray = []
                                var sortdata = _.groupBy(groupedArray, 'pagePath')
                                for (var key in sortdata) {
                                    var path = key;
                                    var sessions = 0;
                                    var pageviews = 0;
                                    var timeOnPage = 0;
                                    var exits = 0;
                                    var bounces = 0;
                                    var page;
                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        sessions += parseFloat(sortdata[key][i].sessions);
                                        pageviews += parseFloat(sortdata[key][i].pageviews);
                                        bounces += parseFloat(sortdata[key][i].bounces);
                                        exits += parseFloat(sortdata[key][i].exits);
                                        timeOnPage += parseFloat(sortdata[key][i].timeOnPage);
                                    }
                                    var bouncedivide = difference(pageviews, exits)

                                    function difference(pageviews, exits) {
                                        return (exits > pageviews) ? exits - pageviews : pageviews - exits
                                    }

                                    if (sessions === 0)
                                        var bouncesRate = bounces;
                                    else
                                        var bouncesRate = ((bounces / sessions) * 100).toFixed(2);

                                    if (bouncedivide === 0)
                                        var avgTimeOnpage = timeOnPage;
                                    else
                                        var avgTimeOnpage = (timeOnPage / bouncedivide);

                                    avgTimeOnpage = Math.ceil(avgTimeOnpage);
                                    var date = new Date(null);
                                    date.setSeconds(avgTimeOnpage); // specify value for SECONDS here
                                    avgTimeOnpage = date.toISOString().substr(11, 8);

                                    var path = {
                                        bouncesRate: bounces,
                                        pagePath: path,
                                        sessions: sessions,
                                        pageTitle: sortdata[key][0][pageTitle],
                                        bouncesRate: bouncesRate,
                                        avgTimeOnpage: avgTimeOnpage,
                                        pageviews: pageviews
                                    }
                                    // var date = new Date(null);
                                    // date.setSeconds(path.avgTimeOnPage)// specify value for SECONDS here
                                    // path.avgTimeOnPage = date.toISOString().substr(11, 8);
                                    formattedChartDataArray.push(path)
                                }
                                formattedChartDataArray.sort(function (a, b) {
                                    return parseFloat(a.pageviews) - parseFloat(b.pageviews);
                                });
                                formattedChartDataArray.reverse();
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                    }
                    else if (chartType == "gaPageContentEfficiencyTable") {
                        var topPages = {};
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    var sampleArray = $.map(widget.charts[charts].chartData[k].total, function (value, index) {
                                        return [value];
                                    });
                                    groupedArray = groupedArray.concat(sampleArray)
                                }
                                var pageTitle = 'pageTitle';

                                var formattedChartDataArray = []
                                var sortdata = _.groupBy(groupedArray, 'pagePath')
                                for (var key in sortdata) {
                                    var path = key;
                                    var uniquePageviews = 0;
                                    var pageviews = 0;
                                    var pageValue = 0;
                                    var bounceRate = 0;
                                    var timeOnPage = 0;
                                    var exits = 0;
                                    var bounces = 0;
                                    var sessions = 0;
                                    var entranceRate = 0;
                                    var calculateBouncerate = 0;
                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        uniquePageviews += parseFloat(sortdata[key][i]['uniquePageviews']);
                                        sessions += parseFloat(sortdata[key][i]['sessions']);
                                        pageviews += parseFloat(sortdata[key][i]['pageviews']);
                                        // avgTimeOnPage += parseFloat(sortdata[key][i]['avgTimeOnPage']);
                                        bounces += parseFloat(sortdata[key][i]['bounces']);
                                        exits += parseFloat(sortdata[key][i]['exits']);
                                        timeOnPage += parseFloat(sortdata[key][i]['timeOnPage']);
                                        calculateBouncerate += (sortdata[key][i]['pageviews'] * sortdata[key][i]['entranceRate'])
                                        pageValue += parseFloat(sortdata[key][i]['pageValue']);
                                        var pageTitle = sortdata[key][i]['pageTitle']

                                    }
                                    var bouncedivide = difference(pageviews, exits)

                                    function difference(pageviews, exits) {
                                        return (exits > pageviews) ? exits - pageviews : pageviews - exits
                                    }

                                    if (sessions === 0)
                                        var bouncesRate = bounces;
                                    else
                                        var bouncesRate = ((bounces / sessions) * 100).toFixed(2);

                                    if (bouncedivide === 0)
                                        var avgTimeOnpage = timeOnPage;
                                    else
                                        var avgTimeOnpage = (timeOnPage / bouncedivide);
                                    entranceRate = calculateBouncerate / pageviews;
                                    var path = {
                                        uniquePageviews: uniquePageviews,
                                        sessions: sessions,
                                        pageviews: pageviews,
                                        pagePath: path,
                                        avgTimeOnPage: avgTimeOnpage,
                                        pageTitle: pageTitle,
                                        entranceRate: entranceRate.toFixed(2),
                                        pageviews: pageviews,
                                        pageValue: pageValue,
                                        bounceRate: bouncesRate
                                    }
                                    var date = new Date(null);
                                    date.setSeconds(path.avgTimeOnPage)// specify value for SECONDS here
                                    path.avgTimeOnPage = date.toISOString().substr(11, 8);
                                    formattedChartDataArray.push(path)
                                }
                                formattedChartDataArray.sort(function (a, b) {
                                    return parseFloat(a.pageviews) - parseFloat(b.pageviews);
                                });
                                formattedChartDataArray.reverse();
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                    }
                    else if (chartType == "gaPageTechnicalEfficiencyTable") {
                        var topPages = {};
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    var sampleArray = $.map(widget.charts[charts].chartData[k].total, function (value, index) {
                                        return [value];
                                    });
                                    groupedArray = groupedArray.concat(sampleArray)
                                }
                                var pageTitle = 'pageTitle';

                                var formattedChartDataArray = []
                                var sortdata = _.groupBy(groupedArray, 'pagePath')
                                for (var key in sortdata) {
                                    var path = key;
                                    var pageviews = 0;
                                    var avgPageLoadTime = 0;
                                    var pageLoadSample = 0;
                                    var bounceRate = 0;
                                    var sessions = 0;
                                    var bounces = 0;
                                    var pageLoadTime = 0;
                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        pageLoadTime += parseFloat(sortdata[key][i]['pageLoadTime']);
                                        sessions += parseFloat(sortdata[key][i]['sessions']);
                                        bounces += parseFloat(sortdata[key][i]['bounces']);
                                        pageviews += parseFloat(sortdata[key][i]['pageviews']);
                                        pageLoadSample += parseFloat(sortdata[key][i]['pageLoadSample']);
                                        bounceRate += parseFloat(sortdata[key][i]['bounceRate']);
                                        ;
                                        var pageTitle = sortdata[key][i]['pageTitle']
                                    }
                                    var avgPageLoadTime = (pageLoadTime / pageLoadSample / 1000).toFixed(2);
                                    if (isNaN(avgPageLoadTime)) {
                                        avgPageLoadTime = 0;
                                    }
                                    if (sessions === 0)
                                        var bouncesRate = bounces;
                                    else
                                        var bouncesRate = ((bounces / sessions) * 100);
                                    avgPageLoadTime = Math.ceil(avgPageLoadTime)
                                    var path = {
                                        pageviews: pageviews,
                                        sessions: sessions,
                                        pagePath: path,
                                        pageTitle: pageTitle,
                                        avgPageLoadTime: avgPageLoadTime.toFixed(2),
                                        pageLoadSample: pageLoadSample,
                                        pageviews: pageviews,
                                        bounceRate: bouncesRate.toFixed(2)
                                    }
                                    formattedChartDataArray.push(path)
                                }
                                formattedChartDataArray.sort(function (a, b) {
                                    return parseFloat(a.pageviews) - parseFloat(b.pageviews);
                                });
                                formattedChartDataArray.reverse();
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                    }
                    else if (chartType == "gaVisitorAcquisitionEfficiencyAnalysisTable") {
                        var topPages = {};
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    var sampleArray = $.map(widget.charts[charts].chartData[k].total, function (value, index) {
                                        return [value];
                                    });
                                    groupedArray = groupedArray.concat(sampleArray)
                                }
                                var formattedChartDataArray = []
                                var sortdata = _.groupBy(groupedArray, 'sourceMedium')
                                for (var key in sortdata) {
                                    var sourceMedium = key;
                                    var sessions = 0;
                                    var users = 0;
                                    var newUsers = 0;
                                    var goalConversionRateAll = 0;
                                    var pageLoadSample = 0;
                                    var goalValuePerSession = 0;

                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        sessions += parseFloat(sortdata[key][i]['sessions']);
                                        users += parseFloat(sortdata[key][i]['users']);
                                        newUsers += parseFloat(sortdata[key][i]['newUsers']);
                                        goalConversionRateAll += parseFloat(sortdata[key][i]['goalConversionRateAll']);
                                        pageLoadSample += parseFloat(sortdata[key][i]['pageLoadSample']);
                                        goalValuePerSession += parseFloat(sortdata[key][i]['goalValuePerSession']);
                                        bounceRate += parseFloat(sortdata[key][i]['bounceRate']);
                                    }
                                    var path = {
                                        sourceMedium: sourceMedium,
                                        sessions: sessions,
                                        users: users,
                                        newUsers: newUsers,
                                        goalValuePerSession: goalValuePerSession,
                                        goalConversionRateAll: goalConversionRateAll.toFixed(2),
                                    }
                                    formattedChartDataArray.push(path)
                                }
                                formattedChartDataArray.sort(function (a, b) {
                                    return parseFloat(a.sessions) - parseFloat(b.sessions);
                                });
                                formattedChartDataArray.reverse();
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                    }
                    else if (chartType == 'pageContentEfficiency') {
                        var topPages = {};
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    var sampleArray = $.map(widget.charts[charts].chartData[k].total, function (value, index) {
                                        return [value];
                                    });
                                    groupedArray = groupedArray.concat(sampleArray)
                                }
                                var pageTitle = 'pageTitle';

                                var formattedChartDataArray = []
                                var sortdata = _.groupBy(groupedArray, 'pagePath')
                                for (var key in sortdata) {
                                    var uniquePageviews = 0;
                                    var pageviews = 0;
                                    var bounces = 0;
                                    var sessions = 0;
                                    var entranceRate = 0;
                                    var calculateBouncerate = 0;
                                    var bouncesRate;
                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        uniquePageviews += parseFloat(sortdata[key][i]['uniquePageviews']);
                                        sessions += parseFloat(sortdata[key][i]['sessions']);
                                        pageviews += parseFloat(sortdata[key][i]['pageviews']);
                                        bounces += parseFloat(sortdata[key][i]['bounces']);
                                        calculateBouncerate += (sortdata[key][i]['pageviews'] * sortdata[key][i]['entranceRate'])
                                        pageTitle = sortdata[key][i]['pageTitle']
                                    }
                                    if (sessions === 0)
                                        bouncesRate = bounces;
                                    else
                                        bouncesRate = ((bounces / sessions) * 100).toFixed(2);
                                    entranceRate = calculateBouncerate / pageviews;
                                    var path = {
                                        bounceRate: bouncesRate,
                                        pageTitle: pageTitle,
                                        uniquePageviews: uniquePageviews.toFixed(2),
                                        pageviews: pageviews,
                                        entranceRate: entranceRate.toFixed(2)
                                    }
                                    formattedChartDataArray.push(path)
                                }
                                formattedChartDataArray.sort(function (a, b) {
                                    return parseFloat(a.uniquePageviews) - parseFloat(b.uniquePageviews);
                                });
                                formattedChartDataArray.reverse();
                                var finalChartArray = [];
                                for (var i = 0; i < 10; i++)
                                    finalChartArray.push(formattedChartDataArray[i]);
                                widget.charts[charts].chartData = finalChartArray;
                            }
                        }
                    }
                    else if (chartType == 'gaSocialMediaOverview') {
                        var topPages = {};
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    var sampleArray = $.map(widget.charts[charts].chartData[k].total, function (value, index) {
                                        return [value];
                                    });
                                    groupedArray = groupedArray.concat(sampleArray)
                                }
                                var formattedChartDataArray = [];
                                if (String(widget.charts[charts].chartName) == 'Time spent on site from various sources')
                                    var sortdata = _.groupBy(groupedArray, 'medium')
                                else
                                    var sortdata = _.groupBy(groupedArray, 'socialNetwork')
                                for (var key in sortdata) {
                                    var socialNetwork = key;
                                    var pageviews = 0;
                                    var sessions = 0;
                                    var exits = 0;
                                    var timeOnPage = 0;
                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        sessions += parseFloat(sortdata[key][i]['sessions']);
                                        pageviews += parseFloat(sortdata[key][i]['pageviews']);
                                        exits += parseFloat(sortdata[key][i]['exits']);
                                        timeOnPage += parseFloat(sortdata[key][i]['timeOnPage'])
                                    }
                                    var pageviewsPersession = pageviews / sessions;
                                    var avgtimeOnPage = timeOnPage / (pageviews - exits);
                                    var path = {
                                        sessions: Number(sessions),
                                        pageviewsPersession: isNaN(pageviewsPersession) ? 0 : pageviewsPersession.toFixed(2),
                                        socialNetwork: socialNetwork,
                                        avgtimeOnPage: isNaN(avgtimeOnPage) ? 0 : avgtimeOnPage.toFixed(2)
                                    }
                                    if (String(widget.charts[charts].chartName) == 'Time spent on site from various sources') {
                                        if (String(path.socialNetwork) == '(none)' || String(path.socialNetwork) == 'organic' || String(path.socialNetwork) == 'referral' || String(path.socialNetwork) == 'ppc' || String(path.socialNetwork) == 'social')
                                            formattedChartDataArray.push(path)
                                    }
                                    else
                                        formattedChartDataArray.push(path);
                                }
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                    }
                    else if (chartType == 'pageTechnicalEfficiency') {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    var sampleArray = $.map(widget.charts[charts].chartData[k].total, function (value, index) {
                                        return [value];
                                    });
                                    groupedArray = groupedArray.concat(sampleArray)
                                }
                                var pageTitle = 'pageTitle';

                                var formattedChartDataArray = []
                                var sortdata = _.groupBy(groupedArray, 'pagePath')
                                for (var key in sortdata) {
                                    var pageviews = 0;
                                    var avgPageLoadTime = 0;
                                    var pageLoadSample = 0;
                                    var bounceRate = 0;
                                    var sessions = 0;
                                    var bounces = 0;
                                    var pageLoadTime = 0;
                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        pageLoadTime += parseFloat(sortdata[key][i]['pageLoadTime']);
                                        sessions += parseFloat(sortdata[key][i]['sessions']);
                                        bounces += parseFloat(sortdata[key][i]['bounces']);
                                        pageviews += parseFloat(sortdata[key][i]['pageviews']);
                                        pageLoadSample += parseFloat(sortdata[key][i]['pageLoadSample']);
                                        var pageTitle = sortdata[key][i]['pageTitle']
                                    }
                                    var avgPageLoadTime = (pageLoadTime / pageLoadSample / 1000).toFixed(2);
                                    if (isNaN(avgPageLoadTime)) {
                                        avgPageLoadTime = 0;
                                    }
                                    if (sessions === 0)
                                        var bouncesRate = bounces;
                                    else
                                        var bouncesRate = ((bounces / sessions) * 100);
                                    avgPageLoadTime = Math.ceil(avgPageLoadTime)
                                    var path = {
                                        bounceRate: bouncesRate.toFixed(2),
                                        pageTitle: pageTitle,
                                        PageLoadTime: avgPageLoadTime.toFixed(2),
                                        pageviews: pageviews
                                    }
                                    formattedChartDataArray.push(path)
                                }
                                formattedChartDataArray.sort(function (a, b) {
                                    return parseFloat(a.pageviews) - parseFloat(b.pageviews);
                                });
                                formattedChartDataArray.reverse();
                                var finalChartArray = [];
                                for (var i = 0; i < 10; i++)
                                    finalChartArray.push(formattedChartDataArray[i]);
                                widget.charts[charts].chartData = finalChartArray;
                            }
                        }
                    }
                    else if (chartType == 'visitorAcquisitionEfficiency') {
                        var topPages = {};
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    var sampleArray = $.map(widget.charts[charts].chartData[k].total, function (value, index) {
                                        return [value];
                                    });
                                    groupedArray = groupedArray.concat(sampleArray)
                                }
                                var formattedChartDataArray = []
                                var sortdata = _.groupBy(groupedArray, 'sourceMedium')
                                for (var key in sortdata) {
                                    var sourceMedium = key;
                                    var sessions = 0;
                                    var users = 0;
                                    var newUsers = 0;
                                    var goalConversionRateAll = 0;
                                    var pageLoadSample = 0;
                                    var goalValuePerSession = 0;

                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        sessions += parseFloat(sortdata[key][i]['sessions']);
                                        newUsers += parseFloat(sortdata[key][i]['newUsers']);
                                        goalConversionRateAll += parseFloat(sortdata[key][i]['goalConversionRateAll']);
                                        pageLoadSample += parseFloat(sortdata[key][i]['pageLoadSample']);
                                        goalValuePerSession += parseFloat(sortdata[key][i]['goalValuePerSession']);
                                    }
                                    var path = {
                                        newUsers: newUsers.toFixed(2),
                                        sourceMedium: sourceMedium,
                                        goalValuePerSession: goalValuePerSession.toFixed(2),
                                        goalConversionRateAll: goalConversionRateAll.toFixed(2),
                                        sessions: sessions
                                    }
                                    formattedChartDataArray.push(path)
                                }
                                formattedChartDataArray.sort(function (a, b) {
                                    return parseFloat(a.sessions) - parseFloat(b.sessions);
                                });
                                formattedChartDataArray.reverse();
                                var finalChartArray = [];
                                for (var i = 0; i < 10; i++)
                                    finalChartArray.push(formattedChartDataArray[i]);
                                widget.charts[charts].chartData = finalChartArray;
                            }
                        }
                    }
                    else if (chartType == "topReferringSites") {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    var sampleArray = $.map(widget.charts[charts].chartData[k].total, function (value, index) {
                                        return [value];
                                    });
                                    groupedArray = groupedArray.concat(sampleArray)
                                }
                                var formattedChartDataArray = []
                                var sortdata = _.groupBy(groupedArray, 'source')
                                for (var key in sortdata) {
                                    var source = key;
                                    var sessions = 0;
                                    var goalConversionRate = 0;
                                    var goalCompletions = 0;

                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        sessions += parseFloat(sortdata[key][i]['sessions']);
                                        goalCompletions += parseFloat(sortdata[key][i]['goalCompletionsAll']);
                                    }
                                    goalConversionRate = sessions / goalCompletions;
                                    var path = {
                                        source: source,
                                        goalCompletions: Number(goalCompletions.toFixed(2)),
                                        goalConversionRate: isNaN(goalConversionRateAll) ? 0 : goalConversionRateAll,
                                        sessions: sessions
                                    }
                                    formattedChartDataArray.push(path)
                                }
                                formattedChartDataArray.sort(function (a, b) {
                                    return parseFloat(a.sessions) - parseFloat(b.sessions);
                                });
                                formattedChartDataArray.reverse();
                                var finalChartArray = [];
                                if (String(widget.charts[charts].chartName) == 'Top referring sites(Table)')
                                    finalChartArray = formattedChartDataArray;
                                else {
                                    for (var i = 0; i < 10; i++)
                                        finalChartArray.push(formattedChartDataArray[i]);
                                }
                                widget.charts[charts].chartData = finalChartArray;
                            }
                        }
                    }
                    else if (chartType == "fbReachByAge") {
                        var ageReach = {
                            '13-17': {
                                'Female': 0,
                                "Male": 0,
                                "Unspecified": 0
                            },
                            '18-24': {
                                'Female': 0,
                                "Male": 0,
                                "Unspecified": 0
                            },
                            '25-34': {
                                'Female': 0,
                                "Male": 0,
                                "Unspecified": 0
                            },
                            '35-44': {
                                'Female': 0,
                                "Male": 0,
                                "Unspecified": 0
                            },
                            '45-54': {
                                'Female': 0,
                                "Male": 0,
                                "Unspecified": 0
                            },
                            '55-64': {
                                'Female': 0,
                                "Male": 0,
                                "Unspecified": 0
                            },
                            '65+': {
                                'Female': 0,
                                "Male": 0,
                                "Unspecified": 0
                            },
                        };
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                for (var datas in widget.charts[charts].chartData) {
                                    for (var keys in widget.charts[charts].chartData[datas].total) {
                                        var genderAge = keys.split('.');
                                        var gender = String(genderAge[0])
                                        var age = String(genderAge[1]);
                                        if (gender == 'F')
                                            gender = 'Female';
                                        if (gender == 'M')
                                            gender = 'Male';
                                        if (gender == 'U')
                                            gender = 'Unspecified';
                                        if (ageReach[age] != undefined) {
                                            ageReach[age] = ageReach[age] || 0;
                                            ageReach[age][gender] += parseInt(widget.charts[charts].chartData[datas].total[keys]);
                                        }

                                    }
                                }
                            }
                            var categories = [];
                            var series = [];
                            for (var key in ageReach) {
                                categories.push(key)
                                var lengthbar = ageReach[key].length;
                            }
                            var name = categories[0];
                            for (var names in ageReach[name]) {
                                var sample = {}
                                sample.name = names;
                                var position = 0;
                                sample.data = [];
                                for (var value in ageReach) {
                                    sample.data[position] = ageReach[value][names];
                                    position++;
                                }
                                series.push(sample)
                            }
                            var finaldata = [ageReach, categories, series]
                        }
                        widget.charts[charts].chartData = finaldata;
                    }
                    else if (chartType == "fbStoreType" || chartType == 'engagementDay') {
                        if (chartType == "fbStoreType") {
                            if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                                if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                    var rearrangedata = []
                                    for (var datas in widget.charts[charts].chartData) {
                                        var total = {
                                            'page post': 0,
                                            'Other': 0
                                        }
                                        var date;
                                        for (var keys in widget.charts[charts].chartData[datas].total) {
                                            if (keys === 'page post') {
                                                total[keys] = widget.charts[charts].chartData[datas].total[keys]
                                            } else
                                                total['Other'] += widget.charts[charts].chartData[datas].total[keys]
                                        }
                                        rearrangedata.push({
                                            date: moment(widget.charts[charts].chartData[datas].date),
                                            total: total
                                        })
                                    }
                                    widget.charts[charts].chartData = rearrangedata;
                                }
                            }
                        }
                        if (chartType == "engagementDay") {
                            var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            var sunValue = {}, monValue = {}, tueValue = {}, wedValue = {}, thuValue = {}, friValue = {}, satValue = {};
                            var valueArray = [sunValue, monValue, tueValue, wedValue, thuValue, friValue, satValue]
                            if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                                for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                                    if (typeof(widget.charts[charts].chartData[i].date) != 'undefined') {
                                        var d = new Date(widget.charts[charts].chartData[i].date)
                                        var dayInNumber = d.getDay()
                                        if (dayInNumber < 7) {
                                            for (var keys in widget.charts[charts].chartData[i].total) {
                                                if (keys === 'comment' || keys === 'like' || keys === 'link') {
                                                    if (!valueArray[dayInNumber].hasOwnProperty(keys)) {
                                                        valueArray[dayInNumber][keys] = 0;
                                                        valueArray[dayInNumber][keys] += widget.charts[charts].chartData[i].total[keys];
                                                    }
                                                    else valueArray[dayInNumber][keys] += widget.charts[charts].chartData[i].total[keys];
                                                }
                                            }
                                        }
                                    }
                                }
                                var rearrangeData = []
                                for (var k = 0; k < days.length; k++) {
                                    rearrangeData.push({
                                        date: days[k],
                                        total: valueArray[k]
                                    })
                                }

                            }
                            widget.charts[charts].chartData = rearrangeData;
                        }
                        if (typeof widget.charts[charts].chartData[0].total == 'object') {
                            var endpoint;
                            for (objectTypes in widget.charts[charts].metricDetails.objectTypes) {
                                if (widget.charts[charts].metricDetails.objectTypes[objectTypes].objectTypeId == widget.charts[charts].chartObjectTypeId) {
                                    if (chartType == 'fbStoreType')
                                        endpoint = ['page post', 'Other']
                                    else
                                        endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint;
                                }
                            }
                            widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpointDisplay;
                            var formattedChartDataArray = [];
                            for (items in endpoint) {
                                var currentItem = endpoint[items];
                                var formattedChartData = [];
                                for (datas in widget.charts[charts].chartData) {
                                    var yValue = 0, endpointArray;
                                    if (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0)) {
                                        for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                            if (keyValuePairs.search('/') > -1) {
                                                endpointArray = keyValuePairs.split('/');
                                                for (var splittedValues in endpointArray) {
                                                    if (endpointArray[splittedValues] == currentItem)
                                                        yValue += parseFloat(widget.charts[charts].chartData[datas].total[keyValuePairs]);
                                                }
                                            }
                                            else if (keyValuePairs == currentItem)
                                                yValue = widget.charts[charts].chartData[datas].total[currentItem];
                                        }
                                    }
                                    if (chartType = "engagementDay") {
                                        formattedChartData.push({
                                            x: widget.charts[charts].chartData[datas].date,
                                            y: yValue
                                        });
                                    } else {
                                        formattedChartData.push({
                                            x: moment(widget.charts[charts].chartData[datas].date),
                                            y: yValue
                                        });
                                    }

                                }
                                formattedChartDataArray.push(formattedChartData);
                            }
                            widget.charts[charts].chartData = formattedChartDataArray;
                        }
                        widget.charts[charts].chartType = 'line'
                    }
                    else if (chartType == "fbReachByCountry") {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    groupedArray.push(widget.charts[charts].chartData[k].total)
                                }
                                var country = {};
                                for (var i = 0; i < groupedArray.length; i++) {
                                    for (var key in groupedArray[i]) {
                                        if (!country.hasOwnProperty(key)) {
                                            country[key] = 0;
                                            country[key] += groupedArray[i][key]
                                        }
                                        else
                                            country[key] += groupedArray[i][key]

                                    }
                                }
                                var sortable = [];
                                for (var countryname in country)
                                    sortable.push([countryname, country[countryname]])
                                sortable.sort(
                                    function (a, b) {
                                        return a[1] - b[1]
                                    }
                                ).reverse()
                                country = {'Others': 0}
                                for (var k = 0; k < sortable.length; k++) {
                                    if (k < 5) {
                                        if (!country.hasOwnProperty(sortable[k][0])) {
                                            country[sortable[k][0]] = 0;
                                            country[sortable[k][0]] = sortable[k][1]
                                        }
                                        else
                                            country[sortable[k][0]] = sortable[k][1]
                                    } else
                                        country.Others += sortable[k][1]
                                }
                            }

                        }
                        widget.charts[charts].chartData = country;
                    }
                    else if (chartType == "fbReachByCity") {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    groupedArray.push(widget.charts[charts].chartData[k].total)
                                }
                                var country = {};
                                for (var i = 0; i < groupedArray.length; i++) {
                                    for (var key in groupedArray[i]) {
                                        var changekey = key.split(',')
                                        var key1 = changekey[0];
                                        if (!country.hasOwnProperty(key)) {
                                            country[key1] = 0;
                                            country[key1] += groupedArray[i][key]
                                        }
                                        else
                                            country[key1] += groupedArray[i][key]

                                    }
                                }
                                var sortable = [];
                                for (var countryname in country)
                                    sortable.push([countryname, country[countryname]])
                                sortable.sort(
                                    function (a, b) {
                                        return a[1] - b[1]
                                    }
                                ).reverse()
                                country = {'Others': 0}
                                for (var k = 0; k < sortable.length; k++) {
                                    if (k < 5) {
                                        if (!country.hasOwnProperty(sortable[k][0])) {
                                            country[sortable[k][0]] = 0;
                                            country[sortable[k][0]] = sortable[k][1]
                                        }
                                        else
                                            country[sortable[k][0]] = sortable[k][1]
                                    } else
                                        country.Others += sortable[k][1]
                                }

                            }

                        }
                        widget.charts[charts].chartData = country;
                    }
                    else if (chartType == "fanSource") {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var fanSources = {
                                    'Others': 0,
                                    'page_profile': 0,
                                    'like_story': 0,
                                    'mobile': 0,
                                    'mobile_ads': 0,
                                    'external_connect': 0,
                                    'recommended_pages': 0
                                }
                                for (var datas in widget.charts[charts].chartData) {
                                    for (var keys in widget.charts[charts].chartData[datas].total) {
                                        if (widget.charts[charts].chartData[datas].total[keys] != 'undefined') {
                                            if (keys === 'page_profile' || keys === 'like_story' || keys === 'mobile' || keys === 'mobile_ads' || keys === 'external_connect' || keys === 'recommended_pages') {
                                                fanSources[keys] += widget.charts[charts].chartData[datas].total[keys];
                                            }
                                            else
                                                fanSources['Others'] += widget.charts[charts].chartData[datas].total[keys];
                                        }
                                    }
                                }
                                var fansourceChange = {
                                    "Page Profile": fanSources['page_profile'],
                                    "Like story ads": fanSources['like_story'],
                                    "Mobile": fanSources['mobile'],
                                    "Mobile ads": fanSources['mobile_ads'],
                                    "External": fanSources['external_connect'],
                                    "Recommended pages": fanSources['recommended_pages'],
                                    " Others": fanSources['Others']
                                }
                                widget.charts[charts].chartData = fansourceChange;
                            }
                        }
                        widget.charts[charts].chartType = 'fbReachByCity'
                    }
                    else if (chartType == "pinterestEngagementRate") {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var likes = 'likes';
                                var comments = 'comments'
                                var repin = 'repins';
                                var post = 'name';
                                var url = 'url';
                                var formattedChartDataArray = [];
                                for (datas in widget.charts[charts].chartData) {
                                    var formattedChartData = {
                                        date: widget.charts[charts].chartData[datas].date,
                                        postComment: (widget.charts[charts].chartData[datas] != null && Object.keys(widget.charts[charts].chartData[datas].length != 0) ?
                                            (widget.charts[charts].chartData[datas][post] != null ?
                                                (typeof widget.charts[charts].chartData[datas][post] != 'undefined' ?
                                                    widget.charts[charts].chartData[datas][post] : '') : '') : ''),
                                        likes: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[likes] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[likes] != 'undefined' ? widget.charts[charts].chartData[datas].total[likes] : 0) : 0) : 0),
                                        repins: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[repin] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[repin] != 'undefined' ? widget.charts[charts].chartData[datas].total[repin] : 0) : 0) : 0),
                                        comments: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[comments] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[comments] != 'undefined' ? widget.charts[charts].chartData[datas].total[comments] : 0) : 0) : 0),
                                        links: (widget.charts[charts].chartData[datas] != null && Object.keys(widget.charts[charts].chartData[datas].length != 0) ?
                                            (typeof widget.charts[charts].chartData[datas][url] != 'undefined' ? widget.charts[charts].chartData[datas][url] : '') : ''),
                                    };
                                    formattedChartDataArray.push(formattedChartData);
                                }
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                    }
                    else if (chartType == "pinterestLeaderboard") {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var collaborators = 'collaborators';
                                var followers = 'followers'
                                var pins = 'pins';
                                var post = 'name';
                                var url = 'url';
                                var formattedChartDataArray = [];
                                for (datas in widget.charts[charts].chartData) {
                                    var formattedChartData = {
                                        date: widget.charts[charts].chartData[datas].date,
                                        postComment: (widget.charts[charts].chartData[datas] != null && Object.keys(widget.charts[charts].chartData[datas].length != 0) ?
                                            (widget.charts[charts].chartData[datas][post] != null ?
                                                (typeof widget.charts[charts].chartData[datas][post] != 'undefined' ?
                                                    widget.charts[charts].chartData[datas][post] : '') : '') : ''),
                                        collaborators: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[collaborators] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[collaborators] != 'undefined' ? widget.charts[charts].chartData[datas].total[collaborators] : 0) : 0) : 0),
                                        pins: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[pins] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[pins] != 'undefined' ? widget.charts[charts].chartData[datas].total[pins] : 0) : 0) : 0),
                                        followers: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total[followers] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[followers] != 'undefined' ? widget.charts[charts].chartData[datas].total[followers] : 0) : 0) : 0),
                                        links: (widget.charts[charts].chartData[datas] != null && Object.keys(widget.charts[charts].chartData[datas].length != 0) ?
                                            (typeof widget.charts[charts].chartData[datas][url] != 'undefined' ? widget.charts[charts].chartData[datas][url] : '') : ''),
                                    };
                                    formattedChartDataArray.push(formattedChartData);
                                }
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                    }
                    else if (chartType == "vimeoTopVideos") {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var likes = "likes";
                                var comments = "comments";
                                var views = "views";

                                var formattedChartDataArray = [];
                                for (datas in widget.charts[charts].chartData) {
                                    var formattedChartData = {
                                        date: widget.charts[charts].chartData[datas].date,
                                        link: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total.link != null ?
                                                (typeof widget.charts[charts].chartData[datas].total.link != 'undefined' ? widget.charts[charts].chartData[datas].total.link : '') : '') : ''),
                                        Comment: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total.metadata.connections.comments.total != null ?
                                                (typeof widget.charts[charts].chartData[datas].total.metadata.connections.comments.total != 'undefined' ? widget.charts[charts].chartData[datas].total.metadata.connections.comments.total : '') : '') : ''),
                                        likes: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total.metadata.connections.likes.total != null ?
                                                (typeof widget.charts[charts].chartData[datas].total.metadata.connections.likes.total != 'undefined' ? widget.charts[charts].chartData[datas].total.metadata.connections.likes.total : 0) : 0) : 0),
                                        views: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total.stats.plays != null ?
                                                (typeof widget.charts[charts].chartData[datas].total.stats.plays != 'undefined' ?
                                                    widget.charts[charts].chartData[datas].total.stats.plays : 0) : 0) : 0),
                                        picture: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total.pictures.sizes[0].link != null ?
                                                (typeof widget.charts[charts].chartData[datas].total.pictures.sizes[0].link != 'undefined' ? widget.charts[charts].chartData[datas].total.pictures.sizes[0].link : 0) : 0) : 0),

                                        title: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                            (widget.charts[charts].chartData[datas].total.name != null ?
                                                (typeof widget.charts[charts].chartData[datas].total.name != 'undefined' ? widget.charts[charts].chartData[datas].total.name : 0) : 0) : 0),

                                        /*links: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                         (typeof widget.charts[charts].chartData[datas].total[link] != 'undefined' ? widget.charts[charts].chartData[datas].total[link] : '') : ''),*/
                                    };
                                    formattedChartDataArray.push(formattedChartData);
                                }
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                    }
                    else if (chartType == "costPerActionType") {
                        var configureEnable = false;
                        var actionType = [];
                        if (!widget.meta) {
                            var formattedChartData = {};
                            configureEnable = true;
                            for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                                for (var keys in widget.charts[charts].chartData[i].total) {
                                    actionType.push(widget.charts[charts].chartData[i].total[keys].action_type);
                                }
                            }
                            var unique = _.uniqBy(actionType);
                            formattedChartData.flag = configureEnable;
                            formattedChartData.action = unique;
                            widget.charts[charts].chartData = formattedChartData;
                        }
                        else {
                            var formattedChartData = [];
                            for (var datas in widget.charts[charts].chartData) {
                                var count = 0;
                                var i;

                                for (i in widget.charts[charts].chartData[datas].total) {
                                    if (widget.charts[charts].chartData[datas].total.hasOwnProperty(i)) {
                                        count++;
                                    }
                                }
                                if (!count) {
                                    formattedChartData.push({
                                        x: moment(widget.charts[charts].chartData[datas].date),
                                        y: 0
                                    });
                                }

                                else {
                                    var repeat = 0;
                                    for (var keys in widget.charts[charts].chartData[datas].total) {
                                        if (widget.meta == widget.charts[charts].chartData[datas].total[keys].action_type) {
                                            repeat = 1;
                                            formattedChartData.push({
                                                x: moment(widget.charts[charts].chartData[datas].date),
                                                y: widget.charts[charts].chartData[datas].total[keys] != null ? widget.charts[charts].chartData[datas].total[keys].value : 0
                                            });
                                        }
                                    }
                                    if (!repeat) {
                                        formattedChartData.push({
                                            x: moment(widget.charts[charts].chartData[datas].date),
                                            y: 0
                                        });
                                    }
                                }
                            }
                            widget.charts[charts].chartData = formattedChartData;
                        }
                    }
                    else if (chartType == "instagramHashtagLeaderBoard") {
                        if (widget.charts[charts].chartData[0] != null) {
                            if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                                if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                    var tag = 'tag';
                                    var comments = 'comments';
                                    var likes = 'likes';
                                    var comments = 'comments'
                                    var likes = 'likes';
                                    var formattedChartDataArray = [];
                                    for (datas in widget.charts[charts].chartData) {
                                        var formattedChartData = {
                                            tagLink: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0) ?
                                                (typeof widget.charts[charts].chartData[datas].total[tag] != 'undefined' ? 'https://www.instagram.com/explore/tags/' + widget.charts[charts].chartData[datas].total[tag] : '') : ''),
                                            tag: (widget.charts[charts].chartData[datas].total != null ?
                                                (widget.charts[charts].chartData[datas].total[tag] != null ?
                                                    (typeof widget.charts[charts].chartData[datas].total[tag] != 'undefined' ? widget.charts[charts].chartData[datas].total[tag] : 0) : 0) : 0),
                                            likes: (widget.charts[charts].chartData[datas].total != null ?
                                                (widget.charts[charts].chartData[datas].total[likes] != null ?
                                                    (typeof widget.charts[charts].chartData[datas].total[likes] != 'undefined' ? widget.charts[charts].chartData[datas].total[likes] : 0) : 0) : 0),

                                            comments: (widget.charts[charts].chartData[datas].total != null ?
                                                (widget.charts[charts].chartData[datas].total[comments] != null ?
                                                    (typeof widget.charts[charts].chartData[datas].total[comments] != 'undefined' ? widget.charts[charts].chartData[datas].total[comments] : 0) : 0) : 0),
                                        };
                                        formattedChartDataArray.push(formattedChartData);
                                    }
                                    widget.charts[charts].chartData = formattedChartDataArray;
                                }
                            }
                        }
                        else widget.charts[charts].chartData = [];
                    }
                    else if (chartType == "gaTopCountriesToSocialVisits" || chartType === 'gaTopCitiesToSocialVisits') {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var groupedArray = [];
                                var formattedChartDataArray = [];
                                var topFiveValues = {};
                                var others = 0;
                                widget.charts[charts].chartData.forEach(function (value) {
                                    for (var index in value.total) {
                                        if (index.indexOf(widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[0] + '/') != -1)
                                            groupedArray.push({
                                                country: index.split(widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[0] + '/').join(''),
                                                value: value.total[index]
                                            })
                                    }
                                })
                                var sortdata = _.groupBy(groupedArray, 'country');
                                for (var key in sortdata) {
                                    var country = key;
                                    var sessions = 0;
                                    for (var i = 0; i < sortdata[key].length; i++)
                                        sessions += parseFloat(sortdata[key][i].value);
                                    var path = {
                                        country: country,
                                        sessions: sessions,
                                    }
                                    formattedChartDataArray.push(path)
                                }
                                var sortCountry = _.sortBy(formattedChartDataArray, 'sessions').reverse();
                                if(sortCountry.length){
                                    for (var k = 0; k < 5; k++)
                                        topFiveValues[sortCountry[k].country] = sortCountry[k].sessions;
                                    for (var j = 5; j < sortCountry.length; j++)
                                        others = others + sortCountry[j].sessions;
                                    topFiveValues['Others'] = others;
                                }

                            }
                        }
                        widget.charts[charts].chartData = topFiveValues;
                    }
                    else if (chartType == "audienceBehaviourbyDay") {
                        var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        widget.charts[charts].chartData[i]
                        var sunValue = {}, monValue = {}, tueValue = {}, wedValue = {}, thuValue = {}, friValue = {}, satValue = {};
                        var valueArray = [sunValue, monValue, tueValue, wedValue, thuValue, friValue, satValue]
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                                if (typeof(widget.charts[charts].chartData[i].date) != 'undefined') {
                                    var d = new Date(widget.charts[charts].chartData[i].date)
                                    var dayInNumber = d.getDay()
                                    if (dayInNumber < 7) {
                                        for (var keys in widget.charts[charts].chartData[i].total[0]) {
                                            if (keys != 'date' && keys != 'dayOfWeek' && keys != 'total') {
                                                if (!valueArray[dayInNumber].hasOwnProperty(keys)) {
                                                    valueArray[dayInNumber][keys] = 0;
                                                    valueArray[dayInNumber][keys] += parseFloat(widget.charts[charts].chartData[i].total[0][keys]);
                                                }
                                                else valueArray[dayInNumber][keys] += parseFloat(widget.charts[charts].chartData[i].total[0][keys]);
                                            }
                                        }
                                        valueArray[dayInNumber]['bounceRate'] = 0
                                        if (valueArray[dayInNumber]['sessions'] === 0) {
                                            valueArray[dayInNumber]['bounceRate'] = valueArray[dayInNumber]['bounces']
                                        } else
                                            valueArray[dayInNumber]['bounceRate'] = valueArray[dayInNumber]['sessions'] / valueArray[dayInNumber]['bounces']
                                    }
                                }
                            }
                        }
                        var rearrangeData = []
                        for (var k = 0; k < days.length; k++) {
                            rearrangeData.push({
                                date: days[k],
                                total: valueArray[k]
                            })
                        }
                        widget.charts[charts].chartData = rearrangeData;
                    }
                    else if (chartType === "audienceBehaviourByTimeofday") {
                        if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                            var groupedArray = []
                            for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                var sampleArray = $.map(widget.charts[charts].chartData[k].total, function (value, index) {
                                    return [value];
                                });
                                groupedArray = groupedArray.concat(sampleArray)
                            }

                            var date = [];
                            var formattedChartDataArray = []
                            var sortdata = _.groupBy(groupedArray, 'hour')
                            for (var key in sortdata) {
                                var hour = key;
                                var pageviews = 0;
                                var bounces = 0;
                                var sessions = 0;
                                var pageviewsPerSession = 0;
                                var percentNewSessions = 0;
                                for (var i = 0; i < sortdata[key].length; i++) {
                                    sessions += parseFloat(sortdata[key][i]['sessions']);
                                    pageviews += parseFloat(sortdata[key][i]['pageviews']);
                                    bounces += parseFloat(sortdata[key][i]['bounces']);
                                    pageviewsPerSession += parseFloat(sortdata[key][i]['pageviewsPerSession']);
                                    percentNewSessions += parseFloat(sortdata[key][i]['percentNewSessions']);
                                }
                                if (sessions === 0)
                                    var bounceRate = bounces;
                                else
                                    var bounceRate = ((bounces / sessions) * 100).toFixed(2);
                                var hour = {
                                    hour: hour,
                                    sessions: sessions,
                                    bounceRate: bounceRate,
                                    pageviews: pageviews,
                                    pageviewsPerSession: pageviewsPerSession,
                                    percentNewSessions: percentNewSessions,
                                }
                                formattedChartDataArray.push(hour)
                            }
                            var sortArray = [];
                            formattedChartDataArray.sort(function (a, b) {
                                return parseFloat(a.hour) - parseFloat(b.hour);
                            });


                            for (var k = 0; k < formattedChartDataArray.length; k++) {
                                sortArray.push({
                                    date: formattedChartDataArray[k]['hour'],
                                    total: formattedChartDataArray[k]
                                })
                            }
                            widget.charts[charts].chartType = 'audienceBehaviourbyDay';
                            widget.charts[charts].chartData = sortArray;
                        }
                    }
                    else if (chartType === "socialContributionToSiteTraffic") {
                        if (typeof widget.charts[charts].chartData[0].total == 'object') {
                            var endpoint;
                            for (objectTypes in widget.charts[charts].metricDetails.objectTypes) {
                                if (widget.charts[charts].metricDetails.objectTypes[objectTypes].objectTypeId == widget.charts[charts].chartObjectTypeId) {
                                    endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint;
                                    widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpointDisplay != undefined ? widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpointDisplay : widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint
                                }
                            }
                            var formattedChartDataArray = [];
                            if (endpoint.length != 0) {
                                for (items in endpoint) {
                                    var currentItem = endpoint[items];
                                    var formattedChartData = [];
                                    for (datas in widget.charts[charts].chartData) {
                                        var yValue = 0, endpointArray;
                                        if (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0)) {
                                            for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                                if (keyValuePairs.search('/') > -1) {
                                                    endpointArray = keyValuePairs.split('/');
                                                    for (var splittedValues in endpointArray) {
                                                        if (endpointArray[splittedValues] == currentItem)
                                                            yValue += parseFloat(widget.charts[charts].chartData[datas].total[keyValuePairs]);
                                                    }
                                                }
                                                else if (keyValuePairs == currentItem)
                                                    yValue = widget.charts[charts].chartData[datas].total[currentItem];
                                            }
                                        }
                                        formattedChartData.push({
                                            x: moment(widget.charts[charts].chartData[datas].date),
                                            y: yValue
                                        });
                                    }
                                    formattedChartDataArray.push(formattedChartData);
                                }
                            }
                            else {
                                var formattedChartData = [];
                                for (datas in widget.charts[charts].chartData) {
                                    var yValue = 0, xValue, endpointArray;
                                    var total = widget.charts[charts].chartData[datas].total
                                    if (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total).length != 0) {
                                        for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                            if (keyValuePairs.search('/') > -1) {
                                                endpointArray = keyValuePairs.split('/');
                                                for (var splittedValues in endpointArray) {
                                                    yValue += parseFloat(widget.charts[charts].chartData[datas].total[keyValuePairs]);
                                                    xValue = keyValuePairs;
                                                }
                                            }
                                            else
                                                yValue = widget.charts[charts].chartData[datas].total[currentItem];
                                            xValue = keyValuePairs;
                                        }
                                        formattedChartData.push({
                                            x: xValue,
                                            y: yValue
                                        });
                                    }
                                }
                                formattedChartDataArray.push(formattedChartData);
                            }
                            widget.charts[charts].chartData = formattedChartData;
                            widget.charts[charts].metricCode = widget.charts[charts].metricDetails.code
                            widget.charts[charts].metricName = widget.charts[charts].metricDetails.name
                        }
                        else {
                            var formattedChartData = [];
                            for (var datas in widget.charts[charts].chartData) {
                                formattedChartData.push({
                                    x: moment(widget.charts[charts].chartData[datas].date),
                                    y: widget.charts[charts].chartData[datas].total != null ? widget.charts[charts].chartData[datas].total : 0
                                });
                            }
                            widget.charts[charts].chartData = formattedChartData;
                            widget.charts[charts].metricCode = widget.charts[charts].metricDetails.code
                            widget.charts[charts].metricName = widget.charts[charts].metricDetails.name
                        }
                    }
                    else if (chartType === "percentageArea") {
                        for(var i=0;i<widget.charts[charts].chartData.length;i++){
                            if (typeof widget.charts[charts].chartData[i].total == 'object') {
                                var endpoint;
                                for (objectTypes in widget.charts[charts].metricDetails.objectTypes) {
                                    if (widget.charts[charts].metricDetails.objectTypes[objectTypes].objectTypeId == widget.charts[charts].chartObjectTypeId) {
                                        endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint;
                                        widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpointDisplay != undefined ? widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpointDisplay : widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint
                                    }
                                }
                                var formattedChartDataArray = [];
                                if (endpoint.length != 0) {
                                    for (items in endpoint) {
                                        var currentItem = endpoint[items];
                                        var formattedChartData = [];
                                        for (datas in widget.charts[charts].chartData) {
                                            var yValue = 0, endpointArray;
                                            if (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0)) {
                                                for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                                    if (keyValuePairs.search('/') > -1) {
                                                        endpointArray = keyValuePairs.split('/');
                                                        for (var splittedValues in endpointArray) {
                                                            if (endpointArray[splittedValues] == currentItem)
                                                                yValue += parseFloat(widget.charts[charts].chartData[datas].total[keyValuePairs]);
                                                        }
                                                    }
                                                    else if (keyValuePairs == currentItem)
                                                        yValue = widget.charts[charts].chartData[datas].total[keyValuePairs];
                                                }
                                            }
                                            formattedChartData.push({
                                                x: moment(widget.charts[charts].chartData[datas].date),
                                                y: yValue
                                            });
                                        }
                                        formattedChartDataArray.push(formattedChartData);
                                    }
                                }
                                else {
                                    var formattedChartData = [];
                                    for (datas in widget.charts[charts].chartData) {
                                        var yValue = [], xValue, endpointArray;
                                        var total = widget.charts[charts].chartData[datas].total
                                        if (widget.charts[charts].chartData[datas].total != null && widget.charts[charts].chartData[datas].total!=0 && Object.keys(widget.charts[charts].chartData[datas].total).length != 0) {
                                            for (var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                                if (keyValuePairs.search('/') > -1) {
                                                    endpointArray = keyValuePairs.split('/');
                                                    for (var splittedValues in endpointArray) {
                                                        yValue = widget.charts[charts].chartData[datas].total[keyValuePairs];
                                                        xValue = keyValuePairs;
                                                    }
                                                }
                                                else {
                                                    yValue = widget.charts[charts].chartData[datas].total[keyValuePairs];
                                                }
                                                xValue = moment(widget.charts[charts].chartData[datas].date);
                                            }
                                            formattedChartData.push({
                                                x: xValue,
                                                y: yValue
                                            });
                                        }
                                    }
                                    formattedChartDataArray.push(formattedChartData);
                                }
                                widget.charts[charts].chartData = formattedChartData;
                                widget.charts[charts].metricCode = widget.charts[charts].metricDetails.code
                                widget.charts[charts].metricName = widget.charts[charts].metricDetails.name
                            }

                        }
                    }
                    else if (chartType === "stackbar") {
                        if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                            var data = [{"(none)": 0, "organic": 0, 'paid': 0, "others": 0, "social": 0, "ppc": 0}];
                            for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                for (keys in widget.charts[charts].chartData[k].total) {
                                    if (keys != '(none)' && keys != 'organic' && keys != 'ppc' && keys != 'social') {
                                        data[0] ['others'] += parseFloat(widget.charts[charts].chartData[k].total[keys])
                                    } else {
                                        data[0] [keys] += parseFloat(widget.charts[charts].chartData[k].total[keys]);
                                    }
                                }
                            }
                            var series = [];
                            series.push({
                                date: widget.charts[charts].chartName,
                                total: data
                            })
                        }
                        widget.charts[charts].chartData = series;

                    }
                    else if (chartType === "gaUsers") {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            var finalData = {};
                            if (typeof widget.charts[charts].chartData!= 'string') {
                                for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                                    var key = widget.charts[charts].chartData[i][0]
                                    finalData[key] = widget.charts[charts].chartData[i][1]
                                }
                            }
                            widget.charts[charts].chartData = finalData;
                        }
                    }
                    else if (chartType === 'youtubeVideosOverview'){
                        var videosArray = [];
                        for (var key = 0; key < widget.charts[charts].chartData.length; key++) {
                            if (typeof widget.charts[charts].chartData[key] != 'undefined') {
                                if (typeof(widget.charts[charts].chartData[key]) === 'object') {
                                    var name = 0;
                                    var views = 0;
                                    var comments = 0;
                                    var likes = 0;
                                    var disLikes = 0;
                                    var shares = 0;
                                    var tweetObject = {
                                        name: widget.charts[charts].chartData[key].title,
                                        views:widget.charts[charts].chartData[key].viewCount,
                                        comments:widget.charts[charts].chartData[key].commentCount,
                                        likes:widget.charts[charts].chartData[key].likeCount,
                                        dislikes:widget.charts[charts].chartData[key].dislikeCount,
                                        shares:widget.charts[charts].chartData[key].favoriteCount,
                                        //url: widget.charts[charts].chartData[key].total.media != undefined ? widget.charts[charts].chartData[key].total.media[0].expanded_url : 'https://twitter.com/' + userMentionDetail[user].screen_name
                                        //url:widget.charts[charts].chartData[key].total.media[0].expanded_url
                                    }
                                    videosArray.push(tweetObject);
                                }
                            }
                        }
                        widget.charts[charts].chartData = videosArray;
                    }
                    else if (chartType === "twitterEngagements") {
                        if (String(widget.charts[charts].chartSubType) === "activityByDayOfTheWeek") {
                            if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                                var splitArray=[];
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++){
                                    if(typeof widget.charts[charts].chartData[k].total ==='object') {
                                        widget.charts[charts].chartData[k].total.created_at = new Date(widget.charts[charts].chartData[k].total.created_at).getDay();
                                        splitArray.push(widget.charts[charts].chartData[k].total);
                                    }
                                }
                                var sortdata = _.groupBy(splitArray, 'created_at');
                                var formattedChartDataArray = []
                                for (var key in sortdata) {
                                    var likes = 0;
                                    var reTweets = 0;
                                    var engagement = 0;
                                    var day = key;
                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        likes += parseFloat(sortdata[key][i]['favorite_count']);
                                        reTweets += parseFloat(sortdata[key][i]['retweet_count']);
                                    }
                                    engagement = likes + reTweets;
                                    var tweets = i;
                                    var path = {
                                        day: day,
                                        tweets: tweets,
                                        engagement: engagement,
                                    }
                                    formattedChartDataArray.push(path)
                                }
                                formattedChartDataArray.sort(function (a, b) {
                                    return parseFloat(a.day) - parseFloat(b.day);
                                });
                                for( var key in formattedChartDataArray){
                                    if(formattedChartDataArray[key].day === '0')
                                        formattedChartDataArray[key].day='Sunday'
                                    if(formattedChartDataArray[key].day === '1')
                                        formattedChartDataArray[key].day='Monday'
                                    if(formattedChartDataArray[key].day === '2')
                                        formattedChartDataArray[key].day='Tuesday'
                                    if(formattedChartDataArray[key].day === '3')
                                        formattedChartDataArray[key].day='Wednesday'
                                    if(formattedChartDataArray[key].day === '4')
                                        formattedChartDataArray[key].day='Thursday'
                                    if(formattedChartDataArray[key].day === '5')
                                        formattedChartDataArray[key].day='Friday'
                                    if(formattedChartDataArray[key].day === '6')
                                        formattedChartDataArray[key].day='Saturday'
                                }
                                widget.charts[charts].chartData=formattedChartDataArray
                            }
                        }
                        else if (String(widget.charts[charts].chartSubType) === "activityByTimeOfTheDay") {
                            var daysArray=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
                            if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                                var splitArray = [];
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    if (typeof widget.charts[charts].chartData[k].total === 'object') {
                                        var date = widget.charts[charts].chartData[k].total.created_at;
                                        widget.charts[charts].chartData[k].total.day = daysArray[new Date(date).getDay()]
                                        splitArray.push(widget.charts[charts].chartData[k].total);
                                    }
                                }
                                var sortdata = _.groupBy(splitArray, 'day');
                                var formattedChartDataArray = []
                                for (var key in sortdata) {
                                    var day = key;
                                    var tempArray = [];
                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        tempArray.push({
                                            time: new Date(sortdata[key][i]['created_at']).getHours(),
                                            likes: sortdata[key][i]['favorite_count'],
                                            reTweets: sortdata[key][i]['retweet_count']
                                        })
                                    }
                                    var sortTime = _.groupBy(tempArray, 'time');
                                    for (var data in sortTime) {
                                        var likes = 0;
                                        var reTweets = 0;
                                        var engagement = 0;
                                        var time = data;
                                        for (var j = 0; j < sortTime[data].length; j++) {
                                            likes += parseFloat(sortTime[data][j]['likes']);
                                            reTweets += parseFloat(sortTime[data][j]['reTweets']);
                                        }
                                        engagement = likes + reTweets;
                                        var path = {
                                            day: day,
                                            time: time,
                                            engagement: engagement,
                                        }
                                        formattedChartDataArray.push(path)
                                    }
                                }
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                        else if (String(widget.charts[charts].chartSubType) === 'engagementByUsersTalkedAbout') {
                            var formattedChartDataArray = [];
                            var wholeTweetsArray = [];
                            for (var key = 0; key < widget.charts[charts].chartData.length; key++) {
                                if (typeof widget.charts[charts].chartData[key] != 'undefined') {
                                    if (typeof(widget.charts[charts].chartData[key].total) === 'object') {
                                        var likes = 0;
                                        var reTweets = 0;
                                        var engagement = 0;
                                        var tweetsArray = [];
                                        var day = key;
                                        //for (var i = 0; i < widget.charts[charts].chartData[key].length; i++) {
                                        likes = parseFloat(widget.charts[charts].chartData[key].total['favorite_count']);
                                        reTweets = parseFloat(widget.charts[charts].chartData[key].total['retweet_count']);
                                        engagement = likes + reTweets;
                                        var userMentionedLength = widget.charts[charts].chartData[key].total.entities != undefined ? widget.charts[charts].chartData[key].total.entities != undefined ? widget.charts[charts].chartData[key].total.entities.user_mentions.length : 0 : 0;
                                        var userMentionDetail = widget.charts[charts].chartData[key].total.entities != undefined ? widget.charts[charts].chartData[key].total.entities != undefined ? widget.charts[charts].chartData[key].total.entities.user_mentions : 0 : 0;
                                        for (var user = 0; user < userMentionedLength; user++) {
                                            var tweetObject = {
                                                tweet: widget.charts[charts].chartData[key].total.text,
                                                engagement: engagement,
                                                userMentionedScreenName: userMentionDetail[user].screen_name,
                                                userMentionedName: userMentionDetail[user].name,
                                                url: widget.charts[charts].chartData[key].total.media != undefined ? widget.charts[charts].chartData[key].total.media[0].expanded_url : 'https://twitter.com/' + userMentionDetail[user].screen_name
                                                //url:widget.charts[charts].chartData[key].total.media[0].expanded_url
                                            }
                                            tweetsArray.push(tweetObject);
                                        }
                                        for (var k = 0; k < tweetsArray.length; k++) {
                                            wholeTweetsArray.push(tweetsArray[k])
                                        }
                                    }

                                }
                            }
                            var groupedArray=[];
                            var sortArray = _.groupBy(wholeTweetsArray, 'userMentionedScreenName')
                            for (var keys in sortArray) {
                                var engagement = 0;
                                for (var m = 0; m < sortArray[keys].length; m++) {
                                    engagement += sortArray[keys][m].engagement;
                                }
                                groupedArray.push({
                                    userMentionedScreenName: keys,
                                    engagement: engagement,
                                })
                            }
                            groupedArray.sort(function (a, b) {
                                return parseFloat(a.engagement) - parseFloat(b.engagement);
                            });
                            groupedArray.reverse();
                            widget.charts[charts].chartData = groupedArray;
                        }
                        else if (widget.charts[charts].chartSubType == "topLinks") {
                            if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                                var likes = 'favorite_count';
                                var reTweet = 'retweet_count'
                                var entities = 'entities';
                                var urlsArray = [];
                                if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                    for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                                        if (typeof widget.charts[charts].chartData[i].total.entities != 'undefined') {
                                            for (var k = 0; k < widget.charts[charts].chartData[i].total.entities.urls.length; k++) {
                                                var like = widget.charts[charts].chartData[i].total[likes]
                                                var reTweets = widget.charts[charts].chartData[i].total[reTweet]
                                                var engagement = like + reTweets;
                                                var url = {
                                                    url: widget.charts[charts].chartData[i].total.entities.urls[k].url,
                                                    displayurl: widget.charts[charts].chartData[i].total.entities.urls[k].expanded_url,
                                                    engagement: engagement
                                                }
                                                urlsArray.push(url)
                                            }
                                        }
                                    }
                                }
                                var sortdata = _.groupBy(urlsArray, 'displayurl')
                                var groupedArray = [];
                                for (var keys in sortdata) {
                                    var engagement = 0;
                                    for (var m = 0; m < sortdata[keys].length; m++) {
                                        engagement += sortdata[keys][m].engagement;
                                    }
                                    groupedArray.push({
                                        url: keys,
                                        engagement: engagement,
                                    })
                                }
                                groupedArray.sort(function (a, b) {
                                    return parseFloat(a.engagement) - parseFloat(b.engagement);
                                });
                                groupedArray.reverse();
                                widget.charts[charts].chartData = groupedArray;
                            }
                        }
                        else if (String(widget.charts[charts].chartSubType) === "instagramActivityByDayOfTheWeek") {
                            if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                                var splitArray=[];
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++){
                                    if(typeof widget.charts[charts].chartData[k].total ==='object') {
                                        widget.charts[charts].chartData[k].total.created_time =moment.unix(widget.charts[charts].chartData[k].total.created_time).format('YYYY-MM-DD');
                                        widget.charts[charts].chartData[k].total.created_time = new Date(widget.charts[charts].chartData[k].total.created_time).getDay();
                                        splitArray.push(widget.charts[charts].chartData[k].total);
                                    }
                                }
                                var sortdata = _.groupBy(splitArray, 'created_time');
                                var formattedChartDataArray = []
                                for (var key in sortdata) {
                                    var likes = 0;
                                    var comments = 0;
                                    var engagement = 0;
                                    var day = key;
                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        likes += parseFloat(sortdata[key][i]['likes']['count']);
                                        comments += parseFloat(sortdata[key][i]['comments']['count']);
                                    }
                                    engagement = likes + comments;
                                    var posts = i;
                                    var path = {
                                        day: day,
                                        tweets: posts,
                                        engagement: engagement,
                                    }
                                    formattedChartDataArray.push(path)
                                }
                                formattedChartDataArray.sort(function (a, b) {
                                    return parseFloat(a.day) - parseFloat(b.day);
                                });
                                for( var key in formattedChartDataArray){
                                    if(formattedChartDataArray[key].day === '0')
                                        formattedChartDataArray[key].day='Sunday'
                                    if(formattedChartDataArray[key].day === '1')
                                        formattedChartDataArray[key].day='Monday'
                                    if(formattedChartDataArray[key].day === '2')
                                        formattedChartDataArray[key].day='Tuesday'
                                    if(formattedChartDataArray[key].day === '3')
                                        formattedChartDataArray[key].day='Wednesday'
                                    if(formattedChartDataArray[key].day === '4')
                                        formattedChartDataArray[key].day='Thursday'
                                    if(formattedChartDataArray[key].day === '5')
                                        formattedChartDataArray[key].day='Friday'
                                    if(formattedChartDataArray[key].day === '6')
                                        formattedChartDataArray[key].day='Saturday'
                                }
                                widget.charts[charts].chartData=formattedChartDataArray
                            }
                        }
                        else if (String(widget.charts[charts].chartSubType) === "instagramActivityByTimeOfTheDay") {
                            if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                                var splitArray = [];
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    if (typeof widget.charts[charts].chartData[k].total === 'object') {
                                        var date = widget.charts[charts].chartData[k].total.created_time;
                                        widget.charts[charts].chartData[k].total.day = moment.unix(date).format('dddd');
                                        splitArray.push(widget.charts[charts].chartData[k].total);
                                    }
                                }
                                var sortdata = _.groupBy(splitArray, 'day');
                                var formattedChartDataArray = []
                                for (var key in sortdata) {
                                    var day = key;
                                    var tempArray = [];
                                    for (var i = 0; i < sortdata[key].length; i++) {
                                        var temp = moment.unix(sortdata[key][i]['created_time']);
                                        tempArray.push({
                                            time: new Date(temp).getHours(),
                                            likes: sortdata[key][i]['likes']['count'],
                                            comments: sortdata[key][i]['comments']['count']
                                        })
                                    }
                                    var sortTime = _.groupBy(tempArray, 'time');
                                    for (var data in sortTime) {
                                        var likes = 0;
                                        var comments = 0;
                                        var engagement = 0;
                                        var time = data;
                                        for (var j = 0; j < sortTime[data].length; j++) {
                                            likes += parseFloat(sortTime[data][j]['likes']);
                                            comments += parseFloat(sortTime[data][j]['comments']);
                                        }
                                        engagement = likes + comments;
                                        var path = {
                                            day: day,
                                            time: time,
                                            engagement: engagement,
                                        }
                                        formattedChartDataArray.push(path)
                                    }
                                }
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                        else if (String(widget.charts[charts].chartSubType) === "commentsAndLikes") {
                            if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                                var formattedChartDataArray = []
                                for (var k = 0; k < widget.charts[charts].chartData.length; k++) {
                                    if (typeof widget.charts[charts].chartData[k].total === 'object') {
                                        formattedChartDataArray.push({
                                            x: widget.charts[charts].chartData[k].date,
                                            y: parseFloat(widget.charts[charts].chartData[k].total['likes']['count']) + parseFloat(widget.charts[charts].chartData[k].total['comments']['count']),
                                            link: widget.charts[charts].chartData[k].total['link']
                                        })
                                    }
                                }
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
                        else if (widget.charts[charts].chartSubType == "hashTag") {
                            if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                                var likes = 'favorite_count';
                                var reTweet = 'retweet_count'
                                var entities = 'entities';
                                var urlsArray = [];
                                if (typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                    for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                                        if (typeof widget.charts[charts].chartData[i].total.entities != 'undefined') {
                                            for (var k = 0; k < widget.charts[charts].chartData[i].total.entities.hashtags.length; k++) {
                                                var like = widget.charts[charts].chartData[i].total[likes]
                                                var reTweets = widget.charts[charts].chartData[i].total[reTweet]
                                                var engagement = like + reTweets;
                                                var url = {
                                                    hashTag: widget.charts[charts].chartData[i].total.entities.hashtags[k].text,
                                                    engagement: engagement
                                                }
                                                urlsArray.push(url)
                                            }
                                        }
                                    }
                                }
                                var sortdata = _.groupBy(urlsArray, 'hashTag')
                                var groupedArray = [];
                                for (var keys in sortdata) {
                                    var engagement = 0;
                                    for (var m = 0; m < sortdata[keys].length; m++) {
                                        engagement += sortdata[keys][m].engagement;
                                    }
                                    groupedArray.push({
                                        text: keys,
                                        engagement: engagement,
                                    })
                                }
                                groupedArray.sort(function (a, b) {
                                    return parseFloat(a.engagement) - parseFloat(b.engagement);
                                });
                                groupedArray.reverse();
                                widget.charts[charts].chartData = groupedArray;
                            }
                        }
                        else console.log('error')
                    }
                    else if (chartType === "campaignOverview"){
                        if (widget.charts[charts].chartData[0] != 'undefined') {
                            formattedChartDataArray=[];
                            var campaignArray=[]
                            for(var k=0;k<widget.charts[charts].chartData.length;k++){
                                for(var keys in widget.charts[charts].chartData[k].total){
                                    campaignArray.push(widget.charts[charts].chartData[k].total[keys])
                                }
                            }

                            var uniqueCampaign=_.groupBy(campaignArray,'Campaign ID')
                            for (var key in uniqueCampaign) {
                                var campaignId = key;
                                var Campaign = 'Campaign';
                                var status ='Campaign state';
                                var Clicks = 0;
                                var Conversions = 0;
                                var Cost = 0;
                                var Currency = 'Currency';
                                var startDate='Start date';
                                var endDate='End date';
                                var Impressions = 0;
                                var ImpressionsReach='Unique cookies';
                                var Budget='Budget'
                                var ImpressionReachValue;
                                for (var i = 0; i < uniqueCampaign[key].length; i++) {
                                    Cost += parseFloat(uniqueCampaign[key][i].Cost);
                                    Currency = uniqueCampaign[key][i][Currency];
                                    Impressions+=parseFloat(uniqueCampaign[key][i].Impressions)
                                    ImpressionReachValue=uniqueCampaign[key][i]['Unique cookies']
                                    Clicks+=parseFloat(uniqueCampaign[key][i].Clicks)
                                    Conversions+=parseFloat(uniqueCampaign[key][i].Conversions)
                                }
                                if (Cost  === 0)
                                    var Cost  = Cost ;
                                else
                                    var Cost = (Cost  /  1000000).toFixed(2);
                                if (Cost  === 0)
                                    var CPM  = Cost ;
                                else
                                    var CPM = ((Cost  / Impressions) * 1000).toFixed(2);
                                if (Clicks  === 0)
                                    var CTR   = Clicks ;
                                else
                                    var CTR  = ((Clicks  / Impressions) * 100).toFixed(2);

                                if (Cost  === 0)
                                    var CPC    = Cost ;
                                else
                                    var CPC   = (Cost  / Clicks).toFixed(2);
                                if (Cost  === 0 )
                                    var CostPerConv  = Cost ;
                                else
                                    var CostPerConv   = ((Cost  / Conversions)*100).toFixed(2);
                                var sourec = {
                                    Id: campaignId,
                                    Name: uniqueCampaign[key][0][Campaign],
                                    status: uniqueCampaign[key][0][status],
                                    Currency: uniqueCampaign[key][0]['Currency'],
                                    startDate: uniqueCampaign[key][0][startDate],
                                    endDate: uniqueCampaign[key][0][endDate],
                                    Budget: uniqueCampaign[key][0][Budget]/1000000,
                                    Impressions: Impressions,
                                    CPM: CPM==='Infinity'?0:CPM,
                                    CTR: CTR==='Infinity'?0:CTR,
                                    CPC: CPC==='Infinity'?0:CPC,
                                    CostPerConv: CostPerConv==='Infinity'?0:CostPerConv,
                                    Spent: Cost,
                                    Conversions: Conversions,
                                    Clicks: Clicks,
                                    ImpressionReachValue:ImpressionReachValue
                                }
                                // var date = new Date(null);
                                // date.setSeconds(path.avgTimeOnPage)// specify value for SECONDS here
                                // path.avgTimeOnPage = date.toISOString().substr(11, 8);
                                formattedChartDataArray.push(sourec)
                            }
                        }
                        widget.charts[charts].chartData=formattedChartDataArray
                    }
                    else if (chartType === "adgroupOverview"){
                        if (widget.charts[charts].chartData[0] != 'undefined') {
                            formattedChartDataArray=[];
                            var adGroupArray=[]

                            for(var k=0;k<widget.charts[charts].chartData.length;k++){
                                for(var keys in widget.charts[charts].chartData[k].total){
                                    adGroupArray.push(widget.charts[charts].chartData[k].total[keys])
                                }
                            }

                            var uniqueCampaign=_.groupBy(adGroupArray,'Ad group ID')
                            for (var key in uniqueCampaign) {
                                var adGroupId = key;
                                var adGroup = 'Ad group';
                                var status ='Ad group state';
                                var Clicks = 0;
                                var Conversions = 0;
                                var Cost = 0;
                                var Currency = 'Currency';
                                var Totalconvvalue = 0;
                                var Impressions = 0;
                                for (var i = 0; i < uniqueCampaign[key].length; i++) {
                                    Cost += parseFloat(uniqueCampaign[key][i].Cost);
                                    Currency = uniqueCampaign[key][i][Currency];
                                    Impressions+=parseFloat(uniqueCampaign[key][i].Impressions)
                                    Totalconvvalue+=parseFloat(uniqueCampaign[key][i]['Totalconvvalue'])
                                    Clicks+=parseFloat(uniqueCampaign[key][i].Clicks)
                                    Conversions+=parseFloat(uniqueCampaign[key][i].Conversions)
                                }
                                if (Cost  === 0)
                                    var Cost  = Cost ;
                                else
                                    var Cost = (Cost  /  1000000).toFixed(2);
                                if (Cost  === 0)
                                    var CPM  = Cost ;
                                else
                                    var CPM = ((Cost  / Impressions) * 1000).toFixed(2);
                                if (Clicks  === 0)
                                    var CTR   = Clicks ;
                                else
                                    var CTR  = ((Clicks  / Impressions) * 100).toFixed(2);

                                if (Cost  === 0)
                                    var CPC    = Cost ;
                                else
                                    var CPC   = (Cost  / Clicks).toFixed(2);
                                if (Cost  === 0 )
                                    var CostPerConv  = Cost ;
                                else
                                    var CostPerConv   = ((Cost  / Conversions) * 100).toFixed(2);
                                var sourec = {
                                    Id: adGroupId,
                                    Name: uniqueCampaign[key][0][adGroup],
                                    status: uniqueCampaign[key][0][status],
                                    Currency: uniqueCampaign[key][0]['Currency'],
                                    Impressions: Impressions,
                                    CPM: CPM==='Infinity'?0:CPM,
                                    CTR: CTR==='Infinity'?0:CTR,
                                    CPC: CPC==='Infinity'?0:CPC,
                                    CostPerConv: CostPerConv==='Infinity'?0:CostPerConv,
                                    Spent: Cost,
                                    Conversions: Conversions,
                                    Totalconvvalue: Totalconvvalue,
                                    Clicks: Clicks,
                                    CPMCBid:uniqueCampaign[key][0]['MaxCPM']===" --"?0:parseFloat(uniqueCampaign[key][0]['MaxCPM'])/1000000,
                                    CPCBid:uniqueCampaign[key][0]['MaxCPC']===" --" ?0:parseFloat(uniqueCampaign[key][0]['MaxCPC'])/1000000,
                                    CPVBid:uniqueCampaign[key][0]['MaxCPV'] ===" --"?0:parseFloat(uniqueCampaign[key][0]['MaxCPV'])/1000000,
                                }
                                // var date = new Date(null);
                                // date.setSeconds(path.avgTimeOnPage)// specify value for SECONDS here
                                // path.avgTimeOnPage = date.toISOString().substr(11, 8);
                                formattedChartDataArray.push(sourec)
                            }
                        }
                        widget.charts[charts].chartData=formattedChartDataArray
                    }
                    else if (chartType === "adOverview"){
                        if (widget.charts[charts].chartData[0] != 'undefined') {
                            formattedChartDataArray=[];
                            var adGroupArray=[]
                            for(var k=0;k<widget.charts[charts].chartData.length;k++){
                                for(var keys in widget.charts[charts].chartData[k].total){
                                    adGroupArray.push(widget.charts[charts].chartData[k].total[keys])
                                }
                            }
                            var unqieAd=_.groupBy(adGroupArray,'Ad ID')
                            for (var key in unqieAd) {
                                var adId = key;
                                var ad = 'Business Name';
                                var type ='Ad type';
                                var clickType='Click type'
                                var Clicks = 0;
                                var Conversions = 0;
                                var Cost = 0;
                                var Totalconvvalue = 0;
                                var Currency = 'Currency';
                                var Impressions = 0;
                                for (var i = 0; i < unqieAd[key].length; i++) {
                                    Cost += parseFloat(unqieAd[key][i].Cost);
                                    Currency = unqieAd[key][i][Currency];
                                    Impressions+=parseFloat(unqieAd[key][i]['Impressions'])
                                    Totalconvvalue+=parseFloat(unqieAd[key][i]['Totalconvvalue'])
                                    Clicks+=parseFloat(unqieAd[key][i].Clicks)
                                    Conversions+=parseFloat(unqieAd[key][i].Conversions)
                                }
                                if (Cost  === 0)
                                    var Cost  = Cost ;
                                else
                                    var Cost = (Cost/1000000).toFixed(2);
                                if (Cost  === 0)
                                    var CPM  = Cost ;
                                else
                                    var CPM = ((Cost  / Impressions) * 1000).toFixed(2);
                                if (Clicks  === 0)
                                    var CTR   = Clicks ;
                                else
                                    var CTR  = ((Clicks  / Impressions) * 100).toFixed(2);

                                if (Cost  === 0)
                                    var CPC    = Cost ;
                                else
                                    var CPC   = (Cost  / Clicks).toFixed(2);
                                if (Conversions  === 0 )
                                    var ConversionRate  = Conversions ;
                                else
                                    var ConversionRate   = ((Conversions  / Clicks)*100).toFixed(2);
                                var sourec = {
                                    Id: adId,
                                    Name: unqieAd[key][0][ad],
                                    type: unqieAd[key][0][type],
                                    Currency: unqieAd[key][0]['Currency'],
                                    clickType: unqieAd[key][0]['Click type'],
                                    Impressions: Impressions,
                                    CPM: CPM==='Infinity'?0:CPM,
                                    CTR: CTR==='Infinity'?0:CTR,
                                    CPC: CPC==='Infinity'?0:CPC,
                                    Totalconvvalue:Totalconvvalue,
                                    Spent: Cost,
                                    Conversions: Conversions,
                                    ConversionRate:ConversionRate==='Infinity'?0:ConversionRate,
                                    Clicks: Clicks,

                                }
                                // var date = new Date(null);
                                // date.setSeconds(path.avgTimeOnPage)// specify value for SECONDS here
                                // path.avgTimeOnPage = date.toISOString().substr(11, 8);
                                formattedChartDataArray.push(sourec)
                            }
                        }
                        widget.charts[charts].chartData=formattedChartDataArray
                    }
                    else if (chartType === "adwordsDemography"){
                        var subType=widget.charts[charts].chartSubType;
                        if (widget.charts[charts].chartData[0] != 'undefined') {
                            formattedChartDataArray=[];
                            var campaignArray=[]
                            for(var k=0;k<widget.charts[charts].chartData.length;k++){
                                for(var keys in widget.charts[charts].chartData[k].total){
                                    campaignArray.push(widget.charts[charts].chartData[k].total[keys])
                                }
                            }
                            if(subType === "pieAge" ||subType === "tableAge")
                                var uniqueCampaign=_.groupBy(campaignArray,'Age Range')
                            else if(subType === "pieGender" ||subType === "tableGender")
                                var uniqueCampaign=_.groupBy(campaignArray,'Gender')
                            else if(subType === "pieDevice" ||subType === "tableDevice")
                                var uniqueCampaign=_.groupBy(campaignArray,'Device')
                            for (var key in uniqueCampaign) {
                                var age = key;
                                var Clicks = 0;
                                var Conversions = 0;
                                var Cost = 0;
                                var Currency = 'Currency';
                                var Impressions = 0;
                                var Totalconvvalue = 0;
                                for (var i = 0; i < uniqueCampaign[key].length; i++) {
                                    Cost += parseFloat(uniqueCampaign[key][i].Cost);
                                    Impressions+=parseFloat(uniqueCampaign[key][i].Impressions)
                                    Clicks+=parseFloat(uniqueCampaign[key][i].Clicks)
                                    Conversions+=parseFloat(uniqueCampaign[key][i].Conversions)
                                    Totalconvvalue+=parseFloat(uniqueCampaign[key][i]['Totalconvvalue'])
                                }
                                if (Cost  === 0)
                                    var Cost  = Cost ;
                                else
                                    var Cost = (Cost  /  1000000).toFixed(2);
                                if (Cost  === 0)
                                    var CPM  = Cost ;
                                else
                                    var CPM = ((Cost  / Impressions) * 1000).toFixed(2);
                                if (Clicks  === 0)
                                    var CTR   = Clicks ;
                                else
                                    var CTR  = ((Clicks  / Impressions) * 100).toFixed(2);

                                if (Cost  === 0)
                                    var CPC    = Cost ;
                                else
                                    var CPC   = (Cost  / Clicks).toFixed(2);
                                if (Conversions  === 0 )
                                    var conversionRate  = Conversions ;
                                else
                                    var conversionRate   = ((Conversions  / Clicks)*100).toFixed(2);
                                var sourec = {
                                    Currency: uniqueCampaign[key][0]['Currency'],
                                    age:age,
                                    Impressions: Impressions,
                                    CPM: CPM==='Infinity'?0:CPM,
                                    CTR: CTR==='Infinity'?0:CTR,
                                    CPC: CPC==='Infinity'?0:CPC,
                                    conversionRate: conversionRate==='Infinity'?0:conversionRate,
                                    Spent: Cost,
                                    Conversions: Conversions,
                                    Clicks: Clicks,
                                    Totalconvvalue:Totalconvvalue
                                }
                                // var date = new Date(null);
                                // date.setSeconds(path.avgTimeOnPage)// specify value for SECONDS here
                                // path.avgTimeOnPage = date.toISOString().substr(11, 8);
                                formattedChartDataArray.push(sourec)
                            }
                        }
                        if(subType === "pieAge"||subType === "pieGender"||subType==='pieDevice'){
                            var Impression={}
                            for(var i=0;i<formattedChartDataArray.length;i++){
                                var keyword=formattedChartDataArray[i]['age'];
                                Impression[keyword]=formattedChartDataArray[i]['Impressions']
                            }
                            formattedChartDataArray=Impression;
                        }
                        widget.charts[charts].chartData=formattedChartDataArray
                    }

                }
                for (var charts in widget.charts) {
                    if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                        if (widget.charts[charts].chartData[0].x) {
                            for (var datas in widget.charts[charts].chartData) {
                                summaryValueinChart += parseFloat(widget.charts[charts].chartData[datas].y)
                                if (parseFloat(summaryValueinChart) > 0 && parseFloat(summaryValueinChart) != 0)
                                    ++totalNonZeroPoints;
                            }
                        }
                        else {
                            for (var items in widget.charts[charts].chartData)
                                for (var datas in widget.charts[charts].chartData[items]) {
                                    if(typeof widget.charts[charts].chartData[items][datas] != 'undefined'){
                                        summaryValueinChart += parseFloat(widget.charts[charts].chartData[items][datas].y);
                                        if (Number(summaryValueinChart) > 0 && Number(summaryValueinChart) != 0)
                                            ++totalNonZeroPoints;
                                    }

                                }
                        }

                    }
                }

                for (var charts in widget.charts) {
                    var chartType = widget.charts[charts].chartType;
                    var subType=widget.charts[charts].chartSubType;
                    if (chartType == "line" || chartType == "bar" || chartType == "column" || chartType == "stackcolumn" || chartType == "area" || chartType == "pie" || chartType == 'reachVsImpressions' || chartType == "engagedUsersReach" || chartType == 'mozoverview' || chartType == "trafficSourcesBrkdwnLine" || chartType == 'bounceRateArea' || chartType == 'negativeBar' || chartType == "trafficSourcesBrkdwnPie" || chartType == "costPerThosuandImpressions" || chartType == "clickThroughRate" || chartType == "costPerConversion" || chartType == "ConversionRate" || chartType == "costPerClick"|| ((chartType == "costPerActionType") && (widget.meta != undefined))) {
                        if (typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if (widget.charts[charts].chartData[0].x) {
                                var summaryValue = 0;
                                var nonZeroPoints = 0;
                                var n = widget.charts[charts].chartData.length;
                                var currentWeek = 0;
                                var pastWeek = 0;
                                var granularity;
                                var impCur = 0;
                                var reaCur = 0;
                                var impPas = 0;
                                var reaPas = 0;
                                if (widget.charts[charts].chartData.length >= 14) {
                                    var count = 0;
                                    for (var i = n - 1; i >= 0; i--) {
                                        if (count === 0 || count < 7) {
                                            if ((chartType == 'reachVsImpressions' || chartType == "engagedUsersReach") && (widget.charts[charts].chartData[i].imp && widget.charts[charts].chartData[i].rea)) {
                                                impCur += parseFloat(widget.charts[charts].chartData[i].imp);
                                                reaCur += parseFloat(widget.charts[charts].chartData[i].rea);
                                            }
                                            else
                                                currentWeek += parseFloat(widget.charts[charts].chartData[i].y);
                                        }
                                        else if (count >= 7 && count < 14) {
                                            if ((chartType == 'reachVsImpressions' || chartType == "engagedUsersReach") && (widget.charts[charts].chartData[i].imp && widget.charts[charts].chartData[i].rea)) {
                                                impPas += parseFloat(widget.charts[charts].chartData[i].imp);
                                                reaPas += parseFloat(widget.charts[charts].chartData[i].rea);
                                            }
                                            else
                                                pastWeek += parseFloat(widget.charts[charts].chartData[i].y);
                                        }

                                        count++;
                                    }
                                    if ((widget.charts[charts].chartName == 'Total Impressions' || widget.charts[charts].chartName == 'Engaged Users') && (chartType == 'reachVsImpressions' || chartType == "engagedUsersReach")) {
                                        currentWeek = isNaN(impCur / reaCur) ? 0 : impCur / reaCur;
                                        pastWeek = isNaN(impPas / reaPas) ? 0 : impPas / reaPas;
                                    }
                                    granularity = 'WK';
                                }
                                else {
                                    if (typeof widget.charts[charts].chartData[0].x !== 'object') {
                                        var check = isValidDate(widget.charts[charts].chartData[0].x)
                                        if (check) {
                                            var lastIndex = _.last(widget.charts[charts].chartData);
                                            var subtractDate = moment(lastIndex.x).subtract(1, "days").format('YYYY-DD-MM');
                                            if ((widget.charts[charts].chartName == 'Total Impressions' || widget.charts[charts].chartName == 'Engaged Users') && (chartType == 'reachVsImpressions' || chartType == "engagedUsersReach"))
                                                currentWeek = isNaN(parseFloat(lastIndex.imp) / parseFloat(lastIndex.rea)) ? 0 : parseFloat(lastIndex.imp) / parseFloat(lastIndex.rea);
                                            else
                                                currentWeek = parseFloat(lastIndex.y);
                                            for (var i = n - 1; i >= 0; i--) {
                                                var dateFormatChange = moment(widget.charts[charts].chartData[i].x).format('YYYY-DD-MM');
                                                if (subtractDate === dateFormatChange) {
                                                    if ((widget.charts[charts].chartName == 'Total Impressions' || widget.charts[charts].chartName == 'Engaged Users') && (chartType == 'reachVsImpressions' || chartType == "engagedUsersReach"))
                                                        pastWeek = isNaN(parseFloat(widget.charts[charts].chartData[i].imp) / parseFloat(widget.charts[charts].chartData[i].rea)) ? 0 : parseFloat(widget.charts[charts].chartData[i].imp) / parseFloat(widget.charts[charts].chartData[i].rea);
                                                    else
                                                        pastWeek = parseFloat(widget.charts[charts].chartData[i].y);
                                                }
                                            }
                                            granularity = 'Day';
                                        }

                                    } else {
                                        var lastIndex = _.last(widget.charts[charts].chartData);
                                        var subtractDate = moment(lastIndex.x).subtract(1, "days").format('YYYY-DD-MM');
                                        currentWeek = parseFloat(lastIndex.y);
                                        for (var i = n - 1; i >= 0; i--) {
                                            var dateFormatChange = moment(widget.charts[charts].chartData[i].x).format('YYYY-DD-MM');
                                            if (subtractDate === dateFormatChange)
                                                pastWeek = parseFloat(widget.charts[charts].chartData[i].y);
                                        }
                                        granularity = 'Day';
                                    }
                                }
                                var comparingData, percentage, minus;
                                if (currentWeek > pastWeek) {
                                    comparingData = 'up';
                                    minus = currentWeek - pastWeek;
                                    if (pastWeek > 0)
                                        percentage = parseFloat(minus / pastWeek * 100).toFixed(2);
                                    else
                                        percentage = currentWeek;
                                }
                                else if (currentWeek < pastWeek) {
                                    comparingData = 'down';
                                    minus = pastWeek - currentWeek;
                                    if (pastWeek > 0)
                                        percentage = parseFloat(minus / pastWeek * 100).toFixed(2);
                                    else
                                        percentage = 0;
                                }
                                else {
                                    minus = pastWeek - currentWeek;
                                    percentage = 0;
                                }
                                var totalImp = 0;
                                var totalRea = 0;
                                for (var datas in widget.charts[charts].chartData) {
                                    if ((chartType == 'reachVsImpressions' || chartType == "engagedUsersReach") && (widget.charts[charts].chartData[datas].imp && widget.charts[charts].chartData[datas].rea)) {
                                        totalImp += parseFloat(widget.charts[charts].chartData[datas].imp);
                                        totalRea += parseFloat(widget.charts[charts].chartData[datas].rea);
                                    }
                                    else{
                                        if(isNaN(widget.charts[charts].chartData[datas].y)){
                                            widget.charts[charts].chartData[datas].y=0
                                        }
                                        summaryValue += parseFloat(widget.charts[charts].chartData[datas].y);
                                    }

                                    if (parseFloat(widget.charts[charts].chartData[datas].y) > 0)
                                        nonZeroPoints++;
                                }
                                if ((widget.charts[charts].chartName == 'Total Impressions' || widget.charts[charts].chartName == 'Engaged Users') && (chartType == 'reachVsImpressions' || chartType == "engagedUsersReach")) {
                                    summaryValue = isNaN(totalImp / totalRea) ? 0 : (totalImp / totalRea) * 100;
                                }
                                if (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType != 'undefined') {
                                    if (widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType == 'avg') {
                                        if (nonZeroPoints == 0 && summaryValue == 0) summaryValue = 0;
                                        else summaryValue = parseFloat(summaryValue / nonZeroPoints).toFixed(2);
                                    }
                                    else if (widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType == 'snapshot') {
                                        var latestDate = '';
                                        for (var data in widget.charts[charts].chartData) {
                                            if (latestDate < moment(widget.charts[charts].chartData[data].x)) {
                                                latestDate = moment(widget.charts[charts].chartData[data].x);
                                                summaryValue = widget.charts[charts].chartData[data].y;
                                            }
                                        }
                                    }
                                }
                                if (chartType == 'bounceRateArea') {
                                    var bounce = 0;
                                    var sessions = 0;
                                    for (var datas in widget.charts[charts].chartData) {
                                        bounce += parseFloat(widget.charts[charts].chartData[datas].bounces)
                                        sessions += parseFloat(widget.charts[charts].chartData[datas].sessions)
                                    }
                                    summaryValue = (bounce / sessions) * 100;
                                }
                                if (chartType == 'costPerClick' || chartType == 'costPerThosuandImpressions' || chartType == "clickThroughRate" || chartType == "ConversionRate" || chartType == "costPerConversion") {
                                    var dividend = 0;
                                    var divisor = 0;
                                    for (var datas in widget.charts[charts].chartData) {
                                        dividend += parseFloat(widget.charts[charts].chartData[datas].dividend)
                                        divisor += parseFloat(widget.charts[charts].chartData[datas].divisor)
                                    }
                                    if(dividend ===0)
                                        summaryValue=dividend
                                    else
                                    {
                                        if(chartType == 'costPerThosuandImpressions')
                                            summaryValue = dividend / divisor *1000
                                        else if(chartType == "clickThroughRate" || chartType == "ConversionRate" || chartType == "costPerConversion" )
                                            summaryValue = (dividend  / divisor * 100).toFixed(2)==='Infinity'?0:(dividend  / divisor * 100).toFixed(2)
                                        else
                                            summaryValue = dividend / divisor ;
                                    }

                                }
                                if (chartType == 'line' || chartType == 'bar' || chartType == 'column' || chartType == 'mozoverview') {
                                    if ((widget.channelName == 'FacebookAds') && (widget.charts[charts].metricDetails.name == 'Cost Per Unique Action Type')) {
                                        widgetCharts.push({
                                            'type': widget.charts[charts].chartType,
                                            'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                            'key': widget.charts[charts].chartName, //key  - the name of the series.
                                            'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                            'summaryDisplay': (parseFloat(summaryValue).toFixed(2) % Math.floor(parseFloat(summaryValue).toFixed(2))) > 0 ? parseFloat(summaryValue).toFixed(2) : parseFloat(summaryValue).toFixed(2) > 1 ? parseInt(summaryValue) : parseFloat(summaryValue) > 0 ? parseFloat(summaryValue).toFixed(2) : parseInt(summaryValue),
                                        });
                                    }
                                    else if ((chartType == 'bar' || chartType == 'column') && totalNonZeroPoints < 0 && summaryValue == 0) {
                                        widgetCharts.push({
                                            'type': 'line',
                                            'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                            'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                            'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                            'arrow': comparingData,
                                            'variance': percentage,
                                            'period': granularity,
                                            'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                        });
                                    }
                                    else {
                                        widgetCharts.push({
                                            "subChartType": widget.charts[charts].subChartType,
                                            'type': widget.charts[charts].chartType,
                                            'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                            'key': widget.charts[charts].chartSubType === 'fbTopReferringDomain' ? undefined : widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                            'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                            'arrow': comparingData,
                                            'variance': percentage,
                                            'period': granularity,
                                            'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                        });
                                    }
                                }
                                else if (chartType == 'area' || chartType == 'Reach Vs Impressions' || chartType == "EngagedUsersReach" || chartType == 'negativeBar') {
                                    if ((chartType == 'negativeBar')) {
                                        var negativArray = []
                                        for (var values in widget.charts[charts].chartData) {
                                            negativArray.push(
                                                {
                                                    'x': widget.charts[charts].chartData[values].x,
                                                    'y': -Math.abs(widget.charts[charts].chartData[values].y)
                                                }
                                            )
                                        }
                                        widget.charts[charts].chartType = 'area';
                                        widgetCharts.push({
                                            'type': 'area',
                                            'values': negativArray,      //values - represents the array of {x,y} data points
                                            'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                            'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                            'arrow': comparingData,
                                            'variance': percentage,
                                            'period': granularity,
                                            'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                            'area': true
                                        });

                                    }
                                    else {
                                        widgetCharts.push({
                                            'type': widget.charts[charts].chartType,
                                            'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                            'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                            'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                            'arrow': comparingData,
                                            'variance': percentage,
                                            'period': granularity,
                                            'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                        });
                                    }
                                }
                                else if (chartType == 'area' || chartType == 'reachVsImpressions' || chartType == "engagedUsersReach") {
                                    var summary = Math.round(summaryValue * 100) / 100
                                    widgetCharts.push({
                                        'type': widget.charts[charts].chartType,
                                        'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                        'key': widget.charts[charts].metricDetails.name == 'Total Impressions' ? 'Impressions/Reach (%)' : widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                        'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                        'arrow': comparingData,
                                        'variance': percentage,
                                        'period': granularity,
                                        'summaryDisplay': widget.charts[charts].metricDetails.name == 'Total Impressions' || widget.charts[charts].metricDetails.name == 'Engaged users/Reach (%)' ? summary + '%' : summary,
                                        'area': true
                                    });
                                }
                                else if (chartType == 'bounceRateArea') {
                                    widget.charts[charts].chartType = 'area';
                                    widgetCharts.push({
                                        'type': widget.charts[charts].chartType,
                                        'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                        'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                        'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                        'arrow': comparingData,
                                        'variance': percentage,
                                        'period': granularity,
                                        'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                    });
                                }
                                else if (chartType == 'costPerClick' ||chartType == 'costPerThosuandImpressions' || chartType == "clickThroughRate" || chartType == "ConversionRate" || chartType == "costPerConversion") {
                                    widget.charts[charts].chartType = 'area';
                                    widgetCharts.push({
                                        'type': widget.charts[charts].chartType,
                                        'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                        'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                        'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                        'arrow': comparingData,
                                        'variance': percentage,
                                        'period': granularity,
                                        'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                    });
                                }
                                else if (chartType == 'costPerActionType') {
                                    widgetCharts.push({
                                        'type': 'line',
                                        'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                        'key': widget.meta.replace('_', ' '), //key  - the name of the series.
                                        'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                        'arrow': comparingData,
                                        'variance': percentage,
                                        'period': granularity,
                                        'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                    });
                                }
                                else if (chartType == 'trafficSourcesBrkdwnLine') {
                                    widgetCharts.push({
                                        'type': 'line',
                                        'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                        'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                        'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                        'arrow': comparingData,
                                        'variance': percentage,
                                        'period': granularity,
                                        'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                    });
                                }
                                else if (chartType == 'trafficSourcesBrkdwnPie') {
                                    widgetCharts.push({
                                        'name':widget.charts[charts].chartName,
                                        'type': 'pie',
                                        'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                        'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                        'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                        'arrow': comparingData,
                                        'variance': percentage,
                                        'period': granularity,
                                        'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                    });
                                }
                                else if (chartType == "percentageArea") {
                                    widgetCharts.push({
                                        'type': widget.charts[charts].chartType,
                                        'metricCode': widget.charts[charts].metricCode,
                                        'metricName': widget.charts[charts].metricName,
                                        'key': widget.charts[charts].metricName,
                                        'values': widget.charts[charts].chartData,
                                        'color': widget.charts[charts].chartColour,
                                        'arrow': comparingData,
                                        'variance': percentage,
                                        'period': granularity,
                                        'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                    });
                                }
                                else {
                                    widgetCharts.push({
                                        'name':widget.charts[charts].chartName,
                                        'type': widget.charts[charts].chartType,
                                        'y': parseFloat(summaryValue),      //values - represents the array of {x,y} data points
                                        'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                        'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                        'arrow': comparingData,
                                        'period': granularity,
                                        'variance': percentage,
                                        'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                    });
                                }
                            }
                            else {
                                for (var items in widget.charts[charts].chartData) {
                                    var summaryValue = 0;
                                    var nonZeroPoints = 0;
                                    var n = widget.charts[charts].chartData[items].length;
                                    var currentWeek = 0;
                                    var pastWeek = 0;
                                    var granularity;
                                    if (widget.charts[charts].chartData[items].length >= 14) {
                                        var count = 0;
                                        for (var i = n - 1; i >= 0; i--) {
                                            if (count === 0 || count < 7)
                                                currentWeek += parseFloat(widget.charts[charts].chartData[items][i].y);
                                            else if (count >= 7 && count < 14)
                                                pastWeek += parseFloat(widget.charts[charts].chartData[items][i].y);
                                            count++;
                                        }
                                        granularity = 'WK';
                                    }
                                    else {
                                        if (widget.charts[charts].chartData[items].length > 0) {
                                            var lenthOfData = widget.charts[charts].chartData[items].length;
                                            var lastIndex = _.last(widget.charts[charts].chartData[items]);
                                            if (typeof lastIndex.x != 'string') {
                                                var subtractDate = moment(lastIndex.x).subtract(1, "days").format('YYYY-DD-MM');
                                                currentWeek = parseFloat(lastIndex.y);
                                            }
                                            else {
                                                currentWeek = parseFloat(widget.charts[charts].chartData[items][lenthOfData - 1].y);
                                            }

                                            for (var i = n - 1; i >= 0; i--) {
                                                if (typeof lastIndex.x != 'string') {
                                                    var dateFormatChange = moment(widget.charts[charts].chartData[items][i].x).format('YYYY-DD-MM');
                                                    if (subtractDate === dateFormatChange)
                                                        pastWeek = parseFloat(widget.charts[charts].chartData[items][i].y);
                                                }
                                                else {
                                                    pastWeek = parseFloat(widget.charts[charts].chartData[items][lenthOfData - 2].y);
                                                }
                                            }
                                            granularity = 'Day';
                                        }
                                    }
                                    var comparingData, minus, percentage;
                                    if (currentWeek > pastWeek) {
                                        comparingData = 'up';
                                        minus = currentWeek - pastWeek;
                                        if (pastWeek > 0)
                                            percentage = parseFloat(minus / pastWeek * 100).toFixed(2);
                                        else
                                            percentage = currentWeek;
                                    }
                                    else if (currentWeek < pastWeek) {
                                        comparingData = 'down';
                                        minus = pastWeek - currentWeek;
                                        if (pastWeek > 0)
                                            percentage = parseFloat(minus / pastWeek * 100).toFixed(2);
                                        else
                                            percentage = 0;
                                    }
                                    else {
                                        var minus = pastWeek - currentWeek;
                                        var percentage = 0;
                                    }

                                    for (var datas in widget.charts[charts].chartData[items]) {
                                        summaryValue += parseFloat(widget.charts[charts].chartData[items][datas].y);
                                        if (parseFloat(widget.charts[charts].chartData[items][datas].y != 0))
                                            nonZeroPoints++;
                                        if (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType != 'undefined') {
                                            if (widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType == 'avg') {
                                                if (nonZeroPoints == 0 && summaryValue == 0) summaryValue = 0;
                                                else summaryValue = parseFloat(summaryValue / nonZeroPoints).toFixed(2);
                                            }
                                            else if (widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType == 'snapshot') {
                                                var latestDate = '';
                                                for (var data in widget.charts[charts].chartData[items]) {
                                                    if (latestDate < moment(widget.charts[charts].chartData[items][data].x)) {
                                                        latestDate = moment(widget.charts[charts].chartData[items][data].x);
                                                        summaryValue = widget.charts[charts].chartData[items][data].y;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (chartType == 'line' || chartType == 'bar' || chartType == 'column' || chartType == 'mozoverview' || chartType == 'stackcolumn') {
                                        if ((chartType == 'bar' || chartType == 'column') && totalNonZeroPoints < 0 && summaryValue == 0) {
                                            widgetCharts.push({
                                                'type': 'line',
                                                'values': widget.charts[charts].chartData[items],      //values - represents the array of {x,y} data points
                                                'key': widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint,
                                                'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                                'arrow': comparingData,
                                                'variance': percentage,
                                                'period': granularity,
                                                'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                            });
                                        }
                                        else
                                            widgetCharts.push({
                                                'type': widget.charts[charts].chartType,
                                                'values': widget.charts[charts].chartData[items],      //values - represents the array of {x,y} data points
                                                'key': typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined' ? (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined' ? widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]) : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items],
                                                'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[items] != 'undefined' ? widget.charts[charts].chartColour[items] : '') : '',  //color - optional: choose your own line color.
                                                'arrow': comparingData,
                                                'variance': percentage,
                                                'period': granularity,
                                                'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                            });
                                    }
                                    else if (chartType == 'trafficSourcesBrkdwnLine') {
                                        widgetCharts.push({
                                            'type': 'line',
                                            'values': widget.charts[charts].chartData[items],      //values - represents the array of {x,y} data points
                                            'key': typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined' ? (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined' ? widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]) : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items],
                                            'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[items] != 'undefined' ? widget.charts[charts].chartColour[items] : '') : '',  //color - optional: choose your own line color.
                                            'arrow': comparingData,
                                            'variance': percentage,
                                            'period': granularity,
                                            'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                        });
                                    }
                                    else if (chartType == 'trafficSourcesBrkdwnPie') {
                                        widgetCharts.push({
                                            'name':widget.charts[charts].chartName,
                                            'type': 'pie',
                                            'y': parseFloat(summaryValue),       //values - represents the array of {x,y} data points
                                            'key': typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined' ? (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined' ? widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]) : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items],
                                            'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[items] != 'undefined' ? widget.charts[charts].chartColour[items] : '') : '',  //color - optional: choose your own line color.
                                            'arrow': comparingData,
                                            'variance': percentage,
                                            'period': granularity,
                                            'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                        });
                                    }
                                    else if (chartType == 'area' || chartType == 'negativebar') {
                                        widgetCharts.push({
                                            'type': widget.charts[charts].chartType,
                                            'values': widget.charts[charts].chartData[items],      //values - represents the array of {x,y} data points
                                            'key': typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined' ? (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined' ? widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]) : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items],
                                            'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[items] != 'undefined' ? widget.charts[charts].chartColour[items] : '') : '',  //color - optional: choose your own line color.
                                            'arrow': comparingData,
                                            'variance': percentage,
                                            'period': granularity,
                                            'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                            'area': true
                                        });
                                    }
                                    else if (chartType == 'costPerActionType') {
                                        widgetCharts.push({
                                            'type': 'line',
                                            'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                            'key': widget.meta, //key  - the name of the series.
                                            'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                            'arrow': comparingData,
                                            'variance': percentage,
                                            'period': granularity,
                                            'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                        });
                                    }
                                    else {
                                        widgetCharts.push({
                                            'name':widget.charts[charts].chartName,
                                            'type': widget.charts[charts].chartType,
                                            'y': parseFloat(summaryValue),      //values - represents the array of {x,y} data points
                                            'key': typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined' ? (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined' ? widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] : (widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]).replace(/\_/g," ")) : (widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]).replace(/\_/g," "),
                                            'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[items] != 'undefined' ? widget.charts[charts].chartColour[items] : '') : '',  //color - optional: choose your own line color.
                                            'arrow': comparingData,
                                            'variance': percentage,
                                            'period': granularity,
                                            'summaryDisplay': Math.round(summaryValue * 100) / 100,
                                        });
                                    }
                                }
                            }
                        }
                    }
                    else if (chartType == 'instagramPosts') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == 'stackbar') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == 'highEngagementTweets') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == 'highestEngagementLinkedIn') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == 'vimeoTopVideos') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == 'gaTopPagesByVisit') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == 'campaignOverview') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == 'adgroupOverview') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == 'adOverview') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (subType == 'tableAge'||subType == 'tableGender'|| subType == 'tableDevice') {
                        widgetCharts.push({
                            'type': 'campaignOverViewbyAge',
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == 'gaPageContentEfficiencyTable') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == 'gaPageTechnicalEfficiencyTable') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == 'gaVisitorAcquisitionEfficiencyAnalysisTable') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == "audienceBehaviourbyDay") {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData,
                            'color': widget.charts[charts].chartColour
                        });
                    }
                    else if (chartType == "socialContributionToSiteTraffic") {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'metricCode': widget.charts[charts].metricCode,
                            'metricName': widget.charts[charts].metricName,
                            'values': widget.charts[charts].chartData,
                            'color': widget.charts[charts].chartColour
                        });
                    }
                    else if (chartType == 'pageTechnicalEfficiency') {
                        var bounce = 0;
                        var pageLoad = 0;
                        for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                            bounce += Number(widget.charts[charts].chartData[i].bounceRate);
                            pageLoad += Number(widget.charts[charts].chartData[i].PageLoadTime);
                        }
                        var summmary = [{key: 'Page LoadTime', value: pageLoad}, {key: 'Bounce Rate', value: bounce}]
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData,
                            'summary': summmary,
                            'key': widget.charts[charts].chartName,
                            'color': widget.charts[charts].chartColour
                        });
                    }
                    else if (chartType == 'pageContentEfficiency') {
                        var bounce = 0;
                        var entranceRate = 0;
                        var uniquePageviews = 0;
                        var pageviews = 0;
                        for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                            bounce += Number(widget.charts[charts].chartData[i].bounceRate);
                            entranceRate += Number(widget.charts[charts].chartData[i].entranceRate);
                            uniquePageviews += Number(widget.charts[charts].chartData[i].uniquePageviews);
                            pageviews += Number(widget.charts[charts].chartData[i].pageviews);
                        }
                        var summmary = [{key: 'Unique Page views', value: uniquePageviews}, {
                            key: 'Page views',
                            value: pageviews
                        }, {key: 'Bounce Rate', value: bounce}, {key: 'Entrance rate', value: entranceRate}]
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData,
                            'summary': summmary,
                            'key': widget.charts[charts].chartName,
                            'color': widget.charts[charts].chartColour
                        });
                    }
                    else if (chartType == 'visitorAcquisitionEfficiency') {
                        var newUsers = 0;
                        var goalValuePerSession = 0;
                        var goalConversionRateAll = 0;
                        for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                            goalConversionRateAll += Number(widget.charts[charts].chartData[i].goalConversionRateAll);
                            goalValuePerSession += Number(widget.charts[charts].chartData[i].goalValuePerSession);
                            newUsers += Number(widget.charts[charts].chartData[i].newUsers);
                        }
                        var summmary = [{key: 'New users', value: newUsers}, {
                            key: 'Per session goal value',
                            value: goalValuePerSession
                        }, {key: 'Goal conversion rate', value: goalConversionRateAll}]
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData,
                            'summary': summmary,
                            'key': widget.charts[charts].chartName,
                            'color': widget.charts[charts].chartColour
                        });
                    }
                    else if (chartType == 'gaSocialMediaOverview') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData,
                            'key': widget.charts[charts].chartName,
                            'color': widget.charts[charts].chartColour
                        });
                    }
                    else if (chartType == 'topReferringSites') {
                        if (String(widget.charts[charts].chartName) == 'Top referring sites(Table)') {
                            widgetCharts.push({
                                'type': 'topReferringSitesTable',
                                'values': widget.charts[charts].chartData
                            });
                        }
                        else {
                            var session = 0;
                            var goalConversionRate = 0;
                            var goalCompletions = 0;
                            for (var i = 0; i < widget.charts[charts].chartData.length; i++) {
                                goalConversionRate += Number(widget.charts[charts].chartData[i].goalConversionRate);
                                sessions += Number(widget.charts[charts].chartData[i].sessions);
                                goalCompletions += Number(widget.charts[charts].chartData[i].goalCompletions);
                            }
                            var summmary = [{key: 'Sessions', value: sessions}, {
                                key: 'Goal Completions',
                                value: goalCompletions
                            }, {key: 'Goal conversion rate', value: goalConversionRate}]
                            widgetCharts.push({
                                'type': widget.charts[charts].chartType,
                                'values': widget.charts[charts].chartData,
                                'summary': summmary,
                                'key': widget.charts[charts].chartName,
                                'color': widget.charts[charts].chartColour
                            });
                        }
                    }
                    else if (chartType == "fbReachByAge") {
                        widgetCharts.push({
                            'type': 'fbReachByAge',
                            'values': widget.charts[charts].chartData,
                        });
                    }
                    else if (chartType == "instagramEngagements") {
                        if (widget.charts[charts].chartSubType === "instagramPostTypes") {
                            var colorIndex = 0;
                            for (var index in widget.charts[charts].chartData) {
                                widgetCharts.push({
                                    'name':widget.charts[charts].chartName,
                                    'type': 'pie',
                                    'key': index,
                                    'displaySummary': false,
                                    'y': parseFloat(widget.charts[charts].chartData[index]),      //values - represents the array of {x,y} data points
                                    'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[colorIndex] != 'undefined' ? widget.charts[charts].chartColour[colorIndex] : '') : '',  //color - optional: choose your own line color.
                                });
                                ++colorIndex;
                            }
                        }
                        else if (widget.charts[charts].chartSubType === "instagramPostEngagement") {
                            var colorIndex = 0;
                            for (var index in widget.charts[charts].chartData) {
                                widgetCharts.push({
                                    'name':widget.charts[charts].chartName,
                                    'type': 'fbReachByCity',
                                    'y': parseFloat(widget.charts[charts].chartData[index]),      //values - represents the array of {x,y} data points
                                    'key': index,
                                    'displaySummary': false,
                                    'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[colorIndex] != 'undefined' ? widget.charts[charts].chartColour[colorIndex] : '') : '',  //color - optional: choose your own line color.
                                    'summaryDisplay': Math.round(widget.charts[charts].chartData[index] * 100) / 100
                                });
                                ++colorIndex;
                            }
                        } else if (widget.charts[charts].chartSubType === "instagramPostFrequency") {
                            var date1 = new Date(dateRange.startDate);
                            var date2 = new Date(dateRange.endDate);
                            var timeDiff = Math.abs(date2.getTime() - date1.getTime());
                            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            widgetCharts.push({
                                'key':'Post per day',
                                'type': 'angularGauge',
                                'y': Math.round((widget.charts[charts].chartData / diffDays) * 100) / 100,   //values - represents the array of {x,y} data points
                                'displaySummary': false,
                                'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[colorIndex] != 'undefined' ? widget.charts[charts].chartColour[colorIndex] : '') : '',  //color - optional: choose your own line color.
                                'summaryDisplay': Math.round((widget.charts[charts].chartData / diffDays) * 100) / 100
                            });
                        }

                    }
                    else if (chartType == "fbReachByCity" || chartType === 'gaUsers' || subType == 'pieAge'||subType == 'pieGender'|| subType == 'pieDevice') {
                        var colorIndex = 0;
                        for (var index in widget.charts[charts].chartData) {
                            widgetCharts.push({
                                'name':widget.charts[charts].chartName,
                                'type': 'fbReachByCity',
                                'y': parseFloat(widget.charts[charts].chartData[index]),      //values - represents the array of {x,y} data points
                                'key': index,
                                'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[colorIndex] != 'undefined' ? widget.charts[charts].chartColour[colorIndex] : '') : '',  //color - optional: choose your own line color.
                                'summaryDisplay': Math.round(widget.charts[charts].chartData[index] * 100) / 100
                            });
                            ++colorIndex;
                        }
                    }
                    else if (chartType == "fbReachByCountry") {
                        var colorIndex = 0;
                        for (var index in widget.charts[charts].chartData) {
                            widgetCharts.push({
                                'name':widget.charts[charts].chartName,
                                'type': 'pie',
                                'y': parseFloat(widget.charts[charts].chartData[index]),      //values - represents the array of {x,y} data points
                                'key': index,
                                'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[colorIndex] != 'undefined' ? widget.charts[charts].chartColour[colorIndex] : '') : '',  //color - optional: choose your own line color.
                                'summaryDisplay': Math.round(widget.charts[charts].chartData[index] * 100) / 100
                            });
                            ++colorIndex;
                        }
                    }
                    else if (chartType == "gaTopCountriesToSocialVisits" || chartType === 'gaTopCitiesToSocialVisits' ) {
                        var colorIndex = 0;
                        for (var index in widget.charts[charts].chartData) {
                            widgetCharts.push({
                                'name':widget.charts[charts].chartName,
                                'type': 'pie',
                                'y': parseFloat(widget.charts[charts].chartData[index]),      //values - represents the array of {x,y} data points
                                'key': index,
                                'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[colorIndex] != 'undefined' ? widget.charts[charts].chartColour[colorIndex] : '') : '',  //color - optional: choose your own line color.
                                'summaryDisplay': (parseFloat(widget.charts[charts].chartData[index]).toFixed(2) % Math.floor(widget.charts[charts].chartData[index])) > 0 ? parseFloat(widget.charts[charts].chartData[index]).toFixed(2) : parseInt(widget.charts[charts].chartData[index])
                            });
                            ++colorIndex;
                        }
                    }
                    else if (chartType == "pinterestEngagementRate") {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == "pinterestLeaderboard") {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == "costPerActionType" && (widget.meta == undefined)) {
                        widgetCharts.push({
                            'type': 'costPerActionType',
                            'values': widget.charts[charts].chartData,
                            //'configure':
                        });
                    }
                    else if (chartType == 'instagramHashtagLeaderBoard') {
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if (chartType == "percentageArea") {
                        var groupData = _.groupBy(widget.charts[charts].chartData, 'y.socialNetwork')
                        var summaryColor = 0;
                        for (var key in groupData) {
                            var summaryValue = 0;
                            var nonZeroPoints = 0;
                            var n = groupData[key].length;
                            var currentWeek = 0;
                            var pastWeek = 0;
                            var granularity;
                            if (widget.charts[charts].chartData.length >= 14) {
                                var count = 0;
                                for (var i = n - 1; i >= 0; i--) {
                                    if (count === 0 || count < 7)
                                        currentWeek += parseFloat(groupData[key][i].y.total);
                                    else if (count >= 7 && count < 14)
                                        pastWeek += parseFloat(groupData[key][i].y.total);
                                    count++;
                                }
                                granularity = 'WK';
                            }

                            else {
                                if (widget.charts[charts].chartData.length > 0) {
                                    var lenthOfData = groupData[key].length;
                                    var lastIndex = _.last(groupData[key]);
                                    if (typeof lastIndex.x != 'string') {
                                        var subtractDate = moment(lastIndex.x).subtract(1, "days").format('YYYY-DD-MM');
                                        currentWeek = parseFloat(lastIndex.y);
                                    }
                                    else {
                                        currentWeek = parseFloat(groupData[key][lenthOfData - 1].y.total);
                                    }

                                    for (var i = n - 1; i >= 0; i--) {
                                        if (typeof lastIndex.x != 'string') {
                                            var dateFormatChange = moment(groupData[key][i].x).format('YYYY-DD-MM');
                                            if (subtractDate === dateFormatChange)
                                                pastWeek = parseFloat(groupData[key][i].y);
                                        }
                                        else {
                                            pastWeek = parseFloat(groupData[key][lenthOfData - 2].y.total);
                                        }
                                    }
                                    granularity = 'Day';
                                }
                            }
                            var comparingData, minus, percentage;
                            if (currentWeek > pastWeek) {
                                comparingData = 'up';
                                minus = currentWeek - pastWeek;
                                if (pastWeek > 0)
                                    percentage = parseFloat(minus / pastWeek * 100).toFixed(2);
                                else
                                    percentage = currentWeek;
                            }
                            else if (currentWeek < pastWeek) {
                                comparingData = 'down';
                                minus = pastWeek - currentWeek;
                                if (pastWeek > 0)
                                    percentage = parseFloat(minus / pastWeek * 100).toFixed(2);
                                else
                                    percentage = 0;
                            }
                            else {
                                var minus = pastWeek - currentWeek;
                                var percentage = 0;
                            }
                            for (var datas in groupData[key]) {
                                summaryValue += parseFloat(groupData[key][datas].y.total);
                                if (parseFloat(groupData[key][datas].y.total != 0))
                                    nonZeroPoints++;
                                if (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType != 'undefined') {
                                    if (widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType == 'avg') {
                                        if (nonZeroPoints == 0 && summaryValue == 0) summaryValue = 0;
                                        else summaryValue = parseFloat(summaryValue / nonZeroPoints).toFixed(2);
                                    }
                                    else if (widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType == 'snapshot') {
                                        var latestDate = '';
                                        for (var data in groupData[items]) {
                                            if (latestDate < moment(groupData[key][data].x)) {
                                                latestDate = moment(groupData[key][data].x);
                                                summaryValue = groupData[key][data].y.total;
                                            }
                                        }
                                    }
                                }
                            }
                            widgetCharts.push({
                                'type': widget.charts[charts].chartType,
                                'metricCode': widget.charts[charts].metricCode,
                                'metricName': widget.charts[charts].metricName,
                                'key': key,
                                'values': groupData[key],
                                'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[summaryColor] != 'undefined' ? widget.charts[charts].chartColour[summaryColor] : '') : '',  //color - optional: choose your own line color.
                                'arrow': comparingData,
                                'totalChartLength': widget.charts[charts].chartData,
                                'variance': percentage,
                                'period': granularity,
                                'summaryDisplay': Math.round(summaryValue * 100) / 100,
                            });
                            summaryColor++;

                        }
                    }
                    else if (chartType === 'youtubeVideosOverview'){
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData,
                        });
                    }
                    else if (chartType == 'twitterEngagements') {
                        if (widget.charts[charts].chartSubType === 'engagementByUsersTalkedAbout' || widget.charts[charts].chartSubType === 'topLinks' || widget.charts[charts].chartSubType === 'hashTag') {
                            widgetCharts.push({
                                'type': widget.charts[charts].chartType,
                                'chartSubType': widget.charts[charts].chartSubType,
                                'values': widget.charts[charts].chartData,
                            });
                        }
                        else {
                            widgetCharts.push({
                                'type': widget.charts[charts].chartType,
                                'chartSubType': widget.charts[charts].chartSubType,
                                'values': widget.charts[charts].chartData,
                                'key': widget.charts[charts].chartName,
                                'color': widget.charts[charts].chartColour
                            });
                        }
                    }
                }

            }
            deferred.resolve(widgetCharts);
            return deferred.promise;
        }

        function createWidgetData(widget, widgetCharts, dateRange) {
            var deferred = $q.defer();
            var finalCharts = [];
            finalCharts.twitterEngagements = [],finalCharts.youtubeVideosOverview = [],
                finalCharts.lineCharts = [],
                finalCharts.barCharts = [],
                finalCharts.pieCharts = [],
                finalCharts.percentageAreaOptions = [],
                finalCharts.instagramPosts = [], finalCharts.highEngagementTweets = [], finalCharts.highestEngagementLinkedIn = [], finalCharts.pinterestEngagementRate = [], finalCharts.pinterestLeaderboard = [];
            finalCharts.gaTopPagesByVisit = [], finalCharts.angularGauge = [],
                finalCharts.multicharts = [],
                finalCharts.campaignOverViewbyAge = [],
                finalCharts.campaignOverview = [],
                finalCharts.adOverview = [],
                finalCharts.adgroupOverview = [],
                finalCharts.fbReachByAge = [], finalCharts.mozoverview = [], finalCharts.fbReachByCity = [], finalCharts.vimeoTopVideos = [], finalCharts.costPerActionType = [], finalCharts.topReferringSites = [], finalCharts.instagramHashtagLeaderBoard = [], finalCharts.gaPageContentEfficiencyTable = [], finalCharts.gaPageTechnicalEfficiencyTable = [], finalCharts.gaVisitorAcquisitionEfficiencyAnalysisTable = [], finalCharts.pageTechnicalEfficiency = [], finalCharts.pageContentEfficiency = [], finalCharts.visitorAcquisitionEfficiency = [], finalCharts.percentageArea = [], finalCharts.topReferringSites = [], finalCharts.topReferringSitesTable = [], finalCharts.gaSocialMediaOverview = [], finalCharts.stackbar = [];
            var graphOptions = {
                lineDataOptions: {
                    chart: {
                        type: 'lineChart',
                        noData: 'No data for chosen date range',
                        margin: {top: 20, right: 25, bottom: 30, left: 35},
                        x: function (d) {
                            return d.x;
                        },
                        y: function (d) {
                            return parseFloat(d.y);
                        },
                        useInteractiveGuideline: true,
                        xAxis: {
                            tickFormat: function (d) {
                                return d3.time.format('%d/%m/%y')(new Date(d))
                            },
                            showMaxMin: false
                        },
                        yAxis: {
                            tickFormat: function (d) {
                                return d3.format('r')(d);
                            },
                            showMaxMin: false
                        },
                        interpolate: "monotone",
                        axisLabelDistance: -10,
                        showLegend: false,
                        clipEdge: false,
                        legend: {
                            rightAlign: false,
                            margin: {
                                bottom: 25
                            }
                        }
                    }
                },
                barDataOptions: {
                    chart: {
                        type: 'multiBarChart',
                        noData: 'No data for chosen date range',
                        margin: {top: 20, right: 25, bottom: 30, left: 35},
                        x: function (d) {
                            return d.x;
                        },
                        y: function (d) {
                            return parseFloat(d.y);
                        },
                        useInteractiveGuideline: true,
                        xAxis: {
                            tickFormat: function (d) {
                                return d3.time.format('%d/%m/%y')(new Date(d))
                            },
                            showMaxMin: false
                        },
                        yAxis: {
                            tickFormat: function (d) {
                                return d3.format('r')(d);
                            },
                            showMaxMin: false
                        },
                        tooltip: {
                            enabled: false,
                            headerEnabled: true,
                            headerFormatter: function (d) {
                                return d3.time.format('%d/%m/%y')(new Date(d))
                            }
                        },
                        axisLabelDistance: -10,
                        showLegend: false,
                        stacked: true,
                        showControls: false,
                        legend: {
                            rightAlign: false,
                            margin: {
                                bottom: 25
                            }
                        }
                    }
                },
                pieDataOptions: {
                    chart: {
                        type: 'pieChart',
                        noData: 'No data for chosen date range',
                        margin: {top: 0, right: 15, bottom: 15, left: 15},
                        x: function (d) {
                            return d.key;
                        },
                        y: function (d) {
                            return d.y;
                        },
                        showLabels: false,
                        showLegend: false,
                        labelsOutside: false,
                        tooltips: true,
                        labelThreshold: 0.01,
                        labelSunbeamLayout: true,
                        legend: {
                            rightAlign: false,
                            margin: {
                                bottom: 25
                            }
                        }
                    }
                },
                percentageAreaOptions: {
                    chart: {
                        type: 'area',
                        noData: 'No data for chosen date range',
                        margin: {top: 20, right: 25, bottom: 30, left: 35},
                        x: function (d) {
                            return d.x;
                        },
                        y: function (d) {
                            return parseFloat(d.y);
                        },
                        useInteractiveGuideline: true,
                        xAxis: {
                            tickFormat: function (d) {
                                return d3.time.format('%d/%m/%y')(new Date(d))
                            },
                            showMaxMin: false
                        },
                        yAxis: {
                            tickFormat: function (d) {
                                return d3.format('r')(d);
                            },
                            showMaxMin: false
                        },
                        interpolate: "monotone",
                        axisLabelDistance: -10,
                        showLegend: false,
                        clipEdge: false,
                        legend: {
                            rightAlign: false,
                            margin: {
                                bottom: 25
                            }
                        }
                    }
                },
                instagramPosts: {
                    chart: {
                        type: 'instagramPosts'
                    }
                },
                campaignOverview: {
                    chart: {
                        type: 'campaignOverview'
                    }
                },
                adOverview: {
                    chart: {
                        type: 'adOverview'
                    }
                },
                adgroupOverview: {
                    chart: {
                        type: 'adgroupOverview'
                    }
                },
                highEngagementTweets: {
                    chart: {
                        type: 'highEngagementTweets'
                    }
                },
                mozoverview: {
                    chart: {
                        type: 'mozoverview'
                    }
                },
                highestEngagementLinkedIn: {
                    chart: {
                        type: 'highestEngagementLinkedIn'
                    }
                },
                vimeoTopVideos: {
                    chart: {
                        type: 'vimeoTopVideos'
                    }
                },
                campaignOverViewbyAge: {
                    chart: {
                        type: 'campaignOverViewbyAge'
                    }
                },
                gaTopPagesByVisit: {
                    chart: {
                        type: 'gaTopPagesByVisit'
                    }
                },
                gaPageContentEfficiencyTable: {
                    chart: {
                        type: 'gaPageContentEfficiencyTable'
                    }
                },
                gaPageTechnicalEfficiencyTable: {
                    chart: {
                        type: 'gaPageTechnicalEfficiencyTable'
                    }
                },
                gaVisitorAcquisitionEfficiencyAnalysisTable: {
                    chart: {
                        type: 'gaVisitorAcquisitionEfficiencyAnalysisTable'
                    }
                },
                topReferringSitesTable: {
                    chart: {
                        type: 'topReferringSitesTable'
                    }
                },
                visitorAcquisitionEfficiency: {
                    chart: {
                        type: 'visitorAcquisitionEfficiency',
                        margin: {top: 20, right: 30, bottom: 30, left: 35},
                    }
                },
                engagementByUsersTalkedAbout: {
                    chart: {
                        type: 'engagementByUsersTalkedAbout'
                    }
                },
                youtubeVideosOverview: {
                    chart: {
                        type: 'youtubeVideosOverview'
                    }
                },
                pinterestEngagementRate: {
                    chart: {
                        type: 'pinterestEngagementRate'
                    }
                },
                pinterestLeaderboard: {
                    chart: {
                        type: 'pinterestLeaderboard'
                    }
                },
                costPerActionType: {
                    chart: {
                        type: 'costPerActionType'
                    }
                },
                emptyCharts: {
                    chart: {
                        type: 'emptyCharts'
                    }
                },
                multiDataOptions: {
                    chart: {
                        type: 'multiChart',
                        noData: 'No data for chosen date range',
                        margin: {top: 20, right: 30, bottom: 30, left: 35},
                        x: function (d) {
                            return d.x;
                        },
                        y: function (d) {
                            return parseFloat(d.y);
                        },
                        useInteractiveGuideline: true,
                        xAxis: {
                            tickFormat: function (d) {
                                return d3.time.format('%d/%m/%y')(new Date(d))
                            },
                            showMaxMin: false
                        },
                        yAxis1: {
                            tickFormat: function (d) {
                                return d3.format('r')(d);
                            },
                            showMaxMin: false
                        },
                        yAxis2: {
                            tickFormat: function (d) {
                                return d3.format('r')(d);
                            },
                            showMaxMin: false
                        },
                        interpolate: "monotone",
                        axisLabelDistance: -10,
                        showLegend: false,
                        legend: {
                            rightAlign: false,
                            margin: {
                                bottom: 25
                            }
                        }
                    }
                },
                instagramHashtagLeaderBoard: {
                    chart: {
                        type: 'instagramHashtagLeaderBoard'
                    }
                },
            };
            var sizeY, sizeX, chartsCount = 0, individualGraphWidthDivider, individualGraphHeightDivider, chartName, finalChartData = [];
            var widgetLayoutOptions = [
                {W: 1, H: 1, N: 0, r: 1, c: 1},

                {W: 1, H: 1, N: 1, r: 1, c: 1},
                {W: 1, H: 1, N: 2, r: 2, c: 1},
                {W: 1, H: 1, N: 3, r: 3, c: 1},
                {W: 1, H: 1, N: 4, r: 4, c: 1},
                {W: 1, H: 1, N: 5, r: 5, c: 1},
                {W: 1, H: 1, N: 6, r: 6, c: 1},
                {W: 1, H: 1, N: 7, r: 7, c: 1},
                {W: 1, H: 1, N: 8, r: 8, c: 1},

                {W: 2, H: 1, N: 0, r: 1, c: 1},

                {W: 2, H: 1, N: 1, r: 1, c: 1},
                {W: 2, H: 1, N: 2, r: 1, c: 2},
                {W: 2, H: 1, N: 3, r: 2, c: 1},
                {W: 2, H: 1, N: 4, r: 2, c: 2},
                {W: 2, H: 1, N: 5, r: 2, c: 3},
                {W: 2, H: 1, N: 6, r: 2, c: 3},
                {W: 2, H: 1, N: 7, r: 3, c: 3},
                {W: 2, H: 1, N: 8, r: 3, c: 3},

                {W: 3, H: 1, N: 0, r: 1, c: 1},

                {W: 3, H: 1, N: 1, r: 1, c: 1},
                {W: 3, H: 1, N: 2, r: 1, c: 2},
                {W: 3, H: 1, N: 3, r: 1, c: 3},
                {W: 3, H: 1, N: 4, r: 2, c: 2},
                {W: 3, H: 1, N: 5, r: 2, c: 3},
                {W: 3, H: 1, N: 6, r: 2, c: 3},
                {W: 3, H: 1, N: 7, r: 3, c: 3},
                {W: 3, H: 1, N: 8, r: 3, c: 3},

                {W: 4, H: 1, N: 0, r: 1, c: 1},

                {W: 4, H: 1, N: 1, r: 1, c: 1},
                {W: 4, H: 1, N: 2, r: 1, c: 2},
                {W: 4, H: 1, N: 3, r: 1, c: 3},
                {W: 4, H: 1, N: 4, r: 1, c: 4},
                {W: 4, H: 1, N: 5, r: 2, c: 3},
                {W: 4, H: 1, N: 6, r: 2, c: 3},
                {W: 4, H: 1, N: 7, r: 3, c: 3},
                {W: 4, H: 1, N: 8, r: 3, c: 3},

                {W: 5, H: 1, N: 0, r: 1, c: 1},

                {W: 5, H: 1, N: 1, r: 1, c: 1},
                {W: 5, H: 1, N: 2, r: 1, c: 2},
                {W: 5, H: 1, N: 3, r: 1, c: 3},
                {W: 5, H: 1, N: 4, r: 1, c: 4},
                {W: 5, H: 1, N: 5, r: 1, c: 5},
                {W: 5, H: 1, N: 6, r: 2, c: 3},
                {W: 5, H: 1, N: 7, r: 2, c: 4},
                {W: 5, H: 1, N: 8, r: 2, c: 4},

                {W: 6, H: 1, N: 0, r: 1, c: 1},

                {W: 6, H: 1, N: 1, r: 1, c: 1},
                {W: 6, H: 1, N: 2, r: 1, c: 2},
                {W: 6, H: 1, N: 3, r: 1, c: 3},
                {W: 6, H: 1, N: 4, r: 1, c: 4},
                {W: 6, H: 1, N: 5, r: 1, c: 5},
                {W: 6, H: 1, N: 6, r: 2, c: 3},
                {W: 6, H: 1, N: 7, r: 2, c: 4},
                {W: 6, H: 1, N: 8, r: 2, c: 4},

                {W: 1, H: 2, N: 0, r: 1, c: 1},

                {W: 1, H: 2, N: 1, r: 1, c: 1},
                {W: 1, H: 2, N: 2, r: 2, c: 1},
                {W: 1, H: 2, N: 3, r: 3, c: 1},
                {W: 1, H: 2, N: 4, r: 4, c: 1},
                {W: 1, H: 2, N: 5, r: 5, c: 1},
                {W: 1, H: 2, N: 6, r: 6, c: 1},
                {W: 1, H: 2, N: 7, r: 7, c: 1},
                {W: 1, H: 2, N: 8, r: 8, c: 1},

                {W: 2, H: 2, N: 0, r: 1, c: 1},

                {W: 2, H: 2, N: 1, r: 1, c: 1},
                {W: 2, H: 2, N: 2, r: 1, c: 2},
                {W: 2, H: 2, N: 3, r: 2, c: 2},
                {W: 2, H: 2, N: 4, r: 2, c: 2},
                {W: 2, H: 2, N: 5, r: 3, c: 2},
                {W: 2, H: 2, N: 6, r: 3, c: 2},
                {W: 2, H: 2, N: 7, r: 4, c: 2},
                {W: 2, H: 2, N: 8, r: 4, c: 2},

                {W: 3, H: 2, N: 0, r: 1, c: 1},

                {W: 3, H: 2, N: 1, r: 1, c: 1},
                {W: 3, H: 2, N: 2, r: 1, c: 2},
                {W: 3, H: 2, N: 3, r: 2, c: 2},
                {W: 3, H: 2, N: 4, r: 2, c: 2},
                {W: 3, H: 2, N: 5, r: 2, c: 3},
                {W: 3, H: 2, N: 6, r: 2, c: 3},
                {W: 3, H: 2, N: 7, r: 2, c: 4},
                {W: 3, H: 2, N: 8, r: 2, c: 4},

                {W: 4, H: 2, N: 0, r: 1, c: 1},

                {W: 4, H: 2, N: 1, r: 1, c: 1},
                {W: 4, H: 2, N: 2, r: 1, c: 2},
                {W: 4, H: 2, N: 3, r: 1, c: 3},
                {W: 4, H: 2, N: 4, r: 2, c: 2},
                {W: 4, H: 2, N: 5, r: 2, c: 3},
                {W: 4, H: 2, N: 6, r: 2, c: 3},
                {W: 4, H: 2, N: 7, r: 2, c: 4},
                {W: 4, H: 2, N: 8, r: 2, c: 4},

                {W: 5, H: 2, N: 0, r: 1, c: 1},

                {W: 5, H: 2, N: 1, r: 1, c: 1},
                {W: 5, H: 2, N: 2, r: 1, c: 2},
                {W: 5, H: 2, N: 3, r: 1, c: 3},
                {W: 5, H: 2, N: 4, r: 2, c: 2},
                {W: 5, H: 2, N: 5, r: 2, c: 3},
                {W: 5, H: 2, N: 6, r: 2, c: 3},
                {W: 5, H: 2, N: 7, r: 2, c: 4},
                {W: 5, H: 2, N: 8, r: 2, c: 4},

                {W: 6, H: 2, N: 0, r: 1, c: 1},

                {W: 6, H: 2, N: 1, r: 1, c: 1},
                {W: 6, H: 2, N: 2, r: 1, c: 2},
                {W: 6, H: 2, N: 3, r: 1, c: 3},
                {W: 6, H: 2, N: 4, r: 2, c: 2},
                {W: 6, H: 2, N: 5, r: 2, c: 3},
                {W: 6, H: 2, N: 6, r: 2, c: 3},
                {W: 6, H: 2, N: 7, r: 2, c: 4},
                {W: 6, H: 2, N: 8, r: 2, c: 4},

                {W: 1, H: 3, N: 0, r: 1, c: 1},

                {W: 1, H: 3, N: 1, r: 1, c: 1},
                {W: 1, H: 3, N: 2, r: 2, c: 1},
                {W: 1, H: 3, N: 3, r: 3, c: 1},
                {W: 1, H: 3, N: 4, r: 4, c: 1},
                {W: 1, H: 3, N: 5, r: 5, c: 1},
                {W: 1, H: 3, N: 6, r: 6, c: 1},
                {W: 1, H: 3, N: 7, r: 7, c: 1},
                {W: 1, H: 3, N: 8, r: 8, c: 1},

                {W: 2, H: 3, N: 0, r: 1, c: 1},

                {W: 2, H: 3, N: 1, r: 1, c: 1},
                {W: 2, H: 3, N: 2, r: 2, c: 1},
                {W: 2, H: 3, N: 3, r: 3, c: 1},
                {W: 2, H: 3, N: 4, r: 2, c: 2},
                {W: 2, H: 3, N: 5, r: 3, c: 2},
                {W: 2, H: 3, N: 6, r: 3, c: 2},
                {W: 2, H: 3, N: 7, r: 4, c: 2},
                {W: 2, H: 3, N: 8, r: 4, c: 2},

                {W: 3, H: 3, N: 0, r: 1, c: 1},

                {W: 3, H: 3, N: 1, r: 1, c: 1},
                {W: 3, H: 3, N: 2, r: 1, c: 2},
                {W: 3, H: 3, N: 3, r: 2, c: 2},
                {W: 3, H: 3, N: 4, r: 2, c: 2},
                {W: 3, H: 3, N: 5, r: 2, c: 3},
                {W: 3, H: 3, N: 6, r: 2, c: 3},
                {W: 3, H: 3, N: 7, r: 2, c: 4},
                {W: 3, H: 3, N: 8, r: 2, c: 4},

                {W: 4, H: 3, N: 0, r: 1, c: 1},

                {W: 4, H: 3, N: 1, r: 1, c: 1},
                {W: 4, H: 3, N: 2, r: 1, c: 2},
                {W: 4, H: 3, N: 3, r: 1, c: 3},
                {W: 4, H: 3, N: 4, r: 2, c: 2},
                {W: 4, H: 3, N: 5, r: 2, c: 3},
                {W: 4, H: 3, N: 6, r: 2, c: 3},
                {W: 4, H: 3, N: 7, r: 2, c: 4},
                {W: 4, H: 3, N: 8, r: 2, c: 4},

                {W: 5, H: 3, N: 0, r: 1, c: 1},

                {W: 5, H: 3, N: 1, r: 1, c: 1},
                {W: 5, H: 3, N: 2, r: 1, c: 2},
                {W: 5, H: 3, N: 3, r: 1, c: 3},
                {W: 5, H: 3, N: 4, r: 2, c: 2},
                {W: 5, H: 3, N: 5, r: 2, c: 3},
                {W: 5, H: 3, N: 6, r: 2, c: 3},
                {W: 5, H: 3, N: 7, r: 2, c: 4},
                {W: 5, H: 3, N: 8, r: 2, c: 4},

                {W: 6, H: 3, N: 0, r: 1, c: 1},

                {W: 6, H: 3, N: 1, r: 1, c: 1},
                {W: 6, H: 3, N: 2, r: 1, c: 2},
                {W: 6, H: 3, N: 3, r: 1, c: 3},
                {W: 6, H: 3, N: 4, r: 2, c: 2},
                {W: 6, H: 3, N: 5, r: 2, c: 3},
                {W: 6, H: 3, N: 6, r: 2, c: 3},
                {W: 6, H: 3, N: 7, r: 2, c: 4},
                {W: 6, H: 3, N: 8, r: 2, c: 4}
            ];

            if (widget.widgetType == 'customFusion') {
                for (var charts in widgetCharts) {
                    if (widgetCharts[charts].type == 'line' || widgetCharts[charts].type == 'area' || widgetCharts[charts].type == 'bar' || widgetCharts[charts].type == 'column') finalCharts.lineCharts.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'pie') finalCharts.pieCharts.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'instagramPosts') finalCharts.instagramPosts.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'highEngagementTweets') finalCharts.highEngagementTweets.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'highestEngagementLinkedIn') finalCharts.highestEngagementLinkedIn.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'gaTopPagesByVisit') finalCharts.gaTopPagesByVisit.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'fbReachByCity') finalCharts.fbReachByCity.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'fbReachByAge') finalCharts.fbReachByAge.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'pinterestEngagementRate') finalCharts.pinterestEngagementRate.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'pinterestLeaderboard')finalCharts.pinterestLeaderboard.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'vimeoTopVideos') finalCharts.vimeoTopVideos.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'twitterEngagements') finalCharts.twitterEngagements.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'youtubeVideosOverview') finalCharts.youtubeVideosOverview.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'angularGauge') finalCharts.angularGauge.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'mozoverview') {
                        for (var i = 0; i < widgetCharts[charts].values.length; i++)
                            widgetCharts[charts].values[i].x = moment(widgetCharts[charts].values[i].x).format("YYYY-DD-MM");
                        finalCharts.mozoverview.push(widgetCharts[charts]);
                    }
                    else if (widgetCharts[charts].type == 'instagramHashtagLeaderBoard') finalCharts.instagramHashtagLeaderBoard.push(widgetCharts[charts]);
                }
            }
            else {
                for (var charts in widgetCharts) {
                    if (widgetCharts[charts].type == 'line' || widgetCharts[charts].type == 'area' || widgetCharts[charts].type == 'reachVsImpressions' || widgetCharts[charts].type == 'engagedUsersReach' || (widgetCharts[charts].type == 'costPerActionType' && (widget.meta != undefined))) finalCharts.lineCharts.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'bar' || widgetCharts[charts].type == 'column' || widgetCharts[charts].type == "stackcolumn") finalCharts.barCharts.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'pie') finalCharts.pieCharts.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'instagramPosts') finalCharts.instagramPosts.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'highEngagementTweets') finalCharts.highEngagementTweets.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'highestEngagementLinkedIn') finalCharts.highestEngagementLinkedIn.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'gaTopPagesByVisit') finalCharts.gaTopPagesByVisit.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'campaignOverViewbyAge') finalCharts.campaignOverViewbyAge.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'pageContentEfficiency') finalCharts.pageContentEfficiency.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'pageTechnicalEfficiency') finalCharts.pageTechnicalEfficiency.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'visitorAcquisitionEfficiency') finalCharts.visitorAcquisitionEfficiency.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'gaPageContentEfficiencyTable') finalCharts.gaPageContentEfficiencyTable.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'gaPageTechnicalEfficiencyTable') finalCharts.gaPageTechnicalEfficiencyTable.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'topReferringSites') finalCharts.topReferringSites.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'topReferringSitesTable') finalCharts.topReferringSitesTable.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'gaSocialMediaOverview') finalCharts.gaSocialMediaOverview.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'gaVisitorAcquisitionEfficiencyAnalysisTable') finalCharts.gaVisitorAcquisitionEfficiencyAnalysisTable.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'fbReachByCity') finalCharts.fbReachByCity.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'fbReachByAge') finalCharts.fbReachByAge.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'pinterestEngagementRate') finalCharts.pinterestEngagementRate.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'pinterestLeaderboard')finalCharts.pinterestLeaderboard.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'audienceBehaviourbyDay' || widgetCharts[charts].type === 'socialContributionToSiteTraffic')finalCharts.multicharts.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'vimeoTopVideos') finalCharts.vimeoTopVideos.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'campaignOverview') finalCharts.campaignOverview.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'adgroupOverview') finalCharts.adgroupOverview.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'adOverview') finalCharts.adOverview.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'percentageArea') finalCharts.percentageArea.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'costPerActionType' && !widget.meta) finalCharts.costPerActionType.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'mozoverview') {
                        for (var i = 0; i < widgetCharts[charts].values.length; i++)
                            widgetCharts[charts].values[i].x = moment(widgetCharts[charts].values[i].x).format("YYYY-DD-MM");
                        finalCharts.mozoverview.push(widgetCharts[charts]);
                    }
                    else if (widgetCharts[charts].type == 'angularGauge') finalCharts.angularGauge.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'stackbar')finalCharts.stackbar.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'instagramHashtagLeaderBoard') finalCharts.instagramHashtagLeaderBoard.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'twitterEngagements')finalCharts.twitterEngagements.push(widgetCharts[charts]);
                    else if (widgetCharts[charts].type == 'youtubeVideosOverview')finalCharts.youtubeVideosOverview.push(widgetCharts[charts]);
                }
            }
            var chartColorChecker = [];
            var chartOptions = {};
            var colourChart = ['#EF5350', '#EC407A', '#9C27B0', '#42A5F5', '#26A69A', '#FFCA28', '#FF7043', '#8D6E63'];

            function fetchAColour(currentColour, colourArray) {
                var checker;
                for (var colors in colourChart) {
                    checker = false;
                    for (var items in colourArray) {
                        if (colourChart[colors] == colourArray[items])
                            checker = true;
                    }
                    if (checker == false)
                        return colourChart[colors];
                }
            }

            if (finalCharts.lineCharts.length == 1) {
                var chartOptionsArray = [];
                var chartSeriesArray = [];
                for (var i = 0; i < finalCharts.lineCharts.length; i++) {
                    var dateArray = [];
                    var chartValues = [];
                    for (var k = 0; k < finalCharts.lineCharts[i].values.length; k++) {
                        dateArray.push(finalCharts.lineCharts[i].values[k].x.format('YYYY-MM-DD'));
                        var yValue = String(finalCharts.lineCharts[i].values[k].y).indexOf('.') ? parseFloat(finalCharts.lineCharts[i].values[k].y) : parseInt(finalCharts.lineCharts[i].values[k].y);
                        chartValues.push(yValue);
                    }
                    chartSeriesArray.push({
                        name: finalCharts.lineCharts[i].key === '(none)' ? 'Direct' : finalCharts.lineCharts[i].key,
                        data: chartValues,
                        color: finalCharts.lineCharts[i].color
                    });
                }
                chartOptions = {
                    chart: {
                        type: finalCharts.lineCharts[0].type,
                        reflow: true,
                        zoomType: 'x'
                    },
                    exporting: {enabled: false},
                    tooltip: {
                        shared: true
                    },
                    credits: {
                        enabled: false
                    },
                    xAxis: {
                        type: 'datetime',
                        categories: dateArray,
                        labels: {
                            formatter: function () {
                                var date = new Date(this.value);
                                return months[date.getMonth()] + ' ' + date.getDate();
                            }
                        },
                        tickInterval: 7,
                        min: 0,
                        max: dateArray.length,
                    },
                    yAxis: [{ // left y axis
                        title: {
                            text: null
                        }
                    }],
                    title: {
                        text: '',
                        style: {
                            display: 'none'
                        }
                    },
                    series: chartSeriesArray,
                }
                chartOptionsArray.push(chartOptions);
                chartsCount++;
                finalChartData.push({
                    'options': graphOptions.lineDataOptions,
                    'data': finalCharts.lineCharts,
                    'api': {},
                    'chartOptions': chartOptions
                });
                var domainChecker = 0;
                for (var charts in finalCharts.lineCharts) {
                    for (values in finalCharts.lineCharts[charts].values)
                        domainChecker += parseFloat(finalCharts.lineCharts[charts].values[values].y);
                }
                if (domainChecker == 0)
                    finalChartData[finalChartData.length - 1].options.chart.yDomain = [0, 10];
            }
            if (finalCharts.lineCharts.length > 1) {
                var chartOptionsArray = [];
                var chartSeriesArray = [];
                chartsCount++;
                var chartType;
                for (var charts in finalCharts.lineCharts) {
                    var dateArray = [];
                    var chartValues = [];
                    chartType = finalCharts.lineCharts[charts].type;
                    for (var items in chartColorChecker) {
                        if (finalCharts.lineCharts[charts].color == chartColorChecker[items]) {
                            var neededColour = fetchAColour(finalCharts.lineCharts[charts].color, chartColorChecker);
                            finalCharts.lineCharts[charts].color = neededColour;
                        }
                    }
                    for (var k = 0; k < finalCharts.lineCharts[charts].values.length; k++) {
                        if (typeof finalCharts.lineCharts[charts].values[k].x !== 'object') {
                            var check = isValidDate(finalCharts.lineCharts[charts].values[k].x)
                            if (check) {
                                dateArray.push(finalCharts.lineCharts[charts].values[k].x.format('YYYY-MM-DD'));
                                var yValue = String(finalCharts.lineCharts[charts].values[k].y).indexOf('.') ? parseFloat(finalCharts.lineCharts[charts].values[k].y) : parseInt(finalCharts.lineCharts[charts].values[k].y);
                                chartValues.push(yValue);
                            }
                            else {
                                dateArray.push(finalCharts.lineCharts[charts].values[k].x);
                                var yValue = String(finalCharts.lineCharts[charts].values[k].y).indexOf('.') ? parseFloat(finalCharts.lineCharts[charts].values[k].y) : parseInt(finalCharts.lineCharts[charts].values[k].y);
                                chartValues.push(yValue);
                            }
                        }
                        else {
                            dateArray.push(finalCharts.lineCharts[charts].values[k].x.format('YYYY-MM-DD'));
                            var yValue = String(finalCharts.lineCharts[charts].values[k].y).indexOf('.') ? parseFloat(finalCharts.lineCharts[charts].values[k].y) : parseInt(finalCharts.lineCharts[charts].values[k].y);
                            chartValues.push(yValue);
                        }

                    }
                    if (chartType == 'reachVsImpressions' || chartType == "engagedUsersReach") {
                        chartSeriesArray.push({
                            name: finalCharts.lineCharts[charts].key,
                            yAxis: typeof charts === 'string' ? parseInt(charts) : charts,
                            tooltip: {
                                valueSuffix: (finalCharts.lineCharts[charts].key === 'Impressions/Reach (%)' || finalCharts.lineCharts[charts].key === 'Engaged users/Reach (%)') ? '%' : ''
                            },
                            data: chartValues, type: 'area',
                            color: finalCharts.lineCharts[charts].color
                        });
                    }
                    else {
                        chartSeriesArray.push({
                            name: finalCharts.lineCharts[charts].key === '(none)' ? 'Direct' : finalCharts.lineCharts[charts].key,
                            data: chartValues, type: finalCharts.lineCharts[charts].type,
                            color: finalCharts.lineCharts[charts].color
                        });
                    }
                    chartColorChecker.push(finalCharts.lineCharts[charts].color);
                }
                if (typeof finalCharts.lineCharts[charts].values[0].x !== 'object') {
                    var check = isValidDate(finalCharts.lineCharts[charts].values[0].x)
                    if (check) {
                        chartOptions = {
                            chart: {
                                reflow: true,
                                zoomType: 'x'
                            },
                            credits: {
                                enabled: false
                            },
                            exporting: {enabled: false},
                            tooltip: {
                                enabled: true,
                                shared: true
                            },
                            xAxis: {
                                type: 'datetime',
                                categories: dateArray,
                                labels: {
                                    formatter: function () {
                                        var date = new Date(this.value);
                                        return months[date.getMonth()] + ' ' + date.getDate();
                                    }
                                },
                                tickInterval: 7,
                                min: 0,
                                max: dateArray.length,
                            },
                            title: {
                                text: '',
                                style: {
                                    display: 'none'
                                }
                            },
                            series: chartSeriesArray
                        }
                    } else {
                        chartOptions = {
                            chart: {
                                reflow: true,
                                zoomType: 'x'
                            },
                            credits: {
                                enabled: false
                            },
                            exporting: {enabled: false},
                            tooltip: {
                                enabled: true,
                                shared: true
                            },
                            xAxis: {
                                categories: dateArray,
                            },
                            title: {
                                text: '',
                                style: {
                                    display: 'none'
                                }
                            },
                            series: chartSeriesArray,
                        }
                    }
                }
                else if (chartType == 'reachVsImpressions' || chartType == "engagedUsersReach") {
                    chartOptions = {
                        chart: {
                            reflow: true,
                            zoomType: 'x'
                        },
                        credits: {
                            enabled: false
                        },
                        exporting: {enabled: false},
                        tooltip: {
                            enabled: true,
                            shared: true
                        },
                        xAxis: {
                            type: 'datetime',
                            categories: dateArray,
                            labels: {
                                formatter: function () {
                                    var date = new Date(this.value);
                                    return months[date.getMonth()] + ' ' + date.getDate();
                                }
                            },
                            tickInterval: 7,
                            min: 0,
                            max: dateArray.length,
                        },
                        yAxis: [{
                            title: {
                                text: chartType == 'reachVsImpressions' ? 'Impressions/Reach (%)' : 'Engaged users/Reach (%)',
                            }
                        }, {
                            title: {
                                text: 'Total Reach',
                            },
                            opposite: true
                        }],
                        title: {
                            text: '',
                            style: {
                                display: 'none'
                            }
                        },
                        series: chartSeriesArray,
                    }
                }
                else {
                    chartOptions = {
                        chart: {
                            reflow: true,
                            zoomType: 'x'
                        },
                        credits: {
                            enabled: false
                        },
                        exporting: {enabled: false},
                        tooltip: {
                            enabled: true,
                            shared: true
                        },
                        xAxis: {
                            type: 'datetime',
                            categories: dateArray,
                            labels: {
                                formatter: function () {
                                    var date = new Date(this.value);
                                    return months[date.getMonth()] + ' ' + date.getDate();
                                }
                            },
                            tickInterval: 7,
                            min: 0,
                            max: dateArray.length,
                        },
                        title: {
                            text: '',
                            style: {
                                display: 'none'
                            }
                        },
                        series: chartSeriesArray,
                    }
                }

                chartColorChecker = [];
                var individualGraphTotals = [];
                for (var charts in finalCharts.lineCharts) {
                    var summaryTotal = 0;
                    for (var values in finalCharts.lineCharts[charts].values)
                        summaryTotal += parseFloat(finalCharts.lineCharts[charts].values[values].y);
                    individualGraphTotals[charts] = {
                        summaryTotal: summaryTotal
                    };
                }
                var cumulativeTotal = 0;
                var wantAddDomain = 0;
                for (items in individualGraphTotals) {
                    cumulativeTotal = parseInt(individualGraphTotals[items].summaryTotal);
                    if (cumulativeTotal == 0) {
                        wantAddDomain = 1;
                    }
                }
                var cumulativeAverage = cumulativeTotal / individualGraphTotals.length;

                for (var charts in finalCharts.lineCharts) {
                    var summaryTotal = 0;
                    for (values in finalCharts.lineCharts[charts].values)
                        summaryTotal += parseFloat(finalCharts.lineCharts[charts].values[values].y);
                    if (summaryTotal > cumulativeAverage) finalCharts.lineCharts[charts].yAxis = 2;
                    else finalCharts.lineCharts[charts].yAxis = 1;
                }
                finalChartData.push({
                    'options': graphOptions.multiDataOptions,
                    'data': finalCharts.lineCharts,
                    'api': {},
                    'chartOptions': chartOptions
                });
                if (wantAddDomain == 1) {
                    finalChartData[finalChartData.length - 1].options.chart.yDomain1 = [0, 10];
                }
            }
            if (finalCharts.barCharts.length > 0) {
                var chartOptionsArray = [];
                var chartSeriesArray = [];
                chartsCount++;
                for (var charts in finalCharts.barCharts) {
                    var dateArray = [];
                    var chartValues = [];
                    for (var items in chartColorChecker) {
                        if (finalCharts.barCharts[charts].color == chartColorChecker[items]) {
                            var neededColour = fetchAColour(finalCharts.barCharts[charts].color, chartColorChecker);
                            finalCharts.barCharts[charts].color = neededColour;
                        }
                    }
                    for (var k = 0; k < finalCharts.barCharts[charts].values.length; k++) {
                        var typeOfXaxis;
                        if (typeof finalCharts.barCharts[charts].values[k].x === 'string') {
                            typeOfXaxis = 'string';
                            dateArray.push(finalCharts.barCharts[charts].values[k].x);
                        }
                        else {
                            typeOfXaxis = 'date';
                            dateArray.push(finalCharts.barCharts[charts].values[k].x.format('YYYY-MM-DD'));
                        }
                        var yValue = String(finalCharts.barCharts[charts].values[k].y).indexOf('.') ? parseFloat(finalCharts.barCharts[charts].values[k].y) : parseInt(finalCharts.barCharts[charts].values[k].y);
                        chartValues.push(yValue);
                    }
                    chartSeriesArray.push({
                        name: finalCharts.barCharts[charts].key === '(none)' ? 'Direct' : finalCharts.barCharts[charts].key,
                        data: chartValues,
                        color: finalCharts.barCharts[charts].color
                    });
                    chartColorChecker.push(finalCharts.barCharts[charts].color);
                }
                if (typeOfXaxis === 'string') {
                    chartOptions = {
                        chart: {
                            type: finalCharts.barCharts[charts].type,
                            reflow: true,
                            zoomType: 'x',

                        },
                        credits: {
                            enabled: false
                        },
                        exporting: {enabled: false},
                        tooltip: {
                            enabled: true,
                            shared: true
                        },
                        xAxis: {
                            categories: dateArray,

                        },
                        title: {
                            text: '',
                            style: {
                                display: 'none'
                            }
                        },
                        yAxis: [{ // left y axis
                            title: {
                                text: null
                            }
                        }],
                        series: chartSeriesArray,
                    }
                }
                else {
                    if (finalCharts.barCharts[charts].type === 'stackcolumn') {
                        finalCharts.barCharts[charts].type = 'column'
                        chartOptions = {
                            chart: {
                                type: 'column',
                                reflow: true,
                                zoomType: 'x',

                            },
                            credits: {
                                enabled: false
                            },
                            exporting: {enabled: false},
                            tooltip: {
                                enabled: true,
                                shared: true
                            },
                            xAxis: {
                                type: 'datetime',
                                categories: dateArray,
                                labels: {
                                    formatter: function () {
                                        var date = new Date(this.value);
                                        return months[date.getMonth()] + ' ' + date.getDate();
                                    }
                                },
                                tickInterval: 7,
                                min: 0,
                                max: dateArray.length,
                            },
                            plotOptions: {
                                column: {
                                    stacking: 'normal',
                                }
                            },
                            title: {
                                text: '',
                                style: {
                                    display: 'none'
                                }
                            },
                            yAxis: [{ // left y axis
                                title: {
                                    text: null
                                }
                            }],
                            series: chartSeriesArray,
                        }
                    }
                    else {
                        chartOptions = {
                            chart: {
                                type: finalCharts.barCharts[charts].type,
                                reflow: true,
                                zoomType: 'x',

                            },
                            credits: {
                                enabled: false
                            },
                            exporting: {enabled: false},
                            tooltip: {
                                enabled: true,
                                shared: true,
                                valueSuffix: finalCharts.barCharts[charts].key == "Session Duration" ? 'sec' : ''
                            },
                            xAxis: {
                                type: 'datetime',
                                categories: dateArray,
                                labels: {
                                    formatter: function () {
                                        var date = new Date(this.value);
                                        return months[date.getMonth()] + ' ' + date.getDate();
                                    }
                                },
                                tickInterval: 7,
                                min: 0,
                                max: dateArray.length,
                            },
                            title: {
                                text: '',
                                style: {
                                    display: 'none'
                                }
                            },
                            yAxis: [{
                                title: {
                                    text: null
                                }
                            }],
                            series: chartSeriesArray,
                        }
                    }

                }
                chartColorChecker = [];
                var individualGraphTotals = [];
                for (var charts in finalCharts.barCharts) {
                    var summaryTotal = 0;
                    for (var values in finalCharts.barCharts[charts].values)
                        summaryTotal += parseFloat(finalCharts.barCharts[charts].values[values].y);
                    individualGraphTotals[charts] = {
                        summaryTotal: summaryTotal
                    };
                }
                var cumulativeTotal = 0;
                for (items in individualGraphTotals)
                    cumulativeTotal += parseInt(individualGraphTotals[items].summaryTotal);
                finalChartData.push({
                    'options': graphOptions.pieDataOptions,
                    'data': finalCharts.barCharts,
                    'api': {},
                    'chartOptions': chartOptions
                });
                if (cumulativeTotal == 0) finalChartData[finalChartData.length - 1].options.chart.yDomain = [0, 10];
            }
            if (finalCharts.stackbar.length > 0) {
                var chartOptionsArray = [];
                var chartSeriesArray = [];
                chartsCount++;

                for (keys in finalCharts.stackbar[charts].values[0].total[0]) {
                    var chartValues = [];
                    var dateArray = [];
                    for (var charts in finalCharts.stackbar) {
                        dateArray.push(finalCharts.stackbar[charts].values[0]['date'])
                        if (keys == 'organic') {
                            var value = -Math.abs(finalCharts.stackbar[charts].values[0].total[0][keys])
                            chartValues.push(value)
                        }
                        else
                            chartValues.push(finalCharts.stackbar[charts].values[0].total[0][keys])

                    }
                    chartSeriesArray.push({
                        name: keys === '(none)' ? 'Direct' : keys,
                        data: chartValues,
                    });
                }
                chartOptions = {
                    chart: {
                        type: 'bar',
                        reflow: true,
                        zoomType: 'x',
                    },
                    credits: {
                        enabled: false
                    },
                    exporting: {enabled: false},
                    tooltip: {
                        enabled: true,
                        shared: true
                    },
                    xAxis: [{
                        categories: dateArray,
                        reversed: false,
                        labels: {
                            step: 1
                        }
                    }, { // mirror axis on right side
                        opposite: true,
                        reversed: false,
                        categories: dateArray,
                        linkedTo: 0,
                        labels: {
                            step: 1
                        }
                    }],
                    title: {
                        text: '',
                        style: {
                            display: 'none'
                        }
                    },
                    yAxis: [{ // left y axis
                        title: {
                            text: null
                        }, labels: {
                            formatter: function () {
                                return "";
                            }
                        }
                    }],
                    plotOptions: {
                        series: {
                            stacking: 'normal',
                            pointPadding: 0,
                            groupPadding: 0
                        }
                    },
                    tooltip: {
                        formatter: function () {
                            return '<b>' + this.series.name + this.point.category + '</b><br/>' +
                                'visit: ' + Highcharts.numberFormat(Math.abs(this.point.y), 0);
                        }
                    },
                    series: chartSeriesArray,
                }

                finalChartData.push({
                    'options': graphOptions.barDataOptions,
                    'data': finalCharts.stackbar,
                    'api': {},
                    'chartOptions': chartOptions
                });
            }
            if (finalCharts.multicharts.length > 0) {
                var chartOptionsArray = [];
                var dateArray = []
                var chartSeriesArray = [];
                var displaySummary = [];

                function getSum(total, num) {
                    return total + num;
                }

                if (finalCharts.multicharts[charts].type === "socialContributionToSiteTraffic") {
                    for (var k = 0; k < finalCharts.multicharts[charts].values.length; k++) {
                        dateArray.push(finalCharts.multicharts[charts].values[k].x);
                    }
                    for (var j in finalCharts.multicharts) {
                        var dataArray = [];
                        for (var index = 0; index < finalCharts.multicharts[j].values.length; index++) {
                            dataArray.push(String(finalCharts.multicharts[j].values[index].y).indexOf('.') ? parseFloat(finalCharts.multicharts[j].values[index].y) : parseInt(multicharts[j].values[index].y))
                        }
                        chartSeriesArray.push({
                            type: finalCharts.multicharts[j].metricCode == 'sessions' ? 'column' : 'line',
                            name: finalCharts.multicharts[j].metricName,
                            data: dataArray,
                            yAxis: finalCharts.multicharts[j].metricCode == 'sessions' ? 0 : 0,
                            color: finalCharts.multicharts[j].color[j]
                        });
                        var summaryDisplay = dataArray.reduce(getSum)
                        var sample = {
                            summaryDisplay: Math.round(summaryDisplay * 100) / 100,
                            key: finalCharts.multicharts[j].metricName,
                            showComparision: false,
                            variance: 0,
                            color: finalCharts.multicharts[j].color[j]
                        }
                        displaySummary.push(sample)
                    }
                    var yAxisOption = [{ // left y axis
                        title: {
                            text: 'Total sessions'
                        }
                    }, { // left y axis
                        title: {
                            text: 'Sessions from social sources'
                        },
                        opposite: true,
                    }
                    ];
                    var xAxisOption = {
                        type: 'datetime',
                        categories: dateArray,
                        labels: {
                            formatter: function () {
                                var date = new Date(this.value);
                                return months[date.getMonth()] + ' ' + date.getDate();
                            }
                        },
                        tickInterval: 7,
                        min: 0,
                        max: dateArray.length,
                    }
                }
                else {
                    var yAxisOption = [{ // left y axis
                        title: {
                            text: null
                        }
                    }, { // left y axis
                        title: {
                            text: null
                        },
                        opposite: true,
                    }
                    ];
                    var xAxisOption = {
                        type: 'datetime',
                        categories: dateArray,
                    }
                    chartsCount++;
                    for (var k = 0; k < finalCharts.multicharts[charts].values.length; k++) {
                        dateArray.push(finalCharts.multicharts[charts].values[k].date);
                    }
                    var i = 0;
                    for (var key in finalCharts.multicharts[charts].values[0].total) {
                        var dataSample = [];
                        for (var k = 0; k < finalCharts.multicharts[charts].values.length; k++) {
                            var value = Math.round(finalCharts.multicharts[charts].values[k].total[key] * 100) / 100;
                            dataSample.push(value)
                        }
                        if (key == 'pageviews') {
                            chartSeriesArray.push({
                                type: 'column',
                                name: 'Page views',
                                data: dataSample,
                                yAxis: 0,
                                color: finalCharts.multicharts[charts].color[i]
                            });
                            var summaryDisplay = dataSample.reduce(getSum)
                            var sample = {
                                summaryDisplay: Math.round(summaryDisplay * 100) / 100,
                                key: 'Page views',
                                showComparision: false,
                                variance: 0,
                                color: finalCharts.multicharts[charts].color[i]
                            }
                            displaySummary.push(sample)
                        }
                        else if (key != 'total' && key != 'sessions' && key != 'hour' && key != "bounces") {
                            var name;
                            if (key == 'pageviewsPerSession') {
                                name = 'Pages / Session'
                            }
                            else if (key == 'bounceRate') {
                                name = 'Bounce rate'
                            }
                            else if (key == 'percentNewSessions') {
                                name = '% New sessions'
                            }
                            chartSeriesArray.push({
                                type: 'line',
                                data: dataSample,
                                name: name,
                                yAxis: 1,
                                color: finalCharts.multicharts[charts].color[i]
                            })
                            var summaryDisplay = dataSample.reduce(getSum)
                            var sample = {
                                summaryDisplay: Math.round(summaryDisplay * 100) / 100,
                                key: name,
                                showComparision: false,
                                variance: 0,
                                color: finalCharts.multicharts[charts].color[i]
                            }
                            displaySummary.push(sample)
                        }
                        i++;

                    }
                }
                chartOptions = {
                    chart: {
                        zoomType: 'x',
                    },
                    credits: {
                        enabled: false
                    },
                    exporting: {enabled: false},
                    tooltip: {
                        enabled: true,
                        shared: true
                    },
                    xAxis: xAxisOption,
                    title: {
                        text: '',
                        style: {
                            display: 'none'
                        }
                    },
                    yAxis: yAxisOption,
                    series: chartSeriesArray,
                }
                finalChartData.push({
                    'options': graphOptions.multiDataOptions,
                    'data': finalCharts.multicharts,
                    'api': {},
                    'chartOptions': chartOptions
                });
                if (cumulativeTotal == 0) finalChartData[finalChartData.length - 1].options.chart.yDomain = [0, 10];
            }
            if (finalCharts.percentageArea.length > 0) {
                if (finalCharts.percentageArea.length > 0) {
                    var chartOptionsArray = [];
                    var dateArray = []
                    var chartSeriesArray = [];
                    var displaySummary = [];
                    var seriesdataArray = [];

                    function getSum(total, num) {
                        return total + num;
                    }

                    for (var k = 0; k < finalCharts.percentageArea[charts].totalChartLength.length; k++) {
                        dateArray.push(finalCharts.percentageArea[charts].totalChartLength[k].x);
                    }
                    var color = 0;
                    for (var j in finalCharts.percentageArea) {
                        var uniqueDate = _.groupBy(finalCharts.percentageArea[j].values, 'y.socialNetwork')
                        for (var key in uniqueDate) {
                            var indexing = 0;
                            var toolTipName = [];
                            var toolTip = [];
                            for (var k = 0; k < finalCharts.percentageArea[charts].totalChartLength.length; k++) {
                                toolTip.push({
                                    y: 0
                                })
                            }
                            for (var n = 0; n < uniqueDate[key].length; n++) {
                                for (var i = 0; i < finalCharts.percentageArea[charts].totalChartLength.length; i++) {
                                    var boolean = (moment(uniqueDate[key][n].x).format('YYYY-DD-MM') == moment(finalCharts.percentageArea[charts].totalChartLength[i].x).format('YYYY-DD-MM'));
                                    if (boolean === true) {
                                        toolTip[i].y = parseInt(uniqueDate[key][n].y.total)
                                    }
                                }
                            }

                            chartSeriesArray.push({
                                type: 'area',
                                color: finalCharts.percentageArea[j].color,
                                name: key,
                                data: toolTip,
                            })
                            color++;
                        }

                        var sample = {
                            summaryDisplay: Math.round(summaryDisplay * 100) / 100,
                            key: finalCharts.percentageArea[j].metricName,
                            showComparision: false,
                            variance: 0,
                            color: finalCharts.percentageArea[j].color[j]
                        }
                        displaySummary.push(sample)
                    }
                    var xAxisOption = {
                        type: 'datetime',
                        categories: dateArray,
                        labels: {
                            formatter: function () {
                                var date = new Date(this.value);
                                return months[date.getMonth()] + ' ' + date.getDate();
                            }
                        },
                        tickInterval: 7,
                        min: 0,
                        max: dateArray.length,
                    }
                    chartOptions = {
                        chart: {
                            zoomType: 'x',
                        },
                        credits: {
                            enabled: false
                        },
                        exporting: {enabled: false},
                        tooltip: {
                            split: true,
                            enabled: true,
                            shared: true
                        },
                        xAxis: xAxisOption,
                        title: {
                            text: '',
                            style: {
                                display: 'none'
                            }
                        },
                        yAxis: { // left y axis
                            title: {
                                text: 'value'
                            }
                        },
                        plotOptions: {
                            area: {
                                stacking: 'normal',
                                lineColor: '#ffffff',
                                lineWidth: 1,
                                marker: {
                                    lineWidth: 1,
                                    lineColor: '#ffffff'
                                }
                            }
                        },
                        series: chartSeriesArray,
                    }
                    finalChartData.push({
                        'options': graphOptions.percentageAreaOptions,
                        'data': finalCharts.percentageArea,
                        'api': {},
                        'chartOptions': chartOptions
                    });
                    if (cumulativeTotal == 0) finalChartData[finalChartData.length - 1].options.chart.yDomain = [0, 10];
                }
            }
            if (finalCharts.pieCharts.length > 0) {
                var chartOptionsArray = [];
                var chartSeriesArray = [];
                chartsCount++;
                var dateArray = [];
                var chartValues = [];
                for (var charts in finalCharts.pieCharts) {
                    for (var items in chartColorChecker) {
                        if (finalCharts.pieCharts[charts].color == chartColorChecker[items]) {
                            var neededColour = fetchAColour(finalCharts.pieCharts[charts].color, chartColorChecker);
                            finalCharts.pieCharts[charts].color = neededColour;
                        }
                    }
                    chartColorChecker.push(finalCharts.pieCharts[charts].color);
                    var y = String(finalCharts.pieCharts[charts].y).indexOf('.') ? parseFloat(finalCharts.pieCharts[charts].y) : parseInt(finalCharts.pieCharts[charts].y);
                    var name = finalCharts.pieCharts[charts].key;
                    chartValues.push({
                        y: y,
                        name: name === '(none)' ? 'Direct' : name,
                        color: finalCharts.pieCharts[charts].color
                    });
                }
                chartSeriesArray.push({
                    data: chartValues,name:finalCharts.pieCharts[charts].name
                });
                chartOptions = {
                    chart: {
                        type: finalCharts.pieCharts[0].type,
                        /*options3d: {
                         enabled: true,
                         alpha: 45,
                         beta: 0
                         },*/
                        reflow: true,
                        zoomType: 'x'
                    },
                    credits: {
                        enabled: false
                    },
                    exporting: {enabled: false},
                    tooltip: {
                        enabled: true,
                        shared: true
                    },
                    title: {
                        text: '',
                        style: {
                            display: 'none'
                        }
                    },
                    yAxis: [{ // left y axis
                        title: {
                            text: null
                        }
                    }],
                    tooltip: {
                        formatter: function() {
                            return  this.key +
                                ':'+ this.y +'</b>';
                        }
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                        }
                    },
                    series: chartSeriesArray,
                }

                chartColorChecker = [];
                finalChartData.push({
                    'options': graphOptions.pieDataOptions,
                    'data': finalCharts.pieCharts,
                    'api': {},
                    'chartOptions': chartOptions
                });
            }
            if (finalCharts.fbReachByCity.length > 0) {
                var chartOptionsArray = [];
                var chartSeriesArray = [];
                chartsCount++;
                var dateArray = [];
                var chartValues = [];
                for (var charts in finalCharts.fbReachByCity) {
                    for (var items in chartColorChecker) {
                        if (finalCharts.fbReachByCity[charts].color == chartColorChecker[items]) {
                            var neededColour = fetchAColour(finalCharts.fbReachByCity[charts].color, chartColorChecker);
                            finalCharts.fbReachByCity[charts].color = neededColour;
                        }
                    }
                    chartColorChecker.push(finalCharts.fbReachByCity[charts].color);
                    var y = String(finalCharts.fbReachByCity[charts].y).indexOf('.') ? parseFloat(finalCharts.fbReachByCity[charts].y) : parseInt(finalCharts.fbReachByCity[charts].y);
                    var name = finalCharts.fbReachByCity[charts].key;
                    chartValues.push({y: y, name: name, color: finalCharts.fbReachByCity[charts].color});

                }
                var name = finalCharts.fbReachByCity[charts].name;
                chartSeriesArray.push({
                    data: chartValues,
                    name: name
                });
                chartOptions = {
                    chart: {
                        type: 'pie',
                        reflow: true,
                        zoomType: 'x'
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            depth: 35,
                            dataLabels: {
                                enabled: true,
                            }
                        }
                    },
                    credits: {
                        enabled: false
                    },
                    exporting: {enabled: false},
                    tooltip: {
                        formatter: function() {
                            return  this.key +
                                ':'+ this.y +'</b>';
                        }
                    },
                    /*tooltip: {
                     enabled: true,
                     shared: true
                     },*/
                    title: {
                        text: '',
                        style: {
                            display: 'none'
                        }
                    },
                    series: chartSeriesArray,
                }
                chartColorChecker = [];
                finalChartData.push({
                    'options': graphOptions.pieDataOptions,
                    'data': finalCharts.fbReachByCity,
                    'api': {},
                    'chartOptions': chartOptions
                });
            }
            if (finalCharts.fbReachByAge.length > 0) {
                var chartOptionsArray = [];
                var chartSeriesArray = [];
                chartsCount++;
                chartOptions = {
                    chart: {
                        type: 'column',
                        reflow: true,
                        zoomType: 'x',
                    },
                    credits: {
                        enabled: false
                    },
                    exporting: {enabled: false},
                    tooltip: {
                        enabled: true,
                        shared: true
                    },
                    xAxis: {
                        categories: finalCharts.fbReachByAge[0].values[1],
                    },
                    yAxis: [{ // left y axis
                        title: {
                            text: null
                        },
                        min: 0
                    }],
                    title: {
                        text: '',
                        style: {
                            display: 'none'
                        }
                    },
                    plotOptions: {
                        column: {
                            stacking: 'normal',
                        }
                    },
                    series: finalCharts.fbReachByAge[0].values[2],
                }

                function getSum(total, num) {
                    return total + num;
                }

                colorarry = [
                    "#b2aee8",
                    "#aee8b2",
                    "#e8b2ae",
                    "#98DF8A",
                    "#756BB1",
                    "#FFBB78",
                    "#0F9D58",
                    "#20bfaf",
                    "#bb24d1",
                    "#dcdf41"
                ];
                var display = [];
                var summaryDisplay = 0
                for (var i = 0; i < finalCharts.fbReachByAge[0].values[1].length; i++) {
                    for (var j = 0; j < finalCharts.fbReachByAge[0].values[2].length; j++)
                        summaryDisplay += finalCharts.fbReachByAge[0].values[2][j].data[i]
                    var sample = {
                        summaryDisplay: summaryDisplay,
                        type:'pie',
                        key: finalCharts.fbReachByAge[0].values[1][i],
                        showComparision: 'false',
                        variance: 0,
                        color: colorarry[i]
                    }
                    display.push(sample)
                }
                chartColorChecker = [];
                var individualGraphTotals = [];
                for (var charts in display) {
                    var summaryTotal = 0;
                    summaryTotal += parseFloat(display.summaryDisplay);
                    individualGraphTotals[charts] = {
                        summaryTotal: summaryTotal
                    };
                }

                var cumulativeTotal = 0;
                for (items in individualGraphTotals)
                    cumulativeTotal += parseInt(individualGraphTotals[items].summaryTotal);
                finalChartData.push({
                    'options': graphOptions.pieDataOptions,
                    'data': display,
                    'api': {},
                    'chartOptions': chartOptions
                });
            }
            if (finalCharts.instagramPosts.length > 0) {
                if (finalCharts.instagramPosts[0].values.length > 0) {
                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.instagramPosts,
                        'data': finalCharts.instagramPosts[0].values
                    });
                }
            }
            if (finalCharts.vimeoTopVideos.length > 0) {
                if (finalCharts.vimeoTopVideos[0].values.length > 0) {
                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.vimeoTopVideos,
                        'data': finalCharts.vimeoTopVideos[0].values
                    });
                }
            }
            if (finalCharts.highEngagementTweets.length > 0) {
                if (finalCharts.highEngagementTweets[0].values.length > 0) {
                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.highEngagementTweets,
                        'data': finalCharts.highEngagementTweets[0].values
                    });
                }
            }
            if (finalCharts.highestEngagementLinkedIn.length > 0) {
                if (finalCharts.highestEngagementLinkedIn[0].values.length > 0) {
                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.highestEngagementLinkedIn,
                        'data': finalCharts.highestEngagementLinkedIn[0].values
                    });
                }
            }
            if (finalCharts.gaTopPagesByVisit.length > 0) {

                if (finalCharts.gaTopPagesByVisit[0].values.length > 0) {

                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.gaTopPagesByVisit,
                        'data': finalCharts.gaTopPagesByVisit[0].values
                    });

                }

            }
            if (finalCharts.campaignOverViewbyAge.length > 0) {
                if (finalCharts.campaignOverViewbyAge[0].values.length > 0) {
                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.campaignOverViewbyAge,
                        'data': finalCharts.campaignOverViewbyAge[0].values
                    });

                }

            }
            if (finalCharts.campaignOverview.length > 0) {

                if (finalCharts.campaignOverview[0].values.length > 0) {

                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.campaignOverview,
                        'data': finalCharts.campaignOverview[0].values
                    });

                }

            }
            if (finalCharts.adgroupOverview.length > 0) {

                if (finalCharts.adgroupOverview[0].values.length > 0) {

                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.adgroupOverview,
                        'data': finalCharts.adgroupOverview[0].values
                    });

                }

            }
            if (finalCharts.adOverview.length > 0) {

                if (finalCharts.adOverview[0].values.length > 0) {

                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.adOverview,
                        'data': finalCharts.adOverview[0].values
                    });

                }

            }
            if (finalCharts.gaPageContentEfficiencyTable.length > 0) {
                if (finalCharts.gaPageContentEfficiencyTable[0].values.length > 0) {

                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.gaPageContentEfficiencyTable,
                        'data': finalCharts.gaPageContentEfficiencyTable[0].values
                    });

                }
            }
            if (finalCharts.topReferringSitesTable.length > 0) {
                if (finalCharts.topReferringSitesTable[0].values.length > 0) {
                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.topReferringSitesTable,
                        'data': finalCharts.topReferringSitesTable[0].values
                    });

                }
            }
            if (finalCharts.gaPageTechnicalEfficiencyTable.length > 0) {
                if (finalCharts.gaPageTechnicalEfficiencyTable[0].values.length > 0) {

                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.gaPageTechnicalEfficiencyTable,
                        'data': finalCharts.gaPageTechnicalEfficiencyTable[0].values
                    });

                }
            }
            if (finalCharts.gaVisitorAcquisitionEfficiencyAnalysisTable.length > 0) {
                if (finalCharts.gaVisitorAcquisitionEfficiencyAnalysisTable[0].values.length > 0) {

                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.gaVisitorAcquisitionEfficiencyAnalysisTable,
                        'data': finalCharts.gaVisitorAcquisitionEfficiencyAnalysisTable[0].values
                    });

                }
            }
            if (finalCharts.pageTechnicalEfficiency.length > 0) {
                var chartOptionsArray = [];
                var chartSeriesArray = [];
                chartsCount++;
                for (var charts in finalCharts.pageTechnicalEfficiency) {
                    var xArray = [];
                    var chartValues = [];
                    // for (var items in chartColorChecker) {
                    //     if (finalCharts.pageTechnicalEfficiency[charts].color == chartColorChecker[items]) {
                    //         var neededColour = fetchAColour(finalCharts.pageTechnicalEfficiency[charts].color, chartColorChecker);
                    //         finalCharts.pageTechnicalEfficiency[charts].color = neededColour;
                    //     }
                    // }
                    chartValues[0] = [];
                    chartValues[1] = [];
                    for (var k = 0; k < finalCharts.pageTechnicalEfficiency[charts].values.length; k++) {
                        xArray.push(String(finalCharts.pageTechnicalEfficiency[charts].values[k].pageTitle));
                        chartValues[0].push(Number(finalCharts.pageTechnicalEfficiency[charts].values[k].PageLoadTime));
                        chartValues[1].push(Number(finalCharts.pageTechnicalEfficiency[charts].values[k].bounceRate));
                    }
                    for (var i = 0; i < finalCharts.pageTechnicalEfficiency[charts].summary.length; i++) {
                        chartSeriesArray.push({
                            name: finalCharts.pageTechnicalEfficiency[charts].summary[i].key,
                            yAxis: i,
                            tooltip: {
                                valueSuffix: ''
                            },
                            data: chartValues[i], type: i == 0 ? 'column' : 'line',
                            color: finalCharts.pageTechnicalEfficiency[charts].color[i]
                        });
                    }
                    // chartColorChecker.push(finalCharts.pageTechnicalEfficiency[charts].color);
                }
                chartOptions = {
                    chart: {
                        reflow: true,
                        zoomType: 'x'
                    },
                    credits: {
                        enabled: false
                    },
                    exporting: {enabled: false},
                    tooltip: {
                        enabled: true,
                        shared: true
                    },
                    xAxis: {
                        categories: xArray,
                        labels: {
                            formatter: function () {
                                return this.value;
                            }
                        },
                        tickInterval: 1,
                        min: 0,
                        max: xArray.length - 1,
                    },
                    yAxis: [{
                        title: {
                            text: 'Page LoadTime',
                        }
                    }, {
                        title: {
                            text: 'Bounce Rate',
                        },
                        opposite: true
                    }],
                    title: {
                        text: '',
                        style: {
                            display: 'none'
                        }
                    },
                    series: chartSeriesArray,
                }
                finalChartData.push({
                    'options': graphOptions.visitorAcquisitionEfficiency,
                    'data': finalCharts.pageTechnicalEfficiency,
                    'api': {},
                    'chartOptions': chartOptions
                });
            }
            if (finalCharts.visitorAcquisitionEfficiency.length > 0) {
                var chartOptionsArray = [];
                var chartSeriesArray = [];
                chartsCount++;
                for (var charts in finalCharts.visitorAcquisitionEfficiency) {
                    var xArray = [];
                    var chartValues = [];
                    chartValues[0] = [];
                    chartValues[1] = [];
                    chartValues[2] = [];
                    for (var k = 0; k < finalCharts.visitorAcquisitionEfficiency[charts].values.length; k++) {
                        xArray.push(String(finalCharts.visitorAcquisitionEfficiency[charts].values[k].sourceMedium));
                        chartValues[0].push(Number(finalCharts.visitorAcquisitionEfficiency[charts].values[k].newUsers));
                        chartValues[1].push(Number(finalCharts.visitorAcquisitionEfficiency[charts].values[k].goalValuePerSession));
                        chartValues[2].push(Number(finalCharts.visitorAcquisitionEfficiency[charts].values[k].goalConversionRateAll));
                    }
                    for (var i = 0; i < finalCharts.visitorAcquisitionEfficiency[charts].summary.length; i++) {
                        chartSeriesArray.push({
                            name: finalCharts.visitorAcquisitionEfficiency[charts].summary[i].key,
                            yAxis: i < 1 ? 0 : 1,
                            tooltip: {
                                valueSuffix: ''
                            },
                            data: chartValues[i], type: i < 1 ? 'column' : 'line',
                            color: finalCharts.visitorAcquisitionEfficiency[charts].color[i]
                        });
                    }
                    //    chartColorChecker.push(finalCharts.visitorAcquisitionEfficiency[charts].color);
                }
                chartOptions = {
                    chart: {
                        reflow: true,
                        zoomType: 'x'
                    },
                    credits: {
                        enabled: false
                    },
                    exporting: {enabled: false},
                    tooltip: {
                        enabled: true,
                        shared: true
                    },
                    xAxis: {
                        categories: xArray,
                        labels: {
                            formatter: function () {
                                return this.value;
                            }
                        },
                        tickInterval: 1,
                        min: 0,
                        max: xArray.length - 1,
                    },
                    yAxis: [{
                        title: {
                            text: 'New users',
                        }
                    }, {
                        title: {
                            text: 'Goal value & Goal conversion rate',
                        },
                        opposite: true
                    }],
                    title: {
                        text: '',
                        style: {
                            display: 'none'
                        }
                    },
                    series: chartSeriesArray,
                }
                finalChartData.push({
                    'options': graphOptions.visitorAcquisitionEfficiency,
                    'data': finalCharts.visitorAcquisitionEfficiency,
                    'api': {},
                    'chartOptions': chartOptions
                });
            }
            if (finalCharts.gaSocialMediaOverview.length > 0) {
                var chartOptionsArray = [];
                var chartSeriesArray = [];
                chartsCount++;
                for (var charts in finalCharts.gaSocialMediaOverview) {
                    for (var k = 0; k < finalCharts.gaSocialMediaOverview[charts].values.length; k++) {
                        chartSeriesArray.push({
                            x: Number(finalCharts.gaSocialMediaOverview[charts].values[k].pageviewsPersession),
                            y: Number(finalCharts.gaSocialMediaOverview[charts].values[k].sessions),
                            z: Number(finalCharts.gaSocialMediaOverview[charts].values[k].avgtimeOnPage),
                            name: String(finalCharts.gaSocialMediaOverview[charts].values[k].socialNetwork) === '(none)' ? 'Direct' : String(finalCharts.gaSocialMediaOverview[charts].values[k].socialNetwork)
                        })
                    }
                }
                chartOptions = {
                    chart: {
                        reflow: true,
                        type: 'bubble',
                        zoomType: 'xy'
                    },
                    legend: {
                        enabled: false
                    },
                    credits: {
                        enabled: false
                    },
                    exporting: {enabled: false},
                    tooltip: {
                        useHTML: true,
                        headerFormat: '<table>',
                        pointFormat: '<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
                        '<tr><th>Page Views Per Session:</th><td>{point.x}</td></tr>' +
                        '<tr><th>Sessions:</th><td>{point.y}</td></tr>' +
                        '<tr><th>Time on Page:</th><td>{point.z}</td></tr>',
                        footerFormat: '</table>',
                        enabled: true,
                        shared: true
                    },
                    xAxis: {
                        labels: {
                            formatter: function () {
                                return this.value;
                            }
                        },
                        title: {
                            text: 'Page Views Per Session'
                        }
                    },
                    yAxis: {
                        title: {
                            text: 'Sessions',
                        }
                    },
                    title: {
                        text: '',
                        style: {
                            display: 'none'
                        }
                    },
                    plotOptions: {
                        series: {
                            dataLabels: {
                                enabled: true,
                                format: '{point.name}'
                            }
                        }
                    },
                    series: [{data: chartSeriesArray}],
                }
                finalChartData.push({
                    'options': graphOptions.visitorAcquisitionEfficiency,
                    'data': finalCharts.gaSocialMediaOverview,
                    'api': {},
                    'chartOptions': chartOptions
                });
            }
            if (finalCharts.topReferringSites.length > 0) {

                var chartOptionsArray = [];
                var chartSeriesArray = [];
                chartsCount++;
                for (var charts in finalCharts.topReferringSites) {
                    var xArray = [];
                    var chartValues = [];
                    chartValues[0] = [];
                    chartValues[1] = [];
                    chartValues[2] = [];
                    for (var k = 0; k < finalCharts.topReferringSites[charts].values.length; k++) {
                        xArray.push(String(finalCharts.topReferringSites[charts].values[k].source));
                        chartValues[0].push(Number(finalCharts.topReferringSites[charts].values[k].sessions));
                        chartValues[1].push(Number(finalCharts.topReferringSites[charts].values[k].goalCompletions));
                        chartValues[2].push(Number(finalCharts.topReferringSites[charts].values[k].goalConversionRate));
                    }
                    for (var i = 0; i < finalCharts.topReferringSites[charts].summary.length; i++) {
                        chartSeriesArray.push({
                            name: finalCharts.topReferringSites[charts].summary[i].key,
                            yAxis: i <= 1 ? 0 : 1,
                            tooltip: {
                                valueSuffix: ''
                            },
                            data: chartValues[i], type: i < 1 ? 'column' : 'line',
                            color: finalCharts.topReferringSites[charts].color[i]
                        });
                        //    chartColorChecker.push(finalCharts.visitorAcquisitionEfficiency[charts].color);
                    }
                }
                chartOptions = {
                    chart: {
                        reflow: true,
                        zoomType: 'x'
                    },
                    credits: {
                        enabled: false
                    },
                    exporting: {enabled: false},
                    tooltip: {
                        enabled: true,
                        shared: true
                    },
                    xAxis: {
                        categories: xArray,
                        labels: {
                            formatter: function () {
                                return this.value;
                            }
                        },
                        tickInterval: 1,
                        min: 0,
                        max: xArray.length - 1,
                    },
                    yAxis: [{
                        title: {
                            text: 'Sessions & Goal completions',
                        }
                    }, {
                        title: {
                            text: 'Goal conversion rate',
                        },
                        opposite: true
                    }],
                    title: {
                        text: '',
                        style: {
                            display: 'none'
                        }
                    },
                    series: chartSeriesArray,
                }
                finalChartData.push({
                    'options': graphOptions.visitorAcquisitionEfficiency,
                    'data': finalCharts.topReferringSites,
                    'api': {},
                    'chartOptions': chartOptions
                });
            }
            if (finalCharts.pageContentEfficiency.length > 0) {
                var chartSeriesArray = [];
                chartsCount++;
                for (var charts in finalCharts.pageContentEfficiency) {
                    var xArray = [];
                    var chartValues = [];
                    // for (var items in chartColorChecker) {
                    //     if (finalCharts.pageContentEfficiency[charts].color == chartColorChecker[items]) {
                    //         var neededColour = fetchAColour(finalCharts.pageTechnicalEfficiency[charts].color, chartColorChecker);
                    //         finalCharts.pageTechnicalEfficiency[charts].color = neededColour;
                    //     }
                    // }
                    chartValues[0] = [];
                    chartValues[1] = [];
                    chartValues[2] = [];
                    chartValues[3] = []
                    for (var k = 0; k < finalCharts.pageContentEfficiency[charts].values.length; k++) {
                        xArray.push(String(finalCharts.pageContentEfficiency[charts].values[k].pageTitle));
                        chartValues[0].push(Number(finalCharts.pageContentEfficiency[charts].values[k].uniquePageviews));
                        chartValues[1].push(Number(finalCharts.pageContentEfficiency[charts].values[k].pageviews));
                        chartValues[2].push(Number(finalCharts.pageContentEfficiency[charts].values[k].bounceRate));
                        chartValues[3].push(Number(finalCharts.pageContentEfficiency[charts].values[k].entranceRate));
                    }
                    for (var i = 0; i < finalCharts.pageContentEfficiency[charts].summary.length; i++) {
                        chartSeriesArray.push({
                            name: finalCharts.pageContentEfficiency[charts].summary[i].key,
                            yAxis: i < 2 ? 0 : 1,
                            tooltip: {
                                valueSuffix: ''
                            },
                            data: chartValues[i], type: i < 2 ? 'column' : 'line',
                            color: finalCharts.pageContentEfficiency[charts].color[i]
                        });
                        // chartColorChecker.push(finalCharts.pageContentEfficiency[charts].color);
                    }
                }
                chartOptions = {
                    chart: {
                        reflow: true,
                        zoomType: 'x'
                    },
                    credits: {
                        enabled: false
                    },
                    exporting: {enabled: false},
                    tooltip: {
                        enabled: true,
                        shared: true
                    },
                    xAxis: {
                        categories: xArray,
                        labels: {
                            formatter: function () {
                                return this.value;
                            }
                        },
                        tickInterval: 1,
                        min: 0,
                        max: xArray.length - 1,
                    },
                    yAxis: [{
                        title: {
                            text: 'Unique Page views & Page views',
                        }
                    }, {
                        title: {
                            text: 'Entrance Rate & Bounce Rate',
                        },
                        opposite: true
                    }],
                    title: {
                        text: '',
                        style: {
                            display: 'none'
                        }
                    },
                    series: chartSeriesArray,
                }
                finalChartData.push({
                    'options': graphOptions.visitorAcquisitionEfficiency,
                    'data': finalCharts.pageContentEfficiency,
                    'api': {},
                    'chartOptions': chartOptions
                });
            }
            if (finalCharts.pinterestEngagementRate.length > 0) {
                if (finalCharts.pinterestEngagementRate[0].values.length > 0) {
                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.pinterestEngagementRate,
                        'data': finalCharts.pinterestEngagementRate[0].values
                    });

                }
            }
            if (finalCharts.pinterestLeaderboard.length > 0) {
                if (finalCharts.pinterestLeaderboard[0].values.length > 0) {
                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.pinterestLeaderboard,
                        'data': finalCharts.pinterestLeaderboard[0].values
                    });

                }
            }
            if (finalCharts.costPerActionType.length > 0) {
                finalChartData.push({
                    'options': graphOptions.costPerActionType,
                    'data': finalCharts.costPerActionType
                });
            }
            if (finalCharts.mozoverview.length > 0) {
                var dataArray = []
                for (var i = 0; i < finalCharts.mozoverview.length; i++) {
                    var m = finalCharts.mozoverview[i].values.length - 1;
                    switch (finalCharts.mozoverview[i].key) {
                        case 'Links':
                            var links = parseInt(finalCharts.mozoverview[i].values[m].y);
                            break;
                        case 'External equity links':
                            var externalEquityLinks = parseInt(finalCharts.mozoverview[i].values[m].y);
                            break;
                        case 'Domain Authority (/100)':
                            var domainageAuthority = finalCharts.mozoverview[i].values[m].y;
                            break;
                        case 'Page Authority (/100)':
                            var pageAuthority = finalCharts.mozoverview[i].values[m].y;
                            break;
                        case 'Moz Rank (/10)':
                            var mozRankURL = finalCharts.mozoverview[i].values[m].y;
                            break;
                        default:
                            break;
                    }
                }
                var displayData = {
                    mozRankURL: mozRankURL,
                    externalEquityLinks: externalEquityLinks,
                    domainageAuthority: domainageAuthority,
                    links: links,
                    pageAuthority: pageAuthority
                }
                finalChartData.push({
                    'options': graphOptions.mozoverview,
                    'data': finalCharts.mozoverview,
                    'displayData': displayData
                });
            }
            if (finalCharts.angularGauge.length > 0) {
                if (finalCharts.angularGauge[0].y != 0) {
                    chartsCount++;
                    chartOptions = {
                        chart: {
                            type: 'gauge',
                            plotBackgroundColor: null,
                            plotBackgroundImage: null,
                            plotBorderWidth: 0,
                            plotShadow: false
                        },
                        credits: {
                            enabled: false
                        },
                        exporting: {enabled: false},
                        // pane: {
                        //     startAngle: 0,
                        //     endAngle: 360,
                        //     background: [{
                        //         backgroundColor: {
                        //             linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        //             stops: [
                        //                 [0, '#FFF'],
                        //                 [1, '#333']
                        //             ]
                        //         },
                        //         borderWidth: 0,
                        //         outerRadius: '109%'
                        //     }, {
                        //         backgroundColor: {
                        //             linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        //             stops: [
                        //                 [0, '#333'],
                        //                 [1, '#FFF']
                        //             ]
                        //         },
                        //         borderWidth: 1,
                        //         outerRadius: '107%'
                        //     }, {
                        //         // default background
                        //     }, {
                        //         backgroundColor: '#DDD',
                        //         borderWidth: 0,
                        //         outerRadius: '105%',
                        //         innerRadius: '103%'
                        //     }]
                        // },
                        yAxis: {
                            min: 0,
                            max: 100,
                            minorTickInterval: 'auto',
                            minorTickWidth: 1,
                            minorTickLength: 10,
                            minorTickPosition: 'inside',
                            minorTickColor: '#666',
                            tickPixelInterval: 30,
                            tickWidth: 2,
                            tickPosition: 'inside',
                            tickLength: 10,
                            tickColor: '#666',
                            title: {
                                text: 'Post/day'
                            },
                            plotBands: [{
                                from: 0,
                                to: 20,
                                color: '#55BF3B' // green
                            }, {
                                from: 20,
                                to: 60,
                                color: '#DDDF0D' // yellow
                            }, {
                                from: 60,
                                to: 100,
                                color: '#DF5353' // red
                            }]
                        },

                        title: {
                            text: '',
                            style: {
                                display: 'none'
                            }
                        },
                        series: [{
                            name: 'Post Per Day',
                            data: [finalCharts.angularGauge[0].y],
                            tooltip: {
                                valueSuffix: ' post/day'
                            }
                        }]
                    }
                }

                finalChartData.push({
                    'options': graphOptions.pieDataOptions,
                    'data': finalCharts.angularGauge,
                    'chartOptions': chartOptions
                });
            }
            if (finalCharts.instagramHashtagLeaderBoard.length > 0) {
                if (finalCharts.instagramHashtagLeaderBoard[0].values.length > 0) {
                    chartsCount++;
                    finalChartData.push({
                        'options': graphOptions.instagramHashtagLeaderBoard,
                        'data': finalCharts.instagramHashtagLeaderBoard[0].values
                    });
                }
            }
            if (finalCharts.twitterEngagements.length > 0) {
                chartsCount++;
                for (var charts in finalCharts.twitterEngagements) {
                    if (finalCharts.twitterEngagements[charts].chartSubType == 'activityByDayOfTheWeek' || finalCharts.twitterEngagements[charts].chartSubType == 'instagramActivityByDayOfTheWeek') {
                        var chartSeriesArray = [];
                        var xArray = [];
                        var chartValues = [];
                        chartValues[0] = [];
                        chartValues[1] = [];
                        for (var k = 0; k < finalCharts.twitterEngagements[charts].values.length; k++) {
                            xArray.push(String(finalCharts.twitterEngagements[charts].values[k].day));
                            chartValues[0].push(Number(finalCharts.twitterEngagements[charts].values[k].tweets));
                            chartValues[1].push(Number(finalCharts.twitterEngagements[charts].values[k].engagement));
                        }
                        if (finalCharts.twitterEngagements[charts].chartSubType == 'activityByDayOfTheWeek') {
                            var xLabel = 'Tweets';
                            var yLabel = 'Tweets count'
                        }
                        else {
                            var xLabel = 'Posts';
                            var yLabel = 'Posts count'
                        }

                        for (var i = 0; i < chartValues.length; i++) {
                            chartSeriesArray.push({
                                name: i < 1 ? xLabel : 'Engagements',
                                yAxis: i < 1 ? 0 : 1,
                                tooltip: {
                                    valueSuffix: ''
                                },
                                data: chartValues[i], type: i < 1 ? 'column' : 'line',
                                color: finalCharts.twitterEngagements[charts].color[i]
                            });
                            //    chartColorChecker.push(finalCharts.visitorAcquisitionEfficiency[charts].color);
                        }
                        chartOptions = {
                            chart: {
                                reflow: true,
                                zoomType: 'x'
                            },
                            credits: {
                                enabled: false
                            },
                            exporting: {enabled: false},
                            tooltip: {
                                enabled: true,
                                shared: true
                            },
                            xAxis: {
                                categories: xArray,
                                labels: {
                                    formatter: function () {
                                        return this.value;
                                    }
                                },
                                tickInterval: 1,
                                min: 0,
                                max: xArray.length - 1,
                            },
                            yAxis: [{
                                title: {
                                    text: yLabel,
                                }
                            }, {
                                title: {
                                    text: 'Engagement count',
                                },
                                opposite: true
                            }],
                            title: {
                                text: '',
                                style: {
                                    display: 'none'
                                }
                            },
                            series: chartSeriesArray,
                        }
                        finalChartData.push({
                            'options': graphOptions.visitorAcquisitionEfficiency,
                            'data': finalCharts.twitterEngagements,
                            'api': {},
                            'chartOptions': chartOptions
                        });
                    }
                    else if (finalCharts.twitterEngagements[charts].chartSubType == 'activityByTimeOfTheDay' || finalCharts.twitterEngagements[charts].chartSubType == 'instagramActivityByTimeOfTheDay') {
                        var chartSeriesArray = [];
                        for (var charts in finalCharts.twitterEngagements) {
                            for (var k = 0; k < finalCharts.twitterEngagements[charts].values.length; k++) {
                                if (String(finalCharts.twitterEngagements[charts].values[k].day) == 'Sunday')
                                    var x = 0
                                else if (String(finalCharts.twitterEngagements[charts].values[k].day) == 'Monday')
                                    var x = 1
                                else if (String(finalCharts.twitterEngagements[charts].values[k].day) == 'Tuesday')
                                    var x = 2
                                else if (String(finalCharts.twitterEngagements[charts].values[k].day) == 'Wednesday')
                                    var x = 3
                                else if (String(finalCharts.twitterEngagements[charts].values[k].day) == 'Thursday')
                                    var x = 4
                                else if (String(finalCharts.twitterEngagements[charts].values[k].day) == 'Friday')
                                    var x = 5
                                else if (String(finalCharts.twitterEngagements[charts].values[k].day) == 'Saturday')
                                    var x = 6
                                chartSeriesArray.push({
                                    x: x,
                                    y: Number(finalCharts.twitterEngagements[charts].values[k].time),
                                    z: Number(finalCharts.twitterEngagements[charts].values[k].engagement),
                                    color: finalCharts.twitterEngagements[charts].color[x]
                                })
                            }
                        }
                        chartOptions = {
                            chart: {
                                reflow: true,
                                type: 'bubble',
                                zoomType: 'xy'
                            },
                            legend: {
                                enabled: false
                            },
                            credits: {
                                enabled: false
                            },
                            exporting: {enabled: false},
                            tooltip: {
                                useHTML: true,
                                headerFormat: '<table>',
                                pointFormat: '<tr><th>Time:</th><td>{point.y}</td></tr>' +
                                '<tr><th>Engagement:</th><td>{point.z}</td></tr>',
                                footerFormat: '</table>',
                                enabled: true,
                                shared: true
                            },
                            xAxis: {
                                labels: {},
                                categories: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                                title: {
                                    text: 'Day'
                                }
                            },
                            yAxis: {
                                title: {
                                    text: 'Time',
                                },
                                min: 0,
                                max: 28,
                                tickInterval: 7
                            },
                            title: {
                                text: '',
                                style: {
                                    display: 'none'
                                }
                            },
                            plotOptions: {
                                series: {
                                    dataLabels: {
                                        enabled: false,
                                    }
                                }
                            },
                            series: [{data: chartSeriesArray}],
                        }
                        finalChartData.push({
                            'options': graphOptions.visitorAcquisitionEfficiency,
                            'data': finalCharts.twitterEngagements,
                            'api': {},
                            'chartOptions': chartOptions
                        });
                    }
                    else if (finalCharts.twitterEngagements[charts].chartSubType == 'commentsAndLikes') {
                        var chartSeriesArray = [];
                        var categoriesArray = [];
                        for (var charts in finalCharts.twitterEngagements) {
                            var tempArray = [];
                            for (var k = 0; k < finalCharts.twitterEngagements[charts].values.length; k++) {
                                tempArray.push(finalCharts.twitterEngagements[charts].values[k].x)
                            }
                            categoriesArray = _.uniqBy(tempArray);
                        }
                        for (var charts in finalCharts.twitterEngagements) {
                            for (var k = 0; k < finalCharts.twitterEngagements[charts].values.length; k++) {
                                var x = _.indexOf(categoriesArray, finalCharts.twitterEngagements[charts].values[k].x);
                                chartSeriesArray.push({
                                    x: x,
                                    y: Number(finalCharts.twitterEngagements[charts].values[k].y),
                                    z: Number(finalCharts.twitterEngagements[charts].values[k].y),
                                    color: finalCharts.twitterEngagements[charts].color[x],
                                    link: finalCharts.twitterEngagements[charts].values[k].link,
                                    date: categoriesArray[x],
                                })
                            }
                        }
                        chartOptions = {
                            chart: {
                                reflow: true,
                                type: 'bubble',
                                zoomType: 'xy'
                            },
                            legend: {
                                enabled: false
                            },
                            credits: {
                                enabled: false
                            },
                            exporting: {enabled: false},
                            tooltip: {
                                useHTML: true,
                                headerFormat: '<table>',
                                pointFormat: '<tr><th>Date:</th><td>{point.date}</td></tr>' +
                                '<tr><th>Engagement:</th><td>{point.y}</td></tr>' +
                                '<tr><th>Link:</th><td>{point.link}</td></tr>',
                                footerFormat: '</table>',
                                enabled: true,
                                shared: true
                            },
                            xAxis: {
                                labels: {},
                                categories: categoriesArray,
                                title: {
                                    text: 'Date'
                                }
                            },
                            yAxis: {
                                title: {
                                    text: 'Engagements',
                                },
                            },
                            title: {
                                text: '',
                                style: {
                                    display: 'none'
                                }
                            },
                            plotOptions: {
                                series: {
                                    dataLabels: {
                                        enabled: false,
                                    }
                                }
                            },
                            series: [{data: chartSeriesArray}],
                        }
                        finalChartData.push({
                            'options': graphOptions.visitorAcquisitionEfficiency,
                            'data': finalCharts.twitterEngagements,
                            'api': {},
                            'chartOptions': chartOptions
                        });
                    }
                    else if (finalCharts.twitterEngagements[charts].chartSubType === 'topLinks' || finalCharts.twitterEngagements[charts].chartSubType === 'hashTag') {
                        var chart = {
                            chart: {
                                type: finalCharts.twitterEngagements[charts].chartSubType
                            }
                        }

                        finalChartData.push({
                            'options': chart,
                            'data': finalCharts.twitterEngagements[0].values
                        });

                    }
                    else if (finalCharts.twitterEngagements[charts].chartSubType === 'engagementByUsersTalkedAbout' || finalCharts.twitterEngagements[charts].chartSubType === 'hashTag') {
                        var chart = {
                            chart: {
                                type: finalCharts.twitterEngagements[charts].chartSubType
                            }
                        }

                        finalChartData.push({
                            'options': chart,
                            'data': finalCharts.twitterEngagements[0].values
                        });
                    }

                }
            }
            if (finalCharts.youtubeVideosOverview.length > 0) {
                chartsCount++;
                for (var charts in finalCharts.youtubeVideosOverview) {
                    var chart = {
                        chart: {
                            type: finalCharts.youtubeVideosOverview[charts].type
                        }
                    }
                    finalChartData.push({
                        'options': chart,
                        'data': finalCharts.youtubeVideosOverview[0].values
                    });
                }
            }
            if (finalChartData.length == 0) {
                if (widget.widgetType == 'custom') {
                    var customDataUrl = '';
                    if (window.location.hostname == "localhost")
                        customDataUrl = "http://localhost:8080/api/v1/create/customdata/" + widget._id;
                    else
                        customDataUrl = window.location.hostname + "/api/v1/create/customdata/" + widget._id;
                    finalChartData.push({
                        'options': graphOptions.emptyCharts,
                        'data': [{message: 'No data for chosen date range. ' + 'Please send your data to: ' + customDataUrl}]
                    });
                }
                else {
                    finalChartData.push({
                        'options': graphOptions.emptyCharts,
                        'data': [{message: 'No data for chosen date range'}]
                    });
                }
            }
            var setLayoutOptions = function () {
                sizeY = typeof widget.size != 'undefined' ? widget.size.h : 3;
                sizeX = typeof widget.size != 'undefined' ? widget.size.w : 3;
                for (var i = 0; i < widgetLayoutOptions.length; i++) {
                    if (widgetLayoutOptions[i].W == sizeX && widgetLayoutOptions[i].H == sizeY && widgetLayoutOptions[i].N == chartsCount) {
                        individualGraphWidthDivider = widgetLayoutOptions[i].c;
                        individualGraphHeightDivider = widgetLayoutOptions[i].r;
                    }
                }
            };
            setLayoutOptions();
            if (widget.widgetType == 'custom') chartName = "Custom Data";
            else chartName = (typeof widget.name != 'undefined' ? widget.name : '');
            if(finalChartData[0].data[0].displaySummary != undefined && finalChartData[0].data[0].displaySummary === false ){
                var modifiedWidget = {
                    'showSummary': false,
                    'name': chartName,
                    'visibility': true,
                    'id': widget._id,
                    'color': widget.color,
                    'chart': finalChartData,
                    'layoutOptionsX': individualGraphWidthDivider,
                    'layoutOptionsY': individualGraphHeightDivider
                };
            }
            else if (typeof finalChartData[0].data[0].key != 'undefined') {
                var modifiedWidget = {
                    'name': chartName,
                    'visibility': true,
                    'id': widget._id,
                    'color': widget.color,
                    'chart': finalChartData,
                    'layoutOptionsX': individualGraphWidthDivider,
                    'layoutOptionsY': individualGraphHeightDivider
                };
            }
            else {
                var modifiedWidget = {
                    'showSummary': false,
                    'name': chartName,
                    'visibility': true,
                    'id': widget._id,
                    'color': widget.color,
                    'chart': finalChartData,
                    'layoutOptionsX': individualGraphWidthDivider,
                    'layoutOptionsY': individualGraphHeightDivider
                };
            }
            deferred.resolve(modifiedWidget);
            return deferred.promise;
        }

        function isValidDate(value) {
            var dateWrapper = new Date(value);
            return !isNaN(dateWrapper.getDate());
        }
    };
});

showMetricApp.service('generateChartColours', function () {

    //To fetch colours for all the charts in a widget
    this.fetchRandomColors = function (iterator) {
        var colourChart = ['#EF5350', '#EC407A', '#9C27B0', '#42A5F5', '#26A69A', '#FFCA28', '#FF7043', '#8D6E63'];
        var colourRepeatChecker = [];

        var randomColour;

        while (colourRepeatChecker.length < iterator) {
            randomColour = colourChart[Math.floor(Math.random() * (colourChart.length - 1)) + 1];
            if (colourRepeatChecker.indexOf(randomColour) == -1) {
                colourRepeatChecker.push(randomColour);
            } else if (colourRepeatChecker.length > colourChart.length) {
                if (colourRepeatChecker.indexOf(randomColour, (colourChart.length - 1)) == -1)
                    colourRepeatChecker.push(randomColour);
            }
        }
        return colourRepeatChecker;
    };

    //To fetch colours for the widget header
    this.fetchWidgetColor = function (channelName) {
        var colourChart = ['#EF5350', '#EC407A', '#9C27B0', '#42A5F5', '#26A69A', '#FFCA28', '#FF7043', '#8D6E63'];
        var widgetColor;
        switch (channelName) {
            case 'Facebook':
                widgetColor = '#3B5998';
                break;
            case 'Google Analytics':
                widgetColor = '#F26630';
                break;
            case 'Twitter':
                widgetColor = '#5EA9DD';
                break;
            case 'FacebookAds':
                widgetColor = '#4E5664';
                break;
            case 'GoogleAdwords':
                widgetColor = '#1A925A';
                break;
            case 'Instagram':
                widgetColor = '#895A4D';
                break;
            case 'YouTube':
                widgetColor = '#CC181E';
                break;
            default:
                widgetColor = '#04509B';
                break;
        }

        return widgetColor;
    };

});