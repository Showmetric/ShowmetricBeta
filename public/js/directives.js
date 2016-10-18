/**
 * INSPINIA - Responsive Admin Theme
 *
 * Main directives.js file
 * Define directives for used plugin
 *
 *
 * Functions (directives)
 *  - sideNavigation
 *  - iboxTools
 *  - minimalizaSidebar
 *  - vectorMap
 *  - sparkline
 *  - icheck
 *  - ionRangeSlider
 *  - dropZone
 *  - responsiveVideo
 *  - chatSlimScroll
 *  - customValid
 *  - fullScroll
 *  - closeOffCanvas
 *  - clockPicker
 *  - landingScrollspy
 *  - fitHeight
 *  - iboxToolsFullScreen
 *  - slimScroll
 *
 */


/**
 * pageTitle - Directive for set Page title - mata title
 */
function pageTitle($rootScope, $timeout) {
    return {
        link: function(scope, element) {
            var listener = function(event, toState, toParams, fromState, fromParams) {
                // Default title - load on Dashboard 1
                var title = 'Datapoolt';
                // Create your own title pattern
                if (toState.data && toState.data.pageTitle) title = 'Datapoolt | ' + toState.data.pageTitle;
                $timeout(function() {
                    element.text(title);
                });
            };
            $rootScope.$on('$stateChangeStart', listener);
        }
    }
};

/**
 * sideNavigation - Directive for run metsiMenu on sidebar navigation
 */
function sideNavigation($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element) {
            // Call the metsiMenu plugin and plug it to sidebar navigation
            $timeout(function(){
                element.metisMenu();

            });
        }
    };
};

/**
 * responsibleVideo - Directive for responsive video
 */

function hcChart($timeout){
        return {
            restrict: 'E',
            template: '<div></div>',
            scope: {
                options: '='
            },
            link: function (scope, element) {
                $timeout(drawCharts, 3000);
                function drawCharts(){
                Highcharts.chart(element[0], scope.options);
            }
        }
    }


}

function responsiveVideo() {
    return {
        restrict: 'A',
        link:  function(scope, element) {
            var figure = element;
            var video = element.children();
            video
                .attr('data-aspectRatio', video.height() / video.width())
                .removeAttr('height')
                .removeAttr('width');

            //We can use $watch on $window.innerWidth also.
            $(window).resize(function() {
                var newWidth = figure.width();
                video
                    .width(newWidth)
                    .height(newWidth * video.attr('data-aspectRatio'));
            }).resize();
        }
    }
}

/**
 * iboxTools - Directive for iBox tools elements in right corner of ibox
 */
function iboxTools($timeout) {
    return {
        restrict: 'A',
        scope: true,
        templateUrl: 'common/ibox_tools.ejs',
        controller: function ($scope, $element) {
            // Function for collapse ibox
            $scope.showhide = function () {
                var ibox = $element.closest('div.ibox');
                var icon = $element.find('i:first');
                var content = ibox.find('div.ibox-content');
                content.slideToggle(200);
                // Toggle icon from up to down
                icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
                ibox.toggleClass('').toggleClass('border-bottom');
                $timeout(function () {
                    ibox.resize();
                    ibox.find('[id^=map-]').resize();
                }, 50);
            };
                // Function for close ibox
                $scope.closebox = function () {
                    var ibox = $element.closest('div.ibox');
                    ibox.remove();
                }
        }
    };
}

/**
 * iboxTools with full screen - Directive for iBox tools elements in right corner of ibox with full screen option
 */
