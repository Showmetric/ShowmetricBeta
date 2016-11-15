/**
 * MainCtrl - controller
 * Contains severals global data used in diferent view
 *
 */

showMetricApp.controller('MainCtrl', MainCtrl)

function MainCtrl($scope,$rootScope,$http,$timeout) {
    //For the purpose of determining height for nav-bar
    $scope.navbarHeight = window.innerHeight;
    $scope.IntroOptions = {
        steps:[
            {
                element: '#step8',
                intro: 'Blank Dashboard - Click here to create a new blank dashboard. Create dashboards to organize your widgets and monitor them.',
                position:'right'
            },
            {
                element: '#step9',
                intro: 'Dashboard Templates - Ready made pre-built dashboards comprising of specific curated widgets to address an unique theme or purpose. They provide a great way to quickly get your dashboard created rather than building it one widget at a time.',
                position:'right'
            },
            {
                element: '#step10',
                intro: 'Reports - Take complete control of your reporting. Easily build reports with custom logos, custom text and export them as professional looking PDFs. White label your reports and use your own logo to send reports.',
                position:'right'
            },
            {
                element: '#step11',
                intro: 'Get it, use it.',
                position:'bottom'
            },
            {
                element: '#step12',
                intro: 'Get it, use it.',
                position:'left'
            },
            {
                element: '#step13',
                intro: 'Get it, use it.',
                position:'left'
            },
            {
                element: '#step14',
                intro: 'Get it, use it.',
                position:'left'
            },
            {
                element: '#soonModel',
                intro: 'Get it, use it.',
                position:'left'
            },
            {
                element: '#step15',
                intro: 'Get it, use it.',
                position:'left'
            },
            // {
            //     element: '#step16',
            //     intro: 'Get it, use it.',
            //     position:'left'
            // },
            {
                element: '#step17',
                intro: 'Get it, use it.',
                position:'left'
            }
        ],
        showStepNumbers: true,
        exitOnOverlayClick: true,
        exitOnEsc:true,
        nextLabel: '<strong>Next</strong>',
        prevLabel: '<strong>Previous</strong>',
        skipLabel: '<span style="color:red">Exit</span>',
        doneLabel: '<span style="color:green">Thanks</span>'
    };
    window.addEventListener("resize", function (e) {
        $scope.navbarHeight = window.innerHeight;
    });
    $rootScope.dropDownActive = false;
    $scope.ShouldAutoStart = false;
    $rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
        // $rootScope.canAccessReportBuilder = $rootScope.canAccessReportBuilder || false;
        $rootScope.currentStateForIntro= to.name;
        if($rootScope.currentStateForIntro=='app.reporting.dashboard')
            $scope.IntroOptions = {
                steps:[
                    {
                        element: '#step1',
                        intro: "Name all your dashboards here the way you see fit for easy organization",
                        position:'bottom'
                    },
                    {
                        element: '#step2'   ,
                        intro: "Choose the date range for which you want to analyze the data of your dashboard widgets",
                        position:'bottom'
                    },
                    {
                        element: '#step3',
                        intro: 'Add new widgets to your dashboards from all our integrated channels. Choose your channels followed by the metrics. Choose the profiles for which your want to see the data for your chosen metrics.',
                        position:'left'
                    },
                    {
                        element: '#step4',
                        intro: "Take relevant metrics from two different channels and fuse them together to spot interesting correlations and trends.",
                        position:'left'
                    },
                    {
                        element: '#step5',
                        intro: 'Arrange all the widgets in your dashboard in a presentable manner with a single click.',
                        position:'left'
                    },
                    {
                        element: '#step6',
                        intro: 'Export the current dashboard in different available formats. Also share the url of this dashboard to people who require view access for analysis.',
                        position:'left'
                    },
                    {
                        element: '#step7',
                        intro: 'Click here to delete your current dashboard.',
                        position:'left'
                    },
                    {
                        element: '#step8',
                        intro: 'Blank Dashboard - Click here to create a new blank dashboard. Create dashboards to organize your widgets and monitor them.',
                        position:'right'
                    },
                    {
                        element: '#step9',
                        intro: 'Dashboard Templates - Ready made pre-built dashboards comprising of specific curated widgets to address an unique theme or purpose. They provide a great way to quickly get your dashboard created rather than building it one widget at a time.',
                        position:'right'
                    },
                    {
                        element: '#step10',
                        intro: 'Reports - Take complete control of your reporting. Easily build reports with custom logos, custom text and export them as professional looking PDFs. White label your reports and use your own logo to send reports.',
                        position:'right'
                    },
                    {
                        element: '#step11',
                        intro: 'Quickly navigate back and forth between your recent dashboards in a single click. Get a complete view of all your dashboards by clicking on All dashboards',
                        position:'bottom'
                    },
                    {
                        element: '#step12',
                        intro: 'Navigate to handle all your account related features and settings through this menu.',
                        position:'left'
                    },
                    {
                        element: '#step13',
                        intro: 'View and manage (create/edit/delete) all the social/digital profiles whose health you want to monitor in your dashboards.',
                        position:'left'
                    },
                    {
                        element: '#step14',
                        intro: 'View and manage (create/edit/delete) all the social/digital profiles whose health you want to monitor in your dashboards.',
                        position:'left'
                    },
                    {
                        element: '#soonModel',
                        intro: 'View and manage all the users from your team whom you would like to use and benefit from Datapoolt',
                        position:'left'
                    },
                    {
                        element: '#step15',
                        intro: 'Have a quick tour and understand the features available in Datapoolt',
                        position:'left'
                    },
                    // {
                    //     element: '#step16',
                    //     intro: 'Watch a quick video guide of how to use Datapoolt and leverage the maximum out of it',
                    //     position:'left'
                    // },
                    {
                        element: '#step17',
                        intro: 'Click here to logout of Datapoolt till you visit again soon',
                        position:'left'
                    }
                ],
                showStepNumbers: true,
                exitOnOverlayClick: false,
                exitOnEsc:true,
                nextLabel: '<strong>Next</strong>',
                prevLabel: '<strong>Previous</strong>',
                skipLabel: '<span style="color:red">Exit</span>',
                doneLabel: '<span style="color:green">Thanks</span>'
            };
        else
            $scope.IntroOptions = {
                steps:[
                    {
                        element: '#step8',
                        intro: 'Blank Dashboard - Click here to create a new blank dashboard. Create dashboards to organize your widgets and monitor them.',
                        position:'right'
                    },
                    {
                        element: '#step9',
                        intro: 'Dashboard Templates - Ready made pre-built dashboards comprising of specific curated widgets to address an unique theme or purpose. They provide a great way to quickly get your dashboard created rather than building it one widget at a time.',
                        position:'right'
                    },
                    {
                        element: '#step10',
                        intro: 'Reports - Take complete control of your reporting. Easily build reports with custom logos, custom text and export them as professional looking PDFs. White label your reports and use your own logo to send reports.',
                        position:'right'
                    },
                    {
                        element: '#step11',
                        intro: 'Quickly navigate back and forth between your recent dashboards in a single click. Get a complete view of all your dashboards by clicking on All dashboards',
                        position:'bottom'
                    },
                    {
                        element: '#step12',
                        intro: 'Navigate to handle all your account related features and settings through this menu.',
                        position:'left'
                    },
                    {
                        element: '#step13',
                        intro: 'View and manage (create/edit/delete) all the social/digital profiles whose health you want to monitor in your dashboards.',
                        position:'left'
                    },
                    {
                        element: '#step14',
                        intro: 'View and manage (create/edit/delete) all the social/digital profiles whose health you want to monitor in your dashboards.',
                        position:'left'
                    },
                    {
                        element: '#soonModel',
                        intro: 'View and manage all the users from your team whom you would like to use and benefit from Datapoolt',
                        position:'left'
                    },
                    {
                        element: '#step15',
                        intro: 'Have a quick tour and understand the features available in Datapoolt',
                        position:'left'
                    },
                    // {
                    //     element: '#step16',
                    //     intro: 'Watch a quick video guide of how to use Datapoolt and leverage the maximum out of it',
                    //     position:'left'
                    // },
                    {
                        element: '#step17',
                        intro: 'Click here to logout of Datapoolt till you visit again soon',
                        position:'left'
                    }
                ],
                showStepNumbers: true,
                exitOnOverlayClick: true,
                exitOnEsc:true,
                nextLabel: '<strong>Next</strong>',
                prevLabel: '<strong>Previous</strong>',
                skipLabel: '<span style="color:red">Exit</span>',
                doneLabel: '<span style="color:green">Thanks</span>'
            };
        // var toInsertIndex;
        // for(var step in $scope.IntroOptions.steps) {
        //     if ($scope.IntroOptions.steps[step].element == '#step9')
        //         toInsertIndex = Number(step);
        // }

        // if($rootScope.canAccessReportBuilder) {
        //     $scope.IntroOptions.steps.splice(toInsertIndex+1, 0, {
        //         element: '#step10',
        //         intro: 'Get it, use it.',
        //         position: 'right'
        //     });
        // }
        // else if($scope.IntroOptions.steps[toInsertIndex+1].element=='#step10') {
        //     $scope.IntroOptions.steps.splice(toInsertIndex + 1, 1);
        // }
    });
    $scope.CompletedEvent = function (scope) {
        $rootScope.dropDownActive = false;
        document.getElementById("myDropdown").classList.remove("show");
    };

    $scope.ExitEvent = function (scope) {
        $rootScope.dropDownActive = false;
        document.getElementById("myDropdown").classList.remove("show");
    };

    $scope.ChangeEvent = function (targetElement, scope) {
    };

    $scope.BeforeChangeEvent = function (targetElement, scope) {
        if(targetElement.id=='step13'||targetElement.id=='step14'||targetElement.id=='step15'||targetElement.id=='step16'||targetElement.id=='step17'||targetElement.id=='soonModel') {
            $rootScope.dropDownActive = true;
            if (!document.getElementById("myDropdown").classList.contains('show'))
                document.getElementById("myDropdown").classList.add("show");

            // $timeout(function(){
            //     document.getElementById("myDropdown").classList.add("show");
            //     console.log('dropdown opened',document.getElementById("myDropdown"));
            // },2000);
        }
        else
            $rootScope.dropDownActive = false;
    };

    $scope.AfterChangeEvent = function (targetElement, scope) {
    };
    // $scope.getReportBuilder = function () {
    //     $http({
    //         method: 'POST',
    //         url: '/api/v1/updateUserSubscription?buster='+new Date()
    //     }).then(
    //         function successCallback(response) {
    //             $rootScope.canAccessReportBuilder = response.data.response.reportBuilder;
    //            //  var toInsertIndex;
    //            //  if(typeof $scope.IntroOptions != 'undefined')
    //            //  for(var step in $scope.IntroOptions.steps) {
    //            //      if ($scope.IntroOptions.steps[step].element == '#step9')
    //            //          toInsertIndex = Number(step);
    //            //  }
    //            // if($rootScope.canAccessReportBuilder) {
    //            //     $scope.IntroOptions.steps.splice(toInsertIndex+1, 0, {
    //            //         element: '#step10',
    //            //         intro: 'Get it, use it.',
    //            //         position: 'right'
    //            //     });
    //            // }
    //            //  else if($scope.IntroOptions.steps[toInsertIndex+1].element=='#step10') {
    //            //     $scope.IntroOptions.steps.splice(toInsertIndex + 1, 1);
    //            // }
    //         },
    //         function errorCallback(error) {
    //             swal({
    //                 title: '',
    //                 text: '<span style="sweetAlertFont">Something went wrong! Please reload the dashboard</span>',
    //                 html: true
    //             });
    //         }
    //     );
    // };
    // $scope.getReportBuilder();

    /**
     * daterange - Used as initial model for data range picker in Advanced form view
     */
    this.daterange = {startDate: null, endDate: null};


    /**
     * slideInterval - Interval for bootstrap Carousel, in milliseconds:
     */
    this.slideInterval = 5000;


    /**
     * states - Data used in Advanced Form view for Chosen plugin
     */
    this.states = [
        'Alabama',
        'Alaska',
        'Arizona',
        'Arkansas',
        'California',
        'Colorado',
        'Connecticut',
        'Delaware',
        'Florida',
        'Georgia',
        'Hawaii',
        'Idaho',
        'Illinois',
        'Indiana',
        'Iowa',
        'Kansas',
        'Kentucky',
        'Louisiana',
        'Maine',
        'Maryland',
        'Massachusetts',
        'Michigan',
        'Minnesota',
        'Mississippi',
        'Missouri',
        'Montana',
        'Nebraska',
        'Nevada',
        'New Hampshire',
        'New Jersey',
        'New Mexico',
        'New York',
        'North Carolina',
        'North Dakota',
        'Ohio',
        'Oklahoma',
        'Oregon',
        'Pennsylvania',
        'Rhode Island',
        'South Carolina',
        'South Dakota',
        'Tennessee',
        'Texas',
        'Utah',
        'Vermont',
        'Virginia',
        'Washington',
        'West Virginia',
        'Wisconsin',
        'Wyoming'
    ];

    /**
     * persons - Data used in Tables view for Data Tables plugin
     */
    this.persons = [
        {
            id: '1',
            firstName: 'Monica',
            lastName: 'Smith'
        },
        {
            id: '2',
            firstName: 'Sandra',
            lastName: 'Jackson'
        },
        {
            id: '3',
            firstName: 'John',
            lastName: 'Underwood'
        },
        {
            id: '4',
            firstName: 'Chris',
            lastName: 'Johnatan'
        },
        {
            id: '5',
            firstName: 'Kim',
            lastName: 'Rosowski'
        }
    ];

    /**
     * check's - Few variables for checkbox input used in iCheck plugin. Only for demo purpose
     */
    this.checkOne = true;
    this.checkTwo = true;
    this.checkThree = true;
    this.checkFour = true;

    /**
     * knobs - Few variables for knob plugin used in Advanced Plugins view
     */
    this.knobOne = 75;
    this.knobTwo = 25;
    this.knobThree = 50;

    /**
     * Variables used for Ui Elements view
     */
    this.bigTotalItems = 175;
    this.bigCurrentPage = 1;
    this.maxSize = 5;
    this.singleModel = 1;
    this.radioModel = 'Middle';
    this.checkModel = {
        left: false,
        middle: true,
        right: false
    };

    /**
     * groups - used for Collapse panels in Tabs and Panels view
     */
    this.groups = [
        {
            title: 'Dynamic Group Header - 1',
            content: 'Dynamic Group Body - 1'
        },
        {
            title: 'Dynamic Group Header - 2',
            content: 'Dynamic Group Body - 2'
        }
    ];

    /**
     * alerts - used for dynamic alerts in Notifications and Tooltips view
     */
    this.alerts = [
        { type: 'danger', msg: 'Oh snap! Change a few things up and try submitting again.' },
        { type: 'success', msg: 'Well done! You successfully read this important alert message.' },
        { type: 'info', msg: 'OK, You are done a great job man.' }
    ];

    /**
     * addAlert, closeAlert  - used to manage alerts in Notifications and Tooltips view
     */
    this.addAlert = function() {
        this.alerts.push({msg: 'Another alert!'});
    };

    this.closeAlert = function(index) {
        this.alerts.splice(index, 1);
    };

    /**
     * randomStacked - used for progress bar (stacked type) in Badges adn Labels view
     */
    this.randomStacked = function() {
        this.stacked = [];
        var types = ['success', 'info', 'warning', 'danger'];

        for (var i = 0, n = Math.floor((Math.random() * 4) + 1); i < n; i++) {
            var index = Math.floor((Math.random() * 4));
            this.stacked.push({
                value: Math.floor((Math.random() * 30) + 1),
                type: types[index]
            });
        }
    };
    /**
     * initial run for random stacked value
     */
    this.randomStacked();

    /**
     * summernoteText - used for Summernote plugin
     */
    this.summernoteText = ['<h3>Hello Jonathan! </h3>',
        '<p>dummy text of the printing and typesetting industry. <strong>Lorem Ipsum has been the dustrys</strong> standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more',
        'recently with</p>'].join('');

    /**
     * General variables for Peity Charts
     * used in many view so this is in Main controller
     */
    this.BarChart = {
        data: [5, 3, 9, 6, 5, 9, 7, 3, 5, 2, 4, 7, 3, 2, 7, 9, 6, 4, 5, 7, 3, 2, 1, 0, 9, 5, 6, 8, 3, 2, 1],
        options: {
            fill: ["#1ab394", "#d7d7d7"],
            width: 100
        }
    };

    this.BarChart2 = {
        data: [5, 3, 9, 6, 5, 9, 7, 3, 5, 2],
        options: {
            fill: ["#1ab394", "#d7d7d7"]
        }
    };

    this.BarChart3 = {
        data: [5, 3, 2, -1, -3, -2, 2, 3, 5, 2],
        options: {
            fill: ["#1ab394", "#d7d7d7"]
        }
    };

    this.LineChart = {
        data: [5, 9, 7, 3, 5, 2, 5, 3, 9, 6, 5, 9, 4, 7, 3, 2, 9, 8, 7, 4, 5, 1, 2, 9, 5, 4, 7],
        options: {
            fill: '#1ab394',
            stroke: '#169c81',
            width: 64
        }
    };

    this.LineChart2 = {
        data: [3, 2, 9, 8, 47, 4, 5, 1, 2, 9, 5, 4, 7],
        options: {
            fill: '#1ab394',
            stroke: '#169c81',
            width: 64
        }
    };

    this.LineChart3 = {
        data: [5, 3, 2, -1, -3, -2, 2, 3, 5, 2],
        options: {
            fill: '#1ab394',
            stroke: '#169c81',
            width: 64
        }
    };

    this.LineChart4 = {
        data: [5, 3, 9, 6, 5, 9, 7, 3, 5, 2],
        options: {
            fill: '#1ab394',
            stroke: '#169c81',
            width: 64
        }
    };

    this.PieChart = {
        data: [1, 5],
        options: {
            fill: ["#1ab394", "#d7d7d7"]
        }
    };

    this.PieChart2 = {
        data: [226, 360],
        options: {
            fill: ["#1ab394", "#d7d7d7"]
        }
    };
    this.PieChart3 = {
        data: [0.52, 1.561],
        options: {
            fill: ["#1ab394", "#d7d7d7"]
        }
    };
    this.PieChart4 = {
        data: [1, 4],
        options: {
            fill: ["#1ab394", "#d7d7d7"]
        }
    };
    this.PieChart5 = {
        data: [226, 134],
        options: {
            fill: ["#1ab394", "#d7d7d7"]
        }
    };
    this.PieChart6 = {
        data: [0.52, 1.041],
        options: {
            fill: ["#1ab394", "#d7d7d7"]
        }
    };
};