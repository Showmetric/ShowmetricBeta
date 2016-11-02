showMetricApp.controller('NavigationController',NavigationController)

function NavigationController($scope,$state,$http,$stateParams,$rootScope) {
    var availableBasicWidgets;
    var availableFusionWidgets;
    $rootScope.getReportBuilder = function () {
        $http({
            method: 'POST',
            url: '/api/v1/updateUserSubscription?buster='+new Date()
        }).then(
            function successCallback(response) {
                $scope.canAccessReportBuilder = response.data.response.reportBuilder;
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
    }
    $rootScope.getReportBuilder();
    $state.includes('app.reporting.dashboard')
    $scope.stateValidation = function(targetState) {
            switch(targetState) {
                case 'recommendedDashboard':
                        //check if dasshboards are available
                        $http(
                            {
                                method: 'GET',
                                url: '/api/v1/subscriptionLimits'+'?requestType='+'dashboards'
                            }
                        ).then(
                            function successCallback(response){

                                if( response.data.isExpired === false){
                                    if(response.data.availableDashboards > 0){
                                        $state.go('app.reporting.'+targetState);
                                    }
                                    else{
                                        toastr.info('Dashboard limit is reached !')
                                    }
                                }
                                else{
                                    toastr.info('Please renew!')
                                }
                            },
                            function errorCallback(error){
                                swal({
                                    title: "",
                                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                                    html: true
                                });
                            }
                        )

                    break;
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
                                        toastr.info("You don't have available widgets!")
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
                                            toastr.info("You don't have available  widgets to create")
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
                case 'chooseDashboardType':
                        //send a request and get the available dashboards counts
                        $http(
                            {
                                method: 'GET',
                                url: '/api/v1/subscriptionLimits' + '?requestType=' + 'dashboards'
                            }
                        ).then(
                            function successCallback(response){
                                if(response.data.isExpired === false){
                                    if(response.data.availableDashboards > 0){
                                        $scope.loading=true;
                                        $http(
                                            {
                                                method: 'POST',
                                                url: '/api/v1/create/dashboards'
                                            }
                                        ).then(
                                            function successCallback(response) {
                                                $state.go('app.reporting.'+targetState);
                                            },
                                            function errorCallback(error) {
                                                swal({
                                                    title: "",
                                                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                                                    html: true
                                                });
                                            }
                                        )
                                    }
                                    else {
                                        toastr.info('Dashboard limit is reached !')
                                    }
                                }
                                else {
                                    toastr.info('Please renew !')
                                }
                            },
                            function errorCallback(error) {
                                swal({
                                    title: "",
                                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                                    html: true
                                });
                            }
                        )
                    break;
                case 'insights':
                    toastr.info('Coming Soon');
                    break;
            }
    };
    $scope.addRecommendedDashboard = function() {
        //check if dasshboards are available
        $http(
            {
                method: 'GET',
                url: '/api/v1/subscriptionLimits'+'?requestType='+'dashboards'
            }
        ).then(
            function successCallback(response){
                if( response.data.isExpired === false){
                    if(response.data.availableDashboards > 0){
//if dashboards avaialable and not expire open the modal
                        $state.go('app.reporting.dashboard.recommendedDashboard');
                    }
                    else{
                        toastr.info('Dashboard limit is reached !')
                    }
                }
                else{
                    toastr.info('Please renew!')
                }
            },
            function errorCallback(error){
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                    html: true
                });
            }
        )
    };
    $(".insightsModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#insightsModalContent").addClass('md-show');
    });

    $(".addRemoveModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#addRemoveModalContent").addClass('md-show');
    });

    function removeModal( hasPerspective ) {
        classie.remove( modal, 'md-show' );
        if( hasPerspective )
            classie.remove( document.documentElement, 'md-perspective' );
    }

    function removeModalHandler() {
        removeModal( classie.has( el, 'md-setperspective' ) );
    }

}