function iboxToolsFullScreen($timeout) {
    return {
        restrict: 'A',
        scope: true,
        templateUrl: 'common/ibox_tools_full_screen.ejs',
        controller: function ($scope, $element) {
            // Function for collapse ibox
            $scope.showhide = function () {
                var ibox = $element.closest('div.ibox');
                var icon = $element.find('i:first');
                var content = ibox.find('div.ibox-content');
                content.slideToggle(200);
                // Toggle icon from up to down
                icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
                ibox.toggleClass('').toggleClass('border-bottom');
                $timeout(function () {
                    ibox.resize();
                    ibox.find('[id^=map-]').resize();
                }, 50);
            };
            // Function for close ibox
            $scope.closebox = function () {
                var ibox = $element.closest('div.ibox');
                ibox.remove();
            };
            // Function for full screen
            $scope.fullscreen = function () {
                var ibox = $element.closest('div.ibox');
                var button = $element.find('i.fa-expand');
                $('body').toggleClass('fullscreen-ibox-mode');
                button.toggleClass('fa-expand').toggleClass('fa-compress');
                ibox.toggleClass('fullscreen');
                setTimeout(function() {
                    $(window).trigger('resize');
                }, 100);
            }
        }
    };
}

/**
 * minimalizaSidebar - Directive for minimalize sidebar
*/
function minimalizaSidebar($timeout) {
    return {
        restrict: 'A',
        template: '<a class="navbar-minimalize minimalize-styl-2 btn btn-primary " href="" ng-click="minimalize()" style="margin-top: 10px;"><i class="fa fa-bars"></i></a>',
        controller: function ($scope, $element) {
            $scope.minimalize = function () {
                $("body").toggleClass("mini-navbar");
                var screenWidth=$( window ).width();
                if(screenWidth==768){
                        if (!$('body').hasClass('mini-navbar')) {
                            $("#side-menu").css("display", "none");
                        }
                        else {
                            $("#side-menu").css("display", "block");
                            //$('#side-menu').show();
                        }

                }
                if (!$('body').hasClass('mini-navbar') || $('body').hasClass('body-small')) {
                    $('.tooltip').hide();
                    var width = document.getElementById('CustomTemplate').offsetWidth;
                    if(width<900){
                        $('#dashboardTitleIcons').hide();
                    }
                    // Hide menu in order to smoothly turn on when maximize menu
                    $('#side-menu').hide();
                    // For smoothly turn on menu
                    setTimeout(
                        function () {
                            $('#side-menu').fadeIn(500);
                            if (!$('body').hasClass('body-small')){
                                    /*document.getElementById('tabs-container-desk-view').setAttribute('style','padding-left: 221px;');
                                    document.getElementById('tabs-container-response-view').setAttribute('style','padding-left: 221px;');*/
                            }
                            else{
                                $('#dashboardTitleIcons').hide()

                            }
                        }, 100);
                }
                else if ($('body').hasClass('fixed-sidebar')){
                    $('#side-menu').hide();
                    setTimeout(
                        function () {
                            $('#side-menu').fadeIn(500);
                        }, 300);
                }
                else {
                    $('.tooltip').hide();
                    // Remove all inline style from jquery fadeIn function to reset menu state
                    $('#side-menu').removeAttr('style');
                    if ($('body').hasClass('mini-navbar')){
                        $('.tooltip').show();
                        $('#dashboardTitleIcons').show();
                           /* document.getElementById('tabs-container-desk-view').setAttribute('style','padding-left: 71px;');
                            document.getElementById('tabs-container-response-view').setAttribute('style','padding-left: 71px;');*/

                    }

                }
            }
        }
    };
};


function closeOffCanvas() {
    return {
        restrict: 'A',
        template: '<a class="close-canvas-menu" ng-click="closeOffCanvas()"><i class="fa fa-times"></i></a>',
        controller: function ($scope, $element) {
            $scope.closeOffCanvas = function () {
                $("body").toggleClass("mini-navbar");
            }
        }
    };
}

/**
 * vectorMap - Directive for Vector map plugin
 */
