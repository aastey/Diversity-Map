(function( $, undefined ) {

	$.extend($.ui.slider.prototype.options, {
		dragAnimate: true
	});
	
	var _mouseCapture = $.ui.slider.prototype._mouseCapture;
	$.widget("ui.slider", $.extend({}, $.ui.slider.prototype, {
		_mouseCapture: function(event) {
			_mouseCapture.apply(this, arguments);
			this.options.dragAnimate ? this._animateOff = false : this._animateOff = true;
			return true;
		}
	}));
	
}(jQuery));