/*
---

name: mooSelecta

description: mooSelecta, select element styling replacement

authors: Dimitar Christoff, Andre Fiedler, Judicael Briand

license: MIT-style license.

version: 1.4.0a

requires:
  - Core/String
  - Core/Event
  - Core/Browser
  - Core/Element
  - Core/Element.Dimensions

provides: mooSelecta

...
*/

var mooSelecta = new Class({

    version: "1.4.0b",

    updated: "28/11/2011 11:50:01",

    Implements: [Options,Events],

    // default options
    // don't change these here but on the instance (unless you want to)
    options: {
        parentNode: document,
        selector: "select.selecta",                     // class / selector for selects to convert
        positionRelativeSelector: null,                 // class / selector for a positioned parent element
        triggerClass: "selectaTrigger",                 // class of the replacement div
        triggerPadding: 30+5,                           // compensate for left/right padding of text
        triggerBeforeImage: "",                         // advanced styling of trigger like a round image
        triggerBeforeImageWidth: 0,                     // need to compensate width
        triggerBeforeImageHeight: 0,                    // and know height.
        wrapperClass: "selectaWrapper",                 // popup wrapper class
        wrapperWidthAdjustment: 0,                      // you can add or substract to width if not matching, use +/- value
        wrapperShadow: "shadowy",                       // extra class applied to wrapper, like one with box-shadow
        wrapperHeight: 0,                               // maximum allowed height for dropdown before it scrolls
        optionClass: "selectaOption",                   // base class of indivdual options
        optionClassSelected: "selectaOptionSelected",   // pre-selected value class
        optionDisabledClass: "selectaDisabled",         // if option disabled=disabled
        optionClassOver: "selectaOptionOver",           // onmouseover option class
        allowTextSelect: false,                         // experimental to stop accdiental text selection
        // these are keycodes that correspond to alpha numerics on most ISO keyboards for index lookups of options
        allowedKeyboardCodes: [48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90],
        useClickListener: true                          // binds click events to check for clicks away from dropdown.
    },

    // internal hashed collection of managed selects
    selects: {},

    // hash that references options per select for keycode lookups
    optionList: {},

    // false or contains a pointer to the last select that has opened the menu
    focused: false,

    initialize: function(options) {
        // start everything.
        this.setOptions(options);

        // locate and apply selects to all required ones.
        var selects = this.options.parentNode.getElements(this.options.selector);

        if (!selects.length) {
            return false; // "nothing to do, selector came up empty!";
        }

        selects.each(this.replaceSelect.bind(this));

        // bind mouseclicks and keytyping
        this.bindListeners();
    },

    replaceSelect: function(el) {
        // public method that replaces selects
        el = document.id(el); // adds uid.

        if (!el) {
            return;
        }

        // gets existing element's width to use
        var width = el.getSize().x;

        // default selected to go into wrapper
        var selectedOption = el.getElements("option").filter(function(op) {
            return op.getProperty("selected");
        });

        // clean up old instances.
        if (el.retrieve("triggerElement")) {
            el.retrieve("triggerElement").destroy();
        }

        if (el.retrieve("wrapper")) {
            el.retrieve("wrapper").destroy();
        }

        // build the top visible element
        el.store("triggerElement", new Element("div", {
            "class": this.options.triggerClass,
            styles: {
                width: width - this.options.triggerPadding
            }
        }).inject(el, "after").addClass("cur")); // cur is a class that changes cursor to a clicky one.

        // re-adjust width after the trigger has been done so wrapper can match it.
        width = el.retrieve("triggerElement").getSize().x - 2 - this.options.triggerBeforeImageWidth + this.options.wrapperWidthAdjustment;

        // build the menu wrapper

        // if we have an image to pre-pend, add it.
        if (this.options.triggerBeforeImage.length) {
            new Element("div", {
                styles: {
                    "float": "left",
                    position: (Browser.ie6) ? "absolute" : "relative",
                    background: "url("+this.options.triggerBeforeImage+") no-repeat",
                    width: this.options.triggerBeforeImageWidth,
                    height: this.options.triggerBeforeImageHeight
                }
            }).inject(el.retrieve("triggerElement"), "before");
        }

        // create the options wrapper
        var pos = el.getPosition((!!this.options.positionRelativeSelector ? el.getParent(this.options.positionRelativeSelector) : null));
        el.store("wrapper", new Element("div", {
            "class": this.options.wrapperClass,
            styles: {
                width: width,
                zIndex: 10000,
                left: pos.x - this.options.triggerBeforeImageWidth,
                top: pos.y + el.retrieve("triggerElement").getSize().y
            }
        }).inject(el.retrieve("triggerElement"), "after").addClass(this.options.wrapperShadow));

        // now hide the original selects off-screen
        // this is so the tab indexing and by-label focus works and hands us back contol.
        el.set({
            styles: {
                position: "absolute",
                top: -1000,
                left: -1000
            },
            events: {
                focus: function() {
                    if (this.focused) {
                        this._hideOptions();
                    }

                    this.focused = el;
                    this._toggleOptions(el);

                }.bind(this),
                blur: function(e) {
                    if (this.focused == el) {
                        this._toggleOptions(el);
                    }
                }.bind(this)
            }
        });

        // handle labels so they don't interfere by launching a semi-full event.
        var lbl = document.getElement("label[for="+el.get("id")+"]");
        if (el.get("id") && lbl) {
            lbl.addEvent("click", function(e) {
                if (e && e.stop) {
                    e.stop();
                }
                el.fireEvent("focus");
            });
        }


        // get all options and port them to wrapper
        var index = 0;
        el.getElements('option').each(function(option) {
            var selected = false;
            if (option.get("selected")) {
                el.retrieve("triggerElement").set("html", option.get("text"));
                selected = true;
            }
            this._addOption(option, el, selected, index++);
        }, this);

        // figure out height of wrapper and reduce if needed
        if (this.options.wrapperHeight) { // if greater than 0 care about this
            var height = el.retrieve("wrapper").getSize().y;
            if (height > this.options.wrapperHeight) {
                el.retrieve("wrapper").setStyles({
                    height: this.options.wrapperHeight
                });
            }
        }

        // hide the menu by default.
        el.retrieve("wrapper").setStyle("display", "none");

        // attach a click event to trigger element
        el.retrieve("triggerElement").addEvents({
            click: function(e) {
                if (e && e.stop) {
                    e.stop();
                }
                // toggler, click on opened closes it.
                el.fireEvent((this.focused == el) ? "blur" : "focus");
            }.bind(this)
        });

        // export the managed select to the hash
        if (el.uid && el) {
            this.selects[el.uid] = el;
        }

    }, // end .replaceSelect();

    bindListeners: function() {
        // setup valrious click / key events

        if (this.options.useClickListener) {
            document.addEvent("click", this._bindClickListener.bind(this));
        }

        document.addEvents({
            // keyboard listener
            keydown: function(e) {

                var ops, old, done;

                // if no menu is currently open, don't do anything.
                if (!this.focused) {
                    return;
                }

                switch(e.code) {
                    case 40: // down arrow option navigation
                        if (e && e.stop) {
                            e.stop();
                        }
                        this.focused.store("previous", null);
                        //move down
                        var wrapper = this.focused.retrieve("wrapper");
                        var curr = this.focused.retrieve("selected");
                        
                        var next = curr.getNext();
                        //if the next is ok
                        if(next){
                        	curr.removeClass(this.options.optionClassSelected);
                        	next.addClass(this.options.optionClassSelected);
                        	this.focused.store("selected", next);
                        	//scroll
                        	this._scrollTo(wrapper, next);
                        }
                    break;
                    case 38: // up arrow option navigation
                        if (e && e.stop) {
                            e.stop();
                        }
                        this.focused.store("previous", null);
                        //move up
                        var wrapper = this.focused.retrieve("wrapper");
                        var curr = this.focused.retrieve("selected");
                        
                        var prev = curr.getPrevious();
                        //if the previous is ok
                        if(prev){
                        	curr.removeClass(this.options.optionClassSelected);
                        	prev.addClass(this.options.optionClassSelected);
                        	this.focused.store("selected", prev);
                        	//scroll
                        	this._scrollTo(wrapper, prev);
                        }
                    break;
                    case 13: // enter
                        if (e && e.stop) {
                            e.stop();
                        }
                        this.focused.retrieve("selected").fireEvent("click");
                    break;
                    case 9: // tabbed out, blur auto...
                        this._hideOptions(this.focused);
                    break;
                    case 34:
                    case 35:
                        // go to last option via pgdn or end
                        if (e && e.stop) {
                            e.stop();
                        }
                        old = this.focused;
                        old.store("previous", null);
                        this.focused.retrieve("wrapper").getElements("div."+this.options.optionClass).getLast().fireEvent("click");
                        old.fireEvent("focus");

                    break;
                    case 33:
                    case 36:
                        // go to first option via pgup or home
                        if (e && e.stop) {
                            e.stop();
                        }
                        old = this.focused;
                        this.focused.retrieve("wrapper").getElement("div."+this.options.optionClass).fireEvent("click");
                        old.fireEvent("focus");

                    break;
                    default:
                    	console.log(e);
                        // the "other" keys.
                        old = this.focused;
                        ops = this.focused.retrieve("wrapper").getElements("div."+this.options.optionClass);

                        // is is alpha numeric allowed?
                        if (this.options.allowedKeyboardCodes.contains(e.code)) {
                            // loop through current option texts array cache for matches
                            var matchingKeys = [];
                            var selected = false;

                            var applicable = this.optionList["k"+this.focused.uid].filter(function(el, index) {
                                if (ops[index].hasClass(this.options.optionClassSelected)) {
                                    selected = index;
                                }
                                var match = el.indexOf(e.key) === 0;
                                if (match) {
                                    matchingKeys.push(index);
                                }
                                return match;
                            }, this);

                            if (applicable.length) {
                                if (!matchingKeys.contains(selected)) {
                                    selected = matchingKeys[0];
                                }
                                else {
                                    if (ops[selected+1] && matchingKeys.contains(selected+1)) {
                                        selected++;
                                    }
                                    else {
                                        selected = matchingKeys[0];
                                    }

                                }

                                ops[selected].fireEvent("click");
                                old.fireEvent("focus");
                                done = true;
                            }
                        }
                        else {
                            // do nothing or disable comment to see other keys you may like to bind.
                            // console.log(e.code, e.key);
                            if (e && e.stop) {
                                e.stop();
                            }

                        }
                    break;
                }
            }.bind(this)
        });
    }, // end .bindListeners()

    _bindClickListener: function(e) {
        // listens for client clicks away from triggers and closes like real selects do when user loses interest
        // using a collection which saves a click on an element that's not extended with .hasClass
        if (!(e && e.target)) {
            return;
        }

        if ($$(e.target).hasClass(this.options.triggerClass).contains(false)) {
            this._hideOptions();
        }
    },

    _addOption: function(option, el, selected, index) {
        // internal method called by replaceSelect that adds each option as a div within the wrapper
        var text = option.get("text").trim();
        if (!text.length) {
            text = "&nbsp;";
        }

        // store options relevant to element uid.
        var oldList = this.optionList["k" + el.uid] || [];
        oldList.push(text.toLowerCase());
        var tempObj = {};
        tempObj["k" + el.uid] = oldList;

        Object.append(this.optionList, tempObj);
        // end store

        var opDiv = new Element("div", {
            "class": this.options.optionClass,
            html: text,
            events: {
                mousemove: function() {
                	var s = el.retrieve("selected");
                	el.store("previous", s);
                	s.removeClass(this.options.optionClassSelected);
                	
                	el.store("selected", opDiv);
                    opDiv.addClass(this.options.optionClassSelected);
                }.bind(this),
                mouseleave: function() {
                    opDiv.removeClass(this.options.optionClassSelected);
                }.bind(this),
                click: function(e) {
                    if (e && e.type && e.stop) {
                        e.stop();
                    }

                    if (opDiv.hasClass(this.options.optionDisabledClass)) {
                        return false; // do nothing!
                    }
                    
                    el.store("previous", null);

                    // menu stuff visual
                    el.retrieve("selected").removeClass(this.options.optionClassSelected);
                    //store the selected
                    el.store("selected", opDiv);
                    
                    opDiv.addClass(this.options.optionClassSelected);
                    el.retrieve("triggerElement").set("html", opDiv.get("text"));

                    // now handle change in the real select
                    el.set("value", opDiv.retrieve("value")).fireEvent("change", e);
                    this._toggleOptions(el);
                }.bind(this)
            }
        }).store("value", option.get("value")).inject(el.retrieve("wrapper")).addClass("cur");
        
        opDiv.store('index', index);
        
        if (option.get("disabled")) {
            opDiv.addClass(this.options.optionDisabledClass);
        }

        if (selected) {
            opDiv.addClass(this.options.optionClassSelected);
            //store it as the selected
            el.store("selected", opDiv);
        }

    },
    
    /**
     * scrolls to a particular element in the select menu
     */
    _scrollTo : function(parent, option){
    	//take the coordinates
    	var coord = option.getSize();
    	//console.log(option);
    	parent.scrollTo(0, coord.y*option.retrieve('index'));
    },

    _toggleOptions: function(el) {
        // toggles visibility on click
        var vis = el.retrieve("wrapper").getStyle("display");
        el.retrieve("wrapper").setStyle("display", (vis == "none") ? "block" : "none").getChildren().removeClass(this.options.optionClassSelected);
        this.focused = (vis != "none") ? false : el;

        // scroll to selected from .toElement in core but w/o a fx.slide instance
        el.retrieve("selected").addClass(this.options.optionClassSelected);
        this._scrollTo(el.retrieve("wrapper"), el.retrieve("selected"));
        this._clearSelection();
    },

    _hideOptions: function() {
        // private called on cleanup / away click
        Object.values(this.selects).each(function(el) {
            if (el.retrieve("wrapper").getStyle("display") != "none") {
                el.fireEvent("blur");
            }
            el.retrieve("wrapper").setStyle("display", "none");
            el.focused = false;
        });
    },

    _clearSelection: function() {
        // removes document selection
        if (this.options.allowTextSelect || Browser.ie6) { // not sure how IE6 does this
            return;
        }

        if (!!document.selection && !!document.selection.empty) {
            try {
                document.selection.empty();
            } catch(e) {} // IE8 throws exception on hidden selections
        } else if (!!window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    }
}); // endClass