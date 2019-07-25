(function($, can, chrome, window){
	"use strict";

	var backgroundPage = chrome.extension.getBackgroundPage(),
        DEFAULT_VALUES = window.OPTIONS.DEFAULT_VALUES,
        username = "",
        passwordInfo = "* Username and password are NOT stored in local storage",
        popup = {
            refreshTime: 3000,// how often to check the background page for changes
            checkingCounter: 0,
			changed: true,
            items: [],
			authorItems: [],
			snoozeItem: function(e){
				var id = $(e.target).closest("[data-id]").attr("data-id");
				if (id && backgroundPage.kmj.snoozedItems.indexOf(parseInt(id)) === -1){
					$(e.target).closest("[data-id]").addClass("item--snoozed");
					document.querySelector("[data-id='"+id+"']").removeAttribute("open");
					backgroundPage.kmj.addSnoozed(id);
				} else if (id){
					$(e.target).closest("[data-id]").removeClass("item--snoozed");
					backgroundPage.kmj.addSnoozed(id, true);
				}
				return false;
			},
            isBBCloud: backgroundPage.kmj.getLocalStore("URL").match("api.bitbucket.org"),
            isLastPage: backgroundPage.kmj.json.isLastPage,
            dateFormat: backgroundPage.kmj.getLocalStore("PopupDateformat"),
			showAuthored: backgroundPage.kmj.getLocalStore("AuthorTabEnabled","true","boolean"),
            additionalCSS: backgroundPage.kmj.getLocalStore("PopupCSS"),
            messages:{
                noIssues:"You have 0 reviews queued.<br/>",
				noIssuesMessage:"",
                authThanks: "Thank you, the basic auth headers have been set for this session.",
                badAuth:  "Invalid username and password*<label><span>Username:</span> <input name='user'/></label><label><span>Password:</span> <input name='pass' type='password'/></label><label><span></span><button class='authenticate'>set basic auth headers</button></label>" + passwordInfo,
                notAuthorised: "It looks like the extension needs a username and password to authenticate*<label><span>Username:</span> <input name='user'/></label><label><span>Password:</span> <input name='pass' type='password'/></label><label><span></span><button class='authenticate'>set basic auth headers</button></label>" + passwordInfo,
                unknown:'Either you are not <a class="login" href="#">logged in</a>, or the connection failed for some reason. Please check you have a valid browser session',
                noConf:'Please check the <a href="#" data-configuration>configuration page</a>.',
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
				popup.messages.setNoIssuesMessage();

                popup.items = new can.Observe.List( items );
				popup.authorItems = new can.Observe.List( authorItems );

                can.$("#template").html( backgroundPage.kmj.getLocalStore("PopupTemplate") );

                $("body")
                    .addClass('is-last-page-'+ popup.isLastPage)
	                .addClass('is-author-visible-'+ backgroundPage.kmj.getLocalStore("AuthorTabEnabled","true","string"))
                    .addClass('differentiate-approved-'+ backgroundPage.kmj.getLocalStore("DifferentiateApproved","true","string") )
                    .removeClass('loading')
                    .on('click', "details[data-id]>summary", function(e){
                        // var url = $(e.target).closest("details").attr("data-self");
                        // popup.getDetails(url, e.target);
                    })
                    .on('click', '.authenticate', function() {
                        username = $("[name='user']").val().trim();
                        backgroundPage.kmj.setBasicAuthHeaders({
                            value: btoa($("[name='user']").val().trim() +":"+ $("[name='pass']").val().trim())
                        });
                        $("p.message").html( popup.messages.authThanks );
                    });
                $(".h1").html( '<a href="'+ url +'">'+ backgroundPage.kmj.getLocalStore("PopupTitle") +'</a>' );

                $(".extensionLink")
					.text(manifest.name + ' ('+manifest.version+')')
					.attr("title", manifest.name + ' ('+manifest.version+')');
                try {
                    popup.render();
                } catch(e){
                    $("p.message").text( e.toString() );
                }
                if (popup.additionalCSS) {
                    $("head").append("<style>"+ popup.additionalCSS +"</style>");
                }
            },
            render:function(){
                var formatDate = function(val){
                    var d = new Date(val());
                    return  d.toString(popup.dateFormat);
                };
                var strip = function(val) {
                    return val().trim().replace(/\s+/g,"-").toLocaleLowerCase();
                };
                var html;
                var template = can.view("#template", {stash: popup.items}, {date: formatDate, strip: strip});
                var	authorTemplate = can.view("#template", {stash: popup.authorItems}, {date: formatDate, strip: strip});

                can.$(".display").empty().append(template);
				can.$(".author__display").empty().append(authorTemplate);
				$("body").attr("author-items-length", popup.authorItems.length);

				if (backgroundPage.kmj.connected === false){
					if (backgroundPage.kmj.getLocalStore("URL") === DEFAULT_VALUES["URL"]){
                        html = popup.messages.noConf;
                    } else if (!popup.isBBCloud) {
                        html = popup.messages.unknown + "<br/><br/>" + popup.messages.noConf;
                    } else if (backgroundPage.kmj.connectionStatus === 401) {
                        html = popup.messages.badAuth;
                    } else if (backgroundPage.kmj.connectionStatus === 403) {
                        html = popup.messages.notAuthorised;
                    } else {
                        html = popup.messages.unknown + "<br/>" + popup.messages.noConf;
                    }
					$("body").addClass("logged-in-false").removeClass("logged-in-true");
                    $("p.message").html( html );
					if ($("[name='user']").length) {
                        $("[name='user']").val(username);
                    }
					return;
				} else {
					$("body").addClass("logged-in-true").removeClass("logged-in-false");
				}
                if (popup.items.length > 0 || (popup.showAuthored && popup.authorItems.length > 0) ) {
                    $("p.message").empty();
                }
				if (backgroundPage.kmj.items.length === 0){
					$("p.message").html( popup.messages.noIssuesMessage );
                }
            },
            monitor:function(){
				$("body").removeClass("loading");
				$("p.message").empty();
				if (popup.checking){
					clearTimeout(popup.checking);
				}
                if (backgroundPage.kmj.items.length !== popup.items.length){/* don't refresh unless something has been added or removed */
                    popup.changed = true;
					popup.items.replace(backgroundPage.kmj.items);
                }
                if (backgroundPage.kmj.items.length === 0){
                    try {
                        popup.render();
                    } catch(e){
                        $("p.message").text( e.toString() );
                    }
                } else {
    				popup.checking = window.setTimeout(function(){popup.monitor();}, popup.refreshTime);
                }
            }
        };

    $(window).on('load', function(){
        popup.init();
        $("#refresh").on('click',function(){
            popup.checkingCounter = 0;
            popup.items.replace( [] );
            popup.authorItems.replace( [] );
            $("body").addClass("loading");
            $("p.message").empty();
            backgroundPage.kmj.init(function(){ popup.init() });
            if (popup.checking){
                window.clearTimeout(popup.checking);
            }
            popup.checking = window.setTimeout(function(){popup.monitor();}, popup.refreshTime);
        });
        $(document).on('click', 'a.login', function(e){
            var target = e.target;
            $(target).attr('href', backgroundPage.kmj.getLocalStore("URL"));
        });
        $(document).on('click', ".item__snooze", popup.snoozeItem);
        $("[data-configuration]").attr("href", chrome.runtime.getManifest()["options_page"]);
        window.popup = popup;
        window.backgroundPage = backgroundPage;
    });


})(window.$, window.can, window.chrome, window);
