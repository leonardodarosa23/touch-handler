# touch-handler
Just a small class to handle touch actions to emulate mobile behavior

# Usage example with Vue 3 composition API:

```js
<script>
import TouchHandler from "@/libs/TouchHandler";

onMounted(() => {
  // Set touch actions
  TouchHandler.onSwipe('#page-container', (handler) => {
    if (handler.isSwipeRight() && !handler.isSwipeEdge()) {
      router.push({name: 'home'});
    }
  })
  TouchHandler.onSwipe('#app', (handler) => {
    if (handler.isSwipeUp() && handler.isSwipeEdge()) {
      router.push({ name: 'setup-create' })
    }
  })
})
onUnmounted(() => {
  TouchHandler.remove('#page-container')
  TouchHandler.remove('#app')
})

</script>
```
