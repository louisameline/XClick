XClick
=============

A jQuery plugin, 2.3ko minified. Demo file here http://louisameline.github.io/XClick

Predict and prevent x-clicks
-------------------------

As of 2013/11/17, x-clicks happen in Internet Explorer *only*, in all versions (from IE5 to current IE11).

What I call an "x-click" is actually a regular click event which is triggered in the unusual circumstances described below.

An x-click event is triggered on an element when this element is the closest common parent of two children elements, one of which having triggered a mousedown event, the other having triggered a mouseup event. So "x-click" stands for "a click spread across elements". See the demo file.

At some point in your code, you may feel x-clicks are not really clicks. The XClick jQuery plugin catches these tricky x-click events for you so you can take action against them. There is currently no native way to detect or prevent x-clicks. Side note : only real mouse events trigger x-clicks, not events triggered by a script.

Explanations and how-to
-------------------------

Requires jQuery >=1.8

Just make this call : `var XClick = new $.XClick();`

The plugin will start listening to mouse events (mouse down and up) to predict upcoming x-clicks and then sets a handler to catch them when they fire. By default, x-clicks are immediately stopped from propagating.

***Caveat*** : XClick tries to be the first to catch the x-click event triggered on the common ancestor element. However, if you bound handlers on that element *not using jQuery*, by default XClick will not be able to be the first and your handlers on that element will still fire. Check the `prebind` method for a workaround.

***Caveat 2*** : the plugin needs all mousedown and mouseup events to bubble up to the body tag. If for some reason you need to stop these events, then launch custom "mousedownSilent" and "mouseupSilent" events instead to keep the plugin working. See the demo file.

Options
-------------------------

Specify options in your init call : `new $.XClick(options)` (where options is an object)

- `onTriggered` : you might want to know when an x-click has been triggered. This option lets you specify a callback function to achieve this.

This callback function is called in the context of the common ancestor element which triggered the click event, and receives a data object as its first parameter. This object has the following properties : `event` is the click event, `mousedownElement` is the HTML object which triggered the mousedown event, and `mouseupElement` (same).

- When an x-click is triggered, you might want to let it propagate (I'd be curious to know why, please share your use case). You can do that by having the onTriggered callback return true.

- `silentEventName_mousedown` and `silentEventName_mouseup` : you may want to change the name of the custom silent mouse events we'll be listening to. By default, they are 'mousedownSilent' and 'mouseupSilent'. Use this option to change them.

- `enableForAllBrowsers` : by default, the plugin does nothing in browsers other than IE. To change this, set this option to true. It's mainly for debugging purposes.

- `delegate` : if for some reason you only want to deal with x-clicks generated in a branch of your DOM tree, provide a selector.

Methods
-------------------------

Call the following methods with `XClick.methodname([argument])`

- `disable` : turns the plugin off, it will stop listening to mouse events

- `enable` : turn the plugin on again

- `destroy` : disables the plugin and also unbinds any pre-bound elements you may have specified. Warning : you don't want to use this method if you are going to use XClick again later, because of prebound handlers.

- `prebind` : *by default*, if you set a click handler on an element without using jQuery's binding methods and if an x-click is triggered on that element, XClick will not be able to catch the event before your own handler is fired. To fix this, you can either use jQuery to set your handler, or you can use this `prebind` method on your element before you set your own handler. Just call `XClick.prebind('#myElement')` or `XClick.prebind($element)`. This method is handy when you know which elements are likely to receive x-clicks.

- `setOptions` : give it an object of options as first parameter and they will overwrite the current options. Only the `onTriggered` option will take effect immediately, the others will be taken into account after a call to the `reset` method

- `reset` : meant to be used after a change in options (see the `setOptions` method)

The origin of x-clicks
-------------------------

Why do x-clicks exist and why only in IE ? It seems to be the only browser which implements this W3 directive :

"...in general should fire click and dblclick events when the event target of the associated mousedown and mouseup events is the same element with no mouseout or mouseleave events intervening, and should fire click and dblclick events on the nearest common ancestor when the event targets of the associated mousedown and mouseup events are different."
http://www.w3.org/TR/DOM-Level-3-Events/#events-mouseevent-event-order

A discussion has been opened here to ask Microsft to consider revising the x-click behavior. You will find arguments that actually support x-clicks : https://connect.microsoft.com/IE/feedback/details/809003/unexpected-click-event-triggered-when-the-elements-below-cursor-at-mousedown-and-mouseup-events-are-different

Humble thoughts for browser and directive makers
-------------------------

The main problem with these x-click events is that it is hard to predict on which element they will be triggered. If the user presses the mouse button on an element and releases it on another one in the page, the click event is triggered on a third element that remains to be determined. It makes them very hard to listen to and catch if you need to.

Besides, if I wanted to listen for mousedown-and-up events accross two elements, I wouldn't rely on a click-listener on the common parent because this parent can change whenever I change the structure of my HTML.

Furthermore, one might not even consider them as real functional clicks, it's a question of definition. In my use case, I came accross this issue when using select2 which tries to emulate select fields, which do not trigger click events in these circumstances. Well, select2 just cannot keep this annoying click event from firing (not without a plugin like XClick), since it is fired outside of the HTML it generates.

Speaking of which, it is annoying that using preventDefault on the mousedown and/or mouseup events won't help you prevent x-clicks. Although regular clicks on a unique element rightfully also work this way, it would make some sense to work differently with x-clicks. Finally, x-click events have no special properties that differentiate them from regular click events, that would be a nice thing to add.

As far as I'm concerned, since x-clicks are so confusing, hard to use, have almost no real purpose but are real troublemakers, I'd like them gone or at least have them trigger a different type of event. What about disabling them in IE until the W3 makes a new stand on this ? Feel free to share your thoughts.

Alternative solutions
-------------------------

For future reference, an interesting alternative solution to first-binding has been proposed here : https://github.com/ivaynberg/select2/pull/1920. It consists in detaching and immediately reattaching the element which got the mousedown event. It does prevent the click event, but may also have side-effects on the children elements of the detached element (iframes refreshing, upload fields reset, brief css glitch, maybe more).