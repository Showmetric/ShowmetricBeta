showMetricApp.controller('AppController', AppController)

function AppController($http,$state,$scope,$rootScope) {
    $rootScope.recentDashboardList=[];
    $scope.recentDashboardList=[];
    $scope.loading=false;

    $scope.fetchUserName = function() {
        $http(
            {
                method: 'GET',
                url: '/api/v1/me'
            }
        ).then(
            function successCallback(response) {
                $scope.userName = response.data.userDetails[0].name;
            },
            function errorCallback(error) {
                $scope.userName = '';
            }
        );
    };
    $rootScope.fetchRecentDashboards = function(){
        $scope.recentDashboardList=[];
        $http({
            method: 'GET', url: '/api/v1/get/dashboardList'+'?buster='+new Date().getTime()
        }).then(
            function successCallback(response){
                this.recentDashboardModel=''
                $rootScope.recentDashboards=[];
                $scope.recentDashboardList=[];
                if(response.status == '200'){
                    var sortedDashboard= _.orderBy(response.data.dashboardList, ['updated'],['desc']);
                    if(sortedDashboard.length<=5)
                        $scope.recentDashboards = sortedDashboard;
                    else{
                        for(var i=0;i<5;i++)
                            $rootScope.recentDashboards.push(sortedDashboard[i]);
                    }
                    $rootScope.stateDashboard=$scope.recentDashboards[0];
                }
                else
                    $rootScope.recentDashboards  = null;
            },
            function errorCallback(error){
                $rootScope.recentDashboards  = null;
            }
        );
    };

    $scope.createNewDashboard = function() {
        $scope.loading=true;
        var jsonData = {
            startDate:moment(new Date()).subtract(30,'days'),
            endDate: new Date()
        };
        $http(
            {
                method: 'POST',
                url: '/api/v1/create/dashboards',
                data:jsonData
            }
        ).then(
            function successCallback(response){
                $state.go('app.reporting.dashboard',{id: response.data});
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
}