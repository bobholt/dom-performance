(function($) {

  // Binds click events to lots of elements within the visible container
  function bindListClicks() {
    $('.container:visible').find('td').on('click', function(e) {
      console.log($(this).text());
    });
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

      // Hide the element, but leave the events delegated
      $container.hide();

      if ($screen.length) {

        // If this element exists, just show it
        $screen.show();
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
