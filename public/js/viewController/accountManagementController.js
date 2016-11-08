showMetricApp.controller('AccountManagementController', AccountManagementController)
function AccountManagementController($scope, $http, $location,$window) {
    //To set height for Window scroller in dashboard Template
    $scope.docHeight = window.innerHeight;
    $scope.docHeight = $scope.docHeight-105;
    angular.element($window).on('resize', function (e) {
        $scope.docHeight = window.innerHeight;
        $scope.docHeight = $scope.docHeight - 105;
    });
    $scope.getSubscriptions = function() {
        $http(
            {
                method: 'POST',
                url: '/api/v1/updateUserSubscription'
            }
        ).then(
            function successCallback(response) {
                $scope.subscriptionType = response.data.response.code;
                $scope.validity = moment(response.data.orgDetails.subscriptionExpiresOn).format('LL');
                $scope.getAvailableCount($scope.subscriptionType);
            },
            function errorCallback(error) {
            }
        );
    }

    $scope.getAvailableCount=function(subscriptionType){
        var getDashboardCount=function() {
            $http(
                {
                    method: 'GET',
                    url: '/api/v1/subscriptionLimits' + '?requestType=' + 'dashboards'
                }
            ).then(
                function successCallback(response) {
                    $scope.availableDashboards=response.data.availableDashboards;
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
        var getWidgetCount=function() {
            $http(
                {
                    method: 'GET',
                    url: '/api/v1/subscriptionLimits' + '?requestType=' + 'basic'
                }
            ).then(
                function successCallback(response) {
                    $scope.availableWidgets=response.data.availableWidgets;
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
        var getFusionCount=function() {
            $http(
                {
                    method: 'GET',
                    url: '/api/v1/subscriptionLimits' + '?requestType=' + 'fusion'
                }
            ).then(
                function successCallback(response) {
                    $scope.availableFusions=response.data.availableWidgets;
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
        var getAlertCount=function() {
            $http(
                {
                    method: 'GET',
                    url: '/api/v1/subscriptionLimits' + '?requestType=' + 'alert'
                }
            ).then(
                function successCallback(response) {
                    $scope.availableAlerts=response.data.availablealerts;
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
        if(subscriptionType=='agency'){
            $scope.availableDashboards='Unlimited';
            $scope.availableWidgets='Unlimited';
            $scope.availableFusions='Unlimited';
            $scope.availableAlerts='Unlimited';
        }
        if(subscriptionType=='premium'){
            getDashboardCount();
            $scope.availableWidgets='Unlimited';
            $scope.availableFusions='Unlimited';
            $scope.availableAlerts='Unlimited';
        }
        if(subscriptionType=='starter' || subscriptionType=='advanced' ||subscriptionType=='free'){
            getDashboardCount();
            getWidgetCount();
            getFusionCount();
            getAlertCount();
        }
    }

    $scope.transactionDetails = function(){
        $http(
            {
                method: 'GET',
                url: '/api/v1/getPaymentDetails/'
            }
        ).then(
            function successCallback(response) {
                if(response.status==204)
                    $scope.paymentDetails='no data'
                else{
                    $scope.paymentDetails=response.data.paymentDetails;
                    for(var i=0;i<$scope.paymentDetails.length;i++){
                        $scope.paymentDetails[i].paidOn=moment($scope.paymentDetails[i].paidOn).format('DD-MM-YYYY')
                    }
                }
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                    html: true
                });
            }
        );
    }
    $scope.transactionDetails();
}
