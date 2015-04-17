# Multi-Screen DOM Performance with jQuery

This repo contains experiments in improving DOM performance from the following
baseline:

- A page that has a table consisting of approximately 1000 cells, each with an
  individually-assigned event handler.
- New screens can be added to the page by clicking a link at the top.
- The new screen is cloned from the existing screen to represent another "page"
  of similar complexity.
- The old screen is hidden, with event handlers still bound.
- Navigating to a previously-seen screen shows the existing node (does not
  clone a new instance).

This baseline is represented in the `/hide-dom-keep-listeners` directory.

Other experiments vary in different ways, as described below.

## Tactics Used

Several tactics were used alone and in combination to test various approaches:

- Delegate Events: Use the delegation signature of `.on()` to only create a
  single event listener, even when listening on hundreds of elements.
- Unbind Event Listeners: Call `.off()` on bound events before dispensing with
  the DOM node.
- Detach instead of Hide: Use `.detach()` instead of `.hide()`. This keeps
  event listeners bound to the DOM node.
- Remove instead of Hide: Use `.remove()` instead of `.hide()`. This removes
  event listeners, which have to be re-bound when the element is placed back
  into the DOM. This is used both with caching the node and throwing it away.
- Use `sessionStorage`: Instead of storing the DOM node in memory, save it to
  sessionStorage, which is cleared when the session ends.


## Findings

The following table shows the average performance results of each option,
starting with the baseline case in the top left:

### Heap Snapshots

The following snapshots are averaged results run on fresh instances of Chrome
42.0.2311.90 (64-bit Linux) running in incognito mode with no add-ons.

The test was to load the page, and cycle twice through the series of six
"screens." Taking a heap snapshot in Chrome automatically forces garbage
collection.

|                     |   Hide   |  Detach  | Remove-Cache | Remove-Serialize | Remove-Forget |
|---------------------|----------|----------|--------------|------------------|---------------|
| Keep Listeners      |  8.27 MB |  8.60 MB |      X       |        X         |       X       |
| Unbind Listeners    | 75.60 MB | 75.60 MB |     75.63 MB |          4.80 MB |       4.80 MB |
| Delegate and Keep   |  3.73 MB |  3.60 MB |      X       |        X         |       X       |
| Delegate and Unbind |  3.70 MB |  3.90 MB |      3.90 MB |          3.70 MB |       3.67 MB |


### Scripting Time

The following times (ms) represent the average scripting (JS) time of each
approach.

The test is the same as above, except garbage collection is manually forced
before ending the timer.

|                     |   Hide   |  Detach  | Remove-Cache | Remove-Serialize | Remove-Forget |
|---------------------|----------|----------|--------------|------------------|---------------|
| Keep Listeners      |  137.015 |  298.474 |      X       |        X         |       X       |
| Unbind Listeners    |  681.155 |  781.170 |      674.370 |          815.247 |       824.778 |
| Delegate and Keep   |   48.689 |  203.603 |      X       |        X         |       X       |
| Delegate and Unbind |   53.388 |  213.470 |      229.616 |          252.217 |       236.309 |

### Rendering Time

The following times (ms) represent the average browser rendering (calculation)
time of each approach.

|                     |   Hide   |  Detach  | Remove-Cache | Remove-Serialize | Remove-Forget |
|---------------------|----------|----------|--------------|------------------|---------------|
| Keep Listeners      |  358.863 |  183.565 |      X       |        X         |       X       |
| Unbind Listeners    |  385.125 |  187.757 |      195.731 |          184.802 |       186.129 |
| Delegate and Keep   |  371.495 |  182.486 |      X       |        X         |       X       |
| Delegate and Unbind |  363.224 |  186.383 |      186.737 |          184.507 |       181.084 |

### Scripting + Render

The total time for scripting and rendering. Paint time is nearly identical between all of the options, with only about a 7 ms difference between fastest and slowest paints.

