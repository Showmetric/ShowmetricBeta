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
            },
            function errorCallback(error) {
            }
        );
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
                else
                    $scope.paymentDetails=response.data.paymentDetails;
            },
            function errorCallback(error) {

            }
        );
    }
    $scope.transactionDetails();
}
