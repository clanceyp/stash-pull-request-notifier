(function($, chrome, ko, OPTIONS, window){
    "use strict";

    var backgroundPage = chrome.extension.getBackgroundPage();

    var timer;
    var populateJSONPreview = function(){
        if (backgroundPage.kmj.authorItems || backgroundPage.kmj.items){
            var json = (backgroundPage.kmj.authorItems || backgroundPage.kmj.items || []).shift();
            if (json && $("[name=JsonPreview]").length){
                $("[name=JsonPreview]").val( JSON.stringify(json, null, '   ') ).css("border","2px solid green");
            } else if (!$("[name=JsonPreview]").val()) {
                $("[name=JsonPreview]").val( JSON.stringify({"message": "empty try again later"}, null, '   ') ).css("border","2px solid orange");
            }
        } else {
            $("[name=JsonPreview]").val( JSON.stringify({"message": "not found"}, null, '   ') ).css("border","2px solid red");
        }
    };
    var validateURL = function(e){
        var $el = $(e.target);
        var base = $("[name=URL]").val().trim();
        var val = $el.val().trim();
        var url = (base +"/"+ val).replace(/\/+/g,"/");

        var cb = function(valid, status){
            if (valid){
              $el
                  .removeClass("invalid")
                  .addClass("valid")
                  .attr("title","")
                  .closest(".settings__form-row")
                  .find("label")
                  .attr("data-status", status)
            } else {
              $el
                  .removeClass("valid")
                  .addClass("invalid")
                  .attr("title",`Could not connect to ${url} make sure you are logged in`)
                  .closest(".settings__form-row")
                  .find("label")
                  .attr("data-status", status)
            }
            populateJSONPreview();
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