showMetricApp.controller('DashboardController',DashboardController);
function DashboardController($scope,$timeout,$rootScope,$http,$window,$state,$stateParams,createWidgets,$q,$compile) {
    var availableBasicWidgets;
    $scope.loading=false;
    $scope.$window = $window;
    $scope.autoArrangeGrid = false;
    $scope.dashbd = { widgets: [], widgetData: []};
    $scope.dashbd.dashboardName='';
    $scope.widgetErrorCode=0;
    $scope.actionTypeEnable={};
    $scope.submitEnable={};
    $scope.messageEnable={};
    var dateRange;
    var expWid = { dashName:[], wid: [], widData: []};
    var cancel = $q.defer();
    $scope.currentDate=moment(new Date()).format("YYYY-DD-MM");
    $scope.widgetsize=function(widgetsizeX){
        if(widgetsizeX==1){
            return {float:"left"}
        }
    };
    //function to check the subscription limits on basic widgets
    $scope.basicwidget= function (){
        toastr.options.positionClass = 'toast-top-right';
        $http(
            {
                method: 'GET',
                url: '/api/v1/subscriptionLimits'+'?requestType='+'basic'
            }
        ).then(
            function successCallback(response) {
                availableBasicWidgets = response.data.availableWidgets;
                if (response.data.isExpired == true)
                    toastr.info('Please renew !');
                else {
                    if (availableBasicWidgets != 0)
                        $state.go("app.reporting.dashboard.basicWidget", {widgetType: 'basic'});

                    else
                        toastr.info("You have reached your Widgets limit. Please upgrade to enjoy more Widgets")
                }
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again</span> .",
                    html: true
                });
            }
        );
    };

    $scope.stateValidation = function(targetState) {
        switch(targetState) {
            case 'basicWidget':
                if($state.includes('app.reporting.dashboard')){
                    toastr.options.closeButton=true;
                    toastr.options.positionClass = 'toast-top-right';
                    $http(
                        {
                            method: 'GET',
                            url: '/api/v1/subscriptionLimits' + '?requestType=' + 'basic'
                        }
                    ).then(
                        function successCallback(response) {
                            availableBasicWidgets = response.data.availableWidgets;
                            if (response.data.isExpired == true)
                                toastr.info('Please renew!');
                            else {
                                if (availableBasicWidgets <= 0)
                                    toastr.info("You have reached your Widgets limit. Please upgrade to enjoy more Widgets")
                                else
                                    $state.go('app.reporting.dashboard.'+targetState,{widgetType:'basic'});
                            }
                        },
                        function errorCallback(error) {
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Something went wrong! Please try Again</span> .",
                                html: true
                            });
                        }
                    );
                    var toStateParams = "{widgetType:'basic'}";

                }
                else
                    toastr.info('Please perform this action from within a dashboard');
                break;
            case 'fusionWidget':
                if($state.includes('app.reporting.dashboard')){

                    //function to chech the subscription limits  of the user on fusion widgets
                    toastr.options.closeButton=true;
                    toastr.options.positionClass = 'toast-top-right';
                    //request to get the subscription details of the user on fusion widgets

                    $http(
                        {
                            method: 'GET',
                            url: '/api/v1/subscriptionLimits' + '?requestType=' + 'fusion'
                        }
                    ).then(
                        function successCallback(response) {
                            availableFusionWidgets = response.data.availableWidgets;
                            if (response.data.isExpired == true)
                                toastr.info('Please renew !');
                            else {
                                if (availableFusionWidgets <= 0)
                                    toastr.info("You have reached your Fusions limit. Please upgrade to enjoy more Fusions")
                                else
                                    $state.go('app.reporting.dashboard.'+targetState);
                            }
                        },
                        function errorCallback(error) {
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Something went wrong! Please try again</span> .",
                                html: true
                            });
                        }
                    );
                }
                else
                    toastr.info('Please perform this action from within a dashboard');
                break;
        }
    };
    var isExportOptionSet = '';
    $(".navbar").css('z-index','1');
    $(".md-overlay").css('background','rgba(0,0,0,0.5)');


    //Sets up all the required parameters for the dashboard to function properly when it is initially loaded. This is called in the ng-init function of the dashboard template
    $scope.dashboardConfiguration = function () {;
        $scope.fetchDateForDashboard=function(){
        $http({
            method: 'GET',
            url: '/api/v1/getSubscriptionFromDashboard/'+ $state.params.id
        }).then(
            function successCallback(response){
                if(response.status==200){
                   dateRange=response.data.response.limits.dateRange;
                    $scope.userModifyDate(dateRange)
                }
                else{
                    $scope.userModifyDate(365)
                }
            }
        )
    };
        $scope.fetchDateForDashboard();

        //To define the calendar in dashboard header
        $scope.userModifyDate=function(dateRange) {
            $scope.dashboardCalendar = new Calendar({
                element: $('.daterange--double'),
                earliest_date: moment(new Date()).subtract(dateRange, 'days'),
                latest_date: new Date(),
                latest_date: new Date(),
                start_date: moment(new Date()).subtract(30,'days'),
                end_date: new Date(),
                callback: function () {
                    var start = moment(this.start_date).format('ll'), end = moment(this.end_date).format('ll');
                    $http.pendingRequests.forEach(function (request) {
                        if (request.cancel)
                            request.cancel.resolve();
                    });
                    $scope.populateDashboardWidgets()
                }
            });
            $scope.fetchDashboardName();
        }

        //To fetch the name of the dashboard from database and display it when the dashboard is loaded
        $scope.fetchDashboardName = function () {
            $http({
                method: 'GET',
                url: '/api/v1/get/dashboards/'+ $state.params.id+'?buster='+new Date()
            }).then(
                function successCallback(response) {
                    if(response.status == '200'){
                        $scope.dashboard.dashboardName =  response.data.name;
                        $rootScope.populateDashboardWidgets();
                    }
                    else
                        $scope.dashboard.dashboardName =  null;
                },
                function errorCallback(error) {
                    $scope.dashboard.dashboardName = null;
                    swal({
                        title: '',
                        text: '<span style="sweetAlertFont">Something went wrong! Please reload the dashboard</span>',
                        html: true
                    });
                }
            );
        };

        //To change the name of the dashboard to user entered value
        $scope.changeDashboardName = function () {
            var jsonData = {
                dashboardId: $state.params.id,
                name: $scope.dashboard.dashboardName
            };
            $http({
                method: 'POST',
                url: '/api/v1/create/dashboards',
                data: jsonData
            }).then(
                function successCallback(response) {
                    if(response.status == '200')
                        $rootScope.fetchRecentDashboards();
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Error in changing the name! Please try again</span> .",
                        html: true
                    });
                }
            );
        };

        //To set height for Window scroller in dashboard Template
        $scope.docHeight = window.innerHeight;
        $scope.docHeight = $scope.docHeight-110;

        //Defining configuration parameters for dashboard layout
        $scope.dashboard = { widgets: [], widgetData: [] };
        $scope.dashboard.dashboardName = '';
        $scope.widgetsPresent = true;
        $scope.spinerEnable = true;
        $scope.loadedWidgetCount = 0;
        $scope.widgetErrorCode=0;
        //get calendar range from db

        /*//To define the calendar in dashboard header
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
            });*/
        $scope.setChartSize = function (index,childIndex) {
            $timeout(callAtTimeout, 100);
            function callAtTimeout() {
                if(document.getElementById('chartOptions'+index)!=null){
                    var parentWidth = document.getElementById('chartOptions'+index).offsetWidth;
                    var parentHeight = document.getElementById('chartOptions'+index).offsetHeight;
                    document.getElementById('chartRepeat'+index+'-'+childIndex).style.height = parentHeight + 'px'
                    document.getElementById('chartRepeat'+index+'-'+childIndex).style.width =parentWidth + 'px';
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
            floating: true,
            pushing: true,
            width: 'auto',
            colWidth:'auto',
            draggable: {
                enabled: true,
                handle: '.box-header',
                stop: function (event, $element, widget) {
                    $rootScope.$broadcast('storeGridStructure',{});
                }
            },
            outerMargin: true, // whether margins apply to outer edges of the grid
            mobileBreakPoint: 700,
            mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
            /*isMobile: false, // stacks the grid items if true*/
            resizable: {
                enabled: true,
                handles: ['se'], //handles: ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'],
                start: function (event, $element, widget) {
                    var getWidgetColor = $("#getWidgetColor-"+widget.id).attr('ref');
                    if(getWidgetColor == '')
                        getWidgetColor='#288DC0';
                    $(".getBox-"+widget.id).css('border','3px solid '+getWidgetColor);
                },
                resize: function (event, $element, widget) {
                    var getWidgetColor = $("#getWidgetColor-" + widget.id).attr('ref');
                    if (getWidgetColor == '') {
                        getWidgetColor = '#288DC0';
                    }
                    $(".getBox-" + widget.id).css('border', '3px solid ' + getWidgetColor);
                        var ind = $scope.dashboard.widgets.indexOf(widget);
                        if(document.getElementById('chartOptions'+ind)!=null){
                            var parentWidth = document.getElementById('chartOptions'+ind).offsetWidth;
                            var parentHeight = document.getElementById('chartOptions'+ind).offsetHeight;
                            for(var i=0;i<Highcharts.charts.length;i++){
                                if(Highcharts.charts[i].container.parentElement.id.includes('chartRepeat'+ind)){
                                    Highcharts.charts[i].setSize(parentWidth,parentHeight); // reflow the first chart..
                                    Highcharts.charts[i].reflow(); // reflow the chart..
                                }
                            }
                        }
                },
                stop: function (event, $element, widget) {
                    $(".getBox-"+widget.id).css('border','1px solid #ccc');
                    $rootScope.$broadcast('storeGridStructure',{});
                    function updateCharts(widget){
                        return function(){
                            var ind = $scope.dashboard.widgets.indexOf(widget);
                            for (var i = 0; i < $scope.dashboard.widgetData[ind].chart.length; i++) {
                                if ($scope.dashboard.widgetData[ind].chart[i].options.chart.type === 'visitorAcquisitionEfficiency' || $scope.dashboard.widgetData[ind].chart[i].options.chart.type === 'lineChart' || $scope.dashboard.widgetData[ind].chart[i].options.chart.type === 'pieChart' || $scope.dashboard.widgetData[ind].chart[i].options.chart.type === 'multiBarChart' || $scope.dashboard.widgetData[ind].chart[i].options.chart.type === 'multiChart') {
                                    for (var j = 0; j < $scope.dashboard.widgetData[ind].chart[i].data.length; j++) {
                                        if($scope.dashboard.widgetData[ind].chart[i].options.chart.type === 'visitorAcquisitionEfficiency')
                                            var elemHeight=0;
                                        else
                                            var elemHeight = document.getElementById('li-' + widget.id + '-' + String(j)).offsetHeight;
                                        $scope.dashboard.widgetData[ind].chart[i].data[j].myheight = elemHeight;
                                        }
                                    }
 /*                               else{
                                    var getWigetId='#getWidgetColor-' + widget.id
                                    var listed = $('#chartTable-'+widget.id).width();
                                    if (listed <= 350){
                                        $('#chartTable-'+widget.id).find('.date').addClass('responsiveDate').removeClass('date');
                                        if($scope.dashboard.widgetData[ind].chart[i].options.chart.type !== 'instagramPosts')
                                             $('#chartTable-'+widget.id).find('.listed').addClass('responsiveListed');
                                        $('#chartTable-'+widget.id).find('.aside').css('padding-left','75px');
                                        $('#chartTable-'+widget.id).find('.impression').css('padding-top','0px');
                                        $('#chartTable-'+widget.id).find('.likes').css('float','none');
                                        $('#chartTable-'+widget.id).find('.comment').css('float','none');
                                        $('#chartTable-'+widget.id).find('.comment').css('margin-left','0px');
                                    }
                                    else {
                                        $('#chartTable-'+widget.id).find('.responsiveDate').addClass('date').removeClass('responsiveDate');
                                        if($scope.dashboard.widgetData[ind].chart[i].options.chart.type !== 'instagramPosts')
                                            $('#chartTable-'+widget.id).find('.listed').removeClass('responsiveListed');
                                        $('#chartTable-'+widget.id).find('.comment').css('float','left');
                                        $('#chartTable-'+widget.id).find('.comment').css('margin-left','5px');
                                        $('#chartTable-'+widget.id).find('.likes').css('float','left');
                                        $('#chartTable-'+widget.id).find('.impression').css('padding-top','15px');
                                        $('#chartTable-'+widget.id).find('.aside').css('padding-left','83px');

                                    }
                                }
 */                           }
                            var ind = $scope.dashboard.widgets.indexOf(widget);
                            if(document.getElementById('chartOptions'+ind)!=null){
                                var parentWidth = document.getElementById('chartOptions'+ind).offsetWidth;
                                var parentHeight = document.getElementById('chartOptions'+ind).offsetHeight;
                                for(var i=0;i<Highcharts.charts.length;i++){
                                    if(Highcharts.charts[i].container.parentElement.id.includes('chartRepeat'+ind)){
                                        Highcharts.charts[i].setSize(parentWidth,parentHeight); // reflow the first chart..
                                        Highcharts.charts[i].reflow(); // reflow the chart..
                                    }
                                }
                            }
                        }
                    }
                    $timeout(updateCharts(widget), 100);
                }
            }
        };


        $scope.changeWidgetName = function (widgetInfo,widgetdata) {
            var inputParams = [];
            var jsonData = {
                "dashboardId": $state.params.id,
                "widgetId": widgetInfo.id,
                "name": widgetdata
            };
            inputParams.push(jsonData);

            $http({
                method: 'POST',
                url: '/api/v1/update/widgets',
                data: inputParams
            }).then(
                function successCallback(response) {
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Error in changing the name! Please try again</span> .",
                        html: true
                    });
                }
            );
        };
        $scope.$on('gridster-resized', function (sizes, gridster, $element) {
            for (var i = 0; i < $scope.dashboard.widgets.length; i++) {
                $timeout(resizeWidget(i), 10);
            }
            function resizeWidget(k) {
                return function () {
                    if(document.getElementById('chartOptions'+k)!=null){
                        var parentWidth = document.getElementById('chartOptions'+k).offsetWidth;
                        var parentHeight = document.getElementById('chartOptions'+k).offsetHeight;
                        for(var i=0;i<Highcharts.charts.length;i++){
                            if(Highcharts.charts[i].container.parentElement.id.includes('chartRepeat'+k)){
                                Highcharts.charts[i].setSize(parentWidth,parentHeight); // reflow the first chart..
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

        $scope.$on('storeGridStructure',function(e){
            var inputParams = [];
            if($scope.dashboard.widgets.length !=0){
                for(var getWidgetInfo in $scope.dashboard.widgets){
                    var jsonData = {
                        dashboardId: $state.params.id,
                        widgetId: $scope.dashboard.widgets[getWidgetInfo].id,
                        name: $scope.dashboard.widgets[getWidgetInfo].name,
                        row: $scope.dashboard.widgets[getWidgetInfo].row,
                        col: $scope.dashboard.widgets[getWidgetInfo].col,
                        size: {
                            h: $scope.dashboard.widgets[getWidgetInfo].sizeY,
                            w: $scope.dashboard.widgets[getWidgetInfo].sizeX
                        },
                        minSize: {
                            h: $scope.dashboard.widgets[getWidgetInfo].minSizeY,
                            w: $scope.dashboard.widgets[getWidgetInfo].minSizeX
                        },
                        maxSize: {
                            h: $scope.dashboard.widgets[getWidgetInfo].maxSizeY,
                            w: $scope.dashboard.widgets[getWidgetInfo].maxSizeX
                        }
                    };
                    inputParams.push(jsonData);
                }
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets',
                    data: inputParams
                }).then(
                    function successCallback(response){
                        for(var i=0;i<$scope.dashboard.widgetData.length;i++)
                        {
                            if($scope.dashboard.widgetData[i].chart.length===0){
                                if($scope.dashboard.widgetData[i].visibility==false){
                                    if($scope.dashboard.widgetData[i].dataerror === true){
                                        $("#widgetData-"+$scope.dashboard.widgetData[i].id).hide();
                                        $("#errorWidgetData-"+$scope.dashboard.widgetData[i].id).hide();
                                        $("#errorWidgetTokenexpire-" + $scope.dashboard.widgetData[i].id).show()
                                    }
                                    else {
                                        if($scope.loadedWidgetCount != $scope.dashboard.widgets.length){
                                            $("#widgetData-"+$scope.dashboard.widgetData[i].id).hide();
                                            $("#errorWidgetData-"+$scope.dashboard.widgetData[i].id).hide();
                                            $("#errorWidgetTokenexpire-" + $scope.dashboard.widgetData[i].id).hide()
                                        }
                                        else {
                                            $("#widgetData-"+$scope.dashboard.widgetData[i].id).hide();
                                            $("#errorWidgetData-"+$scope.dashboard.widgetData[i].id).show();
                                            $("#errorWidgetTokenexpire-" + $scope.dashboard.widgetData[i].id).hide()
                                        }
                                    }

                                }
                            }
                        }
                    },
                    function errorCallback (error){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something is missing! Please refresh the dashboard</span> .",
                            html: true
                        });
                    }
                );
            }
        });

        angular.element($window).on('resize', function (e) {
            $scope.docHeight = window.innerHeight;
            $scope.docHeight = $scope.docHeight-110;
            $scope.$broadcast('resize');
        });

        $scope.$on('resize', function (e) {
            for (var i = 0; i < $scope.dashboard.widgets.length; i++) {
                $timeout(resizeWidget(i), 10);
            }
            function resizeWidget(k) {
                return function () {
                    if(document.getElementById('chartOptions'+k)!=null){
                        var parentWidth = document.getElementById('chartOptions'+k).offsetWidth;
                        var parentHeight = document.getElementById('chartOptions'+k).offsetHeight;
                        for(var i=0;i<Highcharts.charts.length;i++){
                            if(Highcharts.charts[i].container.parentElement.id.includes('chartRepeat'+k)){
                                Highcharts.charts[i].setSize(parentWidth,parentHeight); // reflow the first chart..
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
        $scope.calculateColumnWidthMoz = function(noOfItems,widgetWidth,noOfCharts) {
            if(widgetWidth==1){
                return ('col-sm-'+12+' col-md-'+12+' col-lg-'+12);
            }
            else if((widgetWidth>=2)&& (widgetWidth<=4)){
                return ('col-sm-' + 4 + ' col-md-' + 4 + ' col-lg-' + 4);

            }
            else if(widgetWidth>=5){
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

        $scope.calculateSummaryHeight = function(widgetHeight,noOfItems) {
            var heightPercent;

                if(noOfItems==1 && widgetHeight ==1)
                    heightPercent = 20;
                else
                    heightPercent = 100 / widgetHeight;
                return {'height': (heightPercent + '%')};

        };
        $scope.calculateSummaryHeightMoz = function(widgetHeight,noOfItems) {
            var heightPercent;
            if(widgetHeight ==1)
                heightPercent = 20;
            else
                heightPercent = 70 / widgetHeight;
            return {'height': (heightPercent + '%')};

        };
        $scope.calculateChartHeight = function (widgetHeight, noOfItems,index) {
            $timeout(function () {
                var heightPercent;
                if (noOfItems == 1 && widgetHeight == 1)
                    heightPercent = 80;
                else
                    heightPercent = 100 - (100 / widgetHeight);
                $scope.chartOptions = (heightPercent + '%')
                var heightUpdate = document.getElementById("updateHeight"+index);
                heightUpdate.style.margin = '0px';
                heightUpdate.style.height = heightPercent + '%';
            },1000)


        };

    };

    $scope.getActionType=function(actionType,widgetID){
        if(actionType.length) {
            var key;
            var name;

            var finalList=[]
            $scope.actionTypeEnable[widgetID] = true;
            for(var i=0;i<actionType.length;i++){
                var list={}
                key=actionType[i];
                name=key.replace('_',' ')
                list.name=name;
                list.meta=actionType[i];
                finalList.push(list);
            }
            $scope.actionTypeList = finalList;
        }
        else {
            $scope.actionTypeEnable[widgetID]=false;
            $scope.messageEnable[widgetID]=true;
        }
    };

    $scope.saveMeta=function(widgetId,meta){
        if(meta) $scope.submitEnable[widgetId]=true;
        else $scope.submitEnable[widgetId]=false;
    };

    $scope.reloadDashboard=function(widgetId,meta){
        $scope.actionTypeEnable[widgetId]=false;
        $scope.submitEnable[widgetId]=false;
        var dataUrl = {
            method: 'GET',
            url: '/api/v1/widget/'+ widgetId + '?meta=' +meta.meta+'&buster='+new Date()
        };
        $http(dataUrl).then(
            function successCallback(response) {
                var m = $scope.dashboard.widgets.map(function(e) { return e.id; }).indexOf(widgetId);
                $scope.dashboard.widgets.splice(m,1)
                $scope.dashboard.widgetData.splice(m,1)
                $rootScope.$broadcast('populateWidget', response.data);
                // $rootScope.populateDashboardWidgets();
            },
            function errorCallback() {
                swal({
                    title: '',
                    text: '<span style = "sweetAlertFont">Error in saving the configuration. Please try again</span>',
                    html: true
                });
            }
        )
    };

    //To populate all the widgets in a dashboard when the dashboard is refreshed or opened or calendar date range in the dashboard header is changed
    $rootScope.populateDashboardWidgets = function() {

        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        isExportOptionSet=0;

        $scope.dashboard.widgets = [];
        $scope.dashboard.widgetData = [];
        $scope.dashboard.dashoboardDate=[];
        $scope.dashboard.dashoboardDate= {
            'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
            'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
        }

        $http({
            method: 'GET',
            url: '/api/v1/dashboards/widgets/'+ $state.params.id+'?buster='+new Date(),
            timeout: cancel.promise,
            cancel: cancel // cancel promise, standard thing in $http request
        })
            .then(
                function successCallback(response) {
                    var widgets = [];
                    var dashboardWidgetList = [];
                    var initialWidgetList = response.data.widgetsList;
                    for(getWidgetInfo in initialWidgetList){
                        if(initialWidgetList[getWidgetInfo].visibility == true)
                            dashboardWidgetList.push(initialWidgetList[getWidgetInfo]);
                    }
                    if(dashboardWidgetList.length > 0) {
                        $scope.loadedWidgetCount = 0;
                        $scope.widgetsPresent = true;
                        $scope.spinerEnable = false;
                    }
                    else
                    {
                        $scope.widgetsPresent = false;
                        $scope.spinerEnable = false;
                    }
                    var widgetID=0;
                    var dashboardWidgets = [];
                    var rowNeutral =0;
                    for(var getWidgetInfo in dashboardWidgetList){
                        dashboardWidgets.push(createWidgets.widgetHandler(dashboardWidgetList[getWidgetInfo],{
                            'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                            'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                        }));
                        $scope.dashboard.widgets.push({
                            'row': (typeof dashboardWidgetList[getWidgetInfo].row != 'undefined'? dashboardWidgetList[getWidgetInfo].row : rowNeutral),
                            'col': (typeof dashboardWidgetList[getWidgetInfo].col != 'undefined'? dashboardWidgetList[getWidgetInfo].col : 0),
                            'sizeY': (typeof dashboardWidgetList[getWidgetInfo].size != 'undefined'? dashboardWidgetList[getWidgetInfo].size.h : 2),
                            'sizeX': (typeof dashboardWidgetList[getWidgetInfo].size != 'undefined'? dashboardWidgetList[getWidgetInfo].size.w : 2),
                            'minSizeY': (typeof dashboardWidgetList[getWidgetInfo].minSize != 'undefined'? dashboardWidgetList[getWidgetInfo].minSize.h : 1),
                            'minSizeX': (typeof dashboardWidgetList[getWidgetInfo].minSize != 'undefined'? dashboardWidgetList[getWidgetInfo].minSize.w : 1),
                            'maxSizeY': (typeof dashboardWidgetList[getWidgetInfo].maxSize != 'undefined'? dashboardWidgetList[getWidgetInfo].maxSize.h : 3),
                            'maxSizeX': (typeof dashboardWidgetList[getWidgetInfo].maxSize != 'undefined'? dashboardWidgetList[getWidgetInfo].maxSize.w : 3),
                            'name': (typeof dashboardWidgetList[getWidgetInfo].name != 'undefined'? dashboardWidgetList[getWidgetInfo].name : ''),
                            'widgetType': (typeof dashboardWidgetList[getWidgetInfo].widgetType != 'undefined'? dashboardWidgetList[getWidgetInfo].widgetType : ''),
                            'isAlert':(typeof dashboardWidgetList[getWidgetInfo].isAlert != 'undefined'? dashboardWidgetList[getWidgetInfo].isAlert : false),
                            'isFusion':(typeof dashboardWidgetList[getWidgetInfo].isFusion != 'undefined'? dashboardWidgetList[getWidgetInfo].isFusion : true),
                            'id': dashboardWidgetList[getWidgetInfo]._id,
                            'visibility': false,
                            'channelName':(typeof dashboardWidgetList[getWidgetInfo].channelName != 'undefined'? dashboardWidgetList[getWidgetInfo].channelName : '')
                        });
                        $scope.dashboard.widgetData.push({
                            'id':  dashboardWidgetList[getWidgetInfo]._id,
                            'chart': [],
                            'visibility': false,
                            'dataerror':false,
                            'name': (typeof dashboardWidgetList[getWidgetInfo].name != 'undefined'? dashboardWidgetList[getWidgetInfo].name : ''),
                            'color': (typeof dashboardWidgetList[getWidgetInfo].color != 'undefined'? dashboardWidgetList[getWidgetInfo].color : '')
                        });
                        var sizeY=(typeof dashboardWidgetList[getWidgetInfo].size != 'undefined'? dashboardWidgetList[getWidgetInfo].size.h : 2);
                        rowNeutral+=sizeY;
                        dashboardWidgets[getWidgetInfo].then(
                            function successCallback(dashboardWidgets) {
                                var widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(dashboardWidgets.id);
                                $scope.dashboard.widgetData[widgetIndex] = dashboardWidgets;
                                isExportOptionSet=1;
                                $scope.loadedWidgetCount++;
                            },
                            function errorCallback(error){
                                if(error.status === 401) {
                                    if (error.data.errorstatusCode === 1003) {
                                        k = $scope.dashboard.widgetData.map(function(e) { return e.id; }).indexOf(error.data.id);
                                        if(k !== -1 ){
                                            $scope.dashboard.widgetData[k].dataerror=true;
                                        }
                                        $("#widgetData-"+error.data.id).hide();
                                        $("#errorWidgetData-"+error.data.id).hide();
                                        $("#errorWidgetTokenexpire-" + error.data.id).show();
                                        $scope.widgetErrorCode=1;
                                        $scope.loadedWidgetCount++;
                                        isExportOptionSet = 0;
                                    }
                                }
                                else {
                                    $scope.loadedWidgetCount++;
                                    if(error.data!=null && typeof error.data!='undefined')
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
                },
                function errorCallback(error) {
                    if(error.status!=-1)
                        swal({
                            title: '', 
                            text: '<span style = "sweetAlertFont">Error in populating widgets! Please refresh the dashboard again</span>', 
                            html: true
                        });
                    isExportOptionSet=0;
                }
            );
    };

    //To catch a request for a new widget creation and create the dashboard in the frontend
    $scope.$on('populateWidget', function(e,widget){
        if(widget.widgetType === 'customFusion'){
            for(var i=0;i<widget.widgets.length;i++){
                var m = $scope.dashboard.widgets.map(function(e) { return e.id; }).indexOf(widget.widgets[i].widgetId);
                $scope.dashboard.widgets.splice(m,1)
                $scope.dashboard.widgetData.splice(m,1)
            }
        }
        var inputWidget = [];
        inputWidget.push(createWidgets.widgetHandler(widget,{
            'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
            'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
        }));

        $scope.widgetsPresent = true;
        //To temporarily create an empty widget with same id as the widgetId till all the data required for the widget is fetched by the called service
        $scope.dashboard.widgets.push({
            'row': (typeof widget.row != 'undefined'? widget.row : 0),
            'col': (typeof widget.col != 'undefined'? widget.col : 0),
            'sizeY': (typeof widget.size != 'undefined'? widget.size.h : 2),
            'sizeX': (typeof widget.size != 'undefined'? widget.size.w : 2),
            'minSizeY': (typeof widget.minSize != 'undefined'? widget.minSize.h : 1),
            'minSizeX': (typeof widget.minSize != 'undefined'? widget.minSize.w : 1),
            'maxSizeY': (typeof widget.maxSize != 'undefined'? widget.maxSize.h : 3),
            'maxSizeX': (typeof widget.maxSize != 'undefined'? widget.maxSize.w : 3),
            'name': (typeof widget.name != 'undefined'? widget.name : ''),
            'widgetType':(typeof widget.widgetType != 'undefined'? widget.widgetType : ''),
            'isAlert':(typeof widget.isAlert != 'undefined'? widget.isAlert : false),
            'isFusion':(typeof widget.isAlert != 'undefined'? widget.isFusion : true),
            'id': widget._id,
            //'chart': {'api': {}},
            'visibility': false,
            'channelName':(typeof widget.channelName != 'undefined'? widget.channelName : '')
        });
        $scope.dashboard.widgetData.push({
            'id':  widget._id,
            'chart': [],
            'visibility': false,
            'name': (typeof widget.name != 'undefined'? widget.name : ''),
            'color': (typeof widget.color != 'undefined'? widget.color : '')
        });

        //Fetching the promise that contains all the data for all the widgets in the dashboard
        $q.all(inputWidget).then(
            function successCallback(inputWidget){
                $scope.loadedWidgetCount++;
                var widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(inputWidget[0].id);
                $scope.dashboard.widgetData[widgetIndex] = inputWidget[0];
                isExportOptionSet=1;
            },
            function errorCallback(error){
                if(error.status === 401) {
                    if (error.data.errorstatusCode === 1003) {
                        k = $scope.dashboard.widgetData.map(function(e) { return e.id; }).indexOf(error.data.id);
                        if(k !== -1 ){
                            $scope.dashboard.widgetData[k].dataerror=true;
                        }
                        $("#widgetData-" + widget._id).hide();
                        $("#errorWidgetData-" + widget._id).hide();
                        $("#errorWidgetTokenexpire-" + widget._id).show();
                        $scope.widgetErrorCode=1;
                        $scope.loadedWidgetCount++;
                        isExportOptionSet = 0;
                    }
                } else{
                    $("#widgetData-" + widget._id).hide();
                    $("#errorWidgetData-" + widget._id).show();
                    $("#errorWidgetTokenexpire-" + widget._id).hide()
                    $scope.loadedWidgetCount++;
                    isExportOptionSet = 0;
                }
            }
        );
    });

    //To download a pdf/jpeg version of the dashboard
    $scope.exportModal = function(val){
        $rootScope.expObj = $scope.dashboard;
        $state.go(val);
    };

    //To delete a widget from the dashboard
    $scope.removeWid = function (widget) {
        $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
    };

    $scope.deleteWidget = function(widget){
        var widgetType = widget.widgetType;
        var widgetId = widget.id;
        $http({
            method:'POST',
            url:'/api/v1/delete/widgets/' + widget.id
        }).then(
            function successCallback(response){
                if(widgetType != 'customFusion') {
                    $scope.loadedWidgetCount--;
                    for(var items in $scope.dashboard.widgetData) {
                        if($scope.dashboard.widgetData[items].id == widgetId)
                            $scope.dashboard.widgetData.splice(items,1);
                    }
                    if($scope.dashboard.widgets.length == 0)
                        $scope.widgetsPresent = false;
                }
                else {
                    for(var items in $scope.dashboard.widgetData) {
                        if($scope.dashboard.widgetData[items].id == widgetId)
                            $scope.dashboard.widgetData.splice(items,1);
                    }
                    for (var widgetObjects in response.data.widgetsList) {
                        $rootScope.$broadcast('populateWidget', response.data.widgetsList[widgetObjects]);
                    }
                }
            },
            function errorCallback(error){
                swal({
                    title: '',
                    text: '<span style = "sweetAlertFont">Error in deleting the widget! Please try again</span>',
                    html: true
                });
            }
        );
    };

    //To create alerts
    $scope.alertModal = function(value,widget){
        $rootScope.selectedWidget = widget;
        $state.go(value);
    };

    $scope.reArrangeWidgets = function(){
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        isExportOptionSet=0;

        $scope.gridsterOptions.autogenerate_stylesheet = true;
        var tempWidgetList = $scope.dashboard.widgets;
        var tempWidgetDataList = $scope.dashboard.widgetData;
        $scope.dashboard.widgets = [];
        $scope.dashboard.widgetData = [];

        for(var getWidgetInfo in tempWidgetList) {
            $scope.dashboard.widgets.push({
                'sizeY': (typeof tempWidgetList[getWidgetInfo].sizeY != 'undefined'? tempWidgetList[getWidgetInfo].sizeY : 2),
                'sizeX': (typeof tempWidgetList[getWidgetInfo].sizeX != 'undefined'? tempWidgetList[getWidgetInfo].sizeX : 2),
                'minSizeY': (typeof tempWidgetList[getWidgetInfo].minSizeY != 'undefined'? tempWidgetList[getWidgetInfo].minSizeY : 1),
                'minSizeX': (typeof tempWidgetList[getWidgetInfo].minSizeX != 'undefined'? tempWidgetList[getWidgetInfo].minSizeX : 1),
                'maxSizeY': (typeof tempWidgetList[getWidgetInfo].maxSizeY != 'undefined'? tempWidgetList[getWidgetInfo].maxSizeY : 3),
                'maxSizeX': (typeof tempWidgetList[getWidgetInfo].maxSizeX != 'undefined'? tempWidgetList[getWidgetInfo].maxSizeX : 3),
                'name': (typeof tempWidgetList[getWidgetInfo].name != 'undefined'? tempWidgetList[getWidgetInfo].name : ''),
                'widgetType': (typeof tempWidgetList[getWidgetInfo].widgetType != 'undefined'? tempWidgetList[getWidgetInfo].widgetType : ''),
                'isAlert':(typeof tempWidgetList[getWidgetInfo].isAlert != 'undefined'? tempWidgetList[getWidgetInfo].isAlert : false),
                'isFusion':(typeof tempWidgetList[getWidgetInfo].isAlert != 'undefined'? tempWidgetList[getWidgetInfo].isFusion : true),
                'id': tempWidgetList[getWidgetInfo].id,
                'visibility': false,
                'channelName': (typeof tempWidgetList[getWidgetInfo].channelName != 'undefined'? tempWidgetList[getWidgetInfo].channelName : '')
            });
            $scope.dashboard.widgetData.push(tempWidgetDataList[getWidgetInfo]);
        }
        $scope.autoArrangeGrid = false;
        $scope.gridsterOptions.autogenerate_stylesheet = false;
        isExportOptionSet=1;
        $rootScope.$broadcast('storeGridStructure',{});
    };

    //To delete the dashboard
    $scope.deleteDashboard = function(){
        swal({
                title: "Confirm Delete?",
                text: "Dashboard and all its associated Reports will be removed",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Confirm",
                closeOnConfirm: true
            },
            function () {
                $http({
                    method: 'POST',
                    url: '/api/v1/delete/userDashboards/' + $state.params.id
                }).then(
                    function successCallback(response) {
                        $rootScope.fetchRecentDashboards();
                        $state.go('app.reporting.dashboards');
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Unable to delete dashboard.Please try again</span> .",
                            html: true
                        });
                    }
                );
            }
        );
    };

    $scope.setAutoArrange = function () {
        $scope.autoArrangeGrid = true;
        $scope.reArrangeWidgets();
    };

    $scope.showSettings=function(id) {
        var dropDwn = "settingsDropdown-"+id;
        document.getElementById(String(dropDwn)).classList.toggle("shw");
    }
    //To generate PNG in Widget Level-dashboard ctrl
    $scope.exportWidgetInPng =function (widgetId,widgetName) {
        widgetName = widgetName || 'Untitled Widget';
        var widgetLayout = document.getElementById(widgetId);


        var dropDown = document.getElementById("settingsDropdown-"+widgetId);
        if (dropDown.classList.contains('shw')) {
            dropDown.classList.remove('shw');
        }
        toastr.info('Please wait while PNG is being generated.Download will start in few seconds');

        document.getElementById('widget-dropdown-'+widgetId).style.visibility = 'hidden';


        domtoimage.toBlob(widgetLayout)
            .then(
                function (blob) {
                    var timestamp = Number(new Date());
                    window.saveAs(blob, widgetName + "_" + timestamp + ".png");
                    document.getElementById('widget-dropdown-'+widgetId).style.visibility = "visible";
                },
                function errorCallback(error) {
                    toastr.info('Sorry PNG export failed.Please try again later.');
                    document.getElementById('widget-dropdown-'+widgetId).style.visibility = "visible";
                }
            );
    }
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
    var count =0;
    var color = '#F53F72';
    var size = '30px';
    var existCommentCheck = "";
    var existXaxis = "";
    var existYaxis = "";

    $(".exportModalContent").on( 'click', function( ev ) {
        if(isExportOptionSet==1){
            $(".navbar").css('z-index','1');
            $(".md-overlay").css("background","rgba(0,0,0,0.5)");
            $("#exportModalContent").addClass('md-show');
        }
        else{
            $(".navbar").css('z-index','1');
            $(".md-overlay").css("background","rgba(0,0,0,0.5)");
            $("#waitForWidgetsLoadModalContent").addClass('md-show');
        }
    });

    $('#exportOptionJpeg').change(function() {
        $(".errorExportMessage").text("").hide();
    });

    $('#exportOptionPDF').change(function() {
        $(".errorExportMessage").text("").hide();
    });
}
