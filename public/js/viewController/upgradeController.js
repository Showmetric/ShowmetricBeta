showMetricApp.controller('UpgradeController', UpgradeController)
function UpgradeController($scope, $http,$state, $rootScope) {
    var options;
    var rzp1;
    $scope.getSubscriptions = function() {
        $http(
            {
                method: 'GET',
                url: '/api/v1/me'
            }
        ).then(
            function successCallback(response) {
                $rootScope.subscriptionDetails = response.data.userDetails;
                $scope.subscriptionType = $rootScope.subscriptionDetails.subscriptionType.code;
            },
            function errorCallback(error) {
            }
        );
    }
    $scope.loadCheckoutForm = function (code) {
        var requestType = {'code': code}
        if(String(code)==='free'){
            $http({
                method: 'POST',
                url: '/api/v1/updateFreeSubscription',
                data: requestType
            }).then(function successCallback(subscription) {
                    $scope.subscriptionType = subscription.data.response.code;
                    $rootScope.getReportBuilder();
                    toastr.info('Your payment is completed successfully !')
                    $state.go('app.reporting.dashboard', {id: $rootScope.recentDashboards[0]._id});
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
        else{
            $http({
                method: 'POST',
                url: '/api/v1/updateUserSubscription',
                data: requestType
            }).then(function successCallback(subscription) {
                    options = {
                        "key": subscription.data.apiKey,
                        "amount": subscription.data.response.subscriptionCost*100, // 2000 paise = INR 20
                        "name": "Datapoolt",
                        "description": "Purchase Description",
                        "image": "image/Datapoolt-Logo.png",
                        "handler": function (paymentResponse) {
                            var jsonData = {
                                "paymentId": paymentResponse.razorpay_payment_id,
                                "amount": subscription.data.response.subscriptionCost*100, // 2000 paise = INR 20
                                "orgId": subscription.data.orgDetails._id,
                                "subscriptionId": subscription.data.response._id,
                                "subscription":subscription.data.response
                            }
                            $http({
                                method: 'POST',
                                url: '/api/v1/payment/capture',
                                data: jsonData
                            }).then(function successCallback(response) {
                                    $rootScope.getReportBuilder();
                                    $scope.subscriptionType = subscription.data.response.code;
                                    toastr.info('Your payment is completed successfully !')
                                    $state.go('app.reporting.dashboard', {id: $rootScope.recentDashboards[0]._id});
                                },
                                function errorCallback(error) {
                                    swal({
                                        title: "",
                                        text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                                        html: true
                                    });
                                }
                            )
                        },
                        "theme": {
                            "color": "#232c3b"
                        }
                    };
                    $scope.showCheckoutForm = true;
                    rzp1 = new Razorpay(options);
                    $scope.clickPayButton = function () {
                        rzp1.open();
                        //e.preventDefault();
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
        }

    }


}