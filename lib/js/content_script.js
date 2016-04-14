(function() {
    var extensionName = "stash-pull-request-notifier",
        html = document.querySelector("html"),
        loaded = html.getAttribute(extensionName);

    if (!loaded) {
        $("html").attr(extensionName, "true");
        function initApp() {

            var loadCounter = {
                count : 0,
                selector : ".previously-approved-counter",
                button : ".aui-button.approve",
                merge : ".aui-button.merge-pull-request",
                panel : ".aui-page-panel",
                currentUser : "#current-user",
                activityItem : ".activity-item",
                addCountDisplay : function(numberOfApproves){
                    if ( $(loadCounter.button +" "+ loadCounter.selector).length === 0 ){
                        $(loadCounter.button).append('<span title="You have previously approved this pull request" class="'+ loadCounter.selector.substring(1) +'"></span>');
                    }
                    $(loadCounter.selector).data("counter", numberOfApproves);
                    $("html").data("previously-approved", "true");
                },
                test : function(){
                    loadCounter.count++;
                    var userName = $(loadCounter.currentUser).data("username"),
                        userUrl = userName ? "/users/" + userName.toLowerCase() : "";
                    if (!userUrl){

                    } else if ($(loadCounter.activityItem +" a[href='"+ userUrl +"']").length === 0){
                        loadCounter.timer = setTimeout(function(){loadCounter.test()},1000);
                    } else {
                        var numberOfApproves = 0;
                        $(loadCounter.activityItem +" a[href='"+ userUrl +"']").each(function(i, el){
                            if ( $(el).closest(".action").find(".approved").length > 0 ){
                                numberOfApproves++;
                            }
                        });
                        if (numberOfApproves > 0){
                            loadCounter.addCountDisplay(numberOfApproves);
                        }
                        loadCounter.timer = setTimeout(function(){loadCounter.test()},2000);
                    }
                },
                timer : null,
                init : function(){
                    $(loadCounter.merge).prop("disabled","true");
                    $(loadCounter.button).on("click",loadCounter.updateBackground);
                    loadCounter.timer = setTimeout(function(){loadCounter.test()},1000);
                },
                updateBackground : function(){
                    console.log("sending message to bg page to request update");
                    chrome.runtime.sendMessage({greeting: "update-please"}, function(response){});
                }
            };
            loadCounter.init();
        }

        if (document.readyState === "interactive" || document.readyState === "complete") {
            initApp();
        } else {
            document.addEventListener("DOMContentLoaded", function (event) {
                initApp();
            });
        }
    }

})();