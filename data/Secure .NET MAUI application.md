If you are developing secure mobile applications like Bank apps or Health apps you probably want to safeguard their content on non-secure displays (on minimizing or on screenshot capture).

Likely both Android and iOS/MacCatalyst allow us to protect our apps.

Let's start with `Android`.

Android uses the mechanism of flags which can be set to Window.

We need a flag called `FLAG_SECURE`. `FLAG_SECURE` can be placed on a Window to indicate that the contents of this Window don’t want to be recorded.

From theory to practice.

To achieve the result we need to override 2 methods in `MainActivity`:
```csharp
protected override void OnResume()
{
	Window?.ClearFlags(WindowManagerFlags.Secure);
	base.OnResume();
}

protected override void OnPause()
{
	Window?.SetFlags(WindowManagerFlags.Secure, WindowManagerFlags.Secure);
	base.OnPause();
}
```

We set the flag when our application is paused and remove the flag when it becomes active.

On `iOS/MacCatalyst` the idea is similar.

We need to add a subview to our KeyWindow. It can be any UIView. In this sample to make it similar to the Android implementation let's use UIVisualEffectView with the Blur effect.

```csharp
public override void OnResignActivation(UIApplication application)
{
	var keyWindow = GetKeyWindow(application);
	if (keyWindow is null)
	{
		return;
	}

	var blurEffect = UIBlurEffect.FromStyle(UIBlurEffectStyle.Dark);
	var blurEffectView = new UIVisualEffectView(blurEffect)
	{
		Frame = keyWindow.Subviews[0].Bounds,
		AutoresizingMask = UIViewAutoresizing.FlexibleDimensions,
		Tag = 12
	};
	keyWindow.AddSubview(blurEffectView);
	base.OnResignActivation(application);
}

public override void OnActivated(UIApplication uiApplication)
{
	var keyWindow = GetKeyWindow(uiApplication);
	if (keyWindow is null)
	{
		return;
	}

	foreach (var subView in keyWindow.Subviews)
	{
		if (subView.Tag == 12)
		{
			subView.RemoveFromSuperview();
		}
	}

	base.OnActivated(uiApplication);
}

private static UIWindow? GetKeyWindow(UIApplication uiApplication)
{
	return uiApplication.ConnectedScenes.ToArray()
	                    .Select(x => x as UIWindowScene)
	                    .FirstOrDefault()?
	                    .Windows.FirstOrDefault(x => x.IsKeyWindow);
}
```

We add the overlay view on resign activation and remove it on the app activated.

As a result, you should receive such app:

![Android secure](https://ik.imagekit.io/VladislavAntonyuk//vladislavantonyuk/articles/24/dotnet-maui-bank-secure-android.gif)

The full code can be found on [GitHub](https://github.com/VladislavAntonyuk/MauiSamples/tree/main/MauiBank){target="_blank"}.

Happy coding!