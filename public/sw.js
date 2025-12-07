self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json()
    
    // self.registration.showNotification is key here
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: '/badge-72.png', 
        vibrate: [200, 100, 200],
        tag: 'planner-notification',
        renotify: true
      })
    )
  }
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(
    clients.openWindow('/')
  )
})
