(function($, chrome, ko, OPTIONS, window){
    "use strict";

    var backgroundPage = chrome.extension.getBackgroundPage();

    var timer;
    var validateURL = function(e){
        var $el = $(e.target);
        var base = $("[name=URL]").val().trim();
        var val = $el.val().trim();
        var url = (base +"/"+ val).replace(/\/+/g,"/");

        var cb = function(valid){
            if (valid){
              $el
                  .removeClass("invalid")
                  .addClass("valid")
                  .attr("title","");
            } else {
              $el
                  .removeClass("valid")
                  .addClass("invalid")
                  .attr("title",`Could not connect to ${url} make sure you are logged in`)
            }
        };
        backgroundPage.validateURL({url:url}, cb);
    };

    $(document).on("focus", "[name=API], [name=AuthorAPI]", function(e){
        $(e.target).trigger("validateURL");
    });
    $(document).on("blur", "[name=API], [name=AuthorAPI]", function(e){
        $(e.target).trigger("validateURL");
    });
    $(document).on("keyup", "[name=API], [name=AuthorAPI]", function(e){
        $(e.target).trigger("validateURL");
    });

    $(document).on("keyup", "[name=URL]", function(e){
        clearTimeout(timer);
        timer = setTimeout(function(){
            validateURL({target: $("[name=API]")});
            validateURL({target: $("[name=AuthorAPI]")});
        },1000);
    });

    $(document).on("validateURL", "[name=API], [name=AuthorAPI]", function(e){
        clearTimeout(timer);
        timer = setTimeout(function(){
            validateURL(e);
        },1000);
    });

})(window.$, window.chrome, window.ko, window.OPTIONS, window);