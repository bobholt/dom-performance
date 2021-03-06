(function($) {

  // make a shared object where we store detached DOM nodes by ID
  var nodeCache = {};

  // Binds click events to lots of elements within the visible container
  function bindListClicks() {
    $('.container:visible').find('td').on('click', function(e) {
      console.log($(this).text());
    });
  }

  // Unbinds the events bound by `bindListClicks()`
  function unbindListClicks() {
    $('.container:visible').find('td').off('click');
  }

  function init() {

    // Let's bind some delegated events to our initial container
    bindListClicks();

    // Set up the nav functionality
    $('.picker > li > a').on('click', function(e) {
      e.preventDefault();

      var screenId = $(this).attr('href').substr(1);
      var screenName = $(this).text();
      var $screen = $('#' + screenId);
      var $container = $('.container:visible');

      // Cache the element, this time removing the events
      unbindListClicks();
      nodeCache[$container.attr('id')] = $container.detach();

      var newScreen = nodeCache[screenId];

      if (newScreen) {

        // If this element exists, get it from the cache and put it in the DOM
        newScreen.appendTo('body');

        // Re-bind events
        bindListClicks();
      } else {

        // Otherwise, clone it, give it a new name, and put it in the DOM
        $container.clone()
          .find('.name').text(screenName).end()
          .attr('id', screenId)
          .appendTo('body')
          .show();

        // Bind the same events to this new container
        bindListClicks();
      }
    });

  }

  init();

}(jQuery));
