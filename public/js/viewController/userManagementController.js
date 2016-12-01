showMetricApp.controller('UserManagementController', UserManagementController);

function UserManagementController($scope,$http,$window,$state,$rootScope) {
    $scope.userloading=true;
    $scope.users=null;
    $scope.username;
    $scope.fetchAllUser=function () {
            $http(
                {
                    method: 'GET',
                    url: '/api/v1/getUsersUnderAdmin/'
                }
            ).then(
                function successCallback(response) {
                    $scope.users=_.orderBy(response.data.users,['roleId'])
                    $scope.userloading=false;
                },
                function errorCallback(error) {
                    $scope.userloading=false;
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                        html: true
                    });
                }
            )
    }
    $scope.removeExistingUser=function (userId) {
        swal({
                title: "Are you sure you want to Delete? ",
                text: "All dashboards, alerts, reports created by this user will be deleted as well",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete this user",
                closeOnConfirm: true
            },
            function () {
                $scope.removeUser(userId);
            });
    }
    $scope.removeUser=function (userId) {

        $scope.userloading=true;
        var jsonData={
            userId:userId
        }
        $http(
            {
                method: 'POST',
                url: '/api/v1/removeUserUnderAdmin/',
                data:jsonData
            }
        ).then(
            function successCallback(response) {
                $scope.userloading=false;
               var k = $scope.users.map(function (e) {
                    return e._id;
                }).indexOf(userId);
                if(k!=-1)
                $scope.users.splice(k,1)
            },
            function errorCallback(error) {
                $scope.userloading=false;
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                    html: true
                });
            }
        )
    }
    $scope.changeUserName=function (id,name) {
                 var userid={id:id,
                 name:name}
        $http(
            {
                method: 'POST',
                url: '/api/v1/changeUserName/',
                data:userid
            }
        ).then(
            function successCallback(response) {
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