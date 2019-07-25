(function($, chrome, ko, OPTIONS, window){
    "use strict";

    var backgroundPage = chrome.extension.getBackgroundPage();

    var timer;
    var previewTimer;

    var populateJSONPreview = function(data){
        clearTimeout(previewTimer);
        var $jsonPreview = $("[name=JsonPreview]");
        var items = (backgroundPage.kmj.authorItems || []).concat(backgroundPage.kmj.items || []);
        var firstItem = items.shift();
        $jsonPreview.attr("data-status","");

        if (firstItem) {
            $jsonPreview
                .val( JSON.stringify(firstItem, null, '   ') )
                .attr("data-status","valid");
        } else if (data) {
            try {
                $jsonPreview.val( JSON.stringify(data, null, '   ') );
            } catch (e) {
                $jsonPreview
                    .val( JSON.stringify({"message": "not found"}, null, '   ') )
                    .attr("data-status","invalid");
            }
        }
        previewTimer = setTimeout(populateJSONPreview, 5000);
    };
    var validateURL = function(e){
        var $el = $(e.target);
        var base = $("[name=URL]").val().trim();
        var val = $el.val().trim();
        var url = (base +"/"+ val).replace(/\/+/g,"/");

        var cb = function(valid, data){
            if (valid){
              $el
                  .removeClass("invalid")
                  .addClass("valid")
                  .attr("title","")
                  .closest(".settings__form-row")
                  .find("label")
                  .attr("data-status", "200");
                populateJSONPreview();
            } else {
              $el
                  .removeClass("valid")
                  .addClass("invalid")
                  .attr("title",`Could not connect to ${url} make sure you are logged in`)
                  .closest(".settings__form-row")
                  .find("label")
                  .attr("data-status", data);
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

    $(document).ready(populateJSONPreview);


})(window.$, window.chrome);