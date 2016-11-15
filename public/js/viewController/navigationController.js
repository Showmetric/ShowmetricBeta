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
                                        toastr.info('You have reached your Dashboards limit. Please upgrade to create more Dashboards')
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
                                    if(response.data.availableDashboards > 0)
                                        $state.go('app.reporting.'+targetState);
                                    else
                                        toastr.info('You have reached your Dashboards limit. Please upgrade to create more Dashboards')
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
                case 'buildReports':
                    if($scope.canAccessReportBuilder){
                        $state.go('app.reporting.'+targetState);
                    }
                    else{
                        swal({
                                title: "",
                                text: "Sorry! The Report builder feature is only available on the Agency Plan.",
                                type: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#DD6B55",
                                confirmButtonText: "Upgrade",
                                closeOnConfirm: true
                            },
                            function () {
                                $state.go('app.reporting.upgrade');
                            });
                    }

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
                        toastr.info('You have reached your Dashboards limit. Please upgrade to create more Dashboards')
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