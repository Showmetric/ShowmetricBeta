showMetricApp.controller('SharedDashboardController',SharedDashboardController);

function SharedDashboardController($scope,$timeout,$rootScope,$http,$window,$state,$stateParams,createWidgets,$q) {
    var dashboardId;
    $scope.loading=false;
    $scope.$window = $window;
    $scope.autoArrangeGrid = false;
    $scope.currentDate=moment(new Date()).format("YYYY-DD-MM");
    $scope.summaryAlignLessThanThree = [];
    $scope.toDisplayAllSummary = [];
    $scope.checkAllGraphsZero = function (chart, widgetIndex) {
        var count = 0;
        for (var i = 0; i < chart.data.length; i++) {
            if (chart.data[i].summaryDisplay === 0)
                count += 1;
        }
        $scope.summaryAlignLessThanThree[widgetIndex]=chart.data.length - count;
        if (count === chart.data.length) $scope.toDisplayAllSummary[widgetIndex] = true;
    }
    //Sets up all the required parameters for the dashboard to function properly when it is initially loaded. This is called in the ng-init function of the dashboard template
    $scope.dashboardConfiguration = function () {
        //To set height for Window scroller in dashboard Template
        $scope.docHeight = window.innerHeight;
        $scope.docHeight = $scope.docHeight - 60;

        //Defining configuration parameters for dashboard layout
        $scope.dashboard = {widgets: [], widgetData: []};
        $scope.dashboard.dashboardName = '';
        $scope.widgetsPresent = true;
        $scope.spinerEnable = true;
        $scope.loadedWidgetCount = 0;
        $scope.widgetErrorCode = 0;
        $scope.startDate;
        $scope.endDate;


        $scope.fetchDateForDashboard = function () {
            var dateRange;
            var dahboardId='undefined'
            $http({
                method: 'GET',
                url: '/api/v1/getSubscriptionFromDashboard/' + dahboardId,
                params: {dashboardId:$state.params.id}
            }).then(
                function successCallback(response) {
                    if (response.status == 200) {
                        dateRange = response.data.response.limits.dateRange;
                        $scope.userModifyDate(dateRange)
                    }
                    else{
                        $scope.userModifyDate(365)
                    }
                    // $scope.userModifyDate(startDate,endDate)
                }
            )
        };

        $scope.fetchDateForDashboard();

        //To define the calendar in dashboard header
        $scope.userModifyDate = function (dateRange) {
            $scope.dashboardCalendar = new Calendar({
                element: $('.daterange--double'),
                earliest_date: moment(new Date()).subtract(dateRange, 'days'),
                latest_date: new Date(),
                start_date: moment(new Date()).subtract(30,'days'),
                end_date: new Date(),
                callback: function () {
                    var start = moment(this.start_date).format('ll'), end = moment(this.end_date).format('ll');
                    $scope.populateDashboardWidgets();
                }
            });
            $scope.populateDashboardWidgets();
        };


        $scope.setChartSize = function (index, childIndex) {
            $timeout(callAtTimeout, 100);
            function callAtTimeout() {
                if (document.getElementById('chartOptions' + index) != null) {
                    var parentWidth = document.getElementById('chartOptions' + index).offsetWidth;
                    var parentHeight = document.getElementById('chartOptions' + index).offsetHeight;
                    document.getElementById('chartRepeat' + index + '-' + childIndex).style.height = parentHeight + 'px'
                    document.getElementById('chartRepeat' + index + '-' + childIndex).style.width = parentWidth + 'px';
                }
            }
        }


        //Setting up grid configuration for widgets
        $scope.gridsterOptions = {
            sparse: true,
            margins: [20, 20],
            maxRows: 500,
            columns: 6,
            defaultSizeX: 2,
            defaultSizeY: 2,
            minSizeX: 1,
            minSizeY: 1,
            swapping: true,
            float: true,
            pushing: true,
            width: 'auto',
            colWidth:'auto',
            draggable: {
                enabled: false
            },
            outerMargin: true, // whether margins apply to outer edges of the grid
            mobileBreakPoint: 700,
            mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
            resizable: {
                enabled: false
            }
        };

        $scope.$on('gridster-resized', function(sizes, gridster) {
            for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 10);
            }
            function resizeWidget(k) {
                return function() {
                    if (document.getElementById('chartOptions' + k) != null) {
                        var parentWidth = document.getElementById('chartOptions' + k).offsetWidth;
                        var parentHeight = document.getElementById('chartOptions' + k).offsetHeight;
                        for (var i = 0; i < Highcharts.charts.length; i++) {
                            if (Highcharts.charts[i].container.parentElement.id.includes('chartRepeat' + k)) {
                                Highcharts.charts[i].setSize(parentWidth, parentHeight); // reflow the first chart..
                                Highcharts.charts[i].reflow(); // reflow the chart..
                            }
                        }
                    }
                };
            }
        });

        $scope.$on('gridster-mobile-changed', function( e,gridster) {
            $scope.isMobile = gridster.isMobile;
        });

        angular.element($window).on('resize', function (e) {
            //To set height for Window scroller in dashboard Template
            $scope.docHeight = window.innerHeight;
            $scope.docHeight = $scope.docHeight-60;
            $scope.$broadcast('resize');
        });

        $scope.$on('resize',function(e){
            for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 100);
            }
            function resizeWidget(k) {
                return function() {
                    if (document.getElementById('chartOptions' + k) != null) {
                        var parentWidth = document.getElementById('chartOptions' + k).offsetWidth;
                        var parentHeight = document.getElementById('chartOptions' + k).offsetHeight;
                        for (var i = 0; i < Highcharts.charts.length; i++) {
                            if (Highcharts.charts[i].container.parentElement.id.includes('chartRepeat' + k)) {
                                Highcharts.charts[i].setSize(parentWidth, parentHeight); // reflow the first chart..
                                Highcharts.charts[i].reflow(); // reflow the chart..
                            }
                        }
                    }
                };
            }
        });
        $scope.calculateColumnWidth = function(noOfItems,widgetWidth,noOfCharts) {

            widgetWidth = Math.floor(widgetWidth/noOfCharts);
            if(widgetWidth < 1)
                widgetWidth = 1;

            if(widgetWidth==1)
                return ('col-sm-'+12+' col-md-'+12+' col-lg-'+12);
            else {
                if(widgetWidth==2){
                    if(noOfItems<=2)
                        return ('col-sm-'+12+' col-md-'+12+' col-lg-'+12);
                    else
                        return ('col-sm-'+6+' col-md-'+6+' col-lg-'+6);
                }
                else {
                    if (noOfItems <= 2)
                        return ('col-sm-' + 12 + ' col-md-' + 12 + ' col-lg-' + 12);
                    else if (noOfItems > 2 && noOfItems <= 4)
                        return ('col-sm-'+6+' col-md-'+6+' col-lg-'+6);
                    else
                        return ('col-sm-'+4+' col-md-'+4+' col-lg-'+4);
                }
            }
        };
        $scope.calculateColumnWidthMoz = function (noOfItems, widgetWidth, noOfCharts) {
            if (widgetWidth == 1) {
                return ('col-sm-' + 12 + ' col-md-' + 12 + ' col-lg-' + 12);
            }
            else if ((widgetWidth >= 2) && (widgetWidth <= 4)) {
                return ('col-sm-' + 4 + ' col-md-' + 4 + ' col-lg-' + 4);

            }
            else if (widgetWidth >= 5) {
                return ('col-sm-' + 2 + ' col-md-' + 2 + ' col-lg-' + 2);
            }
        };

        $scope.calculateRowHeight = function(data,noOfItems,widgetWidth,widgetHeight,noOfCharts) {
            /*
             widgetWidth = Math.floor(widgetWidth/noOfCharts);
             if(widgetWidth < 1)
             widgetWidth = 1;

             var cols;

             if(widgetWidth == 1)
             cols =1;
             else {
             if(widgetWidth == 2){
             if(noOfItems <= 2)
             cols=1;
             else
             cols =2;
             }
             else {
             if(noOfItems <= 2)
             cols = 1;
             else if(noOfItems > 2  && noOfItems <= 4)
             cols = 2;
             else
             cols = 3;
             }
             }
             if(cols === 1){
             if(widgetHeight > 1 && noOfItems <= 2)
             data.showComparision = true;
             else
             data.showComparision = false;
             }
             else
             data.showComparision = true;
             */
            data.showComparision = true;
        };

        $scope.calculateSummaryHeight = function (widgetHeight, noOfItems) {
            var heightPercent;

            if (noOfItems == 1 && widgetHeight == 1)
                heightPercent = 20;
            else
                heightPercent = 100 / widgetHeight;
            return {'height': (heightPercent + '%')};

        };
        $scope.calculateSummaryHeightMoz = function (widgetHeight, noOfItems) {
            var heightPercent;

            if(noOfItems==1 && widgetHeight ==1)
                heightPercent = 20;
            else
                heightPercent = 100 / widgetHeight;
            return {'height': (heightPercent + '%')};

        };
        $scope.calculateChartHeight = function (widgetHeight, noOfItems, index) {
            $timeout(function () {
                var heightPercent;
                if(noOfItems==1 && widgetHeight ==1)
                    heightPercent = 80;
                else
                    heightPercent = 100-(100/widgetHeight);
                $scope.chartOptions = (heightPercent + '%')
                var heightUpdate = document.getElementById("updateHeight" + index);
                heightUpdate.style.margin = '0px';
                heightUpdate.style.height = heightPercent + '%';
            }, 1000)
        };
    };

    //To populate all the widgets in a dashboard when the dashboard is refreshed or opened or calendar date range in the dashboard header is changed
    $rootScope.populateDashboardWidgets = function() {
        $scope.dashboard.widgets = [];
        $scope.dashboard.widgetData = [];
        $http({
            method: 'GET',
            url: '/api/v1/dashboards/widgets/'+ null,
            params: {reportId:$state.params.id}
        })
            .then(
                function successCallback(response) {
                    $('.dr-dates').attr( 'contenteditable' , 'false' )
                    if (!response.data) {
                        isExportOptionSet = 0;
                        swal({
                            title: '',
                            text: '<span style = "sweetAlertFont">The requested dashboard has been deleted</span>',
                            html: true
                        });
                    }
                    else {
                        if (response.data.error) {
                            isExportOptionSet = 0;
                            swal({
                                title: '',
                                text: '<span style = "sweetAlertFont">The requested dashboard has no widgets</span>',
                                html: true
                            });
                        }
                        else {
                            dashboardId = response.data.widgetsList._id;
                            $scope.dashboard.dashboardName = response.data.dashboardDetails.name;
                            var widgets = [];
                            var dashboardWidgetList = [];
                            var initialWidgetList = response.data.widgetsList;
                            for (getWidgetInfo in initialWidgetList) {
                                if (initialWidgetList[getWidgetInfo].visibility == true)
                                    dashboardWidgetList.push(initialWidgetList[getWidgetInfo]);
                            }
                            if (dashboardWidgetList.length > 0) {
                                $scope.loadedWidgetCount = 0;
                                $scope.widgetsPresent = true;
                                $scope.spinerEnable = false;
                            }
                            else {
                                $scope.widgetsPresent = false;
                                $scope.spinerEnable = false;
                            }
                            var widgetID = 0;
                            var dashboardWidgets = [];

                            for (var getWidgetInfo in dashboardWidgetList) {
                                dashboardWidgets.push(createWidgets.widgetHandler(dashboardWidgetList[getWidgetInfo], {
                                    'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                                    'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                                }, 'public'));

                                $scope.dashboard.widgets.push({
                                    'row': (typeof dashboardWidgetList[getWidgetInfo].row != 'undefined' ? dashboardWidgetList[getWidgetInfo].row : 0),
                                    'col': (typeof dashboardWidgetList[getWidgetInfo].col != 'undefined' ? dashboardWidgetList[getWidgetInfo].col : 0),
                                    'sizeY': (typeof dashboardWidgetList[getWidgetInfo].size != 'undefined' ? dashboardWidgetList[getWidgetInfo].size.h : 2),
                                    'sizeX': (typeof dashboardWidgetList[getWidgetInfo].size != 'undefined' ? dashboardWidgetList[getWidgetInfo].size.w : 2),
                                    'minSizeY': (typeof dashboardWidgetList[getWidgetInfo].minSize != 'undefined' ? dashboardWidgetList[getWidgetInfo].minSize.h : 1),
                                    'minSizeX': (typeof dashboardWidgetList[getWidgetInfo].minSize != 'undefined' ? dashboardWidgetList[getWidgetInfo].minSize.w : 1),
                                    'maxSizeY': (typeof dashboardWidgetList[getWidgetInfo].maxSize != 'undefined' ? dashboardWidgetList[getWidgetInfo].maxSize.h : 3),
                                    'maxSizeX': (typeof dashboardWidgetList[getWidgetInfo].maxSize != 'undefined' ? dashboardWidgetList[getWidgetInfo].maxSize.w : 3),
                                    'name': (typeof dashboardWidgetList[getWidgetInfo].name != 'undefined' ? dashboardWidgetList[getWidgetInfo].name : ''),
                                    'widgetType': (typeof dashboardWidgetList[getWidgetInfo].widgetType != 'undefined' ? dashboardWidgetList[getWidgetInfo].widgetType : ''),
                                    'isAlert': (typeof dashboardWidgetList[getWidgetInfo].isAlert != 'undefined' ? dashboardWidgetList[getWidgetInfo].isAlert : false),
                                    'id': dashboardWidgetList[getWidgetInfo]._id,
                                    'visibility': false,
                                    'channelName': (typeof dashboardWidgetList[getWidgetInfo].channelName != 'undefined' ? dashboardWidgetList[getWidgetInfo].channelName : '')
                                });
                                $scope.dashboard.widgetData.push({
                                    'id': dashboardWidgetList[getWidgetInfo]._id,
                                    'chart': [],
                                    'visibility': false,
                                    'dataerror': false,
                                    'name': (typeof dashboardWidgetList[getWidgetInfo].name != 'undefined' ? dashboardWidgetList[getWidgetInfo].name : ''),
                                    'color': (typeof dashboardWidgetList[getWidgetInfo].color != 'undefined' ? dashboardWidgetList[getWidgetInfo].color : '')
                                });
                                dashboardWidgets[getWidgetInfo].then(
                                    function successCallback(dashboardWidgets) {
                                        var widgetIndex = $scope.dashboard.widgets.map(function (el) {
                                            return el.id;
                                        }).indexOf(dashboardWidgets.id);
                                        $scope.dashboard.widgetData[widgetIndex] = dashboardWidgets;
                                        isExportOptionSet = 1;
                                        $scope.loadedWidgetCount++;
                                    },
                                    function errorCallback(error) {
                                        if(error.status === 401) {
                                            $("#widgetData-"+error.data.id).hide();
                                            if (error.data.errorstatusCode === 1003) {
                                                $("#widgetData-"+error.data.id).hide();
                                                $("#errorWidgetData-"+error.data.id).hide();
                                                $("#errorWidgetTokenexpire-" + error.data.id).show();
                                                $scope.widgetErrorCode=1;
                                                $scope.loadedWidgetCount++;
                                                isExportOptionSet = 0;
                                            }
                                        }else{
                                            $scope.loadedWidgetCount++;
                                            if(typeof error.data.id != 'undefined') {
                                                $("#widgetData-"+error.data.id).hide();
                                                $("#errorWidgetData-"+error.data.id).show();
                                                $("#errorWidgetTokenexpire-" + error.data.id).hide();
                                                isExportOptionSet=0;
                                            }
                                        }
                                    }
                                );
                            }
                        }
                    }
                },
                function errorCallback(error) {
                    swal({
                        title: '',
                        text: '<span style = "sweetAlertFont">Error in populating widgets! Please refresh the dashboard again</span>',
                        html: true
                    });
                    isExportOptionSet=0;
                }
            );
    };

    $scope.toggleLegends = function (widgetId) {
        for(var widgetData in $scope.dashboard.widgetData) {
            if($scope.dashboard.widgetData[widgetData].id == widgetId) {
                for(var chart in $scope.dashboard.widgetData[widgetData].chart) {
                    if(typeof $scope.dashboard.widgetData[widgetData].chart[chart].options.chart.showLegend != 'undefined') {
                        if($scope.dashboard.widgetData[widgetData].chart[chart].options.chart.showLegend == true)
                            $scope.dashboard.widgetData[widgetData].chart[chart].options.chart.showLegend = false;
                        else
                            $scope.dashboard.widgetData[widgetData].chart[chart].options.chart.showLegend = true;
                    }
                }
            }
        }
    };
}
