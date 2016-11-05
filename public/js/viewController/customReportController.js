showMetricApp.controller('customReportController',customReportController);

function customReportController($scope,$timeout,$rootScope,$http,$window,$state,$stateParams,createWidgets,$q) {
    $scope.customReportId;
    $scope.reportId;
    $scope.reportType=null;
    $scope.loading=false;
    $scope.reportLoading =false;
    $scope.exportReportLoading =true;
    $scope.$window = $window;
    $scope.autoArrangeGrid = false;
    $scope.currentDate=moment(new Date()).format("YYYY-DD-MM");
    $scope.widgetDataLength = 0;
    $scope.displayDate=moment(new Date()).format("MMM Do YY");
    $scope.displayHeader;
    $scope.reportNotSupported = false;
    $scope.exportReportPages=[];
    $scope.stepActive = 'step1';
    $scope.customReport = { widgets: [], widgetData: [] };
    $scope.orgLogosList = [];
    $scope.cliLogosList = [];
    $scope.orgLogoSrc = '/userFiles/datapoolt.png';
    $scope.cliLogoSrc = '/userFiles/plain-white.jpg';
//To set height for Window scroller in report Template
    $scope.docHeight = window.innerHeight;
    $scope.docHeight = $scope.docHeight-60;
    $scope.reportNotSupported = false;
    if(window.innerWidth>=1100)
        $scope.docWidth =  window.innerWidth-1080;
    else if(window.innerWidth>=992)
        $scope.docWidth =  window.innerWidth-990;
    else if(window.innerWidth>=767)
        $scope.docWidth =  window.innerWidth-720;
    else {
        $scope.reportNotSupported = true;
    }
    $scope.sideSpace = Math.floor($scope.docWidth/2);
    //Logo section starts here
    $scope.selectedIconIndicator = function(accType,getID) {
        if(accType == 'cli'){
            var $cols = $('.cliIcon')
            $cols.removeClass('selectIcon');
            $('#' + getID).addClass('selectIcon');
        }
        else if(accType=='org'){
            var $cols = $('.orgIcon');
            $cols.removeClass('selectIcon');
            $('#' + getID).addClass('selectIcon');

        }
    }

    $scope.fetchLogosFromDB = function(acType){
        var uploadData= {
            'accType':acType
        };
        $http({
            method: 'post',
            url: '/api/v1/fetchLogoToPdf/dashboard',
            data: uploadData
        }).then(
            function successCallback(response) {
                if(acType =='org')
                    $scope.orgLogosList = JSON.parse(JSON.stringify(response.data.logosInDB));
                else if(acType =='cli')
                    $scope.cliLogosList = JSON.parse(JSON.stringify(response.data.logosInDB));
            },
            function errorCallback(error) {
                $scope.orgLogosList = [];
                $scope.cliLogosList = [];
                swal({
                    title: '',
                    text: '<span style="sweetAlertFont">Something went wrong! Please reload the dashboard</span>',
                    html: true
                });
            }
        );

    };

    $scope.submitUpload = function(info,accType){
        var uploadData= {
            file : info,
            accType:accType
        };
        var uploadUrl = '/api/v1/createLogoToPdf/createFolder';
        var fd = new FormData();
        var fileType = info.type.split('/');
        if(fileType[1]=='png'||fileType[1]=='bmp'||fileType[1]=='jpg'||fileType[1]=='jpeg')
        {
            for(var key in uploadData)
                fd.append(key, uploadData[key]);
            $http.post(uploadUrl, fd, {
                transformRequest: angular.indentity,
                headers: { 'Content-Type': undefined }
            }).then(
                function successCallback(response){
                    document.getElementById('orgUploadButton').disabled = true;
                    document.getElementById('clientUploadButton').disabled = true;
                    // data.resolve(response.data.FileUrl);
                    $scope.fetchLogosFromDB(accType);
                },
                function errorCallback(err){
                    swal({
                        title: '',
                        text: '<span style="sweetAlertFont">Something went wrong! Please try again later</span>',
                        html: true
                    });
                }
            );
        }
        else{
            swal({
                title: '',
                text: '<span style="sweetAlertFont">Please Upload Only Image files(.jpg,.png,.jpeg,.bmp)</span>',
                html: true
            });
        }
        // return data.promise;;

    };

    $scope.removeLogo = function(imageInfo,accType) {
        var jsonData = {
            'fileUrl': imageInfo.fileUrl,
            "accType": accType,
        };
        $http({
            method: 'POST',
            url: '/api/v1/removeLogoToPdf/dashboard',
            data: jsonData
        }).then(
            function successCallback(response){
                // data.resolve(response.data.FileUrl);
                if(imageInfo.fileUrl == $scope.orgLogoSrc){
                    $scope.orgLogoSrc = '/userFiles/datapoolt.png';
                }
                else if (imageInfo.fileUrl == $scope.cliLogoSrc){
                    $scope.cliLogoSrc = '/userFiles/plain-white.jpg';
                }
                $scope.fetchLogosFromDB(accType);
            },
            function errorCallback(err){
                // data.resolve(err);
                swal({
                    title: '',
                    text: '<span style="sweetAlertFont">Something went wrong! Please try again later</span>',
                    html: true
                });
            }
        );
    }

    $scope.enableUploadbutton=function(accType){
        if(accType=='org')
            document.getElementById('orgUploadButton').disabled = false;
        else if(accType=='cli')
            document.getElementById('clientUploadButton').disabled = false;
    }

    $scope.selectedOrgLogo = function(imageInfo){
        $scope.orgLogoSrc = imageInfo;
    }

    $scope.selectedCliLogo = function(imageInfo){
        $scope.cliLogoSrc = imageInfo;
    }
    //Logos Section Code Ends
    $scope.exportReportGridsterOptions = {
        margins: [10, 20],
        columns: 10,
        rows:11,
        minRows:11,
        maxRows:500,
        defaultSizeX: 10,
        defaultSizeY: 2,
        minSizeX: 10,
        minSizeY: 1,
        swapping: true,
        floating: false,
        pushing: true,
        width: 'auto',
        colWidth:'auto',
        // rowHeight:85,
        draggable: {
            enabled: false,
        },
        outerMargin: true, // whether margins apply to outer edges of the grid
        mobileBreakPoint: 768,
        mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
        resizable: {
            enabled: false
        }
    };

    //Sets up all the required parameters for the dashboard to function properly when it is initially loaded. This is called in the ng-init function of the dashboard template
    $scope.printReportInPDF = function () {



        // $scope.windowWidth = String(parseInt(($window.outerWidth)*0.028))+'px';
        var widgetCopy = [];
        angular.copy($scope.customReport.widgets, widgetCopy);
        var pages = [];
        var pageNumber = 0;
        var rowNeutral = 0;
        do
        {
            var pageWidgets = [];
            loop4: for (var getWidgetInfo in widgetCopy) {
                if (widgetCopy[getWidgetInfo].pageNumber == pageNumber) {
                    if (widgetCopy[getWidgetInfo].widgetType == 'pageBreakWidget')
                        widgetCopy[getWidgetInfo] = null;
                    else if (widgetCopy[getWidgetInfo].widgetType == 'reportParaWidget' || widgetCopy[getWidgetInfo].widgetType == 'reportHeadingWidget') {
                        pageWidgets.push({
                            'pageNumber': pageNumber,
                            'row': rowNeutral,
                            'col': 0,
                            'sizeY': (typeof widgetCopy[getWidgetInfo].widgetType != 'reportHeadingWidget' ? widgetCopy[getWidgetInfo].sizeY : 1),
                            'sizeX': 12,
                            'widgetType':  widgetCopy[getWidgetInfo].widgetType ,
                            'name': (typeof widgetCopy[getWidgetInfo].name != 'undefined' ? widgetCopy[getWidgetInfo].name : ''),
                            'id': widgetCopy[getWidgetInfo].id,
                            'textData': widgetCopy[getWidgetInfo].textData||''
                        });
                        rowNeutral += widgetCopy[getWidgetInfo].sizeY;
                        widgetCopy[getWidgetInfo] = null;
                    }
                    else {
                        var widgetID = widgetCopy[getWidgetInfo].id;
                        pageWidgets.push({
                            // 'row': (typeof widgetCopy[getWidgetInfo].row != 'undefined' ? widgetCopy[getWidgetInfo].row : 0),
                            'pageNumber': pageNumber,
                            'row': rowNeutral,
                            'col': 0,
                            'sizeY': (typeof widgetCopy[getWidgetInfo].sizeY != 'undefined' ? widgetCopy[getWidgetInfo].sizeY : 4),
                            'sizeX': 12,
                            'name': (typeof widgetCopy[getWidgetInfo].name != 'undefined' ? widgetCopy[getWidgetInfo].name : ''),
                            'widgetType': (typeof widgetCopy[getWidgetInfo].widgetType != 'undefined' ? widgetCopy[getWidgetInfo].widgetType : ''),
                            'id': widgetCopy[getWidgetInfo].id,
                            'visibility': false,
                            'channelName': (typeof widgetCopy[getWidgetInfo].channelName != 'undefined' ? widgetCopy[getWidgetInfo].channelName : ''),
                            'dashboardId': (typeof widgetCopy[getWidgetInfo].dashboardId != 'undefined' ? widgetCopy[getWidgetInfo].dashboardId : '')
                        });
                        // }
                        rowNeutral += widgetCopy[getWidgetInfo].sizeY;
                        widgetCopy[getWidgetInfo] = null;
                    }
                }
                else
                    break loop4;
            }

            var len = widgetCopy.length;
            var temp = [];

            for (var k = 0; k < len; k++) {
                if (widgetCopy[k] != null) {
                    temp.push(widgetCopy[k]);
                }
            }
            widgetCopy = [];
            widgetCopy = temp;
            pages[pageNumber] = pageWidgets;
            rowNeutral = 0;
            ++pageNumber;
        }
        while (widgetCopy.length > 0);

        $scope.exportReportPages = pages;
        $scope.reportLoading=false;
        $scope.stepActive='step3';
        for(var widData in $scope.customReport.widgetData)
            $scope.customReport.widgetData[widData].visibility = true;
    };
    $scope.exportReportinPDF = function() {
        $("#reportDownloadButton").disabled =true;
        $('#reportDownloadButton').addClass("exportDisabled");
        $("#reportEditButton").disabled =true;
        $('#reportEditButton').addClass("exportDisabled");
        $(".navbar").css('z-index', '1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#reportPDFModalContent").addClass('md-show');
        $(".reportPdfHeadText").hide();
        $(".pdfContentText").html('<b>Please wait for few minutes while the PDF file is being generated</b>');
        $(".loadingStatus").show();
        var exportImages=[];
        //var dashboardExpLayout = document.getElementById('gridsterItems');
        // var dashboardExpLayout = document.getElementById('gridsterFullContainer');
        // var dashboardExpLayout = document.getElementById('gridsterItemsInReport');



        var dashboardExpLayout=[];
        var promiseExportObject = [];
        $scope.exportPromise = function(dashboardExpLayout) {
            var deferred = $q.defer();
            domtoimage.toPng(dashboardExpLayout)
                .then(
                    function (dataUrl) {
                        deferred.resolve(dataUrl);
                    },
                    function errorCallback(error) {
                        deferred.reject(error);
                        console.log("Dom to image fails",error);
                    });
            return deferred.promise;
        }
        for (var j = 0; j < $scope.exportReportPages.length; j++) {
            dashboardExpLayout[j] = document.getElementById('gridsterItemsInReport-'+j);
            promiseExportObject.push($scope.exportPromise(dashboardExpLayout[j]));
        }
        // promiseExportObject.push($scope.exportPromise(dashboardExpLayout));
        $q.all(promiseExportObject).then(
            function (exportImages) {
                var jsonData = {
                    "dashboardLayout": exportImages,
                    "dashboardId": $state.params.id,
                    "dashboardName": $scope.customReport.reportName
                };

                $http({
                    method: 'POST',
                    url: '/api/v1/createHtml5ToPdf/report',
                    data: jsonData
                }).then(
                    function successCallback(response) {
                        $("#exportOptionPDF").prop("checked", false);
                        var timestamp = Number(new Date());
                        var domainUrl = "";
                        if (window.location.hostname == "localhost")
                            domainUrl = "http://localhost:8080";
                        else
                            domainUrl = "";
                        var dwnldUrl = String(domainUrl + response.data.Response);
                        // $rootScope.closePdfModal();
                        $("#reportPDFModalContent").removeClass('md-show');
                        $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                        $("#reportPDFModalContent").addClass('md-show');

                        $(".loadingStatus").hide();
                        $(".reportPdfHeadText").show().text("PDF has been generated successfully");

                        $(".pdfContentText").html('<b><br/><a href="' + dwnldUrl + '" download style="color: green;"  id="yourLinkID">Click here to download your PDF</a></b>');
                        // window.saveAs(response.data.Response['blob'], dashboardName + "_" + timestamp + ".pdf");
                        // var newWindow = $window.open('', '_blank');
                        //console.log('pdf url',dwnldUrl);
                        // newWindow.location=dwnldUrl;
                        //document.getElementById('yourLinkID').click();
                        // $window.open(dwnldUrl);
                        // window.saveAs(dwnldUrl, dashboardName+"_"+timestamp+".pdf");
                        // $scope.expAct = false;
                        var jsonData = {
                            reportId: $scope.reportId,
                            pdfLink: dwnldUrl
                        };
                        $http({
                            method: 'POST',
                            url: '/api/v1/create/reports',
                            data: jsonData
                        }).then(
                            function successCallback(response) {
                                if(response.status == '200')
                                //console.log('PDF Link Updated in Db');
                                    $("#reportDownloadButton").disabled =false;
                                $("#reportDownloadButton").removeClass("exportDisabled");
                                $("#reportEditButton").disabled =false;
                                $("#reportEditButton").removeClass("exportDisabled");
                            },
                            function errorCallback(error) {
                                $("#reportDownloadButton").disabled =false;
                                $("#reportDownloadButton").removeClass("exportDisabled");
                                $("#reportEditButton").disabled =false;
                                $("#reportEditButton").removeClass("exportDisabled");
                                // swal({
                                //     title: "",
                                //     text: "<span style='sweetAlertFont'>Error in changing the name! Please try again</span> .",
                                //     html: true
                                // });
                            }
                        );
                    },
                    function errorCallback(error) {
                        // $rootScope.closePdfModal();
                        $("#reportPDFModalContent").removeClass('md-show');
                        $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                        $("#reportPDFModalContent").addClass('md-show');
                        $(".loadingStatus").hide();
                        $(".reportPdfHeadText").show().text("Uh-Oh!!").css({"font-style": 'normal', "color": "red"});
                        $(".pdfContentText").html('<b>Something went wrong. Please try again</b>');
                        $("#reportDownloadButton").disabled =false;
                        $("#reportDownloadButton").removeClass("exportDisabled");
                        $("#reportEditButton").disabled =false;
                        $("#reportEditButton").removeClass("exportDisabled");
                        // document.getElementById('dashboardTitleIcons').style.visibility = "visible";
                        // $scope.expAct = false;
                    }
                );
            },
            function errCallback(error) {
                swal({
                    title: '',
                    text: '<span style = "sweetAlertFont"> Sorry..! PDF download failed. </span>',
                    html: true
                });
            });
    };
    $scope.reportPdfPreview=function (opt) {
        if(opt=='step3') {
            $scope.reportLoading = true;
            // $scope.stepActive=true;
            for(var widData in $scope.customReport.widgetData)
                $scope.customReport.widgetData[widData].visibility = false;
            $timeout(function(){$scope.printReportInPDF()}, 1500);
        }
        else if(opt=='step2'){
            $scope.reportLoading = true;
            $scope.fetchLogosFromDB('org');
            $scope.fetchLogosFromDB('cli');
            $scope.reportLoading = false;
            $scope.stepActive = opt;
        }
        else{
            $scope.stepActive = opt;
            for(var widData in $scope.customReport.widgetData)
                $scope.customReport.widgetData[widData].visibility = true;
            // for(var i in $scope.customReport.widgetData){
            //     $timeout(resizeWidgetInPreview(i), 1200);
            // }
            // function resizeWidgetInPreview(i) {
            //     return function() {
            //         if(typeof $scope.customReport.widgetData[i].chart != 'undefined'){
            //             for(var j=0;j<$scope.customReport.widgetData[i].chart.length;j++){
            //                 if ($scope.customReport.widgetData[i].chart[j].api){
            //                     $scope.customReport.widgetData[i].chart[j].api.update();
            //                 }
            //             }
            //         }
            //     };
            // }
        }
    }
    $scope.customReportConfiguration = function () {

        $scope.reportLoading =true;
        $scope.dashboardWidgets=[];
        $scope.reportPagesDetails=[];
        //Defining configuration parameters for dashboard layout
        $scope.reportWidgetsListArray=[];

        $scope.customReport.reportName = '';
        $scope.widgetsPresent = false;
        $scope.loadedWidgetCount = 0;
        $scope.startDate;
        $scope.endDate;
        $scope.empWidget = {
            'col': 0,
            'sizeY':1,
            'sizeX': 10,
            'name':'Page Options'
        }
        $scope.setChartSize = function (index,childIndex) {
            $timeout(callAtTimeout, 100);
            function callAtTimeout() {
                if(document.getElementById('chartOptions'+index)!=null){
                    var parentWidth = document.getElementById('chartOptions'+index).offsetWidth;
                    var parentHeight = document.getElementById('chartOptions'+index).offsetHeight;
                    document.getElementById('chartRepeat'+index+'-'+childIndex).style.height = parentHeight + 'px'
                    document.getElementById('chartRepeat'+index+'-'+childIndex).style.width =parentWidth + 'px';
                }
            }

        }
        $scope.setChartSizeInReport = function (pageIndex,index,childIndex) {
            $timeout(callAtTimeout, 100);
            function callAtTimeout() {
                if(document.getElementById('reportChartOptions-'+pageIndex+'-'+index)!=null){
                    var parentWidth = document.getElementById('reportChartOptions-'+pageIndex+'-'+index).offsetWidth;
                    var parentHeight = document.getElementById('reportChartOptions-'+pageIndex+'-'+index).offsetHeight;
                    document.getElementById('reportChartRepeat-'+pageIndex+'-'+index+'-'+childIndex).style.height = parentHeight + 'px'
                    document.getElementById('reportChartRepeat-'+pageIndex+'-'+index+'-'+childIndex).style.width =parentWidth + 'px';
                }
            }

        }

        $scope.fetchReportDetails = function () {
            $http({
                method: 'GET',
                url: '/api/v1/get/report/' + null,
                params: {customReportId:$state.params.id}
            }).then(
                function successCallback(response) {
                    if (response.status == 200 && response.data.dashboardDeleted!=true) {

                        $scope.customReportId = response.data.customReportId;
                        $scope.reportId = response.data._id;
                        $scope.customReport.reportName = response.data.name;
                        $scope.reportType = response.data.type;
                        for(var widget in response.data.widgets){
                            $scope.reportWidgetsListArray.push(response.data.widgets[widget]);
                            if(response.data.widgets[widget].widgetType!='reportParaWidget'||response.data.widgets[widget].widgetType!='reportHeadingWidget'||response.data.widgets[widget].widgetType!='reportParaWidget'||response.data.widgets[widget].widgetId!=undefined||response.data.widgets[widget].widgetId!=null)
                                $scope.dashboardWidgets.push(response.data.widgets[widget].widgetId);
                        }
                        $scope.reportWidgetsListArray=_.uniq($scope.reportWidgetsListArray);
                        $scope.dashboardWidgets=_.uniq($scope.dashboardWidgets);
                        // console.log("Response in fetch reports",response,$scope.customReport,$scope.reportWidgetsListArray,$scope.dashboardWidgets);
                        var diffWithStartDate = dayDiff(response.data.startDate, new Date());
                        var diffWithEndDate = dayDiff(response.data.endDate, new Date());
                        var changeInDb = true;
                        function dayDiff(startDate, endDate) {
                            var storeStartDate = new Date(startDate);
                            var storeEndDate = new Date(endDate);
                            var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            return diffDays;
                        }

                        if (diffWithStartDate >= 365 || diffWithEndDate >= 365) {
                            $scope.startDate = moment(new Date()).subtract(30, 'days');
                            $scope.endDate = new Date();
                            storeDateInDb($scope.startDate,$scope.endDate, changeInDb);
                        }

                        else {
                            $scope. startDate = response.data.startDate;
                            $scope. endDate = response.data.endDate;
                            $scope.userModifyDate($scope.startDate, $scope.endDate);
                        }
                    }
                    // else if(response.data.dashboardDeleted!=true){
                    //     $scope.startDate = moment(new Date()).subtract(30, 'days');
                    //     $scope.endDate = new Date();
                    //     $scope.userModifyDate($scope.startDate, $scope.endDate)
                    // }
                    else{
                        $scope.reportLoading =false;
                        $scope.stepActive = 'error';
                        isExportOptionSet=0;
                        if(response.status==211)
                            swal({
                                title: '',
                                text: '<span style = "sweetAlertFont">Dashboard linked with this report is missing</span>',
                                html: true
                            });
                        else{
                            swal({
                                title: '',
                                text: '<span style = "sweetAlertFont">Error in populating Report! Report Doesnot Exist</span>',
                                html: true
                            });
                        }
                    }
                    // $scope.userModifyDate(startDate,endDate)
                },
                function errorCallback(error) {
                    $scope.reportLoading =false;
                    $scope.stepActive = 'error';
                    if(error.status==401)
                        swal({
                            title: '',
                            text: '<span style = "sweetAlertFont">Authentication required to perform this action</span>',
                            html: true
                        });
                    else if(error.status==211)
                        swal({
                            title: '',
                            text: '<span style = "sweetAlertFont">Dashboard linked with this report is missing</span>',
                            html: true
                        });
                    else
                        swal({
                            title: '',
                            text: '<span style = "sweetAlertFont">Error in populating Report! Report Doesnot Exist</span>',
                            html: true
                        });
                    isExportOptionSet=0;
                }
            )
        };

        $scope.fetchReportDetails();

        //To define the calendar in dashboard header
        $scope.userModifyDate = function (startDate, endDate) {
            $scope.dashboardCalendar = new Calendar({
                element: $('.daterange--double'),
                earliest_date: moment(new Date()).subtract(365, 'days'),
                latest_date: new Date(),
                start_date: startDate,
                end_date: endDate,
                callback: function () {
                    storeDateInDb(this.start_date, this.end_date);
                    $http.pendingRequests.forEach(function (request) {
                        if (request.cancel)
                            request.cancel.resolve();
                    });
                }
            });
            $scope.populateReportWidgets();
        };



        function storeDateInDb(start_date, end_date, changeInDb) {
            var jsonData = {
                reportId: $state.params.id,
                startDate: start_date,
                endDate: end_date
            };
            $http(
                {
                    method: 'POST',
                    url: '/api/v1/create/reports',
                    data: jsonData
                }
            ).then(
                function successCallback(response) {
                    if (response.status == 200) {
                        $scope.startDate = response.config.data.startDate;
                        $scope.endDate = response.config.data.endDate;
                        if (changeInDb === true) {
                            $scope.userModifyDate( $scope.startDate, $scope.endDate);
                        }
                        else {
                            $scope.populateReportWidgets();
                        }
                    }
                    else {
                        var startDate = this.start_date;
                        var endDate = this.end_date;
                        $scope.populateReportWidgets();
                    }
                    // var start = moment(this.start_date).format('ll'), end = moment(this.end_date).format('ll');
                },
                function errorCallback(error) {
                    var startDate = this.start_date;
                    var endDate = this.end_date;
                    $scope.populateReportWidgets();
                });
        }



        //Setting up grid configuration for widgets
        $scope.gridsterOptions = {
            margins: [10, 20],
            columns: 10,
            // rows:20,
            // minRows:20,
            maxRows:500,
            defaultSizeX: 10,
            defaultSizeY: 2,
            minSizeX: 10,
            minSizeY: 1,
            swapping: true,
            floating: true,
            pushing: true,
            width: 'auto',
            colWidth:'auto',
            // rowHeight:85,
            draggable: {
                enabled: false
                // handle: '.box-header',
                // stop: function (event, $element, widget) {
                //     // $rootScope.$broadcast('updateWidgetDetailsInReport',{});
                // }
            },
            outerMargin: true, // whether margins apply to outer edges of the grid
            mobileBreakPoint: 768,
            mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
            resizable: {
                enabled: false
            }
        };

        // $scope.$on('gridster-resized', function(sizes, gridster) {
        //     for(var i in $scope.customReport.widgetData){
        //         $timeout(resizeWidget(i), 100);
        //     }
        //     function resizeWidget(i) {
        //         return function() {
        //             if(typeof $scope.customReport.widgetData[i].chart != 'undefined'){
        //                 for(var j=0;j<$scope.customReport.widgetData[i].chart.length;j++){
        //                     if ($scope.customReport.widgetData[i].chart[j].api){
        //                         $scope.customReport.widgetData[i].chart[j].api.update();
        //                     }
        //                 }
        //             }
        //         };
        //     }
        // });

        $scope.$on('gridster-mobile-changed', function( e,gridster) {
            $scope.isMobile = gridster.isMobile;
        });
        $scope.$on('broadCastUpdateCharts', function (e,args) {
            $rootScope.$broadcast('updateWidgetDetailsInReport',{});
        });
        $scope.updateWidgetsInDb=function () {
            $rootScope.$broadcast('updateWidgetDetailsInReport',{});
        };
        angular.element($window).on('resize', function (e) {
            //To set height for Window scroller in customReport Template
            $scope.reportNotSupported = false;
            $scope.docHeight = window.innerHeight;
            $scope.docHeight = $scope.docHeight-60;
            if(window.innerWidth>=1100)
                $scope.docWidth = window.innerWidth> 1080 ? window.innerWidth-1080:0;
            else if(window.innerWidth>=992) {
                $scope.docWidth = window.innerWidth > 990 ? window.innerWidth - 990 : 0;
                // if($scope.stepActive == 'step1')
                // $scope.gridsterOptions.rowHeight = 120;
                // else if($scope.stepActive == 'step3')
                // $scope.expgridsterOptions.rowHeight = 120;
            }
            else if(window.innerWidth>=767) {
                $scope.docWidth = window.innerWidth > 720 ? window.innerWidth - 720 : 0;
                //     if($scope.stepActive == 'step1')
                //     $scope.gridsterOptions.rowHeight = 150;
                // else if($scope.stepActive == 'step3')
                //     $scope.expgridsterOptions.rowHeight = 150;
            }
            else {
                $scope.reportNotSupported = true;
            }
            $scope.sideSpace = Math.floor($scope.docWidth/2);
            if($scope.stepActive == 'step1')
                $scope.$broadcast('resize');
            else if($scope.stepActive == 'step3')
                $scope.$broadcast('report-resize');
        });



        $scope.$on('resize', function (e) {

            for (var i = 0; i < $scope.customReport.widgets.length; i++) {
                if($scope.customReport.widgets[i].widgetType!='reportParaWidget'||$scope.customReport.widgets[i].widgetType!='reportHeadingWidget') {
                    $timeout(resizeWidget(i), 10);
                }
            }
            function resizeWidget(k) {
                return function () {
                    if(document.getElementById('chartOptions'+k)!=null){
                        var parentWidth = document.getElementById('chartOptions'+k).offsetWidth;
                        var parentHeight = document.getElementById('chartOptions'+k).offsetHeight;
                        for(var i=0;i<Highcharts.charts.length;i++){
                            if(Highcharts.charts[i].container.parentElement.id.includes('chartRepeat'+k)){
                                Highcharts.charts[i].setSize(parentWidth,parentHeight); // reflow the first chart..
                                Highcharts.charts[i].reflow(); // reflow the chart..
                            }
                        }
                    }
                };
            }
        });
        $scope.$on('report-resize', function (e) {
            $timeout(function(){
                for(var pageWids in $scope.exportReportPages) {
                    for (var i in $scope.exportReportPages[pageWids]) {
                        if($scope.exportReportPages[pageWids][i].widgetType!='reportParaWidget'||$scope.exportReportPages[pageWids][i].widgetType!='reportHeadingWidget') {
                            $timeout(resizeReportWidget(pageWids, i), 800);
                        }
                    }
                    //console.log('page details',Highcharts.charts, pageWids,$scope.exportReportPages[pageWids]);
                }
                function resizeReportWidget(pageInd,k) {
                    return function () {
                        if(document.getElementById('reportChartOptions-'+pageInd+'-'+k)!=null){
                            var parentWidth = document.getElementById('reportChartOptions-'+pageInd+'-'+k).offsetWidth;
                            var parentHeight = document.getElementById('reportChartOptions-'+pageInd+'-'+k).offsetHeight;
                            for(var i=0;i<Highcharts.charts.length;i++){
                                //console.log('parent elemt id',Highcharts.charts[i].container.parentElement.id,'reportChartRepeat-'+pageInd+'-'+k)
                                if(Highcharts.charts[i].container.parentElement.id.includes('reportChartRepeat-'+pageInd+'-'+k)){
                                    // console.log('chart reflowing happens at',i,k,Highcharts.charts[i]);
                                    Highcharts.charts[i].setSize(parentWidth,parentHeight); // reflow the first chart..
                                    Highcharts.charts[i].reflow(); // reflow the chart..
                                }
                            }
                        }
                    };
                }
            },10);

        });



        $scope.calculateRowHeight = function(data,noOfItems,widgetHeight,noOfCharts) {
            data.showComparision = false;
            if(widgetHeight<6) {
                if (noOfItems > 6)
                    data.showComparision = false;
                else data.showComparision = true;
            }
            else{
                if (noOfItems > 12)
                    data.showComparision = false;
                else data.showComparision = true;
            }
            // data.showComparision = true;
        };
        // $scope.calculateGraphColumn = function(data,noOfItems,widgetWidth,widgetHeight,noOfCharts) {
        //     data.showComparision = true;
        //     data.fontSize=12;
        //      var widgetWidth = Math.floor(6/noOfCharts);
        //      if(widgetWidth < 1)
        //      widgetWidth = 1;
        //
        //     var cols;
        //
        //      if(widgetWidth >= 6)
        //      {
        //          if(widgetHeight<3) {
        //              if (noOfItems <= 6)
        //                  cols = 1;
        //              else{
        //                  cols = 2;
        //                  data.fontSize = 10;
        //                  if (noOfItems > 12)
        //                      data.showComparision = false;
        //                 }
        //          }
        //          else{
        //              if (noOfItems <= 12)
        //                  cols = 1;
        //              else{
        //                  cols = 2;
        //                  data.fontSize = 10;
        //                  if (noOfItems > 24)
        //                      data.showComparision = false;
        //              }
        //          }
        //      }
        //      else if(widgetWidth >= 2){
        //          data.fontSize = 9;
        //          if(widgetHeight<3) {
        //              if (noOfItems <= 6)
        //                  cols = 1;
        //              else{
        //                  cols = 2;
        //                  if (noOfItems > 12)
        //                      data.showComparision = false;
        //              }
        //          }
        //          else{
        //              if (noOfItems <= 12)
        //                  cols = 1;
        //              else{
        //                  cols = 2;
        //                  if (noOfItems > 24)
        //                      data.showComparision = false;
        //              }
        //          }
        //      }
        //      else {
        //          data.fontSize = 12;
        //          cols=1;
        //          if(widgetHeight<3) {
        //              if (noOfItems > 6)
        //                  data.showComparision = false;
        //          }
        //          else{
        //              if (noOfItems > 12)
        //                  data.showComparision = false;
        //          }
        //      }
        //
        //     // data.showComparision = true;
        // };







//To disable editing for text
        $scope.disableTextEdit=function(widget,option){
            widget.textAreaHide=option;
            if(option == true)
                $rootScope.$broadcast('updateWidgetDetailsInReport',{});
        }
        //To update all the widgets in a report when the report is refreshed or opened or calendar date range in the report header is changed
        $scope.$on('updateWidgetDetailsInReport',function(e,args){
            // $scope.updateReport.widgets = args.reportWidgets || $scope.customReport.widgets
            var updateWidgetArray=[];
            if($scope.customReport.widgets.length>0) {
                for (var widgetId in $scope.customReport.widgets) {
                    if($scope.customReport.widgets[widgetId].widgetType == 'pageBreakWidget'){
                        updateWidgetArray[widgetId] = {
                            name: $scope.customReport.widgets[widgetId].name,
                            sizeY: $scope.customReport.widgets[widgetId].sizeY,
                            widgetType: $scope.customReport.widgets[widgetId].widgetType,
                            row: $scope.customReport.widgets[widgetId].row,
                            col: $scope.customReport.widgets[widgetId].col,
                            pageNumber: $scope.customReport.widgets[widgetId].pageNumber
                        }
                    }
                    else {
                        updateWidgetArray[widgetId] = {
                            widgetId: $scope.customReport.widgets[widgetId].id,
                            name: $scope.customReport.widgets[widgetId].name,
                            sizeY: $scope.customReport.widgets[widgetId].sizeY,
                            widgetType: $scope.customReport.widgets[widgetId].widgetType,
                            row: $scope.customReport.widgets[widgetId].row,
                            col: $scope.customReport.widgets[widgetId].col,
                            pageNumber: $scope.customReport.widgets[widgetId].pageNumber
                        }
                        if ($scope.customReport.widgets[widgetId].widgetType == 'reportParaWidget' || $scope.customReport.widgets[widgetId].widgetType == 'reportHeadingWidget') {
                            updateWidgetArray[widgetId].textData = $scope.customReport.widgets[widgetId].textData||'';
                        }
                        else
                            updateWidgetArray[widgetId].dashboardId = $scope.customReport.widgets[widgetId].dashboardId;
                    }
                    if ($scope.customReport.widgets[widgetId].isLastWidgetInPage != 'undefined' && $scope.customReport.widgets[widgetId].isLastWidgetInPage == true) {
                        updateWidgetArray[widgetId].isLastWidgetInPage = true;
                        updateWidgetArray[widgetId].sizeFilledInPage = $scope.customReport.widgets[widgetId].sizeFilledInPage;
                        updateWidgetArray[widgetId].sizeLeftInPage = $scope.customReport.widgets[widgetId].sizeLeftInPage;
                    }
                    if ($scope.customReport.widgets[widgetId].isFirstWidgetInPage != 'undefined' && $scope.customReport.widgets[widgetId].isFirstWidgetInPage == true)
                        updateWidgetArray[widgetId].isFirstWidgetInPage = true;
                }

                var jsonData ={
                    reportId:$scope.reportId,
                    widgets: updateWidgetArray
                }
                $http({
                    method: 'POST', url: '/api/v1/create/reports', data: jsonData
                }).then(
                    function successCallback(response){
                        toastr.info('Your changes have been saved successfully..!');
                    },
                    function errorCallback (error){

                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something is missing! Please refresh the dashboard</span> .",
                            html: true
                        });
                    }
                );
            }
        });
        $scope.toggleLegends = function (widgetId) {
            for(var widgetData in $scope.customReport.widgetData) {
                if($scope.customReport.widgetData[widgetData].id == widgetId) {
                    for(var chart in $scope.customReport.widgetData[widgetData].chart) {
                        if(typeof $scope.customReport.widgetData[widgetData].chart[chart].options.chart.showLegend != 'undefined') {
                            if($scope.customReport.widgetData[widgetData].chart[chart].options.chart.showLegend == true)
                                $scope.customReport.widgetData[widgetData].chart[chart].options.chart.showLegend = false;
                            else
                                $scope.customReport.widgetData[widgetData].chart[chart].options.chart.showLegend = true;
                        }
                    }
                }
            }
        };


    };


    //To populate all the widgets in a report when the report is refreshed or opened or calendar date range in the report header is changed
    $rootScope.populateReportWidgets = function() {
        $scope.customReport.widgets = [];
        $scope.customReport.widgetData = {};
        $scope.totalPagesinReport=[];
        $scope.widgetDataLength = 0;
        var jsonData= {
            widgets: $scope.dashboardWidgets
        };


        // console.log("Json data in populate reports",jsonData)
        $http({
            method: 'POST',
            url: '/api/v1/get/reportWidgets/',
            timeout:cancel.promise,
            cancel:cancel,
            data: jsonData
        })
            .then(
                function successCallback(response) {
                    $('.dr-dates').attr( 'contenteditable' , 'false' )
                    if (!response.data) {
                        isExportOptionSet = 0;
                        swal({
                            title: '',
                            text: '<span style = "sweetAlertFont">The requested Report has been deleted</span>',
                            html: true
                        });
                        $scope.reportLoading =false;
                        $scope.stepActive = 'error';
                    }
                    else {
                        if (response.data.error) {
                            isExportOptionSet = 0;
                            swal({
                                title: '',
                                text: '<span style = "sweetAlertFont">The requested Report has no widgets</span>',
                                html: true
                            });
                            $scope.reportLoading =false;
                            $scope.stepActive = 'error';
                        }
                        else{
                            if($scope.reportType=='null'){
                                swal({
                                    title: '',
                                    text: '<span style = "sweetAlertFont">Something went wrong.Please try again later.</span>',
                                    html: true
                                });
                                $scope.reportLoading =false;
                                $scope.stepActive = 'error';
                            }
                            else if($scope.reportType=='edited'){
                                var widgetsInReport = [];
                                angular.copy($scope.reportWidgetsListArray,widgetsInReport);
                                var customReportWidgetList = [];
                                var tempWidgetList = [];
                                var initialWidgetList = response.data;
                                if (initialWidgetList.length > 0) {
                                    $scope.loadedWidgetCount = 0;
                                    $scope.widgetsPresent = true;
                                }
                                else
                                    $scope.widgetsPresent = false;
                                var customReportWidgets = [];
                                var pages = [];

                                angular.copy(initialWidgetList,customReportWidgetList);
                                var pageNumbers = [];
                                var rowNeutral =1;
                                for (var getWidgetInfo in widgetsInReport) {
                                    pageNumbers.push(widgetsInReport[getWidgetInfo].pageNumber);
                                    if (widgetsInReport[getWidgetInfo].widgetType == 'reportParaWidget' ) {
                                        $scope.customReport.widgets.push({
                                            'pageNumber':widgetsInReport[getWidgetInfo].pageNumber,
                                            'row': rowNeutral,
                                            // 'row': (typeof widgetsInReport[getWidgetInfo].row != 'undefined' ? widgetsInReport[getWidgetInfo].row  : 0),
                                            'col': 0,
                                            'sizeY': (typeof widgetsInReport[getWidgetInfo].sizeY != 'undefined' ? widgetsInReport[getWidgetInfo].sizeY  : 4),
                                            'sizeX': 10,
                                            'name': (typeof widgetsInReport[getWidgetInfo].name != 'undefined' ? widgetsInReport[getWidgetInfo].name  : 'Paragraph Widget'),
                                            'widgetType': (typeof widgetsInReport[getWidgetInfo].widgetType != 'undefined' ? widgetsInReport[getWidgetInfo].widgetType : 'reportParaWidget'),
                                            'id': widgetsInReport[getWidgetInfo].widgetId,
                                            'textData': widgetsInReport[getWidgetInfo].textData||'',
                                            'textAreaHide':true
                                        });
                                        rowNeutral+=widgetsInReport[getWidgetInfo].sizeY;
                                    }
                                    else if(widgetsInReport[getWidgetInfo].widgetType == 'reportHeadingWidget'){
                                        $scope.customReport.widgets.push({
                                            'pageNumber':widgetsInReport[getWidgetInfo].pageNumber,
                                            'row': rowNeutral,
                                            // 'row': (typeof widgetsInReport[getWidgetInfo].row != 'undefined' ? widgetsInReport[getWidgetInfo].row  : 0),
                                            'col': 0,
                                            // 'sizeY': (typeof widgetsInReport[getWidgetInfo].sizeY != 'undefined' ? widgetsInReport[getWidgetInfo].sizeY  : 2),
                                            'sizeY': 1,
                                            'sizeX': 10,
                                            'name': (typeof widgetsInReport[getWidgetInfo].name != 'undefined' ? widgetsInReport[getWidgetInfo].name  : 'Heading Widget'),
                                            'widgetType': (typeof widgetsInReport[getWidgetInfo].widgetType != 'undefined' ? widgetsInReport[getWidgetInfo].widgetType : 'reportHeadingWidget'),
                                            'id': widgetsInReport[getWidgetInfo].widgetId,
                                            'textData': widgetsInReport[getWidgetInfo].textData||'',
                                            'textAreaHide':true
                                        });
                                        rowNeutral+=1;
                                    }
                                    else if(widgetsInReport[getWidgetInfo].widgetType == 'pageBreakWidget'){
                                        $scope.customReport.widgets.push({
                                            'pageNumber':widgetsInReport[getWidgetInfo].pageNumber,
                                            'row': rowNeutral,
                                            // 'row': (typeof widgetsInReport[getWidgetInfo].row != 'undefined' ? widgetsInReport[getWidgetInfo].row  : 4),
                                            'col': 0,
                                            'sizeY': 1,
                                            'sizeX': 10,
                                            'widgetType': 'pageBreakWidget',
                                            'name': (typeof widgetsInReport[getWidgetInfo].row != 'undefined' ? widgetsInReport[getWidgetInfo].name:'Page break')
                                        });
                                        rowNeutral+=1;
                                    }
                                    else {
                                        var widgetIndex = customReportWidgetList.map(function (el) {
                                            return el._id;
                                        }).indexOf(widgetsInReport[getWidgetInfo].widgetId);
                                        //console.log("widget Index find", widgetIndex, customReportWidgetList, widgetsInReport[getWidgetInfo].widgetId)
                                        if (widgetIndex != -1) {
                                            var widgetID = widgetsInReport[getWidgetInfo].widgetId;
                                            customReportWidgets[widgetID] = createWidgets.widgetHandler(customReportWidgetList[widgetIndex], {
                                                'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                                                'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                                            }, 'public');
                                            $scope.customReport.widgets.push({
                                                // 'row': (typeof customReportWidgetList[getWidgetInfo].row != 'undefined' ? customReportWidgetList[getWidgetInfo].row : 0),
                                                'pageNumber': widgetsInReport[getWidgetInfo].pageNumber,
                                                'row': rowNeutral,
                                                // 'row': (typeof widgetsInReport[getWidgetInfo].row != 'undefined' ? widgetsInReport[getWidgetInfo].row  : 4),
                                                'col': 0,
                                                'sizeY': (typeof widgetsInReport[getWidgetInfo].sizeY != 'undefined' ? (widgetsInReport[getWidgetInfo].sizeY) : 8),
                                                // 'sizeY':4,
                                                'sizeX': 10,
                                                'name': (typeof widgetsInReport[getWidgetInfo].name != 'undefined' ? widgetsInReport[getWidgetInfo].name : ''),
                                                'widgetType': (typeof widgetsInReport[getWidgetInfo].widgetType != 'undefined' ? widgetsInReport[getWidgetInfo].widgetType : ''),
                                                'id': widgetsInReport[getWidgetInfo].widgetId,
                                                'visibility': false,
                                                'channelName': (typeof customReportWidgetList[widgetIndex].channelName != 'undefined' ? customReportWidgetList[widgetIndex].channelName : ''),
                                                'dashboardId': (typeof widgetsInReport[getWidgetInfo].dashboardId != 'undefined' ? widgetsInReport[getWidgetInfo].dashboardId : '')
                                            });
                                            rowNeutral+=widgetsInReport[getWidgetInfo].sizeY;
                                            $scope.customReport.widgetData[widgetID]={
                                                'pageNumber': widgetsInReport[getWidgetInfo].pageNumber,
                                                'id': widgetsInReport[getWidgetInfo].widgetId,
                                                'chart': [],
                                                'visibility': false,
                                                'name': (typeof widgetsInReport[getWidgetInfo].name != 'undefined' ? widgetsInReport[getWidgetInfo].name : ''),
                                                'color': (typeof customReportWidgetList[widgetIndex].color != 'undefined' ? customReportWidgetList[widgetIndex].color : '')
                                            };
                                            $scope.widgetDataLength+=1;
                                            customReportWidgets[widgetID].then(
                                                function successCallback(customReportWidgets) {
                                                    for (var widgetIndex in $scope.customReport.widgetData) {
                                                        if ($scope.customReport.widgetData[widgetIndex].id == customReportWidgets.id) {
                                                            $scope.customReport.widgetData[widgetIndex] = customReportWidgets;
                                                            isExportOptionSet = 1;
                                                            $scope.loadedWidgetCount++;
                                                        }
                                                    }
                                                },
                                                function errorCallback(error) {
                                                    if (error.status === 401) {
                                                        $("#widgetData-" + error.data.id).hide();
                                                        if (error.data.errorstatusCode === 1003) {
                                                            $("#widgetData-" + error.data.id).hide();
                                                            $("#errorWidgetData-" + error.data.id).hide();
                                                            $("#errorWidgetTokenexpire-" + error.data.id).show();
                                                            $scope.widgetErrorCode = 1;
                                                            $scope.loadedWidgetCount++;
                                                            isExportOptionSet = 0;
                                                        }
                                                    } else {
                                                        $scope.loadedWidgetCount++;
                                                        if (typeof error.data.id != 'undefined') {
                                                            $("#widgetData-" + error.data.id).hide();
                                                            $("#errorWidgetData-" + error.data.id).show();
                                                            $("#errorWidgetTokenexpire-" + error.data.id).hide();
                                                            isExportOptionSet = 0;
                                                        }
                                                    }
                                                }
                                            );
                                        }
                                    }
                                    // if(widgetsInReport[getWidgetInfo].row==0){
                                    //     widgetsInReport[getWidgetInfo].row=1
                                    // }
                                    // if(widgetsInReport[getWidgetInfo].sizeLeftInPage==10 && widgetsInReport[getWidgetInfo].widgetType !='pageBreakWidget' ){
                                    //     if((widgetsInReport[getWidgetInfo].isFirstWidgetInPage!='undefined'&&widgetsInReport[getWidgetInfo].isFirstWidgetInPage==true)||widgetsInReport[getWidgetInfo].row==($scope.customReport.widgets[widInd].pageNumber*11)+1){
                                    if((widgetsInReport[getWidgetInfo].isFirstWidgetInPage!='undefined'&&widgetsInReport[getWidgetInfo].isFirstWidgetInPage==true)){
                                        var widInd = $scope.customReport.widgets.length-1;
                                        $scope.customReport.widgets[widInd].isFirstWidgetInPage=true;
                                        $scope.reportPagesDetails[widgetsInReport[getWidgetInfo].pageNumber] = {
                                            firstWidgetIndex: widInd
                                        }
                                    }
                                    if(widgetsInReport[getWidgetInfo].isLastWidgetInPage!='undefined'&&widgetsInReport[getWidgetInfo].isLastWidgetInPage==true){
                                        var widInd = $scope.customReport.widgets.length-1;
                                        $scope.reportPagesDetails[widgetsInReport[getWidgetInfo].pageNumber] = $scope.reportPagesDetails[widgetsInReport[getWidgetInfo].pageNumber]||{};
                                        $scope.reportPagesDetails[widgetsInReport[getWidgetInfo].pageNumber].sizeFilled = widgetsInReport[getWidgetInfo].sizeFilledInPage;
                                        $scope.reportPagesDetails[widgetsInReport[getWidgetInfo].pageNumber].sizeLeft = widgetsInReport[getWidgetInfo].sizeLeftInPage;
                                        $scope.reportPagesDetails[widgetsInReport[getWidgetInfo].pageNumber].lastWidgetIndex = widInd;
                                        $scope.customReport.widgets[widInd].isLastWidgetInPage=true;
                                        $scope.customReport.widgets[widInd].sizeFilledInPage= widgetsInReport[getWidgetInfo].sizeFilledInPage;
                                        $scope.customReport.widgets[widInd].sizeLeftInPage= widgetsInReport[getWidgetInfo].sizeLeftInPage;
                                    }

                                }
                                $scope.reportLoading =false;
                            }
                            else {
                                var widgets = [];
                                var customReportWidgetList = [];
                                var tempWidgetList = [];
                                var initialWidgetList = response.data;
                                for (getWidgetInfo in initialWidgetList) {
                                    if (initialWidgetList[getWidgetInfo].visibility == true)
                                        tempWidgetList.push(initialWidgetList[getWidgetInfo]);
                                }

                                if (tempWidgetList.length > 0) {
                                    $scope.loadedWidgetCount = 0;
                                    $scope.widgetsPresent = true;
                                }
                                else
                                    $scope.widgetsPresent = false;
                                var customReportWidgets = [];
                                var pages = [];
                                angular.copy(tempWidgetList,customReportWidgetList);
                                var n = 0;
                                var rowNeutral = 1;
                                do
                                {
                                    var pageWidgets = {
                                        sizeFilled: 0,
                                        sizeLeft: 5,
                                        widgetsCount:0
                                    };
                                    loop4: for (var getWidgetInfo in customReportWidgetList) {
                                        if (customReportWidgetList[getWidgetInfo].size.h < 2 || typeof  customReportWidgetList[getWidgetInfo].size == 'undefined') {
                                            customReportWidgetList[getWidgetInfo].size.h = 2;
                                        }
                                        if (customReportWidgetList[getWidgetInfo].size.h <= pageWidgets.sizeLeft)
                                        {
                                            // if (customReportWidgetList[getWidgetInfo].widgetType == 'reportParaWidget' || customReportWidgetList[getWidgetInfo].widgetType == 'reportHeadingWidget') {
                                            //     $scope.customReport.widgets.push({
                                            //         'pageNumber':n,
                                            //         'row': rowNeutral*4,
                                            //         'col': 0,
                                            //         'sizeY': (typeof customReportWidgetList[getWidgetInfo].sizeY != 'undefined' ? customReportWidgetList[getWidgetInfo].sizeY : 4),
                                            //         'sizeX': 24,
                                            //         'widgetType': (typeof customReportWidgetList[getWidgetInfo].widgetType != 'undefined' ? customReportWidgetList[getWidgetInfo].widgetType : ''),
                                            //         'name': (typeof customReportWidgetList[getWidgetInfo].name != 'undefined' ? customReportWidgetList[getWidgetInfo].name : ''),
                                            //         'id': customReportWidgetList[getWidgetInfo]._id,
                                            //         'textData': customReportWidgetList[getWidgetInfo].textData
                                            //     });
                                            //     // $scope.customReport.widgetData.push({
                                            //     //     'pageNumber':n,
                                            //     //     'id': customReportWidgetList[getWidgetInfo]._id,
                                            //     //
                                            //     //     'visibility': false,
                                            //     //     'name': (typeof customReportWidgetList[getWidgetInfo].name != 'undefined' ? customReportWidgetList[getWidgetInfo].name : ''),
                                            //     //     'color': (typeof customReportWidgetList[getWidgetInfo].color != 'undefined' ? customReportWidgetList[getWidgetInfo].color : '')
                                            //     // });
                                            // }
                                            // else {
                                            var widgetID = customReportWidgetList[getWidgetInfo]._id;
                                            customReportWidgets[widgetID] = createWidgets.widgetHandler(customReportWidgetList[getWidgetInfo], {
                                                'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                                                'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                                            }, 'public');
                                            $scope.customReport.widgets.push({
                                                // 'row': (typeof customReportWidgetList[getWidgetInfo].row != 'undefined' ? customReportWidgetList[getWidgetInfo].row : 0),
                                                'pageNumber':n,
                                                'row': rowNeutral,
                                                'col': 0,
                                                'sizeY': (typeof customReportWidgetList[getWidgetInfo].size != 'undefined' ? customReportWidgetList[getWidgetInfo].size.h *2 : 4),
                                                'sizeX': 10,
                                                'name': (typeof customReportWidgetList[getWidgetInfo].name != 'undefined' ? customReportWidgetList[getWidgetInfo].name : ''),
                                                'widgetType': (typeof customReportWidgetList[getWidgetInfo].widgetType != 'undefined' ? customReportWidgetList[getWidgetInfo].widgetType : ''),
                                                'id': customReportWidgetList[getWidgetInfo]._id,
                                                'visibility': false,
                                                'channelName': (typeof customReportWidgetList[getWidgetInfo].channelName != 'undefined' ? customReportWidgetList[getWidgetInfo].channelName : ''),
                                                'dashboardId': (typeof customReportWidgetList[getWidgetInfo].dashboardId != 'undefined' ? customReportWidgetList[getWidgetInfo].dashboardId : '')
                                            });
                                            $scope.customReport.widgetData[widgetID]={
                                                'pageNumber':n,
                                                'id': customReportWidgetList[getWidgetInfo]._id,
                                                'chart': [],
                                                'visibility': false,
                                                'name': (typeof customReportWidgetList[getWidgetInfo].name != 'undefined' ? customReportWidgetList[getWidgetInfo].name : ''),
                                                'color': (typeof customReportWidgetList[getWidgetInfo].color != 'undefined' ? customReportWidgetList[getWidgetInfo].color : '')
                                            };
                                            $scope.widgetDataLength+=1;
                                            customReportWidgets[widgetID].then(
                                                function successCallback(customReportWidgets) {
                                                    for (var widgetIndex in $scope.customReport.widgetData) {
                                                        if ($scope.customReport.widgetData[widgetIndex].id == customReportWidgets.id) {
                                                            $scope.customReport.widgetData[widgetIndex] = customReportWidgets;
                                                            isExportOptionSet = 1;
                                                            $scope.loadedWidgetCount++;
                                                        }
                                                    }
                                                },
                                                function errorCallback(error) {
                                                    if (error.status === 401) {
                                                        $("#widgetData-" + error.data.id).hide();
                                                        if (error.data.errorstatusCode === 1003) {
                                                            $("#widgetData-" + error.data.id).hide();
                                                            $("#errorWidgetData-" + error.data.id).hide();
                                                            $("#errorWidgetTokenexpire-" + error.data.id).show();
                                                            $scope.widgetErrorCode = 1;
                                                            $scope.loadedWidgetCount++;
                                                            isExportOptionSet = 0;
                                                        }
                                                    } else {
                                                        $scope.loadedWidgetCount++;
                                                        if (typeof error.data.id != 'undefined') {
                                                            $("#widgetData-" + error.data.id).hide();
                                                            $("#errorWidgetData-" + error.data.id).show();
                                                            $("#errorWidgetTokenexpire-" + error.data.id).hide();
                                                            isExportOptionSet = 0;
                                                        }
                                                    }
                                                }
                                            );
                                            if(pageWidgets.sizeLeft==5){
                                                var widInd = $scope.customReport.widgets.length-1;
                                                $scope.customReport.widgets[widInd].isFirstWidgetInPage=true;
                                                $scope.reportPagesDetails[n] = {
                                                    firstWidgetIndex:widInd
                                                    // firstWidgetId:$scope.customReport.widgets[widInd].id
                                                }
                                            }
                                            rowNeutral += (customReportWidgetList[getWidgetInfo].size.h*2);
                                            pageWidgets.sizeLeft-=(customReportWidgetList[getWidgetInfo].size.h);
                                            pageWidgets.sizeFilled+=(customReportWidgetList[getWidgetInfo].size.h);
                                            ++pageWidgets.widgetsCount;
                                            customReportWidgetList[getWidgetInfo] = null;
                                        }
                                        // else{
                                        //
                                        //     break loop4;
                                        // }
                                    }
                                    if(pageWidgets.widgetsCount>0){
                                        var widInd = $scope.customReport.widgets.length-1;
                                        $scope.reportPagesDetails[n] = $scope.reportPagesDetails[n]||{};
                                        $scope.reportPagesDetails[n].sizeFilled = pageWidgets.sizeFilled*2;
                                        $scope.reportPagesDetails[n].sizeLeft = pageWidgets.sizeLeft*2;
                                        $scope.reportPagesDetails[n].lastWidgetIndex = widInd;
                                        // $scope.reportPagesDetails[n].lastWidgetId = $scope.customReport.widgets[widInd].id;
                                        $scope.customReport.widgets[widInd].isLastWidgetInPage=true;
                                        $scope.customReport.widgets[widInd].sizeFilledInPage=pageWidgets.sizeFilled*2;
                                        $scope.customReport.widgets[widInd].sizeLeftInPage=pageWidgets.sizeLeft*2;
                                        $scope.customReport.widgets.push({
                                            'pageNumber':n,
                                            // 'row': (n+1)*11,
                                            'row': rowNeutral,
                                            'col': 0,
                                            'sizeY': 1,
                                            'sizeX': 10,
                                            'widgetType': 'pageBreakWidget',
                                            'name': 'Page Break'
                                        });
                                    }
                                    ++rowNeutral;
                                    var len = customReportWidgetList.length;
                                    var temp = [];
                                    var tempData = [];

                                    for (var k = 0; k < len; k++) {
                                        if (customReportWidgetList[k] != null) {
                                            temp.push(customReportWidgetList[k]);
                                        }
                                    }
                                    customReportWidgetList = [];
                                    customReportWidgetList = temp;
                                    pages[n] = pageWidgets;
                                    ++n;
                                    // rowNeutral=(n*11)+1;
                                }
                                while (customReportWidgetList.length > 0);
                                $scope.reportLoading =false;
                                // $scope.updateWidgetDetailsInReport($scope.customReport.widgets);
                                $rootScope.$broadcast('updateWidgetDetailsInReport',{});
                            }
                        }
                    }
                },
                function errorCallback(error) {
                    swal({
                        title: '',
                        text: '<span style = "sweetAlertFont">Error in populating widgets! Please refresh the Report again</span>',
                        html: true
                    });
                    isExportOptionSet=0;
                    $scope.reportLoading =false;
                    $scope.stepActive = 'error';
                }
            );
    };

    $scope.arrangingWidgetsinReport = function(newWidget,pageNumber,rowIndex) {
        var deferred = $q.defer();
        var rowNeutral = rowIndex;
        // var startIndex=$scope.reportPagesDetails[pageNumber].firstWidgetIndex+1;
        var startIndex;
        if($scope.reportPagesDetails[pageNumber]==undefined){
            $scope.reportPagesDetails[pageNumber]={
                sizeFilled:1,
                sizeLeft:9,
                firstWidgetIndex:$scope.customReport.widgets.length,
                lastWidgetIndex:$scope.customReport.widgets.length
            };
            $scope.customReport.widgets.push({
                'pageNumber':pageNumber,
                // 'row': (pageNumber+1)*11,
                'row': rowNeutral+1,
                'col': 0,
                'sizeY': 1,
                'sizeX': 10,
                'widgetType': 'pageBreakWidget',
                'name': 'Avaliable Options'
            });
            newWidget.isFirstWidgetInPage=true;
            newWidget.isLastWidgetInPage=true;
            newWidget.sizeLeftInPage=9;
            newWidget.sizeFilledInPage=1;
            startIndex=$scope.customReport.widgets.length-1;
            deferred.resolve(startIndex);
        }
        else if(newWidget.sizeY<=$scope.reportPagesDetails[pageNumber].sizeLeft){

            startIndex=$scope.reportPagesDetails[pageNumber].firstWidgetIndex;
            // ++$scope.reportPagesDetails[pageNumber].lastWidgetIndex;
            var stopIndex=$scope.reportPagesDetails[pageNumber].lastWidgetIndex;
            $scope.reportPagesDetails[pageNumber].sizeLeft-=newWidget.sizeY;
            $scope.reportPagesDetails[pageNumber].sizeFilled+=newWidget.sizeY;
            ++$scope.reportPagesDetails[pageNumber].lastWidgetIndex;
            for(var index=startIndex;index<=stopIndex;index++){
                // $scope.customReport.widgets[index].row+=newWidget.sizeY;
                if($scope.customReport.widgets[index].isLastWidgetInPage==true){
                    $scope.customReport.widgets[stopIndex].sizeFilledInPage = $scope.reportPagesDetails[pageNumber].sizeFilled;
                    $scope.customReport.widgets[stopIndex].sizeLeftInPage = $scope.reportPagesDetails[pageNumber].sizeLeft;
                }
            }
            newWidget.isFirstWidgetInPage = true;
            $scope.customReport.widgets[startIndex].isFirstWidgetInPage = false;
            // $scope.customReport.widgets[stopIndex].sizeFilledInPage = $scope.reportPagesDetails[pageNumber].sizeFilled;
            // $scope.customReport.widgets[stopIndex].sizeLeftInPage = $scope.reportPagesDetails[pageNumber].sizeLeft;
            for(var pageIndex=pageNumber+1;pageIndex<$scope.reportPagesDetails.length;pageIndex++){

                ++$scope.reportPagesDetails[pageIndex].firstWidgetIndex;
                ++$scope.reportPagesDetails[pageIndex].lastWidgetIndex;
            }
            deferred.resolve(startIndex);
        }
        else{
            startIndex=$scope.reportPagesDetails[pageNumber].firstWidgetIndex;
            var pageNum = pageNumber;
            newWidget.isFirstWidgetInPage=true;
            $scope.customReport.widgets[startIndex].isFirstWidgetInPage = false;
            var customReportWidgetList = $scope.customReport.widgets.slice(startIndex);
            customReportWidgetList[0].row+=newWidget.sizeY;
            var rowNeutral = customReportWidgetList[0].row;
            var pageWidgets = {
                sizeFilled: 1,
                sizeLeft: 9,
                widgetsCount:0
            };
            loop1: do
            {
                var widgetIndex;
                loop2: for (var getWidgetInfo in customReportWidgetList) {
                    if (customReportWidgetList[getWidgetInfo].widgetType == 'pageBreakWidget'){
                        var  widgetInd = $scope.customReport.widgets.map(function (el) {
                            return el;
                        }).indexOf(customReportWidgetList[getWidgetInfo]);
                        if(widgetInd>-1) {
                            $scope.customReport.widgets.splice(widgetInd, 1)
                            customReportWidgetList[getWidgetInfo] = null;
                        }

                    }
                    else{
                        widgetIndex = $scope.customReport.widgets.map(function (el) {
                            return el.id;
                        }).indexOf(customReportWidgetList[getWidgetInfo].id);
                        if (widgetIndex != -1) {
                            if (customReportWidgetList[getWidgetInfo].sizeY <= pageWidgets.sizeLeft) {
                                if (customReportWidgetList[getWidgetInfo].pageNumber > pageNum) {
                                    $scope.reportPagesDetails[pageNum] = $scope.reportPagesDetails[pageNum] || {};
                                    $scope.reportPagesDetails[pageNum].sizeFilled = pageWidgets.sizeFilled;
                                    $scope.reportPagesDetails[pageNum].sizeLeft = pageWidgets.sizeLeft;
                                    $scope.reportPagesDetails[pageNum].lastWidgetIndex = widgetIndex - 1;
                                    // $scope.reportPagesDetails[pageNum].lastWidgetId = $scope.customReport.widgets[widgetIndex-1].id;
                                    $scope.customReport.widgets[widgetIndex - 1].isLastWidgetInPage = true;
                                    $scope.customReport.widgets[widgetIndex - 1].sizeFilledInPage = pageWidgets.sizeFilled;
                                    $scope.customReport.widgets[widgetIndex - 1].sizeLeftInPage = pageWidgets.sizeLeft;
                                    $scope.customReport.widgets.splice(widgetIndex,0,{
                                        'pageNumber':pageNum,
                                        'row': rowNeutral,
                                        // 'row': (pageNum+1)*11,
                                        'col': 0,
                                        'sizeY': 1,
                                        'sizeX': 10,
                                        'widgetType': 'pageBreakWidget',
                                        'name': 'Avaliable Options'
                                    });
                                    rowNeutral+=1;
                                    for (var pageIndex = customReportWidgetList[getWidgetInfo].pageNumber; pageIndex < $scope.reportPagesDetails.length; pageIndex++) {
                                        ++$scope.reportPagesDetails[pageIndex].firstWidgetIndex;
                                        ++$scope.reportPagesDetails[pageIndex].lastWidgetIndex;
                                    }
                                    break loop1;
                                }
                                else {
                                    $scope.customReport.widgets[widgetIndex].row = rowNeutral;
                                    if ($scope.customReport.widgets[widgetIndex].isLastWidgetInPage == true) {
                                        $scope.customReport.widgets[widgetIndex].isLastWidgetInPage = false;
                                    }
                                    if ($scope.customReport.widgets[widgetIndex].isFirstWidgetInPage == true) {
                                        $scope.customReport.widgets[widgetIndex].isFirstWidgetInPage = false;
                                    }
                                    $scope.customReport.widgets[widgetIndex].pageNumber = pageNum;
                                    if(pageWidgets.sizeLeft==10){
                                        $scope.customReport.widgets[widgetIndex].isFirstWidgetInPage=true;
                                        $scope.reportPagesDetails[pageNum] = {
                                            firstWidgetIndex:widgetIndex+1
                                        }
                                    }
                                    rowNeutral += customReportWidgetList[getWidgetInfo].sizeY;
                                    pageWidgets.sizeLeft -= (customReportWidgetList[getWidgetInfo].sizeY);
                                    pageWidgets.sizeFilled += (customReportWidgetList[getWidgetInfo].sizeY);
                                    pageWidgets.newPage = false;
                                    ++pageWidgets.widgetsCount;
                                    customReportWidgetList[getWidgetInfo] = null;
                                }
                            }
                            else {
                                $scope.reportPagesDetails[pageNum] = $scope.reportPagesDetails[pageNum] || {};
                                $scope.reportPagesDetails[pageNum].sizeFilled = pageWidgets.sizeFilled;
                                $scope.reportPagesDetails[pageNum].sizeLeft = pageWidgets.sizeLeft;
                                $scope.reportPagesDetails[pageNum].lastWidgetIndex = widgetIndex ;
                                $scope.customReport.widgets[widgetIndex - 1].isLastWidgetInPage = true;
                                $scope.customReport.widgets[widgetIndex - 1].sizeFilledInPage = pageWidgets.sizeFilled;
                                $scope.customReport.widgets[widgetIndex - 1].sizeLeftInPage = pageWidgets.sizeLeft;
                                $scope.customReport.widgets.splice(widgetIndex,0,{
                                    'pageNumber':pageNum,
                                    // 'row': (pageNum+1)*11,
                                    'row': rowNeutral,
                                    'col': 0,
                                    'sizeY': 1,
                                    'sizeX': 10,
                                    'widgetType': 'pageBreakWidget',
                                    'name': 'Avaliable Options'
                                });
                                rowNeutral+=1;
                                pageWidgets.newPage = true;
                                break loop2;
                            }
                        }
                    }
                }
                var len = customReportWidgetList.length;
                var temp = [];
                if(pageWidgets.newPage!='undefined' && pageWidgets.newPage!=true) {
                    $scope.reportPagesDetails[pageNum] = $scope.reportPagesDetails[pageNum] || {};
                    $scope.reportPagesDetails[pageNum].sizeFilled = pageWidgets.sizeFilled;
                    $scope.reportPagesDetails[pageNum].sizeLeft = pageWidgets.sizeLeft;
                    $scope.reportPagesDetails[pageNum].lastWidgetIndex = widgetIndex+1;
                    $scope.customReport.widgets[widgetIndex].isLastWidgetInPage = true;
                    $scope.customReport.widgets[widgetIndex].sizeFilledInPage = pageWidgets.sizeFilled;
                    $scope.customReport.widgets[widgetIndex].sizeLeftInPage = pageWidgets.sizeLeft;
                    $scope.customReport.widgets.splice(widgetIndex+1,0,{
                        'pageNumber':pageNum,
                        // 'row': (pageNum+1)*11,
                        'row': rowNeutral,
                        'col': 0,
                        'sizeY': 1,
                        'sizeX': 10,
                        'widgetType': 'pageBreakWidget',
                        'name': 'Avaliable Options'
                    });
                    rowNeutral+=1;
                }
                for (var k = 0; k < len; k++) {
                    if (customReportWidgetList[k] != null) {
                        temp.push(customReportWidgetList[k]);
                    }
                }
                customReportWidgetList = [];
                customReportWidgetList = temp;
                ++pageNum;
                pageWidgets = {
                    sizeFilled: 0,
                    sizeLeft: 10,
                    widgetsCount:0
                };
            }
            while (customReportWidgetList.length > 0);
            $scope.$broadcast('resize');
            deferred.resolve(startIndex);
            // $rootScope.$broadcast('updateWidgetDetailsInReport',{});
        }
        return deferred.promise;
    };
    //To add Heading or paragraph widget in Report
    $scope.addTextWidget =  function (widgetType,pageNumber,widgetIndex,rowIndex) {
        var jsonData=[];
        // var rowNeutral = (pageNumber*11)+1;
        var rowNeutral = rowIndex;
        var customReportsCopy = [];
        angular.copy($scope.customReport.widgets,customReportsCopy);
        if(widgetType =='reportParaWidget')
        {
            jsonData.push({
                'reportId':$scope.reportId,
                'row': rowNeutral,
                'col': 0,
                'sizeY': 1,
                'sizeX': 10,
                'widgetType': widgetType,
                'name':'Paragraph Widget',
                'textData': ''
            });
        }
        else{
            jsonData.push({
                'reportId':$scope.reportId,
                'row': rowNeutral,
                'col': 0,
                'sizeY': 1,
                'sizeX': 10,
                'widgetType': widgetType,
                'name':'Heading Widget',
                'textData': ''
            });
        }

        $http({
            method: 'POST', url: '/api/v1/create/textWidgets', data: jsonData
        }).then(
            function successCallback(response){
                var newWidget = {
                    'id':response.data.widgetsList[0]._id,
                    'pageNumber':pageNumber,
                    'row': rowNeutral,
                    'col': 0,
                    'sizeY': jsonData[0].sizeY,
                    'sizeX': 10,
                    'widgetType': widgetType,
                    'name': jsonData[0].name,
                    'textData': '',
                    'textAreaHide':false
                };
                var startIndex;
                var arrangePromise = [];
                arrangePromise.push($scope.arrangingWidgetsinReport(newWidget,pageNumber,rowNeutral));
                $q.all(arrangePromise).then(
                    function (successCB) {
                        startIndex=successCB[0];
                        $scope.customReport.widgets.splice(startIndex, 0, newWidget);
                        $timeout(updateWidgets, 2000);
                        function updateWidgets(){
                            $rootScope.$broadcast('updateWidgetDetailsInReport',{widgets:$scope.customReport.widgets})
                        }
                        // $timeout($rootScope.$broadcast('updateWidgetDetailsInReport',{widgets:$scope.customReport.widgets}), 3000);
                        // // $rootScope.$broadcast('updateWidgetDetailsInReport',{});
                    },
                    function errCallback(error) {
                        $scope.customReport.widgets=customReportsCopy;

                        $timeout(updateWidgets, 2000);
                        function updateWidgets(){
                            $rootScope.$broadcast('updateWidgetDetailsInReport',{widgets:$scope.customReport.widgets})
                        }
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Cannot Insert Widget at this moment! Please refresh the report</span> .",
                            html: true
                        });
                        $scope.populateReportWidgets();
                    });
                // $scope.arrangingWidgetsinReport(newWidget,pageNumber,rowNeutral);
                // console.log("Widgets arrange function finished");
                // $scope.customReport.widgets.splice(rowNeutral, 0, newWidget);
                // console.log("text widget added in",rowNeutral,newWidget);
            },
            function errorCallback (error){
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something is missing! Cannot Insert Widget at this moment!</span> .",
                    html: true
                });
            }
        );
    }
