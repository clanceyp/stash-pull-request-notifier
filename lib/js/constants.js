/**
 * @author patcla
 */
const DEBUG = false,
	TEST = false, // not used for Jasmine testing, used for off line development
	TEST_USE_FILTERID = false;
const DEFAULT_VALUES = {
	"timeout": 200000 // 20 seconds
	,"JiraURL":"http:// my Stash url /"
	,"JiraAPI":"/rest/inbox/latest/pull-requests?role=reviewer&start=0&limit=10&avatarSize=64&state=OPEN&order=oldest"
	,"JiraFilterURL":"/secure/IssueNavigator.jspa?requestId="
	,"PopupTitle":"Ready for Review"
	,"PopupTemplate":'{{#jira}}'+
'\n<details>'+
'\n	 <summary>{{title}}</summary>'+
'\n	 <div class="item">'+
'\n		<a href="{{links.self.0.href}}">{{{description}}}</a>'+
'\n		<p>Created by: {{author.user.displayName}} </p>'+
'\n		<div class="right" style="display:inline-block;float:none;">'+
'\n			<h3>Reviewers:</h3> '+
'\n			{{#reviewers}}'+
'\n				{{user.displayName}} <br/>'+
'\n			{{/reviewers}}'+
'\n		</div>'+
'\n		<div class="left" style="float:left;width:50%;">'+
'\n			<h3>Participants:</h3> '+
'\n			{{#participants}}'+
'\n				{{user.displayName}} <br/>'+
'\n			{{/participants}}'+
'\n		</div>'+
'\n  </div>'+
'\n</details>'+
'\n{{/jira}}'
	,"KanbanTemplate":'{{#jira}}' +
'\n<div data-key="{{key}}" data-filter-id="{{kmjFilterId}}" data-column-index="{{kmjColumnIndex}}" data-priority="{{priority@id}}">'+
'\n  <div class="left">{{summary}}</div>'+
'\n    <div class="right">'+
'\n      <h3><a href="{{kmjUrl}}{{key}}">{{key}}</a></h3>'+
'\n      <img data-assignee="{{assignee@username}}" />'+
'\n    </div>'+
'\n  </div>' +
'\n</div>' +
'\n{{/jira}}'
    ,"RefreshTime":300
	,"TESTVALUE":"ABC"
};
const HELP = {
	"timeout": 'Length of time to wait before assuming the connection has failed'
	,"JiraURL":'Your JIRA URL e.g. http://my.domain.com/jira/'
	,"JiraAPI":'Relative path to filter XML e.g. /sr/jira.issueviews:searchrequest-xml/'
	,"JiraFilterURL":'Relative path to JIRA filter e.g. /secure/IssueNavigator.jspa?requestId='
	,"PopupFilterID":'To find the id of a JIRA filter, login to JIRA go to the filter and copy the id from the query-string, typically a five digit number'
	,"PopupTitle":'Title of the filter to show in the extension popup'
	,"PopupTemplate":'HTML template used for each ticket by the extension popup (mustache format)'
	,"RefreshTime":'Frequency to check server for changes (in seconds)'
}
