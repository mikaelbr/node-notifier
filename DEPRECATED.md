

## Output parsing from Notification Center in Mac OS X

The response will be given as an object. E.g., when running ```notifier.notify({list: "ALL"})```, this could be the response:
**Note: Deprecated as of version `3.0.0`.**

```
{ response:
   [ { GroupID: null,
       Title: 'Terminal',
       Subtitle: null,
       Message: 'Another message',
       'Delivered At': Wed Dec 12 2012 15:23:38 GMT+0100 (CET) },
     { GroupID: null,
       Title: 'Terminal',
       Subtitle: null,
       Message: 'Another message',
       'Delivered At': Wed Dec 12 2012 15:23:31 GMT+0100 (CET) },
     { GroupID: 2,
       Title: 'Terminal',
       Subtitle: null,
       Message: 'Testing',
       'Delivered At': Wed Dec 12 2012 15:22:41 GMT+0100 (CET) },
     { GroupID: 1,
       Title: 'Terminal',
       Subtitle: null,
       Message: 'Testing',
       'Delivered At': Wed Dec 12 2012 15:22:29 GMT+0100 (CET) } ],
  type: 'list' }

```

There are three different types:

- ```deliviered``` when a message is delivered.
- ```removed``` when all or one message is removed. If all messages are removed, the response property will have several elements.
- ```list``` when a list is presented. Even when doing ```list: 1```.

