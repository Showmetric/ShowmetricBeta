showMetricApp.controller('addNewUserController', addNewUserController);

function addNewUserController($scope,$http,$window,$state,$rootScope) {
    $scope.userName="";
    $scope.email="";
    $scope.addNewUser=function(){
        var jsonData={
            name: $scope.userName,
            email:  $scope.email
        };
        $http({
            method: 'POST',
            url: '/api/v1/signupByAdmin',
            data: jsonData
        })
            .then(
                function successCallback(response) {
                    if(response.status == '200'){
                        $scope.ok()
                        toastr.info(response.data.message)
                    }
                     else
                    $('#error').html('<div class="alert alert-danger fade in" style="width: 361px;margin-left: 26px;height: 59px;"><button type="button" class="close close-alert" data-dismiss="alert" aria-hidden="true">×</button>'+response.data.message+'</div>');
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong!!!!</span> .",
                        html: true
                    });
                }
            )

    }
}