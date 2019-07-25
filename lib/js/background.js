
(function($, _, can, chrome, document, window){
    "use strict";

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        var stashURL = kmj.getLocalStore("URL"),
            stashCSS = kmj.getLocalStore("StashCSS"),
            stashJS = kmj.getLocalStore("StashJS"),
            insertCSS = kmj.getLocalStore("InsertCSS", false, "boolean");

        if (insertCSS && changeInfo.status && changeInfo.status === "complete" && tab.url && tab.url.startsWith(stashURL) ){

            if (stashCSS) {
                chrome.tabs.insertCSS(tabId, {code: stashCSS});
            }

            chrome.tabs.executeScript(tabId, {file: "lib/js/vendor/zepto.js"}, function(){
                chrome.tabs.executeScript(tabId, {file: "lib/js/content_script.js"}, function(){
                    if (stashJS){
                        // prevent stashJS being run multiple times
                        // for more info on injecting scripts see: https://stackoverflow.com/questions/21535233/injecting-multiple-scripts-through-executescript-in-google-chrome
                        var script = '(function($) {'+
                            '    var extensionName = "stash-pull-request-notifier--insert",'+
                            '        html = document.querySelector("html"),'+
                            '        loaded = html.getAttribute(extensionName);'+
                            '    if (!loaded && $) {'+
                            '        $("html").attr(extensionName, "true");'+
                            '        function initApp() {'+ stashJS  + '}'+
                            '        if (document.readyState === "interactive" || document.readyState === "complete") {'+
                            '            initApp();'+
                            '        } else {'+
                            '            document.addEventListener("DOMContentLoaded", function (event) {'+
                            '                initApp();'+
                            '            });'+
                            '        }'+
                            '    } else if(!$){ console.log("stash-pull-request-notifier--insert: Zepto not found") }'+
                            '})(window.Zepto || window.$);';
                        chrome.tabs.executeScript(tabId, {code: script, runAt: "document_idle"});
                    }
                });
            });

        } else if (changeInfo.status && changeInfo.status === "complete") {
            // console.log("ignoring", tab.url);
        }
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.greeting === "update-please"){
            // console.log("request from page ot refresh");
            kmj.updateBrowserActionStatus(-1);
            kmj.checksoon = setTimeout(function(){
                kmj.init();
            }, 4000);
        }
    });

    /* TODO; refactor legacy code and clean-up */
    var console = window.console,
        manifest = chrome.runtime.getManifest(),
        reValidate = function(){},
        validateURL = function(ops, cb){
            $.ajax({
                type: ops.type || 'GET',
                url: ops.url,
                dataType: ops.dataType || "json",
                timeout: ops.timeout || 20000,
                success: function(data){
                    cb(true, data);
                },
                error: function(xhr, type){
                    if (xhr.status === 401 || xhr.status === 403) {
                        reValidate = function() {
                            validateURL(ops, cb);
                        };
                    }
                    xhr = xhr || {status: "unknown"};
                    cb(false, xhr.status || "unknown");
                }
            });
        },
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
            snoozedItems: [],
            unSetBasicAuthHeaders: function() {
                $.ajaxSettings.beforeSend = function(xhr){};
            },
            setBasicAuthHeaders: function(ops) {
                console.log("setting basic auth header");
                $.ajaxSettings.beforeSend = function(xhr) {
                    xhr.setRequestHeader ("Authorization", "Basic " + ops.value);
                };
                reValidate();
            },
            addSnoozed: function(id, remove){
                id = parseInt(id);
                if (remove){
                    kmj.snoozedItems = kmj.snoozedItems.filter(function(i){
                        return i !== id;
                    });
                } else {
                    kmj.snoozedItems.push(id);
                }
                kmj.init();
            },
            isSnoozed: function(id){
                id = parseInt(id);
                return kmj.snoozedItems.indexOf(id) !== -1;
            },
            authorItems:[],
            popupItems:[],
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
                return options.getLocalStore(key, defaultValue, fn);
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
                options.setLocalStore(key, value);
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
            resetLocalStore:function(key, defaultValue){
                options.resetLocalStore(key, defaultValue);
                kmj.initDelay();
            },
            /**
             * Method, writes messages to the console if the const DEBUG is true
             * @id log
             * @memberOf kmj
             * @param {string} message The output to write to the console
             * @return void
             */
            log:function(){
                if (window.DEBUG || "jasmine" in window){
                    console.log(arguments);
                }
            },
            /**
             * Method, triggers callback and deletes it
             * @id triggerCallback
             * @memberOf kmj
             * @return void
             */
            triggerCallback:function(){
                if (kmj.callback){
                    kmj.callback();
                    delete kmj.callback;
                }
            },
            /**
             * Method, starts the background page
             * @id init
             * @memberOf kmj
             * @return void
             */
            init:function(callback){
                if (window.jasmine !== undefined || kmj.busy === true){
                    return;
                }
                if (callback){
                    kmj.callback = callback;
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
                //kmj.getItems();
                //setTimeout(kmj.getItems(), 10000 );
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
                var arr = url.split("http"),
                    temp = (arr.length>1 ? "http": "")+arr[arr.length-1],
                    urlArr = temp.split("://");

                if (urlArr.length > 1){
                    return urlArr[0]+"://"+urlArr[1].replace(/\/+/g,'/').replace(/\s/g, "");
                } else {
                    return urlArr[0].replace(/\/+/g,'/').replace(/\s/g, "") ;
                }
            },
            /**
             * Method, returns the cleaned filter
             * @id getCleanUrl
             * @memberOf kmj
             * @param {number} filterId The id of the JIRA filter
             * @return {string}
             */
            getCleanUrl:function( type ){
                var type = type || "API",
                    url = kmj.getLocalStore("URL") + "/" + kmj.getLocalStore( type ) ;
                return kmj.urlCleaner( url );
            },
            /**
             * Method, sets the browser icon text
             * @id updateBrowserActionStatus
             * @memberOf kmj
             * @param {number} status The current status
             * @return void
             */
            updateBrowserActionStatus:function(status, unapproved, undefined) {
                // console.log("updateBrowserActionStatus: update status: ", status, unapproved);
                var color = [0, 0, 180, 255], // blue
                    title = manifest.name +" v"+ manifest.version,
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
                    // status = unapproved === status ? status : unapproved +"/"+ status;
                    if (unapproved !== status && kmj.getLocalStore("DifferentiateApproved", false, "boolean")){
                        status = unapproved? unapproved +"/"+ status : status;
                        if (unapproved === 0){
                            color = [0, 180, 0, 255] ; // green
                        }
                    } else {
                        status = status.toString();
                    }
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
                    if (!window.chrome){ return }
                    window.chrome.browserAction.setBadgeBackgroundColor( { color: color } );
                    window.chrome.browserAction.setBadgeText( { text: status });
                    window.chrome.browserAction.setTitle( { title: title } );
                },delay*1000);
                return status ;
            },
            /**
             * Method, gets the author items from STASH
             * @id getAuthorItems
             * @memberOf kmj
             * @return void
             */
            getAuthorItems:function(testUrl){
                if (!kmj.getLocalStore("AuthorTabEnabled", false, "boolean")){
                    this.triggerCallback();
                    return;
                }
                var url = testUrl || kmj.getCleanUrl( "AuthorAPI");
                kmj.httpRequest = $.ajax({
                    type: 'GET',
                    url: url,
                    dataType:"json",
                    timeout: 20000,
                    success: function(data){
                        kmj.httpRequest = null;
                        kmj.handleResponse(data,"authorItems");
                    },
                    error: function(xhr, type){
                        kmj.authorItems = [];
                        kmj.httpRequest = null;
                        kmj.handleResponseError(type);
                    }
                });

            },
            /**
             * Method, gets the main items from STASH
             * @id getPopupItems
             * @memberOf kmj
             * @return void
             */
            getPopupItems:function(testUrl){
                var url = testUrl || kmj.getCleanUrl( );
                // kmj.items = []; don't clear out at this stage. keep the old ones there for now
                kmj.httpRequest = $.ajax({
                    type: 'GET',
                    url: url,
                    dataType:"json",
                    timeout: 20000,
                    success: function(data){
                        kmj.httpRequest = null;
                        kmj.handleResponse(data);
                        kmj.getAuthorItems();
                    },
                    error: function(xhr, type){
                        kmj.httpRequest = null;
                        kmj.connectionStatus = xhr.status;
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
                kmj.log("Something bad happened, maybe couldn't connect to server?");
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
            handleResponse:function(data, listToPopulate){
                var items,
                    unapproved,
                    size = 0,
                    popupReverseOrder = kmj.getLocalStore("PopupReverseOrder", false, "boolean"),
                    isAuthorItemsVisible = kmj.getLocalStore("AuthorTabEnabled", false, "boolean");

                listToPopulate = listToPopulate || "items";
                kmj[listToPopulate] = [];
                kmj.connected = true;
                kmj.json = data;
                if ( kmj.json.size === 0 && listToPopulate === "items") {
                    kmj.updateBrowserActionStatus(0);
                    return;
                }

                kmj.processList(kmj.json.values, listToPopulate);

                if (listToPopulate === "authorItems" && isAuthorItemsVisible){
                    kmj.triggerCallback();
                } else if (listToPopulate === "items" && !isAuthorItemsVisible){
                    kmj.triggerCallback();
                }
                kmj.getItems();
            },
            /**
             * Method, performs some actions on a list to add and update some list item parameters
             * @id updateStatus
             * @memberOf kmj
             * @return void
             */
            updateStatus: function(){
                var active = _.filter(kmj.items, function(obj){ return !obj.snoozed }).length,
                    reviewerUnapproved = _.filter(kmj.items, function(obj){ return !obj.snoozed && !obj.reviewerApproved }).length;
                kmj.log("items update, ", active, reviewerUnapproved);
                kmj.updateBrowserActionStatus( active , reviewerUnapproved );
                kmj.updateNotifications( );
            },
            /**
             * Method, performs some actions on a list to add and update some list item parameters
             * @id processList
             * @memberOf kmj
             * @return void
             */
            processList: function(data, listToPopulate){
                var popupReverseOrder = kmj.getLocalStore("PopupReverseOrder", false, "boolean");
                var ignoreList = kmj.getLocalStore("PopupIgnoreList", [], function(value){
                    if (typeof value === "string" && value.length) {
                        value = value.split(",");
                    } else {
                        value = [];
                    }
                    for (var i = 0, l = value.length; i < l; i++) {
                        value[i] = value[i].trim();
                    }
                    return value;
                });
                var cleanedData = _.reject(data, function(item){
                    return ignoreList.indexOf(item.title) !== -1;
                });

                kmj[listToPopulate] = _.sortBy(cleanedData, function(item){
                    item.createdDate = item.createdDate || item.created_on || "0";
                    return - item.createdDate;
                });
                kmj[listToPopulate].forEach(function(item){
                    var i = 0,
                        approved = false,
                        approveCount = 0;
                    item.snoozed = kmj.isSnoozed(item.id);
                    item.reviewers = item.reviewers || [];
                    for (; i< item.reviewers.length; i++){
                        if (item.reviewers[i].approved === true){
                            approved = true;
                            approveCount = approveCount + 1;
                        }
                    }
                    item.reviewerApproved = item.reviewer_approved = approved;
                    item.approveCount = approveCount;
                });
                if ( popupReverseOrder ){
                    kmj[listToPopulate].reverse();
                }
                if (listToPopulate === "items"){
                    kmj.updateStatus();
                }
            },
            /**
             * Method, generic httprequest response handler
             * @id updateNotifications
             * @memberOf kmj
             * @param {object} data The response data
             * @return void
             */
            updateNotifications:function(){
                var allowNotifications = kmj.getLocalStore("AllowNotifications", false, "boolean");
                if (allowNotifications){
                    kmj.items.forEach(kmj.sendNotification);
                }
            },
            /**
             * Method to loop through XML items and covert to an array of JSON objects.
             * @id  populateItems
             * @memberOf kmj
             * @param {array} Items The json items array
             * @param {array} items The items array to populate
             * @param {object} ops Object containing options to extend the child items
             * @return void
             *
             */
            populateItems:function(Items, items, ops){
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
             * Method to loop through kmj.kanbanFiterDocuments and build up the kmj.popupItems wall array.
             * @id  buildItemsList
             * @memberOf kmj
             * @return void
             *
             */
            buildItemsList:function(){
                kmj.popupItems.length = 0;// clear current values and repopulate
                kmj.log("Rebuilding kanbanItemsList current list length "+ kmj.popupItems.length + ", number of docs to load "+ kmj.kanbanFiterDocuments.length);
                var kanbanFilterSorted = _.sortBy(kmj.kanbanFiterDocuments, function(item){ return item.filterIndex ;});
                for (var i = 0, filter, xmlItems, XML, kmjUrl, len = kanbanFilterSorted.length; i < len; i++ ){
                    filter = kanbanFilterSorted[i];
                    XML = filter.xml;
                    xmlItems = XML.getElementsByTagName('item');
                    kmjUrl = kmj.urlCleaner( kmj.getLocalStore("URL") + "/" + kmj.getLocalStore("TicketBaseURL") );

                    kmj.populateItems(xmlItems, kmj.popupItems, {
                        kmjFilterId:filter.id,
                        kmjColumnIndex:filter.filterIndex,
                        kmjUrl:kmjUrl
                    });
                }
                kmj.log("Rebuilt; kmj.popupItems.length "+ kmj.popupItems.length);
                kmj.busy = false;
            },
            /**
             * Method return the users jira filter list.
             * @id  getFilterList
             * @memberOf kmj
             * @return {array}
             *
             */
            getFilterList:function(){
                var hrefs = [];
                _.each(kmj.items, function(item){
                    if (item.links && item.links.self && item.links.self.href && item.links.self.href.startsWith('http')){
                        hrefs.push( item.links.self.href );
                    }
                });
                _.each(kmj.authorItems, function(item){
                    if (item.links && item.links.self && item.links.self.href && item.links.self.href.startsWith('http')){
                        hrefs.push( item.links.self.href );
                    }
                });
                return hrefs;
            },
            /**
             * Method to loop through the item ids and collect XML from server append to kmj.kanbanFiterDocuments.
             * @id  getItems
             * @memberOf kmj
             * @return void
             *
             */
            getItems:function(callback){
                var hrefs = kmj.getFilterList(),
                    deferred = can.Deferred(),
                    filterCount = 0,
                    onError = function(e){
                        kmj.updateBrowserActionStatus(-1);
                        kmj.log( "getItems:error "+ e.message );
                        kmj.connected = false;
                        kmj.busy = false;
                    },
                    onSuccess = function(){
                        kmj.log("got items", filterCount);
                        kmj.processList(kmj.items, "items");
                        if (callback) {
                            callback();
                        }
                    };

                deferred.done(onSuccess);

                //kmj.kanbanFiterDocuments.length = 0;
                for (var i = 0, len = hrefs.length; i < len; i++ ){
                    deferred.then(request(hrefs[i], i, len), onError);
                }

                function request(href, i, length){
                    var onError = function(){deferred.reject( { message: 'Could not get filter: '+ href } );};
                    can.ajax({
                        url : href,
                        type: 'GET',
                        async : true,
                        dataType: 'json',
                        error: onError,
                        success: function(data){
                            filterCount++;
                            kmj.log('ok got filter '+ href +' '+ filterCount +' of '+ length);
                            kmj.connected = true;
                            _.each(kmj.items, function(item, i){
                                if (item.links && item.links.self && item.links.self.href && item.links.self.href === href){
                                    item.reviewers = data.reviewers || [];
                                    item.participants = data.participants || [];
                                }
                            });
                            _.each(kmj.authorItems, function(item, i){
                                if (item.links && item.links.self && item.links.self.href && item.links.self.href === href){
                                    item.reviewers = data.reviewers || [];
                                    item.participants = data.participants || [];
                                }
                            });
                            if (filterCount === length){
                                deferred.resolve();
                            }
                        }
                    });
                }
            },
            sendNotification:function(ops){
                var icontype = kmj.getCleanUrl().toLowerCase().match("bitbucket") ? "bitbucket" : "stash",
                    options = {
                      title: ops.author.user.displayName,
                      iconUrl: 'lib/i/'+ icontype +'-logo-128-padding.png',
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

    kmj.init();

    window.kmj = kmj;
    window.validateURL = validateURL;
})(window.$, window._, window.can, window.chrome, window.document, window);
