
var DEBUG = true,

	OPTIONS = {
		FORMS : { //  new elements will show in options page, but for default_values the extension needs to be reloaded
			"options" : [
                {"type":"fieldset", "label":"Settings", "id":"default", "defaultSection":"true"},
                {"type":"fieldset", "label":"Advanced Settings", "id":"advanced"},
                {"type":"fieldset", "label":"CSS/JS Insert", "id":"advancedStash"},
                {"type":"fieldset", "label":"BitBucket Cloud Help", "id":"helpSection"},
                {"name":"URL","label":"Repo. URL","type":"text"},
                {"name":"BitBucketCloudURL", "type":"help","help":"BitBucketCloudURL"},
                {"name":"API","label":"Repo. JSON url","type":"text", className:"",  parent:'advanced'},
                {"name":"AuthorAPI","label":"Author JSON url","type":"text", className:"",  parent:'advanced'},
                {"name":"BitBucketHelp","type":"help","tag":"div", parent:'advanced', "label":"", "className": "indent", "help":"BitBucketHelp"},
                {"name":"AllowNotifications","label":"Show notifications","type":"checkbox"},
                {"name":"RefreshTime","label":"Refresh time","type":"text", className:"","html5":"range",  parent:'advanced',ops:{"min":5,"max":120,"step":5,"range-type":"s"}},
                {"label":"Popup config","type":"title","tag":"h3", parent:'default'},
                {"label":"Popup config","type":"title","tag":"h3", parent:'advanced'},
                {"name":"PopupTitle","label":"Title","type":"text"},
                {"name":"PopupTitleLink","label":"Title link URL","type":"text"},
                {"name":"PopupTemplate","label":"Mustache template","type":"textarea",  parent:'advanced', className:"code"},
                {"name":"JsonPreview","label":"Example JSON","type":"textarea",  parent:'advanced', className:"code", attr:[{"data-display-only":"true","readonly":"true"}]},
                {"name":"PopupDateformat","label":"Date format","type":"text", parent: 'advanced', className: "short"},
                {"name":"PopupReverseOrder","label":"Reverse order","type":"checkbox"},
                {"name":"DifferentiateApproved","label":"Differentiate approved","type":"checkbox", parent: 'advanced'},
                {"name":"AuthorTabEnabled","label":"Show your created requests","type":"checkbox"},
                {"name":"InsertCSS","label":"Insert CSS/JS into pull request page?","type":"checkbox",  parent:'advancedStash'},
                {"name":"StashCSS","label":"Pull request CSS","type":"textarea",  parent:'advancedStash', className:"code"},
                {"name":"StashJS","label":"Pull request JS","type":"textarea",  parent:'advancedStash', className:"code"},
                {"name":"BitBucketHelp1","type":"title","tag":"p", parent:'helpSection', label:"To setup this extension to work with BickBucket Cloud, set the 'Repo. URL' on the main settings page to https://api.bitbucket.org/2.0"},
                {"name":"BitBucketHelp2","type":"title","tag":"p", parent:'helpSection', label:"In the 'Advanced settings' section, update the Repo JSON URLs adding the account and repo information where needed"},
                {"name":"BitBucketHelp3","type":"title","tag":"p", parent:'helpSection', label:"Also, in the 'Advanced settings' section, copy and paste the following Mustache template"},
                {"name":"PopupTemplateBitBucket","type":"textarea", parent:'helpSection', "label": "", "className": "code", attr:[{"data-display-only":"true"}]}
            ]
		},

		// [name of element] : [default value]
		DEFAULT_VALUES : {
            "timeout": "200000" // 20 seconds
            ,"AllowNotifications" : "false"
            ,"PopupReverseOrder": "false"
            ,"DifferentiateApproved": "true"
            ,"URL":"http://bitbucket.my-domain.com/"
            ,"API":"/rest/api/latest/inbox/pull-requests?role=reviewer&limit=20"
            ,"AuthorAPI":"/rest/api/latest/inbox/pull-requests?role=author&limit=20"
            ,"AuthorTabEnabled": "true"
            ,"PopupTitle":"Ready for Review"
            ,"PopupTemplate":'{{#stash}}'+
            '\n<details class="item item--reviewer-approved-{{ reviewerApproved }} item--reviewer-approved-count-{{approveCount}}" data-id="{{id}}">'+
            '\n	 <summary>{{date createdDate}} {{title}}</summary>'+
            '\n	 <div class="item__content">'+
            '\n		<h3><a href="{{links.self.0.href}}">{{title}}</a></h3>'+
            '\n		<p>Created by: {{author.user.displayName}}. Comments: {{attributes.commentCount}} <span class="item__snooze"></span></p>'+
            '\n 	<pre>{{description}}</pre>'+
            '\n		<div class="cell item__reviewers">'+
            '\n			<h3>Reviewers:</h3> '+
            '\n			{{#reviewers}}'+
            '\n				<i class="item__reviewers-reviewer item__reviewers-reviewer--approved-{{approved}}">{{user.displayName}}</i>'+
            '\n			{{/reviewers}}'+
            '\n		</div>'+
            '\n		<div class="cell">'+
            '\n			<h3>Participants:</h3> '+
            '\n			{{#participants}}'+
            '\n				{{user.displayName}}<br/>'+
            '\n			{{/participants}}'+
            '\n		</div>'+
            '\n  </div>'+
            '\n</details>'+
            '\n{{/stash}}'
            ,"PopupDateformat":"d MMM"
            ,"RefreshTime":60
            ,"StashCSS": "html[stash-pull-request-notifier] .previously-approved-counter {"+
            "\n	overflow-y: hidden;"+
            "\n}"+
            "\nhtml[stash-pull-request-notifier] .previously-approved-counter::before {"+
            "\n	color: #F8F8F8;"+
            "\n	content: attr(data-counter);"+
            "\n	font: bold 20cm/20cm monospace, sans-serif;"+
            "\n	position: absolute;"+
            "\n	right: -2.5cm;"+
            "\n	top: -4cm;"+
            "\n	z-index: 0;"+
            "\n}"+
            "\nhtml[stash-pull-request-notifier] .previously-approved-counter .aui-page-panel-inner {"+
            "\n	position: relative;"+
            "\n	z-index: 1;"+
            "\n}"+
            "\nhtml[stash-pull-request-notifier][data-previously-approved='true'] .aui-page-panel {"+
            "\n	background-color: #ffe;"+
            "\n}"
            ,"StashJS": '$(".branch-name").on("dblclick", function(e){prompt("Branch", $(e.target).text()) });'+
            '\n$(".aui-page-panel").addClass("previously-approved-counter");'
            ,"InsertCSS": "false"
            ,"TESTVALUE":"ABC"
            ,"jasmine-test-001-key" : "jasmine-test-001-value"
            ,"PopupTemplateBitBucket":'{{#stash}}'+
            '\n<details class="item item--reviewer-approved-{{ reviewerApproved }} item--reviewer-approved-count-{{approveCount}}" data-id="{{id}}">'+
            '\n    <summary>{{date created_date}} {{title}}</summary>'+
            '\n    <div class="item__content">'+
            '\n        <h3><a href="{{links.html.href}}">{{title}}</a></h3>'+
            '\n        <p>Created by: {{author.display_name}}. Comments: {{comment_count}} <span class="item__snooze"></span></p>'+
            '\n        <pre>{{description}}</pre>'+
            '\n        <div class="cell item__reviewers">'+
            '\n            <h3>Reviewers:</h3>'+
            '\n            {{^reviewers}}'+
            '\n            -'+
            '\n            {{/reviewers}}'+
            '\n            {{#reviewers}}'+
            '\n                <i class="item__reviewers-reviewer item__reviewers-reviewer--approved-{{approved}}">{{display_name}}</i>'+
            '\n            {{/reviewers}}'+
            '\n         </div>'+
            '\n         <div class="cell">'+
            '\n            <h3>Participants:</h3>'+
            '\n            {{^participants}}'+
            '\n            -'+
            '\n            {{/participants}}'+
            '\n            {{#participants}}'+
            '\n                <i>{{user.display_name}}</i>'+
            '\n            {{/participants}}'+
            '\n        </div>'+
            '\n    </div>'+
            '\n</details>'+
            '\n{{/stash}}'
		},

		// [name of element] : [help text]
        HELP : {
            "timeout": 'Length of time to wait before assuming the connection has failed'
            ,"AllowNotifications": 'Allow popup notifications (can be very irritating)'
            ,"DifferentiateApproved": 'Visually differentiate items that have been approved by anyone'
            ,"URL":'Your URL e.g. http://bitbucket.my-domain.com/'
            ,"API":'Relative path e.g. /rest/api/latest/inbox/pull-requests?role=reviewer&amp;limit=10<br/>role - must be one of [AUTHOR, REVIEWER, PARTICIPANT]<br/>limit - max number of results'
            ,"AuthorAPI": 'Optional, needed if \'Show your created requests\' is checked'
            ,"PopupTitle":'Title of the filter to show in the extension popup'
            ,"PopupTitleLink": 'Optional, link for the title text on the popup (e.g. /projects/[account]/repos/[project]/pull-requests or http://www.dictionary.com/wordoftheday)'
            ,"PopupTemplate":'HTML template used for each ticket by the extension popup (mustache format) <a href="#" class="json-viewer">view stash item json</a>'
            ,"PopupDateformat": 'Date format used by the mustache template, see <a href="https://code.google.com/p/datejs/wiki/FormatSpecifiers#CUSTOM_DATE_AND_TIME_FORMAT_SPECIFIERS">datejs wiki</a> for supported formats. Example usage {{date createdDate}}'
            ,"RefreshTime":'Frequency to check server for changes (in seconds)'
            ,"PopupReverseOrder":'Reverse the display order (default is newest first)'
            ,"AuthorTabEnabled": 'Show pull requests you created in the popup, see Advanced Settings to set Author API URL'
            ,"StashCSS": 'Optional CSS to inject into Stash pull request page'
            ,"StashJS": 'Optional JS to inject into Stash pull request page (DONT include code comments!)'
            ,"InsertCSS": 'Checking this box will allow the extension to add Zepto to Stash pages and reload the popup when the approve button is clicked'
            ,"BitBucketHelp": "<dl><dt>For BitBucket Server latest API use</dt><dd>/rest/api/latest/inbox/pull-requests?... your options ...</dd><dt>For legacy STASH use</dt><dd>/rest/inbox/latest/pull-requests?... your options ...</dd><dt>For BitBucket Cloud use</dt><dd>/repositories/{account}/{repo}/pullrequests?q=state=\"OPEN AND\"+... your options ...<br/>See <a href=https://developer.atlassian.com/bitbucket/api/2/reference/meta/filtering#query-pullreq target=_blank>API reference</a></dd></dl>"
            ,"BitBucketCloudURL": "For BitBucket cloud; use https://api.bitbucket.org/2.0"
        }

};
