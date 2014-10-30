
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
    /*
    $(document).on('ajaxBeforeSend', function(e, xhr, options){
        // CURRENTLY THIS EXTENSION DOESN'T USE BASIC AUTH,
        // TO USE, ENABLE IT ON THE USER SETTING PAGE
        // This gets fired for every Ajax request performed on the page.
        // The xhr object and $.ajax() options are available for editing.
        // Return false to cancel this request.

        var auth = null,
            useAuth = kmj.getLocalStore("UseAuth");

        if (useAuth === "true"){
            auth = window.btoa((kmj.getLocalStore("username") || '') + ':' + (kmj.getLocalStore("password") || ''));
            xhr.setRequestHeader('Authorization', 'Basic ' + auth);
        }

    });*/
    /* TODO; re-factor legacy code and clean-up */
    var DEFAULT_VALUES = window.DEFAULT_VALUES,
        console = window.console,
        kmj = {
            busy:false,
            items:[],
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
            /*getOptions:function(){
             if (!kmj.getLocalStore('loaded')){
             kmj.resetLocalStore();
             kmj.setLocalStore("loaded",true);
             }
             var ops = {};
             for (var key in DEFAULT_VALUES){
             ops[key] = kmj.getLocalStore(key);
             }
             return ops;
             },*/
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
                chrome.tabs.onActivated.addListener(kmj.keyNavigationSupported);
                chrome.tabs.onUpdated.addListener(kmj.keyNavigationSupported);
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
            getCleanUrl:function( filterId ){
                if (window.TEST === true || ('jasmineUseLocalXML' in window && window.jasmineUseLocalXML === true)){
                    var id = (window.TEST_USE_FILTERID) ? '.'+ filterId : '';
                    return 'lib/test/jira-filter'+id+'.xml';
                }
                var url = kmj.getLocalStore("JiraURL") + "/" + kmj.getLocalStore("JiraAPI") + filterId +"/";
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
                var color = [255, 0, 0, 255];
                status = (!kmj.connected || status < 0 || status === null || status === undefined) ? '?' : status ;
                if (status === "?"){
                    color = [180, 180, 180, 255] ;
                } else if (status === 0 ) {
                    color = [0, 180, 0, 255] ;
                    status = "\u2713";
                }
                status = status.toString();
                window.chrome.browserAction.setBadgeBackgroundColor( { color: color } );
                window.chrome.browserAction.setBadgeText( { text: status });
                return status ;
            },
            /**
             * Method, gets the main filter for the popup display from the users JIRA instance
             * @id getPopupItems
             * @memberOf kmj
             * @return void
             */
            getPopupItems:function(testUrl){
                var url = testUrl || kmj.getCleanUrl( kmj.getLocalStore("PopupFilterID") );
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
                kmj.log("Something bad happened, maybe couldn't connect to JIRA?");
                kmj.items = [];
                kmj.httpRequest = null;
                kmj.connected = false;
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
                var json = data, // kmj.strToXml(responseText)
                    items;
                kmj.connected = true;
                if ( json.size === 0 ) {
                    kmj.updateBrowserActionStatus( 0 );
                    return;
                }
                console.log( json )
                kmj.items = json.values;
                kmj.updateBrowserActionStatus( json.size );
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
                    kmjUrl = kmj.urlCleaner( kmj.getLocalStore("JiraURL") + "/" + kmj.getLocalStore("TicketBaseURL") );

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
                    filters[i].url = kmj.urlCleaner( kmj.getLocalStore("JiraURL") + "/" + kmj.getLocalStore("JiraFilterURL") + filters[i].id );
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
            /**
             * Method coverts string into XML
             * @id  strToXml
             * @memberOf kmj
             * @depricated
             * @return {object}
             *
             */
            strToXml:function(str){
                var DOMParser = kmj.DOMParser || new window.DOMParser();
                if (!kmj.DOMParser){
                    kmj.DOMParser = DOMParser;
                }
                return DOMParser.parseFromString(str, "text/xml");
            },
            /**
             * Method coverts XML to JSQN
             * @id  xmlToJson
             * @see kmj.xmltojson.js
             *
             */
            xmlToJson:null,
            /**
             * Method adds navigation script to page when needed
             * @id  strToXml
             * @memberOf kmj
             * @param {object} tab chrome tab identifier
             * @return void
             *
             */
            keyNavigationSupported:function(tab) {
                var tabId = typeof(tab) === 'number' ? tab : tab.tabId;
                chrome.tabs.get(tabId, function(tab){
                    try{
                        var url = tab.url.split("//"),
                            JiraURL = kmj.getLocalStore("JiraURL").split("//"),
                            keyNavigation = kmj.getLocalStore("keyNavigation",null,function(v){return v === "true"}),
                            isSupported = url[1].indexOf( JiraURL[1] ) === 0 && keyNavigation;

                        if (isSupported){
                            chrome.tabs.executeScript(tabId, {file: "lib/js/content_script.js"});
                        }
                    } catch (e){};
                });
            }
        };

    //setTimeout(function(){ kmj.init(); },1000);
    kmj.init();

    window.kmj = kmj;
})(window.$, window._, window.can, window.chrome, window.document, window);
