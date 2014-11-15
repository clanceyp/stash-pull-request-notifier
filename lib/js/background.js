
(function($, _, can, chrome, document, window){
    "use strict";
    /*
    chrome.extension.onRequest.addListener(
            function(request, sender, sendResponse) {
            // console.log(sender.tab ?
            //             "from a content script:" + sender.tab.url :
            //             "from the extension");
        });
    */
    /* TODO; re-factor legacy code and clean-up */
    var DEFAULT_VALUES = window.DEFAULT_VALUES,
        console = window.console,
        manifest = chrome.runtime.getManifest(),
        kmj = {
            busy:false,
            json:{},
            sillyGoodThing:["all done, cool!","relax!","donut time!","zen out...","chill..."],
            char: {
                checkmark: "\u2713",
                infinity: "\u221E",
                delta: "\u0394"
            },
            items:[],
            notifications: {},
            seenNotifications: [],
            opendNotifications: [],
            kanbanItems:[],
            kanbanFiterDocuments:[],
            connected:false,
            httpRequest:null, // main request for the popup, there should only be one of these
            /**
             * Method, returns a value for a given key. checks; localstore, DEFAULT_VALUES and defaultValue
             * @id getRefresh
             * @memberOf kmj
             * @param {string} value Optional can take a string value for testing
             * @param {number} value Optional can take a number value for testing
             * @return {number}
             */
            getRefresh:function(value){
                value = value || kmj.getLocalStore("RefreshTime");
                return parseInt(value, 10) * 1000;
            },
            /**
             * Method, returns a value for a given key. checks; localstore, DEFAULT_VALUES and defaultValue
             * @id getLocalStore
             * @memberOf kmj
             * @param {string} key The key to search for
             * @param {string} defaultValue Fallback value if required
             * @return {string}
             */
            getLocalStore:function(key, defaultValue, fn){
                var value = localStorage[key] || DEFAULT_VALUES[key] || defaultValue || null;

                if (value && key.toLowerCase().indexOf("password") === 0){
                    value = window.atob(value);
                }
                if (typeof fn === "function"){
                    value = fn(value);
                } else if (typeof fn === "number"){
                    value = +value;
                } else if (typeof fn === "boolean"){
                    if (typeof value === "string"){
                        value = (value==="true") ? true : false;
                    } else {
                        value = !!value;
                    }
                }
                return value;
            },
            /**
             * Method, sets the value for a given key value pair in the localStore
             * @id setLocalStore
             * @memberOf kmj
             * @param {string} key The key to set
             * @param {string} value The value to set
             * @return void
             */
            setLocalStore:function(key,value){
                if (key.toLowerCase().indexOf("password") === 0){
                    value = window.btoa(value);
                }
                localStorage[key] = value;
                kmj.initDelay();
            },
            /**
             * Method, resets the localStore, to default value, and re-runs the kmj.init method
             * @id resetLocalStore
             * @memberOf kmj
             * @param {string} key Optional, if provided just resets the key item
             * @param {string} defaultValue Optional, if a key was provided
             * @return void
             */
            resetLocalStore:function(key, defaultValue, undefined){
                if (key === undefined){
                    resetAll();
                } else {
                    localStorage.removeItem( key );
                    if (DEFAULT_VALUES[key]){
                        localStorage[key] = DEFAULT_VALUES[key];
                    } else if (defaultValue){
                        localStorage[key] = defaultValue;
                    }
                }

                function resetAll(){
                    localStorage.clear();
                    for (var key in DEFAULT_VALUES){
                        if (DEFAULT_VALUES.hasOwnProperty(key)){
                            localStorage[key] = DEFAULT_VALUES[key];
                        }
                    }
                }
                kmj.initDelay();
            },
            /**
             * Method, writes messages to the console if the const DEBUG is true
             * @id log
             * @memberOf kmj
             * @param {string} message The output to write to the console
             * @return void
             */
            log:function(message){
                if (window.DEBUG || "jasmine" in window){
                    console.log(message);
                }
            },
            /**
             * Method, starts the background page
             * @id init
             * @memberOf kmj
             * @return void
             */
            init:function(undefinded){
                if (window.jasmine !== undefinded || kmj.busy === true){
                    return;
                }
                if (kmj.repeat){
                    clearTimeout(kmj.repeat);
                }
                if (kmj.checksoon){
                    clearTimeout(kmj.checksoon);
                }
                if (kmj.httpRequest === null){// ignore if there is an active request, wait for it to complete first
                    kmj.updateBrowserActionStatus(-1);
                    kmj.getPopupItems();
                }
                kmj.getKanbanItems();
                kmj.repeat = setTimeout(kmj.init, kmj.getRefresh() );
                chrome.notifications.onClicked.addListener(kmj.respondToNotificationClick);
            },
            /**
             * Method, starts the background page
             * @id initDelay
             * @memberOf kmj
             * @return void
             */
            initDelay:function(undefinded){
                if (window.jasmine !== undefinded || kmj.busy === true){
                    return;
                }
                if (kmj.checksoon){
                    clearTimeout(kmj.checksoon);
                }
                kmj.checksoon = setTimeout(function(){
                    kmj.init();
                }, 2000);
            },
            /**
             * Method, removes double slashes e.g. 'blah///blah//blah.html' => 'blah/blah/blah.html'
             * @id urlCleaner
             * @memberOf kmj
             * @param {string} url The url to be cleaned
             * @return {string}
             */
            urlCleaner:function( url ){
                var urlArr = url.split("://");
                if (urlArr.length > 1){
                    return urlArr[0]+"://"+urlArr[1].replace(/\/+/g,'/');
                } else {
                    return urlArr[0].replace(/\/+/g,'/') ;
                }
            },
            /**
             * Method, returns the cleaned filter
             * @id getCleanUrl
             * @memberOf kmj
             * @param {number} filterId The id of the JIRA filter
             * @return {string}
             */
            getCleanUrl:function( ){
                var url = kmj.getLocalStore("URL") + "/" + kmj.getLocalStore("API") ;
                return kmj.urlCleaner( url );
            },
            /**
             * Method, sets the browser icon text
             * @id updateBrowserActionStatus
             * @memberOf kmj
             * @param {number} status The current status
             * @return void
             */
            updateBrowserActionStatus:function(status, undefined) {
                kmj.log("updateBrowserActionStatus: update status: "+ status);
                var color = [0, 0, 180, 255], // blue
                    title = manifest.name,
                    delay = 0;
                status = (!kmj.connected || status < 0 || status === null || status === undefined) ? '?' : status ;
                if (status === "?"){
                    color = [180, 180, 180, 255] ; // grey
                    title = "Probably not connected, please login to STASH and/or check the options page."
                } else if (status === 0 ) {
                    color = [0, 180, 0, 255] ; // green
                    status = kmj.char.checkmark;
                    title = title + ", "+ kmj.sillyGoodThing[ Math.floor( Math.random() * kmj.sillyGoodThing.length) ];
                } else {
                    delay = 0.3;
                }
                if (kmj.json.isLastPage === false){
                    color = [255, 0, 0, 255] ; // red
                    status = kmj.char.delta;
                    title = "Too many results returned!\nPlease review some outstanding requests or increase the limit on the options page.";
                }
                status = status.toString();
                clearTimeout(kmj.statusTimer);
                kmj.statusTimer = setTimeout(function(){
                    window.chrome.browserAction.setBadgeBackgroundColor( { color: color } );
                    window.chrome.browserAction.setBadgeText( { text: status });
                    window.chrome.browserAction.setTitle( { title: title } );
                },delay*1000);
                return status ;
            },
            /**
             * Method, gets the main filter for the popup display from the users JIRA instance
             * @id getPopupItems
             * @memberOf kmj
             * @return void
             */
            getPopupItems:function(testUrl){
                var url = testUrl || kmj.getCleanUrl( );
                kmj.items = [];
                kmj.httpRequest = $.ajax({
                    type: 'GET',
                    url: url,
                    dataType:"json",
                    timeout: 20000,
                    success: function(data){
                        kmj.httpRequest = null;
                        kmj.handleResponse(data);
                    },
                    error: function(xhr, type){
                        kmj.httpRequest = null;
                        kmj.handleResponseError(type);
                    }
                });

            },
            /**
             * Method, generic httprequest error handler
             * @id handleResponseError
             * @memberOf kmj
             * @param {error} e The error
             * @return void
             */
            handleResponseError:function(e){
                kmj.log(e);
                kmj.log("Something bad happened, maybe couldn't connect to STASH?");
                kmj.items = [];
                kmj.httpRequest = null;
                kmj.connected = false;
                kmj.json = {};
                kmj.updateBrowserActionStatus(-1);
            },
            /**
             * Method, generic httprequest response handler
             * @id handleResponse
             * @memberOf kmj
             * @param {object} data The response data
             * @return void
             */
            handleResponse:function(data){
                var items;
                kmj.connected = true;
                kmj.json = data;
                if ( kmj.json.size === 0 ) {
                    kmj.updateBrowserActionStatus(0);
                    return;
                }
                kmj.items = kmj.json.values;
                kmj.updateBrowserActionStatus( kmj.json.size );
                kmj.updateNotifications( );
            },
            /**
             * Method, generic httprequest response handler
             * @id updateNotifications
             * @memberOf kmj
             * @param {object} data The response data
             * @return void
             */
            updateNotifications:function(){
                var allowNotifications = kmj.getLocalStore("AllowNotifications",0,function(val){ return "true" === val;})
                if (allowNotifications){
                    kmj.items.forEach(kmj.sendNotification);
                }
            },
            /**
             * Method to loop through XML items and covert to an array of JSON objects.
             * @id  popuplateItems
             * @memberOf kmj
             * @param {array} Items The json items array
             * @param {array} items The items array to populate
             * @param {object} ops Object containing options to extend the child items
             * @return void
             *
             */
            popuplateItems:function(Items, items, ops){
                for (var i = 0, len = Items.length; i < len; i++){
                    var json = Items[i];
                    if (ops){
                        for (var name in ops){
                            if (ops.hasOwnProperty(name)){
                                json[name] = ops[name];
                            }
                        }
                    }
                    items.push( json );
                }
            },
            /**
             * Method to loop through kmj.kanbanFiterDocuments and build up the kmj.kanbanItems wall array.
             * @id  buildKanbanItemsList
             * @memberOf kmj
             * @return void
             *
             */
            buildKanbanItemsList:function(){
                kmj.kanbanItems.length = 0;// clear current values and repopulate
                kmj.log("Rebuilding kanbanItemsList current list length "+ kmj.kanbanItems.length + ", number of docs to load "+ kmj.kanbanFiterDocuments.length);
                var kanbanFilterSorted = _.sortBy(kmj.kanbanFiterDocuments, function(item){ return item.filterIndex ;});
                for (var i = 0, filter, xmlItems, XML, kmjUrl, len = kanbanFilterSorted.length; i < len; i++ ){
                    filter = kanbanFilterSorted[i];
                    XML = filter.xml;
                    xmlItems = XML.getElementsByTagName('item');
                    kmjUrl = kmj.urlCleaner( kmj.getLocalStore("URL") + "/" + kmj.getLocalStore("TicketBaseURL") );

                    kmj.popuplateItems(xmlItems, kmj.kanbanItems, {
                        kmjFilterId:filter.id,
                        kmjColumnIndex:filter.filterIndex,
                        kmjUrl:kmjUrl
                    });
                }
                kmj.log("Rebuilt; kmj.kanbanItems.length "+ kmj.kanbanItems.length);
                kmj.busy = false;
            },
            /**
             * Method return the users jira filter list.
             * @id  getKanbanFilterList
             * @memberOf kmj
             * @return {array}
             *
             */
            getKanbanFilterList:function(){
                var rawData = kmj.getLocalStore("ColumnInfo",'[]'),
                    filters = JSON.parse(rawData);
                for (var i = 0, n = filters.length; i < n; i++){
                    filters[i].xmlUrl = kmj.getCleanUrl( filters[i].id );
                    filters[i].url = kmj.urlCleaner( kmj.getLocalStore("URL") );
                }
                return filters;
            },
            /**
             * Method to loop through the jira filter ids and collect XML from server append to kmj.kanbanFiterDocuments.
             * @id  getKanbanItems
             * @memberOf kmj
             * @return void
             *
             */
            getKanbanItems:function(){
                var filter = kmj.getKanbanFilterList(),
                    deferred = can.Deferred(),
                    filterCount = 0,
                    onError = function(e){
                        kmj.updateBrowserActionStatus(-1);
                        kmj.log( "getKanbanItems:error "+ e.message );
                        kmj.connected = false;
                        kmj.busy = false;
                    },
                    onSuccess = function(){ kmj.buildKanbanItemsList(); };

                deferred.done(onSuccess);

                kmj.kanbanFiterDocuments.length = 0;
                for (var i = 0, len = filter.length; i < len; i++ ){
                    deferred.then(request(filter[i], i, len), onError);
                }

                function request(item, i, length){
                    var id = item.id,
                        onError = function(){deferred.reject( { message: 'Could not get filter: '+ id } );};
                    can.ajax({
                        url : kmj.getCleanUrl( id ),
                        type: 'GET',
                        async : true,
                        dataType: 'xml',
                        error: onError,
                        success: function(data){
                            filterCount++;
                            kmj.log('ok got filter '+ id +' '+ filterCount +' of '+ length);
                            kmj.connected = true;
                            kmj.kanbanFiterDocuments.push({
                                id:id,
                                filterIndex:i,
                                title:item.title,
                                xml:data
                            });
                            if (filterCount === length){
                                deferred.resolve();
                            }
                        }
                    });
                }
            },
            sendNotification:function(ops){
                var options = {
                      title: ops.author.user.displayName,
                      iconUrl: 'lib/i/stash-logo-128-padding.png',
                      type: 'basic',
                      message: ops.title
                    }, 
                    url = ops.links.self[0].href;
                if (kmj.seenNotifications.indexOf(url) === -1){
                    kmj.seenNotifications.push(url);
                    chrome.notifications.create(url, options, function(id){
                        kmj.notifications[id] = {
                            url: url
                        }
                    });
                }
                
            },
            respondToNotificationClick:function(id){
                // opendNotifications
                var url = kmj.notifications[id].url ;
                if (url && kmj.opendNotifications.indexOf(url) === -1){
                    kmj.opendNotifications.push(url);
                    chrome.tabs.create({ url: url });
                }
            }
        };

    //setTimeout(function(){ kmj.init(); },1000);
    kmj.init();

    

    window.kmj = kmj;
})(window.$, window._, window.can, window.chrome, window.document, window);
