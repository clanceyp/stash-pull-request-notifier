/**
 * @author patcla
 */

(function($, chrome, ko, OPTIONS, window){
"use strict";

var backgroundPage = chrome.extension.getBackgroundPage(),
    HELP = OPTIONS.HELP,
    DEBUG = window.DEBUG,
    DEFAULT_VALUES = OPTIONS.DEFAULT_VALUES,
    FORMS = OPTIONS.FORMS,
    optionsForm = {
        options:FORMS["options"],
        utils:{
            getOptionsHTML:function(options,html){
                var html = "", i = 0, option;
                for (; i<options.length;i++) {
                    option = options[i];
                    for (var name in option) {
                        if (option.hasOwnProperty(name)) {
                            html += '<option value="' + name + '">' + option[name] + '</option>';
                        }
                    }
                }
                return html;
            },
            getRadioHTML:function(options, elementname){
                var id, key, html = "", i = 0, option;
                for (; i<options.length;i++) {
                    option = options[i];
                    for (key in option) {
                        if (option.hasOwnProperty(key)) {
                            id = elementname + "__" + key;
                            html += '<label class="settings__form-label settings__form-label--radio" for="' + id + '"><input class="settings__form-item settings__form-item--radio" id="' + id + '" type="radio" name="' + elementname + '" value="' + key + '">' + option[key] + '</label>';
                        }
                    }
                }
                return html;
            },
            getDatalistHTML: function(options, id){
                var html = '<datalist id="'+id+'">', i = 0, option;
                for (; i<options.length;i++) {
                    option = options[i];
                    for (var name in option) {
                        if (option.hasOwnProperty(name)) {
                            html += '<option value="' + name + '" />';
                        }
                    }
                }
                html += "</datalist>";
                return html;
            }
        },
        init:function(context){
            var manifest = chrome.runtime.getManifest(),
                icon = ("/" + (manifest.icons ? (manifest.icons["128"] ||  manifest.icons["48"] || "") : "")).replace("//","/"),
                i = new Image,
                loadIcon = function(){
                    $(".body").css("background-image", "url("+ this.src +")");
                };

            $(".header__heading").html('<span class="appName"></span> <span class="appVersion header__heading-version"></span>');
            $(".appVersion").text(manifest.version);
            $(".appName").text(manifest.name);
            i.addEventListener("load", loadIcon, false);
            i.src = icon;
            optionsForm.setupForm();
            optionsForm.setupHelp();
            optionsForm.setupNavigation();
            if (context && !context.optionsForm){
                context.optionsForm = optionsForm;
            }
        },
        setupHelp:function(){
            for (var item in HELP){
                if ( $('.'+ item + '__container').length === 1 && HELP[item]){
                    var el = _.findWhere(optionsForm.options, {name: item}),
                        label = el ? (el.label || "") : "";
                    $('.'+ item + '__container').append('<button class="help"><span class="help__content"></span></button>');
                    $('.'+ item + '__container .help__content').attr("data-label", label).html( HELP[item] );
                } else if (DEBUG){
                    window.console.log("Help: "+ item + " not found");
                }
            }
        },
        setupNavigation:function(){
            var defaultSectionId = ( _.findWhere(optionsForm.options, {defaultSection: "true"}) ).id;
            $(".settings__section").addClass("hidden");
            $("#"+defaultSectionId).removeClass("hidden");
            $(".settings__navigation-item--"+ defaultSectionId).addClass("selected");
        },
        getItemValue:function(key){
            return backgroundPage.options.getLocalStore(key);
        },
        saveItemValue:function(target){
            if (!target){return true;}
            if (DEBUG) {
                console.log("saveItemValue", target);
            }
            var id = $(target).attr("id"),
                name =  $(target).attr("name"),
                value = $(target).val(),
                type = $(target).attr('type');
                if (DEBUG)
                    console.log("id", id, "name", name, "value", value, "type", type);
            if (type === "checkbox"){
                backgroundPage.options.setLocalStore(name, $(target).attr('checked') );
            } else {
                backgroundPage.options.setLocalStore(name, value);
            }
        },
        handleValueChange:function(e){
            var target = e.target;
            optionsForm.saveItemValue(target);
        },
        handleRangeSlider:function(e){
            $(e.target).trigger('change');
        },
        handleKeyup:function(e){
            var target = e.target;
            optionsForm.saveItemValue(target);
        },
        handleClick:function(e){
            var target = e.target;
            if (!target){return true;}
            if ($(target).attr('type') === 'reset'){
                e.preventDefault();
                if(confirm("Do you really want to loose all your current settings by resetting to default values?")) {
                    optionsForm.resetForm();
                }
            } else if ($(target).attr('type') === 'checkbox'){
                optionsForm.saveItemValue(target);
            } else if ($(target).attr('type') === 'radio'){
                optionsForm.saveItemValue(target);
            }
        },
        handleDblClick:function(e){
            var target = e.target,
                id = $(target).attr('id');
            if (!target){return true;}
            if (DEFAULT_VALUES[id] && window.confirm('Reset '+ id +' element to it\'s default value')){
                $(target).val( DEFAULT_VALUES[id] );
                optionsForm.saveItemValue(target);
            }
        },
        handleRangeChange:function(e){
            var $target = $(e.target),
                value = $target.val();
            $target
                .closest(".settings__form-row")
                .find(".settings__form-label")
                .data("value", value)
                .data("suffix", $target.data("suffix"))
        },
        resetForm:function(){
            backgroundPage.options.resetLocalStore();
            $('form fieldset').empty();
            optionsForm.setupForm(true);
        },
        createRow: {
            basic: function(element){
                var value = optionsForm.getItemValue(element.name) || element.value,
                    type = element.html5 || element.type,
                    $row = $("<p />").appendTo(element.parent),
                    labelHTML = element.label ? '<label for="'+ element.id +'" class="settings__form-label settings__form-label--'+type+'">'+ element.label +'</label>' : "";
                $row
                    .addClass(element.name +'__container settings__form-row settings__form-row--'+ type)
                    .append(labelHTML);

                if (element.type === "textarea"){
                    $row.append('<textarea name="'+ element.name +'" id="'+ element.id +'" class="settings__form-item settings__form-item--'+type+'"></textarea>');
                } else {
                    $row.append('<input name="'+ element.name +'" type="'+ type +'" id="'+ element.id +'" class="settings__form-item settings__form-item--'+type+'" />');
                }
                $.each(element.attr, function(i, option){
                    for (var key in option){
                        if (option.hasOwnProperty(key)) {
                            if (DEBUG)
                                console.log(key, option[key]);
                            $('#' + element.id).attr(key, option[key]);
                        }
                    }
                });
                $.each(element.data, function(i, option){
                    for (var key in option){
                        if (option.hasOwnProperty(key)) {
                            if (DEBUG)
                                console.log(key, option[key]);
                            $('#' + element.id).data(key, option[key]);
                        }
                    }
                });
                if (DEBUG) {
                    console.log("DEBUG: ", element.id, element.name, value, element.type, element.html5);
                }
                if (value !== null){
                    try {
                        $('#'+ element.id ).val( value );
                    } catch(e){
                        // some form element types, can't be set programmatically
                    };
                }
                if (element.className){
                    $('#'+ element.id ).addClass( element.className || '' );
                }
                if (element.type==="checkbox") {
                    $("#"+ element.id ).attr('checked', (value === "true") );
                }
                if (element.html5==="range"){
                    $("#"+ element.id ).trigger("change");
                }
                if (element.html5==="datalist"){
                    $('#'+ element.id )
                        .attr( "list", "datalist-"+ element.id )
                        .after( optionsForm.utils.getDatalistHTML(element.options, "datalist-"+ element.id) );
                }
            },
            keyValue: function(element){
                var data = element.data,
                    id = element.id;
                data.cols = _.find(data, function(d){ return !!d["cols"]})["cols"];// legacy hack
                if (id.match(/\s/)){
                    alert("Sorry, "+ element.name +" must have an id which just contains word characters only");
                } else if (document.querySelectorAll("#"+ id).length > 1){
                    alert("Sorry, "+ element.name +" must have a unique id");
                } else if (!data || !data.cols || data.cols.length !==2 || !data.cols[0].title || !data.cols[1].title  ){
                    alert("Sorry, please specify a title for each column, in element "+ id);
                } else {
                    // everything seems to be OK
                    // optionsForm.columnInfoViewModelInit(element);
                    var tag = element.tag || "div",
                        caption = element.label ? '<thead><caption class="settings__form-label">'+ element.label +'</caption></thead>' : '';

                    $(element.parent)
                        .append('<'+ tag +' id="'+ id +'"></'+ tag +'>');
                    $('#'+ id )
                        .addClass( element.className || '' )
                        .addClass( element.name + "__container settings__form-row settings__form-row--key-value")
                        .data("type", "key-value");

                    $("#"+ id).append('<table id="table-'+id+'" class="data">' + caption + '<tr><th>'+ data.cols[0].title +'</th><th>'+ data.cols[1].title +'</th></tr><tbody data-bind="foreach: pairs"><tr><td><input type="text" class="displayonly filterId" data-bind="value: key" /></td><td><input type="text" class="displayonly filterTitle" data-bind="value: value" /></td><td><img class="displayonly" data-bind="click: $root.removePair"  src="/lib/options/i/trash.png"/></td></tr></tbody><tfoot><tr><td></td><td></td><td><button class="displayonly" data-bind="click: addPair">Add pair</button></td></tr></tfoot></table>');
                    if (document.querySelectorAll("#table-"+id).length === 1 ){
                        ko.applyBindings(new optionsForm.ColumnInfoViewModel(element), document.querySelector("#table-"+id));
                    }
                }
            },
            select: function(element){
                var value = optionsForm.getItemValue(element.name) || element.value,
                    $row = $("<p />").appendTo(element.parent),
                    type = element.type,
                    id = element.id,
                    name = element.name;
                $row
                    .addClass('settings__form-row settings__form-row--'+ type);

                if (element.type === "select"){
                    $row
                        .append('<label for="'+ element.id +'" class="settings__form-label settings__form-label--'+type+'">'+ element.label +'</label>')
                        .append('<select id="'+ id +'" name="'+ name +'">'+ optionsForm.utils.getOptionsHTML(element.options) +'</select>');
                    if (value){
                        $('#'+ element.id ).val( value );
                    }
                } else {
                    $row
                        .append('<strong class="settings__form-label settings__form-label--radio">'+ element.label +'</strong>')
                        .append( optionsForm.utils.getRadioHTML(element.options, element.name) );
                    if (value){
                        $("[name='"+ element.name +"'][value='"+ value  +"']").prop("checked", true );
                    }
                }
            },
            title: function(element){
                var tag = element.tag || "h2";
                $(element.parent)
                    .append('<'+ tag +' id="'+ element.id +'">'+ element.label +'</'+tag+'>');
                if (element.className){
                    $('#'+ element.id ).addClass( element.className );
                }
            },
            help: function(element){
                var tag = element.tag || "div";
                $(element.parent)
                    .append('<'+ tag +' id="'+ element.id +'" class="inline-help">'+ (HELP[element.help] || "attribute 'help', item not present or not found in help" ) +'</'+tag+'>');
                if (element.className){
                    $('#'+ element.id ).addClass( element.className );
                }
            }
        },
        setupForm:function(isReset){
            var i = 0;
            for (; i<optionsForm.options.length; i++){

                var item = optionsForm.options[i],
                    element = {},
                    hidden = (item.hidden) ? "hidden" : "relative",
                    type = item.html5 || item.type || "text",
                    id = item.id || item.name +"-"+ +new Date,
                    value = optionsForm.getItemValue(item.name) || item.value || "",
                    defaultSectionClass ;
                if ( !(type === "fieldset" || type === "title" ) && !item.name){
                    alert('Your form elements must have a name attribute');
                    continue;
                }
                element = {
                    id: id,
                    attr: [],
                    data: [],
                    value: "",
                    position: hidden,
                    type: type
                };
                $.extend(element, item);

                element.parent = (element.parent) ? $('form fieldset.'+ element.parent) : $('form fieldset.settings__section--default');

                if (element.type === "button" || element.type === "checkbox" || element.type === "text" || element.type === "password" || element.type === "textarea"){
                    optionsForm.createRow.basic(element)
                } else if (element.type === "select" || element.type === "radio"){
                    optionsForm.createRow.select(element);
                } else if (element.type === "title"){
                    optionsForm.createRow.title(element);
                } else if (element.type === "help"){
                    optionsForm.createRow.help(element);
                } else if (element.type === "key-value"){
                    optionsForm.createRow.keyValue(element);
                } else if (element.type === "fieldset"){
                    if (!document.querySelector("#"+ id)){
                        defaultSectionClass = element.defaultSection === "true" ? "settings__section--default" : "";
                        $(".settings__form").append('<fieldset class="settings__section '+ defaultSectionClass +' '+ id +'" id="'+ id +'"><h2 class="section__heading">'+ element.label +'</h2></fildset>');
                        $(".settings__navigation-list").append('<li class="settings__navigation-item settings__navigation-item--'+ id +'"><a class="settings__navigation-link" href="#'+ id +'">'+ element.label +'</a></li>');
                        $('#'+ id ).addClass( element.className || '' );
                    } else {
                        if (!isReset){
                           alert("Sorry, duplicate id found "+ id +" please check your options manifest file");
                        }
                    }
                } else {
                    console.log("Sorry, no type attribute match for ", element.name);
                }
            }
        },
        /**
         * Method, shows the correct section depending on which tab was clicked
         * @id navigate
         * @return void
         */
        navigate:function(e){
            $(".settings__section").addClass("hidden");
            $(".settings__navigation li.selected").removeClass('selected');
            $(e.target.hash).removeClass("hidden");
            $(e.target).parent("li").addClass("selected");
            e.preventDefault();
        },
        ColumnInfoViewModel:function(element){
            var _this = this,
                id = element.id,
                defaultKeyValue = element.data.cols[0].defaultValue || "",
                defaultValue = element.data.cols[1].defaultValue || "",
                initKeyValue = element.data.cols[0].initValue || defaultKeyValue,
                initValue = element.data.cols[1].initValue || defaultValue,
                rawData = backgroundPage.options.getLocalStore( id ,'[{"key":"'+ initKeyValue +'","value":"'+ initValue +'"}]'),
                data = JSON.parse(rawData),
                mapped = $.map(data, function(item) { return new Pair(item.key,item.value) ;});

            _this.pairs = ko.observableArray(mapped);

            // Editable data
            _this.pairs();

            // Operations
            _this.addPair = function() {
                _this.pairs.push(new Pair( defaultKeyValue , defaultValue));
                $("#"+id+" .savecolumnconfig").addClass("inedit");
            };
            _this.save = function(){
                $("#"+id+" .savecolumnconfig").removeClass("inedit");
                var emptiesRemoved = _.reject(ko.toJS(_this.pairs), function(item){return !item.key && !item.value});
                backgroundPage.options.setLocalStore(id, ko.toJSON(emptiesRemoved) );
            };
            _this.removePair = function(item) {
                _this.pairs.remove(item) ;
            };
            _this.pairs.subscribe(function( ) {
                _this.save();
            });


            function Pair(key, value){
                this.key = ko.observable(key);
                this.value = ko.observable(value);
                this.key.subscribe(function(){_this.save();});
                this.value.subscribe(function(){_this.save();});
            }

        }
    };

    window.optionsForm = optionsForm;

$(document).ready(function(){
    $(document).on('dblclick', "*.allowDblClickReset", optionsForm.handleDblClick);
    $(document).on('click', "input:not([data-display-only]), button:not([data-display-only])", optionsForm.handleClick);
    $(document).on('keyup', "input:not([data-display-only]), textarea:not([data-display-only])", optionsForm.handleKeyup);
    $(document).on('change', "select, input:not([data-display-only])", optionsForm.handleValueChange);
    $(document).on('input', ".settings__form-item--range", optionsForm.handleRangeSlider);
    $(document).on('click', ".settings__navigation-link", optionsForm.navigate);
    $(document).on('change', ".settings__form-item--range", optionsForm.handleRangeChange);
    $(document).on('click', "[data-custom-event]", function(){alert("Hello, I'm a custom event")});
    $(document).on('click', "button.help",function(e){e.preventDefault()});
    optionsForm.init(window);
});


})(window.$, window.chrome, window.ko, window.OPTIONS, window);