|                     |   Hide   |  Detach  | Remove-Cache | Remove-Serialize | Remove-Forget |
|---------------------|----------|----------|--------------|------------------|---------------|
| Keep Listeners      |  495.878 |  482.039 |      X       |        X         |       X       |
| Unbind Listeners    | 1066.280 |  968.927 |      870.101 |         1000.049 |      1010.907 |
| Delegate and Keep   |  420.184 |  386.089 |      X       |        X         |       X       |
| Delegate and Unbind |  416.612 |  399.853 |      416.353 |          436.724 |       417.393 |

> Note: the remove-serialization options add an additional 22ms loading time
from sessionStorage.


### Notes

- `.remove()` automatically unbinds events and data from the affected node, so
  there are no tests for keeping listeners when calling `.remove()`.
- Serializing the node into sessionStorage or forgetting it completely negates
  the reason for using `detach()` (which is to keep events bound), so we do not
  test that case,

## Conclusion

First of all, there's something strange going on with unbinding events. We see
this in both timing and heap size when either explicitly calling `.off()` or
implicitly unbinding with `.remove()` (though the heap penalty only occurs if
we keep the removed node in memory). This behavior could be due to an
optimization in jQuery that improves the performance of unbinding delegated
events, or an optimization in V8 that fails in the case of unbinding many
hundreds of events. These results hold in both jQuery 1.8.3 and 1.11.2.

In any case, that result is counter-intuitive, and so I can't recommend going
through the effort of unbinding events before removing DOM nodes.

However, a great deal of benefit is accrued by using delegated event handlers
instead of attaching events directly on elements. In all cases, it improves
both the size of retained memory as well as processing speed

Beyond event delegation, there seems to be a slight performance gain in using
the `.detach()` method over `.hide()`. While it's almost negligible in this
example in Chrome, I would expect the benefit to be greater in other browsers,
as well in applications which inflict a greater deal of layout thrashing on the
DOM (thereby making the rendering soeed component all that more important).

## Appendix 1: All Timing Averages

The following data represents the average time each example spent in each
category.

### detach-dom-delegate-drop-listeners
213.470 ms Scripting
186.383 ms Rendering
44.806 ms Painting
61.956 ms Other

### detach-dom-delegate-keep-listeners
203.603 ms Scripting
182.586 ms Rendering
43.433 ms Painting
61.896 ms Other

### detach-dom-drop-listeners
781.170 ms Scripting
187.757 ms Rendering
44.127 ms Painting
75.966 ms Other

### detach-dom-keep-listeners
298.474 ms Scripting
183.565 ms Rendering
44.637 ms Painting
62.802 ms Other

### hide-dom-delegate-drop-listeners
53.388 ms Scripting
363.224 ms Rendering
46.250 ms Painting
68.047 ms Other

### hide-dom-delegate-keep-listeners
48.689 ms Scripting
371.495 ms Rendering
49.270 ms Painting
67.073 ms Other

### hide-dom-drop-listeners
681.155 ms Scripting
385.125 ms Rendering
50.294 ms Painting
69.783 ms Other

### hide-dom-keep-listeners
137.015 ms Scripting
358.863 ms Rendering
47.241 ms Painting
68.901 ms Other

### remove-dom
824.778 ms Scripting
186.129 ms Rendering
44.916 ms Painting
66.279 ms Other

### remove-dom-cache
674.370 ms Scripting
195.731 ms Rendering
47.871 ms Painting
69.543 ms Other

### remove-dom-delegate
236.309 ms Scripting
181.084 ms Rendering
44.216 ms Painting
66.055 ms Other

### remove-dom-delegate-cache
229.616 ms Scripting
186.737 ms Rendering
44.923 ms Painting
58.108 ms Other

### remove-dom-delegate-serialize
22.643 ms Loading
252.217 ms Scripting
184.507 ms Rendering
45.414 ms Painting
59.765 ms Other

### remove-dom-serialize
21.607 ms Loading
815.247 ms Scripting
184.802 ms Rendering
44.201 ms Painting
65.96 ms Other

