/**
 * trace.js v1.2
 * http://www.markuslerner.com
 * 2014-09-11
 *
 * Copyright Markus Lerner
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * required: jquery
 * sugguested: jquery.mCustomScrollbar.concat.min.js
 */

$(function(){

	Trace = {
		buffer: [],
		count: 0,
		modified: false,
		defaults: {
			showLineNumbers: false,
			linesNumMax: 1000,
			width: '500px'
		},
		inited: false
	};

	Trace.init = function(options) {
		if(!this.inited) {
	
			window.trace = function(text) {
				Trace.buffer.push( text );
				Trace.count++;
				Trace.modified = true;
			}

			window.traceSingle = function(text) {
				Trace.buffer = [text];
				Trace.modified = true;
			}

			this.settings = jQuery.extend( {}, this.defaults, options );
	
			jQuery('body').append('<div id="trace"></div>');
	
			jQuery('#trace').css('z-index', '10000');
			jQuery('#trace').css('width', this.settings.width);
			jQuery('#trace').css('height', '100%');
			jQuery('#trace').css('position', 'fixed');
			jQuery('#trace').css('top', '0px');
			jQuery('#trace').css('left', '10px');
			jQuery('#trace').css('font-family', 'Arial, Helvetica, sans-serif');
			jQuery('#trace').css('font-size', '11px');
			jQuery('#trace').css('line-height', '14px');
			jQuery('#trace').css('color', '#aaa');
			jQuery('#trace').css('pointer-events', 'none');
			// jQuery('#trace').css('border', '1px solid red');
	
			jQuery('<style type="text/css"> #trace .line { display: block; float: left; clear: left; } </style>').appendTo('head');
			jQuery('<style type="text/css"> #trace .line .count { display: block; float: left; min-width: 20px; text-align: right; padding-right: 5px; color:#666; } </style>').appendTo('head');
			jQuery('<style type="text/css"> #trace .line .text { display: block; float: left; width: ' + (parseInt(this.settings.width) - 60) + 'px; } </style>').appendTo('head');
	
			if(jQuery().mCustomScrollbar) {
				jQuery('#trace').mCustomScrollbar({
					scrollInertia: 0
				});
			}
	
			setInterval(function() {
				if(Trace.modified) {
					if(Trace.buffer.length > Trace.settings.linesNumMax) {
						Trace.buffer.splice(0, Trace.buffer.length - Trace.settings.linesNumMax);
					}
					var s = "";
					for(var i = 0; i < Trace.buffer.length; i++) {
						if(Trace.settings.showLineNumbers) {
							s += '<br/>\n<span class="line"><span class="count">' + (i+1) + '</span><span class="text">' + Trace.buffer[i] + "</span></span>";
						} else {
							s += '<br/>\n<span class="line"><span class="text">' + Trace.buffer[i] + "</span></span>";
						}
					}
					if( jQuery('#trace .mCSB_container').length > 0 ) {
						jQuery('#trace .mCSB_container').html( s );
					} else {
						jQuery('#trace').html( s );
					}
			
					if(jQuery().mCustomScrollbar) {
						jQuery('#trace').mCustomScrollbar("update");
						jQuery('#trace').mCustomScrollbar("scrollTo", "bottom");
					}
			
					Trace.modified = false;
				}
			}, 16);
		
			this.inited = true;
		}
	}

}());