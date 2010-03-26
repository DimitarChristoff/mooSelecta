mooSelecta
===========

A mootools select element styling replacement as a progressive enhancement.

Stylable through CSS with the original events intact, adhering to tabindex, keyboard navigation and so forth.

![Screenshot](http://fragged.org/mooSelecta/mooSelecta.gif)

How to use
----------

You need to setup your css classes based upon the ones already provided in the example

	var selecta = new myselecta({
	    selector: "selecta2"
	});

	new myselecta({
	    selector: "selecta"
	});

Screenshots
-----------

![Screenshot 1](http://fragged.org/mooSelecta/Example/images/mooSelecta-large1.gif)
![Screenshot 2](http://fragged.org/mooSelecta/Example/images/mooSelecta-large2.gif)

Known issues
------------

- Problems with Opera and .fireEvent("click"), resulting in keyboard navigation issues
- By letter lookups are not tree-based and cycle between just 2 entries