function vectorMap() {
    return {
        restrict: 'A',
        scope: {
            myMapData: '=',
        },
        link: function (scope, element, attrs) {
            element.vectorMap({
                map: 'world_mill_en',
                backgroundColor: "transparent",
                regionStyle: {
                    initial: {
                        fill: '#e4e4e4',
                        "fill-opacity": 0.9,
                        stroke: 'none',
                        "stroke-width": 0,
                        "stroke-opacity": 0
                    }
                },
                series: {
                    regions: [
                        {
                            values: scope.myMapData,
                            scale: ["#1ab394", "#22d6b1"],
                            normalizeFunction: 'polynomial'
                        }
                    ]
                },
            });
        }
    }
}


/**
 * sparkline - Directive for Sparkline chart
 */
function sparkline() {
    return {
        restrict: 'A',
        scope: {
            sparkData: '=',
            sparkOptions: '=',
        },
        link: function (scope, element, attrs) {
            scope.$watch(scope.sparkData, function () {
                render();
            });
            scope.$watch(scope.sparkOptions, function(){
                render();
            });
            var render = function () {
                $(element).sparkline(scope.sparkData, scope.sparkOptions);
            };
        }
    }
};

/**
 * icheck - Directive for custom checkbox icheck
 */
function icheck($timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function($scope, element, $attrs, ngModel) {
            return $timeout(function() {
                var value;
                value = $attrs['value'];

                $scope.$watch($attrs['ngModel'], function(newValue){
                    $(element).iCheck('update');
                })

                return $(element).iCheck({
                    checkboxClass: 'icheckbox_square-green',
                    radioClass: 'iradio_square-green'

                }).on('ifChanged', function(event) {
                        if ($(element).attr('type') === 'checkbox' && $attrs['ngModel']) {
                            $scope.$apply(function() {
                                return ngModel.$setViewValue(event.target.checked);
                            });
                        }
                        if ($(element).attr('type') === 'radio' && $attrs['ngModel']) {
                            return $scope.$apply(function() {
                                return ngModel.$setViewValue(value);
                            });
                        }
                    });
            });
        }
    };
}

/**
 * ionRangeSlider - Directive for Ion Range Slider
 */
function ionRangeSlider() {
    return {
        restrict: 'A',
        scope: {
            rangeOptions: '='
        },
        link: function (scope, elem, attrs) {
            elem.ionRangeSlider(scope.rangeOptions);
        }
    }
}

/**
 * dropZone - Directive for Drag and drop zone file upload plugin
 */
function dropZone() {
    return function(scope, element, attrs) {
        element.dropzone({
            url: "/upload",
            maxFilesize: 100,
            paramName: "uploadfile",
            maxThumbnailFilesize: 5,
            init: function() {
                scope.files.push({file: 'added'});
                this.on('success', function(file, json) {
                });
                this.on('addedfile', function(file) {
                    scope.$apply(function(){
                        alert(file);
                        scope.files.push({file: 'added'});
                    });
                });
                this.on('drop', function(file) {
                    alert('file');
                });
            }
        });
    }
}

/**
 * chatSlimScroll - Directive for slim scroll for small chat
 */
function chatSlimScroll($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element) {
            $timeout(function(){
                element.slimscroll({
                    height: '234px',
                    railOpacity: 0.4
                });

            });
        }
    };
}

/**
 * customValid - Directive for custom validation example
 */
function customValid(){
    return {
        require: 'ngModel',
        link: function(scope, ele, attrs, c) {
            scope.$watch(attrs.ngModel, function() {

                // You can call a $http method here
                // Or create custom validation

                var validText = "Inspinia";

                if(scope.extras == validText) {
                    c.$setValidity('cvalid', true);
                } else {
                    c.$setValidity('cvalid', false);
                }

            });
        }
    }
}


/**
 * fullScroll - Directive for slimScroll with 100%
 */
function fullScroll($timeout){
    return {
        restrict: 'A',
        link: function(scope, element) {
            $timeout(function(){
                element.slimscroll({
                    height: '100%',
                    railOpacity: 0.9
                });

            });
        }
    };
}

