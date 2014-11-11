/**
 * @author patcla
 */

(function($, chrome, ko, window){
"use strict";

var backgroundPage = chrome.extension.getBackgroundPage(),
    HELP = window.HELP,
    DEBUG = window.DEBUG,
    DEFAULT_VALUES = window.DEFAULT_VALUES,
    hideAuth = (backgroundPage.kmj.getLocalStore("allowBasicAuthentication") === "true") ? false : true,
    options = {
        ops:{
            "input":[
                {"name":"URL","label":"Stash URL","type":"text"},
                {"name":"API","label":"Stash rest","type":"text", className:"allowDblClickReset"},
                {"name":"AllowNotifications","label":"Show notifications","type":"checkbox"},
                // {"name":"keyNavigation","label":"Enable arrow key navigation","type":"checkbox", className:"allowDblClickReset"},
                {"name":"RefreshTime","label":"Refresh time","type":"text", className:"allowDblClickReset","html5":"range",  parent:'default',ops:{"min":5,"max":120,"step":5,"range-type":"s"}},
                {"name":"Test","label":"test config","type":"button","className":"displayonly",value:"validate","hidden":hideAuth},
                {"label":"Popup config","type":"title","tag":"h3", parent:'default'},
                {"name":"PopupTitle","label":"Title","type":"text"},
            //    {"name":"PopupFilterID","label":"JIRA filter ID (e.g. tickets assigned to you)","type":"text"},
            //    {"label":"Popup config","type":"title","tag":"h3", parent:'default'},
                {"name":"PopupTemplate","label":"Mustache template","type":"textarea",  parent:'default', className:"allowDblClickReset"},
                // {"label":"Kanban wall column config (filter-id, title)","type":"title","tag":"h3", className:"ColumnTitle_container relative" },
                // {"label":"Kanban wall column config","type":"title","tag":"h3" ,  parent:'advanced'},
                // {"name":"ColumnInfo","label":"","type":"hidden"},
                // {"id":"ColumnInfo_container","label":"","type":"title",tag:"div"},
                // {"name":"KanbanTemplate","label":"Mustache template","type":"textarea",  parent:'advanced', className:"allowDblClickReset"},
                // {"name":"TicketWidth","label":"Ticket width","type":"text", className:"allowDblClickReset",  parent:'advanced', "html5":"range",ops:{"min":160,"max":400,"step":10,"range-type":"px"}},
                // {"name":"TicketHeight","label":"Ticket height","type":"text", className:"allowDblClickReset",  parent:'advanced', "html5":"range",ops:{"min":80,"max":300,"step":10,"range-type":"px"}},
                // {"name":"TicketKeepInViewport","label":"Keep tickes in viewport","type":"checkbox", parent:'advanced'},
                // {"name":"TicketOffsetTop","label":"Ticket gap","type":"text", className:"allowDblClickReset",  parent:'advanced', "html5":"range",ops:{"min":1,"max":100,"step":1,"range-type":"px"}},
                // {"label":"Kanban wall display","type":"title","tag":"h3"},
                // {"label":"Kanban wall display","type":"title","tag":"h3",  parent:'advanced'},
                // {"name":"BackgroundImage","label":"Background image","type":"select", className:"allowDblClickReset bgImagePrivew",options:{"none":" - no image","carbon_fibre":"carbon fibre","corkboard":"corkboard","dark_mosaic":"dark mosaic","moulin":"moulin","padded":"padded","simple_dashed":"simple dashed","squares":"squares","dark_wood":"wood, dark","wood_1":"wood, dark grey","purty_wood":"wood, purty","retina_wood":"wood, retina"}},
                // {"label":"(Background images by subtlepatterns.com)","type":"title","tag":"p", className:'ml'},
                // {"name":"BackgroundColor","label":"Background colour","type":"text","html5":"color"},
                // {"name":"TicketDirty","label":"Dirty level","type":"text", "html5":"range",ops:{"min":0,"max":5,"step":1,"range-type":""}},
                // {"name":"TicketThumbnailBase","label":"Thumbnail location","type":"text"},
                // {"name":"TicketThumbnailBaseFallback","label":"Fallback thumbnail","type":"text"},
                // {"name":"TicketThumbnailSize","label":"Thumbnail max size","type":"text", className:"allowDblClickReset","html5":"range",ops:{"min":50,"max":200,"step":5,"range-type":"px"},  parent:'advanced'},
                // {"name":"TicketThumbnailForceSize","label":"Thumbnail fix size","type":"checkbox", parent:'advanced'},
                // {"name":"TicketThumbnailTop","label":"Thumbnail offset top","type":"text", className:"allowDblClickReset","html5":"range",ops:{"min":20,"max":100,"step":5,"range-type":"px"},  parent:'advanced'},
                // {"name":"TicketThumbnailType","label":"Thumbnail file type","type":"text"},
                // {"name":"TicketThumbnailRegExp","label":"Thumbnail RegExp","type":"text",  parent:'advanced'},
                // {"name":"TicketThumbnailURLToLowerCase","label":"Thumbnail to lower case","type":"checkbox", parent:'advanced'},
                // {"name":"TicketPriorityColourMapping","label":"Ticket priority to background colour mapping","type":"text", className:"allowDblClickReset",  parent:'advanced'}
            ]
        },
        init:function(){
            var manifest = chrome.runtime.getManifest();
            $("h1").html(manifest.name + " <span>"+ manifest.version +"</span>");
            $("#appVersion").text(manifest.version);
            $("#appName").text(manifest.name);
            options.setupForm();
            options.columnInfoViewModelInit();
            options.setupHelp();
        },
        setupHelp:function(){
            for (var item in HELP){
                if ( $('.'+ item + '_container').length === 1 && HELP[item]){
                    $('.'+ item + '_container').prepend('<span class="more"><span class="help"></span></span>');
                    $('.'+ item + '_container span.help').html( HELP[item] );
                }else if (DEBUG){
                    window.console.log( item + " not found");
                }
            }
        },
        getItemValue:function(key){
            return backgroundPage.kmj.getLocalStore(key);
        },
        saveItemValue:function(target){
            if (!target){return true;}
            var id = $(target).attr("id"),
                value = $(target).val(),
                type = $(target).attr('type');
            if (type === "checkbox"){
                backgroundPage.kmj.setLocalStore(id, $(target).prop('checked') );
            } else {
                backgroundPage.kmj.setLocalStore(id,value);
            }
        },
        handleValueChange:function(e){
            var target = e.target;
            options.saveItemValue(target);
        },
        handleRangeSlider:function(e){
            $(e.target).trigger('change');
        },
        handleKeyup:function(e){
            var target = e.target;
            options.saveItemValue(target);
        },
        handleClick:function(e){
            var target = e.target;
            if (!target){return true;}
            if ($(target).attr('type') === 'reset'){
                e.preventDefault();
                options.resetForm();
            } else if ($(target).attr('type') === 'checkbox'){
                options.saveItemValue(target);
            }
        },
        handleDblClick:function(e){
            var target = e.target,
                id = $(target).attr('id');
            if (!target){return true;}
            if (DEFAULT_VALUES[id] && window.confirm('Reset '+ id +' element to it\'s default value')){
                $(target).val( DEFAULT_VALUES[id] );
                options.saveItemValue(target);
            }
        },
        resetForm:function(){
            backgroundPage.kmj.resetLocalStore();
            $('form fieldset').empty();
            options.setupForm();
        },
        setupForm:function(){
            function getOptionsHTML(options,value,html){
                for (var name in options){
                    if (options.hasOwnProperty(name)){
                        html += '<option value="'+ name +'">'+ options[name] +'</option>';
                    }
                }
                return html;
            }
            for (var i = 0; i<options.ops.input.length; i++){
                var item = options.ops.input[i],
                    hidden = (item.hidden) ? "hidden" : "relative",
                    type = item.html5 || item.type || "text",
                    opsStr = opsToString(item.ops),
                    value = options.getItemValue(item.name) || item.value || "",
                    parent, className = hidden+' '+ item.name +'_container';
                parent = (item.parent) ? $('form fieldset.'+ item.parent) : $('form fieldset.default');
                if (item.type === "button"){
                    $(parent)
                        .append('<p class="'+ className +'"><label for="'+item.name+'">'+ item.label +'</label><input '+ opsStr +' type="'+ type +'" id="'+ item.name +'" /></p>');
                    $('#'+ item.name).val( value ).addClass( item.className || '' );
                } if (item.type === "checkbox"){
                    var checked = value === "true" || value === true ? true : false;
                    $(parent)
                        .append('<p class="option '+className+'"><span class="option"><input type="checkbox" id="'+ item.name +'" value="'+ options.getItemValue(item.name) +'" /></span><label for="'+item.name+'">'+ item.label +'</label></p>');
                    $("#"+ item.name).prop('checked', checked );
                } else if (item.type === "text" || item.type === "password"){
                    if (type === "range"){
                        var t = item.ops["range-type"] || "";
                        $(parent)
                            .append('<p class="'+ className +'"><label for="'+item.name+'">'+ item.label +' <span id="span'+item.name+'">'+value+'</span>'+t+'</label><input '+ opsStr +' type="'+ type +'" id="'+ item.name +'" /></p>');
                        $('#'+ item.name).val( value ).addClass( item.className || '' );
                        addRangeListener(item.name);
                    } else {
                        $(parent)
                            .append('<p class="'+ className +'"><label for="'+item.name+'">'+ item.label +'</label><input '+ opsStr +' type="'+ type +'" id="'+ item.name +'" /></p>');
                        $('#'+ item.name).val( value ).addClass( item.className || '' );
                    }
                } else if (item.type === "title"){
                    var tag = item.tag || "h2",
                        id = item.id || item.name || tag +'_'+ +new Date();
                    $(parent)
                        .append('<'+ tag +' id="'+ id +'">'+ item.label +'</'+tag+'>');
                    $('#'+ id ).addClass( item.className || '' );
                } else if (item.type === "select"){
                    var html = getOptionsHTML(item.options, value, '');
                    $(parent)
                        .append('<p class="'+ className +'"><label for="'+item.name+'">'+ item.label +'</label><select '+ opsStr +' type="'+ type +'" id="'+ item.name +'">'+html+'</select></p>');
                    $('#'+ item.name).val( value ).addClass( item.className || '' );// set the value
                } else if (item.type === "textarea"){
                    $(parent)
                        .append('<p class="'+ className +'"><label for="'+item.name+'">'+ item.label +'</label><textarea '+ opsStr +' id="'+ item.name +'"></textarea></p>');
                    $('#'+ item.name).val( value ).addClass( item.className || '' );
                }
            }
            function opsToString(ops){
                if (!ops){return "";}
                var str = "";
                for (var name in ops){
                    if (ops.hasOwnProperty(name)){
                        str+= name +'="'+ ops[name] +'"';
                    }
                }
                return str;
            }
            function addRangeListener(itmeName){
                $('#'+itmeName).on('change',function(){
                    $('#span'+itmeName).text( $("#"+itmeName).val() );
                });
            }
        },
        /**
         * Method, shows the correct section depending on which tab was clicked
         * @id navigate
         * @return void
         */
        navigate:function(e){
            $("section").addClass("hidden");
            $("nav li.selected").removeClass('selected');
            $(e.target.hash).removeClass("hidden");
            $(e.target).parent("li").addClass("selected");
            e.preventDefault();
        },
        columnInfoViewModelInit:function(){
            $("#ColumnInfo_container").html('<table class="data"><tbody data-bind="foreach: jiraFilters"><tr><td><input type="text" class="displayonly filterId" data-bind="value: id" /></td><td><input type="text" class="displayonly filterTitle" data-bind="value: title" /></td><td><img class="displayonly" data-bind="click: $root.removeFilter"  src="lib/i/trash.png"/></td></tr></tbody><tfoot><tr><td></td><td><img class="displayonly savecolumnconfig" title="save changes" data-bind="click: save" src="lib/i/ok.png"/></td><td><button class="displayonly" data-bind="click: addFilter, enable: jiraFilters().length < 12">Add column</button></td></tr></tfoot></table>');
            $("#ColumnInfo_container").on('keyup','input[type=text]', function(){ $("img.savecolumnconfig").addClass("inedit"); });
            ko.applyBindings(new options.ColumnInfoViewModel());
        },
        ColumnInfoViewModel:function(){
            var self = this,
                rawData = backgroundPage.kmj.getLocalStore("ColumnInfo",'[{"id":"id","title":"Title"}]'),
                data = JSON.parse(rawData),
                mappedTasks = $.map(data, function(item) { return new JiraFilter(item.id,item.title) ;});

            self.jiraFilters = ko.observableArray(mappedTasks);

            // Editable data
            self.jiraFilters();

            self.jiraFilters.subscribe(function( ) {
                //backgroundPage.kmj.setLocalStore("ColumnInfo", ko.toJSON(self.jiraFilters) );
            });

            // Operations
            self.addFilter = function() {
                self.jiraFilters.push(new JiraFilter('',''));
                $("img.savecolumnconfig").addClass("inedit");
            };
            self.save = function(){
                $("img.savecolumnconfig").removeClass("inedit");
                backgroundPage.kmj.setLocalStore("ColumnInfo", ko.toJSON(self.jiraFilters) );
            };
            self.removeFilter = function(item) {
                self.jiraFilters.remove(item) ;
            };
            self.jiraFilters.subscribe(function( ) {
                self.save();
            });


            function JiraFilter(id, title){
                this.id = ko.observable(id);
                this.title = ko.observable(title);
                this.id.subscribe(function(){self.save();});
                this.title.subscribe(function(){self.save();});
            }

        }
    };


$(document).ready(function(){
    var section = "#sectionDonate";
    if(true || backgroundPage.kmj.getLocalStore("ge98AA68e8njj9","") === "8977XX-PZ34"){
        section = "#sectionSettings";
    }
    $(document).on('dblclick', "*.allowDblClickReset", options.handleDblClick);
    $(document).on('click', "input:not(.displayonly), button:not(.displayonly)", options.handleClick);
    $(document).on('keyup', "input:not(.displayonly), textarea:not(.displayonly)", options.handleKeyup);
    $(document).on('change', "select, input:not(.displayonly)", options.handleValueChange);
    $(document).on('input', "input[type=range]", options.handleRangeSlider);
    options.init();
    $("nav a").each(function(i,el){
        if ($(this).attr("href") === section){
            $(this).parent("li").addClass("selected");
            return false;
        }
    });
    $('nav a').on('click',options.navigate);
    $('form').on('change','#ColumnCount',function(event){
        var value = $(event.target).val(),
            str = backgroundPage.kmj.getLocalStore("JiraFilterIDs") || "{}";/*,
            ids = JSON.parse(str);*/
        $("#ColumnIDs").empty();
        for (var i = 0; i < value; i++){
            $("#ColumnIDs").append('<p><input type="text" /></p>');
        }
        // $("h1").text( value );
    });
    $("#formDonate").on("submit",function(){
        backgroundPage.kmj.setLocalStore("ge98AA68e8njj9","8977XX-PZ34");
    });
    $(section).removeClass("hidden");
    function setUpBGimagePreview(){
    	var $parent = $('.bgImagePrivew').parent();
    	$parent
    		.addClass('bgImagePrivewContainer')
    		.css('background-image','url(/lib/i/bg/'+ $parent.find('select').val() +'.png)');
	    $('form').on('change','.bgImagePrivew',function(event){
	        var $el = $(event.target),
	        	value = $el.val();
	        $el.parent().css({
	        	'background-image':'url(/lib/i/bg/'+ value +'.png)'
	        })
	    });
    };
    setUpBGimagePreview();
});


})(window.$, window.chrome, window.ko, window);
