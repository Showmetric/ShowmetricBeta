showMetricApp.controller('FusionWidgetController', FusionWidgetController)

function FusionWidgetController($scope, $http, $q, $window, $state, $rootScope, generateChartColours) {
    $scope.currentView = 'step_one';
    $scope.objectList = [];
    $scope.metricList = {};
    $scope.tokenExpired=[];
    $scope.referenceWidgetsList = [];
    $scope.defaultWidgetName;
    $scope.profileList = [];
    $scope.storedObjects = {};
    $scope.referencechannelList = [];
    $scope.widgetType = 'fusion';
    $scope.storedUserChosenValues = [];
    $scope.profileOptionsModel = [];
    $scope.objectTypeList =[];
    $scope.fbAdObjId='';
    $scope.gaAdObjId='';
    var choosenProfile=[];
    $scope.canManage = true;
    var availableFusionWidgets;
    $scope.fusionRefreshButton='';
    var apiResponse = 0;

    angular.element(document).ready(function () {
        $('.ladda-button').addClass('icon-arrow-right');
        Ladda.bind( '.ladda-button',{
            callback: function( instance ){
                $scope.createAndFetchBasicWidget();
                $('.ladda-button').removeClass('icon-arrow-right');
                var progress = 0;
                var interval = setInterval( function(){
                    progress = Math.min( progress + Math.random() * 0.1, 1 );
                    instance.setProgress( progress );

                    if( progress === 1 && apiResponse === 1){
                        instance.stop();
                        clearInterval( interval );
                        $scope.ok();
                    }
                }, 50 );
            }
        });
      

    });

    $scope.changeViewsInBasicWidget = function (obj) {
        $scope.currentView = obj;
        if ($scope.currentView === 'step_one') {
          /*  document.getElementById('basicWidgetBackButton1').disabled = true;
            document.getElementById('basicWidgetNextButton').disabled = true;*/
            $scope.clearReferenceWidget();
            $scope.listOfReferenceWidget();
        }
        else if ($scope.currentView === 'step_two') {
           /* document.getElementById('basicWidgetBackButton1').disabled = true;*/
            $scope.getProfilesForDropdown();
        }
    };

    $scope.listOfReferenceWidget = function () {
        $http({
            method: 'GET',
            url: '/api/v1/get/referenceWidgets/' + $scope.widgetType+'?buster='+new Date()
        }).then(
            function successCallback(response) {
                $scope.userDetail=response.data.user
                $http({
                    method: 'GET',
                    url: '/api/v1/get/channels'
                }).then(
                    function successCallback(channel) {
                        var tempReference=[];
                        for (var i = 0; i < response.data.referenceWidgets.length; i++){
                            tempReference.push($scope.getChannelByReference(response.data.referenceWidgets[i],i,channel.data))
                        }
                        $q.all(tempReference).then(
                            function successCallback(temp) {
                                for (var i = 0; i < response.data.referenceWidgets.length; i++){
                                    $scope.referenceWidgetsList[i] = temp[i].widget;
                                    $scope.referenceWidgetsList[i].channels = temp[i].channels;
                                }
                            },
                            function errorCallback(err) {
                                swal({
                                    title: "",
                                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen fusions link</span> .",
                                    html: true
                                });
                            }
                        );
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen fusions link</span> .",
                            html: true
                        });
                    }
                );
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen fusions link</span> .",
                    html: true
                });
            }
        );
    };

    $scope.getChannelByReference=function(referenceWidget,index,channelData){
        var deferred = $q.defer();
        if(referenceWidget != null && referenceWidget!=undefined && channelData!=null && channelData!=undefined) {
            $scope.getAllChannels = [];
            $scope.uniqueChannelList = [];
            $scope.uniquechannelNames = [];
            var finalResult = {};
            for (var j = 0; j < referenceWidget.charts.length; j++) {
                $scope.getAllChannels.push(referenceWidget.charts[j].channelId);
            }
            $scope.uniqueChannelList = _.uniq($scope.getAllChannels);
            for (var k = 0; k < $scope.uniqueChannelList.length; k++) {
                for (var n = 0; n < channelData.length; n++) {
                    if (channelData[n]._id == $scope.uniqueChannelList[k]) {
                        $scope.uniquechannelNames.push(channelData[n].name);
                    }
                }
            }
            finalResult.widget = referenceWidget;
            finalResult.channels = $scope.uniquechannelNames
            deferred.resolve(finalResult);
        }
        else
            deferred.reject('getChannelByReference falied');

        return deferred.promise;
    }

    $scope.storeReferenceWidget = function () {
        $scope.storedReferenceWidget = this.referenceWidgets;
        $scope.storedReferenceCharts = this.referenceWidgets.charts;
    };

    $scope.clearReferenceWidget = function () {
        $scope.referenceWidgetsList = [];
        $scope.referencechannelList = [];
        $scope.objectList = [];
        $scope.profileList = [];
        $scope.storedUserChosenValues = [];
    };

    $scope.getProfilesForDropdown = function () {
        $scope.defaultWidgetName=$scope.storedReferenceWidget.name;
        for (var i = 0; i < $scope.storedReferenceCharts.length; i++) {
            $scope.referencechannelList.push($scope.storedReferenceCharts[i].channelId);
        }
        var channelList = $scope.referencechannelList;
        $scope.uniquechannelList = [];
        $scope.uniquechannelNames = [];
        $.each(channelList, function (i, el) {
            if ($.inArray(el, $scope.uniquechannelList) === -1) {
                $scope.uniquechannelList.push(el);
            }
        });
        $http({
            method: 'GET',
            url: '/api/v1/get/channels'
        }).then(
            function successCallback(response) {
                //$scope.channelList = response.data;
                for (var i = 0; i < $scope.uniquechannelList.length; i++) {
                    for (var j = 0; j < response.data.length; j++) {
                        if (response.data[j]._id == $scope.uniquechannelList[i]) {
                            choosenProfile=[];
                            $scope.uniquechannelNames.push(response.data[j].name);
                        }
                    }
                }
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen fusions link</span> .",
                    html: true
                });
            }
        );
        var tempProfileList = [];
        for (i = 0; i < $scope.uniquechannelList.length; i++) {
            tempProfileList.push($scope.selectProfile($scope.uniquechannelList[i], i));
        }
        $q.all(tempProfileList).then(
            function successCallback(tempProfileList) {
                $scope.profileList = tempProfileList;
            },
            function errorCallback(err) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen fusions link</span> .",
                    html: true
                });
            }
        );
    };

    $scope.addNewProfile = function (index) {
        var url, title;
        function popupwindow(url, title, w, h) {
            switch ($scope.uniquechannelNames[index]) {
                case 'Facebook':
                    url = '/api/v1/auth/facebook';
                    title = $scope.uniquechannelNames[index];
                    break;
                case 'Google Analytics':
                    url = '/api/v1/auth/google';
                    title = $scope.uniquechannelNames[index];
                    break;
                case 'FacebookAds':
                    url = '/api/auth/facebookads';
                    title = $scope.uniquechannelNames[index];
                    break;
                case 'Twitter':
                    url = '/api/auth/twitter';
                    title = $scope.uniquechannelNames[index];
                    break;
                case 'Instagram' :
                    url = '/api/auth/instagram';
                    title = $scope.uniquechannelNames[index];
                    break;
                case 'GoogleAdwords':
                    url = '/api/auth/adwords';
                    title = $scope.uniquechannelNames[index];
                    break;
            }
            var left = (screen.width / 2) - (w / 2);
            var top = (screen.height / 2) - (h / 2);
            $scope.tokenExpired = false;
            return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
        }
        popupwindow(url, title, 1000, 500);
    };

    $window.afterAuthentication = function () {
        $scope.getProfilesForDropdown();
    };

    $scope.selectProfile = function (channel, index) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/api/v1/get/profiles/' + channel+'?buster='+new Date()
        }).then(
            function successCallback(response) {
                deferred.resolve({
                    index: index,
                    profiles: response.data.profileList
                });
                $scope.objectList = [];
                $http({
                    method: 'GET', url: '/api/v1/get/objectType/' + channel+'?buster='+new Date()
                }).then(
                    function successCallback(response) {
                        $scope.objectTypeList=response.data.objectType;
                        for(var i=0;i<$scope.objectTypeList.length;i++){
                            if($scope.objectTypeList[i].type =='fbadaccount')
                                $scope.fbAdObjId = $scope.objectTypeList[i]._id;
                            else if($scope.objectTypeList[i].type =='adwordaccount')
                                $scope.gaAdObjId = $scope.objectTypeList[i]._id;
                        }
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                            html: true
                        });
                    }
                );
            },
            function errorCallback(error) {
                deferred.reject(error);
            }
        );
        return deferred.promise;
    };

    $scope.getObjectsForChosenProfile = function (profileObj, index) {

        $scope.checkExpiresIn = null;
        $scope.tokenExpired[index]=false;
        if (!profileObj) {
            //$scope.choosenProfile--;
            choosenProfile[index] = null;
            $scope.objectList[index] = null;
            if($scope.uniquechannelNames[index] === 'Google Analytics'){
                this.objectOptionsModel1='';
                $scope.objectForWidgetChosen($scope.objectList[index], index);
            }
            if ($scope.uniquechannelNames[index] === 'Twitter' || $scope.uniquechannelNames[index] === 'Instagram'||(($scope.uniquechannelNames[index] === 'GoogleAdwords')&&($scope.canManage == false))) {
                $scope.objectForWidgetChosen($scope.objectList[index], index);
            }
        }
        else {
            //$scope.choosenProfile++;
            document.getElementById('basicWidgetFinishButton').disabled = true;
            choosenProfile[index]=profileObj;
            $scope.storedUserChosenValues[index]=null;
            $scope.hasNoAccess = profileObj.hasNoAccess;
            if($scope.uniquechannelNames[index] === 'Google Analytics'){
                this.objectOptionsModel1='';
				document.getElementById('basicWidgetFinishButton').disabled = true;
            }
            if ((profileObj.canManageClients === false) && ($scope.uniquechannelNames[index] === 'GoogleAdwords')) {
                $scope.canManage = false;
                $scope.objectList[index]=null;
            }
            if (profileObj.canManageClients === true) {
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.canManage = true;
            }
            if ($scope.uniquechannelNames[index] == 'Facebook' || $scope.uniquechannelNames[index] == 'FacebookAds') {
                $scope.expiredRefreshButton = $scope.uniquechannelNames[index];
                if (profileObj.expiresIn != undefined)
                    $scope.checkExpiresIn = new Date(profileObj.expiresIn);
                $scope.tokenExpired[index] = false;
                //var profileId = this.profileOptionsModel._id;
                var expiresIn = profileObj.expiresIn;
                var currentDate = new Date();
                var newexpiresIn = new Date(expiresIn);
                if (currentDate <= newexpiresIn)
                    $scope.tokenExpired[index] = false;
                else if (expiresIn === undefined)
                    $scope.tokenExpired[index] = false;
                else
                    $scope.tokenExpired[index] = true;
            }

            $http({
                method: 'GET',
                url: '/api/v1/get/objects/' + profileObj._id+'?buster='+new Date()
            }).then(
                function successCallback(response) {
                    if ($scope.uniquechannelNames[index] === 'FacebookAds'){
                        $scope.objectList[index] = [];
                        for(var j=0;j<response.data.objectList.length;j++) {
                            if(response.data.objectList[j].objectTypeId == $scope.fbAdObjId) {
                                $scope.objectList[index].push(response.data.objectList[j]);
                            }
                        }

                    }
                    else if($scope.uniquechannelNames[index] === 'GoogleAdwords'){
                        $scope.objectList[index] = [];
                        for(var j=0;j<response.data.objectList.length;j++) {
                            if (response.data.objectList[j].objectTypeId == $scope.gaAdObjId) {
                                $scope.objectList[index].push(response.data.objectList[j]);
                            }
                        }
                    }
                    else {
                        $scope.objectList[index] = response.data.objectList;
                    }
                    if ($scope.uniquechannelNames[index] === 'Twitter' || $scope.uniquechannelNames[index] === 'Instagram') {
                        $scope.objectForWidgetChosen($scope.objectList[index][0], index);
                    }
                    if ((profileObj.canManageClients === false)&&($scope.uniquechannelNames[index] === 'GoogleAdwords')){
                        $scope.objectForWidgetChosen($scope.objectList[index][0], index);
                    }
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen fusions link</span> .",
                        html: true
                    });
                }
            );
        }
    };

    $scope.objectForWidgetChosen = function (objectList, index) {
        if(typeof objectList=== 'string' && objectList.length!=0)
            objectList = JSON.parse(objectList);
        else if (typeof objectList === 'string' && objectList.length == 0)
            objectList = null;


        if (objectList != null && $scope.currentView == 'step_two') {
            $scope.storedUserChosenValues[index] = {
                object: objectList,
                profile: this.profileOptionsModel[index]
            };
        }
        else if (objectList == null && $scope.currentView == 'step_two') {
            $scope.storedUserChosenValues[index] = {
                object: null,
                profile: null
            };
        }
        else if (objectList != null && $scope.currentView == 'step_one') {
            $scope.storedUserChosenValues = null;
        }
        var chosenObjectCount = 0;
        var chosenProfileCount=0;

        for (var i = 0; i < $scope.storedUserChosenValues.length; i++) {
            if ($scope.storedUserChosenValues[i] != null) {
                if ($scope.storedUserChosenValues[i].object != null) {
                    chosenObjectCount++;
                }

            }

        }
        for(var k=0;k<choosenProfile.length;k++){
            if(typeof choosenProfile[k] != "undefined"  && choosenProfile[k] !=null){
                chosenProfileCount++;
            }
        }

        if (chosenObjectCount!=0 && chosenObjectCount == chosenProfileCount && (  $scope.checkExpiresIn ===null || $scope.checkExpiresIn >= new Date()))
            document.getElementById('basicWidgetFinishButton').disabled = false;
        else
            document.getElementById('basicWidgetFinishButton').disabled = true;
    };

    $scope.removeExistingProfile = function (index) {
        var profileOptionsModel = this.profileOptionsModel;
        swal({
                title: "Confirm Delink the Profile?",
                text: "All data, widgets associated with this profile will be deleted! Confirm?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Confirm",
                closeOnConfirm: true
            },
            function () {
                if (profileOptionsModel) {
                    $http({
                        method: 'POST',
                        url: '/api/v1/post/removeProfiles/' + profileOptionsModel[index]._id
                    }).then(
                        function successCallback(response) {
                            $scope.getProfilesForDropdown();
                        },
                        function errorCallback(error) {
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Unable to delete profile.Please try again</span> .",
                                html: true
                            });
                        }
                    );
                }
            }
        );
    };

    $scope.refreshObjectsForChosenProfile = function (index) {
        if($scope.uniquechannelNames[index]=='Google Analytics'){
            this.objectOptionsModel1='';
            $scope.objectList[index]='';
            document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        if (this.profileOptionsModel[index]._id) {
            $scope.fusionRefreshButton=$scope.uniquechannelNames[index];

            switch ($scope.uniquechannelNames[index]) {
                case 'Facebook':
                    $scope.objectType = 'page';
                    break;
                case 'Google Analytics':
                    $scope.objectType = 'gaview';
                    break;
                case 'FacebookAds':
                    $scope.objectType = 'fbadaccount';
                    break;
                case 'Twitter':
                    $scope.objectType = 'tweet';
                    break;
                case 'Instagram' :
                    $scope.objectType = 'instagram';
                    break;
                case 'GoogleAdwords' :
                    $scope.objectType = 'adwordaccount';
                    break;
            }
            $http({
                method: 'GET',
                url: '/api/v1/channel/profiles/objectsList/' + this.profileOptionsModel[index]._id + '?objectType=' + $scope.objectType+'&buster='+new Date()
            }).then(
                function successCallback(response) {
                    $scope.objectList[index] = response.data;
                    $scope.fusionRefreshButton='';


                },
                function errorCallback(error) {
                    $scope.fusionRefreshButton='';
                    if(error.status === 401){
                        if(error.data.errorstatusCode === 1003){
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                                html: true
                            });
                            $scope.getProfilesForDropdown();
                        }
                    } else
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                            html: true
                        });
                }
            );
        }
    };

    $scope.createAndFetchBasicWidget = function () {
        var colourRepeatChecker = [];
        var duplicateChartArray=[];
        var chartCount = $scope.storedReferenceWidget.charts.length;
        colourRepeatChecker = generateChartColours.fetchRandomColors(chartCount);
        var matchingMetric = [];
        var inputParams = [];

        var widgetName = $scope.storedReferenceWidget.name || $scope.defaultWidgetName;
        for (var i = 0; i < $scope.storedReferenceCharts.length; i++) {
            matchingMetric = [];
            for (var j = 0; j < $scope.storedUserChosenValues.length; j++) {
                if (typeof $scope.storedUserChosenValues[j] != 'undefined' && $scope.storedUserChosenValues[j].profile!= null && $scope.storedReferenceCharts[i].channelId === $scope.storedUserChosenValues[j].profile.channelId) {
                    for (var k = 0; k < $scope.storedReferenceCharts[i].metrics.length; k++) {
                        if ($scope.storedReferenceCharts[i].metrics[k].objectTypeId === $scope.storedUserChosenValues[j].object.objectTypeId) {
                            matchingMetric.push($scope.storedReferenceCharts[i].metrics[k]);
                            matchingMetric[0].objectId = $scope.storedUserChosenValues[j].object._id;
                        }
                    }
                    $scope.storedReferenceWidget.charts[i].objectName = $scope.storedUserChosenValues[j].object.name;
                }
            }

                $scope.storedReferenceWidget.charts[i].metrics = matchingMetric;
                $scope.storedReferenceWidget.charts[i].colour = colourRepeatChecker[i];

        }

        for(var n = 0;n < $scope.storedReferenceWidget.charts.length; n++){
            if($scope.storedReferenceWidget.charts[n].metrics.length != 0){
                duplicateChartArray.push($scope.storedReferenceWidget.charts[n]);
            }

        }
        var jsonData = {
            "dashboardId": $state.params.id,
            "widgetType": $scope.widgetType,
            "name": widgetName,
            "description": $scope.storedReferenceWidget.description,
            "charts": duplicateChartArray,
            "order": $scope.storedReferenceWidget.order,
            "offset": $scope.storedReferenceWidget.offset,
            "size": $scope.storedReferenceWidget.size,
            "minSize": $scope.storedReferenceWidget.minSize,
            "maxSize": $scope.storedReferenceWidget.maxSize,
            "isAlert": $scope.storedReferenceWidget.isAlert,
            "visibility": true,
            "channelName": "custom"
        };
        inputParams.push(jsonData);
        //request to get the subscription details of the user on fusion widgets

        $http(
            {
                method: 'GET',
                url: '/api/v1/subscriptionLimits' + '?requestType=' + 'fusion'
            }
        ).then(
            function successCallback(response) {
                availableFusionWidgets = response.data.availableWidgets;
                if((availableFusionWidgets>0) && (availableFusionWidgets >= inputParams.length)){
                    $scope.ok();
                    $http({
                        method: 'POST',
                        url: '/api/v1/widgets',
                        data: inputParams
                    }).then(
                        function successCallback(response) {
                            apiResponse = 1;
                            for(widgetObjects in response.data.widgetsList)
                                $rootScope.$broadcast('populateWidget', response.data.widgetsList[widgetObjects]);
                        },
                        function errorCallback(error) {
                            apiResponse = 1;
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",
                                html: true
                            });
                        }
                    );
                }
                else{
                    var myDiv = document.getElementById('scroller');
                    myDiv.scrollTop = 0;
                    $('#errorInFusionWidgets').html('<div class="alert alert-danger fade in" style="width: 400px;margin-left: 212px;"><button type="button" class="close close-alert" data-dismiss="alert" aria-hidden="true">×</button>You have reached your Fusions limit. Please upgrade to enjoy more Fusions</div>');
                }
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong!!!!</span> .",
                    html: true
                });
            }
        );


    };

    $scope.dropdownWidth=function(hasnoAccess,tokenExpired){
        if(hasnoAccess==true || tokenExpired==true){
            return ('col-sm-'+9+' col-md-'+10+' col-lg-'+10+' col-xs-10');
        }
    }
}

