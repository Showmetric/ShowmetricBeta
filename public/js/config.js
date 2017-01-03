function config($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, IdleProvider, KeepaliveProvider) {

    // Configure Idle settings
    IdleProvider.idle(5); // in seconds
    IdleProvider.timeout(120); // in seconds
    $urlRouterProvider.otherwise("/reporting");
    $ocLazyLoadProvider.config({
        debug: false
    });
    $stateProvider

        .state('app', {
            abstract: true,
            templateUrl: "common/content.ejs",
            controller: 'AppController'
        })

        .state('app.adReporting', {
            abstract: true,
            url: "/adReporting"
        })

        .state('app.reporting', {
            url: "/reporting",
            template: '{{loadingVariable}}',
            controller: function ($http,$state,$scope,$interval,$rootScope){
                $scope.loadingVariable = '';
                if($state.$current.name == 'app.reporting'){
                    $scope.loadingVariable = '';
                    var repeat=0;
                    $rootScope.expiryCheck = function() {
                        $http(
                            {
                                method: 'GET',
                                url: '/api/v1/me'
                            }
                        ).then(
                            function successCallback(response) {
                                $rootScope.subscriptionDetails = response.data.userDetails;
                                if(repeat==0) {
                                        if (response.data.userDetails.statusCode === 1002) {
                                            $rootScope.isExpired = true;
                                            $state.go('.upgrade');
                                        }
                                        else {
                                            $rootScope.isExpired = false;
                                            var expiryDate = moment(response.data.userDetails.organization[0].subscriptionExpiresOn);
                                            var currentDate = moment(new Date).format("YYYY-MM-DD");
                                            currentDate = moment(currentDate);
                                            var diffDays = expiryDate.diff(currentDate, 'days');
                                            if (diffDays < 4) {
                                                toastr.info("Hi, welcome to Datapoolt.Your pricing plan is going to expire soon.Please upgrade to access Datapoolt", 'Expiry Warning', {
                                                    "closeButton": true,
                                                    "debug": false,
                                                    "progressBar": true,
                                                    "preventDuplicates": false,
                                                    "positionClass": "toast-top-right",
                                                    "onclick": null,
                                                    "showDuration": "4000",
                                                    "hideDuration": "1000",
                                                    "timeOut": "7000",
                                                    "extendedTimeOut": "1000",
                                                    "showEasing": "swing",
                                                    "hideEasing": "linear",
                                                    "showMethod": "fadeIn",
                                                    "hideMethod": "fadeOut"
                                                });
                                            }
                                            if (response.data.userDetails.user[0].lastDashboardId) {
                                                $scope.loadingVariable = '';
                                                if (response.data.userDetails.user[0].lastDashboardId != 'undefined')
                                                    $state.go('.dashboards');
                                                else
                                                    $scope.createNewDashboard();
                                            }
                                            else {
                                                $scope.createNewDashboard();
                                            }

                                        }
                                    repeat++;
                                }
                                else {
                                    if (response.data.userDetails.statusCode === 1002) {
                                        $rootScope.isExpired = true;
                                        $state.go('app.reporting.upgrade');
                                    }
                                }
                            },
                            function errorCallback(error) {
                                $scope.createNewDashboard();
                            }
                        );
                    }
                    $rootScope.expiryCheck();
                    $interval($rootScope.expiryCheck,3600000);
                }
            }
        })
        .state('app.reporting.upgrade', {
            url: "/upgrade",
            views: {
                'main@app': {
                    templateUrl: "common/upgrade.ejs",
                    //templateUrl: "dashboardTemplate.ejs",
                    controller: 'UpgradeController'
                }
            },

            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load('css/upgrade.css');
                }
            },
        })
        .state('app.reporting.dashboard', {
            url: "/dashboard/:id",
            views: {
                'main@app': {
                    templateUrl: "dashboardTemplate.ejs",
                    controller: 'DashboardController'
                }
            },
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            files: [
                                'css/angular-gridster/angular-gridster.min.css',
                                'css/angular-gridster/style_gridster.css',
                                'js/angular-gridster/jquery.resize.js'
                            ]
                        }
                    ]);
                }
            },
            onEnter: function ($stateParams,$http,$state,$rootScope) {
                var dashboardId = $stateParams.id? $stateParams.id : $state.params.id;
                if(typeof dashboardId != 'undefined') {
                    $http(
                        {
                            method:'POST',
                            url:'/api/v1/updateLastDashboardId/' + dashboardId
                        }
                    ).then(
                        function successCallback(response){
                            $rootScope.fetchRecentDashboards();
                        },
                        function errorCallback (error){
                        }
                    );
                }
            }
        })

        .state('app.reporting.dashboard.basicWidget', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "basicWidget.ejs",
                    controller: 'LightBoxController'
                }
            }
        })
        .state('app.reporting.listProfile', {
            url: "",
            views: {
                'main@app': {
                    templateUrl: "profileList.ejs",
                    controller: 'LightBoxController'
                }
            }
        })


        .state('app.reporting.dashboard.fusionWidget', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "fusionWidget.ejs",
                    controller: 'LightBoxController'
                }
            }
        })
        .state('app.reporting.chooseDashboardType', {
            url: "/choosedashboard/",
            views: {
                'main@app': {
                    templateUrl: "chooseDashbordType.ejs",
                    controller: 'LightBoxController'
                }
            }
        })

        .state('app.reporting.dashboard.exportModal', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "exportTemplate.ejs",
                    controller: 'LightBoxController'
                }
            },
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            files: ['css/plugins/steps/jquery.steps.css']
                        }
                    ]);
                }
            }
        })

        .state('app.reporting.dashboard.alertModal', {
            url: "",
            //params: {selectedWidget: null},
            views: {
                'lightbox@app.reporting.dashboard': {
                    params: {selectedWidget: null},
                    templateUrl: "alertModal.ejs",
                    controller: 'LightBoxController'
                }
            },
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            files: ['css/plugins/steps/jquery.steps.css']
                        }
                    ]);
                }
            }
        })


        .state('app.reporting.recommendedDashboard', {
            url: "",
            views: {
                'main@app': {
                    templateUrl: "recommendedDashboard.ejs",
                    controller: 'LightBoxController'
                }
            }
        })

        .state('app.reporting.dashboards', {
            url: "/gridView/",
            views: {
                'main@app': {
                    templateUrl: "gridView.ejs",
                    controller: 'GridviewController'
                }
            }
        })
        .state('app.reporting.buildReports', {
            url: "/buildReports",
            views: {
                'main@app': {
                    templateUrl: "buildReport.ejs",
                    controller: 'buildReportController'
                }
            }
        })
        .state('app.changePassword', {
            url: "/changePassword",
            views: {
                'main@app': {
                    templateUrl: "changePassword.ejs"
                }
            }
        })
        .state('app.reporting.accountManagement', {
                url: "/accountManagement",
            views: {
                'main@app': {
                    templateUrl: "accountManagement.ejs"
                }
            }
        })
        .state('app.reporting.userManagement', {
                url: "/userManagement",
            views: {
                'main@app': {
                    templateUrl: "userManagement.ejs",
                }
            }
        })
        .state('app.reporting.userManagement.addUser', {
        url: "",
        views: {
            'main@app': {
                templateUrl: "addNewUser.ejs",
                controller: 'LightBoxController'
            }
        }
        });

}
angular
    .module('inspinia')
    .config(config)
    .run(function($rootScope, $state,$http) {
        $rootScope.$state = $state;
        $rootScope.$on('$stateChangeStart', function(ev, to, toParams, from, fromParams) {
            var prevState = from.name;
            var nextState = to.name;
            if(prevState=='app.reporting.dashboard.basicWidget' || prevState=='app.reporting.dashboard.fusionWidget'|| prevState=='app.reporting.dashboard.exportModal'|| prevState=='app.reporting.dashboard.alertModal'|| prevState=='app.reporting.chooseDashboardType'|| prevState=='app.reporting.recommendedDashboard') {
                // pendingRequests.cancelAll();
                if(nextState!='app.reporting.dashboard'&& nextState!='app.reporting') {
                    $http.pendingRequests.forEach(function (request) {
                        if (request.cancel)
                            request.cancel.resolve();
                    });
                }
            }
            else if(nextState!='app.reporting.dashboard.basicWidget' && nextState!='app.reporting.dashboard.fusionWidget' && nextState!='app.reporting.dashboard.exportModal' && nextState!='app.reporting.dashboard.alertModal') {
                // pendingRequests.cancelAll();
                $http.pendingRequests.forEach(function (request) {
                    if (request.cancel)
                        request.cancel.resolve();
                });
            }
        });
    });