//To delete a widget from the dashboard
    $scope.deleteWidgetFromReport = function (widget) {
        var pageNum = widget.pageNumber;
        var widgetIndex = $scope.customReport.widgets.indexOf(widget);
        $scope.reportPagesDetails[pageNum].sizeLeft+=widget.sizeY;
        $scope.reportPagesDetails[pageNum].sizeFilled-=widget.sizeY;
        $scope.customReport.widgets.splice(widgetIndex, 1);
        if($scope.reportPagesDetails[pageNum].lastWidgetIndex>0)
            --$scope.reportPagesDetails[pageNum].lastWidgetIndex;

        var startIndex;
        // if(pageNum == 0)
        //     if(widget.isFirstWidgetInPage==true)
        //         startIndex=widgetIndex+1;
        //     else
        //         startIndex=widgetIndex;
        // else
        startIndex = widgetIndex;

        var stopIndex = $scope.reportPagesDetails[pageNum].lastWidgetIndex;
        if ($scope.customReport.widgets[stopIndex].widgetType != 'pageBreakWidget') {
            $scope.customReport.widgets[stopIndex].sizeFilledInPage = $scope.reportPagesDetails[pageNum].sizeFilled;
            $scope.customReport.widgets[stopIndex].sizeLeftInPage = $scope.reportPagesDetails[pageNum].sizeLeft;
        }
        if ($scope.reportPagesDetails[pageNum].sizeFilled == 0 || $scope.reportPagesDetails[pageNum].sizeLeft == 10) {
            if ($scope.customReport.widgets[widgetIndex].widgetType == 'pageBreakWidget') {
                $scope.customReport.widgets.splice(widgetIndex, 1);
                // if ($scope.reportPagesDetails[pageNum].lastWidgetIndex > 0)
                //     --$scope.reportPagesDetails[pageNum].lastWidgetIndex;
                $scope.reportPagesDetails.splice(pageNum, 1);
                for (var index = widgetIndex; index < $scope.customReport.widgets.length; index++) {
                    // $scope.customReport.widgets[index].row -= 11;
                    $scope.customReport.widgets[index].pageNumber -= 1;

                }

                for (var pageIndex = pageNum; pageIndex < $scope.reportPagesDetails.length; pageIndex++) {
                    $scope.reportPagesDetails[pageIndex].firstWidgetIndex -= 2;
                    $scope.reportPagesDetails[pageIndex].lastWidgetIndex -= 2;
                }
            }
        }
        else {
            if (widget.isLastWidgetInPage == true) {
                $scope.customReport.widgets[stopIndex].isLastWidgetInPage = true;
            }
            // else {
            //     for (var index = startIndex; index <= stopIndex; index++) {
            //         if ($scope.customReport.widgets[index].widgetType != 'pageBreakWidget') {
            //             console.log('inside delete loop', startIndex, stopIndex, index, $scope.customReport.widgets[index].row )
            //             $scope.customReport.widgets[index].row -= widget.sizeY;
            //
            //         }
            //     }
            // }

            if (widget.isFirstWidgetInPage == true)
                $scope.customReport.widgets[startIndex].isFirstWidgetInPage = true;

            for (var pageIndex = pageNum + 1; pageIndex < $scope.reportPagesDetails.length; pageIndex++) {

                --$scope.reportPagesDetails[pageIndex].firstWidgetIndex;
                --$scope.reportPagesDetails[pageIndex].lastWidgetIndex;
            }
        }

        $timeout(function(){$rootScope.$broadcast('updateWidgetDetailsInReport', {});},3000);
        // function updateChartsAfterDelete() {
        //     $rootScope.$broadcast('updateWidgetDetailsInReport', {});
        // }
        if (widget.widgetType == 'reportHeadingWidget' || widget.widgetType == 'reportParaWidget')
            $scope.deleteWidgetInDB(widget);
        else {
            delete $scope.customReport.widgetData[widget.id];
            $scope.loadedWidgetCount-=1;
            $scope.widgetDataLength-=1;
        }

    };
    $scope.deleteWidgetInDB = function(widget){
        var widgetType = widget.widgetType;
        var widgetId = widget.id;
        $http({
            method:'POST',
            url:'/api/v1/delete/textWidgets/' + widget.id
        }).then(
            function successCallback(response){
                //  console.log("Text Widget Deleted from db")
            },
            function errorCallback(error){
                swal({
                    title: '',
                    text: '<span style = "sweetAlertFont">Error in deleting the widget! Please try again</span>',
                    html: true
                });
            }
        );
    };
    //To change the name of the report to user entered value
    $scope.changeReportName = function () {
        var jsonData = {
            reportId: $scope.reportId,
            name: $scope.customReport.reportName
        };
        $http({
            method: 'POST',
            url: '/api/v1/create/reports',
            data: jsonData
        }).then(
            function successCallback(response) {
                //   if(response.status == '200')
                //  console.log('Report Name changed')
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Error in changing the name! Please try again</span> .",
                    html: true
                });
            }
        );
    };
    $scope.changeFooterText = function (footerText) {
        $scope.displayDate = footerText;
    };
    $scope.changeHeaderText = function (headerText) {
        $scope.displayHeader = headerText;
    };
    //Swapping two items in a javascript array
    $scope.swapArrayElements = function(indexA, indexB) {
        var temp = $scope.customReport.widgets[indexA];
        $scope.customReport.widgets[indexA] = $scope.customReport.widgets[indexB];
        $scope.customReport.widgets[indexB] = temp;
    };
    //To drag the widget up one level
    $scope.pushUpWidget = function (widgetCopy,widgetIndex) {
        var widget={};
        angular.copy(widgetCopy,widget);
        var pageNum = widget.pageNumber;
        // var widgetIndex = $scope.customReport.widgets.indexOf(widget);
        var widgetIndex = widgetIndex;
        if (widget.isFirstWidgetInPage == true) {
            var lastWidgetInd = $scope.reportPagesDetails[pageNum - 1].lastWidgetIndex;
            if ($scope.reportPagesDetails[pageNum - 1].sizeLeft >= widget.sizeY) {
                $scope.customReport.widgets[widgetIndex].pageNumber -= 1;
                $scope.customReport.widgets[widgetIndex].row = $scope.customReport.widgets[widgetIndex - 1].row;
                $scope.customReport.widgets[widgetIndex].isFirstWidgetInPage = false;
                $scope.reportPagesDetails[pageNum-1].sizeFilled+=widget.sizeY;
                $scope.reportPagesDetails[pageNum-1].sizeLeft-=widget.sizeY;
                var lastWid = $scope.reportPagesDetails[pageNum - 1].lastWidgetIndex;
                $scope.customReport.widgets[lastWid].isLastWidgetInPage=false;
                $scope.reportPagesDetails[pageNum - 1].lastWidgetIndex +=1;
                $scope.customReport.widgets[widgetIndex].sizeFilledInPage = $scope.reportPagesDetails[pageNum-1].sizeFilled;
                $scope.customReport.widgets[widgetIndex].sizeLeftInPage = $scope.reportPagesDetails[pageNum-1].sizeLeft;
                $scope.customReport.widgets[widgetIndex].isLastWidgetInPage = true;
                $scope.swapArrayElements(widgetIndex, widgetIndex - 1);
                if (widget.isLastWidgetInPage == true||$scope.reportPagesDetails[pageNum].sizeFilled==widget.sizeY) {
                    if ($scope.customReport.widgets[widgetIndex + 1].widgetType == 'pageBreakWidget') {
                        $scope.customReport.widgets.splice(widgetIndex + 1, 1);
                        // if ($scope.reportPagesDetails[pageNum].lastWidgetIndex > 0)
                        //     --$scope.reportPagesDetails[pageNum].lastWidgetIndex;
                        $scope.reportPagesDetails.splice(pageNum, 1);
                        for (var index = widgetIndex + 1; index < $scope.customReport.widgets.length; index++) {
                            // $scope.customReport.widgets[index].row -= 11;
                            $scope.customReport.widgets[index].pageNumber -= 1;

                        }
                        for (var pageIndex = pageNum; pageIndex < $scope.reportPagesDetails.length; pageIndex++) {
                            $scope.reportPagesDetails[pageIndex].firstWidgetIndex -= 1;
                            $scope.reportPagesDetails[pageIndex].lastWidgetIndex -= 1;
                        }
                    }
                }
                else{
                    var lastWidInd =$scope.reportPagesDetails[pageNum].lastWidgetIndex;
                    $scope.reportPagesDetails[pageNum].firstWidgetIndex += 1;
                    var firstWidInd =$scope.reportPagesDetails[pageNum].firstWidgetIndex;
                    $scope.reportPagesDetails[pageNum].sizeLeft += widget.sizeY;
                    $scope.reportPagesDetails[pageNum].sizeFilled -= widget.sizeY;
                    $scope.customReport.widgets[firstWidInd].isFirstWidgetInPage = true;
                    $scope.customReport.widgets[lastWidInd].sizeFilledInPage = $scope.reportPagesDetails[pageNum].sizeFilled;
                    $scope.customReport.widgets[lastWidInd].sizeLeftInPage = $scope.reportPagesDetails[pageNum].sizeLeft;
                }

            }
            else if ($scope.customReport.widgets[lastWidgetInd].sizeY == widget.sizeY) {
                if ($scope.customReport.widgets[lastWidgetInd].isFirstWidgetInPage == undefined || $scope.customReport.widgets[lastWidgetInd].isFirstWidgetInPage != true)
                    $scope.customReport.widgets[widgetIndex].isFirstWidgetInPage = false;
                $scope.customReport.widgets[lastWidgetInd].isFirstWidgetInPage = true;
                $scope.customReport.widgets[lastWidgetInd].isLastWidgetInPage = false;
                if (widget.isLastWidgetInPage == true) {
                    $scope.customReport.widgets[lastWidgetInd].sizeFilledInPage = $scope.customReport.widgets[widgetIndex].sizeFilledInPage || $scope.reportPagesDetails[pageNum].sizeFilled;
                    $scope.customReport.widgets[lastWidgetInd].sizeLeftInPage = $scope.customReport.widgets[widgetIndex].sizeLeftInPage || $scope.reportPagesDetails[pageNum].sizeLeft;
                    $scope.customReport.widgets[lastWidgetInd].isLastWidgetInPage = true;
                }
                $scope.customReport.widgets[widgetIndex].sizeFilledInPage = $scope.reportPagesDetails[pageNum].sizeFilled;
                $scope.customReport.widgets[widgetIndex].sizeLeftInPage = $scope.reportPagesDetails[pageNum].sizeLeft;
                $scope.customReport.widgets[widgetIndex].isLastWidgetInPage = true;
                $scope.customReport.widgets[widgetIndex].pageNumber -= 1;
                $scope.customReport.widgets[lastWidgetInd].pageNumber += 1;

                var tempRow=$scope.customReport.widgets[widgetIndex].row;
                $scope.customReport.widgets[widgetIndex].row = $scope.customReport.widgets[lastWidgetInd].row;
                // tempRow+=$scope.customReport.widgets[widgetIndex].sizeY;
                // $scope.customReport.widgets[lastWidgetInd].row =tempRow+$scope.customReport.widgets[widgetIndex].sizeY+1;
                // $scope.customReport.widgets[widgetIndex-1].row =tempRow+$scope.customReport.widgets[widgetIndex].sizeY;

                $scope.swapArrayElements(widgetIndex, lastWidgetInd);
                // $scope.customReport.widgets[firstWidgetInd].row = tempRow;
                // $scope.customReport.widgets[widgetIndex+1].row = tempRow+$scope.customReport.widgets[firstWidgetInd].sizeY;
                // $scope.customReport.widgets[widgetIndex].row = tempRow+$scope.customReport.widgets[firstWidgetInd].sizeY+1;
                // $scope.customReport.widgets[widgetIndex].row = $scope.customReport.widgets[firstWidgetInd].row;

                $timeout(function () {
                    $scope.customReport.widgets[widgetIndex-1].row = tempRow-1;
                    $scope.customReport.widgets[widgetIndex].row = tempRow;
                },800);
            }
            else toastr.info('Sorry..! This widget can neither be pushed nor swapped at the moment');

        }
        else {
            if (widget.isLastWidgetInPage == true) {
                $scope.customReport.widgets[widgetIndex - 1].isLastWidgetInPage = true;
                $scope.customReport.widgets[widgetIndex - 1].sizeFilledInPage = $scope.customReport.widgets[widgetIndex].sizeFilledInPage || $scope.reportPagesDetails[pageNum].sizeFilled;
                $scope.customReport.widgets[widgetIndex - 1].sizeLeftInPage = $scope.customReport.widgets[widgetIndex].sizeLeftInPage || $scope.reportPagesDetails[pageNum].sizeLeft;
                $scope.customReport.widgets[widgetIndex].isLastWidgetInPage = false;
            }
            if ($scope.customReport.widgets[widgetIndex - 1].isFirstWidgetInPage == true) {
                $scope.customReport.widgets[widgetIndex].isFirstWidgetInPage = true;
                $scope.customReport.widgets[widgetIndex - 1].isFirstWidgetInPage = false
            }
            var tempRow = $scope.customReport.widgets[widgetIndex].row;
            if($scope.customReport.widgets[widgetIndex].sizeY==$scope.customReport.widgets[widgetIndex - 1].sizeY) {
                $scope.customReport.widgets[widgetIndex].row = $scope.customReport.widgets[widgetIndex - 1].row;
                $scope.customReport.widgets[widgetIndex - 1].row = tempRow;
            }
            else{
                $scope.customReport.widgets[widgetIndex].row = $scope.customReport.widgets[widgetIndex - 1].row;
                // $scope.customReport.widgets[widgetIndex - 1].row = tempRow+$scope.customReport.widgets[widgetIndex].sizeY;
            }
            $scope.swapArrayElements(widgetIndex, widgetIndex - 1)
        }
    };
    //To drag the widget down one level
    $scope.pullDownWidget = function (widgetCopy,widgetIndex) {
        var widget={};
        angular.copy(widgetCopy,widget);
        // var widgetIndex = $scope.customReport.widgets.indexOf(widget);
        var widgetIndex = widgetIndex;
        var pageNum = widget.pageNumber;
        if (widget.isLastWidgetInPage == true) {
            var firstWidgetInd = $scope.reportPagesDetails[pageNum + 1].firstWidgetIndex;
            if ($scope.reportPagesDetails[pageNum+1].sizeLeft >= widget.sizeY) {
                $scope.customReport.widgets[widgetIndex].pageNumber += 1;
                $scope.customReport.widgets[widgetIndex+1].row = $scope.customReport.widgets[widgetIndex].row;
                $scope.customReport.widgets[widgetIndex].isLastWidgetInPage = false;
                $scope.customReport.widgets[widgetIndex].isFirstWidgetInPage = true;
                $scope.customReport.widgets[firstWidgetInd].isFirstWidgetInPage = false;
                $scope.reportPagesDetails[pageNum+1].firstWidgetIndex -=1;
                $scope.swapArrayElements(widgetIndex,widgetIndex+1);
                // $scope.reportPagesDetails[pageNum+1].lastWidgetIndex +=1;
                $scope.reportPagesDetails[pageNum+1].sizeLeft -= widget.sizeY;
                $scope.reportPagesDetails[pageNum+1].sizeFilled += widget.sizeY;
                var lastWidInd = $scope.reportPagesDetails[pageNum+1].lastWidgetIndex;
                $scope.customReport.widgets[lastWidInd].sizeFilledInPage = $scope.reportPagesDetails[pageNum+1].sizeFilled;
                $scope.customReport.widgets[lastWidInd].sizeLeftInPage =  $scope.reportPagesDetails[pageNum+1].sizeLeft;
                if (widget.isFirstWidgetInPage == true||$scope.reportPagesDetails[pageNum].sizeFilled==widget.sizeY) {
                    if ($scope.customReport.widgets[widgetIndex].widgetType == 'pageBreakWidget') {
                        $scope.customReport.widgets.splice(widgetIndex, 1);
                        // if ($scope.reportPagesDetails[pageNum].lastWidgetIndex > 0)
                        //     --$scope.reportPagesDetails[pageNum].lastWidgetIndex;
                        $scope.reportPagesDetails.splice(pageNum, 1);
                        for (var index = widgetIndex; index < $scope.customReport.widgets.length; index++) {
                            // $scope.customReport.widgets[index].row -= 11;
                            $scope.customReport.widgets[index].pageNumber -= 1;

                        }
                        for (var pageIndex = pageNum; pageIndex < $scope.reportPagesDetails.length; pageIndex++) {
                            $scope.reportPagesDetails[pageIndex].firstWidgetIndex -= 1;
                            $scope.reportPagesDetails[pageIndex].lastWidgetIndex -= 1;
                        }
                    }
                }
                else{
                    $scope.reportPagesDetails[pageNum].lastWidgetIndex -=1;
                    var lastWidInd = $scope.reportPagesDetails[pageNum].lastWidgetIndex;
                    $scope.reportPagesDetails[pageNum].sizeLeft += widget.sizeY;
                    $scope.reportPagesDetails[pageNum].sizeFilled -= widget.sizeY;
                    $scope.customReport.widgets[lastWidInd].isLastWidgetInPage = true;
                    $scope.customReport.widgets[lastWidInd].sizeFilledInPage = $scope.reportPagesDetails[pageNum].sizeFilled;
                    $scope.customReport.widgets[lastWidInd].sizeLeftInPage =  $scope.reportPagesDetails[pageNum].sizeLeft;
                    // $scope.customReport.widgets[widgetIndex + 1].isFirstWidgetInPage = true;
                }
            }
            else if ($scope.customReport.widgets[firstWidgetInd].sizeY == widget.sizeY) {
                if ($scope.customReport.widgets[widgetIndex].isFirstWidgetInPage == undefined || $scope.customReport.widgets[widgetIndex].isFirstWidgetInPage != true)
                    $scope.customReport.widgets[firstWidgetInd].isFirstWidgetInPage = false;
                $scope.customReport.widgets[widgetIndex].isFirstWidgetInPage = true;
                $scope.customReport.widgets[widgetIndex].isLastWidgetInPage = false;
                if ($scope.customReport.widgets[firstWidgetInd].isLastWidgetInPage == true) {
                    $scope.customReport.widgets[widgetIndex].sizeFilledInPage = $scope.customReport.widgets[firstWidgetInd].sizeFilledInPage || $scope.reportPagesDetails[pageNum + 1].sizeFilled;
                    $scope.customReport.widgets[widgetIndex].sizeLeftInPage = $scope.customReport.widgets[firstWidgetInd].sizeLeftInPage || $scope.reportPagesDetails[pageNum + 1].sizeLeft;
                    $scope.customReport.widgets[widgetIndex].isLastWidgetInPage = true;
                }
                $scope.customReport.widgets[firstWidgetInd].sizeFilledInPage = $scope.reportPagesDetails[pageNum].sizeFilled;
                $scope.customReport.widgets[firstWidgetInd].sizeLeftInPage =  $scope.reportPagesDetails[pageNum].sizeLeft;
                $scope.customReport.widgets[firstWidgetInd].isLastWidgetInPage = true;
                $scope.customReport.widgets[widgetIndex].pageNumber += 1;
                $scope.customReport.widgets[firstWidgetInd].pageNumber -= 1;
                var tempRow = $scope.customReport.widgets[widgetIndex].row;
                // $scope.customReport.widgets[firstWidgetInd].row = tempRow;
                // $scope.customReport.widgets[widgetIndex+1].row = tempRow+$scope.customReport.widgets[firstWidgetInd].sizeY;
                // $scope.customReport.widgets[widgetIndex].row = tempRow+$scope.customReport.widgets[firstWidgetInd].sizeY+1;
                $scope.customReport.widgets[widgetIndex].row = $scope.customReport.widgets[firstWidgetInd].row;
                $scope.swapArrayElements(widgetIndex, firstWidgetInd);
                $timeout(function () {
                    $scope.customReport.widgets[widgetIndex].row = tempRow;
                },800);
            }
            else toastr.info('Sorry..! This widget can neither be pulled nor swapped at the moment');
        }
        else {
            if (widget.isFirstWidgetInPage == true) {
                $scope.customReport.widgets[widgetIndex+1].isFirstWidgetInPage = true;
                $scope.customReport.widgets[widgetIndex].isFirstWidgetInPage = false;
            }
            if ($scope.customReport.widgets[widgetIndex+1].isLastWidgetInPage == true) {
                $scope.customReport.widgets[widgetIndex].isLastWidgetInPage = true;
                $scope.customReport.widgets[widgetIndex].sizeFilledInPage = $scope.customReport.widgets[widgetIndex+1].sizeFilledInPage || $scope.reportPagesDetails[pageNum].sizeFilled;
                $scope.customReport.widgets[widgetIndex].sizeLeftInPage = $scope.customReport.widgets[widgetIndex+1].sizeLeftInPage || $scope.reportPagesDetails[pageNum].sizeLeft;
                $scope.customReport.widgets[widgetIndex+1].isLastWidgetInPage = false
            }

            if($scope.customReport.widgets[widgetIndex].sizeY==$scope.customReport.widgets[widgetIndex+1].sizeY){
                var tempRow = $scope.customReport.widgets[widgetIndex+1].row;
                $scope.customReport.widgets[widgetIndex+1].row = $scope.customReport.widgets[widgetIndex].row;
                $scope.customReport.widgets[widgetIndex].row = tempRow;
            }
            else{
                var tempRow = $scope.customReport.widgets[widgetIndex].row;
                $scope.customReport.widgets[widgetIndex+1].row = tempRow;
                $scope.customReport.widgets[widgetIndex].row = tempRow+$scope.customReport.widgets[widgetIndex+1].sizeY;
            }
            $scope.swapArrayElements(widgetIndex, widgetIndex+1)
        }
    };
}

