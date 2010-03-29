mooSelecta
===========

![Screenshot](http://fragged.org/mooSelecta/mooSelecta.gif)

A mootools *select* element styling replacement as a progressive enhancement. Tested and working on:
IE6, IE7, FF 3.6.2, Chromium 5, Safari 4.0.4 (PC), please report others to christoff at gmail.com

Stylable entirely through CSS with the original element events intact, adhering to tabindex, keyboard navigation and so forth.

The "real" selects are being placed off-screen so their functionality is completely preserved in that any
forms with them will continue working as per usual.


Screenshots
-----------

Default skin:

![Screenshot 1](http://fragged.org/mooSelecta/Example/images/mooSelecta-large1.gif)

Skin using elements from http://www.emblematiq.com/lab/niceforms/

![Screenshot 2](http://fragged.org/mooSelecta/Example/images/mooSelecta-large2.gif)

How to use
----------

You need to setup your CSS classes based upon the ones already provided in the Example/css directory. Look at the options part of the mootools class to see what bits are customisable and follow the example.

To glue it all together, just include the mootools-core and then mooSelecta.js

Within your **domready** or **load** callback function, create an instance with whatever options suit you:

    var selecta = new mooSelecta({
        selector: "selecta"
    });

    new mooSelecta({
        selector: "selecta2",
        triggerClass: "selecta2",
        triggerPadding: 24,
        triggerBeforeImage: "/img/select-left.png",
        triggerBeforeImageWidth: 3,
        triggerBeforeImageHeight: 21,
        wrapperClass: "selecta2Wrapper",
        wrapperWidthAdjustment: 0,
        optionClass: "selecta2Option",
        optionClassSelected: "selecta2OptionSelected",
        optionClassOver: "selecta2OptionOver"
    });

Class methods
-------------
The class itself has plenty of comments throughout so feel free to look at the source code. That being said,
there are the following useful methods you can call:

    .replaceSelect(el); // applies the current style to a new select element. Also useful if you build options on the fly and change existing selects

    .bindListeners(); // a somewhat private method that will enable listen events for any and all subsequent **mooSelectas**

    ._addOption(option, el, selected); // adding options to the dropdown wrapper.

    ._toggleOptions(el); // opens or shuts the options list on a select that has been focused

    ._hideOptions(); // closes all open options.

    ._clearSelection(); // attempt to avoid text node selection when clicking on an option trigger

Known issues
------------

- Problems with Opera and .fireEvent("click") and the resulting .stop(), causing keyboard navigation issues when pressing enter.

Known limitations
-----------------

Obviously, the **select** elements are very complex and OS-driven components that incorporate a number of usability features, albeit -- implemented very differently across browsers. You cannot possibly hope to write a single tool that can mimic all known behaviours across the different operating systems either. It's a simple usability decision on what works and what does not, feel free to tweak it to your liking or to the liking of your users.