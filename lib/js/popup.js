(function($, can, chrome, window){
	"use strict";

	var backgroundPage = chrome.extension.getBackgroundPage(),
        DEFAULT_VALUES = window.OPTIONS.DEFAULT_VALUES,
        popup = {
            refreshTime:3000,// how often to check the background page for changes
            checkingCounter:0,
			changed: true,
            items:[],
			authorItems:[],
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
            isLastPage: backgroundPage.kmj.json.isLastPage,
            dateFormat: backgroundPage.kmj.getLocalStore("PopupDateformat"),
			showAuthored: backgroundPage.kmj.getLocalStore("AuthorTabEnabled","true","boolean"),
            additionalCSS: backgroundPage.kmj.getLocalStore("PopupCSS"),
            messages:{
                noIssues:"You have 0 reviews queued.<br/>",
				noIssuesMessage:"",
                unknown:'Either you are not <a class="login" href="#">logged in</a>, or the connection failed for some reason :(',
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

                // popup.items.bind('change', function() { console.log('An element changed.'); });
                // popup.items.bind('set', function() { console.log('An element was set.'); });
                // popup.items.bind('add', function() { console.log('An element was added.'); });
                // popup.items.bind('remove', function() { console.log('An element was removed.'); });
                // popup.items.bind('length', function() { console.log('The length of the list changed.'); });


                can.$("#template").html( backgroundPage.kmj.getLocalStore("PopupTemplate") );

                $("body")
                    .addClass('is-last-page-'+ popup.isLastPage)
	                .addClass('is-author-visible-'+ backgroundPage.kmj.getLocalStore("AuthorTabEnabled","true","string"))
                    .addClass('differentiate-approved-'+ backgroundPage.kmj.getLocalStore("DifferentiateApproved","true","string") )
                    .removeClass('loading')
                    .on('click', "details[data-id]>summary", function(e){
                        // var url = $(e.target).closest("details").attr("data-self");
                        // popup.getDetails(url, e.target);
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
                console.log("hello", popup.items);
                var html,
                    template = can.view("#template", {stash: popup.items }, {date: function(val){
                        var d = new Date(val());
                        return  d.toString(popup.dateFormat)
                    }}),
					authorTemplate = can.view("#template", {
					    stash: popup.authorItems,
                        onlyAuthors: true
                    }, {
					    date: function(val){
                            var d = new Date(val());
                            return  d.toString(popup.dateFormat)
                        }
					});

                can.$(".display").empty().append(template);
				can.$(".author__display").empty().append(authorTemplate);
				$("body").attr("author-items-length", popup.authorItems.length);

				if (backgroundPage.kmj.connected === false){
					if (backgroundPage.kmj.getLocalStore("URL") === DEFAULT_VALUES["URL"]){
                        html = popup.messages.noConf;
                    } else {
                        html = popup.messages.unknown + "<br/>" + popup.messages.noConf;
                    }
					$("body").addClass("logged-in-false").removeClass("logged-in-true");
                    $("p.message").html( html );
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
					var html = (backgroundPage.kmj.connected) ? popup.messages.noIssuesMessage : popup.messages.unknown;
                    $("p.message").html( html );
                }
				popup.checking = window.setTimeout(function(){popup.monitor();}, popup.refreshTime);
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
		$(".item__snooze").each(function(i, el){
			$(el)
				.attr("title","Click here to snooze this request")
				.on("click", popup.snoozeItem);
		});
		$(".item").each(function(i, el){
			var id = $(el).data("id");
			if (id && backgroundPage.kmj.snoozedItems.indexOf(parseInt(id)) !== -1){
				$(el).addClass("item--snoozed");
			}
		});
        $("[data-configuration]").attr("href", chrome.runtime.getManifest()["options_page"]);
        window.popup = popup;
        window.backgroundPage = backgroundPage;
    });


})(window.$, window.can, window.chrome, window);
