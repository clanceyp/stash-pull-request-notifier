
(function($, _, chrome, document, OPTIONS, window){
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
    var DEFAULT_VALUES = OPTIONS.DEFAULT_VALUES,
        console = window.console,
        DEBUG = window.DEBUG,
        manifest = chrome.runtime.getManifest(),
        options = {
            /**
             * Method, returns a value for a given key. checks; localstore, DEFAULT_VALUES and defaultValue
             * @id getLocalStore
             * @memberOf options
             * @param {string} key The key to search for
             * @param {string} defaultValue Fallback value if required
             * @param {function} fn optional function
             * @return {string}
             */
            getLocalStore:function(key, defaultValue, fn){
                if (DEBUG){
                    console.log("getLocalStore: ", key)
                }
                var value = localStorage[key] || DEFAULT_VALUES[key] || defaultValue || null;

                if (value && key.toLowerCase().indexOf("password") === 0){
                    value = window.atob(value);
                }
                if (typeof fn === "function"){
                    value = fn(value);
                } else if (fn === "number"){
                    value = +value;
                } else if (fn === "boolean"){
                    if (typeof value === "string") { // presuming checkbox element
                        var v = value.toLowerCase();
                        value = (v === "true" || v === "on" || v === "1") ? true : false;
                    } else if (!isNaN(value)){
                        value = value > 0;
                    } else {
                        value = !!value;
                    }
                }
                return value;
            },
            /**
             * Method, sets the value for a given key value pair in the localStore
             * @id setLocalStore
             * @memberOf options
             * @param {string} key The key to set
             * @param {string} value The value to set
             * @return void
             */
            setLocalStore:function(key,value){
                if (key.toLowerCase().indexOf("password") === 0){
                    value = window.btoa(value);
                }
                localStorage[key] = value;
            },
            /**
             * Method, resets the localStore, to default value, and re-runs the options.init method
             * @id resetLocalStore
             * @memberOf options
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
            }
        };

    window.options = options;
})(window.$, window._, window.chrome, window.document, window.OPTIONS, window);
