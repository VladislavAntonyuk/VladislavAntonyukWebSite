Hello!

In this article, we will talk about bottom sheets. Bottom sheets are surfaces containing supplementary content and are anchored to the bottom of the screen.

> *You may have already seen similar articles where the implementation is based on AbsoluteLayout or Grid. Those implementations work great. The purpose of this article is to propose a different implementation using native controls.*

So let's start with creating a new .NET MAUI application.

For `Android` we'll use `BottomSheetDialog`. It is a base class for Dialogs styled as a bottom sheet. 

Create a new class `PageExtensions` in `Platforms\Android` folder with the next content:

```csharp
public static partial class PageExtensions
{
	public static void ShowBottomSheet(this Page page, IView bottomSheetContent, bool dimDismiss)
	{
		var bottomSheetDialog = new BottomSheetDialog(Platform.CurrentActivity?.Window?.DecorView.FindViewById(Android.Resource.Id.Content)?.RootView?.Context);
		bottomSheetDialog.SetContentView(bottomSheetContent.ToPlatform(page.Handler?.MauiContext ?? throw new Exception("MauiContext is null")));
		bottomSheetDialog.Behavior.Hideable = dimDismiss;
		bottomSheetDialog.Behavior.FitToContents = true;
		bottomSheetDialog.Show();
	}
}
```

For `iOS/MacCatalyst` we'll use `UISheetPresentationController`. It is a presentation controller that manages the appearance and behavior of a sheet. It is available since iOS 15.
Create a new class `PageExtensions` in `Platforms\iOS` folder or `Platforms\MacCatalyst` folder respectively with the next content:

```csharp
public static partial class PageExtensions
{
	public static void ShowBottomSheet(this Page page, IView bottomSheetContent, bool dimDismiss)
	{
		var mauiContext = page.Handler?.MauiContext ?? throw new Exception("MauiContext is null");
		var viewController = page.ToUIViewController(mauiContext);
		var viewControllerToPresent = bottomSheetContent.ToUIViewController(mauiContext);

		var sheet = viewControllerToPresent.SheetPresentationController;
		if (sheet is not null)
		{
			sheet.Detents = new[]
			{
				UISheetPresentationControllerDetent.CreateMediumDetent(),
				UISheetPresentationControllerDetent.CreateLargeDetent(),
			};
			sheet.LargestUndimmedDetentIdentifier = dimDismiss ? UISheetPresentationControllerDetentIdentifier.Unknown : UISheetPresentationControllerDetentIdentifier.Medium;
			sheet.PrefersScrollingExpandsWhenScrolledToEdge = false;
			sheet.PrefersEdgeAttachedInCompactHeight = true;
			sheet.WidthFollowsPreferredContentSizeWhenEdgeAttached = true;
		}

		viewController.PresentViewController(viewControllerToPresent, animated: true, null);
	}
}
```

Apple implementation provides more customization for a bottom sheet like a different size, dimming the background, user interaction, etc.

To display the bottom sheet alert call it on any `Page`:

```csharp
this.ShowBottomSheet(GetMyBottomSheetContent(), true);
```

where `GetMyBottomSheetContent` returns any view that you want to display on the bottom sheet.

That's it. As a result, you should receive such app:

![iOS BottomSheet](https://ik.imagekit.io/VladislavAntonyuk/vladislavantonyuk/articles/26/result.png)

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/BottomSheet){target="_blank"}.

Happy coding!