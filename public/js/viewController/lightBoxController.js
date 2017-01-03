showMetricApp.controller('LightBoxController', LightBoxController)

function LightBoxController($scope, $uibModal, $log, $state,$rootScope) {
    $scope.state = $state;
    $scope.animationsEnabled = true;
    $scope.open = function (size) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'modal.ejs',
            controller: 'ModalInstanceController',
            size: size,
            windowClass : 'modal-background'
        });
        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
            $state.go('^');
        }, function () {
            $state.go('^');$log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.openRecommendDashboard = function (size) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'modal.ejs',
            controller: 'ModalInstanceController',
            size: size,
            windowClass : 'modal-background'
        });
        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
            $state.go('app.reporting.dashboards');
        }, function () {
            $state.go('app.reporting.dashboards');
        });
    };
    $scope.openProfileListModal=function(size){
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'modal.ejs',
            controller: 'ModalInstanceController',
            size: size,
            windowClass : 'modal-background'
        });
        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
                $state.go('app.reporting.dashboards');
        }, function () {
            $state.go('app.reporting.dashboards');
        });
    }
    $scope.openPDFModal = function (size) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'modal.ejs',
            controller: 'ModalInstanceController',
            size: size,
            backdrop:'static',
            windowClass : 'modal-background'
        });
        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
            $state.go('^');
        }, function () {
            $state.go('^');$log.info('Modal dismissed at: ' + new Date());
        });
    };
    $scope.toggleAnimation = function () {$scope.animationsEnabled = !$scope.animationsEnabled;};
}
