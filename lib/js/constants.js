/**
 * @author patcla
 */
const DEBUG = false,
	TEST = false, // not used for Jasmine testing, used for off line development
	TEST_USE_FILTERID = false;
const DEFAULT_VALUES = {
	"timeout": 200000 // 20 seconds
	,"AllowNotifications" : "false"
	,"PopupReverseOrder": "false"
	,"DifferentiateApproved": "true"
	,"URL":"http://stash.my-domain.com/"
	,"API":"/rest/inbox/latest/pull-requests?role=reviewer&limit=20"
	,"AuthorAPI":"/rest/inbox/latest/pull-requests?role=author&amp;limit=20"
	,"AuthorTabEnabled": "true"
	,"PopupTitle":"Ready for Review"
	,"PopupTemplate":'{{#stash}}'+
'\n<details class="item item--reviewer-approved-{{ reviewerApproved }}">'+
'\n	 <summary>{{date createdDate}} {{title}}</summary>'+
'\n	 <div class="item__content">'+
'\n		<h3><a href="{{links.self.0.href}}">{{title}}</a></h3>'+
'\n		<p>Created by: {{author.user.displayName}}</p>'+
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
	,"TESTVALUE":"ABC"
};
const HELP = {
	"timeout": 'Length of time to wait before assuming the connection has failed'
	,"AllowNotifications": 'Allow popup notifications (can be very irritating)'
	,"DifferentiateApproved": 'Visually differentiate items that have been approved by anyone'
	,"URL":'Your STASH URL e.g. http://stash.my-domain.com/'
	,"API":'Relative path e.g. /rest/inbox/latest/pull-requests?role=reviewer&amp;limit=10<br/>role - must be one of [AUTHOR, REVIEWER, PARTICIPANT]<br/>limit - max number of results'
	,"PopupTitle":'Title of the filter to show in the extension popup'
	,"PopupTitleLink": 'Optional, link for the title text on the popup, from the Stash URL, e.g. /projects/MYREPOS/repos/MYPROJECT/pull-requests'
	,"PopupTemplate":'HTML template used for each ticket by the extension popup (mustache format) <a href="#" class="json-viewer">view stash item json</a>'
	,"PopupDateformat": 'Date format used by the mustache template, see <a href="https://code.google.com/p/datejs/wiki/FormatSpecifiers#CUSTOM_DATE_AND_TIME_FORMAT_SPECIFIERS">datejs wiki</a> for supported formats. Example usage {{date createdDate}}'
	,"RefreshTime":'Frequency to check server for changes (in seconds)'
	,"PopupReverseOrder":'Reverse the display order (default is newest first)'
	,"AuthorTabEnabled": 'Show pull requests you created in the popup'
}
