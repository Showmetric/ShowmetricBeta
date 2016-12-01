showMetricApp.controller('RecommendedDashboardController', RecommendedDashboardController)

function RecommendedDashboardController($scope, $http, $window, $q, $state, $rootScope, generateChartColours) {
    $scope.currentView = 'step_one';
    $scope.expiredRefreshButton = [];
    $scope.recommendDashboard = [];
    $scope.getChannelList = {};
    $scope.profileList = [];
    $scope.objectList = [];
    $scope.otherObjectList=[];
    $scope.objectTypeList=[];
    $scope.tempList = [];
    $scope.recommendeDashboardName;
    $scope.metricList = {};
    $scope.referenceWidgetsList = [];
    $scope.storedObjects = {};
    $scope.referencechannelList = [];
    $scope.storedUserChosenValues = [];
    $scope.profileOptionsModel = [];
    $scope.dashboard = {};
    $scope.objectTypeList = [];
    $scope.fbAdObjId = '';
    $scope.gaAdObjId = '';
    $scope.canManage = true;
    $scope.fbSelectEnable=false;
    $scope.googleSelectEnable=false;
    $scope.campaignEnable=false;
    $scope.adSetEnable=false;
    $scope.adSetAdsEnable=false;
    $scope.campaignChosen=false;
    $scope.adSetChosen=false;
    $scope.adSetAdsChosen=false;
    $scope.googleCampaignEnable = false;
    $scope.adEnable = false;
    $scope.groupEnable = false;
    $scope.googleCampaignChosen = false;
    $scope.groupChosen = false;
    $scope.adChosen = false;
    $scope.messageEnable=[];
    $scope.recommendedRefreshButton = [];
    $scope.otherRefreshButton=[];
    $scope.tokenExpired = [];
    var isError;
    var progressStart = 0;
    var canFinishEnable=false;
    var fbAdsPresent=false;
    var googleAdsPresent=false;
    var fbAdsComplete=false;
    var googleAdsComplete=false;
    var objectTypeIds=[];

    angular.element(document).ready(function () {
        $('.ladda-button').addClass('icon-arrow-right');
        Ladda.bind('.ladda-button', {
            callback: function (instance) {
                $scope.createRecommendedDashboard();
                $('.ladda-button').removeClass('icon-arrow-right');
                var progress = 0;
                var interval = setInterval(function () {
                    progress = Math.min(progress + Math.random() * 0.1, 1);
                    instance.setProgress(progress);
                    if (progress === 1 && progressStart === 1) {
                        instance.stop();
                        clearInterval(interval);
                        $scope.ok();
                    }
                }, 50);
            }
        });


    });

    $scope.dropdownWidth = function (hasnoAccess, tokenExpired) {
        if (hasnoAccess == true || tokenExpired == true) {
            return ('col-sm-' + 10 + ' col-md-' + 10 + ' col-lg-' + 10 + ' col-xs-10');
        }
    }

    $scope.changeViewsInBasicWidget = function (obj) {
        if (isError) $scope.currentView = 'step_error';
        else $scope.currentView = obj;
        if ($scope.currentView === 'step_one') {
            canFinishEnable=false;
            fbAdsComplete=false;
            googleAdsComplete=false;
            fbAdsPresent=false;
            googleAdsPresent=false;
            objectTypeIds=[];
            $scope.fbSelectEnable=false;
            $scope.googleSelectEnable=false;
            $scope.clearReferenceWidget();
            $scope.listOfRecommendedDashboard();
        }
    };

    $scope.clearReferenceWidget = function () {
        $scope.objectList = [];
        $scope.profileList = [];
        $scope.otherObjectList=[];
        $scope.objectTypeList=[];
        $scope.storedUserChosenValues = [];
        $scope.recommendDashboard = [];
    };

    $scope.listOfRecommendedDashboard = function () {
        $http({
            method: 'GET',
            url: 'api/get/recommendDashboard' + '?buster=' + new Date()
        }).then(function successCallback(response) {
            $scope.wholeDataDetail = response.data;
            for (var i in response.data) {
                $scope.recommendDashboard.push(response.data[i]);
            }
            $http(
                {
                    method: 'GET',
                    url: '/api/v1/subscriptionLimits' + '?requestType=' + 'basic'
                }
            ).then(
                function successCallback(response) {
                    $scope.userDetail=response.data.user;
                    $scope.widgetCount = response.data.availableWidgets;
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span> .",
                        html: true
                    });
                })
        }, function errorCallback(error) {
            swal({
                title: "",
                text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                html: true
            });
        });
    };

    $scope.closeRecommendedDashboardModal = function () {
        changeState().then(
            function () {
                $state.go('app.reporting.dashboards');
            }
        )
    }

    function changeState() {
        var deferred = $q.defer();
        CloseModal();
        function CloseModal() {
            $scope.ok();
            deferred.resolve("open")
        }

        return deferred.promise;
    }

    $scope.getProfileForChosenChannel = function (dashboards) {
        //get the available widgets counts
        $http(
            {
                method: 'GET',
                url: '/api/v1/subscriptionLimits' + '?requestType=' + 'basic'
            }
        ).then(
            function successCallback(response) {
                if (dashboards.referenceWidgets.length >= response.data.availableWidgets) {
                    isError = true;
                    $('#error').html('<div class="alert alert-danger fade in" style="width: 400px;margin-left: 212px;"><button type="button" class="close close-alert" data-dismiss="alert" aria-hidden="true">×</button>You have reached your Widgets limit. Please upgrade to enjoy more Widgets</div>');
                }
                else {
                    $scope.changeViewsInBasicWidget('step_two');
                    //if($rootScope.isExpired === false){
                    $scope.fullOfDashboard = dashboards;
                    $scope.getChannelList = dashboards.channels;
                    $scope.referenceWidgetsList = dashboards.referenceWidgets;
                    for(var i=0;i<$scope.referenceWidgetsList.length;i++){
                        for(var j=0;j<$scope.referenceWidgetsList[i].charts.length;j++){
                            objectTypeIds.push($scope.referenceWidgetsList[i].charts[j].metrics[0].objectTypeId)
                        }
                    }
                    objectTypeIds=_.uniq(objectTypeIds);
                    var tempProfileList = [];
                    for (var key in  $scope.getChannelList) {
                        tempProfileList.push($scope.correspondingProfile($scope.getChannelList[key], key));
                    }
                    $q.all(tempProfileList).then(
                        function successCallback(tempProfileList) {
                            $scope.profileList = tempProfileList;
                        },
                        function errorCallback(err) {
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                                html: true
                            });
                        }
                    );
                    //}
                    /*else{
                     $('#alert_placeholder').html('<div class="alert alert-danger fade in" style="width: 400px;margin-left: 212px;"><button type="button" class="close close-alert" data-dismiss="alert" aria-hidden="true">×</button>Widget limit is reached !</div>')
                     }*/
                    /*}
                     else {
                     $('#alert_placeholder').html('<div class="alert alert-danger fade in" style="width: 400px;margin-left: 212px;"><button type="button" class="close close-alert" data-dismiss="alert" aria-hidden="true">×</button>Please renew !</div>')
                     }*/
                }
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                    html: true
                });
            })

    };

    $scope.correspondingProfile = function (profileId, index) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/api/v1/get/profiles/' + profileId._id + '?buster=' + new Date()
        }).then(
            function successCallback(response) {
                deferred.resolve({
                    profiles: response.data.profileList
                });
                $scope.objectList[index] = [];
                $scope.otherObjectList=[];
                $scope.objectTypeList[index]=[];
                $scope.messageEnable[index]=false;
                var tempObjType=[];
                $http({
                    method: 'GET', url: '/api/v1/get/objectType/' + profileId._id + '?buster=' + new Date()
                }).then(
                    function successCallback(response) {
                        tempObjType= response.data.objectType;
                        for (var i = 0; i < tempObjType.length; i++){
                            for(var j=0;j<objectTypeIds.length;j++){
                                if(tempObjType[i]._id ==objectTypeIds[j])
                                    $scope.objectTypeList[index].push(tempObjType[i]._id)
                            }
                        }
                        for (var i = 0; i < tempObjType.length; i++) {
                            if (tempObjType[i].type == 'fbadaccount')
                                $scope.fbAdObjId = tempObjType[i]._id;
                            else if (tempObjType[i].type == 'adwordaccount')
                                $scope.gaAdObjId = tempObjType[i]._id;
                        }
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                            html: true
                        });
                    }
                );
            },
            function errorCallback(error) {
                deferred.reject(error);
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                    html: true
                });
            }
        );
        return deferred.promise;
    };

    $scope.getObjectsForChosenProfile = function (profileObj, index) {
        $scope.tokenExpired[index] = false;
        $scope.messageEnable[index]=false;
        if($scope.getChannelList[index].name == 'FacebookAds'){
            $scope.selectedLevel = null;
            document.getElementById('basicWidgetFinishButton').disabled = true;
            $scope.campaignEnable = false;
            $scope.adSetAdsEnable = false;
            $scope.adSetEnable = false;
            $scope.campaign = null;
            $scope.adSetAds = null;
            $scope.adSet = null;
            $scope.campaignChosen = false;
            $scope.adSetChosen = false;
            $scope.adSetAdsChosen = false;
            $scope.fbSelectEnable = false;
        }
        if(($scope.getChannelList[index].name == 'GoogleAdwords')) {
            $scope.googleCampaignEnable = false;
            $scope.adEnable = false;
            $scope.groupEnable = false;
            $scope.googleCampaign = null;
            $scope.googleGroup = null;
            $scope.googleAd = null;
            $scope.googleCampaignChosen = false;
            $scope.groupChosen = false;
            $scope.adChosen = false;
            $scope.googleSelectEnable= false;
            document.getElementById('basicWidgetFinishButton').disabled = true;

        }
        if (!profileObj) {
            document.getElementById('basicWidgetFinishButton').disabled = true;
            $scope.objectList[index] = null;
            if($scope.getChannelList[index].name === 'Mailchimp' || $scope.getChannelList[index].name === 'Aweber'){
                for(var i=0;i<$scope.otherObjectList[index].length;i++){
                    $scope.otherObjectList[index][i]=[];
                    $scope.objectForWidgetChosen($scope.otherObjectList[index][i], index,i);
                }
            }
            if ($scope.getChannelList[index].name === 'Google Analytics') {
                this.objectOptionsModel1 = '';
                $scope.objectForWidgetChosen($scope.objectList[index], index,0);
            }
            if ($scope.getChannelList[index].name === 'Twitter' || $scope.getChannelList[index].name === 'Instagram' || (($scope.getChannelList[index].name === 'GoogleAdwords') && ($scope.canManage == false))) {
                $scope.objectForWidgetChosen($scope.objectList[index], index,0);
            }
        }
        else {
            $scope.otherObjectList[index]=[];
            if ($scope.getChannelList[index].name === 'Google Analytics') {
                this.objectOptionsModel1 = '';
                document.getElementById('basicWidgetFinishButton').disabled = true;
            }
            if ((profileObj.canManageClients === false) && ($scope.getChannelList[index].name === 'GoogleAdwords')) {
                $scope.canManage = false;
                $scope.objectList[index] = null;
            }
            if (profileObj.canManageClients === true) {
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.canManage = true;
            }
            if ($scope.profileOptionsModel.expiresIn != undefined)
                $scope.checkExpiresIn = new Date($scope.profileOptionsModel.expiresIn);
            $scope.tokenExpired[index] = false;
            var expiresIn = profileObj.expiresIn;
            var currentDate = new Date();
            var newExpiresIn = new Date(expiresIn);
            if (currentDate <= newExpiresIn && expiresIn != null)
                $scope.tokenExpired[index] = false;
            else if (expiresIn === undefined || expiresIn === null)
                $scope.tokenExpired[index] = false;
            else
                $scope.tokenExpired[index] = true;
            $http({
                method: 'GET',
                url: '/api/v1/get/objects/' + profileObj._id + '?buster=' + new Date()
            }).then(
                function successCallback(response) {
                    if ($scope.getChannelList[index].name === 'FacebookAds') {
                        $scope.profileId=profileObj._id;
                        $scope.expiredRefreshButton[index] = $scope.getChannelList[index].name;
                        $scope.objectList[index] = [];
                        for (var j = 0; j < response.data.objectList.length; j++) {
                            if (response.data.objectList[j].objectTypeId == $scope.fbAdObjId) {
                                $scope.objectList[index].push(response.data.objectList[j]);
                            }
                        }
                    }
                    else if ($scope.getChannelList[index].name === 'GoogleAdwords') {
                        $scope.googleProfileId = profileObj._id;
                        $scope.expiredRefreshButton[index] = $scope.getChannelList[index].name;
                        $scope.objectList[index] = [];
                        for (var j = 0; j < response.data.objectList.length; j++) {
                            if (response.data.objectList[j].objectTypeId == $scope.gaAdObjId) {
                                $scope.objectList[index].push(response.data.objectList[j]);
                            }
                        }
                    }
                    else if($scope.getChannelList[index].name === 'Mailchimp' || $scope.getChannelList[index].name === 'Aweber'){
                        var tempObjList = response.data.objectList
                        for(var i=0;i<$scope.objectTypeList[index].length;i++){
                            $scope.otherObjectList[index][i]=[];
                            for(var j=0;j<tempObjList.length;j++){
                                if($scope.objectTypeList[index][i]==tempObjList[j].objectTypeId)
                                    $scope.otherObjectList[index][i].push(tempObjList[j])
                            }
                        }
                    }
                    else {
                        $scope.expiredRefreshButton[index] = $scope.getChannelList[index].name;
                        $scope.objectList[index] = response.data.objectList;
                    }
                    if ($scope.getChannelList[index].name === 'Twitter' || $scope.getChannelList[index].name === 'Instagram') {
                        $scope.expiredRefreshButton[index] = null;
                        $scope.objectForWidgetChosen($scope.objectList[index][0], index,0);
                    }
                    if ((profileObj.canManageClients === false) && ($scope.getChannelList[index].name === 'GoogleAdwords')) {
                        $scope.objectForWidgetChosen($scope.objectList[index][0], index,0);
                    }
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                        html: true
                    });
                }
            );
        }
    };

    $scope.objectForWidgetChosen = function (objectList, index,childIndex) {
        if(!$scope.storedUserChosenValues[index])
            $scope.storedUserChosenValues[index]=[];
        if ((typeof objectList === 'string') && (objectList != '')) {
            var parsedObjectList = JSON.parse(objectList);
            objectList = parsedObjectList;
        }
        if (objectList != null && $scope.currentView == 'step_two') {
            if ((objectList != '') && (this.profileOptionsModel[index])) {
                $scope.storedUserChosenValues[index][childIndex] = {
                    object: objectList,
                    profile: this.profileOptionsModel[index],
                    channelName:$scope.getChannelList[index].name,
                    objectTypeLength:$scope.otherObjectList[index].length
                };
            }
            else {
                $scope.storedUserChosenValues[index][childIndex] = {
                    object: null,
                    profile: null,
                    channelName:$scope.getChannelList[index].name,
                    objectTypeLength:$scope.otherObjectList[index].length
                };
            }
        }
        else if (objectList == null && $scope.currentView == 'step_two') {
            $scope.storedUserChosenValues[index][childIndex] = {
                object: null,
                profile: null,
                channelName:$scope.getChannelList[index].name,
                objectTypeLength:$scope.otherObjectList[index].length
            };
        }
        else if (objectList != null && $scope.currentView == 'step_one') {
            $scope.storedUserChosenValues = null;
        }
        var chosenObjectCount = 0;
        for (var i = 0; i < $scope.storedUserChosenValues.length; i++) {
            var check=0;
            if($scope.storedUserChosenValues[i]){
                for(var j=0; j< $scope.storedUserChosenValues[i].length; j++){
                    if ($scope.storedUserChosenValues[i][j] != null) {
                        if($scope.storedUserChosenValues[i][j].channelName === 'Mailchimp' || $scope.storedUserChosenValues[i][j].channelName === 'Aweber'){
                            if($scope.storedUserChosenValues[i][j].object != null){
                                check++;
                                if(check==$scope.storedUserChosenValues[i][j].objectTypeLength)
                                    chosenObjectCount++;
                            }

                        }
                        else{
                            if ($scope.storedUserChosenValues[i][j].object != null) {
                                chosenObjectCount++;
                            }
                        }
                    }
                }
            }
        }
        for (var items in $scope.getChannelList){
            if($scope.getChannelList[items].name=='FacebookAds')
                fbAdsPresent=true;
            if($scope.getChannelList[items].name=='GoogleAdwords')
                googleAdsPresent=true;
        }
        if (chosenObjectCount == $scope.getChannelList.length)
            canFinishEnable=true;
        else
            canFinishEnable=false;
        if($scope.getChannelList[index].name === 'FacebookAds') {
            if (!objectList) {
                $scope.selectedObjectType = null;
                $scope.selectedLevel = null;
                $scope.selectedId = null;
                $scope.campaignChosen = false;
                $scope.adSetChosen = false;
                $scope.adSetAdsChosen = false;
                $scope.campaignEnable = false;
                $scope.adSetEnable = false;
                $scope.adSetAdsEnable = false;
                $scope.campaign = null;
                $scope.adSet = null;
                $scope.adSetAds = null;
                $scope.fbSelectEnable = false;
                document.getElementById('basicWidgetFinishButton').disabled = true;
            }
            else{
                $scope.selectedObjectType = null;
                $scope.selectedLevel = null;
                $scope.selectedId = null;
                $scope.campaignChosen = false;
                $scope.adSetChosen = false;
                $scope.adSetAdsChosen = false;
                $scope.campaignEnable = false;
                $scope.adSetEnable = false;
                $scope.adSetAdsEnable = false;
                $scope.campaign = null;
                $scope.adSet = null;
                $scope.adSetAds = null;
                $scope.accountId = objectList.channelObjectId;
                $scope.fbSelectEnable = true;
                $http({
                    method: 'GET', url: '/api/v1/get/objectType/' + $scope.getChannelList[index]._id+'?buster='+new Date()
                }).then(
                    function successCallback(response) {
                        $scope.fbObjectTypeList = response.data.objectType;
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                            html: true
                        });
                    }
                );
            }
        }
        if($scope.getChannelList[index].name ==='GoogleAdwords'){
            if (!objectList) {
                $scope.googleCampaignChosen = false;
                $scope.adChosen = false;
                $scope.groupChosen = false;
                $scope.googleCampaignEnable = false;
                $scope.adEnable = false;
                $scope.groupEnable = false;
                $scope.googleCampaign = null;
                $scope.googleAd = null;
                $scope.googleGroup = null;
                $scope.selectedGoogleObjectType = null;
                $scope.selectedGoogleLevel = null;
                $scope.selectedGoogleId = null;
                $scope.googleSelectEnable = false;
                document.getElementById('basicWidgetFinishButton').disabled = true;
            }
            else {
                $scope.googleCampaignChosen = false;
                $scope.adChosen = false;
                $scope.groupChosen = false;
                $scope.googleCampaignEnable = false;
                $scope.adEnable = false;
                $scope.groupEnable = false;
                $scope.googleCampaign = null;
                $scope.googleAd = null;
                $scope.googleGroup = null;
                $scope.selectedGoogleObjectType = null;
                $scope.selectedGoogleLevel = null;
                $scope.selectedGoogleId = null;
                $scope.googleAccountId = objectList.channelObjectId;
                $scope.googleSelectEnable = true;
                $http({
                    method: 'GET', url: '/api/v1/get/objectType/' + $scope.getChannelList[index]._id+'?buster='+new Date()
                }).then(
                    function successCallback(response) {
                        $scope.googleObjectTypeList = response.data.objectType;
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                            html: true
                        });
                    }
                );
            }
        }
        $scope.checkComplete();
    };

    $scope.selectLevelChosen = function (level,index) {
        $scope.messageEnable[index]=false;
        if(level) {
            var setLimitation=0;
            for(var i=0;i<$scope.referenceWidgetsList.length;i++){
                if($scope.referenceWidgetsList[i].name == "Cost per objective") setLimitation=1;
            }
            if(!this.objectTypeOptionsModel[index]){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.campaignChosen = false;
                $scope.adSetChosen = false;
                $scope.adSetAdsChosen = false;
                $scope.campaignEnable = false;
                $scope.adSetEnable = false;
                $scope.adSetAdsEnable = false;
                $scope.campaign = null;
                $scope.adSet = null;
                $scope.adSetAds = null;
                $scope.selectedObjectType = this.objectTypeOptionsModel[index];
                $scope.selectedLevel =null;
                $scope.selectedId = null;
                fbAdsComplete=false;
            }
            else{
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.campaignChosen = false;
                $scope.adSetChosen = false;
                $scope.adSetAdsChosen = false;
                $scope.campaignEnable = false;
                $scope.adSetEnable = false;
                $scope.adSetAdsEnable = false;
                $scope.campaign = null;
                $scope.adSet = null;
                $scope.adSetAds = null;
                $scope.selectedObjectType = this.objectTypeOptionsModel[index];
                $scope.selectedLevel = this.objectTypeOptionsModel[index].type;
                $scope.selectedId = this.objectTypeOptionsModel[index]._id;
                fbAdsComplete=false;
            }
        }
        if($scope.selectedLevel=='fbadaccount'){
            if(setLimitation){
                $scope.messageEnable[index]=true;
                fbAdsComplete=false;
            }
            else {
                if (($scope.profileId != null) && ($scope.accountId != null))
                    fbAdsComplete=true;
                else
                    fbAdsComplete=false;
            }
            $scope.checkComplete();
        }
        else if($scope.selectedLevel=='fbAdcampaign'){
            if($scope.campaignChosen==false){
                fbAdsComplete=false;
                $scope.campaignEnable=true;
                $scope.getCampaigns();
            }
            else {
                if(($scope.profileId!=null)&&($scope.accountId!=null)&&($scope.campaign!=null))
                    fbAdsComplete=true;
                else{
                    fbAdsComplete=false;
                }
            }
            $scope.checkComplete();
        }
        else if($scope.selectedLevel=='fbAdSet'){
            if(setLimitation){
                $scope.messageEnable[index]=true;
                fbAdsComplete=false;
            }
            else {
                if (($scope.campaignChosen == true) && ($scope.adSetChosen == true)) {
                    if (($scope.profileId != null) && ($scope.accountId != null) && ($scope.campaign != null) && ($scope.adSet != null))
                        fbAdsComplete=true;
                    else {
                        fbAdsComplete=false;
                    }
                }
                else if (($scope.campaignChosen == false) && ($scope.adSetChosen == false)) {
                    $scope.campaignEnable = true;
                    $scope.getCampaigns();
                }
                else if (($scope.campaignChosen == true) && ($scope.adSetChosen == false)) {
                    $scope.campaignEnable = true;
                    $scope.adSetEnable = true;
                    $scope.getAdSet();
                    fbAdsComplete=false;
                }
                else
                    fbAdsComplete=false;;
            }
            $scope.checkComplete();
        }
        else if($scope.selectedLevel=='fbAdSetAds'){
            if(setLimitation){
                $scope.messageEnable[index]=true;
                fbAdsComplete=false;
            }
            else {
                if (($scope.campaignChosen == true) && ($scope.adSetChosen == true) && ($scope.adSetAdsChosen == true)) {
                    if (($scope.profileId != null) && ($scope.accountId != null) && ($scope.campaign != null) && ($scope.adSet != null) && ($scope.adSetAds != null))
                        fbAdsComplete=true;
                    else {
                        fbAdsComplete=false;
                    }
                }
                else if ((($scope.campaignChosen == false) && ($scope.adSetChosen == false)) && ($scope.adSetAdsChosen == true)) {
                    fbAdsComplete=false;
                    $scope.campaignEnable = true;
                    $scope.getCampaigns();
                    $scope.adSetAdsChosen = false;
                    $scope.adSetAds = null;
                }
                else if (($scope.campaignChosen == true) && ($scope.adSetChosen == true) && ($scope.adSetAdsChosen == false)) {
                    fbAdsComplete=false;
                    $scope.adSetAdsEnable = true;
                    $scope.getAdSetAds();
                }
                else if (($scope.campaignChosen == false) && ($scope.adSetChosen == false) && ($scope.adSetAdsChosen == false)) {
                    fbAdsComplete=false;
                    $scope.campaignEnable = true;
                    $scope.getCampaigns();
                }
                else if (($scope.campaignChosen == true) && ($scope.adSetChosen == false) && ($scope.adSetAdsChosen == false)) {
                    fbAdsComplete=false;
                    $scope.adSetEnable = true;
                    $scope.getAdSet();
                }
                else if (($scope.campaignChosen == true) && ($scope.adSetChosen == false) && ($scope.adSetAdsChosen == true)) {
                    fbAdsComplete=false;
                    $scope.adSetEnable = true;
                    $scope.getAdSet();
                    $scope.adSetAdsChosen = false;
                    $scope.adSetAds = null;
                }
                else if (($scope.campaignChosen == false) && ($scope.adSetChosen == true) && ($scope.adSetAdsChosen == true)) {
                    fbAdsComplete=false;
                    $scope.campaignEnable = true;
                    $scope.getCampaigns();
                    $scope.adSetAdsChosen = false;
                    $scope.adSetAds = null;
                    $scope.adSetChosen = false;
                    $scope.adSet = null;
                }
                else if (($scope.campaignChosen == false) && ($scope.adSetChosen == true) && ($scope.adSetAdsChosen == false)) {
                    fbAdsComplete=false;
                    $scope.campaignEnable = true;
                    $scope.getCampaigns();
                    $scope.adSetAdsChosen = false;
                    $scope.adSetAds = null;
                    $scope.adSetChosen = false;
                    $scope.adSet = null;
                }
            }
            $scope.checkComplete();
        }
    };

    $scope.fbAdsCheck=function(level){
        var value=0;
        document.getElementById('basicWidgetFinishButton').disabled = true;
        if(level=='campaign'){
            $scope.adSet=null;
            $scope.adSetChosen=false;
            $scope.adSetAds=null;
            $scope.adSetAdsChosen=false;
            $scope.adSetEnable=false;
            $scope.adSetAdsEnable=false;
            $scope.campaign=this.campaignOptionsModel;
            if($scope.campaign)
                $scope.campaignChosen = true;
            else
                $scope.campaignChosen=false;
            value=1;
        }
        else if(level=='adset'){
            $scope.adSetAds=null;
            $scope.adSetAdsChosen=false;
            $scope.adSetAdsEnable=false;
            $scope.adSet=this.adSetOptionsModel;
            if($scope.adSet)
                $scope.adSetChosen=true;
            else
                $scope.adSetChosen=false;
            value=1;
        }
        else if(typeof(level=='adsetads')){
            $scope.adSetAds=this.adSetAdsOptionsModel;
            if($scope.adSetAds)
                $scope.adSetAdsChosen=true;
            else
                $scope.adSetAdsChosen=false;
            value=1;
        }
        if(value==1)
            $scope.selectLevelChosen();
    };

    $scope.getCampaigns=function(){
        var objectTypeId = $scope.selectedId;
        var accountId = $scope.accountId;
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&accountId=' + accountId+'&buster='+new Date()
        }).then(
            function successCallback(response) {
                $scope.campaignList = response.data.objectList;
                $scope.campaignOptionsModel = $scope.campaignList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.getAdSet=function(){
        var objectTypeId = $scope.selectedId;
        var campaignId = $scope.campaign.channelObjectId;
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&campaignId=' + campaignId+'&buster='+new Date()
        }).then(
            function successCallback(response) {
                $scope.adSetList = response.data.objectList;
                $scope.adSetOptionsModel = $scope.adSetList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.getAdSetAds=function() {
        var objectTypeId = $scope.selectedId;
        var adSetId = $scope.adSet.channelObjectId;
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&adSetId=' + adSetId+'&buster='+new Date()
        }).then(
            function successCallback(response) {
                $scope.adSetAdsList = response.data.objectList;
                $scope.adSetAdsOptionsModel = $scope.adSetAdsList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.refreshAdCampaign=function(level){
        $scope.refreshAdCampaignLoading=true;
        var objectTypeId = level;
        var accountId = $scope.accountId;
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&accountId=' + accountId+'&buster='+new Date()
        }).then(
            function successCallback(response) {
                $scope.campaignList = response.data;
                $scope.campaignOptionsModel = $scope.campaignList;
                $scope.refreshAdCampaignLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshAdCampaignLoading=false;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                            html: true
                        });
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
            }
        )
    };

    $scope.refreshAdSet=function(level){
        $scope.refreshAdSetLoading=true;
        var objectTypeId = level;
        var accountId = $scope.campaign.channelObjectId;
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&campaignId=' + accountId+'&buster='+new Date()
        }).then(
            function successCallback(response) {
                $scope.adSetList = response.data;
                $scope.adSetOptionsModel = $scope.adSetList;
                $scope.refreshAdSetLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshAdSetLoading=false;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                            html: true
                        });
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
            }
        )
    };

    $scope.refreshAdSetAds = function (level) {
        $scope.refreshAdSetAdsLoading=true;
        var objectTypeId = level;
        var accountId = $scope.adSet.channelObjectId;
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&adSetId=' + accountId+'&buster='+new Date()
        }).then(
            function successCallback(response) {
                $scope.adSetAdsList = response.data;
                $scope.adSetAdsOptionsModel = $scope.adSetAdsList;
                $scope.refreshAdSetAdsLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshAdSetAdsLoading=false;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                            html: true
                        });
                        $scope.tokenExpired=true;
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
            }
        )
    };

    $scope.googleSelectLevelChosen = function (level,index) {
        $scope.messageEnable[index]=false;
        if(level) {
            var accountLimitation=0;
            var campaignLimitation=0;
            var adGroupLimitation=0;
            var adSetLimitation=0;
            var campaignPresent=false;
            var adGroupPresent=false;
            var accountPresent=false;
            for (var i=0;i<$scope.referenceWidgetsList.length;i++) {
                if($scope.referenceWidgetsList[i].name == "Adwords campaigns overview (Account level)")
                    accountPresent=true;
                if($scope.referenceWidgetsList[i].name == "Adgroups overview (Campaign level)" || $scope.referenceWidgetsList[i].name == "Age Demographics (Campaign Level)" || $scope.referenceWidgetsList[i].name == "Gender Demographics (Campaign Level)"|| $scope.referenceWidgetsList[i].name == "Device Demographics (Campaign Level)")
                    campaignPresent=true;
                if($scope.referenceWidgetsList[i].name == "Ads overview (Adgroup level)"||$scope.referenceWidgetsList[i].name == "Age Demographics (Adgroup Level)"|| $scope.referenceWidgetsList[i].name == "Gender Demographics (Adgroup Level)"|| $scope.referenceWidgetsList[i].name == "Device Demographics (Adgroup Level)")
                    adGroupPresent=true;
            }
            if(campaignPresent==false && adGroupPresent==false && accountPresent==false){
                accountLimitation=0;
                campaignLimitation=0;
                adGroupLimitation=0;
                adSetLimitation=0;
            }
            if(campaignPresent==false && adGroupPresent==true && accountPresent==false){
                accountLimitation=1;
                campaignLimitation=1;
                adGroupLimitation=0;
                adSetLimitation=1;
            }
            if(campaignPresent==true && adGroupPresent==false && accountPresent==false){
                accountLimitation=1;
                campaignLimitation=0;
                adGroupLimitation=1;
                adSetLimitation=1;
            }
            if(campaignPresent==false && adGroupPresent==false && accountPresent==true){
                accountLimitation=0;
                campaignLimitation=1;
                adGroupLimitation=1;
                adSetLimitation=1;
            }
            if(campaignPresent==true && adGroupPresent==true && accountPresent==false){
                accountLimitation=1;
                campaignLimitation=1;
                adGroupLimitation=1;
                adSetLimitation=1;
            }
            if(campaignPresent==true && adGroupPresent==false && accountPresent==true){
                accountLimitation=1;
                campaignLimitation=1;
                adGroupLimitation=1;
                adSetLimitation=1;
            }
            if(campaignPresent==false && adGroupPresent==true && accountPresent==true){
                accountLimitation=1;
                campaignLimitation=1;
                adGroupLimitation=1;
                adSetLimitation=1;
            }
            if(campaignPresent==true && adGroupPresent==true && accountPresent==true){
                accountLimitation=1;
                campaignLimitation=1;
                adGroupLimitation=1;
                adSetLimitation=1;
            }
            if(this.objectTypeOptionsModel[index]) {
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.selectedGoogleObjectType =null;
                $scope.selectedGoogleLevel = null;
                $scope.selectedGoogleId = null;
                $scope.googleCampaignChosen = false;
                $scope.adChosen = false;
                $scope.groupChosen = false;
                $scope.googleCampaignEnable = false;
                $scope.adEnable = false;
                $scope.groupEnable = false;
                $scope.googleCampaign = null;
                $scope.googleAd = null;
                $scope.googleGroup = null;
                $scope.selectedGoogleObjectType = this.objectTypeOptionsModel[index];
                $scope.selectedGoogleLevel = this.objectTypeOptionsModel[index].type;
                $scope.selectedGoogleId = this.objectTypeOptionsModel[index]._id;
                googleAdsComplete=false;
            }
            else{
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.selectedGoogleObjectType =null;
                $scope.selectedGoogleLevel = null;
                $scope.selectedGoogleId = null;
                $scope.googleCampaignChosen = false;
                $scope.adChosen = false;
                $scope.groupChosen = false;
                $scope.googleCampaignEnable = false;
                $scope.adEnable = false;
                $scope.groupEnable = false;
                $scope.googleCampaign = null;
                $scope.googleAd = null;
                $scope.googleGroup = null;
                $scope.selectedGoogleObjectType = this.objectTypeOptionsModel[index];
                $scope.selectedGoogleLevel = null;
                $scope.selectedGoogleId = null;
                googleAdsComplete=false;
            }
        }
        if($scope.selectedGoogleLevel=='adwordaccount'){
            if(accountLimitation){
                $scope.messageEnable[index]=true;
                googleAdsComplete=false;
            }
            else{
                if(($scope.profileOptionsModel!=null)&&($scope.googleAccountId!=null))
                    googleAdsComplete=true;
                else
                    googleAdsComplete=false;
            }
            $scope.checkComplete();
        }
        else if($scope.selectedGoogleLevel=='adwordCampaign'){
            if(campaignLimitation){
                $scope.messageEnable[index]=true;
                googleAdsComplete=false;
            }
            else{
                if($scope.googleCampaignChosen==false){
                    googleAdsComplete=false;
                    $scope.googleCampaignEnable=true;
                    $scope.getGoogleCampaigns();
                }
                else{
                    if(($scope.googleProfileId!=null)&&($scope.googleAccountId!=null)&&($scope.googleCampaign!=null))
                        googleAdsComplete=true;
                    else{
                        googleAdsComplete=false;
                    }
                }
            }
            $scope.checkComplete();
        }
        else if($scope.selectedGoogleLevel=='adwordAdgroup'){
            if(adGroupLimitation){
                $scope.messageEnable[index]=true;
                googleAdsComplete=false;
            }
            else{
                if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==true)){
                    if(($scope.profileOptionsModel!=null)&&($scope.googleAccountId!=null)&&($scope.googleCampaign!=null)&&($scope.googleGroup!=null))
                        googleAdsComplete=true;
                    else {
                        googleAdsComplete=false;
                    }
                }
                else if(($scope.googleCampaignChosen==false)&&($scope.groupChosen==false)){
                    $scope.googleCampaignEnable=true;
                    $scope.getGoogleCampaigns();
                }
                else if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==false)){
                    $scope.googleCampaignEnable=true;
                    $scope.groupEnable=true;
                    $scope.getGoogleGroup();
                    googleAdsComplete=false;
                }
                else
                    googleAdsComplete=false;
            }
            $scope.checkComplete();
        }
        else if($scope.selectedGoogleLevel=='adwordsAd'){
            if(adSetLimitation){
                $scope.messageEnable[index]=true;
                googleAdsComplete=false;
            }
            else{
                if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==true)&&($scope.adChosen==true)){
                    if(($scope.profileOptionsModel!=null)&&($scope.googleAccountId!=null)&&($scope.googleCampaign!=null)&&($scope.googleGroup!=null)&&($scope.googleAd!=null))
                        googleAdsComplete=true;
                    else {
                        googleAdsComplete=false;
                    }
                }
                else if((($scope.googleCampaignChosen==false)&&($scope.groupChosen==false))&&($scope.adChosen==true)){
                    googleAdsComplete=false;
                    $scope.googleCampaignEnable=true;
                    $scope.getGoogleCampaigns();
                    $scope.adChosen=false;
                    $scope.googleAd=null;
                }
                else if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==true)&&($scope.adChosen==false)){
                    googleAdsComplete=false;
                    $scope.adEnable=true;
                    $scope.getGoogleAd();
                }
                else if(($scope.googleCampaignChosen==false)&&($scope.groupChosen==false)&&($scope.adChosen==false)){
                    googleAdsComplete=false;
                    $scope.googleCampaignEnable=true;
                    $scope.getGoogleCampaigns();
                }
                else if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==false)&&($scope.adChosen==false)){
                    googleAdsComplete=false;
                    $scope.groupEnable=true;
                    $scope.getGoogleGroup();
                }
                else if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==false)&&($scope.adChosen==true)){
                    googleAdsComplete=false;
                    $scope.groupEnable=true;
                    $scope.getGoogleGroup();
                    $scope.adChosen=false;
                    $scope.googleAd=null;
                }
                else if(($scope.googleCampaignChosen==false)&&($scope.groupChosen==true)&&($scope.adChosen==true)){
                    googleAdsComplete=false;
                    $scope.googleCampaignEnable=true;
                    $scope.getGoogleCampaigns();
                    $scope.adChosen=false;
                    $scope.googleAd=null;
                    $scope.groupChosen=false;
                    $scope.googleGroup=null;
                }
                else if(($scope.googleCampaignChosen==false)&&($scope.groupChosen==true)&&($scope.adChosen==false)){
                    googleAdsComplete=false;
                    $scope.googleCampaignEnable=true;
                    $scope.getGoogleCampaigns();
                    $scope.adChosen=false;
                    $scope.googleAds=null;
                    $scope.groupChosen=false;
                    $scope.googleGroup=null;
                }
            }
            $scope.checkComplete();
        }
    };

    $scope.googleAdsCheck=function(level){
        var value=0;
        document.getElementById('basicWidgetFinishButton').disabled = true;
        if(level=='campaign'){
            $scope.googleGroup=null;
            $scope.groupChosen=false;
            $scope.googleAd=null;
            $scope.adChosen=false;
            $scope.adEnable=false;
            $scope.groupEnable=false;
            $scope.googleCampaign=this.googleCampaignOptionsModel;
            if($scope.googleCampaign)
                $scope.googleCampaignChosen = true;
            else
                $scope.googleCampaignChosen=false;
            value=1;
        }
        else if(level=='group'){
            $scope.googleAd=null;
            $scope.adChosen=false;
            $scope.adEnable=false;
            $scope.googleGroup=this.groupOptionsModel;
            if($scope.googleGroup)
                $scope.groupChosen=true;
            else
                $scope.groupChosen=false;
            value=1;
        }
        else if(typeof(level=='ads')){
            $scope.googleAd=this.adOptionsModel;
            if($scope.googleAd)
                $scope.adChosen=true;
            else
                $scope.adChosen=false;
            value=1;
        }
        if(value==1)
            $scope.googleSelectLevelChosen();
    };

    $scope.getGoogleCampaigns=function(){
        var objectTypeId = $scope.selectedGoogleId;
        var accountId = $scope.googleAccountId;
        var profileId = $scope.googleProfileId;
        $http({
            method: 'GET',
            url: '/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&accountId=' + accountId+'&buster='+new Date()
        }).then(
            function successCallback(response) {
                $scope.googleCampaignList = response.data.objectList;
                $scope.googleCampaignOptionsModel = $scope.googleCampaignList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.getGoogleGroup=function(){
        var objectTypeId = $scope.selectedGoogleId;
        var campaignId = $scope.googleCampaign.channelObjectId;
        var profileId = $scope.googleProfileId;
        var accountId= $scope.googleAccountId;
        var url='';
        if($scope.canManage==true)
            url='/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&campaignId=' + campaignId+'&accountId='+accountId+'&buster='+new Date();
        else
            url='/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&campaignId=' + campaignId+'&accountId='+accountId+'&buster='+new Date();
        $http({
            method: 'GET',
            url: url
        }).then(
            function successCallback(response) {
                $scope.groupList = response.data.objectList;
                $scope.groupOptionsModel = $scope.groupList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.getGoogleAd=function() {
        var objectTypeId = $scope.selectedGoogleId;
        var adSetId = $scope.googleGroup.channelObjectId;
        var profileId = $scope.googleProfileId;
        var accountId= $scope.googleAccountId;
        var url='';
        if($scope.canManage==true)
            url='/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&adSetId=' + adSetId +'&accountId='+accountId+'&buster='+new Date();
        else
            url='/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&adSetId=' + adSetId +'&accountId='+accountId+'&buster='+new Date();
        $http({
            method: 'GET',
            url: url
        }).then(
            function successCallback(response) {
                $scope.adList = response.data.objectList;
                $scope.adOptionsModel = $scope.adList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.refreshGoogleCampaign = function (level) {
        $scope.refreshGoogleCampaignLoading=true;
        var objectTypeId = level;
        var accountId = $scope.googleAccountId;
        var profileId = $scope.googleProfileId;
        $http({
            method: 'GET',
            url: '/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&accountId=' + accountId+'&buster='+new Date()
        }).then(
            function successCallback(response) {
                $scope.googleCampaignList = response.data;
                $scope.googleCampaignOptionsModel = $scope.googleCampaignList;
                $scope.refreshGoogleCampaignLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshGoogleCampaignLoading=false;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                            html: true
                        });
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
            }
        )
    };

    $scope.refreshGroup = function (level) {
        $scope.refreshGroupLoading=true;
        var objectTypeId = level;
        var campaignId = $scope.googleCampaign.channelObjectId;
        var profileId = $scope.googleProfileId;
        var accountId= $scope.googleAccountId;
        var url='';
        if($scope.canManage==true)
            url='/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&campaignId=' + campaignId +'&accountId='+accountId+'&buster='+new Date();
        else
            url='/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&campaignId=' + campaignId+'&buster='+new Date()
        $http({
            method: 'GET',
            url: url
        }).then(
            function successCallback(response) {
                $scope.groupList = response.data;
                $scope.groupOptionsModel = $scope.groupList;
                $scope.refreshGroupLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshGroupLoading=false;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                            html: true
                        });
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                        html: true
                    });
            }
        )
    };

    $scope.refreshAd = function (level) {
        $scope.refreshAdLoading=true;
        var objectTypeId = level;
        var adSetId = $scope.googleGroup.channelObjectId;
        var profileId = $scope.googleProfileId;
        var accountId= $scope.googleAccountId;
        var url='';
        if($scope.canManage==true)
            url='/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&adSetId=' + adSetId +'&accountId='+accountId+'&buster='+new Date();
        else
            url='/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&adSetId=' + adSetId+'&buster='+new Date()
        $http({
            method: 'GET',
            url: url
        }).then(
            function successCallback(response) {
                $scope.adList = response.data;
                $scope.adOptionsModel = $scope.adList;
                $scope.refreshAdLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshAdLoading=true;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                            html: true
                        });
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                        html: true
                    });
            }
        )
    };

    $scope.checkComplete=function(){
        if(fbAdsPresent==false && googleAdsPresent==false){
            if(canFinishEnable==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if(fbAdsPresent==false && googleAdsPresent==true){
            if(canFinishEnable==true && googleAdsComplete ==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if(fbAdsPresent==true && googleAdsPresent==false){
            if(canFinishEnable==true && fbAdsComplete ==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if(fbAdsPresent==true && googleAdsPresent==true){
            if(canFinishEnable==true && googleAdsComplete ==true && fbAdsComplete ==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
    };

    $scope.addNewProfile = function (index) {
        var url, title;
        function popupwindow(url, title, w, h) {
            switch ($scope.getChannelList[index].name) {
                case 'Facebook':
                    url = '/api/v1/auth/facebook';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'Google Analytics':
                    url = '/api/v1/auth/google';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'FacebookAds':
                    url = '/api/auth/facebookads';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'Twitter':
                    url = '/api/auth/twitter';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'Instagram' :
                    url = '/api/auth/instagram';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'GoogleAdwords' :
                    url = '/api/auth/adwords';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'Mailchimp':
                    url = '/api/auth/mailchimp';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'Aweber':
                    url = '/api/auth/aweber';
                    title = $scope.getChannelList[index].name;
                    break;
            }
            var left = (screen.width / 2) - (w / 2);
            var top = (screen.height / 2) - (h / 2);
            $scope.tokenExpired[index] = false;
            return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
        }

        popupwindow(url, title, 1000, 500);
    };

    $window.afterAuthentication = function () {
        $scope.getProfileForChosenChannel($scope.fullOfDashboard);
    };

    $scope.removeExistingProfile = function (index) {
        swal({
                title: "Confirm Profile Delink?",
                text: "All data, widgets associated with this profile will be deleted! Confirm?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Confirm",
                closeOnConfirm: true
            },
            function () {
                if ($scope.profileOptionsModel[index]) {

                    $http({
                        method: 'POST',
                        url: '/api/v1/post/removeProfiles/' + $scope.profileOptionsModel[index]._id
                    }).then(
                        function successCallback(response) {
                            $scope.getProfileForChosenChannel($scope.fullOfDashboard);
                        },
                        function errorCallback(error) {
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                                html: true
                            });
                        }
                    );
                }
            }
        );
    };

    $scope.refreshObjectsForChosenProfile = function (index) {
        if ($scope.getChannelList[index].name === 'Google Analytics') {
            this.objectOptionsModel1[index] = '';
            $scope.objectList[index] = '';
        }
        if (this.profileOptionsModel[index]._id) {
            $scope.recommendedRefreshButton = $scope.getChannelList[index].name;
            switch ($scope.getChannelList[index].name) {
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
                url: '/api/v1/channel/profiles/objectsList/' + this.profileOptionsModel[index]._id + '?objectType=' + $scope.objectType + '&buster=' + new Date()
            }).then(
                function successCallback(response) {
                    $scope.objectList[index] = response.data;
                    $scope.recommendedRefreshButton = '';
                },
                function errorCallback(error) {
                    $scope.recommendedRefreshButton = '';
                    if (error.status === 401) {
                        if (error.data.errorstatusCode === 1003) {
                            $scope.recommendedRefreshButton = '';
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Please refresh your profile</span>",
                                html: true
                            });
                            $scope.getProfileForChosenChannel($scope.fullOfDashboard);
                        }
                    } else
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                            html: true
                        });
                }
            );
        }
    };

    $scope.refreshOtherObjects = function(objectypeId,index,childIndex){
        var objectTypeId=objectypeId;
        if(this.profileOptionsModel[index]._id) {
            $scope.otherRefreshButton[childIndex] = $scope.getChannelList[index].name;
            var profileId=this.profileOptionsModel[index]._id;
            $http({
                method: 'GET',
                url: '/api/v1/get/objectTypeDetail/' + objectTypeId + '?buster=' + new Date()
            }).then(
                function successCallback(response) {
                    var objectTypeName = response.data.objectType.type;
                    $http({
                        method: 'GET',
                        url: '/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeName + '&buster=' + new Date()
                    }).then(
                        function successCallback(response) {
                            var tempObjList = response.data;
                            $scope.otherObjectList[index][childIndex]=[];
                            $scope.objectForWidgetChosen($scope.otherObjectList[index][childIndex], index,childIndex);
                            for(var j=0;j<tempObjList.length;j++){
                                if(objectTypeId==tempObjList[j].objectTypeId)
                                    $scope.otherObjectList[index][childIndex].push(tempObjList[j])
                            }
                            $scope.otherRefreshButton[childIndex] = '';
                        },
                        function errorCallback(error) {
                            $scope.otherRefreshButton[childIndex] = '';
                            if (error.status === 401) {
                                if (error.data.errorstatusCode === 1003) {
                                    $scope.otherRefreshButton[childIndex] = '';
                                    swal({
                                        title: "",
                                        text: "<span style='sweetAlertFont'>Please refresh your profile</span>",
                                        html: true
                                    });
                                    $scope.getProfileForChosenChannel($scope.fullOfDashboard);
                                }
                            } else
                                swal({
                                    title: "",
                                    text: "<span style='sweetAlertFont'>Something went wrong!</span>",
                                    html: true
                                });
                        }
                    );
                },
                function errorCallback(error) {
                    $scope.otherRefreshButton[childIndex] = '';
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong!</span>",
                        html: true
                    });
                }
            );
        }
    }

    $scope.createRecommendedDashboard = function () {
        var matchingMetric = [];
        $http(
            {
                method: 'GET',
                url: '/api/v1/subscriptionLimits' + '?requestType=' + 'dashboards'
            }
        ).then(
            function successCallback(response) {
                if (response.data.availableDashboards < 1) {
                    $('#errorInFinish').html('<div class="alert alert-danger fade in" style="width: 400px;margin-left: 212px;"><button type="button" class="close close-alert" data-dismiss="alert" aria-hidden="true">×</button>You have reached your Dashboards limit. Please upgrade to create more Dashboards</div>');
                    document.getElementById('basicWidgetFinishButton').disabled = true;
                }
                else {
                    $http(
                        {
                            method: 'GET',
                            url: '/api/v1/subscriptionLimits' + '?requestType=' + 'basic'
                        }
                    ).then(
                        function successCallback(response) {
                            $scope.widgetCount = response.data.availableWidgets;
                            if ($scope.referenceWidgetsList.length <= $scope.widgetCount) {
                                var jsonData = {
                                    name: $scope.recommendeDashboardName
                                };
                                $http({
                                    method: 'POST',
                                    url: '/api/v1/create/dashboards',
                                    data: jsonData
                                }).then(
                                    function successCallback(response) {
                                        var inputParams = [];
                                        var dashboardId = response.data;
                                        for (var widget = 0; widget < $scope.referenceWidgetsList.length; widget++) {
                                            for (var chart = 0; chart < $scope.referenceWidgetsList[widget].charts.length; chart++) {
                                                matchingMetric = [];
                                                for (var j = 0; j < $scope.storedUserChosenValues.length; j++) {
                                                    for(var i=0;i<$scope.storedUserChosenValues[j].length;i++){
                                                        if ($scope.referenceWidgetsList[widget].charts[chart].channelId === $scope.storedUserChosenValues[j][i].profile.channelId) {
                                                            for (var n = 0; n < $scope.getChannelList.length; n++) {
                                                                var widgetName, channelName;
                                                                if ($scope.storedUserChosenValues[j][i].profile.channelId === $scope.getChannelList[n]._id) {
                                                                    var widgetColor = generateChartColours.fetchWidgetColor($scope.getChannelList[n].name);
                                                                    if ($scope.getChannelList[n].name === 'Twitter' || $scope.getChannelList[n].name === 'Instagram' || $scope.getChannelList[n].name === 'Google Analytics')
                                                                        widgetName = $scope.referenceWidgetsList[widget].name + ' - ' + $scope.storedUserChosenValues[j][i].profile.name;
                                                                    else
                                                                        widgetName = $scope.referenceWidgetsList[widget].name + ' - ' + $scope.storedUserChosenValues[j][i].object.name;
                                                                    channelName = $scope.getChannelList[n].name;
                                                                }

                                                            }
                                                            for (var m = 0; m < $scope.referenceWidgetsList[widget].charts[chart].metrics.length; m++) {
                                                                if(channelName === 'FacebookAds'){
                                                                    matchingMetric.push($scope.referenceWidgetsList[widget].charts[chart].metrics[m]);
                                                                    if ($scope.selectedLevel == 'fbadaccount') {
                                                                        matchingMetric[0].objectTypeId = $scope.selectedObjectType._id;
                                                                        matchingMetric[0].objectId = $scope.storedUserChosenValues[j][i].object._id;
                                                                    }
                                                                    else if ($scope.selectedLevel == 'fbAdcampaign') {
                                                                        matchingMetric[0].objectTypeId = $scope.selectedObjectType._id;
                                                                        matchingMetric[0].objectId = $scope.campaign._id;
                                                                        widgetName = $scope.referenceWidgetsList[widget].name + ' - ' + $scope.campaign.name;
                                                                    }
                                                                    else if ($scope.selectedLevel == 'fbAdSet') {
                                                                        matchingMetric[0].objectTypeId = $scope.selectedObjectType._id;
                                                                        matchingMetric[0].objectId = $scope.adSet._id;
                                                                        widgetName = $scope.referenceWidgetsList[widget].name + ' - ' + $scope.adSet.name;
                                                                    }
                                                                    else if ($scope.selectedLevel == 'fbAdSetAds') {
                                                                        matchingMetric[0].objectTypeId = $scope.selectedObjectType._id;
                                                                        matchingMetric[0].objectId = $scope.adSetAds._id;
                                                                        widgetName = $scope.referenceWidgetsList[widget].name + ' - ' + $scope.adSetAds.name;
                                                                    }
                                                                }
                                                                else if(channelName ==='GoogleAdwords'){
                                                                    matchingMetric.push($scope.referenceWidgetsList[widget].charts[chart].metrics[m]);
                                                                    if ($scope.selectedGoogleLevel == 'adwordaccount') {
                                                                        matchingMetric[0].objectTypeId = $scope.selectedGoogleObjectType._id;
                                                                        matchingMetric[0].objectId = $scope.storedUserChosenValues[j][i].object._id;
                                                                    }
                                                                    else if ($scope.selectedGoogleLevel == 'adwordCampaign') {
                                                                        matchingMetric[0].objectTypeId = $scope.selectedGoogleObjectType._id;
                                                                        matchingMetric[0].objectId = $scope.googleCampaign._id;
                                                                        widgetName = $scope.referenceWidgetsList[widget].name + ' - ' + $scope.googleCampaign.name;
                                                                    }
                                                                    else if ($scope.selectedGoogleLevel == 'adwordAdgroup') {
                                                                        matchingMetric[0].objectTypeId = $scope.selectedGoogleObjectType._id;
                                                                        matchingMetric[0].objectId = $scope.googleGroup._id;
                                                                        widgetName = $scope.referenceWidgetsList[widget].name + ' - ' + $scope.googleGroup.name;
                                                                    }
                                                                    else if ($scope.selectedGoogleLevel == 'adwordsAd') {
                                                                        matchingMetric[0].objectTypeId = $scope.selectedGoogleObjectType._id;
                                                                        matchingMetric[0].objectId = $scope.googleAd._id;
                                                                        widgetName = $scope.referenceWidgetsList[widget].name + ' - ' + $scope.googleAd.name;
                                                                    }
                                                                }
                                                                else{
                                                                    if ($scope.referenceWidgetsList[widget].charts[chart].metrics[m].objectTypeId === $scope.storedUserChosenValues[j][i].object.objectTypeId) {
                                                                        matchingMetric.push($scope.referenceWidgetsList[widget].charts[chart].metrics[m]);
                                                                        matchingMetric[0].objectId = $scope.storedUserChosenValues[j][i].object._id;
                                                                    }
                                                                }
                                                            }

                                                        }
                                                    }
                                                }
                                                $scope.referenceWidgetsList[widget].charts[chart].metrics = matchingMetric;
                                            }
                                            var jsonData = {
                                                "dashboardId": response.data,
                                                "widgetType": $scope.referenceWidgetsList[widget].widgetType,
                                                "name": widgetName,
                                                "description": $scope.referenceWidgetsList[widget].description,
                                                "charts": $scope.referenceWidgetsList[widget].charts,
                                                "order": $scope.referenceWidgetsList[widget].order,
                                                "offset": $scope.referenceWidgetsList[widget].offset,
                                                "size": $scope.referenceWidgetsList[widget].size,
                                                "minSize": $scope.referenceWidgetsList[widget].minSize,
                                                "maxSize": $scope.referenceWidgetsList[widget].maxSize,
                                                "isAlert": $scope.referenceWidgetsList[widget].isAlert,
                                                "color": widgetColor,
                                                "channelName": channelName
                                            };
                                            inputParams.push(jsonData);
                                        }
                                        $http({
                                            method: 'POST',
                                            url: '/api/v1/widgets',
                                            data: inputParams
                                        }).then(
                                            function successCallback(response) {
                                                // $state.go('app.reporting.dashboard', {id: dashboardId});
                                                //progressStart=1;
                                                changeState().then(
                                                    function () {
                                                        $state.go('app.reporting.dashboard', {id: dashboardId});
                                                    }
                                                )
                                            },
                                            function errorCallback(error) {
                                                progressStart = 1;
                                                swal({
                                                    title: "",
                                                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                                                    html: true
                                                });
                                            }
                                        );
                                    },
                                    function errorCallback(error) {
                                        progressStart = 1;
                                        swal({
                                            title: "",
                                            text: "<span style='sweetAlertFont'>Please try again! Something is missing</span>",
                                            html: true
                                        });
                                    }
                                );
                            }
                            else {
                                var myDiv = document.getElementById('scroller');
                                myDiv.scrollTop = 0;
                                $('#errorInFinish').html('<div class="alert alert-danger fade in" style="width: 400px;margin-left: 212px;"><button type="button" class="close close-alert" data-dismiss="alert" aria-hidden="true">×</button>You have reached your Widgets limit. Please upgrade to enjoy more Widgets</div>');
                                document.getElementById('basicWidgetFinishButton').disabled = true;
                            }
                        },
                        function errorCallback(error) {
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span> .",
                                html: true
                            });
                        })
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
    };

}