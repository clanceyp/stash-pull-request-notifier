(function(){
    var addApproveCounter = location.href.indexOf("/pull-requests/") > -1 ? true : false;
    if( addApproveCounter ) {
        $(document).ready(function(){
            var loadCounter = {
                count : 0,
                selector : ".previously-approved-counter",
                addCountDisplay : function(numberOfApproves){
                    if ( $(".aui-button.approve "+ loadCounter.selector).length === 0 ){
                        $(".aui-button.approve").append('<span title="You have previously approved this pull request" class="'+ loadCounter.selector.substring(1) +'"></span>');
                    }
                    $(loadCounter.selector).data("counter",numberOfApproves);
                    $(".aui-page-panel").data("previously-approved", "true");
                },
                test : function(){
                    loadCounter.count++;
                    var userName = $("#current-user").data("username"),
                        userUrl = userName ? "/users/" + userName.toLowerCase() : "";
                    if (!userUrl){

                    } else if ($(".activity-item a[href='"+ userUrl +"']").length === 0){
                        loadCounter.timer = setTimeout(function(){loadCounter.test()},1000);
                    } else {
                        var numberOfApproves = 0;
                        $(".activity-item a[href='"+ userUrl +"']").each(function(i, el){
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
                    $(".aui-button.merge-pull-request").prop("disabled","true");
                    $("button.aui-button.approve").on("click",loadCounter.updateBackground);
                    loadCounter.timer = setTimeout(function(){loadCounter.test()},1000);
                },
                updateBackground : function(){
                    console.log("sending message to bg page to request update");
                    chrome.runtime.sendMessage({greeting: "update-please"}, function(response){});
                }
            };
            loadCounter.init();
        });
    }

})();
