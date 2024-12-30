Hello!

This article demonstrates how to add drop functionality to easily move content from the operating system to the `.NET MAUI` application.

## Prepare the Interface ##

To enable drag and drop functionality in your `.NET MAUI` application, you need to prepare the user interface. You will need to add a control that will accept the content that is being dragged and dropped. The control that you add will depend on the type of application you are building. For example, if you are building a photo editing application, you might want to add a control that accepts image files. I am extending the `MauiPaint` application and will allow `JSON` files to drop on `Page` control.

```csharp
myPage.RegisterDrop(Handler.MauiContext, async stream =>
{
	await OpenFile(stream);
});
```

## Windows implementation ##

There are two main events that you need to handle:

- `DragOver`: This event is fired when content is dragged over the control. You can use this event to determine whether the file is valid and whether it should be accepted.

- `Drop`: This event is fired when the content is dropped onto the control. You can use this event to perform any necessary processing on the file.

```csharp
public static class DragDropHelper
{
	public static void RegisterDrop(UIElement element, Func<Stream, Task>? content)
	{
		element.AllowDrop = true;
		element.Drop += async (s, e) =>
		{
			if (e.DataView.Contains(StandardDataFormats.StorageItems))
			{
				var items = await e.DataView.GetStorageItemsAsync();
				foreach (var item in items)
				{
					if (item is StorageFile file)
					{
						if (content is not null)
						{
							var text = await FileIO.ReadTextAsync(file);
							var bytes = Encoding.Default.GetBytes(text);
							await content.Invoke(new MemoryStream(bytes));
						}
					}
				}
			}
		};
		element.DragOver += OnDragOver;
	}

	public static void UnRegisterDrop(UIElement element)
	{
		element.AllowDrop = false;
		element.DragOver -= OnDragOver;
	}

	private static async void OnDragOver(object sender, DragEventArgs e)
	{
		if (e.DataView.Contains(StandardDataFormats.StorageItems))
		{
			var deferral = e.GetDeferral();
			var extensions = new List<string> { ".json" };
			var isAllowed = false;
			var items = await e.DataView.GetStorageItemsAsync();
			foreach (var item in items)
			{
				if (item is StorageFile file && extensions.Contains(file.FileType))
				{
					isAllowed = true;
					break;
				}
			}

			e.AcceptedOperation = isAllowed ? DataPackageOperation.Copy : DataPackageOperation.None;
			deferral.Complete();
		}

		e.AcceptedOperation = DataPackageOperation.None;
	}
}
```

In this example, the event handler checks to see if the dragged data contains any storage items (files). Additionally filter items by file extension, allowing only `JSON` files. If all checks are passed, the `AcceptedOperation` property is set to `DataPackageOperation.Copy`, indicating that the file should be copied to the application's storage.

Once the file has been accepted, the Drop event handler retrieves the storage items from the `DataView` and checks to see if there are any `StorageFile` objects. Once the file has been retrieved, you can process it as necessary.

## MacCatalyst implementation ##

```csharp
public static class DragDropHelper
{
	public static void RegisterDragDrop(UIView view, Func<Stream, Task>? content)
	{
		var dropInteraction = new UIDropInteraction(new DropInteractionDelegate()
		{
			Content = content
		});
		view.AddInteraction(dropInteraction);
	}

	public static void UnRegisterDragDrop(UIView view)
	{
		var dropInteractions = view.Interactions.OfType<UIDropInteraction>();
		foreach (var interaction in dropInteractions)
		{
			view.RemoveInteraction(interaction);
		}
	}
}

class DropInteractionDelegate : UIDropInteractionDelegate
{
	public Func<Stream, Task>? Content { get; init; }

	public override UIDropProposal SessionDidUpdate(UIDropInteraction interaction, IUIDropSession session)
	{
		return new UIDropProposal(UIDropOperation.Copy);
	}

	public override void PerformDrop(UIDropInteraction interaction, IUIDropSession session)
	{
		foreach (var item in session.Items)
		{
			item.ItemProvider.LoadItem(UniformTypeIdentifiers.UTTypes.Json.Identifier, null, async (data, error) =>
			{
				if (data is NSUrl nsData && !string.IsNullOrEmpty(nsData.Path))
				{
					if (Content is not null)
					{
						var bytes = await File.ReadAllBytesAsync(nsData.Path);
						await Content.Invoke(new MemoryStream(bytes));
					}
				}
			});
		}
	}
}
```

Similar to the `Windows` implementation, add interaction to the `UIView` control. The `UIDropInteractionDelegate` is responsible for drop interactions for our control. `SessionDidUpdate` indicates that the file should be copied to the application's storage. The `PerformDrop` method loads items by the identifier (`JSON` in the sample) and then reads its content.

![Drag & Drop Windows](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/38/drag-drop-windows.gif)

## Extension methods

To simplify the syntax let's create extension methods:

```csharp
using Microsoft.Maui.Platform;

public static class DragDropExtensions
{
	public static void RegisterDrop(this IElement element, IMauiContext? mauiContext, Func<Stream, Task>? content)
	{
		ArgumentNullException.ThrowIfNull(mauiContext);
		var view = element.ToPlatform(mauiContext);
		DragDropHelper.RegisterDrop(view, content);
	}

	public static void UnRegisterDrop(this IElement element, IMauiContext? mauiContext)
	{
		ArgumentNullException.ThrowIfNull(mauiContext);
		var view = element.ToPlatform(mauiContext);
		DragDropHelper.UnRegisterDrop(view);
	}
}
```

## Conclusion ##

In this article, we have explored how to enable drag-and-drop functionality in `.NET MAUI` applications. By following these steps, you can create an intuitive and user-friendly interface for your application, allowing users to easily move files from their device's file system to your application.

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiPaint){target="_blank"}.