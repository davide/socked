(function ($wnd, Socked) {
	"use strict";
	Socked.Logger = {
			log: function () {
				var l = arguments.length;
				var arr = [];
				for (var i = 0; i < l; i += 1) {
					arr[i] = arguments[i];
				}
				if (typeof ($wnd.console) !== 'undefined') {
					$wnd.console.log(arr);
				}
			}
	};
}(window, window.Socked));
