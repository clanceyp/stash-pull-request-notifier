(function($, can, chrome, window){
	"use strict";


	var backgroundPage = chrome.extension.getBackgroundPage(),
        popup = {
            refreshTime:3000,// how often to check the background page for changes
            checkingCounter:0,
            items:[],
            isLastPage: backgroundPage.kmj.json.isLastPage,
            dateFormat: backgroundPage.kmj.getLocalStore("PopupDateformat"),
            messages:{
                noIssues:"You have 0 reviews queued.<br/> Go have a tea instead!",
                unknown:'Either you are not <a class="login" href="#">logged in</a>, or the connection failed for some reason :(',
                noConf:'Please check the <a href="options.html">configuration page</a>.'
            },
            init:function() {
                var manifest = chrome.runtime.getManifest(),
                    url = backgroundPage.kmj.urlCleaner( backgroundPage.kmj.getLocalStore("URL") ),
                    items = backgroundPage.kmj.items ;

                popup.items = new can.Observe.List( items );

                can.$("#template").html( backgroundPage.kmj.getLocalStore("PopupTemplate") );

                $("body")
                    .addClass('is-last-page-'+ popup.isLastPage)
                    .addClass('differentiate-approved-'+ backgroundPage.kmj.getLocalStore("DifferentiateApproved") );
                $(".h1").html( '<a href="'+ url +'">'+ backgroundPage.kmj.getLocalStore("PopupTitle") +'</a>' );
                //$("#refereshIcon").css("-webkit-animation-duration", popup.refreshTime +"ms");
                $("#extensionLink").text(manifest.name + ' ('+manifest.version+')');

                popup.render();
            },
            render:function(){
                var url = backgroundPage.kmj.getLocalStore("URL"),
                    html,
                    template = can.view("#template", {stash: popup.items }, {date: function(val){ 
                        var d = new Date(val());
                        return  d.toString(popup.dateFormat)
                    }});

                can.$("#display").append(template);

                if (popup.items.length) {
                    $("footer a.login").text("Stash");
                    $("p.message").empty();
                } else {
                    if (backgroundPage.kmj.getLocalStore("URL") === DEFAULT_VALUES["URL"]){
                        html = popup.messages.noConf;
                    } else if (backgroundPage.kmj.items.length === 0 && backgroundPage.kmj.connected === true){
                        html = popup.messages.noIssues;
                    } else {
                        html = popup.messages.unknown;
                    }
                    $("p.message").empty().html( html );
                    $('footer a.login').text("Login");
                }
            },
            monitor:function(){
                if (backgroundPage.kmj.items.length === 0 && popup.checkingCounter < 5){
                    popup.checkingCounter ++ ;
                    popup.checking = window.setTimeout(function(){popup.monitor();}, popup.refreshTime);
                    return;
                }
                popup.checkingCounter = 0;
                if (backgroundPage.kmj.items.length !== popup.items.length){/* don't refresh unless something has been added or removed */
                    popup.items.replace(backgroundPage.kmj.items);
                }
                $("body").removeClass("loading");
                $("p.message").empty();
                if (backgroundPage.kmj.items.length === 0){
                    var html = (backgroundPage.kmj.connected) ? popup.messages.noIssues : popup.messages.unknown;
                    $("p.message").html( html );
                    popup.items.replace(backgroundPage.kmj.items);
                }
            }
        };

    $(window).on('load', function(){
        popup.init();
        var mon;
        $("#refresh").on('click',function(){
            popup.checkingCounter = 0;
            popup.items.replace( [] );
            $("body").addClass("loading");
            $("p.message").empty();
            backgroundPage.kmj.init();
            if (popup.checking){
                window.clearTimeout(popup.checking);
            }
            popup.checking = window.setTimeout(function(){popup.monitor();}, popup.refreshTime);
        });
        $(document).on('click', 'a.login', function(e){
            var target = e.target;
            $(target).attr('href', backgroundPage.kmj.getLocalStore("URL"));
        });
        mon = setInterval(function(){popup.monitor();}, popup.refreshTime);
        window.popup = popup;
        window.backgroundPage = backgroundPage;
    });


})(window.$, window.can, window.chrome, window);