/**
 * slimScroll - Directive for slimScroll with custom height
 */
function slimScroll($timeout){
    return {
        restrict: 'A',
        scope: {
            boxHeight: '@'
        },
        link: function(scope, element) {
            $timeout(function(){
                element.slimscroll({
                    height: scope.boxHeight,
                    railOpacity: 0.9
                });

            });
        }
    };
}

/**
 * clockPicker - Directive for clock picker plugin
 */
function clockPicker() {
    return {
        restrict: 'A',
        link: function(scope, element) {
                element.clockpicker();
        }
    };
};


/**
 * landingScrollspy - Directive for scrollspy in landing page
 */
function landingScrollspy(){
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.scrollspy({
                target: '.navbar-fixed-top',
                offset: 80
            });
        }
    }
}

/**
 * fitHeight - Directive for set height fit to window height
 */
function fitHeight(){
    return {
        restrict: 'A',
        link: function(scope, element) {
            element.css("height", $(window).height() + "px");
            element.css("min-height", $(window).height() + "px");
        }
    };
}

function channelDiv(){
    return{
        restrict : 'E',
        scope:{channel:'= '},
        template : '<div class="col-lg-4"></div>'

    }
}

function chartHeight() {
    return {
        controller: function($scope, $element){
            this.chartHeight = $element[0].offsetHeight;
        }
    };
}
function sizeWatcher (){
    return {
        require : "^chartHeight",
        scope: {
            sizeWatcherHeight: '=',
            sizeWatcherWidth: '=',
        },
        link: function( scope, elem, attrs,chartSizeCtrl) {
            // function initsize(){
            var noOfItems = scope.sizeWatcherWidth.length;
            var cols;
            if (noOfItems <= 2)
                cols = 1;
            else if (noOfItems > 2 && noOfItems <= 4)
                cols = 2;
            else
                cols = 3;

            //var cols = $window.innerWidth>=768 ? 2 : 1;
            var rows = Math.ceil(noOfItems / cols);
            if (chartSizeCtrl.chartHeight != undefined && chartSizeCtrl.chartHeight != 0) {
                if (scope.sizeWatcherHeight == undefined || scope.sizeWatcherHeight == 0) {
                    var chartHeight = chartSizeCtrl.chartHeight;
                    scope.sizeWatcherHeight = Math.ceil((chartHeight * 0.2) / rows);
                }
            }
            else {
                if (scope.sizeWatcherHeight == undefined && scope.sizeWatcherHeight == 0) {
                scope.sizeWatcherHeight = elem.prop('offsetHeight');
            }
            }
        }
    };
}

