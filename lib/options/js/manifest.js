
var DEBUG = true,
    OPTIONS = {
        FORMS : {
            "options" : [
                {"type":"fieldset", "label":"Settings", "id":"basicSettings", "defaultSection":"true"},
                {"type":"fieldset", "label":"Advanced Settings", "id":"advancedSettings"},
                {"name":"test-text", "label":"Text", "type":"text", parent:'basicSettings'},
                {"name":"test-text-one", "label":"Another text", "type":"text", attr:[{placeholder: "Placeholder text"}], parent:'basicSettings'},
                {"name":"test-textarea", "label":"Textarea", "type":"textarea", parent:'basicSettings'},
                {"name":"test-checkbox", "label":"Boolean", "type":"checkbox", "value": "true", parent:'basicSettings'},
                {"type":"title", "label":"Heading text", parent: "basicSettings"},
                {"type":"title", "label":"Heading sub text", parent: "basicSettings", tag: "h3"},
                {"type":"title", "label":"Text text text...", parent: "basicSettings", tag: "p"},
                {"name":"test-radio", "label":"Options", "type":"radio", parent:'basicSettings' ,options:[{"female":"Female"},{"male":"Male"}]},
                {"name":"test-select", "label":"Select", "type":"select", "value":"none",parent:'basicSettings' ,options:[{"none":"none"},{"carbon_fibre":"carbon fibre"},{"corkboard":"corkboard"},{"dark_mosaic":"dark mosaic"},{"moulin":"moulin"},{"padded":"padded"},{"simple_dashed":"simple dashed"},{"squares":"squares"},{"dark_wood":"wood, dark"},{"wood_1":"wood, dark grey"},{"purty_wood":"wood, purty"},{"retina_wood":"wood, retina"}]},
                {"name":"test-range", "label":"Range", "type":"text", "html5":"range",  parent:'advancedSettings', attr:[{"min":0},{"max":60},{"step":5}],data:[{"suffix":" mins"}]},
                {"name":"test-email", "label":"Email", "type":"text", "html5":"email", parent:'advancedSettings', className : "inverse", attr: [{"title" : "Custom className added to this element"}] },
                {"name":"test-datalist", "label":"Datalist", "type":"text", "html5":"datalist", parent:'advancedSettings' ,options:[{"carbon_fibre":"carbon fibre"},{"corkboard":"corkboard"},{"dark_mosaic":"dark mosaic"},{"moulin":"moulin"},{"padded":"padded"},{"simple_dashed":"simple dashed"},{"squares":"squares"},{"wood":"wood, dark"},{"wood_gray":"wood, dark grey"},{"wood_purty":"wood, purty"},{"wood_retina":"wood, retina"}]},
                {"name":"test-color", "label":"Colour", "type":"text", "html5":"color", parent:'advancedSettings'},
                {"name":"test-date", "label":"Date", "type":"text", "html5":"date", parent:'advancedSettings'},
                {"name":"test-file", "label":"File", "type":"text", "html5":"file", parent:'advancedSettings'},
                {"name":"test-number", "label":"Number", "type":"text", "html5":"number",  parent:'advancedSettings', attr:[{"min":0},{"max":24},{"step":1}],data:[{"suffix":" hours"}]},
                {"name":"test-key-value-pair", "id":"test-key-value-pair", "label":"Key value pair", "type" : "key-value", tag:"div", parent:'advancedSettings', data : [{cols:[{"title":"label",initValue:"JIRA"},{"title":"value",initValue:"114421"}]}]},
                {"name":"test-button", "value":"Click me", "type":"button", parent:'advancedSettings', data:[{"display-only":""},{"custom-event":""}]}
            ]
        },

        // [name of element] : [default value]
        DEFAULT_VALUES : {
            "jasmine-test-001-key" : "jasmine-test-001-value",
            "test-text": "Hello",
            "test-email": "defalut@gmail.com",
            "test-range": "30",
            "test-number": "0"
        },

        // [name of element] : [help text]
        HELP : {
            "test-text": 'Default value set in manifest.js',
            "test-range": 'Default value set in manifest.js',
            "test-number": 'Default value set in manifest.js'
        }

    };
