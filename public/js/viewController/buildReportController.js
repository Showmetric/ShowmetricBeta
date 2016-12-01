showMetricApp.controller('buildReportController', buildReportController);

function buildReportController($scope,$http,$window,$timeout) {
    $scope.dashboardList = null;
    $scope.gridloading=true;
    $scope.selectedDashboard = null;
    $scope.selectedDashboards=[];
    $scope.disableFilter = true;
    $scope.customReportName='';
    $(".navbar").css('z-index','1');
    $(".md-overlay").css("background","rgba(0,0,0,0.5)");
    $scope.toggleDrafts = function () {
        $scope.disableFilter = $("#showDraftsBtn").prop("checked");
    }

    $scope.myFilter = function (item) {
        // var showDrafts = $("#showDraftsBtn").prop("checked");
        // console.log('showDrafts',showDrafts)
        // if(showDrafts==true)
        //     return item
        // else
        return item.pdfLink !== null ;
    };
    angular.element($window).on('resize', function (e) {
        $scope.docHeight = window.innerHeight;
        $scope.docHeight = $scope.docHeight - 105;
        $scope.dashboardHeight = window.innerHeight;
        $scope.dashboardHeight = $scope.dashboardHeight - 300;
        if(window.innerWidth<768){
            $scope.disableFilter=true;
            $("#showDraftsBtn").prop("checked",true);
        }
    });
    //To show a dropdown when clicked on settings icons inside a report thumbnail
    $scope.showSettings=function(id) {
        var dropDwn = "settingsDropdown-"+id;
        document.getElementById(String(dropDwn)).classList.toggle("shw");
    }

    $scope.fetchAllDashboards = function(){
        $scope.dashboardHeight = window.innerHeight;
        $scope.dashboardHeight = $scope.dashboardHeight-300;
        $scope.gridloading=true;
        $http({
            method: 'GET', url: '/api/v1/get/dashboardList'
        }).then(
            function successCallback(response){
                $scope.gridloading=false;
                document.getElementById('reportFinishButton').disabled = true;
                $('#reportFinishButton').addClass("exportDisabled");
                if(response.status == '200'){
                    if(response.data.user.roleId === 'admin'){
                        $scope.allDashboards= _.groupBy(response.data.dashboardList,'userId')
                    }else
                        $scope.dashboardList = response.data.dashboardList;
                }
                else
                    $scope.dashboardList = null;
            },
            function errorCallback(error){
                $scope.gridloading=false;
                document.getElementById('reportFinishButton').disabled = true;
                $('#reportFinishButton').addClass("exportDisabled");
                $scope.dashboardList = null;
                $(".navbar").css('z-index','1');
                $(".md-overlay").css("background","rgba(0,0,0,0.5)");
                $("#somethingWentWrongModalContent").addClass('md-show');
                //swal({  title: "", text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",   html: true });
            }
        )
    };
    $scope.fetchAllReports = function(){
        $scope.docHeight = window.innerHeight;
        $scope.docHeight = $scope.docHeight-105;
        $scope.gridloading=true;
        $http({
            method: 'GET', url: '/api/v1/get/reportList'
        }).then(
            function successCallback(response){
                $scope.gridloading=false;


                if(response.status == '200')
                    $scope.reportList = response.data.reportList;
                else
                    $scope.reportList = null;
            },
            function errorCallback(error){
                $scope.gridloading=false;
                $scope.reportList = null;
                $(".navbar").css('z-index','1');
                $(".md-overlay").css("background","rgba(0,0,0,0.5)");
                $("#somethingWentWrongModalContent").addClass('md-show');
                //swal({  title: "", text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",   html: true });
            }
        )
    };

    $scope.addNewReport = function (option) {
        $scope.newReportActive = option;
        $scope.selectedDashboards=[];
        $scope.gridloading=option;
        // if(option) {
        //     document.getElementById('reportFinishButton').disabled = true;
        //     document.getElementById('reportFinishButton').addClass("exportDisabled");
        //     // $('#reportFinishButton').addClass("exportDisabled");
        // }
    }
    $scope.selectDashboard = function (dashboard) {
        if(dashboard.isSelected == true) {
            dashboard.isSelected = false;
            // var temp = _.uniq( $scope.selectedDashboards);
            var temp = _.pull($scope.selectedDashboards, dashboard.dashboard._id);
            $scope.selectedDashboards = temp;
        }
        else {
            dashboard.isSelected = true;
            $scope.selectedDashboards.push(dashboard.dashboard._id);
        }

        if($scope.selectedDashboards.length>0) {
            document.getElementById('reportFinishButton').disabled = false;
            $('#reportFinishButton').removeClass("exportDisabled");
        }
        else{
            document.getElementById('reportFinishButton').disabled = true;
            $('#reportFinishButton').addClass("exportDisabled");
        }
    };
    $scope.createNewReport = function (selectedDashboards) {
        var jsonData = {
            "dashboards":  _.uniq(selectedDashboards),
            "name": $scope.customReportName||'',
            'startDate': moment(new Date()).subtract(30, 'days').format('YYYY-MM-DD'),
            'endDate': moment(new Date()).format('YYYY-MM-DD')
        };
        $http({
            method: 'POST', url: '/api/v1/create/reports', data: jsonData
        }).then(
            function successCallback(response){
                var newWindow = $window.open('', '_blank');
                $scope.gridloading=false;
                if(response.status == '200'){
                    $scope.fetchAllReports();
                    var reportId = response.data;
                    var reportDomain = window.location.hostname == 'localhost' ? "localhost:8080/customReports" : "https://" + window.location.hostname + "/customReports";
                    console.log('reportDomain',reportDomain)
                    //var reportUrl = reportDomain + '#/' + reportId;
                    var reportUrl = String(reportDomain + '#/' + reportId);
                    // $window.open(reportUrl,'_blank');
                    console.log("Window Opens",reportUrl)
                    $scope.addNewReport(false);
                    newWindow.location=reportUrl;

                }
                else
                    $scope.dashboardList = null;
            },
            function errorCallback(error){
                $scope.gridloading=false;
                $scope.dashboardList = null;
                $scope.addNewReport(false);
                $(".navbar").css('z-index','1');
                $(".md-overlay").css("background","rgba(0,0,0,0.5)");
                $("#somethingWentWrongModalContent").addClass('md-show');
                //swal({  title: "", text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",   html: true });
            }
        )
    }
    $scope.editReport = function (report) {
        var reportId = report.customReportId;
        var reportDomain = window.location.hostname == 'localhost' ? "localhost:8080/customReports" : "https://" + window.location.hostname + "/customReports";
        var reportUrl = reportDomain + '#/' + reportId;
        console.log("Window Opens",reportUrl);
        var newWindow = $window.open('', '_blank');
        newWindow.location=reportUrl;
        /*$timeout(function(){
         console.log('window opens after timeout');
         newWindow.location=reportUrl;
         },5000);*/
    }
    $scope.openReportPDF = function (report) {
        var newWindow = $window.open('', '_blank');
        var pdfUrl = report.pdfLink;
        console.log('pdf url',pdfUrl,report.pdfLink);
        newWindow.location=pdfUrl;
    }
    $scope.changeReportName=function(name){
        $scope.customReportName= name;
    }
    $scope.deleteReport = function(report){
        swal({
                title: "Confirm Delete?",
                text: "Reports and all its contents will be removed",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Confirm",
                closeOnConfirm: true
            },
            function () {
                $scope.gridloading=true;
                $(".navbar").css('z-index', '1');
                $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                $http({
                    method: 'POST',
                    url: '/api/v1/delete/userReports/' + report._id
                }).then(
                    function successCallback(response) {
                        $scope.fetchAllReports();
                    },
                    function errorCallback(error) {
                        $(".navbar").css('z-index','1');
                        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
                        $("#somethingWentWrongModalContent").addClass('md-show');
                        $("#somethingWentWrongText").text("Unable to delete Report.Please try again");
                    }
                );
            }
        );
    }
}