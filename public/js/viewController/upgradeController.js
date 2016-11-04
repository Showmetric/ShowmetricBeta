showMetricApp.controller('UpgradeController', UpgradeController)
function UpgradeController($scope, $http, $state, $rootScope) {
    var codeMapping = {
        starter: 1,
        advanced: 2,
        premium: 3,
        agency: 4
    }
    var subscriptionDetails;
    var rzp1;
    $scope.getSubscriptions = function () {
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
        $http({
            method: 'POST',
            url: '/api/v1/updateUserSubscription',
        }).then(function successCallback(olderSubscription) {
            subscriptionDetails = olderSubscription
            var code = codeMapping[olderSubscription.data.response.code];
            document.getElementById('enableStarter').disabled = true;
            document.getElementById('enableAdvanced').disabled = true;
            document.getElementById('enablePremium').disabled = true;
            document.getElementById('enableAgency').disabled = true;
            if (codeMapping.starter >= code) document.getElementById('enableStarter').disabled = false;
            if (codeMapping.advanced >= code) document.getElementById('enableAdvanced').disabled = false;
            if (codeMapping.premium >= code) document.getElementById('enablePremium').disabled = false;
            if (codeMapping.agency >= code) document.getElementById('enableAgency').disabled = false;

        }, function errorCallback() {
            swal({
                title: "",
                text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                html: true
            });
        })
    }

    $scope.loadCheckoutForm = function (code) {
        var requestType = {'code': code}
            var jsonData = {};
            var calculateDaysDifference;
            var oneDaysAmount;
            $http({
                method: 'POST',
                url: '/api/v1/updateUserSubscription',
                data: requestType
            }).then(function successCallback(subscription) {
                    oneDaysAmount = subscriptionDetails.data.response.subscriptionCost / 30;
                    if (subscriptionDetails.data.response.code === subscription.data.response.code) {
                        console.log('jsonDatajsonData', jsonData, typeof jsonData)
                        jsonData['expDate'] = subscriptionDetails.data.orgDetails.subscriptionExpiresOn;
                        var finalSubscriptionAmount = subscription.data.response.subscriptionCost;
                    }
                    else {
                        if (moment(subscriptionDetails.data.orgDetails.subscriptionExpiresOn).format('YYYY-MM-DD') >= moment(new Date()).format('YYYY-MM-DD')) {
                            if (moment(subscriptionDetails.data.orgDetails.subscriptionExpiresOn).format('YYYY-MM-DD') === moment(new Date()).format('YYYY-MM-DD')) {
                                calculateDaysDifference = 1;
                            }
                            else {
                                calculateDaysDifference = moment(subscriptionDetails.data.orgDetails.subscriptionExpiresOn).diff(moment(new Date()), 'days')
                            }
                            var finalSubscriptionAmount = (subscription.data.response.subscriptionCost - (oneDaysAmount * calculateDaysDifference)).toFixed(2);
                            ;
                            console.log('finalSubscriptionAmount', finalSubscriptionAmount, oneDaysAmount, calculateDaysDifference)
                        }
                    }
                    var options = {
                        "key": subscription.data.apiKey,
                        "amount": finalSubscriptionAmount * 100, // 2000 paise = INR 20
                        "name": "Datapoolt",
                        "description": "Purchase Description",
                        "image": "image/Datapoolt-Logo.png",
                        "handler": function (paymentResponse) {
                            jsonData["paymentId"] = paymentResponse.razorpay_payment_id,
                                jsonData["amount"] = finalSubscriptionAmount * 100, // 2000 paise = INR 20
                                jsonData["orgId"] = subscription.data.orgDetails._id,
                                jsonData["subscriptionId"] = subscription.data.response._id,
                                jsonData["subscription"] = subscription.data.response
                            console.log('jsonData', jsonData)
                            $http({
                                method: 'POST',
                                url: '/api/v1/payment/capture',
                                data: jsonData
                            }).then(function successCallback(response) {
                                console.log('ress',response)
                                if(response.data.error===200){
                                    $rootScope.getReportBuilder();
                                    $scope.subscriptionType = subscription.data.response.code;
                                    toastr.info('Your payment is completed successfully !')
                                    $state.go('app.reporting.accountManagement');
                                }
                                else{
                                    toastr.info('Your payment is failed.Please try again.')
                                    $state.go('app.reporting.accountManagement');
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
                        },
                        "theme": {
                            "color": "#232c3b"
                        }
                    };
                    $scope.showCheckoutForm = true;
                    rzp1 = new Razorpay(options);
                    rzp1.open();
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