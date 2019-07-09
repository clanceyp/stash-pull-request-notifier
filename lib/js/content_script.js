(function($) {
    var extensionName = "stash-pull-request-notifier",
        html = document.querySelector("html"),
        loaded = html.getAttribute(extensionName);
    // we only want this to run once so add an attr to the html
    if (!loaded && $) {
        $("html").attr(extensionName, "true");
        function initApp() {

            var approveCounter = {
                count : 0,
                selector : ".previously-approved-counter",
                button : ".aui-button.approve",
                panel : ".aui-page-panel",
                currentUser : "#current-user",
                activityItem : ".activity-item",
                addCountDisplay : function(numberOfApproves){
                    if ( $(approveCounter.selector).length === 0 ){
                        // adding it for legacy stash
                        $(approveCounter.button).append('<span title="You have previously approved this pull request" class="'+ approveCounter.selector.substring(1) +'"></span>');
                    }
                    $(approveCounter.selector).data("counter", numberOfApproves);
                    $("html").data("previously-approved", "true");
                },
                test : function(){
                    approveCounter.count++;
                    var userName = $(approveCounter.currentUser).data("username"),
                        userUrl = userName ? "/users/" + userName.toLowerCase() : "";
                    if (!userUrl){

                    } else if ($(approveCounter.activityItem +" a[href='"+ userUrl +"']").length === 0){
                        approveCounter.timer = setTimeout(function(){approveCounter.test()},1000);
                    } else {
                        var numberOfApproves = 0;
                        $(approveCounter.activityItem +" a[href='"+ userUrl +"']").each(function(i, el){
                            if ( $(el).closest(".action").find(".approved").length > 0 ){
                                numberOfApproves++;
                            }
                        });
                        if (numberOfApproves > 0){
                            approveCounter.addCountDisplay(numberOfApproves);
                        }
                        approveCounter.timer = setTimeout(function(){approveCounter.test()},2000);
                    }
                },
                timer : null,
                init : function(){
                    $(document).on("click", ".aui-page-header-actions", approveCounter.updateBackgroundPage);
                    approveCounter.timer = setTimeout(function(){approveCounter.test()}, 1000);
                },
                updateBackgroundPage : function(){
                    console.log("sending message to bg page to request update");
                    chrome.runtime.sendMessage({greeting: "update-please"}, function(response){});
                }
            };
            approveCounter.init();
        }

        if (document.readyState === "interactive" || document.readyState === "complete") {
            initApp();
        } else {
            document.addEventListener("DOMContentLoaded", function (event) {
                initApp();
            });
        }
    }

})(window.Zepto);