showMetricApp.controller('AppController', AppController)

function AppController($http,$state,$scope) {
    $scope.createNewDashboard = function(){
        $http({
            method: 'POST', url: '/api/v1/create/dashboards'
        }).then(function successCallback(response){
            console.log(response);
            $state.go('app.reporting.dashboard',{id:response.data});
        },function errorCallback(error){
            swal({  title: "", text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",   html: true });
            console.log('Error in creating new Dashboard',error);
        })
    };
}