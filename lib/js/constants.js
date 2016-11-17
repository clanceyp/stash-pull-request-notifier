/**
 * @author patcla
 */
var DEBUG = false,
	TEST = false, // not used for Jasmine testing, used for off line development
	TEST_USE_FILTERID = false;
var DEFAULT_VALUES = {
	"timeout": 200000 // 20 seconds
	,"AllowNotifications" : "false"
	,"PopupReverseOrder": "false"
	,"DifferentiateApproved": "true"
	,"URL":"http://bitbucket.my-domain.com/"
	,"API":"/rest/api/latest/inbox/pull-requests?role=reviewer&limit=20"
	,"AuthorAPI":"/rest/api/latest/inbox/pull-requests?role=author&limit=20"
	,"AuthorTabEnabled": "true"
	,"PopupTitle":"Ready for Review"
	,"PopupTemplate":'{{#stash}}'+
'\n<details class="item item--reviewer-approved-{{ reviewerApproved }}" data-id="{{id}}">'+
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
	,"StashCSS": "/* to style previously approved PRs use html[data-previously-approved='true']{...} */"+
"\nhtml[stash-pull-request-notifier] .previously-approved-counter {"+
"\n		margin-left: 6px;"+
"\n}"+
"\nhtml[stash-pull-request-notifier] .previously-approved-counter::before {"+
"\n		content: attr(data-counter);"+
"\n}"+
"\nhtml[stash-pull-request-notifier][data-previously-approved='true'] .aui-page-panel {"+
"\n		background-color: #ffe;"+
"\n}"
	,"StashJS": "console.log( 'Hello from Atlassian pull request extension, typeof zepto = ', typeof($) );"
	,"InsertCSS": "false"
	,"TESTVALUE":"ABC"
};
var HELP = {
	"timeout": 'Length of time to wait before assuming the connection has failed'
	,"AllowNotifications": 'Allow popup notifications (can be very irritating)'
	,"DifferentiateApproved": 'Visually differentiate items that have been approved by anyone'
	,"URL":'Your URL e.g. http://bitbucket.my-domain.com/'
	,"API":'Relative path e.g. /rest/api/latest/inbox/pull-requests?role=reviewer&amp;limit=10<br/>role - must be one of [AUTHOR, REVIEWER, PARTICIPANT]<br/>limit - max number of results'
	,"AuthorAPI": 'Optional, needed if \'Show your created requests\' is checked'
	,"PopupTitle":'Title of the filter to show in the extension popup'
	,"PopupTitleLink": 'Optional, link for the title text on the popup (relative from the repo URL, e.g. /projects/MYREPOS/repos/MYPROJECT/pull-requests)'
	,"PopupTemplate":'HTML template used for each ticket by the extension popup (mustache format) <a href="#" class="json-viewer">view stash item json</a>'
	,"PopupDateformat": 'Date format used by the mustache template, see <a href="https://code.google.com/p/datejs/wiki/FormatSpecifiers#CUSTOM_DATE_AND_TIME_FORMAT_SPECIFIERS">datejs wiki</a> for supported formats. Example usage {{date createdDate}}'
	,"RefreshTime":'Frequency to check server for changes (in seconds)'
	,"PopupReverseOrder":'Reverse the display order (default is newest first)'
	,"AuthorTabEnabled": 'Show pull requests you created in the popup, see Advanced Settings to set Author API URL'
	,"StashCSS": 'Optional CSS to inject into Stash pull request page'
	,"StashJS": 'Optional JS to inject into Stash pull request page (DONT include code comments!)'
	,"InsertCSS": 'Checking this box will allow the extension to add Zepto to Stash pages and reload the popup when the approve button is clicked'
	,"BitBucketHelp": "<dl><dt>For BitBucket latest api use</dt><dd>/rest/api/latest/inbox/pull-requests</dd><dt>For legacy stash use</dt><dd>/rest/inbox/latest/pull-requests</dd></dl>followed by ?"
}
