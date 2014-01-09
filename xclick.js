/*
	A jQuery plugin to predict and prevent "x-clicks" events.
	Version 1.2.1 - Released on 2014-01-09
	More info and discussion at : https://github.com/louisameline/XClick
	Released under MIT license
*/
;(function($){
	
	// "CONSTANTS"
	
	var defaultOptions = {
			// if for some reason you want to deal with x-clicks triggered only in a given branch of your DOM tree
			delegate: '',
			// to put the plugin to sleep (stops listening to mouse events)
			enable: true,
			// we do not want to waste time in browsers that do not generate x-clicks anyway. This option is mainly for debugging purposes.
			enableForAllBrowsers: false,
			// you may change the names of the silent custom event types we'll be listening to 
			silentEventName_mousedown: 'mousedownSilent',
			silentEventName_mouseup: 'mouseupSilent',
			// callback function called when an x-click was just triggered. If the function does not return true, the event propagation is immediately stopped (default behavior).
			// the callback will be called in the context of the common ancestor element which triggered the click event, and receives a data object as first parameter, having 'event', 'mousedownElement' and 'mouseupElement' properties.
			onTriggered: function(){ return false; }
		};
	// we have to know if the browser generates x-clicks. Not sure if there is another way than browser detection (script-triggered mouse events do not trigger an x-click), suggestions are welcome.
	var xclickSupport = false;
	// look for MSIE or Trident + rv:1* (IE11+)
	var n = navigator.userAgent;
	if(		n.indexOf('MSIE') !== -1
		|| (n.indexOf('Trident') !== -1 && n.indexOf(' rv:1') !== -1)
	) xclickSupport = true;
	
	
	// BIND-FIRST PLUGIN
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
	
	
	// XCLICK PLUGIN
	$.XClick = function(){
		
		var self = this;
		
		
		// LIST OF INSTANCE VARIABLES
		
		// if at some point we know an x-click is coming up, this variable will contain the element it is supposed to be triggered on. Will be used when handlers fire to know if they should stop the event
		self.expectingElement = null;
		// we always store the latest elements who got mousedown and mouseup events, for comparison
		self.lastElements = {};
		self.options = $.extend({}, defaultOptions);
		// will be used at destroy
		self.preboundElements = [];
		
		
		// PRIVATE METHODS
		
		self.onXClick = function(event, context){
			
			// unbind itself first (this does not concern our pre-bound handlers, not the same namespace), in case the callback function wants to trigger click events
			$(context).off('click.xc');
			
			// make sure the click was triggered on an element which expects an x-click, and that the element is not bubbling from some child. This reduces the risk to catch a wrong click event (edge case)
			if(context === self.expectingElement && context === event.target){
				
				// reset this first (this is for prebound handlers, same reason as unbinding above)
				self.expectingElement = null;
				
				// callback
				var letGo = self.options.onTriggered.call(context, {
					event: event,
					mousedownElement: self.lastElements.mousedown,
					mouseupElement: self.lastElements.mouseup
				});
				
				// stop the event unless the callback function returned true
				if(letGo !== true) event.stopImmediatePropagation();
			}
			else {
				// reset this anyway : if the handler somehow caught a wrong click event we're not expecting anything after that
				self.expectingElement = null;
			}
		};
		
		// this handler will fire at each click on the element it is bound on and will check if an x-click is expected on it
		self.preboundHandler = function(event, context){
			if(context === self.expectingElement) self.onXClick(event, context);
		};
		
		
		// PUBLIC METHODS
		
		this.destroy = function(){
			
			// unbind body tag
			self.disable();
			
			// unbind pre-bound elements
			$.each(self.preboundElements, function(i, $el){
				$el
					.removeData('xcPrebound')
					.off('click.xcPrebound');
			});
			
			delete this;
		};
		
		// set listeners on body tag
		self.enable = function(){
			
			if(xclickSupport || self.options.enableForAllBrowsers){
				
				// bind on body to track mousedown and mouseup events, it will allow us to be ready to catch the x-click
				$('body')
					// if for some reason you have to stop your mousedown/up events from bubbling up to body, trigger a custom "silentMouseup" or "silentMousedown" instead
					.on('mousedown.xc ' + self.options.silentEventName_mousedown + '.xc', self.options.delegate, function(e){
						self.lastElements.mousedown = e.target; 
					})
					.on('mouseup.xc ' + self.options.silentEventName_mouseup + '.xc', self.options.delegate, function(e){
						
						self.lastElements.mouseup = e.target;
						
						// compare with the mousedown element
						if(
							// if one of the elements is not defined, we let the event go. It happens when one of the mouse events was not triggered or not caught by our listeners and that a .click() call is made afterwards
							self.lastElements.mousedown && self.lastElements.mouseup
							// make sure the elements are different
							&& self.lastElements.mousedown !== self.lastElements.mouseup
						){
							// we determine which element is the closest ancestor. Addback() will put elements in document order, we need to reverse them
							var mdElLineage = $(self.lastElements.mousedown).parents().addBack().get().reverse(),
								muElLineage = $(self.lastElements.mouseup).parents().addBack().get().reverse(),
								$closestCommonAncestor = null;
							
							$.each(mdElLineage, function(i, el){
								$.each(muElLineage, function(j, el2){
									
									if(el === el2 || $(el).has(el2).length > 0){
										$closestCommonAncestor = $(el);
										return false;
									}
								});
								if($closestCommonAncestor) return false;
							});
							
							// will be used by our handler
							self.expectingElement = $closestCommonAncestor[0];
							
							// if a handler has not already been bound to the common ancestor (see pre-bind method)
							if(!$closestCommonAncestor.data('xcPrebound')){
								
								// we bind on it to catch the x-click
								$closestCommonAncestor.xcBindFirst('click.xc', function(event){
									self.onXClick(event, this);
								});
								
								// if the browser actually does not produce x-clicks, the handler we just bound will never be called and must be unbound before it catches a click it was not supposed to catch
								setTimeout(function(){
									$closestCommonAncestor.off('click.xc');
									self.expectingElement = null;
								}, 0);
							}
						}
					});
			}
			return self;
		};
		
		self.disable = function(){
			//stop listening to mouse events. Note : this is not a destroy, we do not unbind pre-bound elements
			$('body').off('.xc');
			return self;
		};
		
		// this method is to be called in the form XClick('options', {object of options})
		self.setOptions = function(options){
			$.extend(self.options, options);
			return self;
		};
		
		// to bind an XClick handler on an element before any other handler (even we the element may never receive an x-click), so it is always fired first (can be an issue for people who make bindings without jQuery)
		self.prebind = function(param){
			
			var $el = (typeof param === 'string') ? $(param) : param;
			$el
				.data('xcPrebound', true)
				.on('click.xcPrebound', function(event){
					self.preboundHandler(event, this);
				});
			
			// remember for destroy
			self.preboundElements.push($el);
			
			return self;
		}
		
		// will unbind and re-bind the body tag. May be used after a change in options
		self.reset = function(){
			self.disable();
			self.enable();
			return self;
		}
		
		
		// XCLICK INITIALIZATION (first param is the options object or is undefined)
		
		// if options are provided, save them
		self.setOptions(arguments[0]);
		
		// will start the plugin if required
		self.enable();
	}
})(jQuery);