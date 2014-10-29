describe("Background", function() {

	describe("When Getting a local store value, ", function() {

		it("getting a value from a key should return the correct fallback value", function() {

			expect( kmj.getLocalStore("i_dont_exist_no_fallback") ).toBeNull();

			expect( kmj.getLocalStore("i_dont_exist","Fallback") ).toBe('Fallback');

			expect( kmj.getLocalStore("TESTVALUE","CDE") ).toBe('ABC');

		});
		it("getting a value from a key starting with password should return plain text", function() {
			var rawPass = "MY-PASSWORD",
				pass = window.btoa( rawPass );

			expect( pass ).not.toBe( rawPass );

			expect( kmj.getLocalStore("PASSWORD_TESTING_234", pass) ).toBe( rawPass );

		});

        it("parsing in a function should apply that function to the result", function() {

            expect( kmj.getLocalStore("i_dont_exist", '1', function(val){return parseInt(val, 10); }) ).toEqual( 1 );
            expect( kmj.getLocalStore("i_dont_exist", 10, function(val){return val.toString(); }) ).toBe( '10' );
            expect( kmj.getLocalStore("i_dont_exist", '10', 0 ) ).toEqual( 10 );

        });

	});
	describe("When Setting a local store value", function() {
		var rawPass = "MY-PASSWORD";
		beforeEach(function() {
			kmj.setLocalStore("PASSWORD_TESTING_1234", rawPass );
		});

		afterEach(function() {
			kmj.resetLocalStore("PASSWORD_TESTING_1234");
		});

		it("a key starting with password should not save as plain text", function() {
			expect( localStorage.getItem("PASSWORD_TESTING_1234") ).not.toBe( rawPass );
			expect( kmj.getLocalStore("PASSWORD_TESTING_1234") ).toBe( rawPass );
		});

	});
	describe("When parsing a URL ", function() {

		it("a url should not contain multiple backslashes", function() {
			expect( kmj.urlCleaner("/blah////blah//blah.html") ).toBe( '/blah/blah/blah.html' );
		});
		it("multiple backslashes should be preserved after the protocol", function() {
			expect( kmj.urlCleaner("http://blah/////blah.html") ).toBe( 'http://blah/blah.html' );
		});
	});
	describe("When setting the browser status text ", function() {

		beforeEach(function() {
			window.chrome = {browserAction:{setBadgeText:function(item){return item.text;}}};
            kmj.connected = true;
		});

		afterEach(function() {
			window.chrome = null;
			delete window['chrome'];
            kmj.connected = false;
		});


		it("a positive number should be a string", function() {
			expect( kmj.updateBrowserActionStatus( 1 ) ).toBe( '1' ) ;
			expect( kmj.updateBrowserActionStatus( 300 ) ).not.toBe( 300 ) ;
		});
		it("a negative number or non string value should return ?", function() {
			expect( kmj.updateBrowserActionStatus( -1 ) ).toBe( '?' ) ;
			expect( kmj.updateBrowserActionStatus( null ) ).toBe( '?' ) ;
			expect( kmj.updateBrowserActionStatus( ) ).toBe( '?' ) ;
		});
		it("string should remain the same", function() {
			expect( kmj.updateBrowserActionStatus( "hello" ) ).toBe( 'hello' ) ;
		});
	});

	describe("When getting an xml from the server ", function() {
		var data = null;
		it("should get URL from server", function() {
			runs(function() {
				kmj.httpRequest = null;
				kmj.handleResponse = function(d){ data = d ;};
				kmj.handleResponseError = function(){ data = "error"; };
				kmj.getPopupItems( '../jira-filter.xml' );
			});
			waitsFor(function() {
				var f = data ? true : false;
				return f;
			}, "Data should be populated", 3000);
		});
		it("should throw an error for bad request", function() {
			runs(function() {
				kmj.httpRequest = null;
				kmj.handleResponse = function(d){ data = d; };
				kmj.handleResponseError = function(){ data = "error"; };
				kmj.getPopupItems( '../i-dont-exist.xml' );
			});
			waitsFor(function() {
				var f = (data === 'error') ? true : false;
				return f;
			}, "Should throw error", 3000);
		});

	});


	describe("When populating a json array from xml data; ", function() {
		var data = null,
			items = new Array();
		it("should get xml from server", function() {
			runs(function() {
				kmj.httpRequest = null;
				kmj.handleResponse = function(d){ data = d ;};
				kmj.handleResponseError = function(){ data = "error" ;};
				kmj.getPopupItems( '../jira-filter.xml' );
			});
			waitsFor(function() {
				var f = data ? true : false;
				return f;
			}, "Data should be populated", 3000);
		});
		it("should populate array", function() {
			var xmlItems = data.getElementsByTagName('item');
			kmj.popuplateItems(xmlItems, items);
			expect( items.length ).toEqual( 5 );
			expect( items[0].key).toBe( 'AAA-0001' );
		});

		it("should populate array from multiple documents", function() {

			kmj.kanbanFiterDocuments = new Array();
            kmj.kanbanFiterDocuments.push({
                id:1,
                filterIndex:1,
                title:'item.title',
                xml:data
            });
            kmj.kanbanFiterDocuments.push({
                id:2,
                filterIndex:2,
                title:'item.title',
                xml:data
            });
            kmj.buildKanbanItemsList();
			expect( kmj.kanbanItems.length ).toEqual( 10 );
			expect( items[0].key ).toBe( 'AAA-0001' );
		});


		it("should convert xml into json", function() {

			var xml = data.getElementsByTagName('item')[0],
				json = kmj.xmlToJson(xml),
				jsonWithAttr = kmj.xmlToJson(xml, true);

			expect( typeof json ).toBe( 'object' );
			expect( typeof jsonWithAttr ).toBe( 'object' );

			expect( json['assignee'] ).toBe('test');
			expect( json['assignee@username'] ).toBeUndefined();

			expect( jsonWithAttr['assignee'] ).toBe('test');
			expect( jsonWithAttr['assignee@username'] ).toBe('testing1');


		});

	});

	describe("When getting the users refresh time ", function() {

		it("should convert seconds (int) into miliseconds", function() {
			expect( kmj.getRefresh( 1 ) ).toEqual( 1000 );
		});
		it("should convert seconds (string) into miliseconds", function() {
			expect( kmj.getRefresh( "1" ) ).toEqual( 1000 );
		});

	});


});