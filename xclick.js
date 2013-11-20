/*
	A jQuery plugin to predict and prevent "x-clicks" events.
	Version 1.0 - Released on 2013-11-18
	More info and discussion at : https://github.com/louisameline/XClick
	Released under MIT license
*/
;(function($){
	
	var defaultOptions = {
			// if for some reason you want to deal with x-clicks triggered only in a given branch of your DOM tree
			delegate: '',
			// to put the plugin to sleep (stops listening to mouse events)
			enable: true,
			// we do not want to waist time in browsers that do not generate x-clicks anyway. This option is mainly for debugging purposes.
			enableForAllBrowsers: false,
			// you may change the names of the silent custom event types we'll be listening to 
			silentEventName_mousedown: 'mousedownSilent',
			silentEventName_mouseup: 'mouseupSilent',
			// callback function called when an x-click was just triggered. If the function does not return true, the event propagation is immediately stopped (default behavior).
			// the callback will be called in the context of the common ancestor element which triggered the click event, and receives a data object as first parameter, having 'event', 'mousedownElement' and 'mouseupElement' properties.
			onTriggered: function(){ return false; }
		},
		lastElements = {};
	
	// we have to know if the browser generates x-clicks. Not sure if there is another way than browser detection (script-triggered mouse events do not trigger an x-click), suggestions are welcome.
	var xclickSupport = false;
	// look for MSIE or rv:11 (IE11)
	if(navigator.userAgent.indexOf('MSIE') !== -1 || navigator.userAgent.indexOf('rv:11') !== -1) xclickSupport = true;
	
	// a function to set a function as a first handler, in order to stop the x-click event before any other handler can fire
	// warning: this binds on the internals of jQuery as there is no proper method to do this. Be careful to test everytime you upgrade to a new version of jQuery.
	$.fn.xcBindFirst = function(name, fn) {
		// bind as you normally would
		this.on(name, fn);
		return this.each(function() {
			var handlers = $._data(this, 'events')[name.split('.')[0]];
			// take out the handler we just inserted from the end
			var handler = handlers.pop();
			// move it at the beginning
			handlers.splice(0, 0, handler);
		});
	};

	// set the parameter to true
	$.XClick = function(options){
		
		options = $.extend({}, defaultOptions, options || {});
		
		if(xclickSupport || options.enableForAllBrowsers){
			
			// enforcing the prevention system
			if(options.enable === true){
				
				// bind on body to track mousedown and mouseup events, it will allow us to be ready to catch the x-click
				$('body')
					// if for some reason you have to stop your mousedown/up events from bubbling up to body, trigger a custom "silentMouseup" or "silentMousedown" instead
					.on('mousedown.xc ' + options.silentEventName_mousedown + '.xc', options.delegate, function(e){ lastElements.mousedown = e.target; })
					.on('mouseup.xc ' + options.silentEventName_mouseup + '.xc', options.delegate, function(e){
						
						lastElements.mouseup = e.target;
						
						// compare with the mousedown element
						if(
							// if one of the elements is not defined, we let the event go. It happens when one of the mouse events was not triggered or not caught by our listeners and that a .click() call is made afterwards
							lastElements.mousedown && lastElements.mouseup
							// make sure the elements are different
							&& lastElements.mousedown !== lastElements.mouseup
						){
							// we determine which element is the closest ancestor
							var mdElParents = $(lastElements.mousedown).parents(),
								muElParents = $(lastElements.mouseup).parents(),
								$closestCommonAncestor = null;
							
							$.each(mdElParents, function(i, el){
								$.each(muElParents, function(j, el2){
									
									if(el === el2 || $(el).has(el2).length > 0){
										$closestCommonAncestor = $(el);
										return false;
									}
								});
								if($closestCommonAncestor) return false;
							});
							
							// we bind on the closest ancestor to catch the x-click
							$closestCommonAncestor.xcBindFirst('click.xc', function(event){
								
								// unbind itself first, in case the callback function wants to trigger click events
								$(this).off('click.xc');
								
								// make sure the click was triggered on this element (as an x-click would be), not bubbling from children. This reduces the risk to catch a wrong click event (edge case)
								if(event.target === this){
									
									// callback
									var letGo = options.onTriggered.call(this, {
										event: event,
										mousedownElement: lastElements.mousedown,
										mouseupElement: lastElements.mouseup
									});
									
									// stop the event unless the callback function returned true
									if(letGo !== true) event.stopImmediatePropagation();
								}
							});
							
							// if the browser does not produce x-clicks, the handler we just bound will never be called and must be unbound before it catches a click it was not supposed to catch
							setTimeout(function(){
								$closestCommonAncestor.off('click.xc');
							}, 0);
						}
					});
			}
			// canceling the prevention system
			else {
				$('body').off('.xc');
			}
		}
	}
})(jQuery);