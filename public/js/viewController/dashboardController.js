showMetricApp.controller('DashboardController',DashboardController)

function DashboardController($scope,$timeout,$rootScope,$http,$window,$state,$stateParams,createWidgets,$q,$window) {
    $scope.loading=false;
    $scope.$window = $window;
    var isExportOptionSet = "";
    //Sets up all the required parameters for the dashboard to function properly when it is initially loaded. This is called in the ng-init function of the dashboard template
    $scope.dashboardConfiguration = function () {
        $scope.dashboardCalendar = new Calendar({
            element: $('.daterange--double'),
            earliest_date: moment(new Date()).subtract(365,'days'),
            latest_date: new Date(),
            start_date: moment(new Date()).subtract(30,'days'),
            end_date: new Date(),
            callback: function() {
                var start = moment(this.start_date).format('ll'),
                    end = moment(this.end_date).format('ll');
                $scope.populateDashboardWidgets();
                console.debug('controller Start Date: '+ start +'\n controller End Date: '+ end);
            }
        });

        //Defining configuration parameters for dashboard layout
        $scope.dashboard = {
            widgets: [],
            widgetData: []
        };
        $scope.dashboard.dashboardName = '';
        $scope.widgetsPresent = false;

        //To fetch the name of the dashboard from database and display it when the dashboard is loaded
        $scope.fetchDashboardName = function () {
            $http({
                method: 'GET', url: '/api/v1/get/dashboards/'+ $state.params.id
            }).then(function successCallback(response) {
                if(response.status == '200'){
                    $scope.dashboard.dashboardName =  response.data.name;
                    $rootScope.populateDashboardWidgets();
                }
                else
                    $scope.dashboard.dashboardName =  null;
            }, function errorCallback(error) {
                console.log('Error in fetching dashboard name', error);
                $scope.dashboard.dashboardName = null;
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",
                    html: true
                });
            });
        };
        $scope.fetchDashboardName();

        //Function to change the name of the dashboard to user entered value
        $scope.changeDashboardName = function () {
            var jsonData = {
                dashboardId: $state.params.id,
                name: $scope.dashboard.dashboardName
            };
            $http({
                method: 'POST',
                url: '/api/v1/create/dashboards',
                data: jsonData
            }).then(function successCallback(response) {
                if(response.status == '200')
                    console.log('Dashboard Name updated successfully',response);
            }, function errorCallback(error) {
                console.log('Error in updating dashboard name', error);
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",
                    html: true
                });
            });
        };

        //Setting up grid configuration for widgets
        $scope.gridsterOptions = {
            margins: [10, 10],
            columns: 6,
            defaultSizeX: 2,
            defaultSizeY: 2,
            minSizeX: 1,
            minSizeY: 1,
            width: 'auto',
            colWidth:'auto',
            draggable: {
                enabled: true,
                handle: '.box-header'
            },
            outerMargin: true, // whether margins apply to outer edges of the grid
            mobileBreakPoint: 700,
            mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
            /*isMobile: false, // stacks the grid items if true*/
            resizable: {
                enabled: true,
                handles: ['se'],
                //handles: ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'],
                start: function (event, $element, widget) {}, // optional callback fired when resize is started
                resize: function (event, $element, widget) {
                    var ind = $scope.dashboard.widgets.indexOf(widget);
                    for(var i=0;i<$scope.dashboard.widgetData[ind].chart.length;i++){
                        if ($scope.dashboard.widgetData[ind].chart[i].api){
                            $scope.dashboard.widgetData[ind].chart[i].api.update()
                        }
                    }
                }, // optional callback fired when item is resized,
                stop: function (event, $element, widget) {
                    function updateCharts(widget){
                        return function(){
                            var ind = $scope.dashboard.widgets.indexOf(widget);
                            for(var i=0;i<$scope.dashboard.widgetData[ind].chart.length;i++){
                                if ($scope.dashboard.widgetData[ind].chart[i].api){
                                    $scope.dashboard.widgetData[ind].chart[i].api.update()
                                }
                            }
                        }
                    }
                    $timeout(updateCharts(widget),400);

                } // optional callback fired when item is finished resizing
            }
        };

        $scope.$on('gridster-resized', function(sizes, gridster) {
            console.log('Gridster resized');
            for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 100);
            }
            function resizeWidget(i) {
                return function() {
                    if(typeof $scope.dashboard.widgetData[i].chart != 'undefined'){
                        for(j=0;j<$scope.dashboard.widgetData[i].chart.length;j++){
                            if ($scope.dashboard.widgetData[i].chart[j].api){
                                $scope.dashboard.widgetData[i].chart[j].api.update();
                            }
                        }
                    }
                };
            }
        });
        $scope.$on('gridster-mobile-changed', function( e,gridster) {
            console.log('gridster-mobile-changed',gridster);
            $scope.isMobile = gridster.isMobile;
        });
        $scope.$on('my-gridster-item-resized', function(e,item) {
            //console.log('my-gridster-item-resized',item);
            /*for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 100);
            }
            function resizeWidget(i) {
                return function() {
                    if(typeof $scope.dashboard.widgets[i].chart != 'undefined'){
                        for(j=0;j<$scope.dashboard.widgets[i].chart.length;j++){
                            if ($scope.dashboard.widgets[i].chart[j].api){
                                $scope.dashboard.widgets[i].chart[j].api.update();
                            }
                        }
                    }
                };
            }*/
        });

        $scope.$watch('dashboard.widgets',function(newVal,oldVal){
            console.log('Inside watch oldLen=',oldVal.length," newLen=",newVal.length);
            var inputParams = [];
            if($scope.dashboard.widgets.length !=0){
                for(getWidgetInfo in $scope.dashboard.widgets){
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
                }).then(function successCallback(response){
                    //console.log('Response after updating widget', response);
                }, function errorCallback (error){
                    console.log('Error in getting widget id',error);
                    swal({  title: "", text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",   html: true });
                });
            }
        },true);

        $scope.$on('my-gridster-item-transition-end', function(e,item) {
            console.log('my-gridster-item-transition-end');
            for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 100);
            }
            function resizeWidget(i) {
                return function() {
                    if(typeof $scope.dashboard.widgetData[i].chart != 'undefined'){
                        for(j=0;j<$scope.dashboard.widgetData[i].chart.length;j++){
                            if ($scope.dashboard.widgetData[i].chart[j].api){
                                $scope.dashboard.widgetData[i].chart[j].api.update();
                            }
                        }
                    }
                };
            }
        });

        angular.element($window).on('resize', function (e) {
            $scope.$broadcast('resize');
        });

        $scope.$on('resize',function(e){
            for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 100);
            }
            function resizeWidget(i) {
                return function() {
                    if(typeof $scope.dashboard.widgetData[i].chart != 'undefined'){
                        for(j=0;j<$scope.dashboard.widgetData[i].chart.length;j++){
                            if ($scope.dashboard.widgetData[i].chart[j].api){
                                $scope.dashboard.widgetData[i].chart[j].api.update();
                            }
                        }
                    }
                };
            }
        });

        $scope.calculateColumnWidth = function(x) {
            var y = Math.round(12/x);
            if(y<6) {
                //return ('col-lg-'+6);
                return ('col-sm-'+6+' col-md-'+6+' col-lg-'+6);
            } else {
                //return ('col-lg-'+y);
                return ('col-sm-'+y+' col-md-'+y+' col-lg-'+y);
            }
        };

        $scope.calculateRowHeight = function(availableHeight,noOfItems) {
            var cols = $window.innerWidth>=768 ? 2 : 1;
            var rows = Math.ceil(noOfItems/cols);
            var heightPercent = 100/rows;
            var fontSizeEm = availableHeight/100*4.5;
            var minSize = 0.8, maxSize=1.5;
            if(fontSizeEm<minSize)
                fontSizeEm=minSize;
            if(fontSizeEm>maxSize)
                fontSizeEm=maxSize;
            return {'height':(heightPercent+'%'),'font-size':(fontSizeEm+'em')};
        };
    };

    //To populate all the widgets in a dashboard when the dashboard is refreshed or opened or calendar date range in the dashboard header is changed
    $rootScope.populateDashboardWidgets = function() {
        $scope.dashboard.widgets = [];
        $http({
            method: 'GET',
            url: '/api/v1/dashboards/widgets/'+ $state.params.id
        }).then(function successCallback(response) {
            var widgets = [];
            var dashboardWidgetList = response.data.widgetsList;
            if(dashboardWidgetList) {
                $scope.widgetsPresent = true;
            } else {
                $scope.widgetsPresent = false;
            }


            for(getWidgetInfo in dashboardWidgetList){
                widgets.push(createWidgets.widgetDataFetchHandler(dashboardWidgetList[getWidgetInfo],{
                    'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                    'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                }));

                //To temporarily create an empty widget with same id as the widgetId till all the data required for the widget is fetched by the called service
                $scope.dashboard.widgets.push({
                    'row': (typeof dashboardWidgetList[getWidgetInfo].row != 'undefined'? dashboardWidgetList[getWidgetInfo].row : 0),
                    'col': (typeof dashboardWidgetList[getWidgetInfo].col != 'undefined'? dashboardWidgetList[getWidgetInfo].col : 0),
                    'sizeY': (typeof dashboardWidgetList[getWidgetInfo].size != 'undefined'? dashboardWidgetList[getWidgetInfo].size.h : 2),
                    'sizeX': (typeof dashboardWidgetList[getWidgetInfo].size != 'undefined'? dashboardWidgetList[getWidgetInfo].size.w : 2),
                    'minSizeY': (typeof dashboardWidgetList[getWidgetInfo].minSize != 'undefined'? dashboardWidgetList[getWidgetInfo].minSize.h : 1),
                    'minSizeX': (typeof dashboardWidgetList[getWidgetInfo].minSize != 'undefined'? dashboardWidgetList[getWidgetInfo].minSize.w : 1),
                    'maxSizeY': (typeof dashboardWidgetList[getWidgetInfo].maxSize != 'undefined'? dashboardWidgetList[getWidgetInfo].maxSize.h : 3),
                    'maxSizeX': (typeof dashboardWidgetList[getWidgetInfo].maxSize != 'undefined'? dashboardWidgetList[getWidgetInfo].maxSize.w : 3),
                    'name': (typeof dashboardWidgetList[getWidgetInfo].name != 'undefined'? dashboardWidgetList[getWidgetInfo].name : ''),
                    'id': dashboardWidgetList[getWidgetInfo]._id,
                    //'chart': {'api': {}},
                    'visibility': false
                });
                $scope.dashboard.widgetData.push({
                    'id':  dashboardWidgetList[getWidgetInfo]._id,
                    'chart': [],
                    'visibility': false,
                    'name': (typeof dashboardWidgetList[getWidgetInfo].name != 'undefined'? dashboardWidgetList[getWidgetInfo].name : ''),
                    'color': (typeof dashboardWidgetList[getWidgetInfo].color != 'undefined'? dashboardWidgetList[getWidgetInfo].color : '')
                });

                //Fetching the promise that contains all the data for the particular widget in the dashboard
                widgets[getWidgetInfo].then(
                    function successCallback(widget){
                        var widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(widget._id);
                        var finalChartData = createWidgets.dataLoader(widget);
                        var widgetToBeLoaded = createWidgets.replacePlaceHolderWidget(widget,finalChartData);
                        widgetToBeLoaded.then(
                            function successCallback(widgetToBeLoaded){
                                $scope.dashboard.widgetData[widgetIndex] = widgetToBeLoaded;
                                console.log('widgetData:',$scope.dashboard.widgetData[widgetIndex]);
                                isExportOptionSet=1;
                        },
                            function errorCallback(error){
                            console.log(error);
                            isExportOptionSet=0;
                        });
                    },
                    function errorCallback(error){
                        console.log(error);
                        isExportOptionSet=0;
                    });
            }
        }, function errorCallback(error) {
            console.log('Error in finding widgets in the dashboard', error);
            swal({
                title: "",
                text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",
                html: true
            });
            isExportOptionSet=0;
        });
    };

    //To catch a request for a new widget creation and create the dashboard in the frontend
    $scope.$on('populateWidget', function(e,widget,dataDateRange){
        var inputWidget = [];
        var chartName;
        inputWidget.push(createWidgets.widgetDataFetchHandler(widget,{
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
            'id': widget._id,
            //'chart': {'api': {}},
            'visibility': false
        });
        $scope.dashboard.widgetData.push({
            'id':  widget._id,
            'chart': [],
            'visibility': false,
            'name': (typeof widget.name != 'undefined'? widget.name : ''),
            'color': (typeof widget.color != 'undefined'? widget.color : '')
        });
        console.log($scope.dashboard.widgetData);

        //Fetching the promise that contains all the data for all the widgets in the dashboard
        $q.all(inputWidget).then(
            function successCallback(inputWidget){
                var widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(inputWidget[0]._id);
                var finalChartData = createWidgets.dataLoader(inputWidget[0]);
                var widgetToBeLoaded = createWidgets.replacePlaceHolderWidget(inputWidget[0],finalChartData);
                widgetToBeLoaded.then(
                    function successCallback(widgetToBeLoaded){
                        //$scope.dashboard.widgets[widgetIndex] = widgetToBeLoaded;
                        $scope.dashboard.widgetData[widgetIndex] = widgetToBeLoaded;
                    },
                    function errorCallback(error) {
                        console.log(error);
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",
                            html: true
                        });
                    });
            },
            function errorCallback(error){
                console.log(error);
            }
        );
    });

    //To download a pdf/jpeg version of the dashboard
    $scope.exportModal = function(value){
        if(isExportOptionSet==1){
            $state.go(value);
        }
        else{
            swal({
                title: "",
                text: "<span style='sweetAlertFont'>Something went wrong! Can't export at this moment</span> .",
                html: true
            });
        }
    };

    //To delete a widget from the dashboard
    $scope.deleteWidget = function(widget){
        console.log(widget);
        $http({
            method:'POST', url:'/api/v1/delete/widgets/' + widget.id
        }).then(function successCallback(response){
            if($scope.dashboard.widgets.length == 0)
                $scope.widgetsPresent = false;
        },function errorCallback(error){
            console.log('Error in deleting the widget',error);
        });
    };

    //To export the dashboard into PDF format
    $scope.printPDF = function () {
        $http({
            method: 'GET',
            url: '/exportPDF/'+ $state.params.id+ '/'+ moment(moment.utc($scope.date.startDate._d).valueOf()).format('YYYY-MM-DD')+'/'+moment(moment.utc($scope.date.endDate._d).valueOf()).format('YYYY-MM-DD')
        }).then(function successCallback(response) {
            console.log(response);
        },function errorCallback(error) {
            console.log(error);
        });

    };

    //To delete the dashboard
    $scope.deleteDashboard = function(){
        $http({
            method:'POST', url:'/api/v1/delete/userDashboards/' + $state.params.id
        }).then(function successCallback(response){
            console.log('dashboardDeleted',response);
            $state.go('app.reporting.dashboards');
        },function errorCallback(error){
            swal({  title: "", text: "<span style='sweetAlertFont'>Unable to delete dashboard.Please try again</span> .",   html: true });
            console.log('Error in deleting the widget',error);
        });

    }
}