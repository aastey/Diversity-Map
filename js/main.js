// Author: Thomas Davis <thomasalwyndavis@gmail.com>
// Filename: main.js

// Require.js allows us to configure shortcut alias
// Their usage will become more apparent futher along in the tutorial.
require.config({
  paths: {
    jquery: 'lib/jquery/jquery-min',
    jqueryUI: 'lib/jquery/jquery-ui.min',
    underscore: 'lib/underscore/underscore-min',
    backbone: 'lib/backbone/backbone-min',
    queue: 'lib/queue.min',
    topojson: 'http://d3js.org/topojson.v1.min',
    animate: 'lib/animate-patch',
    d3: 'http://d3js.org/d3.v3.min',
    templates: '../templates'
  }

});

require([
  // Load our app module and pass it to our definition function
  'app',

], function(App){
  // The "app" dependency is passed in as "App"
  // Again, the other dependencies passed in are not "AMD" therefore don't pass a parameter to this function
  App.initialize();
});



