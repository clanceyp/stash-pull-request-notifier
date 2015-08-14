(function($, can, chrome, window){
	"use strict";


	var backgroundPage = chrome.extension.getBackgroundPage(),
        popup = {
            refreshTime:3000,// how often to check the background page for changes
            checkingCounter:0,
			changed: true,
            items:[],
			authorItems:[],
            isLastPage: backgroundPage.kmj.json.isLastPage,
            dateFormat: backgroundPage.kmj.getLocalStore("PopupDateformat"),
			showAuthored: backgroundPage.kmj.getLocalStore("AuthorTabEnabled","true","boolean"),
            messages:{
                noIssues:"You have 0 reviews queued.<br/>",
				noIssuesMessage:"",
                unknown:'Either you are not <a class="login" href="#">logged in</a>, or the connection failed for some reason :(',
                noConf:'Please check the <a href="options.html">configuration page</a>.',
				setNoIssuesMessage: function(){
					var niceThings = ["Nothing to review, take the rest of the day off!","Time to catch up on some paperwork?","Time for a well earned tea!","Time for a quick power nap!","Time to pop to the gym!","Relax...."];
					popup.messages.noIssuesMessage = popup.messages.noIssues + niceThings[ Math.floor( Math.random() * niceThings.length) ];
				}
            },
            init:function() {
                var manifest = chrome.runtime.getManifest(),
                    url = backgroundPage.kmj.urlCleaner( backgroundPage.kmj.getLocalStore("URL") + backgroundPage.kmj.getLocalStore("PopupTitleLink","") ),
                    items = backgroundPage.kmj.items,
					authorItems = backgroundPage.kmj.authorItems ;
				popup.messages.setNoIssuesMessage()

                popup.items = new can.Observe.List( items );
				popup.authorItems = new can.Observe.List( authorItems );

                can.$("#template").html( backgroundPage.kmj.getLocalStore("PopupTemplate") );

                $("body")
                    .addClass('is-last-page-'+ popup.isLastPage)
	                .addClass('is-author-visible-'+ backgroundPage.kmj.getLocalStore("AuthorTabEnabled","true","string"))
                    .addClass('differentiate-approved-'+ backgroundPage.kmj.getLocalStore("DifferentiateApproved","true","string") );
                $(".h1").html( '<a href="'+ url +'">'+ backgroundPage.kmj.getLocalStore("PopupTitle") +'</a>' );
                //$("#refereshIcon").css("-webkit-animation-duration", popup.refreshTime +"ms");
                $(".extensionLink")
					.text(manifest.name + ' ('+manifest.version+')')
					.attr("title", manifest.name + ' ('+manifest.version+')')

                popup.render();
            },
            render:function(){
                var url = backgroundPage.kmj.getLocalStore("URL"),
                    html,
                    template = can.view("#template", {stash: popup.items }, {date: function(val){
                        var d = new Date(val());
                        return  d.toString(popup.dateFormat)
                    }}),
					authorTemplate = can.view("#template", {stash: popup.authorItems }, {date: function(val){
                        var d = new Date(val());
                        return  d.toString(popup.dateFormat)
                    }});

                can.$(".display").append(template);
				can.$(".author__display").append(authorTemplate);
				$("body").attr("author-items-length", popup.authorItems.length);

				if (backgroundPage.kmj.connected === false){
					if (backgroundPage.kmj.getLocalStore("URL") === DEFAULT_VALUES["URL"]){
                        html = popup.messages.noConf;
                    } else {
                        html = popup.messages.unknown;
                    }
					$('footer a.login').text("Login");
					$("body").addClass("logged-in-false").removeClass("logged-in-true");
                    $("p.message").html( html );
					return;
				} else {
					$('footer a.login').text("Stash");
					$("body").addClass("logged-in-true").removeClass("logged-in-false");
				}
                if (popup.items.length > 0 || (popup.showAuthored && popup.authorItems.length > 0) ) {
					// something to show
                    $("p.message").empty();
					console.log("1 popup.items.length > 0 || (popup.showAuthored && popup.authorItems.length > 0) true");
                }
				if (backgroundPage.kmj.items.length === 0){
					// connected but no main items
					$("p.message").html( popup.messages.noIssuesMessage );
					console.log("2 backgroundPage.kmj.items.length === 0 && backgroundPage.kmj.connected === true -- true");
                }
            },
            monitor:function(){
				$("body").removeClass("loading");
				$("p.message").empty();
				if (popup.checking){
					clearTimeout(popup.checking);
				}
                // if (backgroundPage.kmj.items.length === 0 && popup.checkingCounter < 5){
                //     popup.checkingCounter ++ ;
                //     popup.checking = window.setTimeout(function(){popup.monitor();}, popup.refreshTime);
                //     return;
                // }
                // popup.checkingCounter = 0;
                if (backgroundPage.kmj.items.length !== popup.items.length){/* don't refresh unless something has been added or removed */
                    popup.changed = true;
					popup.items.replace(backgroundPage.kmj.items);
                }
                if (backgroundPage.kmj.items.length === 0){
					var html = (backgroundPage.kmj.connected) ? popup.messages.noIssuesMessage : popup.messages.unknown;
                    $("p.message").html( html );
                }
				popup.checking = window.setTimeout(function(){popup.monitor();}, popup.refreshTime);
            }
        };

    $(window).on('load', function(){
        popup.init();
        //var mon;
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
        // mon = setInterval(function(){popup.monitor();}, popup.refreshTime);
        window.popup = popup;
        window.backgroundPage = backgroundPage;
    });


})(window.$, window.can, window.chrome, window);