function expSizeWatcher (){
    return {
        scope: {
            expSizeWatcherHeight:'='
        },
        link: function( scope, elem, attrs,expChartSizeCtrl) {
                if(scope.expSizeWatcherHeight == undefined && scope.expSizeWatcherHeight == 0){
                scope.expSizeWatcherHeight = elem.prop('offsetHeight');
            }
        }
    };
}

 function fileModel($parse){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                })
            })
        }
    }
}
 function chosenLinker() {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            // update the select when data is loaded
            scope.$watch(attr.chosen, function(oldVal, newVal) {
                element.trigger('liszt:updated');
                element.trigger('chosen:updated');
            });

            // update the select when the model changes
            scope.$watch(attr.ngModel, function() {
                element.trigger('liszt:updated');
                element.trigger('chosen:updated');
            });

            element.chosen();
        }
        }
        }
 function lineCount(){
    this.countLines = function(ta, options) {
        var defaults = {
            recalculateCharWidth: true,
            charsMode: "random",
            fontAttrs: ["font-family", "font-size", "text-decoration", "font-style", "font-weight"]
        };

        options = $.extend({}, defaults, options);

        var masterCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        var counter;

        if (!ta.jquery) {
            ta = $(ta);
        }

        var value = ta.val();
        switch (options.charsMode) {
            case "random":
                // Build a random collection of characters
                options.chars = "";
                masterCharacters += ".,?!-+;:'\"";
                for (counter = 1; counter <= 12; counter++) {
                    options.chars += masterCharacters[(Math.floor(Math.random() * masterCharacters.length))];
                }
                break;
            case "alpha":
                options.chars = masterCharacters;
                break;
            case "alpha_extended":
                options.chars = masterCharacters + ".,?!-+;:'\"";
                break;
            case "from_ta":
                // Build a random collection of characters from the textarea
                if (value.length < 15) {
                    options.chars = masterCharacters;
                } else {
                    for (counter = 1; counter <= 15; counter++) {
                        options.chars += value[(Math.floor(Math.random() * value.length))];
                    }
                }
                break;
            case "custom":
                // Already defined in options.chars
                break;
        }

        // Decode chars
        if (!$.isArray(options.chars)) {
            options.chars = options.chars.split("");
        }

        // Generate a span after the textarea with a random ID
        var id = "";
        for (counter = 1; counter <= 10; counter++) {
            id += (Math.floor(Math.random() * 10) + 1);
        }

        ta.after("<span id='s" + id + "'></span>");
        var span = $("#s" + id);

        // Hide the span
        span.hide();

        // Apply the font properties of the textarea to the span class
        $.each(options.fontAttrs, function(i, v) {
            span.css(v, ta.css(v));
        });

        // Get the number of lines
        var lines = value.split("\n");
        var linesLen = lines.length;

        var averageWidth;

        // Check if the textarea has a cached version of the average character width
        if (options.recalculateCharWidth || ta.data("average_char") == null) {
            // Get a pretty good estimation of the width of a character in the textarea. To get a better average, add more characters and symbols to this list
            var chars = options.chars;

            var charLen = chars.length;
            var totalWidth = 0;

            $.each(chars, function(i, v) {
                span.text(v);
                totalWidth += span.width();
            });

            // Store average width on textarea
            ta.data("average_char", Math.ceil(totalWidth / charLen));
        }

        averageWidth = ta.data("average_char");

        // We are done with the span, so kill it
        span.remove();

        // Determine missing width (from padding, margins, borders, etc); this is what we will add to each line width
        var missingWidth = (ta.outerWidth() - ta.width()) * 2;

        // Calculate the number of lines that occupy more than one line
        var lineWidth;

        var wrappingLines = 0;
        var wrappingCount = 0;
        var blankLines = 0;

        $.each(lines, function(i, v) {
            // Calculate width of line
            lineWidth = ((v.length + 1) * averageWidth) + missingWidth;
            // Check if the line is wrapped
            if (lineWidth >= ta.outerWidth()) {
                // Calculate number of times the line wraps
                var wrapCount = Math.floor(lineWidth / ta.outerWidth());
                wrappingCount += wrapCount;
                wrappingLines++;
            }

            if ($.trim(v) === "") {
                blankLines++;
            }
        });

        var ret = {};
        ret["actual"] = linesLen;
        ret["wrapped"] = wrappingLines;
        ret["wraps"] = wrappingCount;
        ret["visual"] = linesLen + wrappingCount;
        ret["blank"] = blankLines;

        return ret;
    };
}
function textSizeWatcher (lineCount){
    return {
        scope: {
            textSizeWatcherData:'=',
            textSizeWatcherWidget:'=',
            textSizeLeft:'=',
            textSizeFilled:'='

        },
        link: function( scope, elem, attrs) {
            scope.$watch('textSizeWatcherData', function(newValue, oldValue) {
                if (newValue){
                    console.log('text watcher',scope.textSizeWatcherData.length,scope.textSizeWatcherWidget)
                    console.log("I see a data change!",scope.textSizeLeft,scope.textSizeFilled);
                    if(scope.textSizeWatcherData != undefined) {
                            (function($) {
                                $.fn.hasScrollBar = function() {
                                    console.log(this.get(0).scrollHeight,this.get(0).clientHeight)
                                    return this.get(0).scrollHeight > this.get(0).clientHeight;
                                }
                            })(jQuery);
                            var scroll = $(elem).hasScrollBar();
                            if(scroll){
                                if(scope.textSizeWatcherWidget.widgetType=='reportParaWidget'){
                                if(scope.textSizeLeft>=1 &&  scope.textSizeWatcherWidget.sizeY<2) {
                                    console.log('inside if para');
                                    $(elem).attr('maxlength',1000);
                                    scope.textSizeWatcherWidget.sizeY=2;
                                    --scope.textSizeLeft;
                                    ++scope.textSizeFilled;
                                    scope.$emit('broadCastUpdateCharts');

                                }
                                else{
                                    $(elem).attr('maxlength',300);
                                    $(elem).attr('rows', '3');
                                    console.log('inside else para',$(elem).attr('maxlength'),$(elem).attr('rows'));
                                }
                                }
                                else if(scope.textSizeWatcherWidget.widgetType=='reportHeadingWidget'){
                                    console.log('inside if heading');
                                    scope.textSizeWatcherWidget.sizeY=2;
                                    scope.$emit('broadCastUpdateCharts');
                                }
                            }
                            else{
                                console.log("inside scroll false")
                                if(scope.textSizeWatcherWidget.widgetType=='reportParaWidget' && scope.textSizeWatcherData.length<290){
                                    if(scope.textSizeWatcherWidget.sizeY>1) {
                                        scope.textSizeWatcherWidget.sizeY=1;
                                        ++scope.textSizeLeft;
                                        --scope.textSizeFilled;
                                        $(elem).attr('maxlength',300);
                                        $(elem).attr('rows', '3');
                                        scope.$emit('broadCastUpdateCharts');
                                    }
                                }
                                else if(scope.textSizeWatcherWidget.widgetType=='reportHeadingWidget' && scope.textSizeWatcherData.length<45){
                                    if(scope.textSizeWatcherWidget.sizeY>1) {
                                        scope.textSizeWatcherWidget.sizeY=1;
                                    }
                                }
                            }
                            console.log('has scroll bar',scroll,elem,$(elem))

                    }
                }
                else scope.textSizeWatcherData= scope.textSizeWatcherWidget.textData;
            }, true);


        }
    };
}



