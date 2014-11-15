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
	,"URL":"http://stash.my-domain.com/"
	,"API":"/rest/inbox/latest/pull-requests?role=reviewer&limit=10"
	,"PopupTitle":"Ready for Review"
	,"PopupTemplate":'{{#stash}}'+
'\n<details>'+
'\n	 <summary>{{title}}</summary>'+
'\n	 <div class="item">'+
'\n		<h3><a href="{{links.self.0.href}}">{{title}}</a></h3>'+
'\n		<p>Created by: {{author.user.displayName}}</p>'+
'\n 	<pre>{{description}}</pre>'+
'\n		<div class="cell">'+
'\n			<h3>Reviewers:</h3> '+
'\n			{{#reviewers}}'+
'\n				{{user.displayName}} <br/>'+
'\n			{{/reviewers}}'+
'\n		</div>'+
'\n		<div class="cell">'+
'\n			<h3>Participants:</h3> '+
'\n			{{#participants}}'+
'\n				{{user.displayName}} <br/>'+
'\n			{{/participants}}'+
'\n		</div>'+
'\n  </div>'+
'\n</details>'+
'\n{{/stash}}'
	,"PopupDateformat":"d-MMM-yyyy"
    ,"RefreshTime":60
	,"TESTVALUE":"ABC"
};
const HELP = {
	"timeout": 'Length of time to wait before assuming the connection has failed'
	,"AllowNotifications": 'Allow popup notifications (can be very irritating)'
	,"URL":'Your STASH URL e.g. http://stash.my-domain.com/'
	,"API":'Relative path e.g. /rest/inbox/latest/pull-requests?role=reviewer&amp;limit=10<br/>role - must be one of [AUTHOR, REVIEWER, PARTICIPANT]<br/>limit - max number of results'
	,"PopupTitle":'Title of the filter to show in the extension popup'
	,"PopupTemplate":'HTML template used for each ticket by the extension popup (mustache format)'
	,"PopupDateformat": 'Date format used by the mustache template, see <a href="https://code.google.com/p/datejs/wiki/FormatSpecifiers#CUSTOM_DATE_AND_TIME_FORMAT_SPECIFIERS">datejs wiki</a> for supported formats. Example usage {{date createdDate}}'
	,"RefreshTime":'Frequency to check server for changes (in seconds)'
	,"PopupReverseOrder":'Reverse the display order'
}
