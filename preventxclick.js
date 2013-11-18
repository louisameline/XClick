/*
	A jQuery plugin to prevent "x-clicks" events.
	Version 1.0 - Released on 2013-11-18
	More info and discussion at : https://github.com/louisameline/preventXClick
	Released under MIT license
*/
;(function($){
	
	var defaultOptions = {
			delegate: '',
			prevent: true,
			onPrevented: function(){}
		},
		lastElements = {};
	
	// a function to set a function as a first handler, in order to stop the x-click event before any other handler can fire
	// warning: this binds on the internals of jQuery as there is no proper method to do this. Be careful to test everytime you upgrade to a new version of jQuery.
	$.fn.pxcBindFirst = function(name, fn) {
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
	$.preventXClick = function(options){
		
		options = $.extend({}, defaultOptions, options || {});
		
		// enforcing the prevention system
		if(options.prevent === true){
			
			// bind on body to track mousedown and mouseup events, it will allow us to be ready to catch the x-click
			$('body')
				// if for some reason you have to stop your mousedown/up events from bubbling up to body, trigger a custom "silentMouseup" or "silentMousedown" instead
				.on('mousedown.pxc mousedownSilent.pxc', options.delegate, function(e){ lastElements.mousedown = e.target; })
				.on('mouseup.pxc mouseupSilent.pxc', options.delegate, function(e){
					
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
						$closestCommonAncestor.pxcBindFirst('click.pxc', function(e){
							
							// make sure the click was triggered on this element (as an x-click would be), not bubbling from children. This reduces the risk to catch a wrong click event
							if(e.target === this){
								
								// stop the event
								e.stopImmediatePropagation();
								
								// reset elements to allow .click() calls afterwards
								lastElements = {};
								
								// callback
								options.onPrevented.call(this, e);
							}
							
							// unbind itself
							$(this).off('click.pxc');
						});
						
						// if the browser does not produce x-clicks, the handler we just bound will never be called and must be unbound before it catches a click it was not supposed to catch
						setTimeout(function(){
							$closestCommonAncestor.off('click.pxc');
						}, 0);
					}
				});
		}
		// canceling the prevention system
		else {
			$('body').off('.pxc');
			// makes sense to reset in case the plugin is used again later
			lastElements = {};
		}
	}
})(jQuery);