Hello!

This article demonstrates how to add drag & drop functionality to easily move content from the `.NET MAUI` application to the operating system.

## Prepare the Interface ##

To enable drag and drop functionality in your `.NET MAUI` application, you need to prepare the user interface. You will need to add a control that will contain a source content that is being dragged and dropped. The control that you add will depend on the type of application you are building. For example, if you are building a photo editing application, you might want to add a control that drags and drops drawing image to the file system. I am extending the `MauiPaint` application and will allow the drawing image to drop on dekstop.

```csharp
myImage.RegisterDrag(Handler.MauiContext, ImageSource.Stream);
```

## Windows implementation ##

```csharp
public static class DragDropHelper
{
	public static void RegisterDrag(UIElement element, Func<CancellationToken, Task<Stream>> content)
	{
		element.CanDrag = true;
		element.DragStarting += async (s, e) =>
		{
			var stream = await content.Invoke(CancellationToken.None);
			var storageFile = await CreateStorageFile(stream);
			e.Data.SetStorageItems(new List<IStorageItem>()
			{
				storageFile
			});
		};
	}
	
	public static void UnRegisterDrag(UIElement element)
	{
		element.CanDrag = false;
	}

    private static IAsyncOperation<StorageFile> CreateStorageFile(Stream imageStream)
	{
		var filename = "SampleImage.jpg";
		return StorageFile.CreateStreamedFileAsync(filename, async stream => await StreamDataRequestedAsync(stream, imageStream), null);
	}

	private static async Task StreamDataRequestedAsync(StreamedFileDataRequest request, Stream imageDataStream)
	{
		try
		{
			await using (var outputStream = request.AsStreamForWrite())
			{
				await imageDataStream.CopyToAsync(outputStream);
				await outputStream.FlushAsync();
			}
			request.Dispose();
		}
		catch (Exception ex)
		{
			Debug.WriteLine(ex.Message);
			request.FailAndClose(StreamedFileFailureMode.Incomplete);
		}
	}
}
```

In this example, the event handler creates a `StorageFile` from the image stream and adds it to the event data storage items collection. As soon as you drop the item, it will be copied to the new place.

## MacCatalyst implementation ##

```csharp
public static class DragDropHelper
{
	public static void RegisterDrag(UIView view, Func<CancellationToken, Task<Stream>> content)
	{
		var dragInteraction = new UIDragInteraction(new DragInteractionDelegate()
		{
			Content = content
		});
		view.AddInteraction(dragInteraction);
	}

	public static void UnRegisterDrag(UIView view)
	{
		var dragInteractions = view.Interactions.OfType<UIDragInteraction>();
		foreach (var interaction in dragInteractions)
		{
			view.RemoveInteraction(interaction);
		}
	}
}

class DragInteractionDelegate : UIDragInteractionDelegate
{
	public Func<CancellationToken, Task<Stream>>? Content { get; init; }

	public override UIDragItem[] GetItemsForBeginningSession(UIDragInteraction interaction, IUIDragSession session)
	{
		if (Content is null)
		{
			return Array.Empty<UIDragItem>();
		}

		var streamContent = Content.Invoke(CancellationToken.None).GetAwaiter().GetResult();
		var itemProvider = new NSItemProvider(NSData.FromStream(streamContent), UniformTypeIdentifiers.UTTypes.Png.Identifier);
		var dragItem = new UIDragItem(itemProvider);
		return new[] { dragItem };
	}
}

```

Similar to the `Windows` implementation, add interaction to the `UIView` control. The `UIDragInteractionDelegate` is responsible for drag interactions for our control. `GetItemsForBeginningSession` returns the collection of drag items.

![Drag & Drop MacCatalyst](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/42/drag-drop-mac.gif)

## Extension methods

To simplify the syntax let's create extension methods:

```csharp
using Microsoft.Maui.Platform;

public static class DragDropExtensions
{
	public static void RegisterDrag(this IElement element, IMauiContext? mauiContext, Func<CancellationToken, Task<Stream>> content)
	{
		ArgumentNullException.ThrowIfNull(mauiContext);
		var view = element.ToPlatform(mauiContext);
		DragDropHelper.RegisterDrag(view, content);
	}

	public static void UnRegisterDrag(this IElement element, IMauiContext? mauiContext)
	{
		ArgumentNullException.ThrowIfNull(mauiContext);
		var view = element.ToPlatform(mauiContext);
		DragDropHelper.UnRegisterDrag(view);
	}
}
```

## Conclusion ##

In this article, we have explored how to enable drag-and-drop functionality in `.NET MAUI` applications. By following these steps, you can create an intuitive and user-friendly interface for your application, allowing users to easily move files from your application to their device's file system.

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiPaint){target="_blank"}.