/**
 *
 * Pass all functions into module
 */
angular
    .module('inspinia')
    .directive('pageTitle', pageTitle)
    .directive('sideNavigation', sideNavigation)
    .directive('iboxTools', iboxTools)
    .directive('minimalizaSidebar', minimalizaSidebar)
    .directive('vectorMap', vectorMap)
    .directive('sparkline', sparkline)
    .directive('icheck', icheck)
    .directive('ionRangeSlider', ionRangeSlider)
    .directive('dropZone', dropZone)
    .directive('responsiveVideo', responsiveVideo)
    .directive('chatSlimScroll', chatSlimScroll)
    .directive('customValid', customValid)
    .directive('fullScroll', fullScroll)
    .directive('closeOffCanvas', closeOffCanvas)
    .directive('clockPicker', clockPicker)
    .directive('landingScrollspy', landingScrollspy)
    .directive('fitHeight', fitHeight)
    .directive('iboxToolsFullScreen', iboxToolsFullScreen)
    .directive('slimScroll', slimScroll)
    .directive('channelDiv',channelDiv)
    .directive('chartHeight',chartHeight)
    .directive('sizeWatcher',sizeWatcher)
    .directive('expSizeWatcher',expSizeWatcher)
    .directive('hcChart',hcChart)
    .directive('fileModel',fileModel)
    .directive('chosenLinker',chosenLinker)
    .service('lineCount',lineCount)
    .directive('textSizeWatcher',textSizeWatcher)