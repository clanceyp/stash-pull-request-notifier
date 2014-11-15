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
            expect( kmj.getLocalStore("i_dont_exist", '10', "number") ).toEqual( 10 );
	        expect( kmj.getLocalStore("i_dont_exist", 'true' , "boolean") ).toBeTruthy(  );
	        expect( kmj.getLocalStore("i_dont_exist", 'false' , "boolean") ).not.toBeTruthy(  );

        });
        it("parsing in a the number keyword the result should return a number", function() {

            expect( kmj.getLocalStore("i_dont_exist", '10', "number") ).toEqual( 10 );

        });
        it("parsing in a the boolean keyword the result should return a boolean", function() {

	        expect( kmj.getLocalStore("i_dont_exist", 'true' , "boolean") ).toBeTruthy(  );
	        expect( kmj.getLocalStore("i_dont_exist", 'false' , "boolean") ).not.toBeTruthy(  );

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
			window.chrome = {browserAction:{setBadgeBackgroundColor:function(){},setBadgeText:function(item){return item.text;}}};
            kmj.connected = true;
		});

		afterEach(function() {
			window.chrome = null;
			delete window['chrome'];
            kmj.connected = false;
		});


		it("a positive number should be a string", function() {
			expect( typeof (kmj.updateBrowserActionStatus( 1 )) ).toBe( 'string' ) ;
			expect( kmj.updateBrowserActionStatus( 300 ) ).not.toBe( 300 ) ;
		});
		it("0 should be a tick", function() {
			expect( kmj.updateBrowserActionStatus( 0 ) ).toBe( '\u2713' ) ;
		});
		it("a negative number or non string value should return a ?", function() {
			expect( kmj.updateBrowserActionStatus( -1 ) ).toBe( '?' ) ;
			expect( kmj.updateBrowserActionStatus( null ) ).toBe( '?' ) ;
			expect( kmj.updateBrowserActionStatus( ) ).toBe( '?' ) ;
		});
		it("string should remain the same", function() {
			expect( kmj.updateBrowserActionStatus( "hello" ) ).toBe( 'hello' ) ;
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